// Hand the buyer's own workbook back with the answers written into its answer cells.
//
// The engine knows where each answer belongs (`question.location.answerCell`, found by
// header, by the shaded box beside the question, or by the user) and can write into the
// original file changing nothing else (`writeAnswersIntoWorkbook`). This module decides
// WHICH drafts go in, because not every draft is an answer the supplier should sign:
//
//   - a draft the engine could stand behind (high / medium) goes in
//   - a draft the user edited, or marked N/A with a reason, goes in — they decided
//   - a low or absent draft stays BLANK in the buyer's file. The engine emits text for
//     these ("this information is not currently tracked"), and writing that into a
//     customer's form unasked is exactly the overclaim the product refuses. The cell is
//     left for the user; the report says how many.
//   - a cell the buyer pre-filled is never overwritten; the writer refuses and we report it
//
// Only spreadsheets can come back this way (a PDF has no cells), and only while the
// original bytes are still in memory — they are never stored.

const SPREADSHEET = /\.(xlsx|xlsm)$/i;

export function canReturnOriginal(file, questions) {
  if (!file || !SPREADSHEET.test(file.name || '')) return false;
  return (questions || []).some(q => q.location?.answerCell);
}

function answerText(draft) {
  return String(draft.verifiedAnswer || draft.answer || '').trim();
}

// `_edited` and `_markedNA` are Respond's own flags: the user typed the answer, or marked
// the question not applicable with a reason. Both are decisions, not drafts.
function shouldWrite(draft) {
  if (!draft) return false;
  if (draft._edited || draft._markedNA) return true;
  return draft.answerConfidence === 'high' || draft.answerConfidence === 'medium';
}

/**
 * Turn drafts into writes for the engine, one per answer cell the question has.
 * Returns the writes and the counts the user is told: how many questions had no
 * cell to write into, and how many were left blank for them.
 */
export function buildOriginalWrites(questions, drafts) {
  const byId = new Map((questions || []).map(q => [q.id, q]));
  const writes = [];
  let leftBlank = 0;
  let noCell = 0;
  for (const draft of drafts || []) {
    const q = byId.get(draft.questionId);
    if (!q) continue;
    const cells = [q.location, ...(q.locations || [])].filter(l => l?.answerCell);
    if (cells.length === 0) { noCell += 1; continue; }
    if (!shouldWrite(draft)) { leftBlank += 1; continue; }
    const value = answerText(draft);
    if (!value) { leftBlank += 1; continue; }
    for (const loc of cells) writes.push({ sheet: loc.sheet, cell: loc.answerCell, value });
  }
  return { writes, leftBlank, noCell };
}

/**
 * Write the answers into the original file and hand back the bytes plus what happened.
 * `engine` is the response-ready module (lazy-loaded by the caller, like the rest).
 */
export async function fillOriginalWorkbook({ file, questions, drafts, engine }) {
  const { writes, leftBlank, noCell } = buildOriginalWrites(questions, drafts);
  const original = new Uint8Array(await file.arrayBuffer());
  const { bytes, report } = await engine.writeAnswersIntoWorkbook(original, writes);
  const kept = report.refused.filter(r => r.reason === 'non-empty').length;
  const formulaCells = report.refused.filter(r => r.reason === 'formula').length;
  return {
    bytes,
    fileName: engine.completedFileName(file.name),
    written: report.written.length,
    leftBlank,
    noCell,
    kept,
    formulaCells,
    recalcOnOpen: report.recalcOnOpen,
  };
}

/**
 * Is a freshly parsed file the questionnaire on this page? The page holds the CONFIRMED
 * list — the user may have unticked junk rows at the confirm step, and the thin-parse
 * warning tells them to — so the fresh, full parse is a superset, never an exact match.
 * The test is: every confirmed question is in the file. A different buyer's form fails
 * it; the same form with its instruction rows still in passes it.
 */
export function originalMatchesQuestionnaire(freshQuestions, confirmedQuestions) {
  const norm = t => String(t || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
  const fresh = new Set((freshQuestions || []).map(q => norm(q.text)));
  const confirmed = (confirmedQuestions || []).map(q => norm(q.text)).filter(Boolean);
  if (confirmed.length === 0 || fresh.size === 0) return false;
  return confirmed.every(t => fresh.has(t));
}

/** One plain sentence for the confirm step: where the answers will go. */
export function describeAnswerPlacement(questions) {
  const located = (questions || []).filter(q => q.location?.answerCell);
  if (located.length === 0) return { kind: 'none', count: 0, total: (questions || []).length };
  const sources = new Set(located.map(q => q.answerCellSource));
  const columns = [...new Set(located.map(q => q.location.answerCell.replace(/\d+$/, '')))].sort();
  const kind = sources.has('header') && sources.size === 1 ? 'column'
    : sources.has('style') ? 'boxes'
      : 'column';
  return { kind, count: located.length, total: (questions || []).length, columns };
}

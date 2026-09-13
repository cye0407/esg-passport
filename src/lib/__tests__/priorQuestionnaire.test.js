// @vitest-environment node
// (jsdom's Blob has no arrayBuffer(), and the parser needs one; this test needs no DOM.)
import { describe, expect, it } from 'vitest';
import * as mod from 'response-ready';
import { esgDomainPack } from 'response-ready/domain-packs/esg';
import ExcelJS from 'exceljs';
import { priorApi, readPriorQuestionnaire, recoverAnswers, rejectRecovered, summarizeRecovery } from '../priorQuestionnaire';
import { summarizeCoverage } from '../coverage';

// The app's edge of previous-answer reuse, run against the real engine: a completed
// questionnaire read in, its answers placed on the drafts in Respond's shape, and taken
// back again. The matching rules themselves are tested in the engine.

const BOX = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
const engine = priorApi(mod.createResponseEngine(esgDomainPack), mod);

async function completedLastYear() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Questionnaire');
  ws.getRow(1).values = ['Question', 'Answer'];
  const rows = [
    ['Do you have a written environmental policy?', 'Yes'],
    ['Total electricity consumption last year (kWh)', 2363000],
    ['Do you have a supplier code of conduct?', 'Yes'],
    ['Any further comments you wish to provide', ''],
  ];
  rows.forEach(([q, a], i) => {
    ws.getCell(`A${i + 2}`).value = q;
    ws.getCell(`B${i + 2}`).fill = BOX;
    if (a !== '') ws.getCell(`B${i + 2}`).value = a;
  });
  const buf = await wb.xlsx.writeBuffer();
  // jsdom's File wants plain bytes, not a Node Buffer.
  return new File([new Uint8Array(buf)], 'nordhavn-2025.xlsx');
}

const question = (id, text) => ({ id, text, rawRow: {}, rowIndex: 0 });
const draft = (questionId, answer, answerConfidence) => ({
  questionId, questionText: questionId, answer, answerConfidence, confidenceSource: 'drafted',
  verifiedAnswer: answer, draftAnswer: answer, supportLevel: 'draft', dataCoverage: 'missing',
  matchResult: {}, dataContext: {}, evidence: '', metricKeysUsed: [], needsReview: true, isEstimate: false, isDrafted: true, hasDataGaps: true,
});

describe('readPriorQuestionnaire', () => {
  it('reads the answered rows of a completed spreadsheet as approved prior answers', async () => {
    const read = await readPriorQuestionnaire(engine, await completedLastYear(), { sourceDate: '2025-09-30' });
    expect(read.ok).toBe(true);
    expect(read.questions).toBe(4);
    expect(read.priors).toHaveLength(3);
    expect(read.priors[0]).toMatchObject({ question: 'Do you have a written environmental policy?', answer: 'Yes', sourceFile: 'nordhavn-2025.xlsx', sourceRow: 2, approved: true });
  });

  it('reports a file it cannot read answers from, rather than pretending', async () => {
    const read = await readPriorQuestionnaire(engine, new File([new TextEncoder().encode('not a workbook')], 'notes.xlsx'));
    expect(read.ok).toBe(false);
    expect(read.priors).toEqual([]);
  });
});

describe('recoverAnswers', () => {
  it('places recovered answers in Respond\'s shape, keeps the draft underneath, and counts the flagged ones', async () => {
    const { priors } = await readPriorQuestionnaire(engine, await completedLastYear(), { sourceDate: '2025-09-30' });
    const questions = [
      question('q1', 'Do you have a written environmental policy?'),
      question('q2', 'Total electricity consumption last year (kWh)'),
      question('q3', 'Describe your biodiversity strategy.'),
    ];
    const drafts = [
      draft('q1', 'A formal environmental policy has not yet been established.', 'medium'),
      draft('q2', 'This information is not currently tracked.', 'none'),
      draft('q3', 'This information is not currently tracked.', 'none'),
    ];
    const result = recoverAnswers(engine, questions, drafts, priors, { reportingYear: 2026 });
    expect(result.recovered).toBe(2);
    // both: the "Yes" was given for a different reporting year, the figure is a figure
    expect(result.flagged).toBe(2);
    const [a, b, c] = result.drafts;
    expect(a).toMatchObject({ answer: 'Yes', verifiedAnswer: 'Yes', draftAnswer: null, supportLevel: 'supported', source: 'previous', answerConfidence: 'medium', staleness: 'check-period' });
    expect(a._beforeRecovery.answer).toBe('A formal environmental policy has not yet been established.');
    expect(a.sourceRef).toMatchObject({ file: 'nordhavn-2025.xlsx', row: 2 });
    expect(b).toMatchObject({ answer: '2363000', staleness: 'check-figures', answerConfidence: 'medium' });
    expect(c.source).toBeUndefined();
  });

  it('does not offer a suggestion the user already declined', async () => {
    const { priors } = await readPriorQuestionnaire(engine, await completedLastYear());
    const questions = [question('q1', 'Do you have a written environmental policy?')];
    const drafts = [draft('q1', 'not established', 'medium')];
    const first = recoverAnswers(engine, questions, drafts, priors);
    const { draft: restored, rejectedKey } = rejectRecovered(first.drafts[0]);
    expect(restored.answer).toBe('not established');
    expect(restored.source).toBeUndefined();
    const again = recoverAnswers(engine, questions, [restored], priors, { rejected: new Set([rejectedKey]) });
    expect(again.recovered).toBe(0);
  });

  it('is a no-op to reject a draft that was not recovered', () => {
    const d = draft('q9', 'x', 'high');
    expect(rejectRecovered(d)).toEqual({ draft: d, rejectedKey: null });
    expect(summarizeRecovery([d])).toEqual({ recovered: 0, flagged: 0 });
  });
});

describe('coverage with recovered answers', () => {
  it('reports recovered as its own first group and still partitions the questionnaire', async () => {
    const { priors } = await readPriorQuestionnaire(engine, await completedLastYear());
    const questions = [question('q1', 'Do you have a written environmental policy?'), question('q2', 'Total electricity consumption last year (kWh)'), question('q3', 'Describe your biodiversity strategy.')];
    const drafts = [draft('q1', 'x', 'medium'), draft('q2', 'y', 'high'), draft('q3', 'z', 'none')];
    const { drafts: recovered } = recoverAnswers(engine, questions, drafts, priors);
    const c = summarizeCoverage(recovered);
    expect(c.recovered).toHaveLength(2);
    expect(c.recoveredFlagged).toBe(1);
    expect(c.recovered.length + c.fromRecords.length + c.partial.length + c.written.length + c.unanswerable.length).toBe(c.total);
    expect(c.recovered[0]).toMatchObject({ source: 'previous', sourceRef: { file: 'nordhavn-2025.xlsx' } });
  });
});

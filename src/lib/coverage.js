// The coverage report: what this questionnaire needs, measured against what the user
// actually has. See COVERAGE-REPORT-SPEC.md.
//
// This is a VIEW over drafts the response engine has already produced, not a second
// engine. Every number here is a count of drafts in a confidence band, plus a join
// (coverageFieldMap) that names the document which would move a question up a band.
//
// The honesty rules are not negotiable and they live here:
//   - counts describe what the record supports, never a readiness score, a pass
//     likelihood, or a predicted buyer outcome
//   - anything below medium confidence is reported as unanswered, even though the
//     engine emitted text for it. Presenting a weak draft as an answer is how a
//     supplier ends up signing something that is not true.
//   - a document is only named when the map knows a real field it would fill
import { rowForLabel } from './coverageFieldMap';
import { matchBuilderId } from '@/data/policyBuilders';

/** A value the workspace actually holds. Zero is a figure; undefined is a gap. */
function isPresent(value) {
  return value !== undefined && value !== null && value !== '';
}

/**
 * Which of a draft's suggested data points are still missing from the workspace,
 * as map rows. Labels with no row are skipped: we cannot name a document for them.
 */
function missingRowsFor(draft, companyData) {
  const labels = draft?.matchResult?.suggestedDataPoints || [];
  const rows = [];
  for (const label of labels) {
    const row = rowForLabel(label);
    if (!row) continue;
    const satisfied = row.companyDataKeys.some(key => isPresent(companyData?.[key]));
    if (!satisfied) rows.push(row);
  }
  return rows;
}

/** The document a figure came out of, if extraction or the user recorded one. */
function documentFor(draft, dataSources) {
  if (!dataSources) return null;
  const labels = draft?.matchResult?.suggestedDataPoints || [];
  for (const label of labels) {
    const row = rowForLabel(label);
    if (!row) continue;
    for (const field of row.storeFields) {
      if (dataSources[field]) return dataSources[field];
    }
  }
  return null;
}

/**
 * A policy question this workspace cannot answer because the document does not exist,
 * AND which one of the nine guided builders would actually write.
 *
 * A question no builder covers is not counted. The report quotes this number back to
 * the buyer as the reason to pay 499 rather than 99, so counting a question we could
 * not in fact help with would be a fake door with a price on it.
 */
function policyBuilderFor(draft) {
  if (draft?.questionType !== 'POLICY') return null;
  // 'drafted' is the engine saying it wrote this from nothing on record - i.e. the
  // policy is missing, not merely unmatched.
  if (draft?.confidenceSource !== 'drafted') return null;
  return matchBuilderId(`${draft.questionText || ''} ${draft.category || ''}`);
}

function summarize(draft, dataSources) {
  return {
    questionId: draft.questionId,
    questionText: draft.questionText,
    answer: draft.answer,
    value: draft.dataValue,
    unit: draft.dataUnit,
    period: draft.dataPeriod,
    document: documentFor(draft, dataSources),
  };
}

/**
 * Group a questionnaire's drafts into the three things a supplier needs to know.
 *
 * @param {Array} drafts        answer drafts from the response engine
 * @param {Object} options
 * @param {Object} options.companyData   dataBridge.buildCompanyData() output
 * @param {Object} options.dataSources   settings.dataSources — field path → document name
 * @returns {{
 *   total: number,
 *   fromRecords: Array, written: Array, unanswerable: Array,
 *   missingDocuments: Array<{document: string, unlocks: number}>,
 *   policyGaps: {questions: number, builders: string[]}
 * }}
 */
export function summarizeCoverage(drafts, { companyData = {}, dataSources = {} } = {}) {
  const list = Array.isArray(drafts) ? drafts : [];
  const fromRecords = [];
  const written = [];
  const unanswerable = [];

  // Questions per document, counted once each however many of its fields they want.
  const unlocksByDocument = new Map();
  const policyBuilders = new Set();
  let policyQuestions = 0;

  for (const draft of list) {
    const builder = policyBuilderFor(draft);
    if (builder) {
      policyQuestions += 1;
      policyBuilders.add(builder);
    }

    const confidence = draft?.answerConfidence;
    if (confidence === 'high') {
      fromRecords.push(summarize(draft, dataSources));
      continue;
    }
    if (confidence === 'medium') {
      written.push(summarize(draft, dataSources));
    } else {
      // low, none, unknown, absent — all reported as "we can't answer this".
      unanswerable.push(summarize(draft, dataSources));
    }
    const documents = new Set(missingRowsFor(draft, companyData).map(row => row.document));
    for (const document of documents) {
      unlocksByDocument.set(document, (unlocksByDocument.get(document) || 0) + 1);
    }
  }

  const missingDocuments = [...unlocksByDocument.entries()]
    .map(([document, unlocks]) => ({ document, unlocks }))
    // Most answers first; ties by name so the order is stable between runs.
    .sort((a, b) => b.unlocks - a.unlocks || a.document.localeCompare(b.document));

  return {
    total: list.length,
    fromRecords,
    written,
    unanswerable,
    missingDocuments,
    // questions: how many the buyer is being asked. builders: how many documents
    // actually have to be written to cover them. They are different numbers and the
    // copy must not conflate them.
    policyGaps: { questions: policyQuestions, builders: [...policyBuilders].sort() },
  };
}

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
import { rowForLabel, COVERAGE_FIELD_MAP } from './coverageFieldMap';
import { matchBuilderId } from '@/data/policyBuilders';
import { TOPIC_ORDER, topicForDomain } from './coverageTopics';

/** A value the workspace actually holds. Zero is a figure; undefined is a gap. */
function isPresent(value) {
  return value !== undefined && value !== null && value !== '';
}

/**
 * A value can exist without answering an annual question. Flow metrics from one bill
 * are deliberately kept as gaps until all twelve monthly periods are represented.
 * Snapshot/rate metrics have no dataCoverage entry and remain satisfied by a real
 * recorded value (including zero).
 */
export function companyDataKeyIsCovered(companyData, key) {
  if (!isPresent(companyData?.[key])) return false;
  const coverage = companyData?.dataCoverage?.[key];
  return coverage ? coverage.complete === true : true;
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
    const satisfied = row.companyDataKeys.some(key => companyDataKeyIsCovered(companyData, key));
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
/**
 * Whether the workspace holds anything of the user's at all.
 *
 * This decides how the middle group may be described. The engine composes those answers
 * from the ESG template library, so they exist whether or not the user has told us
 * anything — someone who uploads nothing still gets most of the questionnaire "written".
 * Calling that "written from what you told us about your business" when they have told us
 * nothing is the misleading half of a true number, and the spec flagged it before it was
 * built.
 */
export function hasOwnData(companyData) {
  return COVERAGE_FIELD_MAP.some(row => row.companyDataKeys.some(key => isPresent(companyData?.[key])));
}

/** Recheck a stashed requirement against the workspace after a document was saved. */
export function remainingMissingDocuments(entries, companyData) {
  return (Array.isArray(entries) ? entries : []).filter(entry => {
    // Old session stashes did not carry requirements. Keep showing them rather than
    // guessing that an unrelated upload satisfied them.
    if (!Array.isArray(entry.requirements) || entry.requirements.length === 0) return true;
    return entry.requirements.some(requirement =>
      !(requirement.companyDataKeys || []).some(key => companyDataKeyIsCovered(companyData, key))
    );
  });
}

/**
 * The questionnaire grouped the way the customer asking it thinks - environmental,
 * social, governance, and what is really just company profile - with the documents that
 * would answer each group.
 *
 * Every count is a count of QUESTIONS, so the topic totals sum to the questionnaire. A
 * question wanting three documents is one question, not three.
 */
function summarizeTopics(list, companyData) {
  const byTopic = new Map(TOPIC_ORDER.map(topic => [topic, {
    topic,
    total: 0,
    fromRecords: 0,
    needsDocument: 0,
    needsPolicy: 0,
    documents: [],
    policies: [],
  }]));

  for (const draft of list) {
    const bucket = byTopic.get(topicForDomain(draft?.matchResult?.primaryDomain));
    bucket.total += 1;

    if (draft?.answerConfidence === 'high') {
      bucket.fromRecords += 1;
      // An answered question is not still asking for the document that answered it.
      continue;
    }

    const documents = new Set(missingRowsFor(draft, companyData).map(row => row.document));
    if (documents.size > 0) {
      bucket.needsDocument += 1;
      for (const document of documents) {
        if (!bucket.documents.includes(document)) bucket.documents.push(document);
      }
    }

    const builder = policyBuilderFor(draft);
    if (builder) {
      bucket.needsPolicy += 1;
      if (!bucket.policies.includes(builder)) bucket.policies.push(builder);
    }
  }

  // A topic this questionnaire never asks about is not a card with a zero on it.
  return TOPIC_ORDER.map(topic => byTopic.get(topic)).filter(bucket => bucket.total > 0);
}

export function summarizeCoverage(drafts, { companyData = {}, dataSources = {} } = {}) {
  const list = Array.isArray(drafts) ? drafts : [];
  const fromRecords = [];
  const written = [];
  const unanswerable = [];

  // Questions per document, counted once each however many of its fields they want.
  const unlocksByDocument = new Map();
  const requirementsByDocument = new Map();
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
      const requirements = requirementsByDocument.get(document) || [];
      for (const row of missingRowsFor(draft, companyData).filter(candidate => candidate.document === document)) {
        if (!requirements.some(item => item.label === row.label)) {
          requirements.push({ label: row.label, companyDataKeys: [...row.companyDataKeys] });
        }
      }
      requirementsByDocument.set(document, requirements);
    }
  }

  const missingDocuments = [...unlocksByDocument.entries()]
    .map(([document, unlocks]) => ({ document, unlocks, requirements: requirementsByDocument.get(document) || [] }))
    // Most answers first; ties by name so the order is stable between runs.
    .sort((a, b) => b.unlocks - a.unlocks || a.document.localeCompare(b.document));

  return {
    total: list.length,
    fromRecords,
    written,
    unanswerable,
    missingDocuments,
    // The questionnaire grouped by subject rather than by engine confidence.
    topics: summarizeTopics(list, companyData),
    // Lets the report describe the middle group honestly. See hasOwnData.
    hasOwnData: hasOwnData(companyData),
    // questions: how many the buyer is being asked. builders: how many documents
    // actually have to be written to cover them. They are different numbers and the
    // copy must not conflate them.
    policyGaps: { questions: policyQuestions, builders: [...policyBuilders].sort() },
  };
}

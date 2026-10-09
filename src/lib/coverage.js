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
import { sectionPlan } from './coverageSections';

/** A value the workspace actually holds. Zero is a figure; undefined is a gap. */
function isPresent(value) {
  return value !== undefined && value !== null && value !== '';
}

// A partial period is a figure the workspace HOLDS for fewer months than the year — one
// March bill standing in for twelve. A metric it holds nothing of at all is not a partial
// period, it is a missing document, and missingRowsFor already says so. Reading the
// zero-month entries here called a question answered by twelve electricity bills
// "partial · 0 of 12 months" because the bills carry no renewable share.
function rowCoverage(row, companyData) {
  const coverage = companyData?.dataCoverage || {};
  const entries = row.companyDataKeys
    .filter(key => isPresent(companyData?.[key]))
    .map(key => coverage[key])
    .filter(entry => entry && (entry.periods?.length || entry.monthsCovered));
  if (!entries.length) return null;
  const best = entries.sort((a, b) => (b.monthsCovered || 0) - (a.monthsCovered || 0))[0];
  return {
    monthsCovered: Number(best.monthsCovered || 0),
    expectedMonths: Number(best.expectedMonths || 12),
    complete: best.complete === true,
    periods: best.periods || [],
  };
}

function rowIsSatisfied(row, companyData) {
  const present = row.companyDataKeys.some(key => isPresent(companyData?.[key]));
  if (!present) return false;
  const coverage = rowCoverage(row, companyData);
  return !coverage || coverage.complete;
}

export function periodCoverageForDraft(draft, companyData) {
  const rows = (draft?.matchResult?.suggestedDataPoints || [])
    .map(rowForLabel)
    .filter(Boolean);
  const entries = rows.map(row => rowCoverage(row, companyData)).filter(Boolean);
  if (!entries.length) return null;
  return entries.sort((a, b) => (a.monthsCovered / a.expectedMonths) - (b.monthsCovered / b.expectedMonths))[0];
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
    const satisfied = rowIsSatisfied(row, companyData);
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

function summarize(draft, dataSources, companyData) {
  return {
    questionId: draft.questionId,
    questionText: draft.questionText,
    answer: draft.answer,
    value: draft.dataValue,
    unit: draft.dataUnit,
    period: draft.dataPeriod,
    document: documentFor(draft, dataSources),
    confidence: draft.answerConfidence,
    // From the question bank, when it routed the question: why the cell is what it is.
    answerState: draft.answerState,
    stateNote: draft.stateNote,
    wouldAnswer: draft.wouldAnswer,
    wouldAnswerByLanguage: draft.wouldAnswerByLanguage,
    legalBasis: draft.legalBasis,
    topic: topicForDomain(draft?.matchResult?.primaryDomain),
    dataCoverage: periodCoverageForDraft(draft, companyData),
    // Set when the answer came from a questionnaire the company already completed.
    source: draft.source,
    sourceRef: draft.sourceRef,
    sourceDate: draft.sourceDate,
    staleness: draft.staleness,
  };
}

export function selectBestCoverageAnswers(answers, limit = 5) {
  const candidates = (Array.isArray(answers) ? answers : [])
    .filter(answer => !answer.dataCoverage || answer.dataCoverage.complete)
    .map((answer, index) => ({
      answer,
      index,
      score: (answer.confidence === 'high' ? 100 : answer.confidence === 'medium' ? 50 : 0)
        + (isPresent(answer.value) ? 20 : 0)
        + (answer.document ? 10 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  // Two questions can receive the identical sentence (a KPI template answers both);
  // showing it twice as "your strongest two" reads as a bug, so the text is the identity.
  const selected = [];
  const topics = new Set();
  const texts = new Set();
  const take = (candidate) => {
    const text = String(candidate.answer.answer || '').trim();
    if (text && texts.has(text)) return false;
    selected.push(candidate.answer);
    topics.add(candidate.answer.topic);
    if (text) texts.add(text);
    return true;
  };
  for (const candidate of candidates) {
    if (selected.length >= limit) break;
    if (!topics.has(candidate.answer.topic)) take(candidate);
  }
  for (const candidate of candidates) {
    if (selected.length >= limit) break;
    if (!selected.includes(candidate.answer)) take(candidate);
  }
  return selected;
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
 *   recovered: Array, recoveredFlagged: number,
 *   fromRecords: Array, partial: Array, written: Array, unanswerable: Array,
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

/**
 * The questionnaire grouped the way the customer asking it thinks - environmental,
 * social, governance, and what is really just company profile - with the documents that
 * would answer each group.
 *
 * Every count is a count of QUESTIONS, so the topic totals sum to the questionnaire. A
 * question wanting three documents is one question, not three.
 */
function newBucket(topic, section = null) {
  return {
    topic,
    // The questionnaire's own name for this group, when the report is grouped that way.
    // null means this bucket is one of the four canonical topics.
    section,
    total: 0,
    recovered: 0,
    fromRecords: 0,
    partial: 0,
    written: 0,
    open: 0,
    needsDocument: 0,
    needsPolicy: 0,
    documents: [],
    policies: [],
    // The questions themselves, with where each stands — a count alone hid which
    // questions a document had just answered, so a card looked the same after an upload.
    questions: [],
  };
}

function addDraft(bucket, draft, companyData) {
  bucket.total += 1;
  const state = questionState(draft, companyData);
  bucket[state] += 1;
  bucket.questions.push({
    questionId: draft?.questionId,
    questionText: draft?.questionText,
    state,
    // What would answer it, in order of how sure we are: a document we know holds the
    // figure, a policy one of the guided builders writes, or the engine's own prompt.
    // Nothing listed means only the reader can answer it.
    needs: state === 'recovered' || state === 'fromRecords' ? null : {
      documents: missingRowsFor(draft, companyData).map(row => ({ document: row.document, label: row.label, labelDe: row.labelDe })),
      policy: policyBuilderFor(draft),
      // The bank names the document or figure that would answer it ("fuel and gas bills")
      // when no mapped document row does.
      prompt: draft?.promptForMissing || draft?.wouldAnswer || null,
      prompts: draft?.wouldAnswerByLanguage || null,
    },
  });

  if (state === 'recovered' || state === 'fromRecords') {
    // An answered question is not still asking for the document that answered it.
    return;
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

function summarizeTopics(list, companyData) {
  const byTopic = new Map(TOPIC_ORDER.map(topic => [topic, newBucket(topic)]));
  for (const draft of list) {
    addDraft(byTopic.get(topicForDomain(draft?.matchResult?.primaryDomain)), draft, companyData);
  }
  // A topic this questionnaire never asks about is not a card with a zero on it.
  return TOPIC_ORDER.map(topic => byTopic.get(topic)).filter(bucket => bucket.total > 0);
}

/**
 * The same questionnaire grouped by its OWN sections, or null when its labels are not a
 * usable partition (see coverageSections.js). This is additive: `topics` stays the
 * canonical four either way, because the company-information card and the manual-answer
 * list are about company-profile questions however the report is grouped.
 */
function summarizeSections(list, companyData, sheetOf) {
  const plan = sectionPlan(list, { sheetOf });
  if (!plan) return null;

  const bySection = new Map(plan.labels.map(label => [label, newBucket(null, label)]));
  // A question whose own label did not survive the usable-label check still has to be
  // counted — the totals must sum to the questionnaire — so it falls back to its
  // canonical topic, in a bucket added after the named sections.
  const spillover = new Map();
  const topicTally = new Map();

  for (const draft of list) {
    const label = plan.labelFor(draft);
    const topic = topicForDomain(draft?.matchResult?.primaryDomain);
    if (label) {
      const tally = topicTally.get(label) || new Map();
      tally.set(topic, (tally.get(topic) || 0) + 1);
      topicTally.set(label, tally);
      addDraft(bySection.get(label), draft, companyData);
    } else {
      if (!spillover.has(topic)) spillover.set(topic, newBucket(topic));
      addDraft(spillover.get(topic), draft, companyData);
    }
  }

  // A section card still needs an icon and the documents that usually answer its kind of
  // question, and both key off the canonical topic — so each section takes the topic
  // most of its questions belong to, ties going to reading order.
  for (const [label, tally] of topicTally) {
    const [topic] = [...tally.entries()]
      .sort((a, b) => b[1] - a[1] || TOPIC_ORDER.indexOf(a[0]) - TOPIC_ORDER.indexOf(b[0]))[0];
    bySection.get(label).topic = topic;
  }

  return [
    ...plan.labels.map(label => bySection.get(label)),
    ...TOPIC_ORDER.map(topic => spillover.get(topic)).filter(Boolean),
  ].filter(bucket => bucket.total > 0);
}

/** Where a question stands, in the same terms the report's groups use. */
function questionState(draft, companyData) {
  if (draft?.source === 'previous') return 'recovered';
  const confidence = draft?.answerConfidence;
  if (confidence === 'high') {
    return periodCoverageForDraft(draft, companyData)?.complete === false ? 'partial' : 'fromRecords';
  }
  if (confidence === 'medium') return 'written';
  return 'open';
}

export function summarizeCoverage(drafts, { companyData = {}, dataSources = {}, questions = [] } = {}) {
  const list = Array.isArray(drafts) ? drafts : [];
  // Which sheet each question sat on, so the sections view can tell a real section
  // label from the parser's sheet-name fallback (see coverageSections.js).
  const sheetById = new Map((Array.isArray(questions) ? questions : [])
    .filter(q => q?.id && q?.location?.sheet)
    .map(q => [q.id, q.location.sheet]));
  const sheetOf = draft => sheetById.get(draft?.questionId);
  const recovered = [];
  const fromRecords = [];
  const partial = [];
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

    // An answer recovered from a questionnaire the company already completed is its own
    // group, first: it is what the company actually said, with the file it came from. A
    // flagged one (a figure, a year, a different reporting period) is still recovered —
    // the flag travels with it and the report says how many carry one.
    if (draft?.source === 'previous') {
      recovered.push(summarize(draft, dataSources, companyData));
      continue;
    }

    const confidence = draft?.answerConfidence;
    const periodCoverage = periodCoverageForDraft(draft, companyData);
    if (confidence === 'high' && periodCoverage?.complete === false) {
      partial.push(summarize(draft, dataSources, companyData));
    } else if (confidence === 'high') {
      fromRecords.push(summarize(draft, dataSources, companyData));
      continue;
    } else if (confidence === 'medium') {
      written.push(summarize(draft, dataSources, companyData));
    } else if (confidence !== 'high') {
      // low, none, unknown, absent — all reported as "we can't answer this".
      unanswerable.push(summarize(draft, dataSources, companyData));
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
    recovered,
    recoveredFlagged: recovered.filter(a => a.staleness && a.staleness !== 'clear').length,
    fromRecords,
    partial,
    written,
    unanswerable,
    missingDocuments,
    // The questionnaire grouped by subject rather than by engine confidence.
    topics: summarizeTopics(list, companyData),
    // The same questionnaire grouped by its own section names, when it has usable ones.
    // null means the report should fall back to `topics`.
    sections: summarizeSections(list, companyData, sheetOf),
    // Lets the report describe the middle group honestly. See hasOwnData.
    hasOwnData: hasOwnData(companyData),
    // questions: how many the buyer is being asked. builders: how many documents
    // actually have to be written to cover them. They are different numbers and the
    // copy must not conflate them.
    policyGaps: { questions: policyQuestions, builders: [...policyBuilders].sort() },
  };
}

// Grouping the coverage report by the questionnaire's OWN sections.
//
// coverageTopics.js groups by the domain the matcher assigned — environmental, social,
// governance, company profile. That is one abstraction away from the buyer. The report
// is meant to read "the way the customer asking the questions groups them", and the
// customer already grouped them: the parser captures that grouping as `question.category`
// (a spreadsheet column named category/topic/theme/section/pillar, a PDF section
// heading, or failing both the sheet name) and the engine carries it onto every draft.
//
// The labels are NOT trusted blindly. PDF heading detection is known to misfire — the
// spec records '3', 'body' and 'Yes Please upload relevant document' being read as
// headings — and a questionnaire split into twenty sections of two questions reads worse
// than four topic cards.
//
// So the test is on the SHAPE of the partition, not on a blacklist of bad strings.
// Whether a given string "is a real heading" is not decidable; whether the labels cover
// most of the questionnaire and group it into a few sections of reasonable size is. Noise
// fails that test on its own: misfired headings leave most questions unlabelled and
// scatter the rest across one-question groups.

/** Below this share of questions carrying a usable label, the labels are not a partition. */
const MIN_LABELLED_SHARE = 0.8;
/** One section is not a grouping — a single-sheet workbook lands here via the sheet name. */
const MIN_SECTIONS = 2;
/** More cards than this reads worse than the four canonical topics. */
const MAX_SECTIONS = 12;
/** Sections this small on average are a heading-detector scatter, not a structure. */
const MIN_MEDIAN_SECTION = 2;

const MAX_LABEL_LENGTH = 60;

/**
 * Could this string plausibly be a section heading? Cheap content checks only — the
 * shape test below is the real defence.
 */
export function isUsableSectionLabel(value) {
  const label = String(value ?? '').trim();
  if (!label || label.length > MAX_LABEL_LENGTH) return false;
  // '3', '1.2', 'C.' — a numbering fragment the heading detector kept without its text.
  if (!/\p{L}/u.test(label)) return false;
  // A question is not the name of the group it belongs to. This is what keeps
  // 'Yes Please upload relevant document' style scaffolding out when it ends in one.
  if (label.includes('?')) return false;
  return true;
}

function median(numbers) {
  if (!numbers.length) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// The parser fills `category` from a real column or heading when it finds one, and
// otherwise from the sheet the question sat on. A sheet name is the name of a tab, not
// the buyer's section: a workbook holding four questionnaires grouped the report into
// cards reading "Questionnaire 1 - Buyer ESG Dee" (cut at Excel's 31 characters). Only a
// label that is not simply the question's own sheet is trusted.
function labelOf(draft, sheetOf) {
  const label = String(draft?.category ?? '').trim();
  if (!isUsableSectionLabel(label)) return null;
  const sheet = String(sheetOf?.(draft) ?? '').trim();
  if (sheet && sheet.toLocaleLowerCase() === label.toLocaleLowerCase()) return null;
  return label;
}

/**
 * The questionnaire's own sections, in the order it asks them — or null when its labels
 * do not form a usable partition, in which case the caller falls back to the canonical
 * topics.
 *
 * @param {Array} drafts answer drafts from the response engine
 * @param {{sheetOf?: (draft: object) => string|undefined}} [options] the sheet each draft's
 *   question sat on, so a label that is only the sheet name is not taken for a section
 * @returns {{labels: string[], labelFor: (draft: object) => string|null}|null}
 */
export function sectionPlan(drafts, { sheetOf } = {}) {
  const list = Array.isArray(drafts) ? drafts : [];
  if (!list.length) return null;

  const labelled = list.map(draft => labelOf(draft, sheetOf)).filter(Boolean);
  if (labelled.length / list.length < MIN_LABELLED_SHARE) return null;

  // 'ENVIRONMENT' and 'Environment' are one section; the first spelling the
  // questionnaire used is the one shown. First-appearance order is the order the reader
  // will work through the file, so it is kept — never alphabetical.
  const display = new Map();
  const sizes = new Map();
  const order = [];
  for (const label of labelled) {
    const key = label.toLocaleLowerCase();
    if (!display.has(key)) {
      display.set(key, label);
      sizes.set(key, 0);
      order.push(key);
    }
    sizes.set(key, sizes.get(key) + 1);
  }

  if (order.length < MIN_SECTIONS || order.length > MAX_SECTIONS) return null;
  if (median([...sizes.values()]) < MIN_MEDIAN_SECTION) return null;

  return {
    labels: order.map(key => display.get(key)),
    labelFor(draft) {
      const label = labelOf(draft, sheetOf);
      return label ? display.get(label.toLocaleLowerCase()) ?? null : null;
    },
  };
}

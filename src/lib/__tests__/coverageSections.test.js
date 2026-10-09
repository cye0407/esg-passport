import { describe, expect, it } from 'vitest';
import { isUsableSectionLabel, sectionPlan } from '../coverageSections';
import { summarizeCoverage } from '../coverage';

let seq = 0;
const draft = (domain, category, answerConfidence = 'medium', extra = {}) => ({
  questionId: `q${(seq += 1)}`,
  questionText: 'Question',
  answerConfidence,
  category,
  matchResult: { primaryDomain: domain, suggestedDataPoints: [] },
  ...extra,
});

/** n drafts in one section, so a fixture clears the median-size floor by construction. */
const run = (domain, category, n) => Array.from({ length: n }, () => draft(domain, category));

describe('isUsableSectionLabel', () => {
  it('accepts a real heading', () => {
    expect(isUsableSectionLabel('C. BUSINESS ETHICS')).toBe(true);
    expect(isUsableSectionLabel('Environment')).toBe(true);
  });

  it('rejects a numbering fragment the heading detector kept without its text', () => {
    expect(isUsableSectionLabel('3')).toBe(false);
    expect(isUsableSectionLabel('1.2')).toBe(false);
  });

  it('rejects a question, which is never the name of its own group', () => {
    expect(isUsableSectionLabel('Do you have a written environmental policy?')).toBe(false);
  });

  it('rejects an empty or over-long label', () => {
    expect(isUsableSectionLabel('')).toBe(false);
    expect(isUsableSectionLabel('   ')).toBe(false);
    expect(isUsableSectionLabel('x'.repeat(61))).toBe(false);
  });
});

describe('sectionPlan — when the questionnaire\'s own sections are trusted', () => {
  it('uses them, in the order the questionnaire asks them', () => {
    const plan = sectionPlan([...run('emissions', 'Environment', 3), ...run('workforce', 'Labour', 3)]);
    expect(plan.labels).toEqual(['Environment', 'Labour']);
  });

  it('treats one spelling of a heading as one section, keeping the first one seen', () => {
    const plan = sectionPlan([
      ...run('emissions', 'Environment', 2),
      ...run('waste', 'ENVIRONMENT', 2),
      ...run('workforce', 'Labour', 2),
    ]);
    expect(plan.labels).toEqual(['Environment', 'Labour']);
    expect(plan.labelFor(draft('waste', 'ENVIRONMENT'))).toBe('Environment');
  });
});

describe('sectionPlan — the three guards', () => {
  // 1 · fallback: nothing to group by, or not enough of the questionnaire labelled.
  it('falls back when the questionnaire carries no sections at all', () => {
    expect(sectionPlan(run('emissions', undefined, 6))).toBeNull();
    expect(sectionPlan(run('emissions', '', 6))).toBeNull();
  });

  it('falls back when most questions are unlabelled', () => {
    // 3 labelled of 10 — a heading detector that fired a couple of times, not a partition.
    const plan = sectionPlan([
      ...run('emissions', 'Environment', 3),
      ...run('workforce', undefined, 7),
    ]);
    expect(plan).toBeNull();
  });

  it('falls back on a single section, which is no grouping at all', () => {
    // A one-sheet workbook lands here: questionParser uses the sheet name as category.
    expect(sectionPlan(run('emissions', 'Sheet1', 6))).toBeNull();
  });

  // 2 · PDF noise: the shape gives it away without blacklisting strings.
  it('falls back when heading detection scattered one-question sections', () => {
    const noisy = ['A', 'body', 'B', 'Yes upload evidence', 'C', 'guidance']
      .map(category => draft('emissions', category));
    expect(sectionPlan(noisy)).toBeNull();
  });

  it('ignores an unusable label without letting it break an otherwise good partition', () => {
    const plan = sectionPlan([
      ...run('emissions', 'Environment', 4),
      ...run('workforce', 'Labour', 4),
      draft('waste', '3'),
    ]);
    expect(plan.labels).toEqual(['Environment', 'Labour']);
    expect(plan.labelFor(draft('waste', '3'))).toBeNull();
  });

  // 3 · granularity cap.
  it('falls back when the questionnaire has more sections than cards can carry', () => {
    const many = Array.from({ length: 13 }, (_, i) => run('emissions', `Section ${i}`, 2)).flat();
    expect(sectionPlan(many)).toBeNull();
  });

  it('keeps a questionnaire that sits just inside the cap', () => {
    const twelve = Array.from({ length: 12 }, (_, i) => run('emissions', `Section ${i}`, 2)).flat();
    expect(sectionPlan(twelve).labels).toHaveLength(12);
  });
});

describe('summarizeCoverage sections', () => {
  it('is null when the labels are not a usable partition, so the report uses topics', () => {
    const c = summarizeCoverage(run('emissions', undefined, 4));
    expect(c.sections).toBeNull();
    expect(c.topics.map(t => t.topic)).toEqual(['environmental']);
  });

  it('groups by the questionnaire\'s own sections when they are usable', () => {
    const c = summarizeCoverage([...run('emissions', 'Environment', 3), ...run('workforce', 'Labour', 3)]);
    expect(c.sections.map(s => s.section)).toEqual(['Environment', 'Labour']);
    expect(c.sections.map(s => s.total)).toEqual([3, 3]);
  });

  it('leaves the canonical topics alone, so the company-information card still works', () => {
    const c = summarizeCoverage([
      ...run('emissions', 'Environment', 3),
      ...run('site', 'About the company', 3),
    ]);
    expect(c.sections.map(s => s.section)).toEqual(['Environment', 'About the company']);
    expect(c.topics.map(t => t.topic)).toEqual(['environmental', 'other']);
  });

  it('accounts for every question exactly once, spillover included', () => {
    const c = summarizeCoverage([
      ...run('emissions', 'Environment', 4),
      ...run('workforce', 'Labour', 4),
      draft('site', '3'),
    ]);
    expect(c.sections.reduce((n, s) => n + s.total, 0)).toBe(c.total);
    // The unlabelled one is still counted, under its canonical topic.
    const spill = c.sections.find(s => s.section === null);
    expect(spill.topic).toBe('other');
    expect(spill.total).toBe(1);
  });

  it('gives a section the topic most of its questions belong to, for its icon', () => {
    const c = summarizeCoverage([
      ...run('emissions', 'Environment', 3),
      draft('workforce', 'Environment'),
      ...run('workforce', 'Labour', 4),
    ]);
    expect(c.sections.find(s => s.section === 'Environment').topic).toBe('environmental');
    expect(c.sections.find(s => s.section === 'Labour').topic).toBe('social');
  });

  it('counts answer states per section the way it counts them per topic', () => {
    const c = summarizeCoverage([
      ...run('emissions', 'Environment', 2),
      draft('emissions', 'Environment', 'high'),
      ...run('workforce', 'Labour', 3),
    ]);
    const environment = c.sections.find(s => s.section === 'Environment');
    expect(environment.total).toBe(3);
    expect(environment.written).toBe(2);
    expect(environment.fromRecords).toBe(1);
  });
});

// A workbook with no category column gets its sheet names as `category`. Four
// questionnaires on four tabs became four "sections" named after the tabs — which is
// where "Questionnaire 1 - Buyer ESG Dee" on the report came from. Only a real column
// or heading counts.
describe('sheet names are not section names', () => {
  const onSheets = (sheets, perSheet) => {
    const drafts = [];
    const questions = [];
    for (const sheet of sheets) {
      for (let i = 0; i < perSheet; i++) {
        const d = draft('environmental', sheet);
        drafts.push(d);
        questions.push({ id: d.questionId, text: 'Question', category: sheet, location: { sheet, row: i + 2 } });
      }
    }
    return { drafts, questions };
  };

  it('falls back to the canonical topics when every label is just its own sheet', () => {
    const { drafts, questions } = onSheets(['Questionnaire 1 - Buyer ESG Dee', 'Questionnaire 2 - German Buyer', 'Questionnaire 3 - Mixed-Languag'], 4);
    const c = summarizeCoverage(drafts, { questions });
    expect(c.sections).toBeNull();
  });

  it('still trusts a real category column on a multi-sheet workbook', () => {
    const { drafts, questions } = onSheets(['Sheet A', 'Sheet B'], 4);
    drafts.forEach((d, i) => { d.category = i % 2 ? 'Environment' : 'Governance'; });
    const c = summarizeCoverage(drafts, { questions });
    expect(c.sections?.map(s => s.section)).toEqual(['Governance', 'Environment']);
  });

  it('without the parsed questions, behaves as before', () => {
    const { drafts } = onSheets(['Tab one', 'Tab two'], 4);
    const plan = sectionPlan(drafts);
    expect(plan?.labels).toEqual(['Tab one', 'Tab two']);
  });

  it('ignores the sheet name whatever its case', () => {
    const { drafts, questions } = onSheets(['ENVIRONMENT', 'SOCIAL'], 4);
    questions.forEach(q => { q.location.sheet = q.location.sheet.toLowerCase(); });
    expect(summarizeCoverage(drafts, { questions }).sections).toBeNull();
  });
});

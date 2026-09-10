import { describe, expect, it } from 'vitest';
import { createResponseEngine } from 'response-ready';
import { esgDomainPack } from 'response-ready/domain-packs/esg';
import { templateToParseResult } from '../../data/questionnaire-templates';
import { summarizeCoverage } from '../coverage';

const engine = createResponseEngine(esgDomainPack);
const CONFIG = {
  useLLM: false, includeMethodology: true, includeAssumptions: true,
  includeLimitations: true, verbosity: 'standard', aggregateSites: true, language: 'en',
};

function run(templateId, companyData) {
  const pr = templateToParseResult(templateId, 'en');
  const matches = engine.matchQuestions(pr.questions);
  const classifications = engine.classifyQuestions?.(pr.questions) || [];
  const contexts = matches.map(m => engine.retrieveData(m, companyData));
  const drafts = engine.generateDrafts(pr.questions, matches, contexts, CONFIG, {}, classifications);
  return { pr, drafts };
}

const EMPTY = {};
const WITH_BILLS = {
  electricityKwh: 425000, waterM3: 3100, totalWasteKg: 82000,
  hazardousWasteKg: 400, totalEmployees: 280,
};

describe('coverage over the real engine', () => {
  it.each(['basic_supplier', 'ecovadis', 'csrd_vsme'])(
    'accounts for every question in %s',
    templateId => {
      const { pr, drafts } = run(templateId, EMPTY);
      const c = summarizeCoverage(drafts, { companyData: EMPTY });
      expect(c.total).toBe(pr.questions.length);
      expect(c.fromRecords.length + c.written.length + c.unanswerable.length).toBe(c.total);
    }
  );

  // The spec's central finding: a user who uploads nothing already gets most of the
  // questionnaire "written", because that measures the template library and not their
  // documents. What their own records buy is the FIRST group moving off zero. If this
  // ever inverts, the report is quoting the wrong number at the buyer.
  it('answers nothing from records until the user has records', () => {
    const { drafts } = run('ecovadis', EMPTY);
    const c = summarizeCoverage(drafts, { companyData: EMPTY });
    expect(c.fromRecords).toHaveLength(0);
    expect(c.written.length).toBeGreaterThan(0);
  });

  it('moves questions into the first group as the user adds their own figures', () => {
    const before = summarizeCoverage(run('ecovadis', EMPTY).drafts, { companyData: EMPTY });
    const after = summarizeCoverage(run('ecovadis', WITH_BILLS).drafts, { companyData: WITH_BILLS });
    expect(after.fromRecords.length).toBeGreaterThan(before.fromRecords.length);
  });

  it('names real documents to ask for, and asks for fewer once they are supplied', () => {
    const before = summarizeCoverage(run('ecovadis', EMPTY).drafts, { companyData: EMPTY });
    const after = summarizeCoverage(run('ecovadis', WITH_BILLS).drafts, { companyData: WITH_BILLS });
    expect(before.missingDocuments.length).toBeGreaterThan(0);
    for (const d of before.missingDocuments) expect(d.unlocks).toBeGreaterThan(0);
    const total = list => list.reduce((n, d) => n + d.unlocks, 0);
    expect(total(after.missingDocuments)).toBeLessThan(total(before.missingDocuments));
  });
});

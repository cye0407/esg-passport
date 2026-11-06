import { describe, expect, it } from 'vitest';
import { createResponseEngine } from 'response-ready';
import { esgDomainPack } from 'response-ready/domain-packs/esg';
import { templateToParseResult } from '../../data/questionnaire-templates';
import { summarizeCoverage } from '../coverage';
import { buildRequirements, requirementFor } from '../requirements';

const engine = createResponseEngine(esgDomainPack);
const CONFIG = {
  useLLM: false, includeMethodology: true, includeAssumptions: true,
  includeLimitations: true, verbosity: 'standard', aggregateSites: true, language: 'en',
};

function draftsFor(questions, companyData = {}) {
  const matches = engine.matchQuestions(questions);
  const classifications = engine.classifyQuestions?.(questions) || [];
  const contexts = matches.map(m => engine.retrieveData(m, companyData));
  return engine.generateDrafts(questions, matches, contexts, CONFIG, {}, classifications);
}

// The public sample questionnaire (esgforsuppliers.com/samples), question for question.
const SAMPLE = [
  'Registered legal name of your company',
  'Number of employees (FTE) at the end of the last financial year',
  'In which country is your company headquartered?',
  'Does your company have a documented environmental policy?',
  'Is your company certified to ISO 14001 or an equivalent environmental management system?',
  'What was your total electricity consumption (kWh) in the last reporting year?',
  'What percentage of your electricity comes from renewable sources?',
  'What were your Scope 1 greenhouse gas emissions (tCO2e) in the last reporting year?',
  'What were your Scope 2 greenhouse gas emissions (tCO2e) in the last reporting year?',
  'What was your total water consumption (m³) in the last reporting year?',
  'How much waste did your company generate in the last reporting year, and what share was recycled?',
  'Have you set a target to reduce your greenhouse gas emissions? Please describe it.',
  'Do you have a health and safety policy covering all employees?',
  'How many lost-time injuries were recorded in the last reporting year?',
  'What was your employee turnover rate in the last reporting year?',
  'How many hours of training did employees receive on average in the last year?',
  'Do you have a human rights or modern slavery policy?',
  'Does your company have a code of conduct that applies to all employees?',
  'Do you have an anti-bribery and corruption policy?',
  'Do you have a whistleblowing or grievance mechanism available to employees and third parties?',
  'Do you have a supplier code of conduct that you require your own suppliers to follow?',
  'Who in your company is responsible for sustainability, and how often is it reviewed by management?',
].map((text, i) => ({ id: `q${i + 1}`, text, rowIndex: i + 1 }));

function sampleRequirements(companyData = {}) {
  const coverage = summarizeCoverage(draftsFor(SAMPLE, companyData), { companyData });
  return buildRequirements(coverage.topics);
}

const docsFor = (req, n) => req.groups
  .flatMap(g => g.documents)
  .filter(d => d.questions.some(q => q.questionId === `q${n}`))
  .map(d => d.key)
  .sort();

describe('requirements on the public sample', () => {
  const req = sampleRequirements();

  it('accounts for every question exactly once in the counts', () => {
    expect(req.total).toBe(22);
    expect(req.answered + req.covered + req.decisions.length + req.drafted.length).toBe(22);
  });

  it('leaves the two management decisions as decisions', () => {
    expect(req.decisions.map(q => q.questionId).sort()).toEqual(['q12', 'q22']);
    expect(req.covered).toBe(20);
  });

  it('asks for the policy a policy question names, not the HR report', () => {
    expect(docsFor(req, 4)).toEqual(['policy.environmental']);
    expect(docsFor(req, 5)).toEqual(['policy.iso14001']);
    expect(docsFor(req, 13)).toEqual(['policy.healthSafety']);
    expect(docsFor(req, 17)).toEqual(['policy.humanRights']);
    expect(docsFor(req, 18)).toEqual(['policy.codeOfConduct']);
    expect(docsFor(req, 19)).toEqual(['policy.antiBribery']);
    expect(docsFor(req, 20)).toEqual(['policy.whistleblowing']);
    expect(docsFor(req, 21)).toEqual(['policy.supplierCode']);
  });

  it('narrows a figure question to the bill the question bank names', () => {
    expect(docsFor(req, 6)).toEqual(['electricityBill']);
    expect(docsFor(req, 8)).toEqual(['fuelInvoice']);
    expect(docsFor(req, 9)).toEqual(['electricityBill']);
    expect(docsFor(req, 10)).toEqual(['waterBill']);
    expect(docsFor(req, 11)).toEqual(['wasteManifest']);
    expect(docsFor(req, 14)).toEqual(['safetyLog']);
    expect(docsFor(req, 16)).toEqual(['trainingRecord']);
  });

  it('treats name and country as company details, not documents', () => {
    expect(docsFor(req, 1)).toEqual(['companyDetails']);
    expect(docsFor(req, 3)).toEqual(['companyDetails']);
    expect(req.hasCompanyDetails).toBe(true);
  });

  it('groups in a fixed order and does not count company details as a document', () => {
    expect(req.groups.map(g => g.group)).toEqual(['environment', 'workforce', 'policies', 'company']);
    const all = req.groups.flatMap(g => g.documents.map(d => d.key));
    expect(req.documentCount).toBe(all.filter(k => k !== 'companyDetails').length);
  });

  it('drops a question from the list once it is answered from records', () => {
    const withBills = sampleRequirements({ electricityKwh: 425000, waterM3: 3100 });
    expect(withBills.answered).toBeGreaterThan(0);
    expect(withBills.answered + withBills.covered + withBills.decisions.length + withBills.drafted.length).toBe(22);
  });
});

describe('buildRequirements', () => {
  it('does not turn a question that already has a draft into a decision', () => {
    const req = buildRequirements([{ topic: 'social', questions: [
      { questionId: 'a', questionText: 'Describe your approach to employee wellbeing', state: 'written', needs: null },
      { questionId: 'b', questionText: 'Describe your approach to community engagement', state: 'open', needs: null },
    ] }]);
    expect(req.drafted.map(q => q.questionId)).toEqual(['a']);
    expect(req.decisions.map(q => q.questionId)).toEqual(['b']);
    expect(req.covered).toBe(0);
  });
});

describe('requirementFor', () => {
  it('reads German policy questions', () => {
    expect(requirementFor({ questionText: 'Verfügt Ihr Unternehmen über eine Antikorruptionsrichtlinie?' }, 'governance'))
      .toEqual({ kind: 'document', documents: ['policy.antiBribery'] });
    expect(requirementFor({ questionText: 'Gibt es einen Verhaltenskodex für Lieferanten?' }, 'governance'))
      .toEqual({ kind: 'document', documents: ['policy.supplierCode'] });
  });

  it('calls a target a decision even when the engine mapped bills to it', () => {
    expect(requirementFor({ questionText: 'Have you set an emissions reduction target?', needs: { documents: [{ document: 'fuelInvoice' }] } }, 'environmental'))
      .toEqual({ kind: 'decision' });
  });

  it('keeps every mapped document when the hint names none of them', () => {
    expect(requirementFor({ questionText: 'Describe your energy use', needs: { documents: [{ document: 'electricityBill' }, { document: 'fuelInvoice' }], prompt: '' } }, 'environmental'))
      .toEqual({ kind: 'document', documents: ['electricityBill', 'fuelInvoice'] });
  });
});

describe('requirements over the built-in templates', () => {
  it.each(['basic_supplier', 'ecovadis', 'csrd_vsme'])('sums to the questionnaire for %s', templateId => {
    const pr = templateToParseResult(templateId, 'en');
    const coverage = summarizeCoverage(draftsFor(pr.questions), { companyData: {} });
    const req = buildRequirements(coverage.topics);
    expect(req.total).toBe(pr.questions.length);
    expect(req.answered + req.covered + req.decisions.length + req.drafted.length).toBe(req.total);
  });
});

import { describe, expect, it, beforeEach } from 'vitest';
import { createResponseEngine } from 'response-ready';
import { esgDomainPack } from 'response-ready/domain-packs/esg';
import { templateToParseResult } from '../../data/questionnaire-templates';
import { summarizeCoverage } from '../coverage';
import { buildCompanyData } from '../dataBridge';
import { resetData, saveDataRecord, saveCompanyProfile, getPolicies, savePolicy, updatePolicyStatus } from '../store';

// A field the user never touched is not something the user told us. The store seeds a
// policy list with every status 'not_available', and the bridge used to turn a missing
// headcount into 0 — so a workspace holding nothing but utility bills reported "0
// employees" and "No grievance mechanism is in place" as ready from the buyer's records.

const engine = createResponseEngine(esgDomainPack);
const CONFIG = {
  useLLM: false, includeMethodology: true, includeAssumptions: true,
  includeLimitations: true, verbosity: 'standard', aggregateSites: true, language: 'en',
};

function coverageFor(templateId, companyData) {
  const pr = templateToParseResult(templateId, 'en');
  const matches = engine.matchQuestions(pr.questions);
  const classifications = engine.classifyQuestions?.(pr.questions) || [];
  const contexts = matches.map(m => engine.retrieveData(m, companyData));
  const drafts = engine.generateDrafts(pr.questions, matches, contexts, CONFIG, {}, classifications);
  return summarizeCoverage(drafts, { companyData });
}

const YEAR = '2026';

function seedBillsOnly() {
  for (let m = 1; m <= 12; m++) {
    saveDataRecord({
      period: `${YEAR}-${String(m).padStart(2, '0')}`,
      energy: { electricityKwh: 30000 },
      water: { waterM3: 250 },
      waste: { totalWasteKg: 6000, hazardousWasteKg: 280 },
      workforce: {}, healthSafety: {}, training: {},
    });
  }
}

const TEMPLATES = ['basic_supplier', 'ecovadis', 'csrd_vsme'];

describe('defaults are not the buyer\'s records', () => {
  beforeEach(() => resetData());

  it('leaves the headcount unset when nobody entered one', () => {
    seedBillsOnly();
    getPolicies();
    const data = buildCompanyData(YEAR);
    expect(data.employeeCount).toBeUndefined();
  });

  it('keeps a headcount the user did enter', () => {
    saveCompanyProfile({ totalEmployees: '42' });
    expect(buildCompanyData(YEAR).employeeCount).toBe(42);
  });

  it('does not read an untouched seeded policy as "not in place"', () => {
    getPolicies();
    const data = buildCompanyData(YEAR);
    expect(data.dataProtectionPolicy).toBeUndefined();
    expect(data.grievanceMechanismExists).toBeUndefined();
    expect(data.codeOfConductStatus).toBeUndefined();
    expect(data.antiCorruptionStatus).toBeUndefined();
  });

  it('does read a "not in place" the user chose', () => {
    getPolicies();
    updatePolicyStatus('data_privacy', 'not_available');
    expect(buildCompanyData(YEAR).dataProtectionPolicy).toBe(false);
  });

  it('counts a status changed in the policy list as the user\'s', () => {
    const [first] = getPolicies();
    savePolicy({ ...first, status: 'in_progress' });
    savePolicy({ ...getPolicies().find(p => p.id === first.id), status: 'not_available' });
    expect(getPolicies().find(p => p.id === first.id).statusConfirmed).toBe(true);
  });

  it.each(TEMPLATES)('bills only: nothing in %s is "from your records" without a figure from the bills', templateId => {
    seedBillsOnly();
    getPolicies();
    const data = buildCompanyData(YEAR);
    const c = coverageFor(templateId, data);
    for (const a of c.fromRecords) {
      expect(a.answer).not.toMatch(/^0 employees/i);
      expect(a.answer).not.toMatch(/\bis not in place\b|\bare not in place\b|^No\. No /i);
    }
  });

  // The header's "N ready from your records" is fromRecords.length. With bills only, the
  // old defaults inflated it with a headcount of 0 and a "no" for every seeded policy.
  it('bills only: the "ready from your records" number drops by exactly the defaulted answers', () => {
    seedBillsOnly();
    getPolicies();
    const honest = buildCompanyData(YEAR);
    const oldDefaults = { ...honest, employeeCount: 0, dataProtectionPolicy: false, grievanceMechanismExists: false };
    const now = coverageFor('csrd_vsme', honest);
    const before = coverageFor('csrd_vsme', oldDefaults);
    const defaulted = before.fromRecords.filter(a => /^0 employees|not in place|^No\. No /i.test(a.answer));
    expect(defaulted.length).toBeGreaterThan(0);
    expect(now.fromRecords.length).toBe(before.fromRecords.length - defaulted.length);
  });
});

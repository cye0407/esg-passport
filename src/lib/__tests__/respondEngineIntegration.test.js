import { beforeEach, describe, expect, it } from 'vitest';
import { createResponseEngine } from 'response-ready';
import { esgDomainPack } from 'response-ready/domain-packs/esg';
import { buildCompanyData, buildCompanyProfile } from '../dataBridge';
import { loadData, resetData, saveCompanyProfile, saveData, saveDataRecord } from '../store';
import { templateToParseResult } from '../../data/questionnaire-templates';

const engine = createResponseEngine(esgDomainPack);

const CONFIG = {
  useLLM: false,
  includeMethodology: true,
  includeAssumptions: true,
  includeLimitations: true,
  verbosity: 'standard',
  aggregateSites: false,
};

beforeEach(() => {
  resetData();
});

function seedProfile(overrides = {}) {
  saveCompanyProfile({
    tradingName: 'Launch Supplier',
    legalName: 'Launch Supplier GmbH',
    industrySector: 'Manufacturing',
    countryOfIncorporation: 'DE',
    totalEmployees: '42',
    numberOfFacilities: '1',
    annualRevenue: '1M-5M EUR',
    baselineYear: '2025',
    ...overrides,
  });
}

function generate(questions) {
  const company = buildCompanyData('2025');
  const profile = buildCompanyProfile();
  const matches = engine.matchQuestions(questions);
  const classifications = engine.classifyQuestions?.(
    questions.map(({ id, text, category }) => ({ id, text, category }))
  );
  const contexts = matches.map((match) => engine.retrieveData(match, company));
  return engine.generateDrafts(questions, matches, contexts, CONFIG, profile, classifications);
}

describe('Respond page engine integration', () => {
  it('keeps sparse Passport data reviewable for claims that need evidence', () => {
    seedProfile();

    const drafts = generate([
      {
        id: 'hr-dd',
        rowIndex: 0,
        text: 'Do you conduct human rights due diligence?',
        category: 'Social',
        rawRow: {},
      },
      {
        id: 'supplier-assessed',
        rowIndex: 1,
        text: 'What percentage of suppliers are ESG assessed?',
        category: 'Supply Chain',
        rawRow: {},
      },
    ]);

    for (const draft of drafts) {
      expect(draft.answerConfidence).not.toBe('high');
      expect(draft.needsReview || draft.isDrafted || draft.hasDataGaps).toBe(true);
      expect(draft.answer.toLowerCase()).not.toContain('we are committed to');
      expect(draft.answer.toLowerCase()).not.toContain('we will');
      expect(draft.answer.toLowerCase()).not.toContain('we are implementing');
    }
  });

  it('generates ordered data-backed answers from Passport records and policies', () => {
    seedProfile({ totalEmployees: '128', numberOfFacilities: '2' });
    saveDataRecord({
      period: '2025-12',
      energy: { electricityKwh: 420000, renewablePercent: 48 },
      waste: { totalKg: 87000, recycledKg: 55680, hazardousKg: 0 },
      workforce: { totalEmployees: 128, femaleEmployees: 52, grievancesReported: 0 },
      healthSafety: { fatalities: 0, recordableIncidents: 1, lostTimeIncidents: 1, hoursWorked: 256000 },
      training: { trainingHours: 1536 },
      supplyChain: { suppliersAssessedPercent: 35 },
    });
    const data = loadData();
    data.policies = data.policies.map((policy) => (
      policy.id === 'supplier_code'
        ? { ...policy, status: 'available' }
        : policy
    ));
    saveData(data);

    const questions = [
      { id: 'energy', rowIndex: 0, text: 'What was your total electricity consumption in kWh?', category: 'Environment', rawRow: {} },
      { id: 'renewable', rowIndex: 1, text: 'What percentage of electricity came from renewable sources?', category: 'Environment', rawRow: {} },
      { id: 'supplier-code', rowIndex: 2, text: 'Do you have a Supplier Code of Conduct?', category: 'Supply Chain', rawRow: {} },
      { id: 'fatalities', rowIndex: 3, text: 'How many workplace fatalities occurred in the reporting period?', category: 'Health & Safety', rawRow: {} },
    ];

    const drafts = generate(questions);

    expect(drafts.map((draft) => draft.questionId)).toEqual(questions.map((question) => question.id));
    expect(drafts[0].answer).toMatch(/420[,.]?000/);
    expect(drafts[1].answer).toMatch(/\b48\b/);
    expect(drafts[2].answer.toLowerCase()).toContain('supplier code of conduct');
    expect(drafts[3].answer.toLowerCase()).toMatch(/\bzero\b|\b0\b/);
  });

  it('runs a built-in buyer template through the same engine path used by Respond', () => {
    seedProfile();
    const result = templateToParseResult('basic_supplier');
    const drafts = generate(result.questions);

    expect(result.success).toBe(true);
    expect(drafts).toHaveLength(result.questions.length);
    expect(drafts[0].questionId).toBe(result.questions[0].id);
    expect(drafts.every((draft) => draft.answer.trim().length > 0)).toBe(true);
  });

  it('uses agriculture-specific metrics in generated answers', () => {
    seedProfile({ industrySector: 'Agriculture & Farming' });
    saveDataRecord({
      period: '2025-12',
      agriculture: {
        landUseHectares: 25,
        fertilizerKg: 600,
        pesticideKg: 40,
        irrigationWaterM3: 1200,
        seasonalWorkers: 8,
      },
    });

    const [draft] = generate([
      {
        id: 'agriculture-inputs',
        rowIndex: 0,
        text: 'What fertilizer and pesticide quantities did you use, and what land area does this cover?',
        category: 'Environment',
        rawRow: {},
      },
    ]);

    expect(draft.answer).toMatch(/\b600\b/);
    expect(draft.answer).toMatch(/\b40\b/);
    expect(draft.answer).toMatch(/\b25\b/);
    expect(draft.answer.toLowerCase()).toContain('fertilizer');
  });

  it('uses mining-specific metrics without falling back to manufacturing wording', () => {
    seedProfile({ industrySector: 'Mining & Metals' });
    saveDataRecord({
      period: '2025-12',
      mining: {
        oreProcessedTonnes: 2500,
        tailingsGeneratedTonnes: 900,
        waterReusedPercent: 40,
        rehabilitatedLandHectares: 5,
      },
    });

    const [draft] = generate([
      {
        id: 'mining-materials',
        rowIndex: 0,
        text: 'How much ore was processed and how much tailings were generated?',
        category: 'Environment',
        rawRow: {},
      },
    ]);

    expect(draft.answer).toMatch(/2[,.]?500/);
    expect(draft.answer).toMatch(/\b900\b/);
    expect(draft.answer.toLowerCase()).toContain('tailings');
    expect(draft.answer.toLowerCase()).not.toContain('manufactur');
  });

  it('uses office and fleet metrics for service and logistics sectors', () => {
    seedProfile({ industrySector: 'Professional Services' });
    saveDataRecord({
      period: '2025-12',
      office: {
        officeSpaceM2: 450,
        businessTravelKm: 18000,
        wfhPercent: 60,
      },
    });

    const serviceDrafts = generate([
      { id: 'office-space', rowIndex: 0, text: 'What is your office space?', category: 'Environment', rawRow: {} },
      { id: 'travel-remote', rowIndex: 1, text: 'What is your business travel volume and remote work percentage?', category: 'Environment', rawRow: {} },
    ]);

    expect(serviceDrafts[0].answer).toMatch(/\b450\b/);
    expect(serviceDrafts[1].answer).toMatch(/18[,.]?000/);
    expect(serviceDrafts[1].answer).toMatch(/\b60\b/);

    resetData();
    seedProfile({ industrySector: 'Logistics & Transport' });
    saveDataRecord({
      period: '2025-12',
      fleet: {
        totalKmDriven: 120000,
        fleetSize: 14,
        avgVehicleAge: 4,
        altFuelPercent: 25,
      },
    });

    const [fleetDraft] = generate([
      { id: 'fleet', rowIndex: 0, text: 'Describe your fleet composition, km driven, and alternative fuel vehicles.', category: 'Environment', rawRow: {} },
    ]);

    expect(fleetDraft.answer).toMatch(/120[,.]?000/);
    expect(fleetDraft.answer).toMatch(/\b14\b/);
    expect(fleetDraft.answer).toMatch(/\b25\b/);
  });
});

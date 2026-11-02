import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  QUESTIONNAIRE_PASS_STORAGE_KEY,
  claimQuestionnaire,
  fingerprintQuestionnaire,
  getQuestionnairePassClaim,
  getQuestionnairePassDecision,
  questionHashesFor,
} from '../questionnairePass';

const LICENSE_ID = 4242;
const firstQuestions = [
  { text: 'What is your annual electricity use?' },
  { text: 'Do you have an environmental policy?' },
];

describe('Questionnaire Pass allowance', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('does not consume the pass when parsing produced no usable questions', () => {
    expect(getQuestionnairePassDecision({
      tier: 'questionnaire-pass', licenseKeyId: LICENSE_ID, questions: [],
    }).status).toBe('unusable');
    expect(getQuestionnairePassClaim(LICENSE_ID)).toBeNull();
  });

  it('does not consume the pass for a built-in sample', () => {
    expect(getQuestionnairePassDecision({
      tier: 'questionnaire-pass', licenseKeyId: LICENSE_ID,
      questions: firstQuestions, isBuiltInSample: true,
    }).status).toBe('allowed');
    expect(getQuestionnairePassClaim(LICENSE_ID)).toBeNull();
  });

  it('claims the first successfully processed questionnaire only when committed', () => {
    const decision = getQuestionnairePassDecision({
      tier: 'questionnaire-pass', licenseKeyId: LICENSE_ID, questions: firstQuestions,
    });
    expect(decision.status).toBe('claim-required');
    expect(getQuestionnairePassClaim(LICENSE_ID)).toBeNull();

    claimQuestionnaire({
      licenseKeyId: LICENSE_ID,
      fingerprint: decision.fingerprint,
      displayName: 'Buyer SAQ.xlsx',
      claimedAt: '2026-09-03T10:00:00.000Z',
    });

    expect(getQuestionnairePassClaim(LICENSE_ID)).toEqual({
      fingerprint: decision.fingerprint,
      displayName: 'Buyer SAQ.xlsx',
      claimedAt: '2026-09-03T10:00:00.000Z',
    });
  });

  it('creates the same fingerprint regardless of filename or harmless text formatting', () => {
    const reformatted = [
      { text: '  WHAT is your annual electricity use?  ' },
      { text: 'Do you have an environmental\npolicy?' },
    ];
    expect(fingerprintQuestionnaire(reformatted)).toBe(fingerprintQuestionnaire(firstQuestions));
  });

  it('keeps the claimed questionnaire allowed and blocks a materially different one', () => {
    const fingerprint = fingerprintQuestionnaire(firstQuestions);
    claimQuestionnaire({ licenseKeyId: LICENSE_ID, fingerprint, displayName: 'Buyer SAQ.xlsx' });

    expect(getQuestionnairePassDecision({
      tier: 'questionnaire-pass', licenseKeyId: LICENSE_ID, questions: firstQuestions,
    }).status).toBe('allowed');
    expect(getQuestionnairePassDecision({
      tier: 'questionnaire-pass', licenseKeyId: LICENSE_ID,
      questions: [{ text: 'What are your Scope 3 emissions?' }],
    }).status).toBe('blocked');
  });

  it('keeps the allowance outside ordinary questionnaire results and reset data', async () => {
    const fingerprint = fingerprintQuestionnaire(firstQuestions);
    claimQuestionnaire({ licenseKeyId: LICENSE_ID, fingerprint, displayName: 'Buyer SAQ.xlsx' });
    localStorage.setItem('esg_passport_data', JSON.stringify({ version: '1.0', savedResults: [] }));
    localStorage.removeItem('esg_passport_data');

    expect(localStorage.getItem(QUESTIONNAIRE_PASS_STORAGE_KEY)).not.toBeNull();
    expect(getQuestionnairePassClaim(LICENSE_ID)?.fingerprint).toBe(fingerprint);

    vi.resetModules();
    const reloaded = await import('../questionnairePass');
    expect(reloaded.getQuestionnairePassClaim(LICENSE_ID)?.fingerprint).toBe(fingerprint);
  });

  // A buyer who paid for a questionnaire was refused the corrected version of it: the
  // claim matched only an exact fingerprint of every question's text.
  describe('the same questionnaire, revised', () => {
    const base = Array.from({ length: 20 }, (_, i) => ({ text: `Question number ${i} about supplier practice ${i * 7}?` }));

    function claimBase() {
      claimQuestionnaire({
        licenseKeyId: LICENSE_ID,
        fingerprint: fingerprintQuestionnaire(base),
        questionHashes: questionHashesFor(base),
        displayName: 'Buyer SAQ.xlsx',
      });
    }

    it('accepts the customer revision with one question reworded', () => {
      claimBase();
      const revised = base.map((q, i) => (i === 3 ? { text: 'A reworded question about training hours?' } : q));
      expect(getQuestionnairePassDecision({ tier: 'questionnaire-pass', licenseKeyId: LICENSE_ID, questions: revised }).status).toBe('allowed');
    });

    it('accepts the same file confirmed with two questions left out', () => {
      claimBase();
      expect(getQuestionnairePassDecision({ tier: 'questionnaire-pass', licenseKeyId: LICENSE_ID, questions: base.slice(2) }).status).toBe('allowed');
    });

    it('still blocks a different questionnaire', () => {
      claimBase();
      const other = Array.from({ length: 20 }, (_, i) => ({ text: `Completely different question ${i}?` }));
      expect(getQuestionnairePassDecision({ tier: 'questionnaire-pass', licenseKeyId: LICENSE_ID, questions: other }).status).toBe('blocked');
    });

    it('keeps exact-match behaviour for a claim made before hashes were stored', () => {
      claimQuestionnaire({ licenseKeyId: LICENSE_ID, fingerprint: fingerprintQuestionnaire(base), displayName: 'Old claim' });
      const revised = base.map((q, i) => (i === 3 ? { text: 'A reworded question?' } : q));
      expect(getQuestionnairePassDecision({ tier: 'questionnaire-pass', licenseKeyId: LICENSE_ID, questions: revised }).status).toBe('blocked');
    });

    it('stores hashes, never question text', () => {
      claimBase();
      const raw = localStorage.getItem(QUESTIONNAIRE_PASS_STORAGE_KEY);
      expect(raw).not.toMatch(/supplier practice/);
      expect(JSON.parse(raw).claims[LICENSE_ID].questionHashes).toHaveLength(20);
    });
  });
});

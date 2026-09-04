import { describe, expect, it } from 'vitest';
import { getEntitlements } from '../entitlements';

describe('license entitlements', () => {
  it('keeps free users restricted to the sample workflow', () => {
    expect(getEntitlements('free')).toEqual({
      canUploadQuestionnaire: false,
      canExtractDocuments: false,
      canExportResponses: false,
      canBuildPolicies: false,
      canGenerateReport: false,
      maxQuestionnaires: 0,
      hasUnlimitedQuestionnaires: false,
    });
  });

  it('allows one questionnaire and document extraction for Questionnaire Pass', () => {
    expect(getEntitlements('questionnaire-pass')).toMatchObject({
      canUploadQuestionnaire: true,
      canExtractDocuments: true,
      canExportResponses: true,
      maxQuestionnaires: 1,
      hasUnlimitedQuestionnaires: false,
    });
  });

  it.each(['pro', 'pro-plus'])('keeps %s Passport users unlimited', tier => {
    expect(getEntitlements(tier)).toMatchObject({
      canUploadQuestionnaire: true,
      canExtractDocuments: true,
      canExportResponses: true,
      maxQuestionnaires: null,
      hasUnlimitedQuestionnaires: true,
    });
  });

  it('fails closed for an unknown tier', () => {
    expect(getEntitlements('mystery')).toEqual(getEntitlements('free'));
  });

  it('keeps the EUR 499-only capabilities out of the EUR 99 Questionnaire Pass', () => {
    const pass = getEntitlements('questionnaire-pass');
    expect(pass.canBuildPolicies).toBe(false);
    expect(pass.canGenerateReport).toBe(false);
    for (const tier of ['pro', 'pro-plus']) {
      expect(getEntitlements(tier).canBuildPolicies).toBe(true);
      expect(getEntitlements(tier).canGenerateReport).toBe(true);
    }
    const free = getEntitlements('free');
    expect(free.canBuildPolicies).toBe(false);
    expect(free.canGenerateReport).toBe(false);
  });
});

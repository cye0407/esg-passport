const ENTITLEMENTS_BY_TIER = Object.freeze({
  free: Object.freeze({
    canUploadQuestionnaire: false,
    canExtractDocuments: false,
    canExportResponses: false,
    canBuildPolicies: false,
    canGenerateReport: false,
    maxQuestionnaires: 0,
    hasUnlimitedQuestionnaires: false,
  }),
  'questionnaire-pass': Object.freeze({
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canExportResponses: true,
    // The Pass buys finishing ONE questionnaire. The guided policy builder and
    // the standalone ESG Report are the ongoing system, which is the Passport.
    // COVERAGE-REPORT-SPEC.md requires canBuildPolicies false for this tier.
    canBuildPolicies: false,
    canGenerateReport: false,
    maxQuestionnaires: 1,
    hasUnlimitedQuestionnaires: false,
  }),
  pro: Object.freeze({
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canExportResponses: true,
    canBuildPolicies: true,
    canGenerateReport: true,
    maxQuestionnaires: null,
    hasUnlimitedQuestionnaires: true,
  }),
  'pro-plus': Object.freeze({
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canExportResponses: true,
    canBuildPolicies: true,
    canGenerateReport: true,
    maxQuestionnaires: null,
    hasUnlimitedQuestionnaires: true,
  }),
});

export function getEntitlements(tier = 'free') {
  return ENTITLEMENTS_BY_TIER[tier] || ENTITLEMENTS_BY_TIER.free;
}

// Tiers with nothing left to buy. Anyone below this can still enter a different
// licence key, so the activation form must stay reachable for them even though
// they are already paid — a Questionnaire Pass holder who upgrades to the full
// Passport has to be able to type the new key in somewhere.
const TOP_TIERS = new Set(['pro', 'pro-plus']);

export function canActivateAnotherKey(tier) {
  return !TOP_TIERS.has(tier);
}

export function isRecognizedTier(tier) {
  return Object.hasOwn(ENTITLEMENTS_BY_TIER, tier);
}

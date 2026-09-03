const ENTITLEMENTS_BY_TIER = Object.freeze({
  free: Object.freeze({
    canUploadQuestionnaire: false,
    canExtractDocuments: false,
    canExportResponses: false,
    maxQuestionnaires: 0,
    hasUnlimitedQuestionnaires: false,
  }),
  'questionnaire-pass': Object.freeze({
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canExportResponses: true,
    maxQuestionnaires: 1,
    hasUnlimitedQuestionnaires: false,
  }),
  pro: Object.freeze({
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canExportResponses: true,
    maxQuestionnaires: null,
    hasUnlimitedQuestionnaires: true,
  }),
  'pro-plus': Object.freeze({
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canExportResponses: true,
    maxQuestionnaires: null,
    hasUnlimitedQuestionnaires: true,
  }),
});

export function getEntitlements(tier = 'free') {
  return ENTITLEMENTS_BY_TIER[tier] || ENTITLEMENTS_BY_TIER.free;
}

export function isRecognizedTier(tier) {
  return Object.hasOwn(ENTITLEMENTS_BY_TIER, tier);
}

// Tier → capability map.
//
// The paid line is "may you FINISH", not "may you LOOK". A free visitor may put
// their own questionnaire in and read their own documents, because until they see
// Passport work on their own file they are evaluating it on someone else's numbers
// (see COVERAGE-REPORT-SPEC.md — over a year, two people reached a price at all).
// What free may not do is generate the answers, export them, build policies, or
// produce a report. Nobody buys a response tool to read a coverage report.
//
// canUploadQuestionnaire and canGenerateAnswers are deliberately separate. One
// flag used to gate both the /respond route and generation, so opening upload to
// free would have handed away the whole product in a single boolean.
const ENTITLEMENTS_BY_TIER = Object.freeze({
  free: Object.freeze({
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canAnalyseCoverage: true,
    canGenerateAnswers: false,
    canExportResponses: false,
    canBuildPolicies: false,
    canGenerateReport: false,
  }),
  'questionnaire-pass': Object.freeze({
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canAnalyseCoverage: true,
    canGenerateAnswers: true,
    canExportResponses: true,
    // The Pass buys finishing ONE questionnaire. The guided policy builder and
    // the standalone ESG Report are the ongoing system, which is the Passport.
    // COVERAGE-REPORT-SPEC.md requires canBuildPolicies false for this tier.
    canBuildPolicies: false,
    canGenerateReport: false,
  }),
  pro: Object.freeze({
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canAnalyseCoverage: true,
    canGenerateAnswers: true,
    canExportResponses: true,
    canBuildPolicies: true,
    canGenerateReport: true,
  }),
  'pro-plus': Object.freeze({
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canAnalyseCoverage: true,
    canGenerateAnswers: true,
    canExportResponses: true,
    canBuildPolicies: true,
    canGenerateReport: true,
  }),
});

// There is no maxQuestionnaires / hasUnlimitedQuestionnaires here any more. Both
// were declared and read nowhere, while the actual one-questionnaire allowance is
// enforced by fingerprinting in questionnairePass.js. A flag that reads like a
// limit and enforces nothing is worse than no flag.

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

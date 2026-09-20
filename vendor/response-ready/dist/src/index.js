// ============================================
// ResponseReady — Main Export
// ============================================
// The primary entry point for the response-ready package.
// Factory
export { createResponseEngine } from './create';
// Engine utilities (for pack authors building custom retrieveData/templates)
export { addIfPresent, deduplicatePoints, emptyDataContext, } from './engine/dataRetrieval';
export { buildDataMap, val, has, num, str, fmt, } from './engine/answerGenerator';
export { parseCSV, parseCSVLine, } from './engine/configLoader';
// The company's portable record
export { RESPONSE_PACK_FORMAT, RESPONSE_PACK_VERSION, RESPONSE_PACK_EXTENSION, ENCRYPTED_PACK_EXTENSION, RESPONSE_PACK_README, ResponsePackError, createResponsePack, serializeResponsePack, parseResponsePack, mergeResponsePacks, encryptResponsePack, decryptResponsePack, openResponsePack, isEncryptedPack, passphraseStrength, responsePackFileName, normalizeAnswerKey, hashText, } from './engine/responsePack';
// Writing answers back into the buyer's original workbook
export { writeAnswersIntoWorkbook, completedFileName } from './engine/workbookWriter';
export { answerStateLabel, insertPlaceholderLabel } from './engine/answerStates';
// Recovering answers from a questionnaire the company already completed
export { priorAnswersFromQuestions, matchPriorAnswers, applyPriorAnswers, assessStaleness } from './engine/priorAnswers';
// Pack registry (for multi-pack consumers)
export { registerPack, getRegisteredPacks, getPackByName, detectPack, clearRegistry, } from './engine/packRegistry';
// Playbooks
export { SME_PLAYBOOKS } from './playbooks/sme';
export { registerPlaybook, getRegisteredPlaybooks, getDefaultPlaybooks, getPlaybookById, clearPlaybooks, resetPlaybooks, scorePlaybooks, detectPlaybook, } from './engine/playbookRegistry';
export { findLibraryMatches } from './engine/libraryMatcher';
export { createPlaybookWorkspace, DEFAULT_WORKSPACE_GENERATION_CONFIG, reviewStatusForDraft, ownerForDraft, sourceReferencesForMatches, applyLibraryFallback, buildWorkspaceMetrics, } from './product/playbookWorkspace';
export { buildResponseMatrixRows, buildMissingInfoRows, buildEvidenceChecklistRows, buildWorkspaceExportSheets, } from './product/workspaceArtifacts';
export { buildWorkspaceExportMetadata, exportWorkspaceToBuffer, exportWorkspaceToExcel, } from './product/workspaceExport';
export { filterWorkspaceItems, groupWorkspaceItemsByOwner, groupWorkspaceItemsByDomain, getWorkspaceRoutingSummary, } from './product/workspaceRouting';
export { promoteWorkspaceItemToLibraryItem, } from './product/libraryPromotion';
export { extractLibraryFromSourceDocuments, } from './product/sourceExtraction';
export { libraryFromEsgExtractionResult, mergeResponseLibraries, } from './product/esgExtractAdapter';
export { createWorkspaceFromSources, } from './product/sourceWorkspace';
export { createResponseProject, applyReviewDecision, latestDecisionForItem, promoteApprovedItems, getResponseProjectSummary, } from './product/responseProject';
// Productized pilot workflows
export { createProductOpsRfpWorkspace, buildInternalPilotPitch, } from './product/pilotWorkspace';
//# sourceMappingURL=index.js.map
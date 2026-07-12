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
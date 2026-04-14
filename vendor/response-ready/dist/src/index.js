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
//# sourceMappingURL=index.js.map
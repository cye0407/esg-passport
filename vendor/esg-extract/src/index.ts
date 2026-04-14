// ============================================
// ESG Extract — Main Export
// ============================================

export type {
  ExtractedField,
  ExtractionResult,
  ExtractionConfig,
  DocumentType,
  ProviderTemplate,
  FieldRule,
  PassportDataRecord,
  ResponseReadyData,
} from './types';

export { extractFromPdf, extractFromText } from './extractors/registry';
export { toPassportRecord } from './output/passport';
export { toResponseReadyData } from './output/responseReady';
export { parseNumber, detectUnit, convertToCanonical } from './matchers/units';

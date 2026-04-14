// ============================================
// ESG Extract — Core Types
// ============================================

/** A single extracted data point from a document */
export interface ExtractedField {
  /** What was extracted: 'electricityKwh', 'waterM3', 'totalWasteKg', etc. */
  field: string;
  /** The extracted value */
  value: number | string;
  /** Unit as found in the document */
  unit: string;
  /** Confidence in the extraction: high = clear match, medium = inferred, low = uncertain */
  confidence: 'high' | 'medium' | 'low';
  /** Numeric confidence score for UI sorting/review thresholds */
  score: number;
  /** Machine-readable reasons that explain the score */
  reasons: string[];
  /** Raw value text from the source document before normalization */
  rawValueText?: string;
  /** Raw unit text from the source document before normalization */
  rawUnitText?: string;
  /** Normalized value stored for downstream use */
  normalizedValue?: number | string;
  /** Normalized unit stored for downstream use */
  normalizedUnit?: string;
  /** Where in the document this was found */
  source: {
    page?: number;
    region?: string;
    rawText: string;
  };
  /** The period this data covers, if detectable */
  period?: string;
}

export interface Issue {
  code:
    | 'missing_expected_field'
    | 'multiple_candidate_values'
    | 'ambiguous_unit'
    | 'period_not_found'
    | 'document_type_uncertain'
    | 'low_confidence_field';
  field?: string;
  message: string;
}

export interface DocumentTypeDetection {
  type: DocumentType;
  score: number;
  runnerUp?: DocumentType;
  runnerUpScore?: number;
}

/** Result of processing a single document */
export interface ExtractionResult {
  /** Whether extraction succeeded */
  success: boolean;
  /** Detected document type */
  documentType: DocumentType;
  /** Provider/utility name if detected */
  provider?: string;
  /** Billing/reporting period if detected */
  period?: string;
  /** All extracted fields */
  fields: ExtractedField[];
  /** Structured issues for review UX */
  issues: Issue[];
  /** Fields that couldn't be extracted with confidence */
  gaps: string[];
  /** Warnings or notes for user review */
  warnings: string[];
  /** Why this document type was selected */
  documentDetection?: DocumentTypeDetection;
  /** Raw text extracted from the document */
  rawText: string;
}

export type DocumentType =
  | 'electricity_bill'
  | 'gas_invoice'
  | 'water_bill'
  | 'waste_manifest'
  | 'payroll_summary'
  | 'unknown';

/** Configuration for an extraction run */
export interface ExtractionConfig {
  /** Preferred language for OCR */
  language?: string;
  /** Force a specific document type (skip auto-detection) */
  forceType?: DocumentType;
  /** Minimum confidence to include a field */
  minConfidence?: 'high' | 'medium' | 'low';
}

/** A provider-specific template for field extraction */
export interface ProviderTemplate {
  /** Provider name (e.g., 'E.ON', 'Vattenfall') */
  name: string;
  /** Country/region */
  country: string;
  /** Document type this template handles */
  documentType: DocumentType;
  /** Patterns to identify this provider's documents */
  identifiers: RegExp[];
  /** Field extraction rules */
  fields: FieldRule[];
}

/** A rule for extracting a specific field from a document */
export interface FieldRule {
  /** Target field name */
  field: string;
  /** Patterns to find the value */
  patterns: RegExp[];
  /** Expected unit */
  unit: string;
  /** How to parse the matched value */
  parser: 'number' | 'date' | 'string';
  /** Is this field required for the template to be valid? */
  required?: boolean;
}

// ============================================
// Output Formats
// ============================================

/** ESG Passport dataRecord format (matches localStorage structure) */
export interface PassportDataRecord {
  period: string;
  energy?: {
    electricityKwh?: number;
    naturalGasKwh?: number;
    vehicleFuelLiters?: number;
    renewablePercent?: number;
  };
  water?: {
    consumptionM3?: number;
    waterSourceMunicipalPercent?: number;
  };
  waste?: {
    totalKg?: number;
    recycledKg?: number;
    hazardousKg?: number;
  };
  workforce?: {
    totalEmployees?: number;
    femaleEmployees?: number;
    maleEmployees?: number;
    newHires?: number;
    turnoverRate?: number;
  };
  healthSafety?: {
    recordableIncidents?: number;
    lostTimeIncidents?: number;
    fatalities?: number;
    hoursWorked?: number;
  };
  training?: {
    trainingHours?: number;
  };
  supplyChain?: {
    suppliersAssessedPercent?: number;
  };
}

/** ResponseReady ESGCompanyData format (flat structure) */
export interface ResponseReadyData {
  electricityKwh?: number;
  renewablePercent?: number;
  naturalGasM3?: number;
  dieselLiters?: number;
  waterM3?: number;
  totalWasteKg?: number;
  recyclingPercent?: number;
  hazardousWasteKg?: number;
  employeeCount?: number;
  femalePercent?: number;
}

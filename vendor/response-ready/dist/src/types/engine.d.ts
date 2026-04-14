export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type DataSource = string;
export interface ParsedQuestion {
    id: string;
    rowIndex: number;
    text: string;
    category?: string;
    subcategory?: string;
    referenceId?: string;
    framework?: string;
    required?: boolean;
    rawRow: Record<string, unknown>;
}
export interface ParseResult {
    success: boolean;
    questions: ParsedQuestion[];
    errors: string[];
    metadata: {
        fileName: string;
        totalRows: number;
        parsedRows: number;
        detectedFramework?: string;
        columnMapping: ColumnMapping;
        availableColumns?: string[];
        autoDetectionConfidence?: 'high' | 'medium' | 'low';
        sheetsProcessed?: number;
    };
}
export interface ColumnMapping {
    questionText: string;
    category?: string;
    subcategory?: string;
    referenceId?: string;
    required?: string;
}
/** A rule that maps keywords to a domain + topics. Domain packs provide arrays of these. */
export interface KeywordRule {
    keywords: string[];
    domain: string;
    topics: string[];
    weight: number;
}
export interface MatchResult {
    questionId: string;
    primaryDomain: string | null;
    secondaryDomains: string[];
    topics: string[];
    primaryTopics?: string[];
    confidence: 'high' | 'medium' | 'low' | 'none';
    matchedKeywords: string[];
    suggestedDataPoints: string[];
    /** Extra fields from CSV rule matching (if applicable) */
    csvMetricKeys?: string[];
    csvPromptIfMissing?: string;
}
export interface RetrievedDataPoint {
    domain: string;
    field: string;
    label: string;
    value: string | number | boolean | null;
    unit?: string;
    period?: string;
    source?: string;
    confidence?: ConfidenceLevel;
}
export interface DataContext {
    company: RetrievedDataPoint[];
    operational: RetrievedDataPoint[];
    calculated: RetrievedDataPoint[];
    metadata: {
        reportingPeriod?: string;
        sitesIncluded: string[];
        dataGaps: string[];
    };
}
export interface ClassificationResult {
    questionId: string;
    questionType: string;
    confidence: 'high' | 'medium' | 'low';
    matchedSignals: string[];
}
/** A signal rule for classifying questions. Domain packs provide arrays of these. */
export interface SignalRule {
    type: string;
    patterns: RegExp[];
    keywords: string[];
    weight: number;
}
export interface AnswerDraft {
    questionId: string;
    questionText: string;
    category?: string;
    questionType?: string;
    matchResult: MatchResult;
    dataContext: DataContext;
    answer: string;
    dataValue?: string;
    dataUnit?: string;
    dataPeriod?: string;
    dataSource?: string;
    answerConfidence: 'high' | 'medium' | 'low' | 'none';
    confidenceSource: 'provided' | 'estimated' | 'drafted' | 'unknown';
    methodology?: string;
    assumptions?: string[];
    limitations?: string[];
    suggestedEvidence?: string[];
    evidence: string;
    metricKeysUsed: string[];
    promptForMissing?: string;
    needsReview: boolean;
    isEstimate: boolean;
    isDrafted: boolean;
    hasDataGaps: boolean;
}
/** Result returned by an answer template generator. */
export type TemplateResult = string | {
    answer: string;
    drafted?: boolean;
} | null;
/** Template that generates an answer from retrieved data. */
export interface AnswerTemplate {
    domains: string[];
    topics: string[];
    /** Optional: restrict this template to specific question types (POLICY, MEASURE, KPI). If omitted, matches any type. */
    questionTypes?: string[];
    generate: (dataMap: Map<string, RetrievedDataPoint>, framework?: string) => TemplateResult;
}
export interface GenerationConfig {
    useLLM: boolean;
    includeMethodology: boolean;
    includeAssumptions: boolean;
    includeLimitations: boolean;
    verbosity: 'concise' | 'standard' | 'detailed';
    aggregateSites: boolean;
}
export interface ResponseSession {
    id: string;
    questionnaireName: string;
    requestor?: string;
    framework?: string;
    parseResult: ParseResult;
    matchResults: MatchResult[];
    answerDrafts: AnswerDraft[];
    status: 'parsing' | 'matching' | 'generating' | 'review' | 'complete';
    progress: number;
    createdAt: string;
    updatedAt: string;
}
export interface MetricKey {
    key: string;
    label: string;
    unit: string;
    period: string;
    allowedInputType: 'number' | 'boolean';
    definition: string;
    notes: string;
}
export interface MappingRule {
    priority: number;
    patternType: 'regex' | 'keyword';
    pattern: string;
    category: string;
    metricKeys: string[];
    answerTemplate: string;
    promptIfMissing: string;
}
/** A pattern-replacement pair for defensive answer rewriting. */
export interface ScrubRule {
    pattern: RegExp | string;
    replacement: string;
}
export interface ExportSheetConfig {
    name: string;
    buildSheet: (drafts: AnswerDraft[], metadata: ExportMetadata) => SheetData;
}
export interface ExportMetadata {
    companyName?: string;
    framework?: string;
    reportingPeriod?: string;
    generatedAt: string;
    packName: string;
    packVersion: string;
    /** Optional extra fields for richer exports (industry, metrics, etc.) */
    extra?: Record<string, string | number | boolean | null | undefined>;
}
export interface SheetData {
    headers: string[];
    rows: (string | number | boolean | null)[][];
    columnWidths?: number[];
    /** Hint for the exporter on how to style this sheet */
    style?: 'summary' | 'table' | 'checklist';
}
//# sourceMappingURL=engine.d.ts.map
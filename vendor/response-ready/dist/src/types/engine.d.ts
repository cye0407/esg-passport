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
/**
 * Maps a foreign-language / synonym term to the canonical English keyword(s) that existing
 * KeywordRules already match on. When `term` is found in a question (as a normalized
 * substring, so it survives German compounding — 'abfall' hits 'Abfallaufkommen'), the
 * canonical terms are appended to the text before keyword matching runs. This lets a domain
 * pack support non-English questionnaires without duplicating all of its rules.
 */
export interface TermAlias {
    /** Term to look for in the question. Matched case-insensitively as a normalized substring. */
    term: string;
    /** Canonical keyword(s) to inject when `term` is present. Must be strings the pack's
     *  KeywordRule[] already matches on, so the injected words route to the right domain. */
    add: string[];
    /** Input language this alias belongs to. The matcher applies it only when set to the same
     *  language (see KeywordMatcherInstance.setLanguage). Omit for language-neutral aliases,
     *  which always apply. Tagging matters because substring matching is blind to language:
     *  the German 'personal' (staff) would otherwise fire on the English word "personal". */
    lang?: Lang;
}
export interface MatchResult {
    questionId: string;
    primaryDomain: string | null;
    secondaryDomains: string[];
    topics: string[];
    primaryTopics?: string[];
    /** Sum of matched keyword-rule weights per topic. Lets answer-template selection
     *  prefer the topic a question scored most strongly on when two candidate templates
     *  in the same domain otherwise tie. */
    topicScores?: Record<string, number>;
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
/** Output language for generated answers. Extend as more locales are translated. */
export type Lang = 'en' | 'de';
export interface AnswerTemplate {
    domains: string[];
    topics: string[];
    /** Optional: restrict this template to specific question types (POLICY, MEASURE, KPI). If omitted, matches any type. */
    questionTypes?: string[];
    /** `lang` selects the output language (default 'en'). Templates that omit German fall back to English. */
    generate: (dataMap: Map<string, RetrievedDataPoint>, framework?: string, lang?: Lang) => TemplateResult;
}
export interface GenerationConfig {
    useLLM: boolean;
    includeMethodology: boolean;
    includeAssumptions: boolean;
    includeLimitations: boolean;
    verbosity: 'concise' | 'standard' | 'detailed';
    aggregateSites: boolean;
    /** Output language for generated answer text (default 'en'). */
    language?: Lang;
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
    /** Output language this rule applies to. The rewriter runs a rule only when it is untagged
     *  (language-neutral) or tagged with the answer's language. A scrub pattern is written for one
     *  language's phrasing, and a replacement rule can inject its own language's words, so an
     *  English rule must never run on a German answer. */
    lang?: Lang;
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
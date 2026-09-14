export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type DataSource = string;
/** Where a question sits in the file it came from, and where its answer belongs. */
export interface QuestionLocation {
    sheet: string;
    /** 1-based sheet row, as Excel shows it. */
    row: number;
    /** Column letter of the question text. */
    questionCol?: string;
    /** Cell the answer belongs in, e.g. "D13". Undefined when nothing could be identified. */
    answerCell?: string;
}
export type AnswerCellSource = 'header' | 'style' | 'adjacent-empty' | 'user';
export interface ParsedQuestion {
    id: string;
    /**
     * @deprecated Header-relative index kept for compatibility (it is 2 for the first data
     * row under the header, whatever row the header sits on). Use `location.row` for the
     * sheet row.
     */
    rowIndex: number;
    text: string;
    category?: string;
    subcategory?: string;
    referenceId?: string;
    framework?: string;
    required?: boolean;
    rawRow: Record<string, unknown>;
    /** Spreadsheet sources only. Absent for PDF, DOCX and free text. */
    location?: QuestionLocation;
    /** How `location.answerCell` was identified. */
    answerCellSource?: AnswerCellSource;
    /** Non-empty content already in the answer cell (a buyer's "N/A", a prior answer). */
    existingAnswer?: string | number;
    /**
     * Every further place the same question appears (an identical row repeated under
     * several sections). The first occurrence is `location`; these are the rest. Write-back
     * writes the same answer to all of them.
     */
    locations?: QuestionLocation[];
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
    /** Column holding answers, when a header names one ("Answer", "Antwort", "Supplier response"). */
    answerColumn?: string;
    /**
     * True when the question column was found by its HEADER ("Question", "Frage",
     * "Anforderung"), false when it was guessed by looking for the column with the most
     * text. A labelled column has already told us its cells are questionnaire items, so
     * the parser can accept cells that no shape test would recognise — a noun-phrase field
     * or a colon-ended label. A guessed column has vouched for nothing.
     */
    questionTextFromHeader?: boolean;
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
        /**
         * The same gaps, keyed by the domain whose retrieval raised them. Confidence reads the
         * question's own domain here; a pack that does not fill this in keeps the older
         * behaviour, where any gap anywhere in the context caps the answer.
         */
        dataGapsByDomain?: Record<string, string[]>;
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
    /**
     * Where the answer came from, when it did not come from this run's generation:
     * 'previous' = recovered from an earlier completed questionnaire. Set by
     * applyPriorAnswers; absent on drafts the generator produced.
     */
    source?: AnswerSource;
    /** For 'previous': the file, sheet and row the answer was taken from. */
    sourceRef?: {
        file: string;
        sheet?: string;
        row?: number;
        referenceId?: string;
    };
    /** ISO date the source questionnaire was completed, when known. */
    sourceDate?: string;
    /** 0–1 similarity between this question and the source question. 1 = identical text. */
    matchScore?: number;
    /** Why a recovered answer must be checked before it is reused. 'clear' = nothing flagged. */
    staleness?: Staleness;
}
export type AnswerSource = 'previous' | 'record' | 'document' | 'suggested' | 'none';
export type Staleness = 'clear' | 'check-figures' | 'check-period';
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
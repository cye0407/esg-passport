import type { KeywordRule, SignalRule, AnswerTemplate, ScrubRule, ExportSheetConfig, MatchResult, DataContext, RetrievedDataPoint, ParsedQuestion, GenerationConfig } from './engine';
export interface DomainPack<TData = Record<string, unknown>, TProfile = Record<string, unknown>> {
    /** Pack identity */
    name: string;
    version: string;
    /** Domain-specific keyword rules for matching questions to data domains */
    keywordRules: KeywordRule[];
    /** Suggested data points per domain (shown to users when data is missing) */
    domainSuggestions: Record<string, string[]>;
    /** Question types this domain uses, e.g. ['POLICY', 'MEASURE', 'KPI'] */
    questionTypes?: string[];
    /** Signal rules for classifying questions by type */
    classifierSignals?: SignalRule[];
    /** Fallback question type when classification is ambiguous */
    defaultQuestionType?: string;
    /** Rich answer templates keyed by domain + topics */
    answerTemplates: AnswerTemplate[];
    /** Framework-specific note suffixes, e.g. { 'CSRD': 'Aligned with ESRS...' } */
    frameworkNotes?: Record<string, string>;
    /** Field-to-metric-key mapping for tracking which metrics were used */
    fieldToMetricKey?: Record<string, string>;
    /** Per-topic field requirements — validates answers and generates gap declarations */
    topicRequirements?: Record<string, {
        requiredFields: string[];
        optionalFields?: string[];
        gapDescriptions: Record<string, string>;
    }>;
    /** Provides industry-specific terminology, measures, and policy language */
    industryContextProvider?: IndustryContextProvider;
    /** Resolves maturity band from profile + data availability */
    maturityResolver?: MaturityResolver<TProfile>;
    /** Generates answers from a QuestionType x Maturity matrix */
    matrixGenerator?: MatrixGenerator<TProfile>;
    /** Handles informal/undocumented practices when formal data is missing */
    informalPracticeHandler?: InformalPracticeHandler<TProfile>;
    /** String patterns to scrub from generated answers */
    scrubRules?: ScrubRule[];
    /** Named calculators (e.g. emission factors for ESG) */
    calculators?: Record<string, Calculator<TData>>;
    /**
     * The core domain-specific function. Given a match result and the user's data,
     * retrieve all relevant data points for answer generation.
     */
    retrieveData: (matchResult: MatchResult, data: TData) => DataContext;
    /** Custom sheet definitions for Excel export */
    exportSheets?: ExportSheetConfig[];
    /** Build a domain-aware prompt for LLM answer enhancement */
    buildLLMPrompt?: (question: ParsedQuestion, context: DataContext, config: GenerationConfig, profile?: TProfile, questionType?: string) => string;
}
export interface IndustryContext {
    industry: string;
    terminology: Record<string, string>;
    managementApproaches: Record<string, string>;
    plausibleMeasures: Record<string, Record<string, string[]>>;
    policyLanguage: Record<string, Record<string, string>>;
}
export interface IndustryContextProvider {
    getContext: (industry: string) => IndustryContext;
    applyTerms: (text: string, context: IndustryContext) => string;
    getMeasures: (industry: string, topic: string, subcategory: string, count?: number) => string[];
    getPolicyLanguage: (industry: string, topic: string, style: string, year?: string) => string | null;
}
export interface MaturityResolver<TProfile = Record<string, unknown>> {
    resolve: (profile: TProfile | undefined, matchResult: MatchResult, hasData: boolean) => string;
}
export interface MatrixGenerator<TProfile = Record<string, unknown>> {
    generate: (questionType: string, maturityBand: string, matchResult: MatchResult, dataMap: Map<string, RetrievedDataPoint>, context: DataContext, profile: TProfile, framework?: string) => string | null;
}
export interface InformalPracticeHandler<TProfile = Record<string, unknown>> {
    findRelevant: (profile: TProfile, matchResult: MatchResult) => unknown[];
    generateAnswer: (companyName: string, practices: unknown[], matchResult: MatchResult, industry: string, framework?: string) => string;
}
export interface Calculator<TData = Record<string, unknown>> {
    calculate: (data: TData, ...args: unknown[]) => {
        value: number;
        unit: string;
        source: string;
    } | null;
}
//# sourceMappingURL=domain-pack.d.ts.map
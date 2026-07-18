import type { ParsedQuestion, MatchResult, KeywordRule, MappingRule, TermAlias, Lang } from '../types';
/** Per-call match options. `language` declares the questionnaire's language for THIS call,
 *  overriding any instance-level declaration — per-call is the recommended way to set it,
 *  because instance state set for one questionnaire silently leaks into the next batch. */
export interface MatchOptions {
    language?: Lang;
}
export interface KeywordMatcherInstance {
    matchQuestion: (question: ParsedQuestion, options?: MatchOptions) => MatchResult;
    matchQuestions: (questions: ParsedQuestion[], options?: MatchOptions) => MatchResult[];
    getMatchStatistics: (results: MatchResult[]) => {
        total: number;
        byConfidence: Record<string, number>;
        byDomain: Record<string, number>;
        unmatchedCount: number;
    };
    /** Inject CSV mapping rules (tried before keyword rules) */
    setCsvRules: (rules: MappingRule[]) => void;
    /** Declare the language of the questions being matched, for calls that don't pass one.
     *  Prefer the per-call `options.language`: this is instance state, so a declaration made
     *  for one questionnaire applies to every later call that omits the language — including
     *  a different questionnaire's. Batches with no declaration at all are auto-detected. */
    setLanguage: (lang: Lang) => void;
}
/**
 * Create a keyword matcher from domain-specific rules.
 * @param keywordRules - Keyword rules from the domain pack
 * @param domainSuggestions - Suggested data points per domain
 * @param termAliases - Optional term aliases from the domain pack
 * @param options.language - Declared language of the questions to match. Per-call
 *   MatchOptions.language overrides it; undeclared batches are auto-detected, else 'en'.
 * @param options.confidenceThresholds - Override the summed-weight cut-offs for high/medium
 *   confidence. Defaults to the fixed 15/8 bands; a pack calibrates its own only by opting in.
 */
export declare function createMatcher(keywordRules: KeywordRule[], domainSuggestions: Record<string, string[]>, termAliases?: TermAlias[], options?: {
    language?: Lang;
    confidenceThresholds?: {
        high: number;
        medium: number;
    };
    exclusionPatterns?: RegExp[];
}): KeywordMatcherInstance;
//# sourceMappingURL=keywordMatcher.d.ts.map
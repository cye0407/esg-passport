import type { ParsedQuestion, MatchResult, KeywordRule, MappingRule } from '../types';
export interface KeywordMatcherInstance {
    matchQuestion: (question: ParsedQuestion) => MatchResult;
    matchQuestions: (questions: ParsedQuestion[]) => MatchResult[];
    getMatchStatistics: (results: MatchResult[]) => {
        total: number;
        byConfidence: Record<string, number>;
        byDomain: Record<string, number>;
        unmatchedCount: number;
    };
    /** Inject CSV mapping rules (tried before keyword rules) */
    setCsvRules: (rules: MappingRule[]) => void;
}
/**
 * Create a keyword matcher from domain-specific rules.
 * @param keywordRules - Keyword rules from the domain pack
 * @param domainSuggestions - Suggested data points per domain
 */
export declare function createMatcher(keywordRules: KeywordRule[], domainSuggestions: Record<string, string[]>): KeywordMatcherInstance;
//# sourceMappingURL=keywordMatcher.d.ts.map
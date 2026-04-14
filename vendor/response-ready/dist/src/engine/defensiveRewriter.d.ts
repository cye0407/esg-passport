import type { ScrubRule } from '../types';
export interface RewriterInstance {
    rewriteAnswer: (text: string) => string;
    rewriteAnswerBatch: (answers: string[]) => string[];
}
/**
 * Create a defensive rewriter from domain-specific scrub rules.
 * @param scrubRules - Pattern-replacement pairs from the domain pack
 */
export declare function createRewriter(scrubRules: ScrubRule[]): RewriterInstance;
//# sourceMappingURL=defensiveRewriter.d.ts.map
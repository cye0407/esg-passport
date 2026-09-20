import type { Lang, ParsedQuestion } from '../../../src/types';
export interface BankMatch {
    id: string;
    score: number;
    tier: 1 | 2;
    /** Runner-up, for diagnostics and for the "which of these did you mean" case. */
    second?: {
        id: string;
        score: number;
    };
    /** True when a conditional sub-question took its parent's record. */
    inherited?: boolean;
}
export declare function terms(text: string, lang: Lang): string[];
export interface MatchOptions {
    /** Below this the question is not the bank's; the legacy pipeline answers it as generic. */
    threshold?: number;
}
export declare function scoreQuestion(rawText: string, lang: Lang, category?: string): Array<{
    id: string;
    score: number;
}>;
export declare function matchCanonical(question: ParsedQuestion, lang?: Lang, options?: MatchOptions): BankMatch | null;
/** Multi-part cells: the primary record plus any other record the question also clearly asks
 *  ("total waste, hazardous waste and diversion" is three records). Extras must score high on
 *  their own; at most three records per cell so a long question does not become a report. */
export declare function matchCanonicalAll(question: ParsedQuestion, lang?: Lang, options?: MatchOptions): BankMatch[];
/** Match a whole questionnaire. A conditional sub-question ("If answered Yes to Q7, which areas
 *  are covered by this policy?") says nothing about its subject on its own; when its own score
 *  is weak it takes its parent's record — the row it names, or the row whose reference id is
 *  its prefix ("7a" → "7"). */
export declare function matchCanonicalBatch(questions: ParsedQuestion[], lang?: Lang, options?: MatchOptions): Array<BankMatch[]>;
/** For tests and tuning: reset the per-language index (the bank is static, but tests may stub it). */
export declare function resetBankIndex(): void;
//# sourceMappingURL=matcher.d.ts.map
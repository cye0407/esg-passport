import type { AnswerDraft, ParsedQuestion, Staleness } from '../types';
export interface PriorAnswer {
    id: string;
    question: string;
    answer: string | number;
    referenceId?: string;
    category?: string;
    sourceFile: string;
    sourceSheet?: string;
    sourceRow?: number;
    /** ISO date the source questionnaire was completed, when known. */
    sourceDate?: string;
    /** True once the user has confirmed the batch (or it came from a saved response pack). */
    approved: boolean;
}
export type MatchTier = 'exact' | 'reference' | 'overlap';
export interface PriorMatch {
    questionId: string;
    prior: PriorAnswer;
    /** 0–1. exact = 1, reference = 0.95, overlap = the Dice coefficient. */
    score: number;
    tier: MatchTier;
    staleness: Staleness;
}
export interface PriorMatchOptions {
    /** Lowest overlap score accepted. Default 0.6. */
    minScore?: number;
    /** The reporting year the new questionnaire asks about; drives 'check-period'. */
    reportingYear?: number;
    /** Only priors the user has approved are offered. Default true. */
    approvedOnly?: boolean;
}
export interface PriorSourceMeta {
    sourceFile: string;
    sourceDate?: string;
    approved?: boolean;
}
/**
 * Every parsed question that carries something in its answer cell becomes a prior answer.
 * The parser already found the box and read it (`existingAnswer`), so a completed
 * questionnaire needs no second reader.
 */
export declare function priorAnswersFromQuestions(questions: ParsedQuestion[], meta: PriorSourceMeta): PriorAnswer[];
/**
 * Why an answer must be checked before it is repeated. Figures, years and dates are the
 * things most likely to have changed since it was written; a different reporting year
 * makes even an unchanged sentence suspect.
 */
export declare function assessStaleness(prior: PriorAnswer, options?: PriorMatchOptions): Staleness;
/**
 * For each question, the best prior answer or null. Three tiers, first that applies wins:
 *
 *   exact      the same question text, normalised
 *   reference  the same reference id under the same heading, with at least some overlap
 *              (numbering restarts per section, so the heading is part of the id)
 *   overlap    Dice over content terms ≥ minScore; short questions (< 8 words) must also
 *              sit under the same heading unless the overlap is very high (≥ 0.85)
 *
 * In every tier the discriminating numbers must agree when both sides have them.
 */
export declare function matchPriorAnswers(questions: ParsedQuestion[], priors: PriorAnswer[], options?: PriorMatchOptions): Array<PriorMatch | null>;
/**
 * Put recovered answers onto the drafts. A recovered answer wins over anything the
 * generator produced for the same question — it is what the company actually said last
 * time — but it is `high` only when nothing about it is flagged, and it always carries
 * where it came from.
 */
export declare function applyPriorAnswers(drafts: AnswerDraft[], matches: Array<PriorMatch | null>): AnswerDraft[];
//# sourceMappingURL=priorAnswers.d.ts.map
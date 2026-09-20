import type { CanonicalQuestion, SourceMapping } from './types';
export type { CanonicalQuestion, SourceMapping, AnswerType, BankTopic, Bilingual } from './types';
export declare const ESG_QUESTION_BANK: CanonicalQuestion[];
export declare const ESG_BANK_MAPPINGS: SourceMapping[];
export declare function getCanonicalQuestion(id: string): CanonicalQuestion | undefined;
/** How many of a form's questions the CSRD value-chain cap covers, and which rest on other law
 *  or on nothing but the buyer's wish. Feeds the "N questions go beyond VSME" line. */
export declare function summarizeLegalBasis(ids: Array<string | null>): {
    vsme: number;
    otherLaw: number;
    none: number;
    unmapped: number;
};
//# sourceMappingURL=index.d.ts.map
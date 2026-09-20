import type { Lang } from '../../../src/types';
import type { ESGCompanyData } from '../dataModel';
import type { CanonicalQuestion } from './types';
export interface BankAnswer {
    answer: string;
    /** True when the record's fields answered it; false when it is an honest "not on record". */
    answered: boolean;
    /** CompanyData fields the answer was written from. */
    fieldsUsed: string[];
    /** Yes/no reading, when the question is a yes/no. */
    yesNo?: 'yes' | 'no' | 'partly' | 'na';
    /** For an unanswered cell: the buyer-facing sentence the user may choose to write into it. */
    canned?: string;
    /** For an unanswered cell: what would answer it, for the person. */
    wouldAnswer?: string;
}
export declare function fmt(n: number, lang: Lang, maxFrac?: number): string;
/** The buyer-facing sentence for a cell nothing on record answers. Says only that no evidence
 *  is available — no promise, no internal wording. */
export declare function cannedNoEvidence(lang: Lang): string;
/** Render the answer for a canonical question from the company record. */
export declare function renderBankAnswer(q: CanonicalQuestion, data: ESGCompanyData, lang?: Lang): BankAnswer;
//# sourceMappingURL=render.d.ts.map
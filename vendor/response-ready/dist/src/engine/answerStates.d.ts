import type { AnswerState, Lang } from '../types';
export interface AnswerStateLabel {
    /** The tag. */
    label: string;
    /** One line under the tag: what it means and what to do. */
    hint: string;
}
export declare function answerStateLabel(state: AnswerState, lang?: Lang): AnswerStateLabel;
/** The label of the "insert the placeholder sentence" action, so app and engine say the same thing. */
export declare function insertPlaceholderLabel(lang?: Lang): string;
//# sourceMappingURL=answerStates.d.ts.map
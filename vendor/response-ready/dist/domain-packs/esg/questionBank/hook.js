// ============================================
// ESG Domain Pack — Question Bank: engine hook
// ============================================
// What the engine's generator calls: batch matching (so conditional sub-questions inherit their
// parent's record), rendering from the raw company record, and the legal basis of the ask.
import { matchCanonicalBatch } from './matcher';
import { renderBankAnswer } from './render';
import { getCanonicalQuestion } from './index';
export const esgQuestionBankHook = {
    matchBatch: (questions, lang) => matchCanonicalBatch(questions, lang),
    render: (id, data, lang) => {
        const q = getCanonicalQuestion(id);
        if (!q || !data)
            return null;
        const r = renderBankAnswer(q, data, lang);
        return { answer: r.answer, answered: r.answered, fieldsUsed: r.fieldsUsed, yesNo: r.yesNo, canned: r.canned, wouldAnswer: r.wouldAnswer };
    },
    legalBasis: id => getCanonicalQuestion(id)?.legalBasis,
};
//# sourceMappingURL=hook.js.map
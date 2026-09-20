// ============================================
// ESG Domain Pack — Question Bank
// ============================================
// Canonical questions (VSME spine + supplier-form records) and the source mappings that are
// both the matcher's ground truth and its test set. Answer rendering attaches in a later step.
import { VSME_QUESTIONS } from './vsme';
import { SUPPLIER_FORM_QUESTIONS } from './supplierForms';
import { SAQ5_MAPPINGS } from './mappings/saq5';
import { TEMPLATE_MAPPINGS } from './mappings/templates';
import { BUYER_FORM_MAPPINGS } from './mappings/buyerForms';
export const ESG_QUESTION_BANK = [...VSME_QUESTIONS, ...SUPPLIER_FORM_QUESTIONS];
export const ESG_BANK_MAPPINGS = [...SAQ5_MAPPINGS, ...TEMPLATE_MAPPINGS, ...BUYER_FORM_MAPPINGS];
const byId = new Map(ESG_QUESTION_BANK.map(q => [q.id, q]));
export function getCanonicalQuestion(id) {
    return byId.get(id);
}
/** How many of a form's questions the CSRD value-chain cap covers, and which rest on other law
 *  or on nothing but the buyer's wish. Feeds the "N questions go beyond VSME" line. */
export function summarizeLegalBasis(ids) {
    const s = { vsme: 0, otherLaw: 0, none: 0, unmapped: 0 };
    for (const id of ids) {
        const q = id ? byId.get(id) : undefined;
        if (!q) {
            s.unmapped += 1;
            continue;
        }
        if (q.legalBasis === 'vsme')
            s.vsme += 1;
        else if (q.legalBasis === 'other-law')
            s.otherLaw += 1;
        else
            s.none += 1;
    }
    return s;
}
//# sourceMappingURL=index.js.map
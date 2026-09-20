import type { Lang } from '../../../src/types';
/** The shape of the cell the answer lands in. Decides yes/no vs. figure vs. prose. */
export type AnswerType = 'yesno' | 'number' | 'percent' | 'money' | 'text' | 'list' | 'date';
/** The buyer's grouping (E/S/G plus the company-profile bucket) — never the engine's. */
export type BankTopic = 'general' | 'environment' | 'social' | 'governance';
export interface Bilingual {
    en: string;
    de: string;
}
export interface CanonicalQuestion {
    /** Stable id, dotted: `<family>.<subject>[.<facet>]`. Families follow the sources — `vsme.*`
     *  for VSME datapoints, `policy.*` for policy-existence questions, `saq.*` for supplier-SAQ
     *  management-system questions, `core.*` for the rest of what buyer forms ask. */
    id: string;
    topic: BankTopic;
    answerType: AnswerType;
    /** Unit hint for figures (kWh, tCO2e, m³, kg, %). */
    unit?: string;
    /** One line in our own words. German is written, not translated — for VSME records it
     *  follows EFRAG's own German label. */
    intent: Bilingual;
    /** Phrasings a form uses for this intent. Our own words and public sources only — never a
     *  proprietary platform's sentence. Matching runs over these. */
    variants: {
        en: string[];
        de: string[];
    };
    /** Framework codes that name this question: 'VSME B3', 'GRI 305-1', 'SAQ5 15', 'CDP SME …'. */
    refs: string[];
    /** Phrases whose presence halves this record's match score — the neighbour's marker. A
     *  "supplier code of conduct" question must not land on the code-of-conduct record. */
    notTerms?: string[];
    /** VSME XBRL element names, where one exists — the machine-readable anchor. */
    vsme?: string[];
    /** CompanyData fields (ESGCompanyData) that answer it. Empty = only the user can answer. */
    needs: string[];
    /** Fields that must never be echoed in this answer, even when on record. */
    never?: string[];
    /** The document that would answer it, named for the coverage report. */
    needsDocument?: Bilingual;
    /** Parent question for conditional sub-questions ("If yes to Q4, …"). */
    parent?: string;
    /** Where a customer's right to ask comes from. Under the CSRD value-chain cap (Omnibus I)
     *  a CSRD-reporting customer may not seek more from a value-chain company under 1,000
     *  employees than the VSME standard specifies, with two exceptions: information it needs
     *  under other Union law, and information commonly shared in the sector. `vsme` questions
     *  are inside the cap. `other-law` questions rest on a statute of their own (LkSG, CBAM,
     *  EUDR, REACH, conflict minerals, GDPR) — the cap does not shield the supplier from them.
     *  `none` means neither VSME nor a statute names it: the buyer asks on its own account (or
     *  under the sector-practice exception), and the supplier may answer voluntarily or ask which
     *  exception applies. The report says "asks more than VSME specifies", never "illegal". */
    legalBasis: 'vsme' | 'other-law' | 'none';
    /** The statute, when `legalBasis` is `other-law`. */
    law?: string;
}
/** A source question mapped onto the bank — the matcher's ground truth and its test set. */
export interface SourceMapping {
    /** 'saq5', 'template:ecovadis', 'tough', … */
    source: string;
    /** The form's own reference id where it has one (SAQ '15a', VSME 'B3'). */
    ref?: string;
    text: string;
    lang: Lang;
    /** Canonical id, or null when the question is out of the bank's scope (free-text comment
     *  boxes, contact details) and should stay unanswered on purpose. */
    id: string | null;
    /** Why it is out of scope, when `id` is null. */
    note?: string;
}
//# sourceMappingURL=types.d.ts.map
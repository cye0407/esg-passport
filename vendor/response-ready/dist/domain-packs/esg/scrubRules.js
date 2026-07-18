// Every rule is tagged with the language it is written for. The rewriter runs a rule only on an
// answer of the same language (see applyRewriteRules), so an English pattern never touches a
// German answer — and the replacement rules ("Additionally, ", "Regarding ") can never inject
// English words into German. German answers get the German rules below; without them a /de
// answer skipped the whole defensive-rewrite stage.
export const ESG_SCRUB_RULES = [
    // --- English: opening "AI-ism" hedges ---
    { pattern: /^Based on (?:the |our )?(?:available |provided |current )?data,?\s*/i, replacement: '', lang: 'en' },
    { pattern: /^As (?:a|an) (?:small |medium-sized |large )?(?:manufacturing |industrial |logistics |construction |chemical |food |textile |technology |professional services? )?company,?\s*/i, replacement: '', lang: 'en' },
    { pattern: /^As (?:a|an) organization,?\s*/i, replacement: '', lang: 'en' },
    { pattern: /^It is important to note that\s*/i, replacement: '', lang: 'en' },
    { pattern: /^It should be noted that\s*/i, replacement: '', lang: 'en' },
    { pattern: /^We would like to (?:highlight|note|mention) that\s*/i, replacement: '', lang: 'en' },
    { pattern: /^In terms of\s+/i, replacement: 'Regarding ', lang: 'en' },
    { pattern: /^With regard(?:s)? to\s+/i, replacement: 'Regarding ', lang: 'en' },
    // --- English: mid-sentence hedges ---
    { pattern: /\bhowever,? it is worth noting that\s*/gi, replacement: '', lang: 'en' },
    { pattern: /\bit is worth (?:noting|mentioning|highlighting) that\s*/gi, replacement: '', lang: 'en' },
    { pattern: /\bwe acknowledge that\s*/gi, replacement: '', lang: 'en' },
    { pattern: /\bwe recognize that\s*/gi, replacement: '', lang: 'en' },
    // --- REMOVED: Rules 13-18 converted honest gap disclosures into fabricated
    // forward-looking commitments. "We do not track X" became "we are establishing
    // tracking for X" with no evidence. This is the single highest-risk pattern
    // in the system — it manufactures commitments from nothing. Gaps are now
    // surfaced honestly via the drafted flag and gap declarations. ---
    // --- English: generic AI filler ---
    { pattern: /\bin conclusion,?\s*/gi, replacement: '', lang: 'en' },
    { pattern: /\boverall,?\s*/gi, replacement: '', lang: 'en' },
    { pattern: /\bin summary,?\s*/gi, replacement: '', lang: 'en' },
    { pattern: /\bto summarize,?\s*/gi, replacement: '', lang: 'en' },
    { pattern: /\bmoreover,?\s*/gi, replacement: 'Additionally, ', lang: 'en' },
    { pattern: /\bfurthermore,?\s*/gi, replacement: 'Additionally, ', lang: 'en' },
    // --- German: opening hedges (mirror of the English openers) ---
    { pattern: /^Basierend auf (?:den |unseren )?(?:verfügbaren |vorliegenden |aktuellen )?Daten,?\s*/i, replacement: '', lang: 'de' },
    { pattern: /^Als (?:kleines |mittelständisches |großes )?Unternehmen,?\s*/i, replacement: '', lang: 'de' },
    { pattern: /^Es ist wichtig (?:anzumerken|hervorzuheben|zu beachten),? dass\s*/i, replacement: '', lang: 'de' },
    { pattern: /^Es sei darauf hingewiesen,? dass\s*/i, replacement: '', lang: 'de' },
    { pattern: /^Wir möchten (?:betonen|anmerken|hervorheben),? dass\s*/i, replacement: '', lang: 'de' },
    // --- German: mid-sentence hedges ---
    { pattern: /\bes ist erwähnenswert,? dass\s*/gi, replacement: '', lang: 'de' },
    { pattern: /\bwir erkennen an,? dass\s*/gi, replacement: '', lang: 'de' },
    // --- German: generic filler ---
    { pattern: /\bzusammenfassend,?\s*/gi, replacement: '', lang: 'de' },
    { pattern: /\binsgesamt,?\s*/gi, replacement: '', lang: 'de' },
    { pattern: /\bdarüber hinaus,?\s*/gi, replacement: 'Zusätzlich ', lang: 'de' },
    { pattern: /\bdes Weiteren,?\s*/gi, replacement: 'Zusätzlich ', lang: 'de' },
];
//# sourceMappingURL=scrubRules.js.map
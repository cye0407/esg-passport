export const ESG_SCRUB_RULES = [
    // --- Opening "AI-ism" hedges ---
    { pattern: /^Based on (?:the |our )?(?:available |provided |current )?data,?\s*/i, replacement: '' },
    { pattern: /^As (?:a|an) (?:small |medium-sized |large )?(?:manufacturing |industrial |logistics |construction |chemical |food |textile |technology |professional services? )?company,?\s*/i, replacement: '' },
    { pattern: /^As (?:a|an) organization,?\s*/i, replacement: '' },
    { pattern: /^It is important to note that\s*/i, replacement: '' },
    { pattern: /^It should be noted that\s*/i, replacement: '' },
    { pattern: /^We would like to (?:highlight|note|mention) that\s*/i, replacement: '' },
    { pattern: /^In terms of\s+/i, replacement: 'Regarding ' },
    { pattern: /^With regard(?:s)? to\s+/i, replacement: 'Regarding ' },
    // --- Mid-sentence hedges ---
    { pattern: /\bhowever,? it is worth noting that\s*/gi, replacement: '' },
    { pattern: /\bit is worth (?:noting|mentioning|highlighting) that\s*/gi, replacement: '' },
    { pattern: /\bwe acknowledge that\s*/gi, replacement: '' },
    { pattern: /\bwe recognize that\s*/gi, replacement: '' },
    // --- REMOVED: Rules 13-18 converted honest gap disclosures into fabricated
    // forward-looking commitments. "We do not track X" became "we are establishing
    // tracking for X" with no evidence. This is the single highest-risk pattern
    // in the system — it manufactures commitments from nothing. Gaps are now
    // surfaced honestly via the drafted flag and gap declarations. ---
    // --- Generic AI filler ---
    { pattern: /\bin conclusion,?\s*/gi, replacement: '' },
    { pattern: /\boverall,?\s*/gi, replacement: '' },
    { pattern: /\bin summary,?\s*/gi, replacement: '' },
    { pattern: /\bto summarize,?\s*/gi, replacement: '' },
    { pattern: /\bmoreover,?\s*/gi, replacement: 'Additionally, ' },
    { pattern: /\bfurthermore,?\s*/gi, replacement: 'Additionally, ' },
];
//# sourceMappingURL=scrubRules.js.map
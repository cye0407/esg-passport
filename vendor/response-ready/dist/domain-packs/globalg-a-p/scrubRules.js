// ============================================
// GlobalG.A.P. Domain Pack — Scrub Rules
// ============================================
// Defensive rewriting rules for certification-context answers.
export const GAP_SCRUB_RULES = [
    // --- Opening hedges ---
    { pattern: /^Based on (?:the |our )?(?:available |provided |current )?data,?\s*/i, replacement: '' },
    { pattern: /^As (?:a |an )?(?:certified |small |medium )?farm(?:ing operation|er)?,?\s*/i, replacement: '' },
    { pattern: /^It is important to note that\s*/i, replacement: '' },
    { pattern: /^It should be noted that\s*/i, replacement: '' },
    { pattern: /^We would like to (?:highlight|note|mention) that\s*/i, replacement: '' },
    { pattern: /^In terms of\s+/i, replacement: 'Regarding ' },
    // --- Mid-sentence hedges ---
    { pattern: /\bhowever,? it is worth noting that\s*/gi, replacement: '' },
    { pattern: /\bit is worth (?:noting|mentioning|highlighting) that\s*/gi, replacement: '' },
    { pattern: /\bwe acknowledge that\s*/gi, replacement: '' },
    { pattern: /\bwe recognize that\s*/gi, replacement: '' },
    // --- Gap language → active roadmap ---
    { pattern: /\bwe do not (?:yet |currently )?(?:have|maintain) (?:a )?(?:formal )?(\w+) (?:plan|procedure|protocol)/gi, replacement: 'we are developing a formal $1 plan' },
    { pattern: /\bno (?:formal )?(?:plan|procedure|protocol) (?:is|has been) (?:established|in place)/gi, replacement: 'a formal plan is currently in development' },
    { pattern: /\bwe do not (?:yet |currently )?(?:track|monitor|record) /gi, replacement: 'we are establishing records for ' },
    { pattern: /\bdata (?:is|was) not (?:yet )?(?:available|collected)/gi, replacement: 'data collection is currently being established' },
    { pattern: /\bwe lack\b/gi, replacement: 'we are developing' },
    { pattern: /\bthere is no\b/gi, replacement: 'we are establishing' },
    // --- Certification-specific reframes ---
    { pattern: /\bnot certified\b/gi, replacement: 'preparing for certification' },
    { pattern: /\bfailed to\b/gi, replacement: 'working to' },
    { pattern: /\bnon-compliant\b/gi, replacement: 'under improvement' },
    // --- Generic filler ---
    { pattern: /\bin conclusion,?\s*/gi, replacement: '' },
    { pattern: /\boverall,?\s*/gi, replacement: '' },
    { pattern: /\bin summary,?\s*/gi, replacement: '' },
    { pattern: /\bmoreover,?\s*/gi, replacement: 'Additionally, ' },
    { pattern: /\bfurthermore,?\s*/gi, replacement: 'Additionally, ' },
];
//# sourceMappingURL=scrubRules.js.map
// ============================================
// ESG Domain Pack — Scope-Exclusion Patterns
// ============================================
// GHG-Protocol scope semantics are ESG domain knowledge, so these patterns live in the pack,
// not the shared matcher. Each is stripped from a question before keyword matching so a single-
// scope question isn't pulled into the combined Scope 1+2 template by the EXCLUDED scope's own
// token. A plain "Scope 1 and Scope 2" question matches nothing here and keeps both.
// An excluded scope token, optionally carrying its "-emissions" / "-Emissionen" compound so the
// whole thing is removed cleanly rather than leaving a dangling "-Emissionen".
const SCOPE_TOKEN = String.raw `scope[\s-]?[123](?:[\s-]?emissionen|[\s-]?emissions?)?`;
export const ESG_EXCLUSION_PATTERNS = [
    // Cue before scope (English, and German with a fronted cue):
    //   "...do not include Scope 2", "...ausgenommen die Scope-2-Emissionen".
    new RegExp(String.raw `\b(?:do(?:es)?\s+not\s+include|don'?t\s+include|not\s+including|excluding|without|except(?:\s+for)?|ohne|ausgenommen|exklusive|nicht\s+enthalten(?:d)?)\s+(?:the\s+|der\s+|die\s+|den\s+)?${SCOPE_TOKEN}\b`, 'gi'),
    // Scope before cue — natural German verb-final word order, which the fronted-cue pattern above
    // never matched: "Scope 2 ist nicht enthalten", "Scope 3 wird ausgeschlossen". Up to two words
    // (an auxiliary + filler) may sit between the scope and the cue.
    new RegExp(String.raw `\b${SCOPE_TOKEN}\s+(?:\w+\s+){0,2}?(?:nicht\s+enthalten|ausgenommen|ausgeschlossen|nicht\s+ber(?:ü|ue)cksichtigt|exklusive)\b`, 'gi'),
];
//# sourceMappingURL=exclusionRules.js.map
// ============================================
// ResponseReady — Questionnaire Language Detection
// ============================================
// Which language is a QUESTIONNAIRE written in?
//
// Counting function words across the WHOLE document is reliable even though any single terse
// cell ("Abfall gesamt (t)") carries no signal at all — which is why the matcher consults this
// per batch, never per question. Measured against a real 2025 CDP Corporate Questionnaire
// export: 0 German markers vs 1082 English.
//
// Returns null when the text carries no markers in either language, so the caller can fall
// back to whatever language it would otherwise assume; a tie WITH signal reads as English,
// matching the engine's default.
const DE_MARKERS = /[äöüß]|\b(?:und|oder|der|die|das|sie|ihre|ihrer|ihren|haben|welche|wie|ist|sind|werden|nicht|für|mit|von|bei|im|eine|einen)\b/g;
const EN_MARKERS = /\b(?:and|or|the|your|you|have|has|which|how|is|are|were|not|for|with|from|in|of|a|an)\b/g;
export function detectQuestionnaireLanguage(questions) {
    const text = (questions || []).map(q => q?.text || '').join(' ').toLowerCase();
    const de = (text.match(DE_MARKERS) || []).length;
    const en = (text.match(EN_MARKERS) || []).length;
    if (de === 0 && en === 0)
        return null;
    return de > en ? 'de' : 'en';
}
//# sourceMappingURL=questionnaireLanguage.js.map
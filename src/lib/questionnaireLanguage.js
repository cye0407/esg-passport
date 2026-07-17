/**
 * Which language is a QUESTIONNAIRE written in?
 *
 * Deliberately not the answer-language setting: a German supplier is routinely sent an English
 * questionnaire (CDP, EcoVadis) and still wants German answers, so the two genuinely differ.
 * Getting this wrong is not cosmetic — response-ready matches German terms as unbounded
 * substrings, so declaring an English file "German" lets the German lexicon rewrite it (the
 * German 'personal' fires on "personal protective equipment" and misroutes it to headcount).
 *
 * Counting function words across the WHOLE document is reliable even though any single terse
 * cell ("Abfall gesamt (t)") carries no signal at all — that is why this is a per-questionnaire
 * decision, not a per-question one. Measured against a real 2025 CDP Corporate Questionnaire
 * export: 0 German markers vs 1082 English.
 *
 * Ties and empty input fall to English, matching the engine's own default.
 */
const DE_MARKERS = /[äöüß]|\b(?:und|oder|der|die|das|sie|ihre|ihrer|ihren|haben|welche|wie|ist|sind|werden|nicht|für|mit|von|bei|im|eine|einen)\b/g;
const EN_MARKERS = /\b(?:and|or|the|your|you|have|has|which|how|is|are|were|not|for|with|from|in|of|a|an)\b/g;

export function detectQuestionnaireLanguage(questions) {
  const text = (questions || []).map(q => q?.text || '').join(' ').toLowerCase();
  const de = (text.match(DE_MARKERS) || []).length;
  const en = (text.match(EN_MARKERS) || []).length;
  return de > en ? 'de' : 'en';
}

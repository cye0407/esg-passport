// ============================================
// Localizing the engine's own messages
// ============================================
// response-ready is domain-agnostic but not language-agnostic: its parse errors
// are English literals, and Respond joins them straight into the upload banner
// (`result.errors.join('. ')`). So a German supplier who uploads a .doc — the
// single most common upload failure — reads an English sentence at the exact
// moment the upload broke, in an app that is otherwise fully German.
//
// Rather than fork the engine's strings, we match them here and swap in a
// localized equivalent. Anything unrecognized falls through UNCHANGED: an
// English sentence the user can still act on beats a swallowed error, and a
// message that stops matching after an engine change stays visible instead of
// silently disappearing.

const RULES = [
  { re: /^Legacy \.doc format is not supported/i, key: 'engine.legacyDoc' },
  {
    re: /^Unsupported file format: \.?([A-Za-z0-9]+)/i,
    key: 'engine.unsupportedFormat',
    vars: (m) => ({ ext: m[1].toLowerCase() }),
  },
  { re: /^No questions could be extracted/i, key: 'engine.noQuestionsInDocument' },
  { re: /^No questions found with the selected column mapping/i, key: 'engine.noQuestionsForMapping' },
  { re: /^Could not identify question column/i, key: 'engine.noQuestionColumn' },
  { re: /^No sheets found in file/i, key: 'engine.noSheets' },
  // The em dash in the engine's wording is deliberately not matched — it is the
  // kind of character that survives a copy-edit only by luck.
  {
    re: /^Extracted (\d+) questions\b[\s\S]*seems high/i,
    key: 'engine.tooManyQuestions',
    vars: (m) => ({ count: m[1] }),
  },
  {
    re: /^Failed to parse PDF:\s*([\s\S]*)$/i,
    key: 'engine.pdfFailed',
    vars: (m) => ({ detail: m[1].trim() }),
  },
  {
    re: /^Failed to parse Word document:\s*([\s\S]*)$/i,
    key: 'engine.wordFailed',
    vars: (m) => ({ detail: m[1].trim() }),
  },
];

/**
 * @param {string} message  one engine error string
 * @param {(key: string, vars?: object) => string} t  bound translator (useLanguage)
 */
export function localizeEngineMessage(message, t) {
  const text = String(message || '').trim();
  if (!text) return text;
  for (const rule of RULES) {
    const match = text.match(rule.re);
    if (match) return t(rule.key, rule.vars ? rule.vars(match) : undefined);
  }
  return text;
}

export function localizeEngineMessages(messages, t) {
  return (messages || []).map((message) => localizeEngineMessage(message, t));
}

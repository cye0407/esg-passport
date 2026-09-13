// Last year's questionnaire — or another customer's — read back in and used to pre-fill
// this one. The engine does the reading, the matching and the placing (priorAnswers.ts);
// this module is the app's edge of it: which drafts a recovered answer replaces, how it
// sits inside Respond's draft shape, and how the user takes it back.
//
// A recovered answer is a claim the company is about to repeat. The engine already
// refuses the dangerous ones (Scope 1 for Scope 2, a Yes into a figure box) and flags any
// answer with a figure, a year or a date as 'check-figures'. What the app adds: the draft
// the engine generated is kept underneath (`_beforeRecovery`), so "don't use this" puts it
// straight back, and a rejected suggestion is remembered so it is not offered again.

export function summarizeRecovery(drafts) {
  const recovered = (drafts || []).filter(d => d.source === 'previous');
  return {
    recovered: recovered.length,
    flagged: recovered.filter(d => d.staleness && d.staleness !== 'clear').length,
  };
}

// `api` is what the two engine surfaces provide together: `parseFile` from the engine
// built with the ESG pack (createResponseEngine), and the prior-answer functions from the
// response-ready module. Respond assembles it via priorApi(); tests do the same.
export function priorApi(engine, mod) {
  return {
    parseFile: engine.parseFile,
    priorAnswersFromQuestions: mod.priorAnswersFromQuestions,
    matchPriorAnswers: mod.matchPriorAnswers,
    applyPriorAnswers: mod.applyPriorAnswers,
  };
}

/** Read a completed questionnaire into prior answers with the engine. */
export async function readPriorQuestionnaire(api, file, { sourceDate } = {}) {
  const parsed = await api.parseFile(file);
  if (!parsed.success || parsed.questions.length === 0) {
    return { ok: false, error: parsed.errors?.[0] || 'no-questions', priors: [], questions: 0 };
  }
  const priors = api.priorAnswersFromQuestions(parsed.questions, {
    sourceFile: file.name,
    sourceDate,
    // The user chose this file as their own completed questionnaire; that is the approval.
    approved: true,
  });
  return { ok: true, priors, questions: parsed.questions.length, fileName: file.name };
}

/**
 * Put recovered answers onto the drafts, keeping the generated draft underneath each.
 * `rejected` is the set of `${questionId}|${priorId}` the user has already declined.
 */
export function recoverAnswers(api, questions, drafts, priors, { reportingYear, rejected = new Set() } = {}) {
  const matches = api.matchPriorAnswers(questions, priors, { reportingYear });
  const kept = matches.map((m, i) => (m && rejected.has(`${questions[i].id}|${m.prior.id}`) ? null : m));
  const applied = api.applyPriorAnswers(drafts, kept);
  const out = applied.map((draft, i) => {
    if (draft.source !== 'previous') return draft;
    const before = drafts[i]._beforeRecovery || drafts[i];
    return {
      ...draft,
      // Respond's own shape: a recovered answer is verified text, not a draft.
      verifiedAnswer: draft.answer,
      draftAnswer: null,
      supportLevel: 'supported',
      dataCoverage: 'complete',
      contentMode: 'verified_only',
      _beforeRecovery: before,
      _priorId: kept[i].prior.id,
    };
  });
  return { drafts: out, ...summarizeRecovery(out) };
}

/** "Don't use this": the generated draft comes back; the suggestion is remembered as declined. */
export function rejectRecovered(draft) {
  if (draft.source !== 'previous' || !draft._beforeRecovery) return { draft, rejectedKey: null };
  return { draft: draft._beforeRecovery, rejectedKey: `${draft.questionId}|${draft._priorId}` };
}

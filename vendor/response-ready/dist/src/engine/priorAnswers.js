// ============================================
// ResponseReady — Previous Answers
// ============================================
// A questionnaire the company has already completed is the best source there is for the
// next one: the same buyer's form next year, or another buyer asking the same things. This
// module reads a completed questionnaire into PriorAnswers, matches a new questionnaire's
// questions against them, and puts the recovered answers onto the drafts — with the
// source of every one, and a flag wherever similarity is not the same as truth.
//
// The rule that governs the matching: a recovered answer is a CLAIM the supplier is about
// to repeat. "Scope 1 emissions" and "Scope 2 emissions" share every word but one, and
// reusing one for the other puts a wrong number in a buyer's file. So a match needs more
// than overlap — numbers must agree, short questions must sit under the same heading, and
// any answer carrying a figure, a year or a date is handed back marked "check this".
/**
 * Every parsed question that carries something in its answer cell becomes a prior answer.
 * The parser already found the box and read it (`existingAnswer`), so a completed
 * questionnaire needs no second reader.
 */
export function priorAnswersFromQuestions(questions, meta) {
    const priors = [];
    for (const q of questions) {
        if (q.existingAnswer === undefined || q.existingAnswer === '')
            continue;
        priors.push({
            id: `prior:${meta.sourceFile}:${q.location?.sheet ?? ''}:${q.location?.row ?? q.rowIndex}`,
            question: q.text,
            answer: q.existingAnswer,
            referenceId: q.referenceId,
            category: q.category,
            sourceFile: meta.sourceFile,
            sourceSheet: q.location?.sheet,
            sourceRow: q.location?.row,
            sourceDate: meta.sourceDate,
            approved: meta.approved ?? false,
        });
    }
    return priors;
}
// ---- text
const STOPWORDS = new Set([
    'and', 'are', 'any', 'can', 'for', 'has', 'have', 'how', 'our', 'the', 'this', 'that', 'these', 'those',
    'use', 'uses', 'using', 'what', 'with', 'you', 'your', 'who', 'why', 'does', 'do', 'did', 'is', 'was',
    'please', 'provide', 'describe', 'state', 'give', 'its', 'their', 'from', 'into', 'per', 'all', 'most',
    'within', 'during', 'company', 'companies', 'organisation', 'organization', 'business',
    'die', 'der', 'das', 'und', 'oder', 'ihr', 'ihre', 'ihres', 'ihrem', 'ihren', 'sie', 'wie', 'was', 'ein',
    'eine', 'einen', 'einem', 'eines', 'bei', 'mit', 'von', 'für', 'fur', 'auf', 'des', 'dem', 'den', 'ist',
    'sind', 'haben', 'hat', 'bitte', 'unternehmen', 'ihrem', 'ihres', 'wird', 'werden',
]);
// "4.3  Does your company…", "ENV2.2 What was…", "(12) Describe…": the numbering is the
// buyer's, not the question's. Left in, its digits read as discriminators and veto every
// match against a differently numbered form.
const LEADING_NUMBERING = /^\s*(?:\(?\d{1,3}(?:\.\d{1,3})*[.)]?|[A-Z]{1,4}\d{1,3}(?:\.\d{1,3})*)\s+/;
function stripNumbering(text) {
    return text.replace(LEADING_NUMBERING, '');
}
function normalize(text) {
    return stripNumbering(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .replace(/%/g, ' percent ')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function stem(term) {
    if (term.length > 4 && term.endsWith('s') && !term.endsWith('ss'))
        return term.slice(0, -1);
    return term;
}
function terms(text) {
    const out = new Set();
    for (const raw of normalize(text).split(' ')) {
        if (raw.length < 3 && !/^\d+$/.test(raw))
            continue;
        if (STOPWORDS.has(raw))
            continue;
        out.add(stem(raw));
    }
    return out;
}
const YEAR = /^(19|20)\d{2}$/;
/**
 * Numbers that change what is being asked: "Scope 1" vs "Scope 2", "last 24 months" vs
 * "last 12 months", "Tier 1". Years are not discriminators — a year difference is a
 * staleness question, not a different question.
 */
function discriminators(text) {
    const out = new Set();
    for (const tok of normalize(text).split(' ')) {
        if (/^\d+$/.test(tok) && !YEAR.test(tok))
            out.add(tok);
    }
    return out;
}
function sameSet(a, b) {
    if (a.size !== b.size)
        return false;
    for (const x of a)
        if (!b.has(x))
            return false;
    return true;
}
/**
 * Similarity of two term sets. Dice on its own punishes a question that merely adds
 * qualifiers ("…covering its own operations"), so the overlap coefficient — how much of
 * the SHORTER question the longer one contains — is taken too, slightly discounted
 * because it is the more permissive of the two.
 */
function similarity(a, b) {
    if (a.size === 0 || b.size === 0)
        return 0;
    let shared = 0;
    for (const x of a)
        if (b.has(x))
            shared++;
    const dice = (2 * shared) / (a.size + b.size);
    const smaller = Math.min(a.size, b.size);
    const larger = Math.max(a.size, b.size);
    // "environmental policy" inside "written environmental policy": the shorter question is
    // wholly contained and the longer adds one qualifier at most — the same question.
    if (shared === smaller && smaller >= 2 && larger - smaller <= 1)
        return 0.9;
    // Containment of a two- or three-term question proves little ("supplier code of
    // conduct" is inside "code of conduct covering labour and human rights" and is a
    // different document); only a longer question earns the overlap coefficient.
    const overlap = smaller >= 4 ? shared / smaller : 0;
    return Math.max(dice, overlap * 0.9);
}
function wordCount(text) {
    return normalize(text).split(' ').filter(Boolean).length;
}
function categoryTerms(c) {
    return c ? terms(c) : new Set();
}
/**
 * "Labour" and "LABOUR STANDARDS" are the same heading; "Environment" and "Ethics" are
 * not. Headings agree when they share a content term. A missing heading on either side
 * neither agrees nor disagrees.
 */
function headingsAgree(a, b) {
    if (a.size === 0 || b.size === 0)
        return null;
    for (const t of a)
        if (b.has(t))
            return true;
    return false;
}
// What kind of answer a question wants. A "Yes" recovered into a "(MWh)" box is a wrong
// claim however well the words overlap.
const WANTS_FIGURE = /\((?:kwh|mwh|gwh|t\s?co2e?|tco2e|%|percent|kg|kt|m3|m³|fte|vz[aä]e?|hours?|std|litres?|liters?)\)|^(?:total|number of|percentage|proportion|share of|how many|how much|average|wie viele|wie hoch|anzahl|anteil|gesamt)\b/i;
const WANTS_YES_NO = /^(?:do|does|did|are|is|has|have|can|will|were|was|haben|hat|ist|sind|gibt es|verf[üu]g(?:en|t)|besteh(?:en|t))\b/i;
const YES_NO_ANSWER = /^(?:yes|no|partially|partly|n\/?a|not applicable|ja|nein|teilweise)\b/i;
function answerTypeCompatible(newQuestion, prior) {
    const text = stripNumbering(newQuestion).trim();
    const answer = String(prior.answer).trim();
    const answerIsYesNo = YES_NO_ANSWER.test(answer);
    const answerIsNumber = typeof prior.answer === 'number' || /^-?\d+(?:[.,]\d+)?$/.test(answer);
    if (WANTS_FIGURE.test(text) && !WANTS_YES_NO.test(text) && answerIsYesNo)
        return false;
    if (WANTS_YES_NO.test(text) && answerIsNumber)
        return false;
    return true;
}
// ---- staleness
const FIGURE_IN_ANSWER = /\d+(?:[.,]\d+)?\s?(?:kwh|mwh|gwh|t\b|tco2e|tco2|co2e?|%|percent|m³|m3|kg|kt|fte|vzae|vzä|hours?|hrs|std|stunden|€|eur|usd|gbp|litres?|liters?|l\b)/i;
const DATE_IN_ANSWER = /\b\d{1,2}[./-]\d{1,2}[./-](?:\d{2}|\d{4})\b|\b(?:19|20)\d{2}-\d{2}(?:-\d{2})?\b/;
const YEAR_IN_ANSWER = /\b(?:19|20)\d{2}\b/;
/**
 * Why an answer must be checked before it is repeated. Figures, years and dates are the
 * things most likely to have changed since it was written; a different reporting year
 * makes even an unchanged sentence suspect.
 */
export function assessStaleness(prior, options = {}) {
    const text = String(prior.answer);
    if (typeof prior.answer === 'number')
        return 'check-figures';
    if (FIGURE_IN_ANSWER.test(text) || DATE_IN_ANSWER.test(text) || YEAR_IN_ANSWER.test(text))
        return 'check-figures';
    if (options.reportingYear && prior.sourceDate) {
        const sourceYear = Number(prior.sourceDate.slice(0, 4));
        if (sourceYear && sourceYear !== options.reportingYear)
            return 'check-period';
    }
    return 'clear';
}
function index(priors) {
    return priors.map(prior => ({
        prior,
        norm: normalize(prior.question),
        terms: terms(prior.question),
        discriminators: discriminators(prior.question),
        category: categoryTerms(prior.category),
        words: wordCount(prior.question),
    }));
}
/**
 * For each question, the best prior answer or null. Three tiers, first that applies wins:
 *
 *   exact      the same question text, normalised
 *   reference  the same reference id under the same heading, with at least some overlap
 *              (numbering restarts per section, so the heading is part of the id)
 *   overlap    Dice over content terms ≥ minScore; short questions (< 8 words) must also
 *              sit under the same heading unless the overlap is very high (≥ 0.85)
 *
 * In every tier the discriminating numbers must agree when both sides have them.
 */
export function matchPriorAnswers(questions, priors, options = {}) {
    const minScore = options.minScore ?? 0.6;
    const pool = index((options.approvedOnly ?? true) ? priors.filter(p => p.approved) : priors);
    return questions.map(q => {
        const qNorm = normalize(q.text);
        const qTerms = terms(q.text);
        const qDisc = discriminators(q.text);
        const qCat = categoryTerms(q.category);
        const qRef = (q.referenceId || '').trim().toLowerCase();
        const qWords = wordCount(q.text);
        let best = null;
        const consider = (p, score, tier) => {
            if (!best || score > best.score)
                best = { p, score, tier };
        };
        for (const p of pool) {
            if (p.discriminators.size > 0 && qDisc.size > 0 && !sameSet(p.discriminators, qDisc))
                continue;
            if (!answerTypeCompatible(q.text, p.prior))
                continue;
            if (p.norm === qNorm) {
                consider(p, 1, 'exact');
                continue;
            }
            const overlap = similarity(qTerms, p.terms);
            const agree = headingsAgree(qCat, p.category);
            if (qRef && p.prior.referenceId && qRef === p.prior.referenceId.trim().toLowerCase() && agree === true && overlap >= 0.3) {
                consider(p, 0.95, 'reference');
                continue;
            }
            if (overlap < minScore)
                continue;
            // A short question carries too few terms to stand alone: unless the overlap is very
            // high it also has to sit under a heading that agrees with the prior's.
            if ((qWords < 8 || p.words < 8) && overlap < 0.85 && agree !== true)
                continue;
            // A number on one side only ("last 24 months" vs "recently") is a weaker claim.
            const score = (p.discriminators.size > 0) !== (qDisc.size > 0) ? overlap * 0.85 : overlap;
            if (score >= minScore)
                consider(p, score, 'overlap');
        }
        if (!best)
            return null;
        const { p, score, tier } = best;
        return { questionId: q.id, prior: p.prior, score, tier, staleness: assessStaleness(p.prior, options) };
    });
}
// ---- onto the drafts
/**
 * Put recovered answers onto the drafts. A recovered answer wins over anything the
 * generator produced for the same question — it is what the company actually said last
 * time — but it is `high` only when nothing about it is flagged, and it always carries
 * where it came from.
 */
export function applyPriorAnswers(drafts, matches) {
    const byQuestion = new Map();
    for (const m of matches)
        if (m)
            byQuestion.set(m.questionId, m);
    return drafts.map(draft => {
        const m = byQuestion.get(draft.questionId);
        if (!m)
            return draft;
        const where = [m.prior.sourceSheet, m.prior.sourceRow !== undefined ? `row ${m.prior.sourceRow}` : ''].filter(Boolean).join(', ');
        return {
            ...draft,
            answer: String(m.prior.answer),
            answerConfidence: m.staleness === 'clear' ? 'high' : 'medium',
            confidenceSource: 'provided',
            source: 'previous',
            sourceRef: { file: m.prior.sourceFile, sheet: m.prior.sourceSheet, row: m.prior.sourceRow, referenceId: m.prior.referenceId },
            sourceDate: m.prior.sourceDate,
            matchScore: m.score,
            staleness: m.staleness,
            evidence: `Previous answer from ${m.prior.sourceFile}${where ? ` (${where})` : ''}${m.prior.sourceDate ? `, completed ${m.prior.sourceDate}` : ''}`,
            needsReview: m.staleness !== 'clear' || m.tier !== 'exact',
            isEstimate: false,
            isDrafted: false,
            hasDataGaps: false,
        };
    });
}
//# sourceMappingURL=priorAnswers.js.map
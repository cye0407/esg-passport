// ============================================
// ESG Domain Pack — Question Bank: matcher
// ============================================
// Which canonical question is this cell asking? Three tiers, all deterministic and local:
//
//   1. reference hook — a framework code in the row (VSME B3, GRI 305-1) names the record;
//   2. variant similarity — the question's terms against each record's phrasings, in the
//      questionnaire's language, weighted so that rare terms ("trir", "scope") count for
//      more than common ones ("policy", "report");
//   3. nothing above threshold — the caller falls back to the legacy pipeline and labels the
//      draft generic.
//
// The 494 mapped questions in ./mappings are the test set; the threshold is tuned on them.
import { ESG_QUESTION_BANK } from './index';
import { ESG_EXCLUSION_PATTERNS } from '../exclusionRules';
// ------------------------------------------------------------------ text
const STOP_EN = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'from', 'at', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did', 'have', 'has', 'had', 'you', 'your', 'our', 'we', 'us', 'it', 'its', 'this', 'that', 'these', 'those', 'any', 'all', 'please', 'provide', 'describe', 'state', 'report', 'list', 'identify', 'explain', 'confirm', 'specify', 'what', 'which', 'how', 'if', 'yes', 'no', 'answered', 'q', 'per', 'during', 'within', 'across', 'relevant', 'applicable', 'current', 'company', 'organisation', 'organization', 'undertaking', 'site', 'sites', 'reporting', 'period', 'last', 'year', 'most', 'recent', 'e', 'g', 'etc', 'including', 'include', 'included', 'such', 'other', 'their', 'there', 'where', 'when', 'whether', 'also', 'not', 'own', 'apply', 'applies', 'tick', 'select']);
const STOP_DE = new Set(['der', 'die', 'das', 'des', 'dem', 'den', 'ein', 'eine', 'einen', 'einem', 'einer', 'und', 'oder', 'von', 'zu', 'zur', 'zum', 'in', 'im', 'an', 'am', 'auf', 'für', 'mit', 'bei', 'aus', 'nach', 'über', 'unter', 'ist', 'sind', 'war', 'wird', 'werden', 'wurde', 'haben', 'hat', 'sie', 'ihr', 'ihre', 'ihrer', 'ihren', 'ihrem', 'ihres', 'wir', 'unser', 'unsere', 'es', 'sich', 'bitte', 'welche', 'welcher', 'welches', 'wie', 'was', 'ob', 'ja', 'nein', 'nicht', 'auch', 'sowie', 'bzw', 'z', 'b', 'etc', 'im', 'unternehmen', 'unternehmens', 'berichtszeitraum', 'geben', 'beschreiben', 'erläutern', 'nennen', 'angeben', 'liegt', 'liegen', 'vor', 'gibt', 'verfügen', 'verfügt', 'standort', 'standorte']);
function fold(text) {
    return text.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '').replace(/ß/g, 'ss')
        .replace(/%/g, ' percent ').replace(/co₂|co2e?/g, 'co2')
        // "scope 1", "category 4", "tier 2", "ISO 14001" are one term each: the digit is the meaning.
        .replace(/\bscope[\s-]*([123])\b/g, 'scope$1').replace(/\bcategor(?:y|ie)[\s-]*(\d{1,2})\b/g, 'category$1')
        .replace(/\btier[\s-]*(\d)\b/g, 'tier$1').replace(/\biso[\s-]*(\d{4,5})\b/g, 'iso$1')
        .replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function stem(t, lang) {
    if (t.length <= 3)
        return t;
    if (lang === 'de') {
        return t.replace(/(ungen|ionen|erinnen|heiten|keiten)$/, m => ({ ungen: 'ung', ionen: 'ion', erinnen: 'er', heiten: 'heit', keiten: 'keit' })[m] || m)
            .replace(/(en|er|es|em|e|n|s)$/, '');
    }
    return t.replace(/(ies)$/, 'y').replace(/(sses|shes|ches|xes)$/, m => m.slice(0, -2)).replace(/(ing|ed|es|s)$/, '');
}
export function terms(text, lang) {
    const stop = lang === 'de' ? STOP_DE : STOP_EN;
    const out = [];
    for (const raw of fold(text).split(' ')) {
        if (!raw || stop.has(raw) || /^\d+$/.test(raw))
            continue;
        out.push(stem(raw, lang));
    }
    return out;
}
const INDEX = {};
function buildIndex(lang, bank) {
    const variants = [];
    const recordTerms = new Map();
    const notTerms = new Map();
    const df = new Map();
    for (const q of bank) {
        if (q.notTerms?.length)
            notTerms.set(q.id, q.notTerms.map(fold));
        const phrases = [...(lang === 'de' ? q.variants.de : q.variants.en), lang === 'de' ? q.intent.de : q.intent.en];
        const all = new Set();
        for (const phrase of phrases) {
            const ts = terms(phrase, lang);
            if (!ts.length)
                continue;
            variants.push({ id: q.id, phrase: fold(phrase), termSet: new Set(ts) });
            ts.forEach(t => all.add(t));
        }
        recordTerms.set(q.id, all);
        all.forEach(t => df.set(t, (df.get(t) || 0) + 1));
    }
    const n = bank.length;
    const idf = new Map();
    for (const [t, d] of df)
        idf.set(t, Math.log(1 + n / d));
    return { variants, idf, recordTerms, notTerms };
}
function index(lang) {
    return INDEX[lang] || (INDEX[lang] = buildIndex(lang, ESG_QUESTION_BANK));
}
// ------------------------------------------------------------------ tier 1: reference hooks
const VSME_CODE = /\b([bc])\s?(\d{1,2})\b/i;
const GRI_CODE = /\bgri\s?(\d{3})(?:-(\d{1,2}))?/i;
function referenceHook(question) {
    const ref = `${question.referenceId || ''} ${question.category || ''}`;
    const gri = GRI_CODE.exec(`${ref} ${question.text}`);
    if (gri) {
        const code = `GRI ${gri[1]}${gri[2] ? `-${gri[2]}` : ''}`;
        const hit = ESG_QUESTION_BANK.find(q => q.refs.some(r => r.toUpperCase().startsWith(code.toUpperCase())));
        if (hit)
            return hit.id;
    }
    const vsme = VSME_CODE.exec(ref);
    if (vsme) {
        // A bare "B3" is only a VSME hook when the record's own reference says so; otherwise it is a
        // buyer's numbering ("B3" = section B, item 3) and must not route.
        const code = `VSME ${vsme[1].toUpperCase()}${vsme[2]}`;
        if (/vsme/i.test(ref) || /vsme/i.test(question.framework || '')) {
            const hits = ESG_QUESTION_BANK.filter(q => q.refs.some(r => r.toUpperCase().startsWith(code.toUpperCase() + ' ') || r.toUpperCase() === code.toUpperCase()));
            if (hits.length === 1)
                return hits[0].id;
        }
    }
    return null;
}
const DEFAULT_THRESHOLD = 0.42;
/** "Scope 1 only, do not include Scope 2": the excluded scope must not pull its own record in. */
function stripExclusions(text) {
    return ESG_EXCLUSION_PATTERNS.reduce((t, re) => t.replace(re, ' '), text);
}
export function scoreQuestion(rawText, lang, category) {
    const ix = index(lang);
    const text = stripExclusions(rawText);
    const qTerms = terms(text, lang);
    if (!qTerms.length)
        return [];
    const qSet = new Set(qTerms);
    const catTerms = new Set(category ? terms(category, lang) : []);
    const best = new Map();
    const folded = fold(text);
    for (const v of ix.variants) {
        // Weighted containment of the variant in the question: what share of the variant's
        // (rare-weighted) terms the question carries. A phrase that appears verbatim gets a bonus.
        let hit = 0, total = 0;
        for (const t of v.termSet) {
            const w = ix.idf.get(t) || 1;
            total += w;
            if (qSet.has(t))
                hit += w;
        }
        if (total === 0)
            continue;
        let score = hit / total;
        if (v.termSet.size === 1 && score > 0)
            score *= 0.75; // one-word variants are weak evidence
        if (folded.includes(v.phrase))
            score = Math.min(1, score + 0.15); // verbatim phrase
        // Reward coverage of the question too, so a long variant does not beat a short exact one
        // by accident and a two-word variant inside a forty-word question is not treated as the whole.
        const rec = ix.recordTerms.get(v.id);
        let qHit = 0, qTotal = 0;
        for (const t of qSet) {
            const w = ix.idf.get(t) || 0.5;
            qTotal += w;
            if (rec.has(t))
                qHit += w;
        }
        const coverage = qTotal ? qHit / qTotal : 0;
        score = 0.7 * score + 0.3 * coverage;
        if (catTerms.size && [...catTerms].some(t => rec.has(t)))
            score += 0.03;
        const nots = ix.notTerms.get(v.id);
        if (nots && nots.some(n => folded.includes(n)))
            score *= 0.5;
        if (score > (best.get(v.id) || 0))
            best.set(v.id, score);
    }
    return [...best.entries()].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
}
// A free-text box is nobody's question: comments, remarks, "anything else". The bank abstains
// and the cell stays for the person.
const FREE_TEXT = /\b(?:additional (?:information|comments?|remarks?)|further (?:comments?|information|remarks?)|use the space below|any(?:thing)? (?:other|else)|other comments?|remarks?|anmerkungen|sonstige (?:hinweise|angaben|bemerkungen)|weitere (?:informationen|angaben|hinweise))\b/i;
export function matchCanonical(question, lang = 'en', options = {}) {
    if (FREE_TEXT.test(question.text) && question.text.length < 200)
        return null;
    const hook = referenceHook(question);
    if (hook)
        return { id: hook, score: 1, tier: 1 };
    const ranked = scoreQuestion(question.text, lang, question.category);
    const threshold = options.threshold ?? DEFAULT_THRESHOLD;
    if (!ranked.length || ranked[0].score < threshold)
        return null;
    return { id: ranked[0].id, score: ranked[0].score, tier: 2, second: ranked[1] };
}
/** Multi-part cells: the primary record plus any other record the question also clearly asks
 *  ("total waste, hazardous waste and diversion" is three records). Extras must score high on
 *  their own; at most three records per cell so a long question does not become a report. */
export function matchCanonicalAll(question, lang = 'en', options = {}) {
    const primary = matchCanonical(question, lang, options);
    if (!primary)
        return [];
    if (primary.tier === 1)
        return [primary];
    const ranked = scoreQuestion(question.text, lang, question.category);
    const extras = ranked.filter(r => r.id !== primary.id && r.score >= Math.max(0.85, primary.score - 0.08)).slice(0, 2);
    return [primary, ...extras.map(e => ({ id: e.id, score: e.score, tier: 2 }))];
}
const CONDITIONAL = /^\s*(?:if\s+(?:answered\s+)?["“”']?(?:yes|no|any)["“”']?|if\s+.{0,40}?\bq\s?\d|wenn\s+(?:ja|mit\s+ja))/i;
const PARENT_REF = /\bq\s?(\d+[a-z]?(?:\.\d+)?)\b/i;
/** Match a whole questionnaire. A conditional sub-question ("If answered Yes to Q7, which areas
 *  are covered by this policy?") says nothing about its subject on its own; when its own score
 *  is weak it takes its parent's record — the row it names, or the row whose reference id is
 *  its prefix ("7a" → "7"). */
export function matchCanonicalBatch(questions, lang = 'en', options = {}) {
    const results = questions.map(q => matchCanonicalAll(q, lang, options));
    const byRef = new Map();
    questions.forEach((q, i) => { if (q.referenceId)
        byRef.set(String(q.referenceId).toLowerCase(), i); });
    questions.forEach((q, i) => {
        if (!CONDITIONAL.test(q.text))
            return;
        const own = results[i][0];
        if (own && own.score >= 0.75)
            return;
        let parent;
        const named = PARENT_REF.exec(q.text);
        if (named)
            parent = byRef.get(named[1].toLowerCase());
        if (parent === undefined && q.referenceId) {
            const prefix = String(q.referenceId).toLowerCase().replace(/[a-z]+$|\.\d+$/, '');
            if (prefix && prefix !== String(q.referenceId).toLowerCase())
                parent = byRef.get(prefix);
        }
        if (parent === undefined && i > 0)
            parent = i - 1;
        const inherited = parent !== undefined ? results[parent] : [];
        if (inherited.length)
            results[i] = inherited.map(m => ({ ...m, inherited: true }));
    });
    return results;
}
/** For tests and tuning: reset the per-language index (the bank is static, but tests may stub it). */
export function resetBankIndex() {
    delete INDEX.en;
    delete INDEX.de;
}
//# sourceMappingURL=matcher.js.map
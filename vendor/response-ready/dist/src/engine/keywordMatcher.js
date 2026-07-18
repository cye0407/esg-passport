// ============================================
// ResponseReady — Keyword Matcher (Domain-Agnostic)
// ============================================
// Matches questions to domains/topics using injectable keyword rules.
// No hardcoded rules — all domain knowledge comes from the DomainPack.
import { detectQuestionnaireLanguage } from './questionnaireLanguage';
// Confidence bands over the summed rule weight of the top-scoring domain.
// Named here rather than inlined so the ESG weight scale (overrides at 15/16/30) and
// these cut-offs stay visibly in sync.
const HIGH_CONFIDENCE_THRESHOLD = 15;
const MEDIUM_CONFIDENCE_THRESHOLD = 8;
// ============================================
// Text Utilities
// ============================================
function normalizeText(text) {
    // Fold diacritics to their base letter (ä→a, é→e, ñ→n) BEFORE punctuation folding. \w is
    // ASCII-only, so an accented letter would otherwise be punctuation and split its own word in
    // two, stranding fragments as if they were words: "Führungskräfte" became "f hrungskr fte",
    // whose stray "fte" then matched an FTE keyword and mis-routed every -kräfte compound to
    // headcount. Generic Unicode folding, not a German rule.
    //
    // Then fold hyphens (and all other punctuation) to spaces so hyphenated compounds match their
    // space-separated keywords: "hazardous-waste"→"hazardous waste", "land-use-change"→
    // "land use change", "Scope-1"→"scope 1", "anti-corruption"→"anti corruption". Keeping
    // hyphens previously made every hyphenated questionnaire term miss its keyword.
    //
    // '%' folds to the word 'percent' BEFORE the punctuation pass, because it is semantic, not
    // punctuation: stripping it degenerated the keyword '% of suppliers' to the bare substring
    // 'of suppliers', which routed "total number of suppliers" questions to supplier ASSESSMENT
    // at high confidence. Folding lets 'percent of suppliers' match "What % of suppliers…".
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .replace(/%/g, ' percent ')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function compileKeyword(keyword) {
    // Normalized keywords contain only \w and spaces (normalizeText folds everything else),
    // so the string can be embedded in a RegExp without escaping.
    const normalized = normalizeText(keyword);
    if (!normalized)
        return null;
    // Plural-tolerant whole-word match: a keyword also matches its regular +s / +es plural
    // (certification→certifications, supply chain→supply chains). Multi-word phrases get the
    // same boundaries as single words — matched against pre-normalized text they can never
    // start or end inside a larger token.
    return { keyword, re: new RegExp(`\\b${normalized}(?:s|es)?\\b`) };
}
function compileCsvRule(rule) {
    if (rule.patternType === 'regex') {
        try {
            return { rule, re: new RegExp(rule.pattern), normalizedPattern: null };
        }
        catch {
            return { rule, re: null, normalizedPattern: null };
        }
    }
    return { rule, re: null, normalizedPattern: normalizeText(rule.pattern) };
}
function tryCsvRules(rawText, normalizedText, csvRules) {
    for (const { rule, re, normalizedPattern } of csvRules) {
        const hit = re ? re.test(rawText) : normalizedPattern !== null && normalizedText.includes(normalizedPattern);
        if (hit) {
            return { metricKeys: rule.metricKeys, category: rule.category, promptIfMissing: rule.promptIfMissing };
        }
    }
    return null;
}
/**
 * Create a keyword matcher from domain-specific rules.
 * @param keywordRules - Keyword rules from the domain pack
 * @param domainSuggestions - Suggested data points per domain
 * @param termAliases - Optional term aliases from the domain pack
 * @param options.language - Declared language of the questions to match. Per-call
 *   MatchOptions.language overrides it; undeclared batches are auto-detected, else 'en'.
 * @param options.confidenceThresholds - Override the summed-weight cut-offs for high/medium
 *   confidence. Defaults to the fixed 15/8 bands; a pack calibrates its own only by opting in.
 */
export function createMatcher(keywordRules, domainSuggestions, termAliases = [], options = {}) {
    let csvMappingRules = [];
    // Language of the INPUT questionnaire, not of the generated answer (a German questionnaire
    // may be answered in English). Resolution order per call:
    //   1. options.language on the call itself — always wins, cannot go stale;
    //   2. the declared instance language (constructor option or setLanguage);
    //   3. for batches with no declaration anywhere, auto-detection over the whole batch —
    //      so a consumer built before languages existed still gets its foreign questionnaires
    //      matched instead of silently losing every language-tagged alias;
    //   4. 'en', rather than every pack's foreign lexicon applied to English text.
    // Detection is per-batch, never per-question: a single terse cell ("Abfall gesamt (t)")
    // carries no signal, so matchQuestion trusts only an explicit declaration.
    let declaredLanguage = options.language ?? null;
    // Confidence bands over the summed rule weight of the top-scoring domain. Fixed by default so
    // every pack shares one contract — downstream consumers gate review workflows on 'confidence',
    // so the band a question lands in must not depend on an unrelated pack's weight scale. A pack
    // whose rules top out below 15 (and so can never reach 'high') opts into its own bands
    // explicitly via confidenceThresholds rather than having them auto-derived.
    const highThreshold = options.confidenceThresholds?.high ?? HIGH_CONFIDENCE_THRESHOLD;
    const mediumThreshold = options.confidenceThresholds?.medium ?? MEDIUM_CONFIDENCE_THRESHOLD;
    // Pack-supplied patterns stripped from a question before matching (see DomainPack.exclusionPatterns).
    const exclusionPatterns = options.exclusionPatterns ?? [];
    // Pre-normalize alias terms once. normalizeText folds hyphens and diacritics on both sides,
    // so a multi-word term matches hyphenated German compounds ('Lieferanten-Verhaltenskodex' →
    // 'lieferanten verhaltenskodex') and an accented term matches its accented text
    // ('gefährlich' inside 'gefährlicher Abfall').
    const normalizedAliases = termAliases
        .map(a => ({ term: normalizeText(a.term), add: a.add, lang: a.lang }))
        .filter(a => a.term.length > 0);
    // Pre-compile every rule keyword once — the match loop below runs rules × keywords per
    // question and must only test ready-made regexes against ready-normalized text.
    const compiledRules = keywordRules.map(rule => ({
        rule,
        keywords: rule.keywords.map(compileKeyword).filter((k) => k !== null),
    }));
    // Append the canonical English keyword(s) for any alias term present in the question, so
    // the English keyword rules can match a non-English questionnaire. Takes and returns
    // NORMALIZED text; the appended keywords are normalized so the whole string stays in the
    // form the compiled keyword regexes expect.
    //
    // Alias terms are matched as unbounded substrings — that is deliberate, because German
    // compounds only resolve from a stem ('abfall' must hit 'Abfallaufkommen'), and no word
    // boundary would allow that. The cost is that matching cannot tell languages apart: the
    // German 'personal' (staff) is also an English word, and 'emission' sits inside "emissions".
    // So an alias tagged with a `lang` applies only when that is the input language for this
    // call; untagged aliases are language-neutral and always apply.
    function expandWithAliases(normalizedText, language) {
        if (normalizedAliases.length === 0)
            return normalizedText;
        const additions = [];
        for (const alias of normalizedAliases) {
            if (alias.lang && alias.lang !== language)
                continue;
            if (normalizedText.includes(alias.term))
                additions.push(...alias.add);
        }
        return additions.length > 0 ? `${normalizedText} ${normalizeText(additions.join(' '))}` : normalizedText;
    }
    function matchQuestionForLanguage(question, language) {
        const rawText = `${question.text} ${question.category || ''} ${question.subcategory || ''}`;
        // Strip any pack-supplied exclusion patterns before matching (e.g. the ESG pack removes a
        // scope token the question explicitly excludes). The engine holds no domain concepts here;
        // what "exclusion" means is entirely the pack's.
        let baseText = rawText;
        for (const pattern of exclusionPatterns)
            baseText = baseText.replace(pattern, ' ');
        // Normalize the question text ONCE here — everything downstream (CSV keyword patterns,
        // alias detection, keyword regexes) works on this string. Normalizing inside the rule
        // loop previously re-ran the Unicode folding rules × keywords times per question, which
        // visibly froze the browser main thread on large questionnaires.
        const normalizedBase = normalizeText(baseText);
        // CSV rules match on the original text; keyword rules match on the alias-expanded text.
        const csvMatch = tryCsvRules(baseText, normalizedBase, csvMappingRules);
        const text = expandWithAliases(normalizedBase, language);
        const domainScores = new Map();
        const topicScores = {};
        for (const { rule, keywords } of compiledRules) {
            // Collect every keyword this rule matched, then credit the domain ONCE per rule
            // (mirroring topicScores below). Crediting per-keyword would inflate a domain's
            // score by its synonym count and let wordy questions overtake more specific rules.
            const matchedKeywords = [];
            for (const { keyword, re } of keywords) {
                if (re.test(text))
                    matchedKeywords.push(keyword);
            }
            if (matchedKeywords.length > 0) {
                const existing = domainScores.get(rule.domain);
                if (existing) {
                    existing.score += rule.weight;
                    rule.topics.forEach(t => existing.topics.add(t));
                    for (const kw of matchedKeywords) {
                        if (!existing.matchedKeywords.includes(kw))
                            existing.matchedKeywords.push(kw);
                    }
                }
                else {
                    domainScores.set(rule.domain, {
                        domain: rule.domain,
                        score: rule.weight,
                        topics: new Set(rule.topics),
                        matchedKeywords: [...new Set(matchedKeywords)],
                    });
                }
                // Credit each of the rule's topics with its weight once per matching rule,
                // so template selection can prefer the topic a question scored highest on.
                for (const t of rule.topics)
                    topicScores[t] = (topicScores[t] || 0) + rule.weight;
            }
        }
        // Deterministic ordering: primary by score, then by number of matched keywords,
        // then alphabetical domain — so rule-array order can never silently flip a tie.
        const sortedDomains = Array.from(domainScores.values()).sort((a, b) => b.score - a.score ||
            b.matchedKeywords.length - a.matchedKeywords.length ||
            a.domain.localeCompare(b.domain));
        let confidence = 'none';
        if (sortedDomains.length > 0) {
            const topScore = sortedDomains[0].score;
            if (topScore >= highThreshold)
                confidence = 'high';
            else if (topScore >= mediumThreshold)
                confidence = 'medium';
            else
                confidence = 'low';
        }
        const allTopics = new Set();
        sortedDomains.forEach(d => d.topics.forEach(t => allTopics.add(t)));
        const suggestedDataPoints = [];
        for (const d of sortedDomains.slice(0, 3)) {
            suggestedDataPoints.push(...(domainSuggestions[d.domain] || []).slice(0, 3));
        }
        return {
            questionId: question.id,
            primaryDomain: sortedDomains[0]?.domain || null,
            secondaryDomains: sortedDomains.slice(1, 4).map(d => d.domain),
            topics: Array.from(allTopics),
            primaryTopics: sortedDomains[0] ? Array.from(sortedDomains[0].topics) : [],
            topicScores,
            confidence,
            matchedKeywords: sortedDomains[0]?.matchedKeywords || [],
            suggestedDataPoints: [...new Set(suggestedDataPoints)].slice(0, 6),
            ...(csvMatch ? { csvMetricKeys: csvMatch.metricKeys, csvPromptIfMissing: csvMatch.promptIfMissing } : {}),
        };
    }
    function matchQuestion(question, matchOptions) {
        return matchQuestionForLanguage(question, matchOptions?.language ?? declaredLanguage ?? 'en');
    }
    function matchQuestions(questions, matchOptions) {
        // One language per batch (see the resolution order on declaredLanguage above). Detection
        // runs only when nothing was declared anywhere, and only over the whole batch.
        const language = matchOptions?.language ?? declaredLanguage ?? detectQuestionnaireLanguage(questions) ?? 'en';
        return questions.map(q => matchQuestionForLanguage(q, language));
    }
    function getMatchStatistics(results) {
        const byConfidence = { high: 0, medium: 0, low: 0, none: 0 };
        const byDomain = {};
        for (const result of results) {
            byConfidence[result.confidence]++;
            if (result.primaryDomain)
                byDomain[result.primaryDomain] = (byDomain[result.primaryDomain] || 0) + 1;
        }
        return { total: results.length, byConfidence, byDomain, unmatchedCount: byConfidence.none };
    }
    function setCsvRules(rules) {
        csvMappingRules = rules
            .slice()
            .sort((a, b) => a.priority - b.priority)
            .map(compileCsvRule);
    }
    function setLanguage(lang) {
        declaredLanguage = lang;
    }
    return { matchQuestion, matchQuestions, getMatchStatistics, setCsvRules, setLanguage };
}
//# sourceMappingURL=keywordMatcher.js.map
// ============================================
// ResponseReady — Keyword Matcher (Domain-Agnostic)
// ============================================
// Matches questions to domains/topics using injectable keyword rules.
// No hardcoded rules — all domain knowledge comes from the DomainPack.
// Confidence bands over the summed rule weight of the top-scoring domain.
// Named here rather than inlined so the ESG weight scale (overrides at 15/16/30) and
// these cut-offs stay visibly in sync.
const HIGH_CONFIDENCE_THRESHOLD = 15;
const MEDIUM_CONFIDENCE_THRESHOLD = 8;
// ============================================
// Text Utilities
// ============================================
function normalizeText(text) {
    // Fold hyphens (and all other punctuation) to spaces so hyphenated compounds match their
    // space-separated keywords: "hazardous-waste"→"hazardous waste", "land-use-change"→
    // "land use change", "Scope-1"→"scope 1", "anti-corruption"→"anti corruption". Keeping
    // hyphens previously made every hyphenated questionnaire term miss its keyword.
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function containsKeyword(text, keyword) {
    const normalized = normalizeText(text);
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedKeyword.includes(' '))
        return normalized.includes(normalizedKeyword);
    // Plural-tolerant whole-word match: a single-word keyword also matches its regular
    // +s / +es plural (certification→certifications, grievance→grievances, supplier→suppliers).
    return new RegExp(`\\b${normalizedKeyword}(?:s|es)?\\b`, 'i').test(normalized);
}
// ============================================
// CSV Rule Matching
// ============================================
function tryCsvRules(text, csvRules) {
    for (const rule of csvRules) {
        try {
            if (rule.patternType === 'regex') {
                const re = new RegExp(rule.pattern);
                if (re.test(text)) {
                    return { metricKeys: rule.metricKeys, category: rule.category, promptIfMissing: rule.promptIfMissing };
                }
            }
            else {
                if (normalizeText(text).includes(normalizeText(rule.pattern))) {
                    return { metricKeys: rule.metricKeys, category: rule.category, promptIfMissing: rule.promptIfMissing };
                }
            }
        }
        catch {
            // Invalid regex — skip
        }
    }
    return null;
}
/**
 * Create a keyword matcher from domain-specific rules.
 * @param keywordRules - Keyword rules from the domain pack
 * @param domainSuggestions - Suggested data points per domain
 */
export function createMatcher(keywordRules, domainSuggestions, termAliases = []) {
    let csvMappingRules = [];
    // Confidence bands are relative to the pack's own weight scale. The ESG pack has
    // high-weight override rules (15/16/30), so 'high' means "hit a genuine override";
    // packs whose rules top out at 10 (security, product-ops-rfp) would otherwise never
    // reach 'high'. Cap at the absolute band so ESG keeps its calibrated 15/8, and floor
    // it to the pack's ceiling so lighter packs can still surface a top-band match.
    const maxRuleWeight = keywordRules.reduce((m, r) => Math.max(m, r.weight), 0);
    const highThreshold = Math.min(HIGH_CONFIDENCE_THRESHOLD, maxRuleWeight);
    const mediumThreshold = Math.min(MEDIUM_CONFIDENCE_THRESHOLD, highThreshold);
    // Normalization for alias detection. Beyond normalizeText, hyphens are folded to spaces so
    // a multi-word term matches hyphenated German compounds ('Lieferanten-Verhaltenskodex' →
    // 'lieferanten verhaltenskodex'). Umlauts (ä/ö/ü/ß) become spaces on both sides, so terms
    // with umlauts are matched consistently ('gefährlich' inside 'gefährlicher Abfall').
    const normalizeForAlias = (t) => normalizeText(t).replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    // Pre-normalize alias terms once.
    const normalizedAliases = termAliases
        .map(a => ({ term: normalizeForAlias(a.term), add: a.add }))
        .filter(a => a.term.length > 0);
    // Append the canonical English keyword(s) for any alias term present in the question, so
    // the English keyword rules can match a non-English questionnaire. Purely additive —
    // English-only questions never contain the alias terms, so they are unaffected.
    function expandWithAliases(text) {
        if (normalizedAliases.length === 0)
            return text;
        const normalized = normalizeForAlias(text);
        const additions = [];
        for (const alias of normalizedAliases) {
            if (normalized.includes(alias.term))
                additions.push(...alias.add);
        }
        return additions.length > 0 ? `${text} ${additions.join(' ')}` : text;
    }
    function matchQuestion(question) {
        const rawText = `${question.text} ${question.category || ''} ${question.subcategory || ''}`;
        // Honor an explicit GHG-scope EXCLUSION ("...Scope 1 only. Do not include Scope 2.") so a
        // single-scope question isn't pulled into the combined Scope 1+2 template by the excluded
        // scope's own token. Only strips a scope that is the direct object of an exclusion phrase —
        // a plain "Scope 1 and Scope 2" question keeps both. EN + DE cues.
        const baseText = rawText.replace(/\b(?:do(?:es)?\s+not\s+include|don'?t\s+include|not\s+including|excluding|without|except(?:\s+for)?|ohne|ausgenommen|exklusive|nicht\s+enthalten(?:d)?)\s+(?:the\s+|der\s+|die\s+|den\s+)?scope[\s-]?[123]\b/gi, ' ');
        // CSV rules match on the original text; keyword rules match on the alias-expanded text.
        const csvMatch = tryCsvRules(baseText, csvMappingRules);
        const text = expandWithAliases(baseText);
        const domainScores = new Map();
        const topicScores = {};
        for (const rule of keywordRules) {
            // Collect every keyword this rule matched, then credit the domain ONCE per rule
            // (mirroring topicScores below). Crediting per-keyword would inflate a domain's
            // score by its synonym count and let wordy questions overtake more specific rules.
            const matchedKeywords = [];
            for (const keyword of rule.keywords) {
                if (containsKeyword(text, keyword))
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
    function matchQuestions(questions) {
        return questions.map(matchQuestion);
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
        csvMappingRules = rules.sort((a, b) => a.priority - b.priority);
    }
    return { matchQuestion, matchQuestions, getMatchStatistics, setCsvRules };
}
//# sourceMappingURL=keywordMatcher.js.map
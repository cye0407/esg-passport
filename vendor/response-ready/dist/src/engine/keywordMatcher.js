// ============================================
// ResponseReady — Keyword Matcher (Domain-Agnostic)
// ============================================
// Matches questions to domains/topics using injectable keyword rules.
// No hardcoded rules — all domain knowledge comes from the DomainPack.
// ============================================
// Text Utilities
// ============================================
function normalizeText(text) {
    return text.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function containsKeyword(text, keyword) {
    const normalized = normalizeText(text);
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedKeyword.includes(' '))
        return normalized.includes(normalizedKeyword);
    return new RegExp(`\\b${normalizedKeyword}\\b`, 'i').test(normalized);
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
export function createMatcher(keywordRules, domainSuggestions) {
    let csvMappingRules = [];
    function matchQuestion(question) {
        const text = `${question.text} ${question.category || ''} ${question.subcategory || ''}`;
        const csvMatch = tryCsvRules(text, csvMappingRules);
        const domainScores = new Map();
        for (const rule of keywordRules) {
            for (const keyword of rule.keywords) {
                if (containsKeyword(text, keyword)) {
                    const existing = domainScores.get(rule.domain);
                    if (existing) {
                        existing.score += rule.weight;
                        rule.topics.forEach(t => existing.topics.add(t));
                        if (!existing.matchedKeywords.includes(keyword))
                            existing.matchedKeywords.push(keyword);
                    }
                    else {
                        domainScores.set(rule.domain, {
                            domain: rule.domain,
                            score: rule.weight,
                            topics: new Set(rule.topics),
                            matchedKeywords: [keyword],
                        });
                    }
                }
            }
        }
        const sortedDomains = Array.from(domainScores.values()).sort((a, b) => b.score - a.score);
        let confidence = 'none';
        if (sortedDomains.length > 0) {
            const topScore = sortedDomains[0].score;
            if (topScore >= 15)
                confidence = 'high';
            else if (topScore >= 8)
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
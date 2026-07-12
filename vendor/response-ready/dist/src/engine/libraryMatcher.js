// ============================================
// ResponseReady - Business Library Matcher
// ============================================
const DEFAULT_LIMIT = 5;
const DEFAULT_MIN_SCORE = 8;
const STOPWORDS = new Set([
    'and', 'are', 'can', 'for', 'has', 'have', 'how', 'our', 'the', 'this', 'that',
    'use', 'uses', 'using', 'what', 'with', 'you', 'your', 'we', 'who', 'why',
    'describe', 'please', 'provide', 'support', 'supports',
]);
function normalize(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}
function terms(values) {
    return [...new Set(values
            .filter((value) => typeof value === 'string' && value.trim().length > 0)
            .flatMap(value => normalize(value).split(/\s+/))
            .filter(value => value.length >= 3 && !STOPWORDS.has(value)))];
}
function includesTerm(haystack, needle) {
    const normalizedNeedle = normalize(needle);
    return haystack.some(term => term === normalizedNeedle);
}
function isExpired(item, today) {
    if (!item.expiresOn || !today)
        return false;
    return item.expiresOn < today;
}
function evidenceExpired(item, today) {
    if (!item.expiresOn || !today)
        return false;
    return item.expiresOn < today;
}
function evidenceFor(item, evidence = [], today) {
    if (!item.evidenceIds?.length)
        return [];
    const evidenceById = new Map(evidence.map(entry => [entry.id, entry]));
    return item.evidenceIds
        .map(id => evidenceById.get(id))
        .filter((entry) => !!entry && !evidenceExpired(entry, today));
}
function currentDate() {
    return new Date().toISOString().slice(0, 10);
}
function matchItem(question, match, item, evidence, options) {
    if (options.approvedOnly && item.approvalStatus !== 'approved')
        return null;
    if (isExpired(item, options.today))
        return null;
    const itemDomains = item.domains || [];
    const itemTopics = item.topics || [];
    const itemTags = item.tags || [];
    const itemTextTerms = terms([item.title, item.body, ...itemTags]);
    const questionTerms = terms([question.text, question.category, ...match.matchedKeywords, ...match.topics]);
    const matchedTerms = questionTerms.filter(term => includesTerm(itemTextTerms, term));
    const primaryDomainMatched = !!match.primaryDomain && itemDomains.includes(match.primaryDomain);
    const secondaryDomainMatches = match.secondaryDomains.filter(domain => itemDomains.includes(domain));
    const topicMatches = match.topics.filter(topic => itemTopics.includes(topic));
    const keywordMatches = match.matchedKeywords.filter((keyword) => itemTags.map(normalize).includes(normalize(keyword)));
    const hasTopicalRelevance = matchedTerms.length > 0 || topicMatches.length > 0 || keywordMatches.length > 0;
    let metadataScore = 0;
    if (primaryDomainMatched)
        metadataScore += 24;
    metadataScore += secondaryDomainMatches.length * 10;
    metadataScore += topicMatches.length * 10;
    metadataScore += keywordMatches.length * 6;
    const textOverlapScore = matchedTerms.length * 2;
    if (metadataScore === 0 && textOverlapScore < 6)
        return null;
    if ((primaryDomainMatched || secondaryDomainMatches.length > 0) && !hasTopicalRelevance)
        return null;
    let score = metadataScore + textOverlapScore;
    if (metadataScore > 0) {
        if (item.type === 'approved_answer')
            score += 4;
        if (item.approvalStatus === 'approved')
            score += 3;
        if (item.evidenceIds?.length)
            score += 2;
    }
    if (score < options.minScore)
        return null;
    const linkedEvidence = evidenceFor(item, evidence, options.today);
    return {
        item,
        score,
        matchedTerms,
        evidence: linkedEvidence,
        reason: [
            primaryDomainMatched ? `domain:${match.primaryDomain}` : undefined,
            topicMatches.length > 0 ? 'topic match' : undefined,
            matchedTerms.length > 0 ? `terms:${matchedTerms.slice(0, 5).join(',')}` : undefined,
        ].filter(Boolean).join('; ') || 'library metadata matched request context',
    };
}
export function findLibraryMatches(question, match, library, options = {}) {
    if (!library?.items?.length)
        return [];
    const resolvedOptions = {
        minScore: options.minScore ?? DEFAULT_MIN_SCORE,
        approvedOnly: options.approvedOnly ?? false,
        limit: options.limit ?? DEFAULT_LIMIT,
        today: options.enforceExpiry === false ? undefined : options.today ?? currentDate(),
    };
    return library.items
        .map(item => matchItem(question, match, item, library.evidence || [], resolvedOptions))
        .filter((item) => !!item)
        .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
        .slice(0, resolvedOptions.limit);
}
//# sourceMappingURL=libraryMatcher.js.map
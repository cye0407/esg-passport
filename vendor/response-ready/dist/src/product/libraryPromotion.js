function slug(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 72);
}
export function promoteWorkspaceItemToLibraryItem(item, options = {}) {
    const domain = item.match.primaryDomain || 'unmatched';
    const title = options.title || item.question.text.slice(0, 96);
    const sourceReferences = item.sourceReferences.length > 0 ? item.sourceReferences.join('; ') : undefined;
    return {
        id: options.id || `lib-${slug(domain)}-${slug(item.question.id || title)}`,
        title,
        type: options.type || 'approved_answer',
        body: item.draft.answer,
        tags: [...new Set([domain, ...item.match.topics, ...item.match.matchedKeywords])],
        domains: item.match.primaryDomain ? [item.match.primaryDomain, ...item.match.secondaryDomains] : item.match.secondaryDomains,
        topics: item.match.topics,
        owner: item.suggestedOwner,
        approvalStatus: options.approvalStatus || 'approved',
        source: options.source || sourceReferences,
        evidenceIds: item.libraryMatches.flatMap(match => match.evidence.map(evidence => evidence.id)),
        lastReviewedOn: options.reviewedOn,
        expiresOn: options.expiresOn,
        allowedUseNotes: options.allowedUseNotes || 'Promoted from a reviewed Response Ready workspace item.',
    };
}
//# sourceMappingURL=libraryPromotion.js.map
function norm(value) {
    return value.trim().toLowerCase();
}
function itemEvidence(item) {
    const retrievedEvidence = [
        ...item.draft.dataContext.company,
        ...item.draft.dataContext.operational,
        ...item.draft.dataContext.calculated,
    ]
        .filter(point => point.field.startsWith('evidence:'))
        .map(point => String(point.value));
    return [
        ...(item.draft.suggestedEvidence || []),
        item.draft.evidence,
        ...item.sourceReferences,
        ...retrievedEvidence,
    ].filter(value => value && value.trim().length > 0);
}
export function filterWorkspaceItems(workspace, filter = {}) {
    return workspace.items.filter(item => {
        if (filter.status && item.reviewStatus !== filter.status)
            return false;
        if (filter.owner && norm(item.suggestedOwner || '') !== norm(filter.owner))
            return false;
        if (filter.domain && item.match.primaryDomain !== filter.domain)
            return false;
        if (filter.hasLibraryMatch !== undefined && (item.libraryMatches.length > 0) !== filter.hasLibraryMatch)
            return false;
        if (filter.missingEvidence !== undefined && (itemEvidence(item).length === 0) !== filter.missingEvidence)
            return false;
        return true;
    });
}
export function groupWorkspaceItemsByOwner(workspace) {
    const groups = new Map();
    for (const item of workspace.items) {
        const owner = item.suggestedOwner || 'Unassigned';
        groups.set(owner, [...(groups.get(owner) || []), item]);
    }
    return [...groups.entries()]
        .map(([label, items]) => ({ key: norm(label), label, items }))
        .sort((a, b) => a.label.localeCompare(b.label));
}
export function groupWorkspaceItemsByDomain(workspace) {
    const groups = new Map();
    for (const item of workspace.items) {
        const domain = item.match.primaryDomain || 'unmatched';
        groups.set(domain, [...(groups.get(domain) || []), item]);
    }
    return [...groups.entries()]
        .map(([label, items]) => ({ key: label, label, items }))
        .sort((a, b) => a.label.localeCompare(b.label));
}
export function getWorkspaceRoutingSummary(workspace) {
    return {
        ready: filterWorkspaceItems(workspace, { status: 'ready' }).length,
        review: filterWorkspaceItems(workspace, { status: 'review' }).length,
        dataNeeded: filterWorkspaceItems(workspace, { status: 'data_needed' }).length,
        missingEvidence: filterWorkspaceItems(workspace, { missingEvidence: true }).length,
        noLibraryMatch: filterWorkspaceItems(workspace, { hasLibraryMatch: false }).length,
    };
}
//# sourceMappingURL=workspaceRouting.js.map
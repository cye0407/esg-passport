import { promoteWorkspaceItemToLibraryItem } from './libraryPromotion';
import { getWorkspaceRoutingSummary } from './workspaceRouting';
function slug(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 72);
}
function defaultProjectId(workspace) {
    return `project-${slug(workspace.playbook.id)}-${workspace.items.length}`;
}
function mergeLibraryItems(library, promoted) {
    const items = new Map();
    const evidence = new Map();
    for (const item of library.items)
        items.set(item.id, item);
    for (const item of promoted)
        items.set(item.id, item);
    for (const entry of library.evidence || [])
        evidence.set(entry.id, entry);
    return {
        items: [...items.values()],
        evidence: [...evidence.values()],
    };
}
export function createResponseProject(options) {
    return {
        id: options.id || defaultProjectId(options.workspace),
        title: options.title || options.workspace.playbook.label,
        workspace: options.workspace,
        library: options.library || { items: [] },
        extractedSources: options.extractedSources,
        decisions: options.decisions || [],
        promotedItemIds: options.promotedItemIds || [],
    };
}
export function applyReviewDecision(project, input) {
    const decision = {
        ...input,
        decidedAt: input.decidedAt || new Date().toISOString(),
    };
    return {
        ...project,
        decisions: [
            ...project.decisions.filter(existing => existing.itemId !== input.itemId),
            decision,
        ],
    };
}
export function latestDecisionForItem(project, item) {
    return project.decisions.find(decision => decision.itemId === item.question.id);
}
export function promoteApprovedItems(project, options = {}) {
    const promoted = [];
    const promotedIds = new Set(project.promotedItemIds);
    for (const item of project.workspace.items) {
        const decision = latestDecisionForItem(project, item);
        if (decision?.status !== 'approved')
            continue;
        if (promotedIds.has(item.question.id))
            continue;
        promoted.push(promoteWorkspaceItemToLibraryItem(item, {
            reviewedOn: decision.decidedAt.slice(0, 10),
            ...options,
        }));
        promotedIds.add(item.question.id);
    }
    return {
        ...project,
        library: mergeLibraryItems(project.library, promoted),
        promotedItemIds: [...promotedIds],
    };
}
export function getResponseProjectSummary(project) {
    const routing = getWorkspaceRoutingSummary(project.workspace);
    const approved = project.decisions.filter(decision => decision.status === 'approved').length;
    const needsInfo = project.decisions.filter(decision => decision.status === 'needs_info').length;
    const rejected = project.decisions.filter(decision => decision.status === 'rejected').length;
    return {
        totalItems: project.workspace.items.length,
        ready: routing.ready,
        review: routing.review,
        dataNeeded: routing.dataNeeded,
        approved,
        needsInfo,
        rejected,
        promoted: project.promotedItemIds.length,
        libraryItems: project.library.items.length,
        evidenceItems: project.library.evidence?.length || 0,
    };
}
//# sourceMappingURL=responseProject.js.map
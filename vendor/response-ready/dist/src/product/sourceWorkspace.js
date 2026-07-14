import { createPlaybookWorkspace } from './playbookWorkspace';
import { extractLibraryFromSourceDocuments } from './sourceExtraction';
function mergeLibraries(base, extracted) {
    const items = new Map();
    const evidence = new Map();
    for (const item of base?.items || [])
        items.set(item.id, item);
    for (const item of extracted.items)
        items.set(item.id, item);
    for (const entry of base?.evidence || [])
        evidence.set(entry.id, entry);
    for (const entry of extracted.evidence || [])
        evidence.set(entry.id, entry);
    return {
        items: [...items.values()],
        evidence: [...evidence.values()],
    };
}
export function createWorkspaceFromSources(playbook, pack, requestText, data, sources, options = {}) {
    const extracted = extractLibraryFromSourceDocuments(sources, options.sourceExtraction);
    const library = mergeLibraries(options.library, extracted.library);
    const workspace = createPlaybookWorkspace(playbook, pack, requestText, data, {
        config: options.config,
        library,
        profile: options.profile,
        today: options.today,
    });
    return {
        workspace,
        extracted,
        library,
    };
}
//# sourceMappingURL=sourceWorkspace.js.map
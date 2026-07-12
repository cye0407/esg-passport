import { createResponseEngine } from '../create';
import { findLibraryMatches } from '../engine/libraryMatcher';
export const DEFAULT_WORKSPACE_GENERATION_CONFIG = {
    useLLM: false,
    includeMethodology: false,
    includeAssumptions: true,
    includeLimitations: true,
    verbosity: 'standard',
    aggregateSites: false,
};
export function reviewStatusForDraft(draft) {
    if (draft.confidenceSource === 'unknown' || draft.hasDataGaps)
        return 'data_needed';
    if (draft.needsReview)
        return 'review';
    return 'ready';
}
export function ownerForDraft(draft) {
    const ownerPoint = [...draft.dataContext.operational, ...draft.dataContext.company]
        .find(point => point.field.startsWith('owner:'));
    return ownerPoint ? String(ownerPoint.value) : undefined;
}
export function sourceReferencesForMatches(matches) {
    return [...new Set(matches.flatMap(match => [
            match.item.source,
            ...match.evidence.map(evidence => evidence.title),
        ].filter((value) => !!value)))];
}
function hasFallbackRelevance(match) {
    return match.matchedTerms.length > 0 || match.reason.includes('topic match');
}
export function applyLibraryFallback(draft, matches) {
    const approvedAnswer = matches.find(match => match.item.approvalStatus === 'approved'
        && ['approved_answer', 'prior_response'].includes(match.item.type)
        && hasFallbackRelevance(match));
    if (!approvedAnswer || !draft.hasDataGaps)
        return draft;
    const references = sourceReferencesForMatches([approvedAnswer]);
    return {
        ...draft,
        answer: approvedAnswer.item.body,
        answerConfidence: draft.answerConfidence === 'none' ? 'medium' : draft.answerConfidence,
        confidenceSource: 'provided',
        suggestedEvidence: [...(draft.suggestedEvidence || []), ...references],
        evidence: references.join('; '),
        needsReview: true,
        hasDataGaps: false,
        assumptions: [
            ...(draft.assumptions || []),
            'Draft answer was matched from the response library and still requires owner review before submission.',
        ],
    };
}
export function buildWorkspaceMetrics(items) {
    const matchedDomains = {};
    for (const item of items) {
        const domain = item.match.primaryDomain || 'unmatched';
        matchedDomains[domain] = (matchedDomains[domain] || 0) + 1;
    }
    return {
        totalQuestions: items.length,
        readyCount: items.filter(item => item.reviewStatus === 'ready').length,
        reviewCount: items.filter(item => item.reviewStatus === 'review').length,
        dataNeededCount: items.filter(item => item.reviewStatus === 'data_needed').length,
        matchedDomains,
    };
}
export function createPlaybookWorkspace(playbook, pack, requestText, data, options = {}) {
    const config = options.config || DEFAULT_WORKSPACE_GENERATION_CONFIG;
    const engine = createResponseEngine(pack);
    const questions = engine.parseText(requestText);
    const matches = engine.matchQuestions(questions);
    const classifications = engine.classifyQuestions
        ? engine.classifyQuestions(questions.map(q => ({ id: q.id, text: q.text, category: q.category })))
        : undefined;
    const contexts = matches.map(match => engine.retrieveData(match, data));
    const drafts = engine.generateDrafts(questions, matches, contexts, config, options.profile, classifications);
    const items = questions.map((question, index) => {
        const libraryMatches = findLibraryMatches(question, matches[index], options.library, {
            approvedOnly: false,
            limit: 5,
            today: options.today,
        });
        const draft = applyLibraryFallback(drafts[index], libraryMatches);
        return {
            question,
            match: matches[index],
            draft,
            reviewStatus: reviewStatusForDraft(draft),
            suggestedOwner: ownerForDraft(draft),
            libraryMatches,
            sourceReferences: sourceReferencesForMatches(libraryMatches),
        };
    });
    return {
        playbook,
        packName: engine.packName,
        packVersion: engine.packVersion,
        requestText,
        data,
        items,
        metrics: buildWorkspaceMetrics(items),
    };
}
//# sourceMappingURL=playbookWorkspace.js.map
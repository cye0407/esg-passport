function join(values) {
    return [...new Set(values
            .filter((value) => typeof value === 'string' && value.trim().length > 0))]
        .join('; ');
}
function dataGapsFor(item) {
    return join(item.draft.dataContext.metadata.dataGaps);
}
function suggestedEvidenceFor(item) {
    const retrievedEvidence = [
        ...item.draft.dataContext.company,
        ...item.draft.dataContext.operational,
        ...item.draft.dataContext.calculated,
    ]
        .filter(point => point.field.startsWith('evidence:'))
        .map(point => String(point.value));
    return join([
        ...(item.draft.suggestedEvidence || []),
        item.draft.evidence,
        ...retrievedEvidence,
    ]);
}
export function buildResponseMatrixRows(workspace) {
    return workspace.items.map(item => ({
        questionId: item.question.id,
        question: item.question.text,
        answer: item.draft.answer,
        reviewStatus: item.reviewStatus,
        owner: item.suggestedOwner || '',
        domain: item.match.primaryDomain || 'unmatched',
        topics: item.match.topics.join('; '),
        confidence: item.draft.answerConfidence,
        confidenceSource: item.draft.confidenceSource,
        sources: join(item.sourceReferences),
        evidence: suggestedEvidenceFor(item),
    }));
}
export function buildMissingInfoRows(workspace) {
    return workspace.items
        .filter(item => item.reviewStatus === 'data_needed' || item.draft.hasDataGaps)
        .map(item => ({
        questionId: item.question.id,
        question: item.question.text,
        domain: item.match.primaryDomain || 'unmatched',
        owner: item.suggestedOwner || '',
        actionRequired: item.draft.promptForMissing || 'Collect missing data or confirm response owner.',
        dataGaps: dataGapsFor(item),
        promptForMissing: item.draft.promptForMissing || '',
    }));
}
export function buildEvidenceChecklistRows(workspace) {
    return workspace.items
        .filter(item => {
        const suggestedEvidence = suggestedEvidenceFor(item);
        return suggestedEvidence.length > 0 || item.sourceReferences.length > 0 || item.reviewStatus !== 'ready';
    })
        .map(item => {
        const suggestedEvidence = suggestedEvidenceFor(item);
        const sourceReferences = join(item.sourceReferences);
        return {
            questionId: item.question.id,
            question: item.question.text,
            reviewStatus: item.reviewStatus,
            owner: item.suggestedOwner || '',
            suggestedEvidence,
            sourceReferences,
            missingEvidence: suggestedEvidence.length === 0 && sourceReferences.length === 0,
        };
    });
}
export function buildWorkspaceExportSheets(workspace) {
    return [
        {
            name: 'Response Matrix',
            buildSheet: () => ({
                headers: ['QuestionID', 'Question', 'Answer', 'Review Status', 'Owner', 'Domain', 'Topics', 'Confidence', 'Confidence Source', 'Sources', 'Evidence'],
                rows: buildResponseMatrixRows(workspace).map(row => [
                    row.questionId,
                    row.question,
                    row.answer,
                    row.reviewStatus,
                    row.owner,
                    row.domain,
                    row.topics,
                    row.confidence,
                    row.confidenceSource,
                    row.sources,
                    row.evidence,
                ]),
                columnWidths: [12, 50, 70, 16, 20, 20, 28, 14, 18, 36, 36],
                style: 'table',
            }),
        },
        {
            name: 'Missing Info',
            buildSheet: () => ({
                headers: ['QuestionID', 'Question', 'Domain', 'Owner', 'Action Required', 'Data Gaps', 'Prompt'],
                rows: buildMissingInfoRows(workspace).map(row => [
                    row.questionId,
                    row.question,
                    row.domain,
                    row.owner,
                    row.actionRequired,
                    row.dataGaps,
                    row.promptForMissing,
                ]),
                columnWidths: [12, 55, 20, 20, 46, 46, 46],
                style: 'checklist',
            }),
        },
        {
            name: 'Evidence Checklist',
            buildSheet: () => ({
                headers: ['QuestionID', 'Question', 'Review Status', 'Owner', 'Suggested Evidence', 'Source References', 'Missing Evidence'],
                rows: buildEvidenceChecklistRows(workspace).map(row => [
                    row.questionId,
                    row.question,
                    row.reviewStatus,
                    row.owner,
                    row.suggestedEvidence,
                    row.sourceReferences,
                    row.missingEvidence ? 'Yes' : 'No',
                ]),
                columnWidths: [12, 55, 16, 20, 46, 46, 18],
                style: 'checklist',
            }),
        },
    ];
}
//# sourceMappingURL=workspaceArtifacts.js.map
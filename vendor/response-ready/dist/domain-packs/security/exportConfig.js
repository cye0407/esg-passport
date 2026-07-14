export const SECURITY_EXPORT_SHEETS = [
    {
        name: 'Security Answers',
        buildSheet: (drafts) => ({
            headers: ['Question', 'Answer Draft', 'Confidence', 'Review Needed', 'Evidence / Gaps'],
            rows: drafts.map(draft => [
                draft.questionText,
                draft.answer,
                draft.confidenceSource,
                draft.needsReview ? 'Yes' : 'No',
                draft.hasDataGaps ? draft.dataContext.metadata.dataGaps.join('; ') : draft.suggestedEvidence?.join('; ') || draft.evidence,
            ]),
            columnWidths: [55, 85, 16, 16, 48],
            style: 'table',
        }),
    },
    {
        name: 'Security Review',
        buildSheet: (drafts, metadata) => ({
            headers: ['Metric', 'Value'],
            rows: [
                [`${metadata.companyName || 'Security'} questionnaire workspace`, null],
                ['', null],
                ['Questions processed', drafts.length],
                ['Needs review', drafts.filter(draft => draft.needsReview).length],
                ['Data needed', drafts.filter(draft => draft.hasDataGaps || draft.confidenceSource === 'unknown').length],
                ['Provided answers', drafts.filter(draft => draft.confidenceSource === 'provided').length],
            ],
            columnWidths: [36, 20],
            style: 'summary',
        }),
    },
];
//# sourceMappingURL=exportConfig.js.map
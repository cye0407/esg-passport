export const PRODUCT_OPS_RFP_EXPORT_SHEETS = [
    {
        name: 'RFP Workspace',
        buildSheet: (drafts) => ({
            headers: ['Question', 'Answer Draft', 'Confidence', 'Owner / Evidence Needed'],
            rows: drafts.map(draft => [
                draft.questionText,
                draft.answer,
                draft.confidenceSource,
                draft.hasDataGaps ? draft.dataContext.metadata.dataGaps.join('; ') : draft.suggestedEvidence?.join('; ') || '',
            ]),
            columnWidths: [55, 80, 16, 45],
            style: 'table',
        }),
    },
    {
        name: 'Pilot Metrics',
        buildSheet: (drafts, metadata) => {
            const needsReview = drafts.filter(d => d.needsReview).length;
            const unknown = drafts.filter(d => d.confidenceSource === 'unknown').length;
            return {
                headers: ['Metric', 'Value'],
                rows: [
                    [`${metadata.companyName || 'Pilot'} RFP response workspace`, null],
                    ['', null],
                    ['Questions processed', drafts.length],
                    ['Needs review', needsReview],
                    ['Unknown / data required', unknown],
                    ['High confidence answers', drafts.filter(d => d.answerConfidence === 'high').length],
                ],
                columnWidths: [36, 20],
                style: 'summary',
            };
        },
    },
];
//# sourceMappingURL=exportConfig.js.map
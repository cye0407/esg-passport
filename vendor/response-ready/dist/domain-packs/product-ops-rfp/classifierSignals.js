export const PRODUCT_OPS_RFP_QUESTION_TYPES = ['CAPABILITY', 'EVIDENCE', 'PROCESS', 'ROADMAP'];
export const PRODUCT_OPS_RFP_DEFAULT_QUESTION_TYPE = 'CAPABILITY';
export const PRODUCT_OPS_RFP_CLASSIFIER_SIGNALS = [
    {
        type: 'CAPABILITY',
        patterns: [/do you support/i, /can your product/i, /does the platform/i],
        keywords: ['support', 'capability', 'feature', 'functionality', 'platform'],
        weight: 8,
    },
    {
        type: 'EVIDENCE',
        patterns: [/provide evidence/i, /attach/i, /documentation/i],
        keywords: ['evidence', 'documentation', 'certificate', 'screenshot', 'example'],
        weight: 8,
    },
    {
        type: 'PROCESS',
        patterns: [/describe your process/i, /how do you/i, /workflow/i],
        keywords: ['process', 'workflow', 'review', 'approval', 'onboarding'],
        weight: 7,
    },
    {
        type: 'ROADMAP',
        patterns: [/roadmap/i, /planned/i, /future/i, /coming/i],
        keywords: ['roadmap', 'planned', 'future', 'coming', 'timeline'],
        weight: 7,
    },
];
//# sourceMappingURL=classifierSignals.js.map
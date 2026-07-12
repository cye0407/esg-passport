export const SECURITY_QUESTION_TYPES = ['CONTROL', 'POLICY', 'EVIDENCE', 'INCIDENT', 'COMPLIANCE'];
export const SECURITY_DEFAULT_QUESTION_TYPE = 'CONTROL';
export const SECURITY_CLASSIFIER_SIGNALS = [
    {
        type: 'CONTROL',
        patterns: [/do you have/i, /do you support/i, /is .* enabled/i, /describe .* control/i],
        keywords: ['control', 'implemented', 'support', 'enabled', 'protect'],
        weight: 8,
    },
    {
        type: 'POLICY',
        patterns: [/policy/i, /procedure/i, /standard/i],
        keywords: ['policy', 'procedure', 'standard', 'process'],
        weight: 8,
    },
    {
        type: 'EVIDENCE',
        patterns: [/provide evidence/i, /attach/i, /documentation/i, /report/i],
        keywords: ['evidence', 'documentation', 'report', 'certificate', 'attestation'],
        weight: 8,
    },
    {
        type: 'INCIDENT',
        patterns: [/incident/i, /breach/i, /material security event/i],
        keywords: ['incident', 'breach', 'event', 'notification'],
        weight: 8,
    },
    {
        type: 'COMPLIANCE',
        patterns: [/soc 2/i, /iso 27001/i, /compliance/i, /audit/i],
        keywords: ['soc 2', 'iso 27001', 'compliance', 'audit', 'certification'],
        weight: 8,
    },
];
//# sourceMappingURL=classifierSignals.js.map
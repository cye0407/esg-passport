export const PRODUCT_OPS_RFP_KEYWORD_RULES = [
    {
        domain: 'research_management',
        topics: ['study_workflow', 'research_repository', 'participant_management'],
        keywords: ['research management', 'study', 'studies', 'research repository', 'insight repository', 'participant', 'recruiting'],
        weight: 10,
    },
    {
        domain: 'requirements_intake',
        topics: ['intake', 'triage', 'requirement_mapping'],
        keywords: ['intake', 'requirement', 'requirements', 'triage', 'request', 'submission', 'questionnaire'],
        weight: 9,
    },
    {
        domain: 'collaboration',
        topics: ['review_workflow', 'approvals', 'sme_handoff'],
        keywords: ['approval', 'review', 'collaboration', 'comment', 'handoff', 'stakeholder', 'subject matter expert', 'sme'],
        weight: 8,
    },
    {
        domain: 'reporting',
        topics: ['analytics', 'dashboards', 'exports'],
        keywords: ['report', 'reporting', 'analytics', 'dashboard', 'export', 'metrics', 'visibility'],
        weight: 8,
    },
    {
        domain: 'integrations',
        topics: ['api', 'crm', 'data_sync'],
        keywords: ['integration', 'integrate', 'api', 'crm', 'salesforce', 'hubspot', 'slack', 'sync', 'webhook'],
        weight: 7,
    },
    {
        domain: 'security',
        topics: ['access_control', 'data_protection', 'compliance'],
        keywords: ['security', 'permission', 'access control', 'sso', 'soc 2', 'gdpr', 'privacy', 'data protection'],
        weight: 7,
    },
    {
        domain: 'implementation',
        topics: ['onboarding', 'migration', 'customer_success'],
        keywords: ['implementation', 'onboarding', 'migration', 'training', 'customer success', 'deployment', 'rollout'],
        weight: 6,
    },
];
export const PRODUCT_OPS_RFP_DOMAIN_SUGGESTIONS = {
    research_management: ['Product capability summary', 'Research workflow evidence', 'Repository screenshots or docs'],
    requirements_intake: ['Intake workflow description', 'Requirement mapping rules', 'Response owner'],
    collaboration: ['Review process', 'Approval model', 'SME ownership map'],
    reporting: ['Dashboard examples', 'Export formats', 'Operational metrics'],
    integrations: ['Integration list', 'API documentation', 'CRM sync details'],
    security: ['Security documentation', 'Access control model', 'Compliance attestations'],
    implementation: ['Onboarding plan', 'Migration process', 'Support model'],
};
//# sourceMappingURL=keywordRules.js.map
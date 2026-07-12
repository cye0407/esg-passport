function values(dataMap, prefix) {
    return [...dataMap.values()].filter(point => point.field.startsWith(prefix));
}
function companyName(dataMap) {
    return String(dataMap.get('companyName')?.value || 'We');
}
function productName(dataMap) {
    return String(dataMap.get('productName')?.value || 'the product');
}
function capabilityAnswer(dataMap, domainLabel) {
    const capabilities = values(dataMap, 'capability:');
    if (capabilities.length === 0)
        return null;
    const statusesById = new Map(values(dataMap, 'status:').map(point => [point.field.replace('status:', ''), String(point.value)]));
    const supportedCapabilities = capabilities.filter(point => {
        const status = statusesById.get(point.field.replace('capability:', ''));
        return status === 'live' || status === 'partial' || !status;
    });
    const unsupportedCapabilities = capabilities.filter(point => {
        const status = statusesById.get(point.field.replace('capability:', ''));
        return status === 'planned' || status === 'not_supported';
    });
    const statuses = [...statusesById.values()];
    const statusSummary = statuses.length > 0 ? ` Current status: ${[...new Set(statuses)].join(', ')}.` : '';
    const proof = values(dataMap, 'proof:').map(point => String(point.value));
    const proofSentence = proof.length > 0 ? ` Supporting proof points include ${proof.join('; ')}.` : '';
    const opening = supportedCapabilities.length > 0
        ? `${companyName(dataMap)} supports this ${domainLabel} requirement through ${productName(dataMap)}. ${supportedCapabilities.map(point => String(point.value)).join(' ')}`
        : `${companyName(dataMap)} has not represented a currently supported ${domainLabel} capability for ${productName(dataMap)}.`;
    const unsupportedSummary = unsupportedCapabilities.length > 0
        ? ` Items not represented as currently supported capabilities: ${unsupportedCapabilities.map(point => {
            const id = point.field.replace('capability:', '');
            return `${point.label} (${statusesById.get(id) || 'review needed'}): ${point.value}`;
        }).join(' ')}`
        : '';
    return `${opening}${unsupportedSummary}${statusSummary}${proofSentence}`;
}
export const PRODUCT_OPS_RFP_ANSWER_TEMPLATES = [
    {
        domains: ['research_management'],
        topics: ['study_workflow', 'research_repository', 'participant_management'],
        generate: dataMap => capabilityAnswer(dataMap, 'research management'),
    },
    {
        domains: ['requirements_intake'],
        topics: ['intake', 'triage', 'requirement_mapping'],
        generate: dataMap => capabilityAnswer(dataMap, 'requirements intake and mapping'),
    },
    {
        domains: ['collaboration'],
        topics: ['review_workflow', 'approvals', 'sme_handoff'],
        generate: dataMap => capabilityAnswer(dataMap, 'cross-functional review'),
    },
    {
        domains: ['reporting'],
        topics: ['analytics', 'dashboards', 'exports'],
        generate: dataMap => capabilityAnswer(dataMap, 'reporting and visibility'),
    },
    {
        domains: ['integrations'],
        topics: ['api', 'crm', 'data_sync'],
        generate: dataMap => capabilityAnswer(dataMap, 'integration'),
    },
    {
        domains: ['security'],
        topics: ['access_control', 'data_protection', 'compliance'],
        generate: dataMap => capabilityAnswer(dataMap, 'security and governance'),
    },
    {
        domains: ['implementation'],
        topics: ['onboarding', 'migration', 'customer_success'],
        generate: dataMap => capabilityAnswer(dataMap, 'implementation'),
    },
];
//# sourceMappingURL=answerTemplates.js.map
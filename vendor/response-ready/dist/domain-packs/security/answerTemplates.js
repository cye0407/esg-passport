function values(dataMap, prefix) {
    return [...dataMap.values()].filter(point => point.field.startsWith(prefix));
}
function value(dataMap, key) {
    return String(dataMap.get(key)?.value || '');
}
function companyName(dataMap) {
    return value(dataMap, 'companyName') || 'We';
}
function productName(dataMap) {
    return value(dataMap, 'productName') || 'the service';
}
function controlAnswer(dataMap, domainLabel) {
    const controls = values(dataMap, 'control:');
    const policies = values(dataMap, 'policy:');
    const evidence = values(dataMap, 'evidence:').map(point => String(point.value));
    if (controls.length === 0 && policies.length === 0)
        return null;
    const statusesById = new Map(values(dataMap, 'status:').map(point => [point.field.replace('status:', ''), String(point.value)]));
    const activeControls = controls.filter(point => {
        const id = point.field.replace('control:', '');
        const status = statusesById.get(id);
        return status === 'implemented' || status === 'partial' || !status;
    });
    const inactiveControls = controls.filter(point => {
        const id = point.field.replace('control:', '');
        const status = statusesById.get(id);
        return status === 'planned' || status === 'not_implemented';
    });
    const opening = activeControls.length > 0 || policies.length > 0
        ? `${companyName(dataMap)} addresses ${domainLabel} for ${productName(dataMap)}`
        : `${companyName(dataMap)} has not represented implemented ${domainLabel} controls for ${productName(dataMap)}`;
    const activeSummary = activeControls.length > 0
        ? ` through ${activeControls.map(point => String(point.value)).join(' ')}`
        : policies.length > 0
            ? ' based on currently documented policies and review processes'
            : '';
    const inactiveSummary = inactiveControls.length > 0
        ? ` Items not represented as implemented controls: ${inactiveControls.map(point => {
            const id = point.field.replace('control:', '');
            return `${point.label} (${statusesById.get(id) || 'review needed'}): ${point.value}`;
        }).join(' ')}`
        : '';
    const statusSummary = statusesById.size > 0 ? ` Current implementation status: ${[...new Set(statusesById.values())].join(', ')}.` : '';
    const policySummary = policies.length > 0 ? ` Relevant policies/processes: ${policies.map(point => `${point.label}: ${point.value}`).join(' ')}` : '';
    const evidenceSummary = evidence.length > 0 ? ` Supporting evidence includes ${[...new Set(evidence)].join('; ')}.` : '';
    return `${opening}${activeSummary}.${inactiveSummary}${policySummary}${statusSummary}${evidenceSummary}`;
}
function complianceAnswer(dataMap) {
    const certifications = values(dataMap, 'certification:');
    if (certifications.length === 0)
        return controlAnswer(dataMap, 'security compliance and assurance');
    const scopes = values(dataMap, 'scope:').map(point => `${point.label}: ${point.value}`);
    const expirations = values(dataMap, 'expires:').map(point => `${point.label}: ${point.value}`);
    const evidence = values(dataMap, 'evidence:').map(point => String(point.value));
    return `${companyName(dataMap)} maintains security assurance information for ${productName(dataMap)}. ${certifications.map(point => `${point.label}: ${point.value}`).join(' ')}${scopes.length ? ` Scope details: ${scopes.join('; ')}.` : ''}${expirations.length ? ` Expiration details: ${expirations.join('; ')}.` : ''}${evidence.length ? ` Supporting evidence includes ${[...new Set(evidence)].join('; ')}.` : ''}`;
}
function incidentAnswer(dataMap) {
    const incidents = dataMap.get('materialIncidents');
    const responseProcess = controlAnswer(dataMap, 'incident response');
    if (!incidents)
        return responseProcess;
    const period = value(dataMap, 'incidentPeriod') || 'the reported period';
    const summary = value(dataMap, 'incidentSummary');
    const incidentSummary = `${companyName(dataMap)} tracks security incidents through its incident response process. For ${period}, material security incidents reported: ${incidents.value}.${summary ? ` ${summary}` : ''}`;
    return responseProcess ? `${responseProcess} ${incidentSummary}` : incidentSummary;
}
export const SECURITY_ANSWER_TEMPLATES = [
    {
        domains: ['access_control'],
        topics: ['role_based_access', 'least_privilege', 'user_access_review'],
        generate: dataMap => controlAnswer(dataMap, 'access control'),
    },
    {
        domains: ['identity'],
        topics: ['sso', 'mfa', 'authentication'],
        generate: dataMap => controlAnswer(dataMap, 'identity and authentication'),
    },
    {
        domains: ['data_protection'],
        topics: ['customer_data', 'data_handling', 'data_residency'],
        generate: dataMap => controlAnswer(dataMap, 'customer data protection'),
    },
    {
        domains: ['encryption'],
        topics: ['encryption_in_transit', 'encryption_at_rest', 'key_management'],
        generate: dataMap => controlAnswer(dataMap, 'encryption and key management'),
    },
    {
        domains: ['logging_monitoring'],
        topics: ['audit_logs', 'monitoring', 'alerting'],
        generate: dataMap => controlAnswer(dataMap, 'logging, monitoring, and alerting'),
    },
    {
        domains: ['incident_response'],
        topics: ['incident_response_plan', 'breach_notification', 'security_incidents'],
        generate: dataMap => incidentAnswer(dataMap),
    },
    {
        domains: ['business_continuity'],
        topics: ['backups', 'disaster_recovery', 'availability'],
        generate: dataMap => controlAnswer(dataMap, 'business continuity and recovery'),
    },
    {
        domains: ['vulnerability_management'],
        topics: ['vulnerability_scanning', 'penetration_testing', 'patching'],
        generate: dataMap => controlAnswer(dataMap, 'vulnerability management'),
    },
    {
        domains: ['compliance'],
        topics: ['soc_2', 'iso_27001', 'security_attestation'],
        generate: dataMap => complianceAnswer(dataMap),
    },
    {
        domains: ['privacy'],
        topics: ['privacy', 'gdpr', 'data_subject_rights'],
        generate: dataMap => controlAnswer(dataMap, 'privacy and data protection'),
    },
    {
        domains: ['vendor_risk'],
        topics: ['subprocessors', 'third_party_risk', 'vendor_review'],
        generate: dataMap => controlAnswer(dataMap, 'vendor and third-party risk management'),
    },
];
//# sourceMappingURL=answerTemplates.js.map
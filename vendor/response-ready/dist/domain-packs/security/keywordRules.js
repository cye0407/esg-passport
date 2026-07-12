export const SECURITY_KEYWORD_RULES = [
    {
        domain: 'access_control',
        topics: ['role_based_access', 'least_privilege', 'user_access_review'],
        keywords: ['access control', 'rbac', 'role based', 'least privilege', 'permissions', 'user access', 'access review'],
        weight: 10,
    },
    {
        domain: 'identity',
        topics: ['sso', 'mfa', 'authentication'],
        keywords: ['sso', 'single sign on', 'mfa', 'multi factor', 'authentication', 'identity provider', 'saml', 'oauth'],
        weight: 10,
    },
    {
        domain: 'data_protection',
        topics: ['customer_data', 'data_handling', 'data_residency'],
        keywords: ['data protection', 'customer data', 'sensitive data', 'data handling', 'data residency', 'data processing'],
        weight: 9,
    },
    {
        domain: 'encryption',
        topics: ['encryption_in_transit', 'encryption_at_rest', 'key_management'],
        keywords: ['encryption', 'encrypted', 'tls', 'at rest', 'in transit', 'key management', 'kms'],
        weight: 9,
    },
    {
        domain: 'logging_monitoring',
        topics: ['audit_logs', 'monitoring', 'alerting'],
        keywords: ['logging', 'logs', 'audit log', 'monitoring', 'alerting', 'siem', 'event log'],
        weight: 8,
    },
    {
        domain: 'incident_response',
        topics: ['incident_response_plan', 'breach_notification', 'security_incidents'],
        keywords: ['incident response', 'security incident', 'breach', 'breach notification', 'incident plan', 'postmortem'],
        weight: 9,
    },
    {
        domain: 'business_continuity',
        topics: ['backups', 'disaster_recovery', 'availability'],
        keywords: ['backup', 'backups', 'disaster recovery', 'business continuity', 'availability', 'rto', 'rpo'],
        weight: 8,
    },
    {
        domain: 'vulnerability_management',
        topics: ['vulnerability_scanning', 'penetration_testing', 'patching'],
        keywords: ['vulnerability', 'vulnerability scan', 'penetration test', 'pen test', 'patching', 'remediation'],
        weight: 9,
    },
    {
        domain: 'compliance',
        topics: ['soc_2', 'iso_27001', 'security_attestation'],
        keywords: ['soc 2', 'soc2', 'iso 27001', 'compliance', 'attestation', 'audit report', 'certification'],
        weight: 8,
    },
    {
        domain: 'privacy',
        topics: ['privacy', 'gdpr', 'data_subject_rights'],
        keywords: ['privacy', 'gdpr', 'ccpa', 'data subject', 'personal data', 'subprocessor', 'dpa'],
        weight: 8,
    },
    {
        domain: 'vendor_risk',
        topics: ['subprocessors', 'third_party_risk', 'vendor_review'],
        keywords: ['vendor risk', 'third party', 'subprocessor', 'supplier security', 'vendor review', 'due diligence'],
        weight: 7,
    },
];
export const SECURITY_DOMAIN_SUGGESTIONS = {
    access_control: ['Access control policy', 'Role model', 'User access review evidence'],
    identity: ['SSO/MFA configuration', 'Identity provider details', 'Authentication policy'],
    data_protection: ['Data handling description', 'Data classification', 'Data residency notes'],
    encryption: ['Encryption standards', 'TLS configuration', 'Key management evidence'],
    logging_monitoring: ['Logging architecture', 'Monitoring/alerting process', 'Audit log retention'],
    incident_response: ['Incident response plan', 'Breach notification process', 'Incident history'],
    business_continuity: ['Backup process', 'Disaster recovery plan', 'RTO/RPO targets'],
    vulnerability_management: ['Vulnerability management policy', 'Pen test summary', 'Patch process'],
    compliance: ['SOC 2 report', 'ISO 27001 certificate', 'Audit scope'],
    privacy: ['Privacy policy', 'DPA', 'Subprocessor list'],
    vendor_risk: ['Vendor review process', 'Subprocessor controls', 'Third-party risk evidence'],
};
//# sourceMappingURL=keywordRules.js.map
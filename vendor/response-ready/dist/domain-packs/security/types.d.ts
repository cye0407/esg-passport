export type SecurityControlStatus = 'implemented' | 'partial' | 'planned' | 'not_implemented';
export interface SecurityControl {
    id: string;
    name: string;
    domain: string;
    status: SecurityControlStatus;
    summary: string;
    owner?: string;
    evidence?: string[];
    scope?: string;
    roadmapNote?: string;
}
export interface SecurityPolicy {
    id: string;
    name: string;
    domain: string;
    summary: string;
    owner?: string;
    evidence?: string[];
    lastReviewedOn?: string;
}
export interface SecurityCertification {
    id: string;
    name: string;
    status: 'active' | 'in_progress' | 'expired' | 'not_applicable';
    scope?: string;
    evidence?: string[];
    expiresOn?: string;
}
export interface SecurityIncidentSummary {
    period: string;
    materialIncidents: number;
    summary?: string;
    owner?: string;
}
export interface SecurityQuestionnaireData {
    companyName: string;
    productName?: string;
    securityOwner?: string;
    hostingModel?: string;
    sensitiveData?: string;
    controls: SecurityControl[];
    policies?: SecurityPolicy[];
    certifications?: SecurityCertification[];
    incidentSummary?: SecurityIncidentSummary;
}
//# sourceMappingURL=types.d.ts.map
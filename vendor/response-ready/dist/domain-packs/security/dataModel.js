import { deduplicatePoints } from '../../src/engine/dataRetrieval';
function point(domain, field, label, value, confidence = 'high') {
    return { domain, field, label, value, confidence };
}
function controlText(control) {
    const pieces = [control.summary];
    if (control.scope)
        pieces.push(`Scope: ${control.scope}`);
    if (control.roadmapNote)
        pieces.push(`Roadmap note: ${control.roadmapNote}`);
    return pieces.join(' ');
}
function controlConfidence(control) {
    if (control.status === 'implemented')
        return 'high';
    if (control.status === 'partial')
        return 'medium';
    return 'low';
}
function currentDate() {
    return new Date().toISOString().slice(0, 10);
}
function addControl(points, control) {
    const confidence = controlConfidence(control);
    points.push(point(control.domain, `control:${control.id}`, control.name, controlText(control), confidence));
    points.push(point(control.domain, `status:${control.id}`, `${control.name} Status`, control.status, confidence));
    if (control.owner)
        points.push(point(control.domain, `owner:${control.id}`, `${control.name} Owner`, control.owner, confidence));
    if (control.evidence?.length)
        points.push(point(control.domain, `evidence:${control.id}`, `${control.name} Evidence`, control.evidence.join('; '), confidence));
}
function addPolicy(points, policy) {
    points.push(point(policy.domain, `policy:${policy.id}`, policy.name, policy.summary));
    if (policy.owner)
        points.push(point(policy.domain, `owner:policy:${policy.id}`, `${policy.name} Owner`, policy.owner));
    if (policy.evidence?.length)
        points.push(point(policy.domain, `evidence:policy:${policy.id}`, `${policy.name} Evidence`, policy.evidence.join('; ')));
    if (policy.lastReviewedOn)
        points.push(point(policy.domain, `reviewed:${policy.id}`, `${policy.name} Last Reviewed`, policy.lastReviewedOn));
}
function addCertification(points, certification) {
    const effectiveStatus = certification.expiresOn && certification.expiresOn < currentDate()
        ? 'expired'
        : certification.status;
    const confidence = effectiveStatus === 'active' ? 'high' : effectiveStatus === 'in_progress' ? 'medium' : 'low';
    points.push(point('compliance', `certification:${certification.id}`, certification.name, effectiveStatus, confidence));
    if (certification.scope)
        points.push(point('compliance', `scope:${certification.id}`, `${certification.name} Scope`, certification.scope, confidence));
    if (certification.evidence?.length)
        points.push(point('compliance', `evidence:${certification.id}`, `${certification.name} Evidence`, certification.evidence.join('; '), confidence));
    if (certification.expiresOn)
        points.push(point('compliance', `expires:${certification.id}`, `${certification.name} Expires`, certification.expiresOn, confidence));
}
export function securityRetrieveData(matchResult, data) {
    const domains = [matchResult.primaryDomain, ...matchResult.secondaryDomains].filter((domain) => !!domain);
    const company = [
        point('company', 'companyName', 'Company Name', data.companyName),
    ];
    const operational = [];
    const dataGaps = [];
    if (data.productName)
        company.push(point('company', 'productName', 'Product Name', data.productName));
    if (data.securityOwner)
        company.push(point('company', 'securityOwner', 'Security Owner', data.securityOwner));
    if (data.hostingModel)
        company.push(point('hosting', 'hostingModel', 'Hosting Model', data.hostingModel));
    if (data.sensitiveData)
        company.push(point('data_protection', 'sensitiveData', 'Sensitive Data', data.sensitiveData));
    for (const domain of domains) {
        const controls = data.controls.filter(control => control.domain === domain);
        const policies = (data.policies || []).filter(policy => policy.domain === domain);
        for (const control of controls)
            addControl(operational, control);
        for (const policy of policies)
            addPolicy(operational, policy);
        for (const control of controls) {
            if (control.status === 'planned' || control.status === 'not_implemented') {
                dataGaps.push(`${control.name} is ${control.status.replace('_', ' ')} for ${domain}; confirm response wording before submission`);
            }
        }
        if (domain === 'compliance') {
            for (const certification of data.certifications || []) {
                addCertification(operational, certification);
                if (certification.expiresOn && certification.expiresOn < currentDate()) {
                    dataGaps.push(`${certification.name} expired on ${certification.expiresOn}; confirm current assurance status before submission`);
                }
            }
        }
        if (domain === 'incident_response' && data.incidentSummary) {
            operational.push(point('incident_response', 'incidentPeriod', 'Incident Reporting Period', data.incidentSummary.period));
            operational.push(point('incident_response', 'materialIncidents', 'Material Security Incidents', data.incidentSummary.materialIncidents));
            if (data.incidentSummary.summary)
                operational.push(point('incident_response', 'incidentSummary', 'Incident Summary', data.incidentSummary.summary));
            if (data.incidentSummary.owner)
                operational.push(point('incident_response', 'owner:incidentSummary', 'Incident Owner', data.incidentSummary.owner));
        }
        if (controls.length === 0 && policies.length === 0) {
            const hasCompliance = domain === 'compliance' && (data.certifications || []).length > 0;
            const hasIncident = domain === 'incident_response' && !!data.incidentSummary;
            if (!hasCompliance && !hasIncident) {
                dataGaps.push(`No security control, policy, certification, or incident data is mapped to ${domain}`);
            }
        }
    }
    return {
        company: deduplicatePoints(company),
        operational: deduplicatePoints(operational),
        calculated: [],
        metadata: {
            sitesIncluded: [],
            dataGaps,
        },
    };
}
//# sourceMappingURL=dataModel.js.map
import { deduplicatePoints } from '../../src/engine/dataRetrieval';
function asPoint(domain, field, label, value, confidence = 'high') {
    return { domain, field, label, value, confidence };
}
function capabilityText(capability) {
    const pieces = [capability.summary];
    if (capability.reusableLanguage)
        pieces.push(capability.reusableLanguage);
    if (capability.roadmapNote)
        pieces.push(`Roadmap note: ${capability.roadmapNote}`);
    return pieces.join(' ');
}
export function productOpsRfpRetrieveData(matchResult, data) {
    const domains = [matchResult.primaryDomain, ...matchResult.secondaryDomains].filter((d) => !!d);
    const company = [
        asPoint('company', 'companyName', 'Company Name', data.companyName),
        asPoint('company', 'productName', 'Product Name', data.productName),
    ];
    const operational = [];
    const dataGaps = [];
    if (data.productSummary)
        company.push(asPoint('company', 'productSummary', 'Product Summary', data.productSummary));
    if (data.positioning)
        company.push(asPoint('company', 'positioning', 'Positioning', data.positioning));
    if (data.implementationModel)
        company.push(asPoint('implementation', 'implementationModel', 'Implementation Model', data.implementationModel));
    if (data.supportModel)
        company.push(asPoint('implementation', 'supportModel', 'Support Model', data.supportModel));
    for (const domain of domains) {
        const matchingCapabilities = data.capabilities.filter(c => c.domain === domain);
        for (const capability of matchingCapabilities) {
            const confidence = capability.status === 'live' ? 'high' : capability.status === 'partial' ? 'medium' : 'low';
            operational.push(asPoint(domain, `capability:${capability.id}`, capability.name, capabilityText(capability), confidence));
            operational.push(asPoint(domain, `status:${capability.id}`, `${capability.name} Status`, capability.status, confidence));
            if (capability.owner)
                operational.push(asPoint(domain, `owner:${capability.id}`, `${capability.name} Owner`, capability.owner, confidence));
            if (capability.evidence?.length) {
                operational.push(asPoint(domain, `evidence:${capability.id}`, `${capability.name} Evidence`, capability.evidence.join('; '), confidence));
            }
            if (capability.status === 'planned' || capability.status === 'not_supported') {
                dataGaps.push(`${capability.name} is ${capability.status.replace('_', ' ')} for ${domain}; confirm response wording before submission`);
            }
        }
        const proofPoints = data.proofPoints?.filter(p => p.domain === domain) || [];
        for (const proofPoint of proofPoints) {
            operational.push(asPoint(domain, `proof:${proofPoint.name}`, proofPoint.name, proofPoint.description));
        }
        if (matchingCapabilities.length === 0 && proofPoints.length === 0) {
            dataGaps.push(`No product capability or proof point is mapped to ${domain}`);
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
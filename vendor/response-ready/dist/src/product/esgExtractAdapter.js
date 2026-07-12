const FIELD_LABELS = {
    electricityKwh: 'Electricity Use',
    renewablePercent: 'Renewable Electricity',
    naturalGasKwh: 'Natural Gas Use',
    dieselLiters: 'Diesel Use',
    waterM3: 'Water Use',
    totalWasteKg: 'Total Waste',
    recycledWasteKg: 'Recycled Waste',
    hazardousWasteKg: 'Hazardous Waste',
    recyclingRate: 'Recycling Rate',
    totalEmployees: 'Employee Count',
    femalePercent: 'Female Workforce Share',
    malePercent: 'Male Workforce Share',
    trainingHours: 'Training Hours',
};
const FIELD_TOPICS = {
    electricityKwh: ['energy', 'electricity'],
    renewablePercent: ['energy', 'renewable_energy'],
    naturalGasKwh: ['energy', 'natural_gas'],
    dieselLiters: ['energy', 'fleet_fuel'],
    waterM3: ['water'],
    totalWasteKg: ['waste'],
    recycledWasteKg: ['waste', 'recycling'],
    hazardousWasteKg: ['waste', 'hazardous_waste'],
    recyclingRate: ['waste', 'recycling'],
    totalEmployees: ['workforce'],
    femalePercent: ['workforce', 'diversity'],
    malePercent: ['workforce', 'diversity'],
    trainingHours: ['workforce', 'training'],
};
function slug(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}
function domainForField(field) {
    const topics = FIELD_TOPICS[field] || [];
    if (topics.includes('energy'))
        return 'sustainability';
    if (topics.includes('water'))
        return 'sustainability';
    if (topics.includes('waste'))
        return 'sustainability';
    if (topics.includes('workforce'))
        return 'workforce';
    return 'sustainability';
}
function labelForField(field) {
    return FIELD_LABELS[field] || field.replace(/([a-z])([A-Z])/g, '$1 $2');
}
function fieldValue(field) {
    const value = field.normalizedValue ?? field.value;
    const unit = field.normalizedUnit || field.unit;
    return unit ? `${value} ${unit}` : String(value);
}
function fieldToLibraryItem(sourceId, field, options) {
    const label = labelForField(field.field);
    const topics = FIELD_TOPICS[field.field] || [slug(field.field)];
    const domain = domainForField(field.field);
    return {
        id: `${sourceId}-${slug(field.field)}-${slug(field.period || 'period')}`,
        title: `${label} from ${options.sourceName}`,
        type: 'metric',
        body: `${label}: ${fieldValue(field)}${field.period ? ` (${field.period})` : ''}`,
        tags: ['esg-extract', 'source_extract', ...topics, field.confidence],
        domains: [domain],
        topics,
        approvalStatus: field.confidence === 'low' ? 'needs_review' : options.approvalStatus,
        source: field.source?.rawText,
        evidenceIds: [sourceId],
        lastReviewedOn: options.reviewedOn,
        allowedUseNotes: 'Imported from esg-extract output; review before external submission.',
    };
}
export function libraryFromEsgExtractionResult(result, options = {}) {
    const sourceName = options.sourceName || result.provider || result.documentType || 'ESG source document';
    const sourceId = options.sourceId || `esg-extract-${slug(sourceName)}-${slug(result.period || 'source')}`;
    const approvalStatus = options.approvalStatus || 'draft';
    const evidence = {
        id: sourceId,
        title: sourceName,
        type: 'report',
        tags: ['esg-extract', result.documentType, ...(result.provider ? [result.provider] : [])],
        notes: [
            `Imported from esg-extract ${result.documentType}.`,
            result.period ? `Period: ${result.period}.` : undefined,
            result.warnings?.length ? `Warnings: ${result.warnings.join('; ')}` : undefined,
            result.gaps?.length ? `Gaps: ${result.gaps.join('; ')}` : undefined,
        ].filter(Boolean).join(' '),
    };
    return {
        evidence: [evidence],
        items: result.fields.map(field => fieldToLibraryItem(sourceId, field, {
            ...options,
            approvalStatus,
            sourceName,
        })),
    };
}
export function mergeResponseLibraries(...libraries) {
    const evidenceById = new Map();
    const itemsById = new Map();
    for (const library of libraries) {
        for (const evidence of library.evidence || [])
            evidenceById.set(evidence.id, evidence);
        for (const item of library.items)
            itemsById.set(item.id, item);
    }
    return {
        evidence: [...evidenceById.values()],
        items: [...itemsById.values()],
    };
}
//# sourceMappingURL=esgExtractAdapter.js.map
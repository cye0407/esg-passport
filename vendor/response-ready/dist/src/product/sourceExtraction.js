function slug(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}
function normalize(text) {
    return text.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').trim();
}
function firstMatch(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1])
            return match[1].trim();
    }
    return undefined;
}
function amountMatch(text) {
    return firstMatch(text, [
        /(?:amount due|total due|balance due|total amount|invoice total)\s*[:#]?\s*([$€£]?\s?[\d,]+(?:\.\d{2})?)/i,
        /(?:total)\s*[:#]?\s*([$€£]\s?[\d,]+(?:\.\d{2})?)/i,
    ]);
}
function parseNumber(value) {
    return Number(value.replace(/,/g, ''));
}
function detectKind(text) {
    const lower = text.toLowerCase();
    if (/(electric|electricity|kwh|gas|therm|water|utility)/.test(lower))
        return 'utility_bill';
    if (/(waste|recycling|landfill|disposal|hauling)/.test(lower))
        return 'waste_bill';
    if (/(telecom|internet|broadband|phone|mobile|data plan)/.test(lower))
        return 'telecom_bill';
    if (/(insurance|policy premium|coverage period|liability)/.test(lower))
        return 'insurance_bill';
    if (/(cloud|aws|azure|gcp|hosting|compute|storage)/.test(lower))
        return 'cloud_bill';
    if (/(invoice|amount due|balance due|bill to)/.test(lower))
        return 'invoice';
    return 'unknown';
}
function kindTags(kind) {
    return kind.split('_').filter(Boolean);
}
function domainForKind(kind) {
    if (kind === 'utility_bill' || kind === 'waste_bill')
        return 'sustainability';
    if (kind === 'telecom_bill' || kind === 'cloud_bill')
        return 'operations';
    if (kind === 'insurance_bill')
        return 'risk';
    return 'finance';
}
function evidenceTypeForKind(kind) {
    if (kind === 'insurance_bill')
        return 'certificate';
    return 'other';
}
function extractFacts(text, kind) {
    const domain = domainForKind(kind);
    const tags = ['bill', ...kindTags(kind)];
    const facts = [];
    const vendor = firstMatch(text, [
        /(?:vendor|supplier|provider|from)\s*[:#]?\s*([A-Z][A-Za-z0-9 &.,'-]{2,80})/i,
        /^([A-Z][A-Za-z0-9 &.,'-]{2,80})(?:\n|$)/,
    ]);
    const accountNumber = firstMatch(text, [/(?:account number|account no\.?|acct\.?)\s*[:#]?\s*([A-Za-z0-9-]+)/i]);
    const invoiceNumber = firstMatch(text, [/(?:invoice number|invoice no\.?|invoice #)\s*[:#]?\s*([A-Za-z0-9-]+)/i]);
    const billingPeriod = firstMatch(text, [/(?:billing period|service period|coverage period)\s*[:#]?\s*([A-Za-z0-9,./ -]+?)(?:\n|$)/i]);
    const dueDate = firstMatch(text, [/(?:due date|payment due)\s*[:#]?\s*([A-Za-z0-9,./ -]+?)(?:\n|$)/i]);
    const totalAmount = amountMatch(text);
    const entries = [
        ['Vendor', vendor, ['vendor']],
        ['Account Number', accountNumber, ['account']],
        ['Invoice Number', invoiceNumber, ['invoice']],
        ['Billing Period', billingPeriod, ['billing_period']],
        ['Due Date', dueDate, ['due_date']],
        ['Total Amount', totalAmount, ['amount_due']],
    ];
    for (const [label, value, topics] of entries) {
        if (!value)
            continue;
        facts.push({
            label,
            value,
            domain,
            topics: [...topics],
            tags: [...tags, ...topics],
        });
    }
    return facts;
}
function extractMetrics(text, kind) {
    const domain = domainForKind(kind);
    const baseTags = ['bill', ...kindTags(kind)];
    const metrics = [];
    const patterns = [
        { label: 'Electricity Use', unit: 'kWh', topics: ['energy', 'electricity'], pattern: /([\d,]+(?:\.\d+)?)\s*kwh\b/i },
        { label: 'Natural Gas Use', unit: 'therms', topics: ['energy', 'natural_gas'], pattern: /([\d,]+(?:\.\d+)?)\s*therms?\b/i },
        { label: 'Water Use', unit: 'gallons', topics: ['water'], pattern: /([\d,]+(?:\.\d+)?)\s*(?:gallons|gal)\b/i },
        { label: 'Water Use', unit: 'm3', topics: ['water'], pattern: /([\d,]+(?:\.\d+)?)\s*(?:m3|cubic meters)\b/i },
        { label: 'Waste', unit: 'tons', topics: ['waste'], pattern: /([\d,]+(?:\.\d+)?)\s*tons?\b/i },
        { label: 'Waste', unit: 'kg', topics: ['waste'], pattern: /([\d,]+(?:\.\d+)?)\s*kg\b/i },
        { label: 'Cloud Storage', unit: 'GB', topics: ['cloud', 'storage'], pattern: /([\d,]+(?:\.\d+)?)\s*gb\b/i },
    ];
    for (const candidate of patterns) {
        const match = text.match(candidate.pattern);
        if (!match?.[1])
            continue;
        metrics.push({
            label: candidate.label,
            value: parseNumber(match[1]),
            unit: candidate.unit,
            domain,
            topics: candidate.topics,
            tags: [...baseTags, ...candidate.topics, candidate.unit.toLowerCase()],
        });
    }
    return metrics;
}
function factToLibraryItem(sourceId, sourceName, fact, options) {
    return {
        id: `${sourceId}-fact-${slug(fact.label)}`,
        title: `${fact.label} from ${sourceName}`,
        type: fact.label === 'Total Amount' ? 'metric' : 'company_fact',
        body: `${fact.label}: ${fact.value}`,
        tags: fact.tags,
        domains: [fact.domain],
        topics: fact.topics,
        approvalStatus: options.approvalStatus,
        evidenceIds: [sourceId],
        lastReviewedOn: options.reviewedOn,
        allowedUseNotes: 'Extracted from source document text; review before external submission.',
    };
}
function metricToLibraryItem(sourceId, sourceName, metric, options) {
    return {
        id: `${sourceId}-metric-${slug(metric.label)}-${slug(metric.unit)}`,
        title: `${metric.label} from ${sourceName}`,
        type: 'metric',
        body: `${metric.label}: ${metric.value} ${metric.unit}`,
        tags: metric.tags,
        domains: [metric.domain],
        topics: metric.topics,
        approvalStatus: options.approvalStatus,
        evidenceIds: [sourceId],
        lastReviewedOn: options.reviewedOn,
        allowedUseNotes: 'Extracted from source document text; review before external submission.',
    };
}
export function extractLibraryFromSourceDocuments(sources, options = {}) {
    const resolved = {
        approvalStatus: options.approvalStatus || 'draft',
        reviewedOn: options.reviewedOn,
    };
    const evidence = [];
    const items = [];
    const documents = [];
    for (const [index, source] of sources.entries()) {
        const text = normalize(source.text);
        const kind = detectKind(text);
        const sourceId = source.id || `source-${index + 1}-${slug(source.name)}`;
        const facts = extractFacts(text, kind);
        const metrics = extractMetrics(text, kind);
        evidence.push({
            id: sourceId,
            title: source.name,
            type: evidenceTypeForKind(kind),
            tags: ['source', ...kindTags(kind)],
            notes: `${kind.replace('_', ' ')} source text extracted for response library use.`,
        });
        for (const fact of facts)
            items.push(factToLibraryItem(sourceId, source.name, fact, resolved));
        for (const metric of metrics)
            items.push(metricToLibraryItem(sourceId, source.name, metric, resolved));
        documents.push({
            sourceId,
            name: source.name,
            kind,
            facts,
            metrics,
        });
    }
    return {
        library: { evidence, items },
        documents,
    };
}
//# sourceMappingURL=sourceExtraction.js.map
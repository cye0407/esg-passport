// ============================================
// ESG Domain Pack — Export Sheet Definitions
// ============================================
// Custom Excel export sheets for ESG questionnaire responses.
// ============================================
// Helpers
// ============================================
function mapConfidenceLabel(draft) {
    switch (draft.confidenceSource) {
        case 'provided': return 'Provided';
        case 'estimated': return 'Estimated';
        case 'unknown': return 'Unknown';
        default: return 'Unknown';
    }
}
function fmt(n, decimals = 0) {
    if (n === null || n === undefined || n === '')
        return '\u2014';
    const num = typeof n === 'string' ? parseFloat(n) : n;
    if (isNaN(num))
        return '\u2014';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
// ============================================
// 1. Executive Summary — narrative text
// ============================================
function buildExecutiveSummary(drafts, metadata) {
    const ex = metadata.extra || {};
    const company = metadata.companyName || 'The company';
    const total = drafts.length;
    const provided = drafts.filter(d => d.confidenceSource === 'provided').length;
    const estimated = drafts.filter(d => d.confidenceSource === 'estimated').length;
    const unknown = drafts.filter(d => d.confidenceSource === 'unknown').length;
    const dataBacked = provided + estimated;
    const pct = total > 0 ? Math.round((dataBacked / total) * 100) : 0;
    // Build narrative paragraphs
    const paras = [];
    // Opening
    const frameworkStr = metadata.framework ? ` in response to the ${metadata.framework}` : '';
    const periodStr = metadata.reportingPeriod ? ` for the ${metadata.reportingPeriod} reporting period` : '';
    paras.push(`This document contains the ESG questionnaire responses submitted by ${company}${frameworkStr}${periodStr}. ` +
        `${total} questions were addressed, of which ${dataBacked} (${pct}%) are supported by tracked company data.`);
    // Company context
    const contextParts = [];
    if (ex.industry)
        contextParts.push(`operates in the ${ex.industry} sector`);
    if (ex.country)
        contextParts.push(`is headquartered in ${ex.country}`);
    if (ex.employeeCount)
        contextParts.push(`employs ${fmt(ex.employeeCount)} people`);
    if (ex.numberOfSites && ex.numberOfSites > 1)
        contextParts.push(`across ${ex.numberOfSites} facilities`);
    if (contextParts.length > 0) {
        paras.push(`${company} ${contextParts.join(', ')}.`);
    }
    // Environmental highlights
    const envParts = [];
    if (ex.scope1Tco2e != null || ex.scope2Tco2e != null) {
        const s1 = ex.scope1Tco2e != null ? fmt(ex.scope1Tco2e, 1) : null;
        const s2 = ex.scope2Tco2e != null ? fmt(ex.scope2Tco2e, 1) : null;
        if (s1 && s2) {
            envParts.push(`reported Scope 1 emissions of ${s1} tCO\u2082e and Scope 2 emissions of ${s2} tCO\u2082e`);
        }
        else if (s1) {
            envParts.push(`reported Scope 1 emissions of ${s1} tCO\u2082e`);
        }
        else if (s2) {
            envParts.push(`reported Scope 2 emissions of ${s2} tCO\u2082e`);
        }
    }
    if (ex.electricityKwh)
        envParts.push(`total energy consumption of ${fmt(ex.electricityKwh)} kWh`);
    if (ex.renewablePercent != null)
        envParts.push(`${fmt(ex.renewablePercent)}% renewable energy share`);
    if (ex.recyclingPercent != null)
        envParts.push(`a ${fmt(ex.recyclingPercent)}% waste recycling rate`);
    if (envParts.length > 0) {
        paras.push(`Key environmental data includes: ${envParts.join(', ')}.`);
    }
    // Policies
    const policyNames = [];
    const policyList = ex.policyNames;
    if (policyList) {
        policyNames.push(...policyList.split('|').filter(Boolean));
    }
    if (policyNames.length > 0) {
        paras.push(`The company has ${policyNames.length} documented polic${policyNames.length === 1 ? 'y' : 'ies'} in place, ` +
            `including ${policyNames.slice(0, 3).join(', ')}${policyNames.length > 3 ? `, and ${policyNames.length - 3} more` : ''}.`);
    }
    // Gaps
    if (unknown > 0) {
        paras.push(`${unknown} question${unknown === 1 ? '' : 's'} could not be answered with available data. ` +
            `These are flagged in the Answers sheet and detailed in the Review Checklist.`);
    }
    if (estimated > 0) {
        paras.push(`${estimated} answer${estimated === 1 ? ' is' : 's are'} based on estimated or derived values and should be verified against source documents before submission.`);
    }
    // If everything is provided
    if (unknown === 0 && estimated === 0) {
        paras.push('All answers are fully supported by tracked company data.');
    }
    // Build rows — single wide column for narrative text
    const rows = [];
    rows.push([`ESG Response Summary \u2014 ${company}`, null]);
    rows.push([null, null]);
    for (const p of paras) {
        rows.push([p, null]);
        rows.push([null, null]); // spacing between paragraphs
    }
    // Compact key facts
    rows.push([null, null]);
    rows.push(['Key Facts:', null]);
    rows.push([`  Company: ${company}`, null]);
    if (ex.industry)
        rows.push([`  Industry: ${ex.industry}`, null]);
    if (ex.country)
        rows.push([`  Country: ${ex.country}`, null]);
    rows.push([`  Reporting Period: ${metadata.reportingPeriod || 'Not specified'}`, null]);
    if (metadata.framework)
        rows.push([`  Framework: ${metadata.framework}`, null]);
    rows.push([`  Questions: ${total} (${provided} data-backed, ${estimated} estimated, ${unknown} pending)`, null]);
    rows.push([null, null]);
    rows.push([`Generated by ESG Passport \u2014 ${metadata.generatedAt.slice(0, 10)}`, null]);
    return { headers: ['', ''], rows, columnWidths: [90, 5], style: 'summary' };
}
// ============================================
// 2. ESG Metrics — structured data overview
// ============================================
function buildMetricsSheet(drafts, metadata) {
    const ex = metadata.extra || {};
    const company = metadata.companyName || 'Company';
    const rows = [];
    // Title
    rows.push([`ESG Metrics \u2014 ${company}`, null, null]);
    rows.push([null, null, null]);
    // Company profile
    rows.push(['Company Profile:', null, null]);
    rows.push(['  Company', (metadata.companyName || 'Not specified'), null]);
    if (ex.industry)
        rows.push(['  Industry', ex.industry, null]);
    if (ex.country)
        rows.push(['  Country', ex.country, null]);
    if (ex.employeeCount)
        rows.push(['  Employees', fmt(ex.employeeCount), null]);
    if (ex.numberOfSites)
        rows.push(['  Facilities', fmt(ex.numberOfSites), null]);
    if (ex.revenueBand)
        rows.push(['  Revenue Band', ex.revenueBand, null]);
    rows.push(['  Reporting Period', metadata.reportingPeriod || 'Not specified', null]);
    rows.push([null, null, null]);
    // Energy & Emissions
    const hasEnergy = ex.electricityKwh || ex.naturalGasM3 || ex.scope1Tco2e || ex.scope2Tco2e;
    if (hasEnergy) {
        rows.push(['Energy & Greenhouse Gases:', null, null]);
        if (ex.electricityKwh)
            rows.push(['  Electricity', `${fmt(ex.electricityKwh)} kWh`, null]);
        if (ex.naturalGasM3)
            rows.push(['  Natural Gas', `${fmt(ex.naturalGasM3)} m\u00B3`, null]);
        if (ex.dieselLiters)
            rows.push(['  Vehicle Fuel', `${fmt(ex.dieselLiters)} L`, null]);
        if (ex.renewablePercent != null)
            rows.push(['  Renewable Energy', `${fmt(ex.renewablePercent)}%`, null]);
        if (ex.scope1Tco2e != null)
            rows.push(['  Scope 1 Emissions', `${fmt(ex.scope1Tco2e, 1)} tCO\u2082e`, null]);
        if (ex.scope2Tco2e != null)
            rows.push(['  Scope 2 Emissions', `${fmt(ex.scope2Tco2e, 1)} tCO\u2082e`, null]);
        if (ex.scope3Tco2e != null)
            rows.push(['  Scope 3 Emissions', `${fmt(ex.scope3Tco2e, 1)} tCO\u2082e`, null]);
        rows.push([null, null, null]);
    }
    // Water & Waste
    const hasResources = ex.waterM3 || ex.totalWasteKg;
    if (hasResources) {
        rows.push(['Water & Waste:', null, null]);
        if (ex.waterM3)
            rows.push(['  Water Consumption', `${fmt(ex.waterM3)} m\u00B3`, null]);
        if (ex.totalWasteKg) {
            const wasteTonnes = Math.round(ex.totalWasteKg / 1000 * 10) / 10;
            rows.push(['  Waste Generated', `${fmt(wasteTonnes, 1)} tonnes`, null]);
        }
        if (ex.recyclingPercent != null)
            rows.push(['  Recycling Rate', `${fmt(ex.recyclingPercent)}%`, null]);
        if (ex.hazardousWasteKg) {
            const hazTonnes = Math.round(ex.hazardousWasteKg / 1000 * 10) / 10;
            rows.push(['  Hazardous Waste', `${fmt(hazTonnes, 1)} tonnes`, null]);
        }
        rows.push([null, null, null]);
    }
    // Workforce
    const hasWorkforce = ex.employeeCount || ex.femalePercent != null || ex.trainingHoursPerEmployee;
    if (hasWorkforce) {
        rows.push(['Workforce:', null, null]);
        if (ex.employeeCount)
            rows.push(['  Employee Count', fmt(ex.employeeCount), null]);
        if (ex.femalePercent != null)
            rows.push(['  Gender Diversity', `${fmt(ex.femalePercent)}% women`, null]);
        if (ex.trainingHoursPerEmployee)
            rows.push(['  Training', `${fmt(ex.trainingHoursPerEmployee, 1)} hrs/employee`, null]);
        if (ex.trirRate != null)
            rows.push(['  Incident Rate (TRIR)', fmt(ex.trirRate, 2), null]);
        rows.push([null, null, null]);
    }
    // Policies
    const policies = [];
    const policyList = ex.policyNames;
    if (policyList) {
        for (const p of policyList.split('|')) {
            if (p)
                policies.push(p);
        }
    }
    if (policies.length > 0) {
        rows.push(['Policies & Governance:', null, null]);
        for (const p of policies) {
            rows.push(['  \u2713', p, null]);
        }
        if (ex.certifications)
            rows.push(['  Certifications', ex.certifications, null]);
        rows.push([null, null, null]);
    }
    return { headers: ['', '', ''], rows, columnWidths: [25, 45, 10], style: 'summary' };
}
// ============================================
// 3. Answers Sheet
// ============================================
function buildAnswersSheet(drafts, _metadata) {
    const headers = ['QuestionID', 'Question', 'Type', 'Category', 'MetricKeysUsed', 'Answer', 'Assumptions', 'Evidence', 'Confidence'];
    const rows = drafts.map(d => [
        d.questionId,
        d.questionText,
        d.questionType || '',
        d.category || '',
        (d.metricKeysUsed || []).join(', '),
        d.answer,
        (d.assumptions || []).join('; '),
        d.evidence || '',
        mapConfidenceLabel(d),
    ]);
    return { headers, rows, columnWidths: [12, 50, 10, 15, 25, 60, 30, 30, 14], style: 'table' };
}
// ============================================
// 4. Review Checklist (internal only)
// ============================================
function buildReviewChecklist(drafts, _metadata) {
    const headers = ['Status', 'Item', 'Category', 'Action Required'];
    const rows = [];
    const estimated = drafts.filter(d => mapConfidenceLabel(d) === 'Estimated');
    if (estimated.length > 0) {
        rows.push(['', '--- Estimated Values \u2014 Verify with Source Documents ---', '', '']);
        for (const d of estimated) {
            const text = d.questionText.length > 80 ? d.questionText.slice(0, 80) + '...' : d.questionText;
            rows.push(['\u2610', text, d.category || '', 'Verify value and update if needed']);
        }
    }
    const unknown = drafts.filter(d => mapConfidenceLabel(d) === 'Unknown');
    if (unknown.length > 0) {
        rows.push(['', '--- Unknown Values \u2014 Data Collection Needed ---', '', '']);
        for (const d of unknown) {
            const text = d.questionText.length > 80 ? d.questionText.slice(0, 80) + '...' : d.questionText;
            const action = d.promptForMissing ? `Collect data: ${d.promptForMissing}` : 'Collect required data';
            rows.push(['\u2610', text, d.category || '', action]);
        }
    }
    return { headers, rows, columnWidths: [8, 65, 18, 50], style: 'checklist' };
}
// ============================================
// Exported Sheet Configs
// ============================================
export const ESG_EXPORT_SHEETS = [
    { name: 'Executive Summary', buildSheet: buildExecutiveSummary },
    { name: 'ESG Metrics', buildSheet: buildMetricsSheet },
    { name: 'Answers', buildSheet: buildAnswersSheet },
    { name: 'Review Checklist', buildSheet: buildReviewChecklist },
];
//# sourceMappingURL=exportConfig.js.map
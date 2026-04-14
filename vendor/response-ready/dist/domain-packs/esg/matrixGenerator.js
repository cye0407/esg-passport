// ============================================
// ESG Domain Pack — Matrix Generator & Maturity Resolver
// ============================================
// Implements the QuestionType × Maturity matrix for ESG answers.
import { str } from '../../src/engine/answerGenerator';
import { esgIndustryContextProvider, domainToTopic, domainToSubcategory } from './industryContext';
import { ESG_FRAMEWORK_NOTES } from './frameworkNotes';
// ============================================
// Maturity Resolver
// ============================================
export const esgMaturityResolver = {
    resolve(profile, matchResult, hasData) {
        if (!profile)
            return hasData ? 'formal' : 'none';
        const domain = matchResult.primaryDomain;
        if (!domain)
            return hasData ? 'formal' : 'none';
        const topic = domainToTopic(domain);
        if (!topic)
            return hasData ? 'formal' : 'none';
        const relevantPractices = profile.informalPractices.filter(p => p.topic === topic);
        const hasFormal = relevantPractices.some(p => p.isFormalized);
        const hasInformal = relevantPractices.length > 0;
        if (hasFormal || hasData)
            return 'formal';
        if (hasInformal)
            return 'informal';
        return 'none';
    },
};
// ============================================
// Matrix Generator
// ============================================
export const esgMatrixGenerator = {
    generate(questionType, maturityBand, matchResult, dataMap, context, profile, framework) {
        const companyName = profile.companyName;
        const industry = profile.industry;
        const indCtx = esgIndustryContextProvider.getContext(industry);
        const domain = matchResult.primaryDomain;
        const topic = domain ? domainToTopic(domain) : null;
        const subcategory = domain ? domainToSubcategory(domain) : null;
        const reportingYear = profile.reportingPeriod || '2024';
        const nextYear = String(parseInt(reportingYear) + 1 || 2025);
        const parts = [];
        const fwNote = framework && ESG_FRAMEWORK_NOTES[framework] ? ESG_FRAMEWORK_NOTES[framework] : '';
        // -------- POLICY × Maturity --------
        if (questionType === 'POLICY') {
            if (maturityBand === 'none') {
                // No data, no informal practices — honest insufficiency, not fabricated roadmap
                parts.push(`${companyName} does not currently have a formalised policy in this area.`);
                parts.push('Relevant data has not been tracked for this disclosure.');
                return parts.join(' ');
            }
            else if (maturityBand === 'informal') {
                const vision = topic ? esgIndustryContextProvider.getPolicyLanguage(industry, topic, 'vision') : null;
                const informal = topic ? esgIndustryContextProvider.getPolicyLanguage(industry, topic, 'informal') : null;
                const roadmap = topic ? esgIndustryContextProvider.getPolicyLanguage(industry, topic, 'roadmap', nextYear) : null;
                parts.push(`${companyName} is ${vision || 'committed to responsible management'}.`);
                if (informal)
                    parts.push(informal + '.');
                const relevantPractices = profile.informalPractices.filter(p => p.topic === topic);
                if (relevantPractices.length > 0) {
                    const descs = relevantPractices.slice(0, 3).map(p => p.description).join('; ');
                    parts.push(`Current practices include: ${descs}.`);
                }
                if (roadmap)
                    parts.push(roadmap + '.');
            }
            else {
                const formal = topic ? esgIndustryContextProvider.getPolicyLanguage(industry, topic, 'formal') : null;
                if (formal)
                    parts.push(formal + '.');
                else
                    parts.push(`${companyName} maintains a comprehensive management approach in this area.`);
                const certs = str(dataMap, 'certificationsHeld');
                if (certs)
                    parts.push(`This is supported by our certifications: ${certs}.`);
                const goal = str(dataMap, 'primaryGoal');
                if (goal)
                    parts.push(`Our policy commitment is further demonstrated by our target: ${goal}.`);
            }
        }
        // -------- MEASURE × Maturity --------
        else if (questionType === 'MEASURE') {
            if (maturityBand === 'none') {
                // No data, no informal practices — honest insufficiency
                parts.push(`${companyName} does not currently have structured measures documented in this area.`);
                parts.push('Relevant data has not been tracked for this disclosure.');
                return parts.join(' ');
            }
            else if (maturityBand === 'informal') {
                parts.push(`In our ${industry.toLowerCase()} environment, ${topic === 'LABOR' ? 'health and safety are' : 'this area is'} managed through operational controls including:`);
                const measures = topic && subcategory ? esgIndustryContextProvider.getMeasures(industry, topic, subcategory, 3) : [];
                if (measures.length > 0)
                    measures.forEach(m => parts.push(`- ${m}`));
                const relevantPractices = profile.informalPractices.filter(p => p.topic === topic);
                if (relevantPractices.length > 0) {
                    relevantPractices.slice(0, 2).map(p => p.description).forEach(d => parts.push(`- ${d}`));
                }
                parts.push('These operational measures are part of our current management approach. A formal documented framework has not yet been established.');
            }
            else {
                parts.push(`${companyName} implements structured measures in this area, aligned with our management system.`);
                const measures = topic && subcategory ? esgIndustryContextProvider.getMeasures(industry, topic, subcategory, 3) : [];
                if (measures.length > 0) {
                    parts.push('Key measures include:');
                    measures.forEach(m => parts.push(`- ${m}`));
                }
                const certs = str(dataMap, 'certificationsHeld');
                if (certs)
                    parts.push(`These measures are implemented within the framework of our ${certs} management system.`);
            }
        }
        // -------- KPI × Maturity --------
        else if (questionType === 'KPI') {
            if (maturityBand === 'none') {
                // No data — honest insufficiency, not fabricated data collection timeline
                parts.push(`${companyName} does not currently track this indicator.`);
                parts.push('Quantified data is not available for this disclosure.');
            }
            else if (maturityBand === 'informal') {
                const allPoints = [...context.operational, ...context.calculated];
                if (allPoints.length > 0) {
                    const dataStatements = allPoints.slice(0, 4).filter(p => p.value !== null).map(p => `${p.label}: ${p.value}${p.unit ? ' ' + p.unit : ''}`);
                    if (dataStatements.length > 0) {
                        parts.push(dataStatements.join('. ') + '.');
                        parts.push('Note: These values are calculated from operational records (utility invoices, production logs). We are working to establish externally verified reporting for future periods.');
                    }
                }
                else {
                    parts.push(`${companyName} tracks this indicator through operational records such as utility invoices and production data.`);
                    parts.push(`We are consolidating this data into a formal ${reportingYear} inventory to establish a baseline for future reduction targets.`);
                }
            }
            else {
                // Full data — let the existing rich templates handle it
                return null;
            }
        }
        if (parts.length === 0)
            return null;
        let answer = parts.join(' ');
        answer = esgIndustryContextProvider.applyTerms(answer, indCtx);
        answer += fwNote;
        return answer;
    },
};
//# sourceMappingURL=matrixGenerator.js.map
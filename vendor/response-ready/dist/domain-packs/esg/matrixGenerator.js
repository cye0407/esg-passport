// ============================================
// ESG Domain Pack — Matrix Generator & Maturity Resolver
// ============================================
// Implements the QuestionType × Maturity matrix for ESG answers.
import { str } from '../../src/engine/answerGenerator';
import { esgIndustryContextProvider, domainToTopic } from './industryContext';
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
    generate(questionType, maturityBand, matchResult, dataMap, context, profile, framework, lang) {
        const de = lang === 'de';
        const companyName = profile.companyName;
        const industry = profile.industry;
        const indCtx = esgIndustryContextProvider.getContext(industry);
        const domain = matchResult.primaryDomain;
        const topic = domain ? domainToTopic(domain) : null;
        const reportingYear = profile.reportingPeriod || '2024';
        const parts = [];
        const fwNote = framework && ESG_FRAMEWORK_NOTES[framework] ? ESG_FRAMEWORK_NOTES[framework] : '';
        // -------- POLICY × Maturity --------
        // Compiler-not-editor: state only what the user provided (their own informal
        // practices, certifications, goals). Never inject canned industry-typical
        // policy language as if it were the company's own commitment.
        if (questionType === 'POLICY') {
            if (maturityBand === 'none') {
                parts.push(de
                    ? `${companyName} verfügt derzeit über keine formalisierte Richtlinie in diesem Bereich.`
                    : `${companyName} does not currently have a formalised policy in this area.`);
                parts.push(de
                    ? 'Für diese Angabe wurden keine relevanten Daten erfasst.'
                    : 'Relevant data has not been tracked for this disclosure.');
                return parts.join(' ');
            }
            const relevantPractices = profile.informalPractices.filter(p => p.topic === topic);
            if (relevantPractices.length > 0) {
                const descs = relevantPractices.slice(0, 3).map(p => p.description).join('; ');
                parts.push(de
                    ? `${companyName} adressiert diesen Bereich durch folgende Maßnahmen: ${descs}.`
                    : `${companyName} addresses this area through the following practices: ${descs}.`);
                if (maturityBand === 'informal') {
                    parts.push(de
                        ? 'Diese Maßnahmen wurden bislang nicht zu einer formal dokumentierten Richtlinie zusammengeführt.'
                        : 'These practices have not yet been consolidated into a formal documented policy.');
                }
            }
            const certs = str(dataMap, 'certificationsHeld');
            if (certs)
                parts.push(de
                    ? `Dies wird durch unsere Zertifizierungen gestützt: ${certs}.`
                    : `This is supported by our certifications: ${certs}.`);
            const goal = str(dataMap, 'primaryGoal');
            if (goal)
                parts.push(de
                    ? `Unser Engagement spiegelt sich zusätzlich in unserem Ziel wider: ${goal}.`
                    : `Our commitment is further reflected in our target: ${goal}.`);
            // Nothing the user provided answers this — defer to honest insufficiency.
            if (parts.length === 0)
                return null;
        }
        // -------- MEASURE × Maturity --------
        // Compiler-not-editor: list only the company's own provided measures. Never
        // emit canned industry-typical measures (e.g. textile dyeing wastewater plant)
        // as if the company had described them.
        else if (questionType === 'MEASURE') {
            if (maturityBand === 'none') {
                parts.push(de
                    ? `${companyName} hat in diesem Bereich derzeit keine strukturierten Maßnahmen dokumentiert.`
                    : `${companyName} does not currently have structured measures documented in this area.`);
                parts.push(de
                    ? 'Für diese Angabe wurden keine relevanten Daten erfasst.'
                    : 'Relevant data has not been tracked for this disclosure.');
                return parts.join(' ');
            }
            const relevantPractices = profile.informalPractices.filter(p => p.topic === topic);
            if (relevantPractices.length > 0) {
                parts.push(de
                    ? `${companyName} wendet in diesem Bereich folgende Maßnahmen an:`
                    : `${companyName} applies the following measures in this area:`);
                relevantPractices.slice(0, 3).forEach(p => parts.push(`- ${p.description}`));
                if (maturityBand === 'informal') {
                    parts.push(de
                        ? 'Diese operativen Maßnahmen sind Teil unseres aktuellen Managementansatzes; ein formal dokumentiertes Rahmenwerk wurde bislang nicht etabliert.'
                        : 'These operational measures are part of our current management approach; a formal documented framework has not yet been established.');
                }
                const certs = str(dataMap, 'certificationsHeld');
                if (certs)
                    parts.push(de
                        ? `Diese Maßnahmen werden im Rahmen unseres ${certs}-Managementsystems umgesetzt.`
                        : `These measures are implemented within the framework of our ${certs} management system.`);
            }
            else {
                // No user-provided measures — surface the real data we track in this area
                // (honest, user-provided), but never canned industry-typical measures.
                const dataPoints = [...context.operational, ...context.calculated]
                    .filter(p => p.value !== null && p.value !== undefined && p.value !== '');
                if (dataPoints.length === 0)
                    return null;
                const dataStatements = dataPoints.slice(0, 4).map(p => `${p.label}: ${p.value}${p.unit ? ' ' + p.unit : ''}`);
                parts.push(de
                    ? `In diesem Bereich erfassen wir folgende Daten: ${dataStatements.join('; ')}.`
                    : `In this area we track the following data: ${dataStatements.join('; ')}.`);
                parts.push(de
                    ? 'Konkrete operative Maßnahmen für diese Frage wurden nicht gesondert dokumentiert.'
                    : 'Specific operational measures for this question have not been separately documented.');
            }
        }
        // -------- KPI × Maturity --------
        else if (questionType === 'KPI') {
            if (maturityBand === 'none') {
                // No data — honest insufficiency, not fabricated data collection timeline
                parts.push(de
                    ? `${companyName} erfasst diesen Indikator derzeit nicht.`
                    : `${companyName} does not currently track this indicator.`);
                parts.push(de
                    ? 'Für diese Angabe liegen keine quantifizierten Daten vor.'
                    : 'Quantified data is not available for this disclosure.');
            }
            else if (maturityBand === 'informal') {
                const allPoints = [...context.operational, ...context.calculated];
                if (allPoints.length > 0) {
                    const dataStatements = allPoints.slice(0, 4).filter(p => p.value !== null).map(p => `${p.label}: ${p.value}${p.unit ? ' ' + p.unit : ''}`);
                    if (dataStatements.length > 0) {
                        parts.push(dataStatements.join('. ') + '.');
                        parts.push(de
                            ? 'Hinweis: Diese Werte werden aus betrieblichen Aufzeichnungen (Versorgungsrechnungen, Produktionsprotokolle) berechnet. Wir arbeiten daran, für künftige Zeiträume eine extern verifizierte Berichterstattung zu etablieren.'
                            : 'Note: These values are calculated from operational records (utility invoices, production logs). We are working to establish externally verified reporting for future periods.');
                    }
                }
                else {
                    parts.push(de
                        ? `${companyName} erfasst diesen Indikator über betriebliche Aufzeichnungen wie Versorgungsrechnungen und Produktionsdaten.`
                        : `${companyName} tracks this indicator through operational records such as utility invoices and production data.`);
                    parts.push(de
                        ? `Wir führen diese Daten in einer formalen ${reportingYear}-Bilanz zusammen, um eine Ausgangsbasis für künftige Reduktionsziele zu schaffen.`
                        : `We are consolidating this data into a formal ${reportingYear} inventory to establish a baseline for future reduction targets.`);
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
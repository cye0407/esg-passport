// ============================================
// ESG Domain Pack — Informal Practice Handler
// ============================================
// Handles answer generation when formal data is missing but
// informal practices exist (the "roadmap" phrasing approach).
import { esgIndustryContextProvider } from './industryContext';
import { ESG_FRAMEWORK_NOTES } from './frameworkNotes';
// ============================================
// Practice Topic → Domain Mapping
// ============================================
const PRACTICE_TOPIC_TO_DOMAINS = {
    'ENVIRONMENT': ['energy_electricity', 'energy_fuel', 'energy_water', 'emissions', 'waste'],
    'LABOR': ['workforce', 'health_safety', 'training'],
    'ETHICS': ['regulatory', 'goals'],
    'SUPPLY_CHAIN': ['materials', 'transport'],
};
// ============================================
// Handler Implementation
// ============================================
export const esgInformalPracticeHandler = {
    findRelevant(profile, matchResult) {
        const allDomains = [matchResult.primaryDomain, ...matchResult.secondaryDomains].filter(Boolean);
        return profile.informalPractices.filter(p => {
            const practiceDomains = PRACTICE_TOPIC_TO_DOMAINS[p.topic] || [];
            return practiceDomains.some(d => allDomains.includes(d));
        });
    },
    generateAnswer(_companyName, practices, matchResult, _industry, framework) {
        // Resolve company name and industry from the practices array context
        // (The handler receives them from the engine orchestration)
        const typedPractices = practices;
        const companyName = _companyName || 'Our organization';
        const industry = _industry || 'general';
        const ctx = esgIndustryContextProvider.getContext(industry);
        const formalized = typedPractices.filter(p => p.isFormalized);
        const informal = typedPractices.filter(p => !p.isFormalized);
        const parts = [];
        const envDomains = ['emissions', 'energy_electricity', 'energy_fuel', 'energy_water', 'waste'];
        const isEnv = envDomains.includes(matchResult.primaryDomain || '');
        parts.push(`${companyName} operates with a commitment to responsible ${isEnv ? 'environmental' : 'operational'} management.`);
        if (formalized.length > 0) {
            const formalDescs = formalized.map(p => p.description).join('; ');
            parts.push(`Our established practices include: ${formalDescs}.`);
        }
        if (informal.length > 0) {
            const informalDescs = informal.map(p => p.description).join('; ');
            parts.push(`Our current operations include: ${informalDescs}.`);
            parts.push('We are in the process of formalizing these practices into documented policies and procedures to strengthen our management approach.');
        }
        const topicsCovered = [...new Set(typedPractices.map(p => p.topic))];
        for (const topic of topicsCovered) {
            const approach = ctx.managementApproaches[topic];
            if (approach) {
                parts.push(`Our management approach encompasses ${approach}.`);
                break;
            }
        }
        let answer = parts.join(' ');
        answer = esgIndustryContextProvider.applyTerms(answer, ctx);
        if (framework && ESG_FRAMEWORK_NOTES[framework]) {
            answer += ESG_FRAMEWORK_NOTES[framework];
        }
        return answer;
    },
};
//# sourceMappingURL=informalPractices.js.map
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
// German management-approach phrasing, per practice topic. industryContext.managementApproaches
// is English-only and industry-specific; embedding it in a German sentence used to leak English
// prose into a /de answer. These are hand-written (no machine translation), generic across
// industries rather than per-industry — a smaller, less tailored set than the English source,
// but German gets a real sentence instead of English text or none at all.
const MANAGEMENT_APPROACH_DE = {
    'ENVIRONMENT': 'betriebliche Umweltmaßnahmen unter Verantwortung der Standortleitung, darunter Abfalltrennung, Energieerfassung über Verbrauchsabrechnungen und die Einhaltung der geltenden Umweltauflagen',
    'LABOR': 'Maßnahmen der Personalführung unter Verantwortung der Standortleitung, darunter regelmäßige Sicherheitsunterweisungen, die Bereitstellung persönlicher Schutzausrüstung und die Erfassung der Arbeitszeiten',
    'ETHICS': 'Erwartungen an rechtskonformes Geschäftsverhalten, die über Einarbeitung und Führungskräfte vermittelt werden, mit einem vertraulichen Kanal zur Meldung von Hinweisen',
    'SUPPLY_CHAIN': 'Verfahren zur Lieferantenqualifizierung, darunter Wareneingangsprüfung, regelmäßige Lieferantenbesuche und die bevorzugte Beschaffung aus regionalen Quellen, soweit möglich',
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
    generateAnswer(_companyName, practices, matchResult, _industry, framework, lang) {
        // Resolve company name and industry from the practices array context
        // (The handler receives them from the engine orchestration)
        const de = lang === 'de';
        const typedPractices = practices;
        const companyName = _companyName || (de ? 'Unser Unternehmen' : 'Our organization');
        const industry = _industry || 'general';
        const ctx = esgIndustryContextProvider.getContext(industry);
        const formalized = typedPractices.filter(p => p.isFormalized);
        const informal = typedPractices.filter(p => !p.isFormalized);
        const parts = [];
        const envDomains = ['emissions', 'energy_electricity', 'energy_fuel', 'energy_water', 'waste'];
        const isEnv = envDomains.includes(matchResult.primaryDomain || '');
        parts.push(de
            ? `${companyName} handelt mit dem Anspruch eines verantwortungsvollen ${isEnv ? 'Umweltmanagements' : 'Betriebsmanagements'}.`
            : `${companyName} operates with a commitment to responsible ${isEnv ? 'environmental' : 'operational'} management.`);
        if (formalized.length > 0) {
            const formalDescs = formalized.map(p => p.description).join('; ');
            parts.push(de
                ? `Zu unseren etablierten Maßnahmen gehören: ${formalDescs}.`
                : `Our established practices include: ${formalDescs}.`);
        }
        if (informal.length > 0) {
            const informalDescs = informal.map(p => p.description).join('; ');
            parts.push(de
                ? `Zu unseren aktuellen Betriebsabläufen gehören: ${informalDescs}.`
                : `Our current operations include: ${informalDescs}.`);
            parts.push(de
                ? 'Wir sind dabei, diese Maßnahmen in dokumentierte Richtlinien und Verfahren zu überführen, um unseren Managementansatz zu stärken.'
                : 'We are in the process of formalizing these practices into documented policies and procedures to strengthen our management approach.');
        }
        const topicsCovered = [...new Set(typedPractices.map(p => p.topic))];
        for (const topic of topicsCovered) {
            // English pulls the industry-specific approach; German uses its own hand-written phrasing
            // so no English prose is embedded in the German sentence.
            const approach = de ? MANAGEMENT_APPROACH_DE[topic] : ctx.managementApproaches[topic];
            if (approach) {
                parts.push(de
                    ? `Unser Managementansatz umfasst ${approach}.`
                    : `Our management approach encompasses ${approach}.`);
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
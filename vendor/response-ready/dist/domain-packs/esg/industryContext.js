// ============================================
// ESG Domain Pack — Industry Context Provider
// ============================================
// Provides industry-specific terminology, measures, and policy language
// for 8 industry families. Implements IndustryContextProvider interface.
import manufacturingData from './data/industry/manufacturing.json';
import logisticsData from './data/industry/logistics.json';
import textilesData from './data/industry/textiles.json';
import chemicalsData from './data/industry/chemicals.json';
import electronicsData from './data/industry/electronics.json';
import foodAgricultureData from './data/industry/food-agriculture.json';
import constructionData from './data/industry/construction.json';
import servicesData from './data/industry/services.json';
// --- 8 industry terminology contexts ---
const MANUFACTURING = {
    industry: 'Manufacturing',
    terms: {
        'safety rules': 'shop floor safety protocols', 'safety training': 'toolbox talks and safety briefings',
        'workplace': 'production facility', 'office': 'plant', 'employees': 'operational workforce',
        'waste disposal': 'waste stream management', 'recycling': 'material recovery and scrap recycling',
        'energy use': 'energy consumption across production lines', 'water use': 'process and utility water consumption',
        'supply chain': 'procurement and supplier management', 'incident': 'workplace incident or near-miss',
        'training': 'competency development and skills training', 'documentation': 'standard operating procedures (SOPs)',
    },
    managementApproaches: {
        'ENVIRONMENT': 'operational environmental controls managed by site leadership, including waste segregation, energy monitoring via utility invoices, and compliance with local discharge permits',
        'LABOR': 'workforce management practices overseen by site management, including regular toolbox talks, PPE provisions, and working hours tracking through shift management systems',
        'ETHICS': 'business conduct expectations communicated through employee onboarding and line management, with an open-door policy for raising concerns',
        'SUPPLY_CHAIN': 'supplier qualification processes including incoming quality inspection, periodic supplier visits, and preference for locally sourced materials where feasible',
    },
};
const LOGISTICS = {
    industry: 'Logistics & Transport',
    terms: {
        'safety rules': 'driver and warehouse safety protocols', 'workplace': 'depot and warehouse facility',
        'employees': 'drivers and warehouse operatives', 'energy use': 'fleet fuel consumption and depot electricity',
        'supply chain': 'subcontractor and haulage partner management', 'incident': 'road traffic incident, near-miss, or warehouse safety event',
        'production line': 'distribution operation', 'manufacturing operations': 'logistics and distribution operations',
    },
    managementApproaches: {
        'ENVIRONMENT': 'fleet fuel monitoring via telematics, depot energy and waste management, route optimisation, and compliance with environmental regulations',
        'LABOR': 'driver hours management through tachograph monitoring, warehouse safety protocols, CPC training compliance, and working time directive adherence',
        'ETHICS': 'business conduct expectations communicated through driver and staff onboarding, subcontractor agreements, and a confidential reporting channel',
        'SUPPLY_CHAIN': 'subcontractor pre-qualification including safety record review, compliance checks, and periodic operational performance assessment',
    },
};
const TEXTILES = {
    industry: 'Textiles & Apparel',
    terms: {
        'safety rules': 'textile production safety protocols', 'workplace': 'textile production facility',
        'employees': 'production operatives and garment workers', 'waste disposal': 'fabric waste and chemical waste management',
        'water use': 'process water consumption in dyeing and finishing operations', 'production line': 'textile production line',
    },
    managementApproaches: {
        'ENVIRONMENT': 'water stewardship through wastewater treatment, chemical management aligned with ZDHC standards, energy monitoring, and fabric waste recovery programmes',
        'LABOR': 'worker welfare managed through chemical safety training, working hours tracking, fair wage benchmarking, and accessible grievance mechanisms aligned with buyer codes of conduct',
        'ETHICS': 'ethical conduct expectations communicated through onboarding and reinforced through buyer audit compliance, with a focus on fair labour practices',
        'SUPPLY_CHAIN': 'fibre traceability, supplier social audits, preference for certified raw materials (GOTS, OEKO-TEX, BCI), and chemical supplier ZDHC conformance verification',
    },
};
const CHEMICALS = {
    industry: 'Chemicals',
    terms: {
        'safety rules': 'chemical handling and storage safety protocols', 'workplace': 'storage and distribution facility',
        'employees': 'warehouse handlers and distribution drivers', 'waste disposal': 'chemical waste and contaminated packaging management',
        'production line': 'storage and distribution operation',
    },
    managementApproaches: {
        'ENVIRONMENT': 'spill containment through bunding and secondary containment, chemical waste segregation, fleet emissions monitoring, and compliance with REACH and CLP regulations',
        'LABOR': 'chemical exposure prevention through COSHH assessments, ADR-certified drivers, health surveillance for exposed workers, and working hours management',
        'ETHICS': 'regulatory compliance expectations including REACH registration, anti-corruption awareness, and a confidential channel for reporting safety and ethical concerns',
        'SUPPLY_CHAIN': 'supplier qualification including REACH registration verification, SDS review, and periodic audits covering product quality and environmental compliance',
    },
};
const ELECTRONICS = {
    industry: 'Electronics & Technology',
    terms: {
        'safety rules': 'ESD protocols and production safety procedures', 'workplace': 'production facility and cleanroom environment',
        'employees': 'production technicians and engineering staff', 'waste disposal': 'electronic waste and process chemical management',
        'production line': 'electronics production line',
    },
    managementApproaches: {
        'ENVIRONMENT': 'RoHS and REACH-compliant manufacturing, WEEE take-back compliance, cleanroom energy optimisation, and responsible management of process chemicals and electronic scrap',
        'LABOR': 'worker safety through ESD controls, chemical exposure monitoring, ergonomic assessments, and labour practices aligned with Responsible Business Alliance (RBA) standards',
        'ETHICS': 'conflict minerals due diligence with CMRT reporting, anti-corruption awareness, data protection and IP security, and export control compliance',
        'SUPPLY_CHAIN': 'component supplier qualification with RoHS/REACH substance declarations, conflict minerals surveys, RBA Code-aligned audits, and extended supply chain mapping for critical materials',
    },
};
const FOOD = {
    industry: 'Food & Agriculture',
    terms: {
        'safety rules': 'food hygiene and HACCP-based safety protocols', 'workplace': 'food production facility',
        'employees': 'food production operatives and quality staff', 'waste disposal': 'organic waste management and food waste diversion',
        'production line': 'food production line',
    },
    managementApproaches: {
        'ENVIRONMENT': 'food waste diversion through composting and by-product recovery, wastewater treatment, refrigeration efficiency, energy monitoring, and packaging waste reduction',
        'LABOR': 'food safety-integrated occupational health, HACCP training, cold environment working protocols, working hours management, and fair treatment of seasonal and migrant workers',
        'ETHICS': 'food integrity and fraud prevention, anti-corruption awareness, and ethical treatment of workers including seasonal and agency labour',
        'SUPPLY_CHAIN': 'ingredient traceability, supplier food safety certification verification (BRC, FSSC 22000), preference for certified sustainable inputs, and deforestation-free sourcing commitments',
    },
};
const CONSTRUCTION = {
    industry: 'Construction',
    terms: {
        'safety rules': 'site safety rules and risk assessments', 'workplace': 'construction site', 'office': 'site compound',
        'employees': 'site workers, tradespeople, and subcontractors', 'waste disposal': 'site waste management and skip segregation',
        'production line': 'construction project', 'manufacturing operations': 'construction operations',
    },
    managementApproaches: {
        'ENVIRONMENT': 'site waste management plans, dust and noise controls, material segregation, pollution prevention measures, and compliance with environmental permits and planning conditions',
        'LABOR': 'project-specific safety plans, daily toolbox talks, subcontractor safety inductions, working at height and excavation controls, and mental health awareness initiatives',
        'ETHICS': 'anti-corruption awareness, prompt payment practices for subcontractors, modern slavery due diligence, and a confidential mechanism for reporting concerns',
        'SUPPLY_CHAIN': 'subcontractor pre-qualification covering safety competence and compliance, responsible material sourcing (FSC timber, recycled aggregate), and modern slavery checks across labour supply chains',
    },
};
const SERVICES = {
    industry: 'Professional Services',
    terms: {
        'safety rules': 'office health and safety procedures', 'workplace': 'office environment',
        'employees': 'professional staff and support teams', 'waste disposal': 'office waste and e-waste management',
        'production line': 'service delivery', 'manufacturing operations': 'business operations', 'shop floor': 'office floor',
    },
    managementApproaches: {
        'ENVIRONMENT': 'office energy monitoring, digital-first document management, business travel reduction through virtual-first meeting policies, and sustainable IT procurement',
        'LABOR': 'employee wellbeing through flexible working, ergonomic assessments, mental health support, professional development, and diversity and inclusion programmes',
        'ETHICS': 'anti-corruption policy, GDPR-aligned data protection programme, conflict-of-interest management, and a confidential whistleblowing channel',
        'SUPPLY_CHAIN': 'sustainable procurement covering IT vendors, facilities management, and office supplies, with preference for suppliers demonstrating environmental and social commitments',
    },
};
// ============================================
// Industry Mapping
// ============================================
const INDUSTRY_MAP = {
    'manufacturing': MANUFACTURING, 'metal fabrication': MANUFACTURING, 'automotive': MANUFACTURING,
    'industrial': MANUFACTURING, 'aerospace': MANUFACTURING, 'mining': MANUFACTURING,
    'transport': LOGISTICS, 'logistics': LOGISTICS, 'shipping': LOGISTICS, 'freight': LOGISTICS,
    'textile': TEXTILES, 'apparel': TEXTILES, 'garment': TEXTILES, 'fashion': TEXTILES,
    'chemical': CHEMICALS,
    'electronic': ELECTRONICS, 'technology': ELECTRONICS, 'software': ELECTRONICS, 'telecommunication': ELECTRONICS,
    'food': FOOD, 'agriculture': FOOD, 'beverage': FOOD,
    'construction': CONSTRUCTION, 'building': CONSTRUCTION,
    'financial': SERVICES, 'healthcare': SERVICES, 'pharma': SERVICES, 'professional service': SERVICES,
    'retail': SERVICES, 'wholesale': SERVICES, 'real estate': SERVICES, 'energy': SERVICES,
    'utilities': SERVICES, 'hospitality': SERVICES, 'tourism': SERVICES, 'education': SERVICES, 'other': SERVICES,
};
const MEASURES_MAP = {
    'manufacturing': manufacturingData, 'metal fabrication': manufacturingData,
    'automotive': manufacturingData, 'industrial': manufacturingData,
    'aerospace': manufacturingData, 'mining': manufacturingData,
    'transport': logisticsData, 'logistics': logisticsData,
    'shipping': logisticsData, 'freight': logisticsData,
    'textile': textilesData, 'apparel': textilesData,
    'garment': textilesData, 'fashion': textilesData,
    'chemical': chemicalsData,
    'electronic': electronicsData, 'technology': electronicsData,
    'software': electronicsData, 'telecommunication': electronicsData,
    'food': foodAgricultureData, 'agriculture': foodAgricultureData,
    'beverage': foodAgricultureData,
    'construction': constructionData, 'building': constructionData,
    'financial': servicesData, 'healthcare': servicesData,
    'pharma': servicesData, 'professional service': servicesData,
    'retail': servicesData, 'wholesale': servicesData,
    'real estate': servicesData, 'energy': servicesData,
    'utilities': servicesData, 'hospitality': servicesData,
    'tourism': servicesData, 'education': servicesData,
    'other': servicesData,
};
// ============================================
// Lookup Functions
// ============================================
function findContext(industry) {
    const key = industry.toLowerCase();
    for (const [pattern, ctx] of Object.entries(INDUSTRY_MAP)) {
        if (key.includes(pattern))
            return ctx;
    }
    return SERVICES;
}
function findMeasures(industry) {
    const key = industry.toLowerCase();
    for (const [pattern, lib] of Object.entries(MEASURES_MAP)) {
        if (key.includes(pattern))
            return lib;
    }
    return servicesData;
}
// ============================================
// IndustryContextProvider Implementation
// ============================================
export const esgIndustryContextProvider = {
    getContext(industry) {
        const ctx = findContext(industry);
        const measures = findMeasures(industry);
        return {
            industry: ctx.industry,
            terminology: ctx.terms,
            managementApproaches: ctx.managementApproaches,
            plausibleMeasures: measures.plausibleMeasures,
            policyLanguage: measures.policyLanguage,
        };
    },
    applyTerms(text, context) {
        let result = text;
        for (const [generic, specific] of Object.entries(context.terminology)) {
            const regex = new RegExp(`\\b${generic}\\b`, 'gi');
            result = result.replace(regex, specific);
        }
        return result;
    },
    getMeasures(industry, topic, subcategory, count = 3) {
        const lib = findMeasures(industry);
        const topicMeasures = lib.plausibleMeasures[topic];
        if (!topicMeasures)
            return [];
        if (subcategory && topicMeasures[subcategory]) {
            return topicMeasures[subcategory].slice(0, count);
        }
        return Object.values(topicMeasures).flat().slice(0, count);
    },
    getPolicyLanguage(industry, topic, style, year) {
        const lib = findMeasures(industry);
        const topicLang = lib.policyLanguage[topic];
        if (!topicLang || !topicLang[style])
            return null;
        let text = topicLang[style];
        if (year)
            text = text.replace(/{year}/g, year);
        else
            text = text.replace(/{year}/g, '2025');
        return text;
    },
};
// ============================================
// Domain → Topic/Subcategory Mapping
// ============================================
export function domainToTopic(domain) {
    const mapping = {
        'energy_electricity': 'ENVIRONMENT', 'energy_fuel': 'ENVIRONMENT', 'energy_water': 'ENVIRONMENT',
        'emissions': 'ENVIRONMENT', 'waste': 'ENVIRONMENT', 'effluents': 'ENVIRONMENT',
        'workforce': 'LABOR', 'health_safety': 'LABOR', 'training': 'LABOR',
        'regulatory': 'ETHICS', 'goals': 'ETHICS',
        'materials': 'SUPPLY_CHAIN', 'transport': 'ENVIRONMENT', 'packaging': 'SUPPLY_CHAIN', 'buyer_requirements': 'SUPPLY_CHAIN',
    };
    return mapping[domain] || null;
}
export function domainToSubcategory(domain) {
    const mapping = {
        'energy_electricity': 'energy', 'energy_fuel': 'energy', 'emissions': 'emissions',
        'waste': 'waste', 'energy_water': 'water', 'health_safety': 'health_safety',
        'training': 'training', 'workforce': 'labor_practices', 'regulatory': 'governance',
        'goals': 'governance', 'materials': 'procurement', 'transport': 'transport', 'buyer_requirements': 'procurement',
    };
    return mapping[domain] || null;
}
//# sourceMappingURL=industryContext.js.map
// ============================================
// Phase 1 + Phase 2: Industry-Specific Context
// ============================================
// Provides domain-appropriate terminology, plausible measures,
// and policy language for answer generation.

import type { QuestionType } from './questionClassifier';
import type { PracticeTopic } from '../../types/context';
import manufacturingData from '../../data/industry/manufacturing.json';
import logisticsData from '../../data/industry/logistics.json';
import textilesData from '../../data/industry/textiles.json';
import chemicalsData from '../../data/industry/chemicals.json';
import electronicsData from '../../data/industry/electronics.json';
import foodAgricultureData from '../../data/industry/food-agriculture.json';
import constructionData from '../../data/industry/construction.json';
import servicesData from '../../data/industry/services.json';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface IndustryTerminology {
  industry: string;
  terms: Record<string, string>; // generic term → industry-specific term
  managementApproaches: Record<string, string>; // topic → typical management approach description
}

/**
 * Phase 2: Full industry context including plausible measures and policy language.
 */
export interface IndustryMeasuresLibrary {
  industry: string;
  /** Topic → subcategory → array of plausible measure descriptions */
  plausibleMeasures: Record<string, Record<string, string[]>>;
  /** Topic → { vision, formal, informal, roadmap } policy language templates */
  policyLanguage: Record<string, Record<string, string>>;
}

// ---------------------------------------------------------------------------
// Industry terminology contexts
// ---------------------------------------------------------------------------

const MANUFACTURING_CONTEXT: IndustryTerminology = {
  industry: 'Manufacturing',
  terms: {
    'safety rules': 'shop floor safety protocols',
    'safety training': 'toolbox talks and safety briefings',
    'workplace': 'production facility',
    'office': 'plant',
    'employees': 'operational workforce',
    'waste disposal': 'waste stream management',
    'recycling': 'material recovery and scrap recycling',
    'energy use': 'energy consumption across production lines',
    'water use': 'process and utility water consumption',
    'pollution': 'emissions and effluent management',
    'supply chain': 'procurement and supplier management',
    'quality checks': 'incoming material inspection and quality control',
    'working conditions': 'shop floor working conditions',
    'protective equipment': 'personal protective equipment (PPE)',
    'incident': 'workplace incident or near-miss',
    'training': 'competency development and skills training',
    'documentation': 'standard operating procedures (SOPs)',
    'environmental monitoring': 'environmental monitoring and compliance',
  },
  managementApproaches: {
    'ENVIRONMENT': 'operational environmental controls managed by site leadership, including waste segregation, energy monitoring via utility invoices, and compliance with local discharge permits',
    'LABOR': 'workforce management practices overseen by site management, including regular toolbox talks, PPE provisions, and working hours tracking through shift management systems',
    'ETHICS': 'business conduct expectations communicated through employee onboarding and line management, with an open-door policy for raising concerns',
    'SUPPLY_CHAIN': 'supplier qualification processes including incoming quality inspection, periodic supplier visits, and preference for locally sourced materials where feasible',
  },
};

const LOGISTICS_CONTEXT: IndustryTerminology = {
  industry: 'Logistics & Transport',
  terms: {
    'safety rules': 'driver and warehouse safety protocols',
    'safety training': 'driver CPC training and warehouse safety briefings',
    'workplace': 'depot and warehouse facility',
    'office': 'depot',
    'employees': 'drivers and warehouse operatives',
    'waste disposal': 'packaging and transit waste management',
    'recycling': 'pallet, shrink wrap, and packaging recycling',
    'energy use': 'fleet fuel consumption and depot electricity',
    'water use': 'vehicle wash and facility water consumption',
    'pollution': 'fleet emissions and depot environmental controls',
    'supply chain': 'subcontractor and haulage partner management',
    'quality checks': 'vehicle daily walkaround checks and load inspections',
    'working conditions': 'driver working conditions and depot environment',
    'protective equipment': 'high-visibility clothing and warehouse PPE',
    'incident': 'road traffic incident, near-miss, or warehouse safety event',
    'training': 'driver training and warehouse operative development',
    'documentation': 'transport and safety procedures',
    'environmental monitoring': 'fleet emissions tracking and depot environmental monitoring',
    'production line': 'distribution operation',
    'manufacturing operations': 'logistics and distribution operations',
    'production processes': 'transport and warehousing processes',
  },
  managementApproaches: {
    'ENVIRONMENT': 'fleet fuel monitoring via telematics, depot energy and waste management, route optimisation, and compliance with environmental regulations',
    'LABOR': 'driver hours management through tachograph monitoring, warehouse safety protocols, CPC training compliance, and working time directive adherence',
    'ETHICS': 'business conduct expectations communicated through driver and staff onboarding, subcontractor agreements, and a confidential reporting channel',
    'SUPPLY_CHAIN': 'subcontractor pre-qualification including safety record review, compliance checks, and periodic operational performance assessment',
  },
};

const TEXTILES_CONTEXT: IndustryTerminology = {
  industry: 'Textiles & Apparel',
  terms: {
    'safety rules': 'textile production safety protocols',
    'safety training': 'chemical handling training and machine safety briefings',
    'workplace': 'textile production facility',
    'office': 'mill or production unit',
    'employees': 'production operatives and garment workers',
    'waste disposal': 'fabric waste and chemical waste management',
    'recycling': 'textile waste recovery and fibre recycling',
    'energy use': 'energy consumption across dyeing, finishing, and production',
    'water use': 'process water consumption in dyeing and finishing operations',
    'pollution': 'wastewater management and chemical discharge control',
    'supply chain': 'raw material sourcing and fibre supply chain management',
    'quality checks': 'incoming fibre and fabric quality inspection',
    'working conditions': 'factory floor working conditions',
    'protective equipment': 'chemical handling PPE and hearing protection',
    'incident': 'workplace incident or chemical exposure event',
    'training': 'production skills, chemical safety, and labour rights training',
    'documentation': 'production procedures and chemical management records',
    'environmental monitoring': 'wastewater quality monitoring and ZDHC compliance',
    'production line': 'textile production line',
    'scrap metal': 'fabric offcuts and textile waste',
  },
  managementApproaches: {
    'ENVIRONMENT': 'water stewardship through wastewater treatment, chemical management aligned with ZDHC standards, energy monitoring, and fabric waste recovery programmes',
    'LABOR': 'worker welfare managed through chemical safety training, working hours tracking, fair wage benchmarking, and accessible grievance mechanisms aligned with buyer codes of conduct',
    'ETHICS': 'ethical conduct expectations communicated through onboarding and reinforced through buyer audit compliance, with a focus on fair labour practices',
    'SUPPLY_CHAIN': 'fibre traceability, supplier social audits, preference for certified raw materials (GOTS, OEKO-TEX, BCI), and chemical supplier ZDHC conformance verification',
  },
};

const CHEMICALS_CONTEXT: IndustryTerminology = {
  industry: 'Chemicals',
  terms: {
    'safety rules': 'chemical handling and storage safety protocols',
    'safety training': 'ADR training, COSHH awareness, and SDS interpretation',
    'workplace': 'storage and distribution facility',
    'office': 'warehouse and depot',
    'employees': 'warehouse handlers and distribution drivers',
    'waste disposal': 'chemical waste and contaminated packaging management',
    'recycling': 'container return, refill, and packaging recycling',
    'energy use': 'warehouse and fleet energy consumption',
    'water use': 'vehicle wash and facility water consumption',
    'pollution': 'spill prevention, containment, and VOC management',
    'supply chain': 'chemical supplier qualification and REACH compliance management',
    'quality checks': 'incoming product inspection and SDS verification',
    'working conditions': 'warehouse and handling working conditions',
    'protective equipment': 'chemical-rated PPE including gloves, goggles, and respirators',
    'incident': 'chemical spill, exposure incident, or near-miss',
    'training': 'chemical safety certification and handling competency training',
    'documentation': 'safety data sheets (SDS) and handling procedures',
    'environmental monitoring': 'spill containment, bunding, and discharge monitoring',
    'production line': 'storage and distribution operation',
    'manufacturing operations': 'chemical storage and distribution operations',
    'production processes': 'chemical handling and distribution processes',
  },
  managementApproaches: {
    'ENVIRONMENT': 'spill containment through bunding and secondary containment, chemical waste segregation, fleet emissions monitoring, and compliance with REACH and CLP regulations',
    'LABOR': 'chemical exposure prevention through COSHH assessments, ADR-certified drivers, health surveillance for exposed workers, and working hours management',
    'ETHICS': 'regulatory compliance expectations including REACH registration, anti-corruption awareness, and a confidential channel for reporting safety and ethical concerns',
    'SUPPLY_CHAIN': 'supplier qualification including REACH registration verification, SDS review, and periodic audits covering product quality and environmental compliance',
  },
};

const ELECTRONICS_CONTEXT: IndustryTerminology = {
  industry: 'Electronics & Technology',
  terms: {
    'safety rules': 'ESD protocols and production safety procedures',
    'safety training': 'ESD awareness, chemical safety, and IPC certification training',
    'workplace': 'production facility and cleanroom environment',
    'office': 'production site',
    'employees': 'production technicians and engineering staff',
    'waste disposal': 'electronic waste and process chemical management',
    'recycling': 'PCB scrap recovery, component recycling, and WEEE compliance',
    'energy use': 'cleanroom HVAC, process equipment, and data centre energy consumption',
    'water use': 'ultrapure water consumption in wet processing',
    'pollution': 'process gas management, chemical discharge control, and product end-of-life',
    'supply chain': 'component sourcing, conflict minerals due diligence, and RoHS/REACH compliance',
    'quality checks': 'incoming component inspection and material compliance verification',
    'working conditions': 'cleanroom and production floor working conditions',
    'protective equipment': 'ESD protective equipment and chemical handling PPE',
    'incident': 'workplace incident, chemical exposure, or ESD event',
    'training': 'IPC certification, RoHS awareness, and technical skills development',
    'documentation': 'quality procedures, material declarations, and CMRT documentation',
    'environmental monitoring': 'process emissions monitoring and product compliance tracking',
    'production line': 'electronics production line',
    'scrap metal': 'electronic scrap and solder waste',
  },
  managementApproaches: {
    'ENVIRONMENT': 'RoHS and REACH-compliant manufacturing, WEEE take-back compliance, cleanroom energy optimisation, and responsible management of process chemicals and electronic scrap',
    'LABOR': 'worker safety through ESD controls, chemical exposure monitoring, ergonomic assessments, and labour practices aligned with Responsible Business Alliance (RBA) standards',
    'ETHICS': 'conflict minerals due diligence with CMRT reporting, anti-corruption awareness, data protection and IP security, and export control compliance',
    'SUPPLY_CHAIN': 'component supplier qualification with RoHS/REACH substance declarations, conflict minerals surveys, RBA Code-aligned audits, and extended supply chain mapping for critical materials',
  },
};

const FOOD_CONTEXT: IndustryTerminology = {
  industry: 'Food & Agriculture',
  terms: {
    'safety rules': 'food hygiene and HACCP-based safety protocols',
    'safety training': 'food safety induction and allergen awareness training',
    'workplace': 'food production facility',
    'office': 'production site',
    'employees': 'food production operatives and quality staff',
    'waste disposal': 'organic waste management and food waste diversion',
    'recycling': 'organic waste composting, by-product recovery, and packaging recycling',
    'energy use': 'refrigeration, cooking, and processing energy consumption',
    'water use': 'process water consumption in washing, cleaning, and production',
    'pollution': 'wastewater BOD/COD management and refrigerant emissions',
    'supply chain': 'ingredient sourcing, supplier food safety audits, and traceability',
    'quality checks': 'incoming ingredient inspection and food safety verification',
    'working conditions': 'production floor and cold storage working conditions',
    'protective equipment': 'food-grade PPE, hairnets, and cut-resistant gloves',
    'incident': 'food safety incident, workplace injury, or allergen cross-contamination event',
    'training': 'food safety certification, hygiene training, and skills development',
    'documentation': 'HACCP plans, food safety records, and traceability documentation',
    'environmental monitoring': 'wastewater quality, refrigerant leak monitoring, and environmental compliance',
    'production line': 'food production line',
    'scrap metal': 'food production waste and packaging waste',
  },
  managementApproaches: {
    'ENVIRONMENT': 'food waste diversion through composting and by-product recovery, wastewater treatment, refrigeration efficiency, energy monitoring, and packaging waste reduction',
    'LABOR': 'food safety-integrated occupational health, HACCP training, cold environment working protocols, working hours management, and fair treatment of seasonal and migrant workers',
    'ETHICS': 'food integrity and fraud prevention, anti-corruption awareness, and ethical treatment of workers including seasonal and agency labour',
    'SUPPLY_CHAIN': 'ingredient traceability, supplier food safety certification verification (BRC, FSSC 22000), preference for certified sustainable inputs, and deforestation-free sourcing commitments',
  },
};

const CONSTRUCTION_CONTEXT: IndustryTerminology = {
  industry: 'Construction',
  terms: {
    'safety rules': 'site safety rules and risk assessments',
    'safety training': 'CSCS certification, toolbox talks, and task-specific safety briefings',
    'workplace': 'construction site',
    'office': 'site compound',
    'employees': 'site workers, tradespeople, and subcontractors',
    'waste disposal': 'site waste management and skip segregation',
    'recycling': 'demolition waste recovery and construction material recycling',
    'energy use': 'site power, plant diesel, and welfare cabin energy consumption',
    'water use': 'dust suppression, wheel wash, and welfare water consumption',
    'pollution': 'dust, noise, and site runoff management',
    'supply chain': 'subcontractor management and material procurement',
    'quality checks': 'material testing, concrete cube tests, and quality inspections',
    'working conditions': 'on-site working conditions and welfare provisions',
    'protective equipment': 'hard hats, high-visibility clothing, safety boots, and harnesses',
    'incident': 'construction site accident, near-miss, or dangerous occurrence',
    'training': 'trade certification, SMSTS/SSSTS, and site safety training',
    'documentation': 'construction phase plans, method statements, and risk assessments',
    'environmental monitoring': 'dust, noise, and vibration monitoring and site drainage controls',
    'production line': 'construction project',
    'manufacturing operations': 'construction operations',
    'production processes': 'construction processes',
  },
  managementApproaches: {
    'ENVIRONMENT': 'site waste management plans, dust and noise controls, material segregation, pollution prevention measures, and compliance with environmental permits and planning conditions',
    'LABOR': 'project-specific safety plans, daily toolbox talks, subcontractor safety inductions, working at height and excavation controls, and mental health awareness initiatives',
    'ETHICS': 'anti-corruption awareness, prompt payment practices for subcontractors, modern slavery due diligence, and a confidential mechanism for reporting concerns',
    'SUPPLY_CHAIN': 'subcontractor pre-qualification covering safety competence and compliance, responsible material sourcing (FSC timber, recycled aggregate), and modern slavery checks across labour supply chains',
  },
};

const SERVICES_CONTEXT: IndustryTerminology = {
  industry: 'Professional Services',
  terms: {
    'safety rules': 'office health and safety procedures',
    'safety training': 'DSE assessment, fire safety, and cybersecurity awareness training',
    'workplace': 'office environment',
    'office': 'office',
    'employees': 'professional staff and support teams',
    'waste disposal': 'office waste and e-waste management',
    'recycling': 'paper, cardboard, and IT equipment recycling',
    'energy use': 'office electricity and heating consumption',
    'water use': 'office water consumption',
    'pollution': 'business travel emissions and office energy footprint',
    'supply chain': 'IT vendor and facilities management procurement',
    'quality checks': 'vendor assessment and service quality review',
    'working conditions': 'office and remote working conditions',
    'protective equipment': 'ergonomic equipment and workstation setup',
    'incident': 'workplace incident, data breach, or wellbeing concern',
    'training': 'professional development, continuing education, and compliance training',
    'documentation': 'company policies and compliance documentation',
    'environmental monitoring': 'office energy monitoring and travel emissions tracking',
    'production line': 'service delivery',
    'manufacturing operations': 'business operations',
    'production processes': 'business processes',
    'shop floor': 'office floor',
    'production facility': 'office facility',
  },
  managementApproaches: {
    'ENVIRONMENT': 'office energy monitoring, digital-first document management, business travel reduction through virtual-first meeting policies, and sustainable IT procurement',
    'LABOR': 'employee wellbeing through flexible working, ergonomic assessments, mental health support, professional development, and diversity and inclusion programmes',
    'ETHICS': 'anti-corruption policy, GDPR-aligned data protection programme, conflict-of-interest management, and a confidential whistleblowing channel',
    'SUPPLY_CHAIN': 'sustainable procurement covering IT vendors, facilities management, and office supplies, with preference for suppliers demonstrating environmental and social commitments',
  },
};

// ---------------------------------------------------------------------------
// Industry maps — every dropdown option maps to a context
// ---------------------------------------------------------------------------

const INDUSTRY_MAP: Record<string, IndustryTerminology> = {
  // Manufacturing family
  'manufacturing': MANUFACTURING_CONTEXT,
  'metal fabrication': MANUFACTURING_CONTEXT,
  'automotive': MANUFACTURING_CONTEXT,
  'industrial': MANUFACTURING_CONTEXT,
  'aerospace': MANUFACTURING_CONTEXT,
  'mining': MANUFACTURING_CONTEXT,
  // Logistics family
  'transport': LOGISTICS_CONTEXT,
  'logistics': LOGISTICS_CONTEXT,
  'shipping': LOGISTICS_CONTEXT,
  'freight': LOGISTICS_CONTEXT,
  // Textiles family
  'textile': TEXTILES_CONTEXT,
  'apparel': TEXTILES_CONTEXT,
  'garment': TEXTILES_CONTEXT,
  'fashion': TEXTILES_CONTEXT,
  // Chemicals family
  'chemical': CHEMICALS_CONTEXT,
  // Electronics family
  'electronic': ELECTRONICS_CONTEXT,
  'technology': ELECTRONICS_CONTEXT,
  'software': ELECTRONICS_CONTEXT,
  'telecommunication': ELECTRONICS_CONTEXT,
  // Food family
  'food': FOOD_CONTEXT,
  'agriculture': FOOD_CONTEXT,
  'beverage': FOOD_CONTEXT,
  // Construction family
  'construction': CONSTRUCTION_CONTEXT,
  'building': CONSTRUCTION_CONTEXT,
  // Services family
  'financial': SERVICES_CONTEXT,
  'healthcare': SERVICES_CONTEXT,
  'pharma': SERVICES_CONTEXT,
  'professional service': SERVICES_CONTEXT,
  'retail': SERVICES_CONTEXT,
  'wholesale': SERVICES_CONTEXT,
  'real estate': SERVICES_CONTEXT,
  'energy': SERVICES_CONTEXT,
  'utilities': SERVICES_CONTEXT,
  'hospitality': SERVICES_CONTEXT,
  'tourism': SERVICES_CONTEXT,
  'education': SERVICES_CONTEXT,
  'other': SERVICES_CONTEXT,
};

// ---------------------------------------------------------------------------
// Phase 2: Measures libraries (loaded from JSON)
// ---------------------------------------------------------------------------

const MANUFACTURING_MEASURES: IndustryMeasuresLibrary = manufacturingData as IndustryMeasuresLibrary;
const LOGISTICS_MEASURES: IndustryMeasuresLibrary = logisticsData as IndustryMeasuresLibrary;
const TEXTILES_MEASURES: IndustryMeasuresLibrary = textilesData as IndustryMeasuresLibrary;
const CHEMICALS_MEASURES: IndustryMeasuresLibrary = chemicalsData as IndustryMeasuresLibrary;
const ELECTRONICS_MEASURES: IndustryMeasuresLibrary = electronicsData as IndustryMeasuresLibrary;
const FOOD_MEASURES: IndustryMeasuresLibrary = foodAgricultureData as IndustryMeasuresLibrary;
const CONSTRUCTION_MEASURES: IndustryMeasuresLibrary = constructionData as IndustryMeasuresLibrary;
const SERVICES_MEASURES: IndustryMeasuresLibrary = servicesData as IndustryMeasuresLibrary;

const MEASURES_MAP: Record<string, IndustryMeasuresLibrary> = {
  // Manufacturing family
  'manufacturing': MANUFACTURING_MEASURES,
  'metal fabrication': MANUFACTURING_MEASURES,
  'automotive': MANUFACTURING_MEASURES,
  'industrial': MANUFACTURING_MEASURES,
  'aerospace': MANUFACTURING_MEASURES,
  'mining': MANUFACTURING_MEASURES,
  // Logistics family
  'transport': LOGISTICS_MEASURES,
  'logistics': LOGISTICS_MEASURES,
  'shipping': LOGISTICS_MEASURES,
  'freight': LOGISTICS_MEASURES,
  // Textiles family
  'textile': TEXTILES_MEASURES,
  'apparel': TEXTILES_MEASURES,
  'garment': TEXTILES_MEASURES,
  'fashion': TEXTILES_MEASURES,
  // Chemicals family
  'chemical': CHEMICALS_MEASURES,
  // Electronics family
  'electronic': ELECTRONICS_MEASURES,
  'technology': ELECTRONICS_MEASURES,
  'software': ELECTRONICS_MEASURES,
  'telecommunication': ELECTRONICS_MEASURES,
  // Food family
  'food': FOOD_MEASURES,
  'agriculture': FOOD_MEASURES,
  'beverage': FOOD_MEASURES,
  // Construction family
  'construction': CONSTRUCTION_MEASURES,
  'building': CONSTRUCTION_MEASURES,
  // Services family
  'financial': SERVICES_MEASURES,
  'healthcare': SERVICES_MEASURES,
  'pharma': SERVICES_MEASURES,
  'professional service': SERVICES_MEASURES,
  'retail': SERVICES_MEASURES,
  'wholesale': SERVICES_MEASURES,
  'real estate': SERVICES_MEASURES,
  'energy': SERVICES_MEASURES,
  'utilities': SERVICES_MEASURES,
  'hospitality': SERVICES_MEASURES,
  'tourism': SERVICES_MEASURES,
  'education': SERVICES_MEASURES,
  'other': SERVICES_MEASURES,
};

// ---------------------------------------------------------------------------
// Industry-specific MEASURE question examples (for LLM instruction)
// ---------------------------------------------------------------------------

const MEASURE_EXAMPLES: Record<string, string> = {
  'Manufacturing': '"machine guarding protocols" not "safety rules"',
  'Logistics & Transport': '"route optimisation" not "efficiency measures"',
  'Textiles & Apparel': '"wastewater treatment from dyeing" not "water management"',
  'Chemicals': '"COSHH assessments and bunding" not "safety measures"',
  'Electronics & Technology': '"ESD controls and RoHS compliance" not "quality checks"',
  'Food & Agriculture': '"HACCP protocols and allergen management" not "safety procedures"',
  'Construction': '"toolbox talks and method statements" not "safety training"',
  'Professional Services': '"DSE assessments and travel reduction policies" not "workplace measures"',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get industry terminology context for the given industry string.
 */
export function getIndustryContext(industry: string): IndustryTerminology {
  const key = industry.toLowerCase();
  for (const [pattern, ctx] of Object.entries(INDUSTRY_MAP)) {
    if (key.includes(pattern)) return ctx;
  }
  // Fallback: services context covers generic cases better than empty terms
  return SERVICES_CONTEXT;
}

/**
 * Phase 2: Get the full measures library for the given industry.
 */
export function getIndustryMeasures(industry: string): IndustryMeasuresLibrary | null {
  const key = industry.toLowerCase();
  for (const [pattern, lib] of Object.entries(MEASURES_MAP)) {
    if (key.includes(pattern)) return lib;
  }
  // Fallback: services measures library for unmatched industries
  return SERVICES_MEASURES;
}

/**
 * Phase 2: Get plausible measures for a specific topic and subcategory.
 * Only returns measures if the user has checked the corresponding informal practice.
 */
export function getPlausibleMeasures(
  industry: string,
  topic: PracticeTopic,
  subcategory?: string,
  maxMeasures: number = 3
): string[] {
  const lib = getIndustryMeasures(industry);
  if (!lib) return [];

  const topicMeasures = lib.plausibleMeasures[topic];
  if (!topicMeasures) return [];

  if (subcategory && topicMeasures[subcategory]) {
    return topicMeasures[subcategory].slice(0, maxMeasures);
  }

  // If no specific subcategory, pick from all subcategories
  const all = Object.values(topicMeasures).flat();
  return all.slice(0, maxMeasures);
}

/**
 * Phase 2: Get policy language for a specific topic and maturity style.
 */
export function getPolicyLanguage(
  industry: string,
  topic: PracticeTopic,
  style: 'vision' | 'formal' | 'informal' | 'roadmap',
  year?: string
): string | null {
  const lib = getIndustryMeasures(industry);
  if (!lib) return null;

  const topicLang = lib.policyLanguage[topic];
  if (!topicLang || !topicLang[style]) return null;

  let text = topicLang[style];
  if (year) {
    text = text.replace(/{year}/g, year);
  } else {
    text = text.replace(/{year}/g, '2025');
  }
  return text;
}

/**
 * Phase 2: Map data domains to practice topics for measure lookup.
 */
export function domainToTopic(domain: string): PracticeTopic | null {
  const mapping: Record<string, PracticeTopic> = {
    'energy_electricity': 'ENVIRONMENT',
    'energy_fuel': 'ENVIRONMENT',
    'energy_water': 'ENVIRONMENT',
    'emissions': 'ENVIRONMENT',
    'waste': 'ENVIRONMENT',
    'effluents': 'ENVIRONMENT',
    'workforce': 'LABOR',
    'health_safety': 'LABOR',
    'training': 'LABOR',
    'regulatory': 'ETHICS',
    'goals': 'ETHICS',
    'materials': 'SUPPLY_CHAIN',
    'transport': 'SUPPLY_CHAIN',
    'packaging': 'SUPPLY_CHAIN',
    'buyer_requirements': 'SUPPLY_CHAIN',
  };
  return mapping[domain] || null;
}

/**
 * Phase 2: Map data domains to subcategories for measure lookup.
 */
export function domainToSubcategory(domain: string): string | null {
  const mapping: Record<string, string> = {
    'energy_electricity': 'energy',
    'energy_fuel': 'energy',
    'emissions': 'emissions',
    'waste': 'waste',
    'energy_water': 'water',
    'health_safety': 'health_safety',
    'training': 'training',
    'workforce': 'labor_practices',
    'regulatory': 'governance',
    'goals': 'governance',
    'materials': 'procurement',
    'transport': 'procurement',
    'buyer_requirements': 'procurement',
  };
  return mapping[domain] || null;
}

/**
 * Replace generic terms with industry-specific ones in a text string.
 */
export function applyIndustryTerms(text: string, context: IndustryTerminology): string {
  let result = text;
  for (const [generic, specific] of Object.entries(context.terms)) {
    const regex = new RegExp(`\\b${generic}\\b`, 'gi');
    result = result.replace(regex, specific);
  }
  return result;
}

/**
 * Phase 2: Get the question-type-specific context injection for the LLM.
 * Now uses industry-appropriate examples instead of hardcoded manufacturing references.
 */
export function getQuestionTypeInstruction(questionType: QuestionType, industry: string): string {
  const ctx = getIndustryContext(industry);
  const example = MEASURE_EXAMPLES[ctx.industry] || MEASURE_EXAMPLES['Professional Services'];

  const instructions: Record<QuestionType, string> = {
    'POLICY': `This is a POLICY question. The response should focus on high-level vision, commitments, and management approach. Reference formal policies if they exist, or describe the commitment to formalise existing practices. Use language appropriate for ${ctx.industry} operations.`,
    'MEASURE': `This is a MEASURE/ACTIONS question. The response should describe specific operational measures, procedures, and initiatives in place. Use concrete, ${ctx.industry}-appropriate terminology (e.g., ${example}). Describe processes, not aspirations.`,
    'KPI': `This is a KPI/REPORTING question. The response should provide precise data values with units, methodology notes, and reporting period. If data is estimated, state the estimation method. If verified, reference the assurance provider.`,
  };
  return instructions[questionType] || instructions['MEASURE'];
}

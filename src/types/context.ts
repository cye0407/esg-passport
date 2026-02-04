// ============================================
// Phase 1: Contextual Foundation — New Types
// ============================================

// ---------------------------------------------------------------------------
// Enhanced Metric — replaces simple key-value with confidence & coverage
// ---------------------------------------------------------------------------

export type MetricConfidence = 'VERIFIED' | 'ESTIMATED' | 'UNKNOWN';
export type MetricCoverage = 'FULL' | 'PARTIAL' | 'SINGLE_SITE';

export interface EnhancedMetric {
  value: number | string;
  unit: string;
  confidence: MetricConfidence;
  coverage: MetricCoverage;
  sourceDocument?: string; // e.g., "Dec 2024 Electricity Bill"
}

// ---------------------------------------------------------------------------
// Informal Practice — captures "we do this but don't have a PDF for it"
// ---------------------------------------------------------------------------

export type PracticeTopic = 'ENVIRONMENT' | 'LABOR' | 'ETHICS' | 'SUPPLY_CHAIN';

export interface InformalPractice {
  id: string;
  topic: PracticeTopic;
  description: string; // "We recycle all scrap metal on the shop floor."
  isFormalized: boolean; // false → triggers "Roadmap" phrasing
}

// ---------------------------------------------------------------------------
// Company Profile — the pre-survey context that feeds the LLM
// ---------------------------------------------------------------------------

export type MaturityLevel = 'Emerging' | 'Developing' | 'Established' | 'Leading';

export interface CompanyProfile {
  // Core identity
  companyName: string;
  industry: string; // starting with "Manufacturing"
  subIndustry?: string; // e.g., "Metal Fabrication", "Automotive Parts"
  country: string;
  employeeCount: number;
  numberOfSites: number;
  reportingPeriod: string;
  revenueBand: string;

  // Informal practices — the "implicit ESG"
  informalPractices: InformalPractice[];

  // Predicted maturity (computed from profile + practices)
  maturityLevel: MaturityLevel;
  maturityScore: number; // 0–100

  // Timestamps
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// Readiness Score — shown after generation
// ---------------------------------------------------------------------------

export interface ReadinessScore {
  score: number; // 0–100
  level: 'Provisional' | 'Bronze' | 'Silver' | 'Gold';
  totalQuestions: number;
  answeredWithData: number;
  answeredWithPractice: number; // informal practice filled the gap
  unanswered: number;
  missingDocuments: string[];
}

// ---------------------------------------------------------------------------
// Pre-built informal practice options (for the checklist UI)
// ---------------------------------------------------------------------------

export interface PracticeOption {
  id: string;
  topic: PracticeTopic;
  label: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Universal practices — shown to all industries but with industry-specific descriptions
// ---------------------------------------------------------------------------

export interface UniversalPractice {
  id: string;
  topic: PracticeTopic;
  label: string;
  /** Default description (used if no industry variant matches) */
  defaultDescription: string;
  /** Industry-family → tailored description */
  variants: Record<string, string>;
}

export type IndustryFamily =
  | 'manufacturing'
  | 'logistics'
  | 'textiles'
  | 'chemicals'
  | 'electronics'
  | 'food'
  | 'construction'
  | 'services';

/**
 * Map an industry dropdown value to its context family key.
 */
export function getIndustryFamily(industry: string): IndustryFamily {
  const key = industry.toLowerCase();
  if (key.includes('textile') || key.includes('apparel') || key.includes('garment') || key.includes('fashion')) return 'textiles';
  if (key.includes('chemical')) return 'chemicals';
  if (key.includes('electronic') || key.includes('technology') || key.includes('software') || key.includes('telecommunication')) return 'electronics';
  if (key.includes('food') || key.includes('agriculture') || key.includes('beverage')) return 'food';
  if (key.includes('construction') || key.includes('building')) return 'construction';
  if (key.includes('transport') || key.includes('logistics') || key.includes('shipping') || key.includes('freight')) return 'logistics';
  if (key.includes('manufactur') || key.includes('automotive') || key.includes('metal') || key.includes('aerospace') || key.includes('mining') || key.includes('industrial')) return 'manufacturing';
  return 'services';
}

const UNIVERSAL_PRACTICES: UniversalPractice[] = [
  // --- ENVIRONMENT ---
  {
    id: 'env_energy_bills',
    topic: 'ENVIRONMENT',
    label: 'Energy tracking via bills',
    defaultDescription: 'We track energy consumption through monthly utility invoices.',
    variants: {
      manufacturing: 'We track energy consumption through monthly utility invoices for our production facilities.',
      logistics: 'We monitor fuel consumption via fleet cards and depot electricity bills.',
      textiles: 'We track energy use across dyeing, finishing, and production via utility bills.',
      chemicals: 'We monitor warehouse and fleet energy consumption through utility invoices and fuel cards.',
      electronics: 'We track electricity consumption for production and cleanroom operations via utility invoices.',
      food: 'We monitor energy use for refrigeration, cooking, and processing through utility invoices.',
      construction: 'We track site power and office energy consumption through utility invoices.',
      services: 'We track office electricity and heating consumption through monthly utility invoices.',
    },
  },
  {
    id: 'env_waste_segregation',
    topic: 'ENVIRONMENT',
    label: 'Waste segregation on-site',
    defaultDescription: 'We separate waste streams (recyclables, general, hazardous) at our facility.',
    variants: {
      manufacturing: 'We separate waste streams on the production floor: scrap metal, packaging, hazardous, and general waste.',
      logistics: 'We segregate waste at depot level: cardboard, shrink wrap, pallets, and general waste.',
      textiles: 'We segregate fabric offcuts, chemical waste, packaging, and general waste at our production facility.',
      chemicals: 'We segregate chemical waste, contaminated packaging, and general waste with dedicated containment areas.',
      electronics: 'We segregate electronic scrap, solder waste, packaging, and general waste on the production floor.',
      food: 'We segregate organic waste, packaging, and general waste, diverting organics to composting or anaerobic digestion.',
      construction: 'We operate segregated skips on-site: timber, metal, inert, plasterboard, and general waste.',
      services: 'We separate office waste into paper, cardboard, plastics, IT equipment, and general waste.',
    },
  },
  {
    id: 'env_water_monitoring',
    topic: 'ENVIRONMENT',
    label: 'Water usage monitoring',
    defaultDescription: 'We monitor water consumption through metering or bill tracking.',
    variants: {
      manufacturing: 'We monitor process and utility water consumption through metering and utility bill analysis.',
      logistics: 'We meter water consumption at depot facilities including vehicle washing.',
      textiles: 'We monitor water consumption in dyeing, finishing, and cleaning operations through metering.',
      chemicals: 'We monitor vehicle wash and facility water consumption through utility bills.',
      electronics: 'We monitor ultrapure and process water consumption through metering at key points.',
      food: 'We meter water consumption at major process points: washing, processing, and cleaning.',
      construction: 'We meter site water consumption for dust suppression, wheel wash, and welfare facilities.',
      services: 'We monitor office water consumption through utility bills.',
    },
  },
  // --- LABOR ---
  {
    id: 'lab_safety_training',
    topic: 'LABOR',
    label: 'Regular safety training',
    defaultDescription: 'We conduct periodic safety briefings or toolbox talks for staff.',
    variants: {
      manufacturing: 'We conduct regular toolbox talks and safety briefings for production staff.',
      logistics: 'We deliver driver CPC training and regular warehouse safety briefings.',
      textiles: 'We conduct chemical handling training and machine safety briefings for production staff.',
      chemicals: 'We deliver ADR training, COSHH awareness, and SDS interpretation sessions.',
      electronics: 'We provide ESD awareness, chemical safety, and IPC certification training.',
      food: 'We conduct food safety induction, allergen awareness, and hygiene training for all production staff.',
      construction: 'We deliver daily toolbox talks and task-specific safety briefings before each work phase.',
      services: 'We provide DSE assessments, fire safety training, and cybersecurity awareness sessions.',
    },
  },
  {
    id: 'lab_fair_wages',
    topic: 'LABOR',
    label: 'Fair wage practices',
    defaultDescription: 'We pay at or above the local minimum wage for all employees.',
    variants: {
      manufacturing: 'We pay at or above the local minimum wage for all production and support staff.',
      logistics: 'We ensure fair pay for all drivers and warehouse operatives, meeting or exceeding local standards.',
      textiles: 'We benchmark wages against local and industry standards for all production operatives.',
      chemicals: 'We pay at or above the local minimum wage for all warehouse and distribution staff.',
      electronics: 'We pay at or above the local minimum wage for all production technicians and staff.',
      food: 'We benchmark wages against local and industry standards, including seasonal and agency workers.',
      construction: 'We are committed to paying the living wage for all directly employed site workers.',
      services: 'We conduct equal pay analysis and maintain transparent salary banding.',
    },
  },
  {
    id: 'lab_incident_reporting',
    topic: 'LABOR',
    label: 'Incident reporting process',
    defaultDescription: 'We have a process for reporting and investigating workplace incidents.',
    variants: {
      manufacturing: 'We have a process for reporting and investigating workplace incidents and near-misses on the shop floor.',
      logistics: 'We operate an incident and near-miss reporting system with root-cause analysis for road and depot events.',
      textiles: 'We have a process for reporting workplace incidents and chemical exposure events.',
      chemicals: 'We have a process for reporting chemical spills, exposure incidents, and near-misses.',
      electronics: 'We have a process for reporting workplace incidents, chemical exposures, and ESD events.',
      food: 'We integrate food safety and occupational safety incident and near-miss reporting.',
      construction: 'We have a site-level incident and near-miss reporting system with RIDDOR compliance.',
      services: 'We have a process for reporting workplace incidents, data breaches, and wellbeing concerns.',
    },
  },
  {
    id: 'lab_working_hours',
    topic: 'LABOR',
    label: 'Working hours tracking',
    defaultDescription: 'We track and manage employee working hours and overtime.',
    variants: {
      manufacturing: 'We track and manage working hours and overtime through shift management systems.',
      logistics: 'We monitor driver hours through electronic tachographs and comply with working time directives.',
      textiles: 'We track working hours including seasonal overtime management for production operatives.',
      chemicals: 'We track working hours for warehouse handlers and distribution drivers.',
      electronics: 'We track and manage employee working hours and overtime across production shifts.',
      food: 'We track working hours including seasonal overtime management for production and seasonal workers.',
      construction: 'We track working hours and overtime across direct employees and subcontracted labour.',
      services: 'We offer flexible working arrangements including hybrid, part-time, and compressed hours.',
    },
  },
  // --- ETHICS ---
  {
    id: 'eth_anti_corruption',
    topic: 'ETHICS',
    label: 'Anti-corruption awareness',
    defaultDescription: 'We have informal guidelines or awareness around anti-bribery and corruption.',
    variants: {
      manufacturing: 'We have anti-bribery and corruption awareness integrated into employee onboarding.',
      logistics: 'We include anti-bribery and corruption awareness in driver and office onboarding.',
      textiles: 'We have anti-bribery and corruption expectations communicated through onboarding.',
      chemicals: 'We have anti-corruption awareness integrated into employee and supplier onboarding.',
      electronics: 'We have anti-corruption awareness integrated into onboarding, with export control compliance.',
      food: 'We integrate anti-bribery and corruption awareness into employee and supplier onboarding.',
      construction: 'We have an anti-bribery and corruption policy covering procurement and subcontracting.',
      services: 'We maintain an anti-bribery and corruption policy with annual declaration requirements.',
    },
  },
  {
    id: 'eth_data_protection',
    topic: 'ETHICS',
    label: 'Data protection measures',
    defaultDescription: 'We take steps to protect employee and customer data.',
    variants: {
      manufacturing: 'We take steps to protect employee and customer data in our business systems.',
      logistics: 'We have data protection measures for customer shipment and tracking data.',
      textiles: 'We take steps to protect employee and buyer data.',
      chemicals: 'We maintain data protection for product, customer, and employee records.',
      electronics: 'We maintain data protection, IP security, and export control procedures.',
      food: 'We have customer and product data protection measures in place.',
      construction: 'We protect project documentation and client information through data security measures.',
      services: 'We operate a data protection programme aligned with GDPR for employee and client data.',
    },
  },
  {
    id: 'eth_whistleblower',
    topic: 'ETHICS',
    label: 'Feedback/complaint channel',
    defaultDescription: 'Employees can raise concerns through a manager or informal channel.',
    variants: {
      manufacturing: 'Employees can raise concerns through line management or an open-door policy.',
      logistics: 'Drivers and staff can raise concerns through a confidential reporting channel.',
      textiles: 'Workers can raise concerns through a grievance mechanism accessible to all staff including agency workers.',
      chemicals: 'Employees can raise safety and ethical concerns through a confidential reporting channel.',
      electronics: 'Employees can raise concerns through a confidential reporting mechanism.',
      food: 'Workers can raise food safety and ethical concerns through a confidential reporting channel.',
      construction: 'Workers can raise safety concerns, fraud, or ethical violations through a confidential mechanism.',
      services: 'Employees can raise concerns through a confidential whistleblowing channel with third-party management.',
    },
  },
  // --- SUPPLY_CHAIN ---
  {
    id: 'sc_supplier_checks',
    topic: 'SUPPLY_CHAIN',
    label: 'Supplier quality checks',
    defaultDescription: 'We assess key suppliers on quality before onboarding.',
    variants: {
      manufacturing: 'We assess key suppliers on quality and delivery performance before onboarding.',
      logistics: 'We assess subcontractors on safety record and environmental compliance before engagement.',
      textiles: 'We verify supplier social audit status and fibre certification before onboarding.',
      chemicals: 'We verify supplier REACH registration and SDS quality before onboarding.',
      electronics: 'We verify supplier RoHS/REACH compliance and conflict minerals status before onboarding.',
      food: 'We qualify suppliers on food safety certification (BRC, FSSC 22000) before onboarding.',
      construction: 'We pre-qualify subcontractors on safety record, insurance, and competency before site access.',
      services: 'We assess IT vendors and service providers on data security and environmental practices.',
    },
  },
  {
    id: 'sc_local_sourcing',
    topic: 'SUPPLY_CHAIN',
    label: 'Local sourcing preference',
    defaultDescription: 'We prefer sourcing materials from local or regional suppliers when possible.',
    variants: {
      manufacturing: 'We prefer sourcing raw materials from local or regional suppliers when possible.',
      logistics: 'We prefer local haulage partners to reduce empty running and subcontracted miles.',
      textiles: 'We prefer certified sustainable raw materials from traceable regional supply chains.',
      chemicals: 'We prefer suppliers with documented environmental management and shorter transport distances.',
      electronics: 'We prefer component suppliers with demonstrated sustainability commitments and regional availability.',
      food: 'We prefer certified sustainable ingredients (Rainforest Alliance, Fairtrade, organic) where available.',
      construction: 'We prefer local suppliers and subcontractors to reduce transport impact and support local economies.',
      services: 'We prefer cloud and IT service providers with disclosed carbon footprints and renewable energy commitments.',
    },
  },
];

// ---------------------------------------------------------------------------
// Industry-specific practices — only shown when the user's industry matches
// ---------------------------------------------------------------------------

const INDUSTRY_SPECIFIC_PRACTICES: Record<IndustryFamily, PracticeOption[]> = {
  manufacturing: [
    { id: 'mfg_scrap_recycling', topic: 'ENVIRONMENT', label: 'Scrap metal recycling', description: 'We recycle all scrap metal generated on the shop floor.' },
    { id: 'mfg_spill_procedures', topic: 'ENVIRONMENT', label: 'Spill containment procedures', description: 'We have informal procedures for chemical/oil spill containment.' },
    { id: 'mfg_safety_gear', topic: 'LABOR', label: 'Safety gear for all staff', description: 'We provide personal protective equipment (PPE) to all operational staff.' },
    { id: 'mfg_conduct_handbook', topic: 'LABOR', label: 'Code of conduct in handbook', description: 'We have a section on expected conduct in our employee handbook.' },
    { id: 'mfg_supplier_visits', topic: 'SUPPLY_CHAIN', label: 'Supplier site visits', description: 'We conduct periodic visits or audits of key supplier facilities.' },
  ],
  logistics: [
    { id: 'log_fleet_monitoring', topic: 'ENVIRONMENT', label: 'Fleet fuel monitoring', description: 'We monitor fleet fuel consumption via telematics and fuel card analytics.' },
    { id: 'log_route_optimisation', topic: 'ENVIRONMENT', label: 'Route optimisation', description: 'We use route optimisation to reduce fuel consumption per delivery.' },
    { id: 'log_anti_idling', topic: 'ENVIRONMENT', label: 'Anti-idling policy', description: 'We have an anti-idling policy for fleet vehicles at depots and loading bays.' },
    { id: 'log_driver_fatigue', topic: 'LABOR', label: 'Driver fatigue management', description: 'We manage driver fatigue through hours-of-service tracking and tachograph monitoring.' },
    { id: 'log_vehicle_checks', topic: 'LABOR', label: 'Daily vehicle walkaround checks', description: 'Drivers complete daily walkaround vehicle checks before departure.' },
    { id: 'log_subcontractor_vetting', topic: 'SUPPLY_CHAIN', label: 'Subcontractor vetting', description: 'We vet haulage subcontractors on safety record and compliance before engagement.' },
  ],
  textiles: [
    { id: 'tex_wastewater', topic: 'ENVIRONMENT', label: 'Wastewater treatment', description: 'We treat process wastewater from dyeing and finishing before discharge.' },
    { id: 'tex_chemical_management', topic: 'ENVIRONMENT', label: 'Chemical management (ZDHC)', description: 'We manage production chemicals aligned with ZDHC Manufacturing Restricted Substances List.' },
    { id: 'tex_fabric_waste', topic: 'ENVIRONMENT', label: 'Fabric waste recovery', description: 'We recover and recycle fabric offcuts and trimmings from production.' },
    { id: 'tex_worker_welfare', topic: 'LABOR', label: 'Worker welfare provisions', description: 'We provide welfare facilities and fair working conditions for garment workers.' },
    { id: 'tex_social_audits', topic: 'SUPPLY_CHAIN', label: 'Social audit readiness', description: 'We maintain readiness for buyer social audits covering labour and safety standards.' },
    { id: 'tex_fibre_traceability', topic: 'SUPPLY_CHAIN', label: 'Fibre traceability', description: 'We trace key fibres to origin (cotton, polyester) for responsible sourcing.' },
  ],
  chemicals: [
    { id: 'chem_bunding', topic: 'ENVIRONMENT', label: 'Bunding and containment', description: 'We have secondary containment (bunding) for all stored chemical products.' },
    { id: 'chem_spill_kits', topic: 'ENVIRONMENT', label: 'Spill response equipment', description: 'We maintain spill kits and response procedures appropriate to stored chemicals.' },
    { id: 'chem_sds_management', topic: 'LABOR', label: 'SDS management', description: 'We maintain current safety data sheets (SDS) for all chemical products we handle.' },
    { id: 'chem_coshh', topic: 'LABOR', label: 'COSHH assessments', description: 'We conduct COSHH assessments for chemical handling and storage activities.' },
    { id: 'chem_adr_drivers', topic: 'LABOR', label: 'ADR-certified drivers', description: 'Our delivery drivers hold ADR certification for dangerous goods transport.' },
    { id: 'chem_reach', topic: 'SUPPLY_CHAIN', label: 'REACH compliance checks', description: 'We verify REACH registration status and SVHC declarations from our suppliers.' },
  ],
  electronics: [
    { id: 'elec_esd_controls', topic: 'ENVIRONMENT', label: 'ESD controls', description: 'We maintain electrostatic discharge (ESD) controls across production areas.' },
    { id: 'elec_weee', topic: 'ENVIRONMENT', label: 'WEEE compliance', description: 'We comply with WEEE regulations for electronic waste take-back and recycling.' },
    { id: 'elec_rohs', topic: 'ENVIRONMENT', label: 'RoHS compliance', description: 'We maintain RoHS compliance records for all electronic products and components.' },
    { id: 'elec_cleanroom_ppe', topic: 'LABOR', label: 'Cleanroom protocols', description: 'We maintain cleanroom gowning and contamination control procedures.' },
    { id: 'elec_conflict_minerals', topic: 'SUPPLY_CHAIN', label: 'Conflict minerals due diligence', description: 'We conduct conflict minerals due diligence with CMRT reporting for 3TG materials.' },
    { id: 'elec_substance_declarations', topic: 'SUPPLY_CHAIN', label: 'Material declarations from suppliers', description: 'We collect substance declarations and compliance certificates from component suppliers.' },
  ],
  food: [
    { id: 'food_haccp', topic: 'ENVIRONMENT', label: 'HACCP procedures', description: 'We operate HACCP-based food safety and hygiene protocols across production.' },
    { id: 'food_waste_diversion', topic: 'ENVIRONMENT', label: 'Food waste diversion', description: 'We divert organic waste from landfill through composting or anaerobic digestion.' },
    { id: 'food_cold_chain', topic: 'ENVIRONMENT', label: 'Cold chain management', description: 'We manage refrigeration efficiency and cold chain integrity across our operations.' },
    { id: 'food_allergen', topic: 'LABOR', label: 'Allergen management training', description: 'We train all production staff on allergen handling, labelling, and cross-contamination prevention.' },
    { id: 'food_seasonal_worker', topic: 'LABOR', label: 'Seasonal worker welfare', description: 'We provide fair working conditions and welfare provisions for seasonal and agency staff.' },
    { id: 'food_traceability', topic: 'SUPPLY_CHAIN', label: 'Ingredient traceability', description: 'We trace key ingredients to farm or origin level for responsible sourcing.' },
  ],
  construction: [
    { id: 'con_swmp', topic: 'ENVIRONMENT', label: 'Site waste management plans', description: 'We implement site waste management plans (SWMPs) on all projects above threshold value.' },
    { id: 'con_dust_noise', topic: 'ENVIRONMENT', label: 'Dust and noise controls', description: 'We implement dust suppression and noise management on construction sites.' },
    { id: 'con_working_height', topic: 'LABOR', label: 'Working at height procedures', description: 'We have working at height procedures including scaffolding inspections and fall protection.' },
    { id: 'con_cscs', topic: 'LABOR', label: 'CSCS cards for all workers', description: 'All site workers hold valid CSCS (Construction Skills Certification Scheme) cards.' },
    { id: 'con_modern_slavery', topic: 'SUPPLY_CHAIN', label: 'Modern slavery checks', description: 'We conduct modern slavery due diligence across subcontractor and labour supply chains.' },
    { id: 'con_responsible_sourcing', topic: 'SUPPLY_CHAIN', label: 'Responsible material sourcing', description: 'We specify responsibly sourced materials including FSC/PEFC timber and recycled aggregates.' },
  ],
  services: [
    { id: 'svc_digital_first', topic: 'ENVIRONMENT', label: 'Digital-first document management', description: 'We operate a paper reduction programme with digital-first document management.' },
    { id: 'svc_travel_reduction', topic: 'ENVIRONMENT', label: 'Business travel reduction', description: 'We have a virtual meeting-first policy to reduce business travel where appropriate.' },
    { id: 'svc_ergonomic', topic: 'LABOR', label: 'Ergonomic assessments', description: 'We conduct ergonomic and DSE assessments for office and remote workstations.' },
    { id: 'svc_mental_health', topic: 'LABOR', label: 'Mental health support', description: 'We provide mental health and wellbeing support including employee assistance services.' },
    { id: 'svc_flexible_working', topic: 'LABOR', label: 'Flexible working arrangements', description: 'We offer flexible working including hybrid, part-time, and compressed hours options.' },
    { id: 'svc_it_procurement', topic: 'SUPPLY_CHAIN', label: 'Sustainable IT procurement', description: 'We assess IT vendors on data security, environmental practices, and labour standards.' },
  ],
};

// ---------------------------------------------------------------------------
// Public API: Get practices for a given industry
// ---------------------------------------------------------------------------

/**
 * Get the full set of practice options for a given industry.
 * Returns universal practices (with industry-tailored descriptions) plus industry-specific practices.
 */
export function getPracticeOptionsForIndustry(industry: string): PracticeOption[] {
  const family = getIndustryFamily(industry);

  // Convert universal practices to PracticeOption with the right description variant
  const universal: PracticeOption[] = UNIVERSAL_PRACTICES.map(up => ({
    id: up.id,
    topic: up.topic,
    label: up.label,
    description: up.variants[family] || up.defaultDescription,
  }));

  // Get industry-specific practices
  const specific = INDUSTRY_SPECIFIC_PRACTICES[family] || [];

  return [...universal, ...specific];
}

/**
 * Legacy flat list for backward compatibility.
 * Uses manufacturing descriptions as default.
 */
export const INFORMAL_PRACTICE_OPTIONS: PracticeOption[] = getPracticeOptionsForIndustry('Manufacturing');

// ---------------------------------------------------------------------------
// Maturity calculation helper
// ---------------------------------------------------------------------------

export function calculateMaturity(
  employeeCount: number,
  industry: string,
  practices: InformalPractice[]
): { level: MaturityLevel; score: number } {
  let score = 0;

  // Base points from company size (larger = slightly higher baseline expectation)
  if (employeeCount >= 250) score += 10;
  else if (employeeCount >= 50) score += 5;

  // Points from informal practices
  const practicePoints = practices.length * 5;
  score += Math.min(practicePoints, 40); // cap at 40

  // Bonus for topic coverage (covering multiple ESG pillars)
  const topicsCovered = new Set(practices.map(p => p.topic));
  score += topicsCovered.size * 5; // up to 20 for all 4 topics

  // Bonus for formalized practices
  const formalizedCount = practices.filter(p => p.isFormalized).length;
  score += formalizedCount * 3; // extra credit for having docs

  // Industry bonus — sectors with higher ESG expectations get a slightly higher baseline
  const highExpectation = ['manufactur', 'chemical', 'food', 'textile', 'electronic', 'construction'];
  if (highExpectation.some(term => industry.toLowerCase().includes(term))) score += 5;

  score = Math.min(score, 100);

  let level: MaturityLevel;
  if (score >= 70) level = 'Leading';
  else if (score >= 50) level = 'Established';
  else if (score >= 25) level = 'Developing';
  else level = 'Emerging';

  return { level, score };
}

// ---------------------------------------------------------------------------
// Readiness score calculation
// ---------------------------------------------------------------------------

export function calculateReadinessScore(
  totalQuestions: number,
  answeredWithData: number,
  answeredWithPractice: number,
  missingDocuments: string[]
): ReadinessScore {
  const unanswered = totalQuestions - answeredWithData - answeredWithPractice;
  const score = totalQuestions > 0
    ? Math.round(((answeredWithData * 1.0 + answeredWithPractice * 0.5) / totalQuestions) * 100)
    : 0;

  let level: ReadinessScore['level'];
  if (score >= 75) level = 'Gold';
  else if (score >= 55) level = 'Silver';
  else if (score >= 35) level = 'Bronze';
  else level = 'Provisional';

  return { score, level, totalQuestions, answeredWithData, answeredWithPractice, unanswered, missingDocuments };
}

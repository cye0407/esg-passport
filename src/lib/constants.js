// ============================================
// ESG PASSPORT - CONSTANTS & DEFAULT DATA
// ============================================

// Emission factors (tCO2e per unit)
export const EMISSION_FACTORS = {
  // Vehicle fuel (diesel, liters to tCO2e)
  vehicleFuel: 0.00268,
  // Natural gas (kWh to tCO2e)
  naturalGas: 0.000182,
  // Electricity grid factors by country (kWh to tCO2e)
  electricity: {
    EU_AVERAGE: 0.000328,
    DE: 0.000420,
    FR: 0.000051,
    UK: 0.000230,
    PL: 0.000760,
    ES: 0.000223,
    NL: 0.000380,
    IT: 0.000281,
    BE: 0.000167,
    DK: 0.000109,
    SE: 0.000008,
    AT: 0.000100,
    CH: 0.000020,
    IE: 0.000300,
    PT: 0.000200,
    CZ: 0.000450,
    NO: 0.000010,
    FI: 0.000080,
  }
};

// Countries list
export const COUNTRIES = [
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'IE', name: 'Ireland' },
  { code: 'OTHER', name: 'Other' },
];

// Industries
export const INDUSTRIES = [
  'Manufacturing',
  'Technology & Software',
  'Professional Services',
  'Wholesale & Distribution',
  'Retail',
  'Construction',
  'Food & Beverage',
  'Healthcare',
  'Logistics & Transport',
  'Energy & Utilities',
  'Chemicals',
  'Textiles & Apparel',
  'Automotive',
  'Other',
];

// Customer segments
export const CUSTOMER_SEGMENTS = [
  { value: 'B2B', label: 'B2B (Business to Business)' },
  { value: 'B2C', label: 'B2C (Business to Consumer)' },
  { value: 'Public', label: 'Public Sector' },
  { value: 'Mixed', label: 'Mixed' },
];

// Request platforms
export const REQUEST_PLATFORMS = [
  { value: 'ecovadis', label: 'EcoVadis' },
  { value: 'cdp', label: 'CDP' },
  { value: 'integritynext', label: 'IntegrityNext' },
  { value: 'supplierportal', label: 'Supplier Portal' },
  { value: 'custom', label: 'Custom Request (Email/PDF)' },
  { value: 'other', label: 'Other' },
];

// Request statuses
export const REQUEST_STATUSES = [
  { value: 'received', label: 'Received', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ready', label: 'Ready to Send', color: 'bg-green-100 text-green-800' },
  { value: 'sent', label: 'Sent', color: 'bg-gray-100 text-gray-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-600' },
];

// Confidence levels
export const CONFIDENCE_LEVELS = [
  { value: 'high', label: 'High', description: 'Measured data from reliable sources (utility bills, certified systems)', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', description: 'Calculated or estimated using documented methodology', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low', description: 'Rough estimates, missing data, or unverified sources', color: 'bg-red-100 text-red-800' },
];

// Data point statuses
export const DATA_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
];

// Policy statuses
export const POLICY_STATUSES = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-600' },
  { value: 'drafting', label: 'Drafting', color: 'bg-blue-100 text-blue-800' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
];

// Default confidence items (VSME-aligned, ordered by importance)
// required: true = needed for ~80% of customer questionnaires
export const DEFAULT_CONFIDENCE_ITEMS = [
  // === REQUIRED FOR 80% OF REPORTING ===
  // Energy & Emissions (core)
  { id: 'electricity', label: 'Electricity Consumption', category: 'environmental', required: true, defaultNotes: 'Measured from utility bills' },
  { id: 'scope1', label: 'Scope 1 Emissions (Direct)', category: 'environmental', required: true, defaultNotes: 'Calculated from fuel use' },
  { id: 'scope2', label: 'Scope 2 Emissions (Electricity)', category: 'environmental', required: true, defaultNotes: 'Grid factor from national data' },
  { id: 'totalEmployees', label: 'Total Employees (FTE)', category: 'social', required: true, defaultNotes: 'From payroll system' },
  { id: 'workInjuries', label: 'Work-Related Injuries', category: 'social', required: true, defaultNotes: 'Safety incident log' },
  { id: 'totalWaste', label: 'Total Waste Generated', category: 'environmental', required: true, defaultNotes: 'From waste hauler invoices' },
  { id: 'codeOfConduct', label: 'Code of Conduct', category: 'governance', required: true, defaultNotes: 'Approved and distributed' },
  { id: 'environmentalPolicy', label: 'Environmental Policy', category: 'governance', required: true, defaultNotes: 'Commitment to env management' },
  { id: 'antiCorruptionPolicy', label: 'Anti-Corruption Policy', category: 'governance', required: true, defaultNotes: 'Board-approved' },
  
  // === COMMONLY REQUESTED (60-80%) ===
  { id: 'naturalGas', label: 'Natural Gas Consumption', category: 'environmental', required: false, defaultNotes: 'Measured from gas bills' },
  { id: 'fleetFuel', label: 'Fleet Fuel Consumption', category: 'environmental', required: false, defaultNotes: 'Fuel cards, may have gaps' },
  { id: 'waterConsumption', label: 'Total Water Consumption', category: 'environmental', required: false, defaultNotes: 'Measured from water bills' },
  { id: 'recyclingRate', label: 'Recycling Rate', category: 'environmental', required: false, defaultNotes: 'Derived from waste data' },
  { id: 'diversityData', label: 'Diversity Data (Gender)', category: 'social', required: false, defaultNotes: 'Have gender, missing other dimensions' },
  { id: 'trainingHours', label: 'Training Hours', category: 'social', required: false, defaultNotes: 'Have formal training, missing informal' },
  { id: 'supplierCodeOfConduct', label: 'Supplier Code of Conduct', category: 'governance', required: false, defaultNotes: 'Extends standards to supply chain' },
  
  // === LESS COMMON BUT VALUABLE ===
  { id: 'hazardousWaste', label: 'Hazardous Waste', category: 'environmental', required: false, defaultNotes: 'Tracked via licensed disposal' },
  { id: 'turnoverRate', label: 'Employee Turnover Rate', category: 'social', required: false, defaultNotes: 'HR system data' },
  { id: 'livingWageCompliance', label: 'Living Wage Compliance', category: 'social', required: false, defaultNotes: 'Need benchmarking study' },
  { id: 'climateTargets', label: 'Climate Targets', category: 'governance', required: false, defaultNotes: 'Setting targets, not final' },
  
  // === SCOPE 3 (ADVANCED) ===
  { id: 'scope3PurchasedGoods', label: 'Scope 3: Purchased Goods', category: 'environmental', required: false, defaultNotes: 'Spend-based, need refinement' },
  { id: 'scope3BusinessTravel', label: 'Scope 3: Business Travel', category: 'environmental', required: false, defaultNotes: 'Have flights, missing taxis' },
  { id: 'scope3Commuting', label: 'Scope 3: Employee Commuting', category: 'environmental', required: false, defaultNotes: 'Based on assumptions, not survey' },
  { id: 'externalVerification', label: 'External Verification', category: 'governance', required: false, defaultNotes: 'Plan for future year' },
];

// Default policies (VSME-aligned, prioritized)
export const DEFAULT_POLICIES = [
  // High Priority
  { id: 'code_of_conduct', name: 'Code of Conduct / Business Ethics', category: 'governance', priority: 'high', notes: 'Foundation for governance' },
  { id: 'environmental_policy', name: 'Environmental Policy', category: 'environmental', priority: 'high', notes: 'Commitment to environmental management' },
  { id: 'health_safety_policy', name: 'Health & Safety Policy', category: 'social', priority: 'high', notes: 'Legal requirement in most countries' },
  { id: 'anti_discrimination', name: 'Anti-Discrimination Policy', category: 'social', priority: 'high', notes: 'Equal opportunity employer' },
  { id: 'anti_corruption', name: 'Anti-Corruption / Anti-Bribery Policy', category: 'governance', priority: 'high', notes: 'Risk management essential' },
  { id: 'data_privacy', name: 'Data Privacy Policy (GDPR)', category: 'governance', priority: 'high', notes: 'Legal requirement in EU' },
  { id: 'whistleblower', name: 'Whistleblower / Grievance Mechanism', category: 'governance', priority: 'high', notes: 'Safe reporting channel' },
  // Medium Priority
  { id: 'energy_management', name: 'Energy Management Policy', category: 'environmental', priority: 'medium', notes: 'Shows commitment to efficiency' },
  { id: 'waste_management', name: 'Waste Management Policy', category: 'environmental', priority: 'medium', notes: 'Circular economy focus' },
  { id: 'human_rights', name: 'Human Rights Policy', category: 'social', priority: 'medium', notes: 'Supply chain transparency' },
  { id: 'diversity_inclusion', name: 'Diversity & Inclusion Policy', category: 'social', priority: 'medium', notes: 'Social performance' },
  { id: 'supplier_code', name: 'Supplier Code of Conduct', category: 'governance', priority: 'medium', notes: 'Extends standards to supply chain' },
  // Low Priority
  { id: 'climate_ghg', name: 'Climate/GHG Emissions Policy', category: 'environmental', priority: 'low', notes: 'Increasingly requested by customers' },
  { id: 'water_management', name: 'Water Management Policy', category: 'environmental', priority: 'low', notes: 'Unless in water-intensive industry' },
  { id: 'biodiversity', name: 'Biodiversity Policy', category: 'environmental', priority: 'low', notes: 'If operations impact natural habitats' },
  { id: 'sustainability_report', name: 'Sustainability/ESG Report (Annual)', category: 'governance', priority: 'low', notes: 'Transparency commitment' },
  { id: 'stakeholder_engagement', name: 'Stakeholder Engagement Plan', category: 'governance', priority: 'low', notes: 'Who you engage and how' },
  { id: 'iso_9001', name: 'Quality Management System (ISO 9001)', category: 'governance', priority: 'low', notes: 'Customer confidence', isCertification: true },
  { id: 'iso_14001', name: 'Environmental Management System (ISO 14001)', category: 'environmental', priority: 'low', notes: 'Systematic environmental management', isCertification: true },
  { id: 'materiality_assessment', name: 'Materiality Assessment', category: 'governance', priority: 'low', notes: 'Shows you understand your impacts' },
];

// Questionnaire topics (for mapping requests to data)
export const QUESTIONNAIRE_TOPICS = [
  { id: 'energy_consumption', label: 'Energy Consumption', dataPoints: ['electricity', 'naturalGas', 'fleetFuel'] },
  { id: 'ghg_scope1', label: 'Scope 1 Emissions', dataPoints: ['scope1'] },
  { id: 'ghg_scope2', label: 'Scope 2 Emissions', dataPoints: ['scope2'] },
  { id: 'ghg_scope3', label: 'Scope 3 Emissions', dataPoints: ['scope3PurchasedGoods', 'scope3BusinessTravel', 'scope3Commuting'] },
  { id: 'water', label: 'Water', dataPoints: ['waterConsumption'] },
  { id: 'waste', label: 'Waste & Recycling', dataPoints: ['totalWaste', 'recyclingRate', 'hazardousWaste'] },
  { id: 'workforce', label: 'Workforce Demographics', dataPoints: ['totalEmployees', 'diversityData'] },
  { id: 'health_safety', label: 'Health & Safety', dataPoints: ['workInjuries'] },
  { id: 'training', label: 'Training', dataPoints: ['trainingHours'] },
  { id: 'policies_env', label: 'Environmental Policies', dataPoints: ['environmentalPolicy'] },
  { id: 'policies_social', label: 'Social Policies', dataPoints: ['codeOfConduct'] },
  { id: 'policies_gov', label: 'Governance Policies', dataPoints: ['antiCorruptionPolicy', 'supplierCodeOfConduct'] },
  { id: 'climate_targets', label: 'Climate Targets', dataPoints: ['climateTargets'] },
  { id: 'certifications', label: 'Certifications', dataPoints: ['externalVerification'] },
];

// Pre-built questionnaire templates
export const QUESTIONNAIRE_TEMPLATES = {
  ecovadis: {
    name: 'EcoVadis Assessment',
    topics: ['energy_consumption', 'ghg_scope1', 'ghg_scope2', 'water', 'waste', 'workforce', 'health_safety', 'training', 'policies_env', 'policies_social', 'policies_gov', 'certifications']
  },
  cdp_climate: {
    name: 'CDP Climate Change',
    topics: ['energy_consumption', 'ghg_scope1', 'ghg_scope2', 'ghg_scope3', 'climate_targets', 'policies_env']
  },
  basic_supplier: {
    name: 'Basic Supplier Questionnaire',
    topics: ['ghg_scope1', 'ghg_scope2', 'policies_env', 'policies_gov', 'certifications']
  },
  comprehensive: {
    name: 'Comprehensive ESG Request',
    topics: ['energy_consumption', 'ghg_scope1', 'ghg_scope2', 'ghg_scope3', 'water', 'waste', 'workforce', 'health_safety', 'training', 'policies_env', 'policies_social', 'policies_gov', 'climate_targets', 'certifications']
  }
};

// Months for data entry
export const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

// ============================================
// Questionnaire-Aware Data Collection Guide
// ============================================
// Analyzes uploaded questions and generates a prioritized
// checklist of documents/data the user needs to gather.

const DATA_SOURCES = {
  energy: {
    label: 'Energy Data',
    icon: 'Zap',
    items: [
      { label: 'Electricity invoices/bills for the reporting period', priority: 1 },
      { label: 'Natural gas invoices/bills', priority: 2 },
      { label: 'Vehicle fuel receipts or fuel card statements', priority: 2 },
      { label: 'Renewable energy certificates (RECs/GOs)', priority: 3 },
    ],
    keywords: ['energy', 'electricity', 'kwh', 'mwh', 'power', 'renewable', 'solar', 'wind', 'fuel', 'gas', 'diesel', 'consumption'],
  },
  emissions: {
    label: 'Emissions Data',
    icon: 'Cloud',
    items: [
      { label: 'Scope 1 emissions calculation or GHG inventory', priority: 1 },
      { label: 'Scope 2 emissions (electricity grid factor × consumption)', priority: 1 },
      { label: 'Scope 3 upstream/downstream estimates if available', priority: 3 },
      { label: 'Emission reduction targets and baseline year', priority: 2 },
    ],
    keywords: ['emission', 'ghg', 'carbon', 'co2', 'scope 1', 'scope 2', 'scope 3', 'climate', 'greenhouse', 'tco2', 'carbon footprint'],
  },
  waste: {
    label: 'Waste Records',
    icon: 'Trash2',
    items: [
      { label: 'Waste collection invoices from waste hauler', priority: 1 },
      { label: 'Recycling records / waste transfer notes', priority: 1 },
      { label: 'Hazardous waste manifest or consignment notes', priority: 2 },
      { label: 'Waste management contractor annual summary', priority: 2 },
    ],
    keywords: ['waste', 'recycl', 'hazardous', 'landfill', 'disposal', 'circular', 'packaging'],
  },
  water: {
    label: 'Water Records',
    icon: 'Droplets',
    items: [
      { label: 'Water utility bills for the reporting period', priority: 1 },
      { label: 'Water meter readings (if sub-metered)', priority: 2 },
      { label: 'Wastewater discharge permits or records', priority: 3 },
    ],
    keywords: ['water', 'consumption', 'discharge', 'effluent', 'wastewater', 'aquatic'],
  },
  workforce: {
    label: 'HR / Workforce Data',
    icon: 'Users',
    items: [
      { label: 'Headcount report from payroll/HR system', priority: 1 },
      { label: 'Gender diversity breakdown', priority: 1 },
      { label: 'New hires and departures (turnover data)', priority: 2 },
      { label: 'Employee contract types (permanent/temporary/part-time)', priority: 3 },
    ],
    keywords: ['employee', 'worker', 'headcount', 'fte', 'staff', 'workforce', 'diversity', 'gender', 'female', 'male', 'hire', 'turnover', 'retention'],
  },
  training: {
    label: 'Training Records',
    icon: 'GraduationCap',
    items: [
      { label: 'Training hours log from HR/LMS', priority: 1 },
      { label: 'ESG/sustainability-specific training records', priority: 2 },
      { label: 'Ethics and compliance training completion rates', priority: 2 },
    ],
    keywords: ['training', 'education', 'awareness', 'skill', 'development', 'learning', 'competenc'],
  },
  safety: {
    label: 'Health & Safety Records',
    icon: 'ShieldAlert',
    items: [
      { label: 'Safety incident log / accident register', priority: 1 },
      { label: 'Lost time injury frequency rate (LTIFR) calculation', priority: 1 },
      { label: 'Near-miss reports', priority: 2 },
      { label: 'OHS risk assessments and audit results', priority: 3 },
    ],
    keywords: ['safety', 'health', 'accident', 'incident', 'injury', 'ohs', 'hazard', 'risk assessment', 'ppe', 'fire', 'emergency', 'first aid', 'near miss', 'trir', 'ltifr'],
  },
  policies: {
    label: 'Policy Documents',
    icon: 'FileText',
    items: [
      { label: 'Environmental policy (signed, dated)', priority: 1 },
      { label: 'Health & Safety policy', priority: 1 },
      { label: 'Code of Conduct / Ethics policy', priority: 1 },
      { label: 'Human Rights / Labor policy', priority: 2 },
      { label: 'Anti-corruption / Anti-bribery policy', priority: 2 },
      { label: 'Supplier Code of Conduct', priority: 2 },
      { label: 'Data Protection / Privacy policy', priority: 3 },
    ],
    keywords: ['policy', 'commitment', 'principle', 'code of conduct', 'governance', 'management system'],
  },
  certificates: {
    label: 'Certifications & Audits',
    icon: 'Award',
    items: [
      { label: 'ISO 14001 certificate (if held)', priority: 1 },
      { label: 'ISO 45001 / OHSAS 18001 certificate', priority: 2 },
      { label: 'ISO 9001 certificate', priority: 3 },
      { label: 'Industry-specific certifications (IATF, GOTS, FSC, etc.)', priority: 2 },
      { label: 'Most recent third-party audit report', priority: 2 },
    ],
    keywords: ['certif', 'iso', 'audit', 'accredit', 'standard', 'verified', 'third party', 'ems', 'management system', 'emas', 'gots', 'fsc'],
  },
  supplychain: {
    label: 'Supply Chain Data',
    icon: 'Link',
    items: [
      { label: 'Supplier list with ESG screening results', priority: 1 },
      { label: 'Supplier Code of Conduct acknowledgments', priority: 2 },
      { label: 'Conflict minerals declaration (CMRT)', priority: 2 },
      { label: 'Supply chain risk assessment results', priority: 3 },
    ],
    keywords: ['supplier', 'supply chain', 'procurement', 'sourcing', 'vendor', 'subcontract', 'due diligence', 'conflict mineral', 'cmrt', '3tg', 'responsible sourcing'],
  },
  governance: {
    label: 'Governance & Compliance',
    icon: 'Scale',
    items: [
      { label: 'Anti-corruption training completion records', priority: 2 },
      { label: 'Whistleblower / grievance mechanism documentation', priority: 2 },
      { label: 'Data protection impact assessments', priority: 3 },
      { label: 'Regulatory compliance register', priority: 3 },
    ],
    keywords: ['ethics', 'corruption', 'bribery', 'whistleblow', 'grievance', 'compliance', 'data protection', 'privacy', 'gdpr', 'sanction', 'transparency'],
  },
};

/**
 * Generate a data collection checklist from parsed questionnaire questions.
 * @param {Array} questions - Parsed questions with text and category
 * @returns {Array<{ label: string, icon: string, items: Array, matchCount: number }>}
 */
export function generateDataChecklist(questions) {
  const allText = questions.map(q => `${q.text || q.questionText || ''} ${q.category || ''}`).join(' ').toLowerCase();

  const matched = [];

  for (const [key, source] of Object.entries(DATA_SOURCES)) {
    let matchCount = 0;
    for (const kw of source.keywords) {
      // Count how many questions mention this keyword
      const regex = new RegExp(kw, 'gi');
      const matches = allText.match(regex);
      if (matches) matchCount += matches.length;
    }

    if (matchCount > 0) {
      matched.push({
        id: key,
        label: source.label,
        icon: source.icon,
        items: source.items.sort((a, b) => a.priority - b.priority),
        matchCount,
        questionCount: questions.filter(q => {
          const qt = `${q.text || q.questionText || ''} ${q.category || ''}`.toLowerCase();
          return source.keywords.some(kw => qt.includes(kw));
        }).length,
      });
    }
  }

  // Sort by match count (most relevant first)
  matched.sort((a, b) => b.matchCount - a.matchCount);
  return matched;
}

// ============================================
// Framework-Specific Scoring & Theme Mapping
// ============================================
// Maps question categories and keywords to framework-specific themes,
// then computes per-theme readiness scores.

// --- EcoVadis 4 themes ---
const ECOVADIS_THEMES = [
  {
    id: 'environment',
    label: 'Environment',
    color: 'green',
    keywords: ['energy', 'emission', 'ghg', 'carbon', 'climate', 'waste', 'water', 'pollution', 'biodiversity', 'renewable', 'recycl', 'environmental', 'scope 1', 'scope 2', 'scope 3', 'co2', 'electricity', 'fuel', 'hazardous'],
    categoryPatterns: ['environment', 'energy', 'water', 'waste', 'pollution', 'biodiversity', 'climate', 'ghg'],
  },
  {
    id: 'labor',
    label: 'Labor & Human Rights',
    color: 'blue',
    keywords: ['employee', 'worker', 'labor', 'labour', 'human rights', 'diversity', 'training', 'health', 'safety', 'accident', 'incident', 'working hours', 'discrimination', 'child labor', 'forced labor', 'freedom of association', 'collective bargaining', 'gender', 'female', 'inclusion', 'wellbeing', 'ppe', 'ohs'],
    categoryPatterns: ['labor', 'social', 'health', 'safety', 'human rights', 'workforce', 'hr', 'working condition'],
  },
  {
    id: 'ethics',
    label: 'Ethics',
    color: 'purple',
    keywords: ['ethics', 'anti-corruption', 'bribery', 'corruption', 'compliance', 'whistleblow', 'data protection', 'privacy', 'gdpr', 'conflict of interest', 'anti-competitive', 'tax', 'transparency', 'governance', 'board', 'audit', 'code of conduct', 'sanctions'],
    categoryPatterns: ['ethics', 'governance', 'compliance', 'business ethics', 'anti-corruption'],
  },
  {
    id: 'procurement',
    label: 'Sustainable Procurement',
    color: 'amber',
    keywords: ['supplier', 'supply chain', 'procurement', 'sourcing', 'vendor', 'subcontract', 'due diligence', 'conflict mineral', 'responsible sourcing', 'supply chain mapping', 'tier 1', 'tier 2', 'audit supplier', 'csr clause'],
    categoryPatterns: ['procurement', 'supply chain', 'supplier', 'sourcing', 'sustainable procurement'],
  },
];

// --- SEDEX 4 pillars ---
const SEDEX_PILLARS = [
  {
    id: 'labour',
    label: 'Labour Standards',
    color: 'blue',
    keywords: ['worker', 'employee', 'labor', 'labour', 'wage', 'working hours', 'overtime', 'contract', 'child labor', 'forced labor', 'freedom of association', 'discrimination', 'migrant', 'recruitment', 'disciplinary', 'grievance', 'gender'],
    categoryPatterns: ['labor', 'labour', 'working condition', 'worker'],
  },
  {
    id: 'health_safety',
    label: 'Health & Safety',
    color: 'red',
    keywords: ['health', 'safety', 'accident', 'incident', 'injury', 'fire', 'emergency', 'ppe', 'chemical', 'risk assessment', 'ohs', 'first aid', 'evacuation', 'ergonomic', 'machinery', 'noise', 'near miss'],
    categoryPatterns: ['health', 'safety', 'ohs', 'h&s'],
  },
  {
    id: 'environment',
    label: 'Environment',
    color: 'green',
    keywords: ['energy', 'emission', 'waste', 'water', 'pollution', 'environmental', 'carbon', 'climate', 'recycl', 'biodiversity', 'renewable', 'hazardous', 'effluent', 'air quality'],
    categoryPatterns: ['environment', 'environmental'],
  },
  {
    id: 'business_ethics',
    label: 'Business Ethics',
    color: 'purple',
    keywords: ['ethics', 'corruption', 'bribery', 'compliance', 'data protection', 'privacy', 'whistleblow', 'governance', 'tax', 'transparency', 'conflict of interest', 'sanctions', 'code of conduct'],
    categoryPatterns: ['ethics', 'governance', 'business ethics'],
  },
];

// --- CDP scoring categories ---
const CDP_CATEGORIES = [
  {
    id: 'governance',
    label: 'Governance',
    color: 'blue',
    keywords: ['governance', 'board', 'oversight', 'responsibility', 'incentive', 'management', 'strategy'],
    categoryPatterns: ['governance'],
  },
  {
    id: 'risks',
    label: 'Risks & Opportunities',
    color: 'amber',
    keywords: ['risk', 'opportunity', 'scenario', 'transition', 'physical risk', 'financial impact', 'resilience', 'adaptation'],
    categoryPatterns: ['risk', 'opportunity'],
  },
  {
    id: 'emissions',
    label: 'Emissions',
    color: 'red',
    keywords: ['emission', 'scope 1', 'scope 2', 'scope 3', 'ghg', 'carbon', 'co2', 'methane', 'inventory', 'verification', 'assurance', 'methodology'],
    categoryPatterns: ['emission', 'ghg'],
  },
  {
    id: 'targets',
    label: 'Targets & Performance',
    color: 'green',
    keywords: ['target', 'reduction', 'net zero', 'sbti', 'science-based', 'performance', 'progress', 'baseline', 'trajectory', 'renewable', 'energy transition'],
    categoryPatterns: ['target', 'performance', 'reduction'],
  },
];

// --- EU GPP criteria ---
const EU_GPP_CRITERIA = [
  {
    id: 'core_env',
    label: 'Core Environmental',
    color: 'green',
    keywords: ['energy efficiency', 'emission', 'recycled content', 'material', 'waste', 'lifecycle', 'lca', 'epd', 'eco-label', 'carbon footprint', 'renewable energy', 'environmental management'],
    categoryPatterns: ['environment', 'environmental', 'energy', 'waste', 'material'],
  },
  {
    id: 'core_social',
    label: 'Social Criteria',
    color: 'blue',
    keywords: ['ilo', 'labour', 'labor', 'human rights', 'supply chain', 'due diligence', 'fair trade', 'living wage', 'working condition', 'child labor', 'forced labor'],
    categoryPatterns: ['social', 'labor', 'labour', 'human rights'],
  },
  {
    id: 'comprehensive',
    label: 'Comprehensive Criteria',
    color: 'purple',
    keywords: ['comprehensive', 'innovation', 'circular', 'design for', 'takeback', 'durability', 'repairability', 'certification', 'iso 14001', 'emas', 'third party', 'verified', 'audited'],
    categoryPatterns: ['comprehensive', 'innovation', 'circular'],
  },
  {
    id: 'governance',
    label: 'Management & Governance',
    color: 'amber',
    keywords: ['management system', 'iso', 'policy', 'compliance', 'monitoring', 'reporting', 'transparency', 'governance', 'stakeholder'],
    categoryPatterns: ['governance', 'management', 'compliance'],
  },
];

// All framework definitions
const FRAMEWORKS = {
  EcoVadis: { themes: ECOVADIS_THEMES, label: 'EcoVadis Themes' },
  CDP: { themes: CDP_CATEGORIES, label: 'CDP Categories' },
  SEDEX: { themes: SEDEX_PILLARS, label: 'SEDEX Pillars' },
  'EU GPP': { themes: EU_GPP_CRITERIA, label: 'EU GPP Criteria' },
  IntegrityNext: { themes: ECOVADIS_THEMES, label: 'IntegrityNext Themes' }, // Similar structure
  RBA: { themes: SEDEX_PILLARS, label: 'RBA Pillars' }, // Similar structure
  Textile: { themes: SEDEX_PILLARS, label: 'Textile Pillars' },
  CMRT: { themes: EU_GPP_CRITERIA, label: 'CMRT Categories' },
};

/**
 * Match a single answer draft to a framework theme.
 * Returns the best-matching theme ID.
 */
function matchToTheme(draft, themes) {
  const text = `${draft.questionText} ${draft.category || ''} ${draft.matchResult?.matchedKeywords?.join(' ') || ''}`.toLowerCase();

  let bestTheme = null;
  let bestScore = 0;

  for (const theme of themes) {
    let score = 0;
    // Check category patterns
    const cat = (draft.category || '').toLowerCase();
    for (const pattern of theme.categoryPatterns) {
      if (cat.includes(pattern)) score += 3;
    }
    // Check keywords in question text
    for (const kw of theme.keywords) {
      if (text.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme.id;
    }
  }

  return bestTheme || themes[0].id; // fallback to first theme
}

/**
 * Compute framework-specific scoring from answer drafts.
 * @param {Array} answerDrafts - Generated answer drafts
 * @param {string|null} framework - Detected framework name
 * @returns {{ themes: Array, overall: number, frameworkLabel: string } | null}
 */
export function computeFrameworkScores(answerDrafts, framework) {
  // Find the right framework definition
  let frameworkDef = null;
  if (framework) {
    // Try exact match first, then partial
    frameworkDef = FRAMEWORKS[framework];
    if (!frameworkDef) {
      const key = Object.keys(FRAMEWORKS).find(k => framework.toLowerCase().includes(k.toLowerCase()));
      if (key) frameworkDef = FRAMEWORKS[key];
    }
  }
  // Default to EcoVadis if no framework detected
  if (!frameworkDef) frameworkDef = FRAMEWORKS.EcoVadis;

  const themes = frameworkDef.themes;
  const themeScores = {};

  // Initialize
  themes.forEach(t => {
    themeScores[t.id] = { ...t, total: 0, answered: 0, high: 0, medium: 0, low: 0, none: 0, questions: [] };
  });

  // Classify each answer into a theme
  answerDrafts.forEach(draft => {
    const themeId = matchToTheme(draft, themes);
    const ts = themeScores[themeId];
    ts.total++;
    ts[draft.answerConfidence]++;
    if (draft.answerConfidence !== 'none') ts.answered++;
    ts.questions.push({ id: draft.questionId, confidence: draft.answerConfidence, markedNA: draft._markedNA });
  });

  // Compute per-theme readiness (weighted: high=1.0, medium=0.7, low=0.3, none=0)
  const themeResults = themes.map(t => {
    const ts = themeScores[t.id];
    if (ts.total === 0) return { ...ts, score: 0 };
    const weighted = (ts.high * 1.0 + ts.medium * 0.7 + ts.low * 0.3) / ts.total;
    return { ...ts, score: Math.round(weighted * 100) };
  });

  // Overall weighted score
  const totalQ = answerDrafts.length || 1;
  const overallWeighted = themeResults.reduce((acc, t) => acc + (t.score * t.total), 0) / totalQ;

  return {
    themes: themeResults,
    overall: Math.round(overallWeighted),
    frameworkLabel: frameworkDef.label,
  };
}

/**
 * Get available framework names for the scoring system.
 */
export const SCORED_FRAMEWORKS = Object.keys(FRAMEWORKS);

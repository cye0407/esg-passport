import type { ParsedQuestion, MatchResult, DataContext, AnswerDraft, GenerationConfig, RetrievedDataPoint } from './types';
import type { CompanyProfile, InformalPractice, PracticeTopic, MaturityLevel } from '../../types/context';
import type { QuestionType, ClassificationResult } from './questionClassifier';
import { FIELD_TO_METRIC_KEY } from './configLoader';
import {
  getIndustryContext, applyIndustryTerms,
  getPlausibleMeasures, getPolicyLanguage,
  domainToTopic, domainToSubcategory,
  getQuestionTypeInstruction
} from './industryContext';
import { rewriteAnswer } from './defensiveRewriter';

interface AnswerTemplate {
  domains: string[];
  topics: string[];
  generate: (dataMap: Map<string, RetrievedDataPoint>, framework?: string) => string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function val(dataMap: Map<string, RetrievedDataPoint>, field: string): string | number | boolean | null {
  const p = dataMap.get(field);
  return p?.value ?? null;
}

function has(dataMap: Map<string, RetrievedDataPoint>, ...fields: string[]): boolean {
  return fields.every(f => {
    const v = val(dataMap, f);
    return v !== null && v !== undefined && v !== '' && v !== 0;
  });
}

function num(dataMap: Map<string, RetrievedDataPoint>, field: string): number {
  const v = val(dataMap, field);
  return typeof v === 'number' ? v : 0;
}

function str(dataMap: Map<string, RetrievedDataPoint>, field: string): string {
  const v = val(dataMap, field);
  return v !== null && v !== undefined ? String(v) : '';
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

function frameworkNote(framework?: string): string {
  if (!framework) return '';
  const notes: Record<string, string> = {
    CSRD: ' This disclosure is aligned with ESRS reporting requirements under the CSRD.',
    GRI: ' This disclosure follows GRI Standards reporting principles.',
    CDP: ' This information is provided in line with CDP disclosure expectations.',
    EcoVadis: ' This data supports our EcoVadis assessment submission.',
    SASB: ' This metric is reported consistent with SASB industry-specific standards.',
    TCFD: ' This information is disclosed in line with TCFD recommendations.',
  };
  return notes[framework] || '';
}

// ---------------------------------------------------------------------------
// Rich answer templates
// ---------------------------------------------------------------------------

const ANSWER_TEMPLATES: AnswerTemplate[] = [
  // ----- Energy & Electricity -----
  {
    domains: ['energy_electricity'],
    topics: ['energy_consumption', 'renewable_energy'],
    generate: (dm, fw) => {
      if (!has(dm, 'totalElectricity')) return null;
      const kwh = num(dm, 'totalElectricity');
      const renPct = num(dm, 'renewablePercent');
      const period = str(dm, 'reportingPeriod');
      const periodStr = period ? ` during ${period}` : ' during the reporting period';

      let answer = `Our total electricity consumption was ${fmt(kwh)} kWh${periodStr}.`;
      if (renPct > 0) {
        const renKwh = kwh * renPct / 100;
        answer += ` Of this, ${fmt(renPct)}% (approximately ${fmt(renKwh)} kWh) was sourced from renewable energy.`;
        if (renPct >= 50) {
          answer += ' We continue to prioritize the transition to renewable electricity across our operations.';
        } else {
          answer += ' We are actively working to increase our share of renewable electricity.';
        }
      } else {
        answer += ' We are evaluating options to increase our renewable electricity procurement.';
      }
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- GHG Emissions -----
  {
    domains: ['emissions'],
    topics: ['ghg_emissions', 'scope_1', 'scope_2'],
    generate: (dm, fw) => {
      const s1 = num(dm, 'scope1Estimate');
      const s2 = num(dm, 'scope2Location');
      const s2m = num(dm, 'scope2Market');
      if (s1 === 0 && s2 === 0 && !dm.has('scope1Estimate') && !dm.has('scope2Location')) return null;

      const period = str(dm, 'reportingPeriod');
      const periodStr = period ? ` for ${period}` : ' for the reporting period';
      const parts: string[] = [];

      parts.push(`Our greenhouse gas (GHG) emissions${periodStr} are as follows:`);
      if (s1) parts.push(`Scope 1 (direct) emissions: ${fmt(s1)} tCO2e, covering stationary combustion, mobile sources, and any fugitive emissions.`);
      if (s2) {
        parts.push(`Scope 2 (indirect, location-based) emissions: ${fmt(s2)} tCO2e from purchased electricity.`);
        if (s2m) parts.push(`Scope 2 (market-based) emissions: ${fmt(s2m)} tCO2e, reflecting our renewable energy procurement.`);
      }

      const s1Point = dm.get('scope1Estimate');
      const s2Point = dm.get('scope2Location');
      const isEstimate = (s1Point?.confidence === 'medium') || (s2Point?.confidence === 'medium') ||
        (s1Point?.label?.toLowerCase().includes('auto-calculated')) || (s2Point?.label?.toLowerCase().includes('auto-calculated'));
      if (isEstimate) {
        parts.push('Note: Some figures are estimates derived from activity data (fuel consumption, electricity use) and standard emission factors. We are working to improve the granularity of our GHG inventory.');
      }

      const total = s1 + s2;
      if (total > 0) {
        parts.push(`Total Scope 1 + Scope 2 (location-based): ${fmt(total)} tCO2e.`);
      }

      let answer = parts.join(' ');
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- Workforce / Employee Count -----
  {
    domains: ['workforce'],
    topics: ['employee_count'],
    generate: (dm, fw) => {
      if (!has(dm, 'totalFte')) return null;
      const fte = num(dm, 'totalFte');
      const period = str(dm, 'reportingPeriod');
      const country = str(dm, 'headquartersCountry');
      const sites = num(dm, 'numberOfSites');

      let answer = `As of ${period || 'the end of the reporting period'}, our organization employs ${fmt(fte)} full-time equivalent (FTE) employees`;
      if (sites > 1) answer += ` across ${sites} operational sites`;
      if (country) answer += `, headquartered in ${country}`;
      answer += '.';
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- Diversity -----
  {
    domains: ['workforce'],
    topics: ['diversity'],
    generate: (dm, fw) => {
      if (!has(dm, 'totalFte', 'femalePercent')) return null;
      const fte = num(dm, 'totalFte');
      const fem = num(dm, 'femalePercent');
      const male = 100 - fem;

      let answer = `Our workforce of ${fmt(fte)} FTE employees comprises ${fmt(fem)}% female and ${fmt(male)}% male employees.`;
      if (fem >= 40 && fem <= 60) {
        answer += ' We maintain a relatively balanced gender distribution across our organization.';
      } else if (fem < 30) {
        answer += ' We recognize the need to improve gender diversity and are implementing initiatives to attract and retain a more diverse workforce.';
      }
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- Health & Safety -----
  {
    domains: ['health_safety'],
    topics: ['health_safety'],
    generate: (dm, fw) => {
      const trir = num(dm, 'trir');
      const lti = num(dm, 'lostTimeIncidents');
      const fat = num(dm, 'fatalities');
      if (trir === 0 && lti === 0 && fat === 0 && !has(dm, 'trir')) return null;

      const period = str(dm, 'reportingPeriod');
      const periodStr = period ? ` during ${period}` : ' during the reporting period';
      const parts: string[] = [];

      parts.push(`Our occupational health and safety performance${periodStr}:`);
      if (has(dm, 'trir')) parts.push(`Total Recordable Incident Rate (TRIR): ${trir}.`);
      parts.push(`Lost time incidents: ${lti}.`);
      parts.push(`Fatalities: ${fat}.`);

      if (fat === 0 && lti === 0) {
        parts.push('We are pleased to report zero lost time incidents and zero fatalities. Our health and safety management system focuses on proactive hazard identification and continuous improvement.');
      } else if (fat === 0) {
        parts.push('While we recorded zero fatalities, we continue to investigate all incidents to prevent recurrence and strengthen our safety culture.');
      }

      let answer = parts.join(' ');
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- Waste -----
  {
    domains: ['waste'],
    topics: ['waste_management', 'recycling'],
    generate: (dm, fw) => {
      if (!has(dm, 'totalWaste')) return null;
      const waste = num(dm, 'totalWaste');
      const div = num(dm, 'diversionRate');
      const haz = num(dm, 'hazardousWaste');
      const period = str(dm, 'reportingPeriod');
      const periodStr = period ? ` during ${period}` : ' during the reporting period';

      let answer = `Our total waste generated${periodStr} was ${fmt(waste)} kg (${fmt(waste / 1000)} tonnes).`;
      if (div > 0) {
        answer += ` We achieved a waste diversion rate of ${fmt(div)}%, meaning ${fmt(waste * div / 100)} kg was recycled or recovered rather than sent to landfill.`;
      }
      if (haz > 0) {
        answer += ` Of this total, ${fmt(haz)} kg was classified as hazardous waste, managed in accordance with applicable regulations.`;
      }
      if (div >= 75) {
        answer += ' Our high diversion rate reflects our commitment to circular economy principles and waste minimization.';
      } else if (div > 0) {
        answer += ' We continue to implement waste reduction initiatives to improve our diversion rate.';
      }
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- Water -----
  {
    domains: ['energy_water'],
    topics: ['water_usage'],
    generate: (dm, fw) => {
      if (!has(dm, 'waterWithdrawal')) return null;
      const water = num(dm, 'waterWithdrawal');
      const period = str(dm, 'reportingPeriod');
      const periodStr = period ? ` during ${period}` : ' during the reporting period';
      const fte = num(dm, 'totalFte');

      let answer = `Our total water withdrawal${periodStr} was ${fmt(water)} m\u00B3.`;
      if (fte > 0) {
        const perCapita = water / fte;
        answer += ` This equates to approximately ${fmt(perCapita)} m\u00B3 per employee.`;
      }
      answer += ' We monitor water usage across our operations and seek to reduce consumption through efficiency measures.';
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- Company Profile -----
  {
    domains: ['company'],
    topics: ['company_profile', 'employee_count'],
    generate: (dm, fw) => {
      if (!has(dm, 'legalEntityName')) return null;
      const name = str(dm, 'legalEntityName');
      const ind = str(dm, 'industryDescription');
      const country = str(dm, 'headquartersCountry');
      const fte = num(dm, 'totalFte');
      const sites = num(dm, 'numberOfSites');
      const rev = str(dm, 'revenueBand');
      const period = str(dm, 'reportingPeriod');

      let answer = `${name} is ${ind ? `a ${ind} company` : 'an organization'}`;
      if (country) answer += ` headquartered in ${country}`;
      answer += '.';
      if (fte) answer += ` We employ ${fmt(fte)} FTE`;
      if (sites > 1) answer += ` across ${sites} operational sites`;
      if (fte) answer += '.';
      if (rev) answer += ` Revenue band: ${rev}.`;
      if (period) answer += ` This data covers the reporting period ${period}.`;
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- Certifications -----
  {
    domains: ['regulatory'],
    topics: ['certifications'],
    generate: (dm, fw) => {
      if (!has(dm, 'certificationsHeld')) return null;
      const certs = str(dm, 'certificationsHeld');
      let answer = `Our organization holds the following certifications and accreditations: ${certs}. These certifications are maintained through regular external audits and demonstrate our commitment to internationally recognized management standards.`;
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- Training -----
  {
    domains: ['training'],
    topics: ['training'],
    generate: (dm, fw) => {
      if (!has(dm, 'trainingHoursPerEmployee')) return null;
      const perEmp = num(dm, 'trainingHoursPerEmployee');
      const total = num(dm, 'totalTrainingHours');
      const fte = num(dm, 'totalFte');
      const period = str(dm, 'reportingPeriod');
      const periodStr = period ? ` during ${period}` : ' during the reporting period';

      let answer = `${periodStr.charAt(0).toUpperCase() + periodStr.slice(1)}, we delivered an average of ${fmt(perEmp)} training hours per employee.`;
      if (total > 0 && fte > 0) {
        answer += ` This represents a total of ${fmt(total)} hours of training across our ${fmt(fte)} employees.`;
      }
      answer += ' Training programmes cover areas including health and safety, technical skills, and sustainability awareness.';
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- Sustainability Goals / Targets -----
  {
    domains: ['goals'],
    topics: ['targets', 'strategy', 'climate_targets'],
    generate: (dm, fw) => {
      const goal = str(dm, 'primaryGoal');
      if (!goal) return null;
      let answer = `Our primary sustainability commitment is: ${goal}. We are integrating this target into our business strategy and operational planning, and we track progress against this goal as part of our regular management review process.`;
      answer += frameworkNote(fw);
      return answer;
    },
  },

  // ----- Fuel -----
  {
    domains: ['energy_fuel'],
    topics: ['energy_consumption', 'scope_1'],
    generate: (dm, fw) => {
      const gas = num(dm, 'fuel_natural_gas');
      const diesel = num(dm, 'fuel_diesel');
      if (!gas && !diesel) return null;
      const period = str(dm, 'reportingPeriod');
      const periodStr = period ? ` during ${period}` : ' during the reporting period';
      const parts: string[] = [`Our fuel consumption${periodStr}:`];
      if (gas) parts.push(`Natural gas: ${fmt(gas)} m\u00B3.`);
      if (diesel) parts.push(`Diesel: ${fmt(diesel)} litres.`);
      parts.push('Fuel consumption is a key input for our Scope 1 emissions calculation. We are evaluating opportunities to reduce fossil fuel dependency through electrification and energy efficiency measures.');
      let answer = parts.join(' ');
      answer += frameworkNote(fw);
      return answer;
    },
  },
];

// ---------------------------------------------------------------------------
// Informal Practice → Domain mapping
// ---------------------------------------------------------------------------

const PRACTICE_TOPIC_TO_DOMAINS: Record<PracticeTopic, DataDomain[]> = {
  'ENVIRONMENT': ['energy_electricity', 'energy_fuel', 'energy_water', 'emissions', 'waste'],
  'LABOR': ['workforce', 'health_safety', 'training'],
  'ETHICS': ['regulatory', 'goals'],
  'SUPPLY_CHAIN': ['materials', 'transport'],
};

type DataDomain = MatchResult['primaryDomain'];

function findRelevantPractices(
  practices: InformalPractice[],
  matchResult: MatchResult
): InformalPractice[] {
  const allDomains = [matchResult.primaryDomain, ...matchResult.secondaryDomains].filter(Boolean);
  return practices.filter(p => {
    const practiceDomains = PRACTICE_TOPIC_TO_DOMAINS[p.topic] || [];
    return practiceDomains.some(d => allDomains.includes(d));
  });
}

/**
 * Generate a "roadmap" answer when informal practices exist but formal data/policy is missing.
 * This is the core Phase 1 pivot: instead of "We don't have this", say what IS being done.
 */
function generateInformalManagementAnswer(
  companyName: string,
  practices: InformalPractice[],
  matchResult: MatchResult,
  industry: string,
  framework?: string
): string {
  const ctx = getIndustryContext(industry);
  const formalized = practices.filter(p => p.isFormalized);
  const informal = practices.filter(p => !p.isFormalized);

  const parts: string[] = [];

  // Lead with the action, never with "we don't have"
  parts.push(`${companyName} operates with a commitment to responsible ${matchResult.primaryDomain === 'emissions' || matchResult.primaryDomain === 'energy_electricity' ? 'environmental' : 'operational'} management.`);

  // Describe formalized practices
  if (formalized.length > 0) {
    const formalDescs = formalized.map(p => p.description).join('; ');
    parts.push(`Our established practices include: ${formalDescs}.`);
  }

  // Describe informal practices with roadmap framing
  if (informal.length > 0) {
    const informalDescs = informal.map(p => p.description).join('; ');
    parts.push(`Our current operations include: ${informalDescs}.`);
    parts.push('We are in the process of formalizing these practices into documented policies and procedures to strengthen our management approach.');
  }

  // Add industry-appropriate management approach
  const topicsCovered = [...new Set(practices.map(p => p.topic))];
  for (const topic of topicsCovered) {
    const approach = ctx.managementApproaches[topic];
    if (approach) {
      parts.push(`Our management approach encompasses ${approach}.`);
      break; // only add one to avoid verbosity
    }
  }

  let answer = parts.join(' ');
  answer = applyIndustryTerms(answer, ctx);
  answer += frameworkNote(framework);
  return answer;
}

// ---------------------------------------------------------------------------
// Phase 2: Multi-Template Matrix (QuestionType × Maturity)
// ---------------------------------------------------------------------------

type MaturityBand = 'none' | 'informal' | 'formal';

function resolveMaturityBand(
  profile: CompanyProfile | undefined,
  matchResult: MatchResult,
  hasData: boolean
): MaturityBand {
  if (!profile) return hasData ? 'formal' : 'none';

  // Check if there are formalized practices for this domain
  const domain = matchResult.primaryDomain;
  if (!domain) return hasData ? 'formal' : 'none';

  const topic = domainToTopic(domain);
  if (!topic) return hasData ? 'formal' : 'none';

  const relevantPractices = profile.informalPractices.filter(p => p.topic === topic);
  const hasFormal = relevantPractices.some(p => p.isFormalized);
  const hasInformal = relevantPractices.length > 0;

  if (hasFormal || hasData) return 'formal';
  if (hasInformal) return 'informal';
  return 'none';
}

/**
 * Phase 2: Generate a matrix-selected answer based on question type and maturity band.
 * Returns null if the matrix doesn't apply (falls through to Phase 1 logic).
 */
function generateMatrixAnswer(
  questionType: QuestionType,
  maturityBand: MaturityBand,
  matchResult: MatchResult,
  dataMap: Map<string, RetrievedDataPoint>,
  context: DataContext,
  profile: CompanyProfile,
  framework?: string
): string | null {
  const companyName = profile.companyName;
  const industry = profile.industry;
  const indCtx = getIndustryContext(industry);
  const domain = matchResult.primaryDomain;
  const topic = domain ? domainToTopic(domain) : null;
  const subcategory = domain ? domainToSubcategory(domain) : null;
  const reportingYear = profile.reportingPeriod || '2024';
  const nextYear = String(parseInt(reportingYear) + 1 || 2025);

  const parts: string[] = [];

  // -------- POLICY × Maturity --------
  if (questionType === 'POLICY') {
    if (maturityBand === 'none') {
      // Roadmap Template
      const vision = topic ? getPolicyLanguage(industry, topic, 'vision') : null;
      const roadmap = topic ? getPolicyLanguage(industry, topic, 'roadmap', nextYear) : null;
      parts.push(`${companyName} is ${vision || 'committed to responsible management in this area'}.`);
      parts.push(roadmap || `We are developing a formalised policy for publication in ${nextYear}.`);
      parts.push(`In the interim, our approach is guided by ${indCtx.managementApproaches[topic || 'ENVIRONMENT'] || 'established operational practices'}.`);
    } else if (maturityBand === 'informal') {
      // Practice Template
      const informal = topic ? getPolicyLanguage(industry, topic, 'informal') : null;
      const roadmap = topic ? getPolicyLanguage(industry, topic, 'roadmap', nextYear) : null;
      parts.push(`${companyName} is ${topic ? getPolicyLanguage(industry, topic, 'vision') || 'committed to responsible management' : 'committed to responsible management'}.`);
      if (informal) parts.push(informal + '.');
      // Add relevant informal practices
      const relevantPractices = profile.informalPractices.filter(p => p.topic === topic);
      if (relevantPractices.length > 0) {
        const descs = relevantPractices.slice(0, 3).map(p => p.description).join('; ');
        parts.push(`Current practices include: ${descs}.`);
      }
      if (roadmap) parts.push(roadmap + '.');
    } else {
      // Full Template
      const formal = topic ? getPolicyLanguage(industry, topic, 'formal') : null;
      if (formal) {
        parts.push(formal + '.');
      } else {
        parts.push(`${companyName} maintains a comprehensive management approach in this area.`);
      }
      // Add certifications if available
      const certs = str(dataMap, 'certificationsHeld');
      if (certs) parts.push(`This is supported by our certifications: ${certs}.`);
      const goal = str(dataMap, 'primaryGoal');
      if (goal) parts.push(`Our policy commitment is further demonstrated by our target: ${goal}.`);
    }
  }

  // -------- MEASURE × Maturity --------
  else if (questionType === 'MEASURE') {
    if (maturityBand === 'none') {
      // Intent Template
      parts.push(`${companyName} is developing structured measures in this area.`);
      const measures = topic && subcategory ? getPlausibleMeasures(industry, topic, subcategory, 2) : [];
      if (measures.length > 0) {
        parts.push(`Planned initiatives for ${nextYear} include: ${measures.join('; ')}.`);
      }
      parts.push(`Our management approach encompasses ${indCtx.managementApproaches[topic || 'ENVIRONMENT'] || 'operational controls managed through our existing business processes'}.`);
    } else if (maturityBand === 'informal') {
      // Operational Template — this is the Phase 2 "money shot"
      parts.push(`In our ${industry.toLowerCase()} environment, ${topic === 'LABOR' ? 'health and safety are' : 'this area is'} managed through operational controls including:`);
      // Pull plausible measures from the library
      const measures = topic && subcategory ? getPlausibleMeasures(industry, topic, subcategory, 3) : [];
      if (measures.length > 0) {
        measures.forEach(m => parts.push(`- ${m}`));
      }
      // Add informal practices the user checked
      const relevantPractices = profile.informalPractices.filter(p => p.topic === topic);
      if (relevantPractices.length > 0) {
        const descs = relevantPractices.slice(0, 2).map(p => p.description);
        descs.forEach(d => parts.push(`- ${d}`));
      }
      const policyLabel = topic === 'LABOR' ? 'Health & Safety' : topic === 'ENVIRONMENT' ? 'Environmental' : topic === 'ETHICS' ? 'Ethics' : 'Supply Chain';
      parts.push(`While we are currently formalizing these into a standalone ${policyLabel} Policy for ${nextYear}, these operational measures ensure immediate risk mitigation across our operations.`);
    } else {
      // Verified Template
      parts.push(`${companyName} implements structured measures in this area, aligned with our management system.`);
      const measures = topic && subcategory ? getPlausibleMeasures(industry, topic, subcategory, 3) : [];
      if (measures.length > 0) {
        parts.push('Key measures include:');
        measures.forEach(m => parts.push(`- ${m}`));
      }
      const certs = str(dataMap, 'certificationsHeld');
      if (certs) parts.push(`These measures are implemented within the framework of our ${certs} management system.`);
    }
  }

  // -------- KPI × Maturity --------
  else if (questionType === 'KPI') {
    if (maturityBand === 'none') {
      // Baseline Template
      parts.push(`${companyName} is establishing a baseline for this indicator.`);
      parts.push(`We are setting up data collection processes to enable quantified reporting in our ${nextYear} disclosure cycle.`);
      parts.push('Preliminary data sources include utility invoices and operational records.');
    } else if (maturityBand === 'informal') {
      // Estimated Template — use whatever data is available
      const allPoints = [...context.operational, ...context.calculated];
      if (allPoints.length > 0) {
        const dataStatements = allPoints.slice(0, 4).filter(p => p.value !== null).map(p =>
          `${p.label}: ${p.value}${p.unit ? ' ' + p.unit : ''}`
        );
        if (dataStatements.length > 0) {
          parts.push(dataStatements.join('. ') + '.');
          parts.push('Note: These values are calculated from operational records (utility invoices, production logs). We are working to establish externally verified reporting for future periods.');
        }
      } else {
        parts.push(`${companyName} tracks this indicator through operational records such as utility invoices and production data.`);
        parts.push(`We are consolidating this data into a formal ${reportingYear} inventory to establish a baseline for future reduction targets.`);
      }
    } else {
      // Audited / Full data Template — let the existing rich templates handle it
      return null; // fall through to ANSWER_TEMPLATES
    }
  }

  if (parts.length === 0) return null;

  let answer = parts.join(' ');
  answer = applyIndustryTerms(answer, indCtx);
  answer += frameworkNote(framework);
  return answer;
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

function findMatchingTemplate(matchResult: MatchResult): AnswerTemplate | null {
  if (!matchResult.primaryDomain) return null;
  const candidates = ANSWER_TEMPLATES.filter(t => {
    const domainMatch = t.domains.includes(matchResult.primaryDomain!) || matchResult.secondaryDomains.some(d => t.domains.includes(d));
    if (!domainMatch) return false;
    return t.topics.some(topic => matchResult.topics.includes(topic as any));
  });
  return candidates.sort((a, b) => {
    const aOverlap = a.topics.filter(t => matchResult.topics.includes(t as any)).length;
    const bOverlap = b.topics.filter(t => matchResult.topics.includes(t as any)).length;
    return bOverlap - aOverlap;
  })[0] || null;
}

function buildDataMap(context: DataContext): Map<string, RetrievedDataPoint> {
  const map = new Map<string, RetrievedDataPoint>();
  [...context.company, ...context.operational, ...context.calculated].forEach(point => {
    map.set(point.field, point);
  });
  return map;
}

function generateSimpleAnswer(
  context: DataContext,
  matchResult: MatchResult,
  framework?: string,
  profile?: CompanyProfile,
  questionType?: QuestionType
): { answer: string; dataValue?: string; dataSource?: string; usedPractice?: boolean } {
  const dataMap = buildDataMap(context);
  const ctx = profile ? getIndustryContext(profile.industry) : null;
  const allPoints = [...context.company, ...context.operational, ...context.calculated];
  const hasData = allPoints.some(p => p.value !== null && p.value !== undefined && p.value !== '' && p.value !== 0);

  // Phase 2: Try the multi-template matrix first (when profile + questionType available)
  if (profile && questionType) {
    const maturityBand = resolveMaturityBand(profile, matchResult, hasData);
    const matrixAnswer = generateMatrixAnswer(
      questionType, maturityBand, matchResult, dataMap, context, profile, framework
    );
    if (matrixAnswer) {
      const primaryPoint = allPoints[0];
      return {
        answer: matrixAnswer,
        dataValue: primaryPoint ? `${primaryPoint.value}${primaryPoint.unit ? ' ' + primaryPoint.unit : ''}` : undefined,
        dataSource: primaryPoint?.source as string | undefined,
        usedPractice: maturityBand === 'informal' || maturityBand === 'none',
      };
    }
  }

  // Phase 1: Try rich data templates (these are good for KPI with formal data)
  const template = findMatchingTemplate(matchResult);
  if (template) {
    let answer = template.generate(dataMap, framework);
    if (answer) {
      if (ctx) answer = applyIndustryTerms(answer, ctx);
      const primaryPoint = allPoints[0];
      return {
        answer,
        dataValue: primaryPoint ? `${primaryPoint.value}${primaryPoint.unit ? ' ' + primaryPoint.unit : ''}` : undefined,
        dataSource: primaryPoint?.source as string | undefined,
      };
    }
  }

  // Phase 1 Pivot: if template failed but we have informal practices, use them
  if (profile && profile.informalPractices.length > 0) {
    const relevant = findRelevantPractices(profile.informalPractices, matchResult);
    if (relevant.length > 0) {
      const answer = generateInformalManagementAnswer(
        profile.companyName, relevant, matchResult, profile.industry, framework
      );
      return { answer, usedPractice: true };
    }
  }

  // Fallback: build a structured answer from available data points
  if (allPoints.length === 0) {
    const name = profile?.companyName || 'Our organization';
    return { answer: `${name} is currently establishing formal data collection processes in this area. We are committed to developing robust reporting capabilities and will include comprehensive disclosures in future reporting periods.` };
  }

  const statements = allPoints.slice(0, 5).filter(p => p.value !== null && p.value !== undefined).map(p => {
    if (typeof p.value === 'boolean') return `${p.label}: ${p.value ? 'Yes' : 'No'}`;
    return `${p.label}: ${p.value}${p.unit ? ' ' + p.unit : ''}`;
  });

  if (statements.length === 0) {
    const name = profile?.companyName || 'Our organization';
    return { answer: `${name} is reviewing data collection processes to ensure this information is available for future reporting cycles.` };
  }

  let answer = statements.join('. ') + '.';
  if (ctx) answer = applyIndustryTerms(answer, ctx);
  answer += frameworkNote(framework);
  return {
    answer,
    dataValue: allPoints[0]?.value !== undefined ? `${allPoints[0].value}${allPoints[0].unit ? ' ' + allPoints[0].unit : ''}` : undefined,
  };
}

function determineConfidence(context: DataContext, matchResult: MatchResult): 'high' | 'medium' | 'low' | 'none' {
  const allPoints = [...context.company, ...context.operational, ...context.calculated];
  if (allPoints.length === 0) return 'none';
  const hasHighConfidence = allPoints.some(p => p.confidence === 'high');
  const hasMediumConfidence = allPoints.some(p => p.confidence === 'medium');
  const hasDataGaps = context.metadata.dataGaps.length > 0;

  if (matchResult.confidence === 'high' && hasHighConfidence && !hasDataGaps) return 'high';
  if (matchResult.confidence !== 'none' && (hasHighConfidence || hasMediumConfidence)) return 'medium';
  if (allPoints.length > 0) return 'low';
  return 'none';
}

export function generateAnswerDraft(
  question: ParsedQuestion,
  matchResult: MatchResult,
  dataContext: DataContext,
  _config: GenerationConfig,
  profile?: CompanyProfile,
  classification?: ClassificationResult
): AnswerDraft {
  const framework = question.framework;
  const questionType = classification?.questionType;
  const { answer, dataValue, dataSource, usedPractice } = generateSimpleAnswer(dataContext, matchResult, framework, profile, questionType);
  const answerConfidence = determineConfidence(dataContext, matchResult);
  const limitations: string[] = [...dataContext.metadata.dataGaps];
  const assumptions: string[] = [];
  const hasEstimates = dataContext.calculated.some(p => p.label.toLowerCase().includes('estimate') || p.label.toLowerCase().includes('auto-calculated') || p.confidence === 'low' || p.confidence === 'medium');
  if (hasEstimates) assumptions.push('Some values are estimates based on activity data and standard emission factors.');

  // Determine confidenceSource
  let confidenceSource: 'provided' | 'estimated' | 'unknown';
  if (answerConfidence === 'none') {
    confidenceSource = 'unknown';
  } else if (hasEstimates || answerConfidence === 'low') {
    confidenceSource = 'estimated';
  } else {
    confidenceSource = 'provided';
  }

  // Collect metric keys used from data context fields
  const allPoints = [...dataContext.company, ...dataContext.operational, ...dataContext.calculated];
  const metricKeysUsed = [...new Set(
    allPoints.map(p => FIELD_TO_METRIC_KEY[p.field]).filter((k): k is string => !!k)
  )];

  // Merge metric keys from CSV match if available
  const csvExtra = matchResult as MatchResult & { csvMetricKeys?: string[]; csvPromptIfMissing?: string };
  if (csvExtra.csvMetricKeys) {
    for (const k of csvExtra.csvMetricKeys) {
      if (!metricKeysUsed.includes(k)) metricKeysUsed.push(k);
    }
  }

  // Phase 1: if informal practice was used, upgrade from 'unknown' to 'estimated'
  if (usedPractice && confidenceSource === 'unknown') {
    confidenceSource = 'estimated';
  }

  // Unknown handling: show prompt text when no data (and no practice filled the gap)
  let finalAnswer = answer;
  let promptForMissing: string | undefined = csvExtra.csvPromptIfMissing || undefined;
  if (confidenceSource === 'unknown' && !usedPractice) {
    const promptSuffix = promptForMissing ? ` ${promptForMissing}` : '';
    finalAnswer = `Unknown — input required.${promptSuffix}`;
  } else {
    // Phase 3: Apply defensive rewriter to non-unknown answers
    finalAnswer = rewriteAnswer(finalAnswer);
  }

  return {
    questionId: question.id, questionText: question.text, category: question.category,
    questionType, // Phase 2
    matchResult, dataContext,
    answer: finalAnswer, dataValue, dataPeriod: dataContext.metadata.reportingPeriod, dataSource,
    answerConfidence,
    confidenceSource,
    methodology: undefined,
    assumptions: assumptions.length > 0 ? assumptions : undefined,
    limitations: limitations.length > 0 ? limitations : undefined,
    evidence: '',
    metricKeysUsed,
    promptForMissing,
    needsReview: answerConfidence !== 'high',
    isEstimate: hasEstimates,
    hasDataGaps: dataContext.metadata.dataGaps.length > 0
  };
}

export function generateAnswerDrafts(
  questions: ParsedQuestion[], matchResults: MatchResult[], dataContexts: DataContext[], config: GenerationConfig, profile?: CompanyProfile, classifications?: ClassificationResult[]
): AnswerDraft[] {
  return questions.map((q, i) => generateAnswerDraft(q, matchResults[i], dataContexts[i], config, profile, classifications?.[i]));
}

export function buildLLMPrompt(question: ParsedQuestion, dataContext: DataContext, config: GenerationConfig, profile?: CompanyProfile, questionType?: QuestionType): string {
  const dataPoints = [...dataContext.company, ...dataContext.operational, ...dataContext.calculated];
  const dataSection = dataPoints.length > 0
    ? dataPoints.map(p => `- ${p.label}: ${p.value}${p.unit ? ' ' + p.unit : ''}`).join('\n')
    : 'No relevant data available.';

  const verbosityInstruction = { concise: 'Provide a brief, direct answer (1-2 sentences).', standard: 'Provide a clear, professional answer (2-4 sentences).', detailed: 'Provide a comprehensive answer with context (3-6 sentences).' }[config.verbosity];

  const frameworkInstruction = question.framework
    ? `\n- Align your response with ${question.framework} reporting requirements and terminology.`
    : '';

  // Phase 1: Company profile context injection
  let profileSection = '';
  if (profile) {
    profileSection = `\nCompany Context:
- Company: ${profile.companyName}
- Industry: ${profile.industry}${profile.subIndustry ? ` (${profile.subIndustry})` : ''}
- Country: ${profile.country}
- Employees: ${profile.employeeCount}
- Sites: ${profile.numberOfSites}
- Maturity Level: ${profile.maturityLevel}
`;

    if (profile.informalPractices.length > 0) {
      const practiceLines = profile.informalPractices.map(p =>
        `- [${p.isFormalized ? 'Formalized' : 'Informal'}] ${p.description}`
      ).join('\n');
      profileSection += `\nInformal Practices Already in Place:\n${practiceLines}\n`;
    }
  }

  // Phase 1: New constraints
  const phaseOneConstraints = `
- NEVER start a sentence with "Based on available data" or "We do not yet have".
- Always lead with the ACTION being taken. If the action is informal, describe the process.
- If a gap exists, describe the commitment to formalize it rather than stating the absence.
- Use industry-appropriate terminology${profile?.industry ? ` for ${profile.industry}` : ''}.`;

  // Phase 2: Question type instruction
  const questionTypeSection = questionType && profile
    ? `\nQuestion Classification: ${questionType}\n${getQuestionTypeInstruction(questionType, profile.industry)}\n`
    : '';

  return `You are helping a company respond to a sustainability questionnaire. Compose a professional, submission-ready response.

Question: ${question.text}
${question.category ? `Category: ${question.category}` : ''}
${question.framework ? `Framework: ${question.framework}` : ''}
${questionTypeSection}${profileSection}
Available Data:
${dataSection}

Instructions:
- ${verbosityInstruction}${frameworkInstruction}${phaseOneConstraints}
- Use the provided data values accurately.
- Write in first person plural (we, our).
- Do not fabricate data that is not provided.

Response:`;
}

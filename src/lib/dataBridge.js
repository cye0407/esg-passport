// ============================================
// Data Bridge: Passport Store → Response Engine CompanyData
// ============================================
// Translates the ESG Passport's localStorage data model
// into the flat CompanyData type the answer engine expects.

import { getDataRecords, getAnnualTotals, getCompanyProfile, getPolicies, getDocuments, getConfidenceRecords, getSettings } from './store';
import { COUNTRIES, DEFAULT_POLICIES } from './constants';

const toTriStateBoolean = (value) => {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  if (value === 'not_applicable') return 'not_applicable';
  return undefined;
};

const CERTIFICATION_NAME_PATTERN = /\b(iso\s?\d{4,5}|sa8000|ecovadis|fsc|pefc|iatf\s?16949|haccp|fssc\s?22000|b\s?corp)\b/i;
const POLICY_STATUS_ALIASES = {
  approved: 'available',
  published: 'available',
  complete: 'available',
  yes: 'available',
  true: 'available',
  drafting: 'in_progress',
  under_review: 'in_progress',
  no: 'not_available',
  false: 'not_available',
};
const POLICY_ID_ALIASES = {
  codeOfConduct: 'code_of_conduct',
  antiCorruptionPolicy: 'anti_corruption',
  supplierCodeOfConduct: 'supplier_code',
  healthSafetyPolicy: 'health_safety_policy',
  health_safety: 'health_safety_policy',
  diversity_inclusion_policy: 'diversity_inclusion',
  dei_policy: 'diversity_inclusion',
  iso9001: 'iso_9001',
  iso14001: 'iso_14001',
  climate_policy: 'climate_ghg',
};
const DEFAULT_POLICY_BY_ID = Object.fromEntries(DEFAULT_POLICIES.map((policy) => [policy.id, policy]));
const DEFAULT_POLICY_BY_NAME = Object.fromEntries(DEFAULT_POLICIES.map((policy) => [String(policy.name || '').toLowerCase(), policy]));

const inferPolicyCategory = (name = '') => {
  const normalized = String(name).toLowerCase();
  if (/environment|energy|waste|water|climate|biodiversity|iso 14001|emas/.test(normalized)) return 'environmental';
  if (/health|safety|human rights|anti-discrimination|diversity|inclusion/.test(normalized)) return 'social';
  return 'governance';
};

const normalizePolicy = (policy = {}) => {
  const aliasedId = POLICY_ID_ALIASES[policy.id] || policy.id;
  const byId = DEFAULT_POLICY_BY_ID[aliasedId];
  const byName = DEFAULT_POLICY_BY_NAME[String(policy.name || '').toLowerCase()];
  const canonical = byId || byName;
  const rawStatus = String(policy.status || '').toLowerCase();
  const normalizedStatus = POLICY_STATUS_ALIASES[rawStatus] || rawStatus || 'not_available';
  const canonicalId = canonical?.id || aliasedId || policy.id;
  const canonicalName = policy.name || canonical?.name || canonicalId;
  const canonicalCategory = canonical?.category || policy.category || inferPolicyCategory(canonicalName);

  return {
    ...policy,
    id: canonicalId,
    name: canonicalName,
    category: canonicalCategory,
    status: normalizedStatus,
    exists: normalizedStatus === 'available' || normalizedStatus === 'in_progress',
    isCertification: policy.isCertification ?? canonical?.isCertification ?? CERTIFICATION_NAME_PATTERN.test(canonicalName),
  };
};

const policyStatusToImplementation = (status) => {
  if (status === 'available') return 'implemented';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'not_applicable') return 'not_applicable';
  if (status === 'not_available' || status === 'not_planned') return 'not_in_place';
  return undefined;
};

const policyStatusToTriState = (status) => {
  if (status === 'available') return true;
  if (status === 'not_applicable') return 'not_applicable';
  if (status === 'in_progress' || status === 'not_available' || status === 'not_planned') return false;
  return undefined;
};
const GAS_M3_TO_KWH = 10.55; // kWh per m³ natural gas

/**
 * Country code → full name mapping for the Response Generator engine
 * (which uses full country names for emission factor lookup).
 */
const CODE_TO_NAME = {};
COUNTRIES.forEach(c => { CODE_TO_NAME[c.code] = c.name; });
// Add common EU countries not in the Passport's COUNTRIES list
Object.assign(CODE_TO_NAME, {
  EU_AVERAGE: 'EU Average',
  RO: 'Romania', BG: 'Bulgaria', HR: 'Croatia',
  HU: 'Hungary', SK: 'Slovakia', SI: 'Slovenia',
  LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia',
  GR: 'Greece', LU: 'Luxembourg',
});

/**
 * Build a CompanyData object from the Passport's stored data.
 * @param {string} [year] — reporting year to aggregate (defaults to current year)
 * @returns {Object} CompanyData for the response engine
 */
export function buildCompanyData(year) {
  const profile = getCompanyProfile();
  let reportingYear = year || profile?.baselineYear;

  // Auto-detect: use the most recent year that has data records
  if (!reportingYear) {
    const records = getDataRecords();
    if (records.length > 0) {
      const years = [...new Set(records.map(r => r.period.slice(0, 4)))];
      years.sort().reverse();
      reportingYear = years[0];
    } else {
      reportingYear = new Date().getFullYear().toString();
    }
  }

  const totals = getAnnualTotals(reportingYear);
  const policies = getPolicies().map(normalizePolicy);
  const settings = getSettings();
  const notApplicableFields = settings?.notApplicableFields || {};

  const countryName = profile?.countryOfIncorporation
    ? (CODE_TO_NAME[profile.countryOfIncorporation] || profile.countryOfIncorporation)
    : '';

  // Collect certifications from approved/published policies that are certifications
  const policyCerts = policies
    .filter(p => p.status === 'available' && (p.isCertification || CERTIFICATION_NAME_PATTERN.test(p.name || '')))
    .map(p => p.name);
  const policyMap = Object.fromEntries(policies.map((p) => [p.id, p]));
  // Merge in chip-form certifications from the Company Profile section
  const profileCerts = Array.isArray(profile?.certifications) ? profile.certifications : [];
  const certs = [...new Set([...policyCerts, ...profileCerts])];

  // Convert natural gas from kWh (Passport) to m3 (engine)
  const naturalGasKwh = totals.naturalGasKwh || 0;
  const naturalGasM3 = naturalGasKwh > 0 ? Math.round(naturalGasKwh / GAS_M3_TO_KWH) : undefined;

  // Female percent from headcount
  const totalEmp = totals.totalEmployees || 0;
  const femaleEmp = totals.femaleEmployees || 0;
  const femalePercent = totalEmp > 0 ? Math.round((femaleEmp / totalEmp) * 100) : undefined;

  // Training hours per employee
  const trainingHoursPerEmployee = (totals.trainingHours && totalEmp > 0)
    ? Math.round((totals.trainingHours / totalEmp) * 10) / 10
    : undefined;

  // TRIR from recordable incidents and hours worked
  const recordable = totals.recordableIncidents ?? totals.workAccidents;
  const trirRate = (recordable !== undefined && totals.hoursWorked > 0)
    ? Math.round((recordable / totals.hoursWorked) * 200000 * 100) / 100
    : undefined;

  // Recycling percent
  const recyclingPercent = (totals.totalWasteKg > 0 && totals.recycledWasteKg !== undefined)
    ? Math.round((totals.recycledWasteKg / totals.totalWasteKg) * 100)
    : undefined;

  // Build structured policies array for the engine
  const structuredPolicies = policies.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category || 'governance',
    exists: p.status === 'available' || p.status === 'in_progress',
    status: p.status || 'not_available',
    isCertification: !!p.isCertification,
  }));

  // Build structured documents array for the engine
  const documents = getDocuments();
  const now = new Date();
  const structuredDocuments = documents.map(d => ({
    name: d.name,
    category: d.category || 'other',
    validUntil: d.validUntil || undefined,
    isValid: d.validUntil ? new Date(d.validUntil) >= now : true,
  }));

  return {
    companyName: profile?.tradingName || profile?.legalName || '',
    industry: profile?.industrySector || '',
    country: countryName,
    employeeCount: totalEmp || parseInt(profile?.totalEmployees) || 0,
    numberOfSites: parseInt(profile?.numberOfFacilities) || 1,
    reportingPeriod: reportingYear,
    revenueBand: profile?.revenueBand || profile?.annualRevenue || '',

    // Extended company profile fields (from collapsible Company Profile section)
    yearFounded: profile?.yearFounded || undefined,
    productsServices: profile?.productsServices || undefined,
    operatingCountries: profile?.operatingCountries || undefined,
    ownership: profile?.ownership || undefined,
    parentCompany: profile?.parentCompany || undefined,
    subsidiaries: profile?.subsidiaries || undefined,
    customerTypes: Array.isArray(profile?.customerTypes) && profile.customerTypes.length > 0
      ? profile.customerTypes.join(', ')
      : undefined,
    mainMarkets: profile?.mainMarkets || undefined,

    // Registered address
    registeredAddress: profile?.registeredAddress || undefined,

    // Governance flags
    noSignificantFines: profile?.noSignificantFines || undefined,
    dataProtectionPolicy: policyStatusToTriState(policyMap.data_privacy?.status) ?? toTriStateBoolean(profile?.dataProtectionPolicy),
    publishesSustainabilityReport: toTriStateBoolean(profile?.publishesSustainabilityReport),
    reportingFramework: profile?.reportingFramework || undefined,
    externalAssurance: toTriStateBoolean(profile?.externalAssurance),
    assuranceStandard: profile?.assuranceStandard || undefined,
    csrdApplicable: profile?.csrdApplicable || undefined,
    codeOfConductStatus: policyStatusToImplementation(policyMap.code_of_conduct?.status) || undefined,
    antiCorruptionStatus: policyStatusToImplementation(policyMap.anti_corruption?.status) || undefined,
    humanRightsPolicyStatus: policyStatusToImplementation(policyMap.human_rights?.status) || profile?.humanRightsPolicyStatus || undefined,
    humanRightsDueDiligenceStatus: profile?.humanRightsDueDiligenceStatus || undefined,
    supplierCodeStatus: policyStatusToImplementation(policyMap.supplier_code?.status) || profile?.supplierCodeStatus || undefined,
    supplierCorrectiveActionProcess: profile?.supplierCorrectiveActionProcess || undefined,
    responsibleSourcingPolicyStatus: profile?.responsibleSourcingPolicyStatus || undefined,
    conflictMineralsStatus: profile?.conflictMineralsStatus || undefined,
    cmrtStatus: profile?.cmrtStatus || undefined,
    emrtStatus: profile?.emrtStatus || undefined,
    wastewaterTreatmentDetails: profile?.wastewaterTreatmentDetails || undefined,
    transportReductionMeasures: profile?.transportReductionMeasures || undefined,
    fleetComposition: profile?.fleetComposition || (notApplicableFields['energy.vehicleFuelLiters'] ? 'not_applicable' : undefined),
    packagingRecycledContentPercent: profile?.packagingRecycledContentPercent ? parseFloat(profile.packagingRecycledContentPercent) : undefined,

    // Energy — use != null to preserve zero values
    electricityKwh: totals.electricityKwh != null ? totals.electricityKwh : undefined,
    energySavingsKwh: totals.energySavingsKwh != null ? totals.energySavingsKwh : undefined,
    renewablePercent: totals.renewablePercent != null ? Math.round(totals.renewablePercent) : undefined,
    naturalGasM3,
    dieselLiters: notApplicableFields['energy.vehicleFuelLiters'] ? undefined : (totals.vehicleFuelLiters != null ? totals.vehicleFuelLiters : undefined),
    waterM3: totals.waterM3 != null ? totals.waterM3 : undefined,
    waterSourceMunicipalPercent: totals.waterSourceMunicipalPercent != null ? Math.round(totals.waterSourceMunicipalPercent) : undefined,

    // Emissions — use != null to preserve zero values
    scope1Tco2e: totals.scope1Tco2e != null ? totals.scope1Tco2e : undefined,
    scope2Tco2e: totals.scope2Tco2e != null ? totals.scope2Tco2e : undefined,
    scope3Tco2e: totals.scope3Total != null ? totals.scope3Total : undefined,

    // Waste — use != null to preserve zero values (zero hazardous waste is meaningful)
    totalWasteKg: totals.totalWasteKg != null ? totals.totalWasteKg : undefined,
    recyclingPercent,
    hazardousWasteKg: totals.hazardousWasteKg != null ? totals.hazardousWasteKg : undefined,

    // Workforce — use != null to preserve zero values
    femalePercent,
    womenInLeadershipPercent: totals.womenInLeadershipPercent != null ? Math.round(totals.womenInLeadershipPercent) : undefined,
    turnoverRate: totals.turnoverRate != null ? Math.round(totals.turnoverRate * 10) / 10 : undefined,
    collectiveBargainingPercent: totals.collectiveBargainingPercent != null ? Math.round(totals.collectiveBargainingPercent) : undefined,
    livingWageCompliant: toTriStateBoolean(profile?.livingWageCompliant),
    grievanceMechanismExists: policyStatusToTriState(policyMap.whistleblower?.status) ?? toTriStateBoolean(profile?.grievanceMechanismExists),
    grievancesReported: totals.grievancesReported != null ? totals.grievancesReported : undefined,
    newHires: totals.newHires != null ? totals.newHires : undefined,
    suppliersAssessedPercent: totals.suppliersAssessedPercent != null ? Math.round(totals.suppliersAssessedPercent) : undefined,
    trainingHoursPerEmployee,
    trirRate,
    lostTimeIncidents: totals.lostTimeIncidents != null ? totals.lostTimeIncidents : undefined,
    fatalities: totals.fatalities != null ? totals.fatalities : undefined,
    hoursWorked: totals.hoursWorked != null ? totals.hoursWorked : undefined,

    // Governance
    certifications: certs.length > 0 ? certs.join(', ') : undefined,
    sustainabilityGoal: profile?.sustainabilityGoal || undefined,

    // Structured policies & documents (boost confidence scoring)
    policies: structuredPolicies,
    documents: structuredDocuments,
  };
}

/**
 * Build a CompanyProfile object for the answer engine.
 * This is the contextual profile that helps the engine generate
 * industry-aware, company-specific answers.
 * @returns {Object} CompanyProfile for the response engine
 */
export function buildCompanyProfile() {
  const profile = getCompanyProfile();
  const companyName = profile?.tradingName || profile?.legalName || '';
  const industry = profile?.industrySector || '';
  const country = profile?.countryOfIncorporation
    ? (CODE_TO_NAME[profile.countryOfIncorporation] || profile.countryOfIncorporation)
    : '';
  const employeeCount = parseInt(profile?.totalEmployees) || 0;
  const numberOfSites = parseInt(profile?.numberOfFacilities) || 1;
  const reportingPeriod = profile?.baselineYear || new Date().getFullYear().toString();
  const revenueBand = profile?.annualRevenue || '';

  return {
    companyName,
    industry,
    country,
    employeeCount,
    numberOfSites,
    reportingPeriod,
    revenueBand,
    informalPractices: [],
    maturityLevel: 'Emerging',
    maturityScore: 0,
  };
}

/**
 * Compute year-over-year trends for key metrics.
 * Returns trend narratives that can be injected into answers.
 * @param {string} [currentYear] - The current reporting year
 * @returns {Array<{ metric: string, current: number, previous: number, change: number, narrative: string }>}
 */
export function computeYoYTrends(currentYear) {
  const year = currentYear || new Date().getFullYear().toString();
  const prevYear = String(parseInt(year) - 1);

  const current = getAnnualTotals(year);
  const previous = getAnnualTotals(prevYear);

  const trends = [];

  const metrics = [
    { key: 'electricityKwh', label: 'electricity consumption', unit: 'kWh', lowerIsBetter: true },
    { key: 'scope1Tco2e', label: 'Scope 1 emissions', unit: 'tCO₂e', lowerIsBetter: true },
    { key: 'scope2Tco2e', label: 'Scope 2 emissions', unit: 'tCO₂e', lowerIsBetter: true },
    { key: 'totalWasteKg', label: 'total waste generation', unit: 'kg', lowerIsBetter: true },
    { key: 'waterM3', label: 'water consumption', unit: 'm³', lowerIsBetter: true },
    { key: 'recyclingRate', label: 'recycling rate', unit: '%', lowerIsBetter: false },
    { key: 'workAccidents', label: 'workplace accidents', unit: 'incidents', lowerIsBetter: true },
    { key: 'trainingHours', label: 'training hours', unit: 'hours', lowerIsBetter: false },
    { key: 'turnoverRate', label: 'employee turnover rate', unit: '%', lowerIsBetter: true },
  ];

  for (const m of metrics) {
    const curr = current[m.key];
    const prev = previous[m.key];
    if (curr && prev && prev > 0) {
      const change = ((curr - prev) / prev) * 100;
      const absChange = Math.abs(change).toFixed(1);
      const improved = m.lowerIsBetter ? change < 0 : change > 0;
      const direction = change < 0 ? 'decreased' : 'increased';

      let narrative;
      if (Math.abs(change) < 1) {
        narrative = `Our ${m.label} remained stable at approximately ${Math.round(curr).toLocaleString()} ${m.unit} (${prevYear} vs ${year}).`;
      } else if (improved) {
        narrative = `Our ${m.label} ${direction} by ${absChange}% from ${Math.round(prev).toLocaleString()} ${m.unit} in ${prevYear} to ${Math.round(curr).toLocaleString()} ${m.unit} in ${year}, demonstrating our commitment to continuous improvement.`;
      } else {
        narrative = `Our ${m.label} ${direction} by ${absChange}% from ${Math.round(prev).toLocaleString()} ${m.unit} in ${prevYear} to ${Math.round(curr).toLocaleString()} ${m.unit} in ${year}. We are implementing measures to reverse this trend.`;
      }

      trends.push({
        metric: m.key,
        label: m.label,
        current: curr,
        previous: prev,
        change: Math.round(change * 10) / 10,
        improved,
        narrative,
      });
    }
  }

  return trends;
}

/**
 * Get a summary of data quality from the Passport's confidence records.
 * Useful for display alongside generated answers.
 */
export function getDataQualitySummary() {
  const confidence = getConfidenceRecords();
  const total = confidence.length;
  const complete = confidence.filter(c => c.status === 'complete').length;
  const safeToShare = confidence.filter(c => c.safeToShare).length;
  const highConfidence = confidence.filter(c => c.confidence === 'high').length;
  const mediumConfidence = confidence.filter(c => c.confidence === 'medium').length;

  return {
    total,
    complete,
    safeToShare,
    highConfidence,
    mediumConfidence,
    completionPercent: total > 0 ? Math.round((complete / total) * 100) : 0,
    safePercent: total > 0 ? Math.round((safeToShare / total) * 100) : 0,
  };
}

// ============================================
// Data Bridge: Passport Store → Response Generator CompanyData
// ============================================
// Translates the ESG Passport's localStorage data model
// into the flat CompanyData type the answer engine expects.

import { loadData, getDataRecords, getAnnualTotals, getCompanyProfile, getPolicies, getDocuments, getConfidenceRecords } from './store';
import { COUNTRIES } from './constants';
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
  const policies = getPolicies();

  const countryName = profile?.countryOfIncorporation
    ? (CODE_TO_NAME[profile.countryOfIncorporation] || profile.countryOfIncorporation)
    : '';

  // Collect certifications from approved/published policies that are certifications
  const policyCerts = policies
    .filter(p => p.isCertification && p.status === 'available')
    .map(p => p.name);
  // Merge in chip-form certifications from the Company Profile section
  const profileCerts = Array.isArray(profile?.certifications) ? profile.certifications : [];
  const certs = [...new Set([...policyCerts, ...profileCerts])];

  // Collect sustainability goals from approved policies
  const goalPolicy = policies.find(p => p.id === 'climate_ghg' && p.status === 'available');

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

    // Energy
    electricityKwh: totals.electricityKwh || undefined,
    renewablePercent: totals.renewablePercent != null ? Math.round(totals.renewablePercent) : undefined,
    naturalGasM3,
    dieselLiters: totals.vehicleFuelLiters || undefined,
    waterM3: totals.waterM3 || undefined,

    // Emissions (pass through if user has entered them, otherwise engine auto-calculates)
    scope1Tco2e: totals.scope1Tco2e || undefined,
    scope2Tco2e: totals.scope2Tco2e || undefined,
    scope3Tco2e: totals.scope3Total || undefined,

    // Waste
    totalWasteKg: totals.totalWasteKg || undefined,
    recyclingPercent,
    hazardousWasteKg: totals.hazardousWasteKg || undefined,

    // Workforce
    femalePercent,
    womenInLeadershipPercent: totals.womenInLeadershipPercent != null ? Math.round(totals.womenInLeadershipPercent) : undefined,
    turnoverRate: totals.turnoverRate != null ? Math.round(totals.turnoverRate * 10) / 10 : undefined,
    collectiveBargainingPercent: totals.collectiveBargainingPercent != null ? Math.round(totals.collectiveBargainingPercent) : undefined,
    livingWageCompliant: profile?.livingWageCompliant === 'yes' ? true : profile?.livingWageCompliant === 'no' ? false : undefined,
    grievanceMechanismExists: profile?.grievanceMechanismExists === 'yes' ? true : profile?.grievanceMechanismExists === 'no' ? false : undefined,
    grievancesReported: totals.grievancesReported || undefined,
    trainingHoursPerEmployee,
    trirRate,
    lostTimeIncidents: totals.lostTimeIncidents || undefined,
    fatalities: totals.fatalities || undefined,
    hoursWorked: totals.hoursWorked || undefined,

    // Governance
    certifications: certs.length > 0 ? certs.join(', ') : undefined,
    sustainabilityGoal: goalPolicy ? goalPolicy.name : undefined,

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

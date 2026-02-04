// ============================================
// Data Bridge: Passport Store → Response Generator CompanyData
// ============================================
// Translates the ESG Passport's localStorage data model
// into the flat CompanyData type the answer engine expects.

import { loadData, getAnnualTotals, getCompanyProfile, getPolicies, getConfidenceRecords } from './store';
import { COUNTRIES } from './constants';
import { GAS_M3_TO_KWH } from './respond/emissionFactors';

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
 * @returns {import('./respond/types').CompanyData}
 */
export function buildCompanyData(year) {
  const profile = getCompanyProfile();
  const reportingYear = year || profile?.baselineYear || new Date().getFullYear().toString();
  const totals = getAnnualTotals(reportingYear);
  const policies = getPolicies();

  const countryName = profile?.countryOfIncorporation
    ? (CODE_TO_NAME[profile.countryOfIncorporation] || profile.countryOfIncorporation)
    : '';

  // Collect certifications from approved/published policies that are certifications
  const certs = policies
    .filter(p => p.isCertification && (p.status === 'approved' || p.status === 'published'))
    .map(p => p.name);

  // Collect sustainability goals from approved policies
  const goalPolicy = policies.find(p => p.id === 'climate_ghg' && (p.status === 'approved' || p.status === 'published'));

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

  // TRIR from accidents and hours worked
  const trirRate = (totals.workAccidents !== undefined && totals.hoursWorked > 0)
    ? Math.round((totals.workAccidents / totals.hoursWorked) * 200000 * 100) / 100
    : undefined;

  // Recycling percent
  const recyclingPercent = (totals.totalWasteKg > 0 && totals.recycledWasteKg !== undefined)
    ? Math.round((totals.recycledWasteKg / totals.totalWasteKg) * 100)
    : undefined;

  return {
    companyName: profile?.tradingName || profile?.legalName || '',
    industry: profile?.industrySector || '',
    country: countryName,
    employeeCount: totalEmp || parseInt(profile?.totalEmployees) || 0,
    numberOfSites: parseInt(profile?.numberOfFacilities) || 1,
    reportingPeriod: reportingYear,
    revenueBand: profile?.annualRevenue || '',

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
    trainingHoursPerEmployee,
    trirRate,
    lostTimeIncidents: totals.workAccidents || undefined,

    // Governance
    certifications: certs.length > 0 ? certs.join(', ') : undefined,
    sustainabilityGoal: goalPolicy ? goalPolicy.name : undefined,
  };
}

/**
 * Build a CompanyProfile object for the answer engine.
 * This is the contextual profile that helps the engine generate
 * industry-aware, company-specific answers.
 * @returns {import('../types/context').CompanyProfile}
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

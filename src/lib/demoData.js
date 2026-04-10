// ============================================
// Demo data loader — for screen recordings & demos
// ============================================
//
// Triggered via URL hash query params:
//   /#/?demo=load   → seeds the localStorage with realistic demo data
//   /#/?demo=reset  → wipes localStorage back to a fresh state
//
// The demo company is Acme Industrial GmbH — a fictional 47-FTE
// manufacturing SME in Munich. Numbers are realistic for a small
// industrial supplier (the kind of business that gets EcoVadis
// questionnaires from larger customers).
//
// Six months of operational data are seeded with mild month-to-month
// variation so the year-over-year and trend views look plausible.

import { saveData, resetData, loadData } from './store';

const DEMO_PROFILE = {
  legalName: 'Acme Industrial GmbH',
  tradingName: 'Acme Industrial',
  esgContactEmail: 'compliance@acme-industrial.de',
  industrySector: 'Manufacturing',
  countryOfIncorporation: 'DE',
  totalEmployees: '47',
  yearFounded: '1998',
  numberOfFacilities: '2',
  operatingCountries: 'Germany, Austria, Switzerland',
  productsServices: 'Precision-machined metal components for the automotive aftermarket, including brake calipers, wheel bearings, and suspension parts.',
  ownership: 'Private (family-owned)',
  parentCompany: '',
  subsidiaries: '',
  customerTypes: ['B2B'],
  mainMarkets: 'DACH region, Northern Italy',
  certifications: ['ISO 9001 (Quality)', 'ISO 14001 (Environment)'],
  revenueBand: '€10M – €50M',
  reportingPeriod: 'Calendar year (Jan – Dec)',
  annualRevenue: '€10M – €50M',
};

// Six months of plausible monthly numbers for a 47-FTE manufacturer
// Values are realistic — not "1, 2, 3, 4, 5" placeholder noise
const DEMO_MONTHLY_RECORDS = [
  {
    period: '2026-01',
    energy: { electricityKwh: 38400, naturalGasKwh: 22100, vehicleFuelLiters: 480, renewablePercent: 35 },
    water: { consumptionM3: 142 },
    waste: { totalKg: 1850, recycledKg: 1295, hazardousKg: 95, recyclingRate: 70 },
    workforce: { totalEmployees: 47, femaleEmployees: 14, maleEmployees: 33 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 7800 },
    training: { trainingHours: 62 },
  },
  {
    period: '2026-02',
    energy: { electricityKwh: 35200, naturalGasKwh: 19800, vehicleFuelLiters: 510, renewablePercent: 35 },
    water: { consumptionM3: 138 },
    waste: { totalKg: 1720, recycledKg: 1230, hazardousKg: 88, recyclingRate: 71 },
    workforce: { totalEmployees: 47, femaleEmployees: 14, maleEmployees: 33 },
    healthSafety: { recordableIncidents: 1, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 7600 },
    training: { trainingHours: 48 },
  },
  {
    period: '2026-03',
    energy: { electricityKwh: 36800, naturalGasKwh: 17400, vehicleFuelLiters: 545, renewablePercent: 38 },
    water: { consumptionM3: 151 },
    waste: { totalKg: 1910, recycledKg: 1395, hazardousKg: 102, recyclingRate: 73 },
    workforce: { totalEmployees: 48, femaleEmployees: 15, maleEmployees: 33 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 7950 },
    training: { trainingHours: 71 },
  },
  {
    period: '2026-04',
    energy: { electricityKwh: 34100, naturalGasKwh: 12300, vehicleFuelLiters: 502, renewablePercent: 38 },
    water: { consumptionM3: 147 },
    waste: { totalKg: 1680, recycledKg: 1245, hazardousKg: 81, recyclingRate: 74 },
    workforce: { totalEmployees: 48, femaleEmployees: 15, maleEmployees: 33 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 7820 },
    training: { trainingHours: 55 },
  },
  {
    period: '2026-05',
    energy: { electricityKwh: 33500, naturalGasKwh: 8200, vehicleFuelLiters: 528, renewablePercent: 42 },
    water: { consumptionM3: 156 },
    waste: { totalKg: 1755, recycledKg: 1320, hazardousKg: 87, recyclingRate: 75 },
    workforce: { totalEmployees: 48, femaleEmployees: 15, maleEmployees: 33 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 7910 },
    training: { trainingHours: 64 },
  },
  {
    period: '2026-06',
    energy: { electricityKwh: 32800, naturalGasKwh: 6800, vehicleFuelLiters: 561, renewablePercent: 42 },
    water: { consumptionM3: 162 },
    waste: { totalKg: 1820, recycledKg: 1380, hazardousKg: 90, recyclingRate: 76 },
    workforce: { totalEmployees: 49, femaleEmployees: 16, maleEmployees: 33 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 8050 },
    training: { trainingHours: 58 },
  },
];

/**
 * Seed localStorage with realistic demo data. Overwrites any existing data.
 */
export function loadDemoData() {
  // Start from a clean default and layer demo data on top
  resetData();
  const data = loadData();

  data.companyProfile = {
    ...DEMO_PROFILE,
    updatedAt: new Date().toISOString(),
  };

  data.dataRecords = DEMO_MONTHLY_RECORDS.map(r => ({ ...r }));

  data.settings = {
    ...data.settings,
    setupCompleted: true,
    onboardingStep: 3,
    gridCountry: 'DE',
    language: 'en',
  };

  // Mark a couple of policies as available so the certification template
  // and policy-driven answers have something to work with
  data.policies = (data.policies || []).map(p => {
    if (p.id === 'climate_ghg' || p.id === 'environmental') {
      return { ...p, status: 'available', updatedAt: new Date().toISOString() };
    }
    return p;
  });

  saveData(data);
  return true;
}

/**
 * Wipe everything back to a fresh-install state.
 */
export function resetDemoData() {
  resetData();
  // Also clear license + sessionStorage flags so the next visit feels brand-new
  localStorage.removeItem('esg_passport_license');
  sessionStorage.removeItem('respond_resume_sample');
  return true;
}

/**
 * Read the URL hash for ?demo=load or ?demo=reset and act on it.
 * Returns the action taken (or null) so callers can decide whether to redirect.
 */
export function handleDemoQueryParam() {
  if (typeof window === 'undefined') return null;
  // HashRouter puts the query string after the hash: #/?demo=load
  const hash = window.location.hash || '';
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return null;
  const params = new URLSearchParams(hash.slice(queryStart + 1));
  const action = params.get('demo');
  if (action === 'load') {
    loadDemoData();
    // Strip the query param so reload doesn't re-seed
    window.location.hash = '#/';
    window.location.reload();
    return 'loaded';
  }
  if (action === 'reset') {
    resetDemoData();
    window.location.hash = '#/onboarding';
    window.location.reload();
    return 'reset';
  }
  return null;
}

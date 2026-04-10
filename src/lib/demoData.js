// ============================================
// Demo data loader — for screen recordings & demos
// ============================================
//
// Triggered via URL hash query params:
//   /#/?demo=load   → seeds the localStorage with realistic demo data
//   /#/?demo=reset  → wipes localStorage back to a fresh state
//
// The demo company is Hartmann Präzisionstechnik GmbH — a fictional
// 280-FTE precision-machining SME in Düsseldorf with a second
// production site in Wrocław, Poland. Numbers are realistic for a
// mid-sized industrial supplier that gets EcoVadis and buyer
// questionnaires from automotive OEMs.
//
// Twelve months of 2025 operational data are seeded with plausible
// seasonal variation so trend views, YoY comparison, and the
// comprehensive questionnaire all look convincing.

import { saveData, resetData, loadData } from './store';

const DEMO_PROFILE = {
  legalName: 'Hartmann Präzisionstechnik GmbH',
  tradingName: 'Hartmann Precision',
  esgContactEmail: 'esg@hartmann-praezision.de',
  industrySector: 'Manufacturing',
  countryOfIncorporation: 'DE',
  totalEmployees: '280',
  yearFounded: '1994',
  numberOfFacilities: '2',
  operatingCountries: 'Germany, Poland',
  productsServices: 'CNC-machined precision components for automotive drivetrain and braking systems, including transmission housings, brake caliper brackets, and bearing carriers. Secondary line: custom industrial tooling for wind-turbine gearbox OEMs.',
  ownership: 'Private (family-owned)',
  parentCompany: '',
  subsidiaries: 'Hartmann Precision Sp. z o.o. (Wrocław, Poland)',
  customerTypes: ['B2B'],
  mainMarkets: 'Germany, France, Czech Republic, Northern Italy, Sweden',
  certifications: ['ISO 9001 (Quality)', 'ISO 14001 (Environment)', 'ISO 45001 (Health & Safety)'],
  revenueBand: '€10M – €50M',
  reportingPeriod: 'Calendar year (Jan – Dec)',
  annualRevenue: '€10M – €50M',
  baselineYear: '2025',
  livingWageCompliant: 'yes',
  grievanceMechanismExists: 'yes',
};

// Twelve months of 2025 data for a 280-FTE manufacturer
// Seasonal patterns: higher gas in winter, higher electricity in summer
// (CNC spindles + cooling), water tracks production volume
const DEMO_MONTHLY_RECORDS = [
  {
    period: '2025-01',
    energy: { electricityKwh: 185000, naturalGasKwh: 142000, vehicleFuelLiters: 2800, renewablePercent: 48 },
    water: { consumptionM3: 620 },
    waste: { totalKg: 12400, recycledKg: 9300, hazardousKg: 680, recyclingRate: 75 },
    workforce: { totalEmployees: 276, femaleEmployees: 72, maleEmployees: 204, turnoverRate: 12, womenInLeadershipPercent: 28, collectiveBargainingPercent: 68, grievancesReported: 1 },
    healthSafety: { recordableIncidents: 1, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 44200 },
    training: { trainingHours: 380 },
  },
  {
    period: '2025-02',
    energy: { electricityKwh: 178000, naturalGasKwh: 138000, vehicleFuelLiters: 2650, renewablePercent: 48 },
    water: { consumptionM3: 595 },
    waste: { totalKg: 11800, recycledKg: 8910, hazardousKg: 640, recyclingRate: 75 },
    workforce: { totalEmployees: 276, femaleEmployees: 72, maleEmployees: 204, turnoverRate: 12, womenInLeadershipPercent: 28, collectiveBargainingPercent: 68, grievancesReported: 0 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 42800 },
    training: { trainingHours: 340 },
  },
  {
    period: '2025-03',
    energy: { electricityKwh: 190000, naturalGasKwh: 118000, vehicleFuelLiters: 2900, renewablePercent: 50 },
    water: { consumptionM3: 645 },
    waste: { totalKg: 13100, recycledKg: 10090, hazardousKg: 710, recyclingRate: 77 },
    workforce: { totalEmployees: 278, femaleEmployees: 73, maleEmployees: 205, turnoverRate: 11, womenInLeadershipPercent: 28, collectiveBargainingPercent: 68, grievancesReported: 0 },
    healthSafety: { recordableIncidents: 1, lostTimeIncidents: 1, fatalities: 0, hoursWorked: 45600 },
    training: { trainingHours: 520 },
  },
  {
    period: '2025-04',
    energy: { electricityKwh: 192000, naturalGasKwh: 86000, vehicleFuelLiters: 3050, renewablePercent: 50 },
    water: { consumptionM3: 670 },
    waste: { totalKg: 13500, recycledKg: 10530, hazardousKg: 730, recyclingRate: 78 },
    workforce: { totalEmployees: 280, femaleEmployees: 74, maleEmployees: 206, turnoverRate: 11, womenInLeadershipPercent: 29, collectiveBargainingPercent: 68, grievancesReported: 1 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 46200 },
    training: { trainingHours: 410 },
  },
  {
    period: '2025-05',
    energy: { electricityKwh: 198000, naturalGasKwh: 52000, vehicleFuelLiters: 3100, renewablePercent: 52 },
    water: { consumptionM3: 710 },
    waste: { totalKg: 14200, recycledKg: 11220, hazardousKg: 760, recyclingRate: 79 },
    workforce: { totalEmployees: 282, femaleEmployees: 75, maleEmployees: 207, turnoverRate: 10, womenInLeadershipPercent: 29, collectiveBargainingPercent: 69, grievancesReported: 0 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 46800 },
    training: { trainingHours: 390 },
  },
  {
    period: '2025-06',
    energy: { electricityKwh: 205000, naturalGasKwh: 38000, vehicleFuelLiters: 3200, renewablePercent: 52 },
    water: { consumptionM3: 740 },
    waste: { totalKg: 14800, recycledKg: 11840, hazardousKg: 790, recyclingRate: 80 },
    workforce: { totalEmployees: 283, femaleEmployees: 76, maleEmployees: 207, turnoverRate: 10, womenInLeadershipPercent: 29, collectiveBargainingPercent: 69, grievancesReported: 0 },
    healthSafety: { recordableIncidents: 1, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 47200 },
    training: { trainingHours: 360 },
  },
  {
    period: '2025-07',
    energy: { electricityKwh: 210000, naturalGasKwh: 32000, vehicleFuelLiters: 2400, renewablePercent: 54 },
    water: { consumptionM3: 720 },
    waste: { totalKg: 12800, recycledKg: 10370, hazardousKg: 650, recyclingRate: 81 },
    workforce: { totalEmployees: 278, femaleEmployees: 75, maleEmployees: 203, turnoverRate: 10, womenInLeadershipPercent: 30, collectiveBargainingPercent: 69, grievancesReported: 1 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 41400 },
    training: { trainingHours: 280 },
  },
  {
    period: '2025-08',
    energy: { electricityKwh: 195000, naturalGasKwh: 30000, vehicleFuelLiters: 2200, renewablePercent: 54 },
    water: { consumptionM3: 680 },
    waste: { totalKg: 11500, recycledKg: 9430, hazardousKg: 590, recyclingRate: 82 },
    workforce: { totalEmployees: 275, femaleEmployees: 74, maleEmployees: 201, turnoverRate: 11, womenInLeadershipPercent: 30, collectiveBargainingPercent: 69, grievancesReported: 0 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 39800 },
    training: { trainingHours: 240 },
  },
  {
    period: '2025-09',
    energy: { electricityKwh: 202000, naturalGasKwh: 48000, vehicleFuelLiters: 3100, renewablePercent: 55 },
    water: { consumptionM3: 730 },
    waste: { totalKg: 14100, recycledKg: 11560, hazardousKg: 740, recyclingRate: 82 },
    workforce: { totalEmployees: 280, femaleEmployees: 75, maleEmployees: 205, turnoverRate: 11, womenInLeadershipPercent: 30, collectiveBargainingPercent: 70, grievancesReported: 0 },
    healthSafety: { recordableIncidents: 1, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 46600 },
    training: { trainingHours: 450 },
  },
  {
    period: '2025-10',
    energy: { electricityKwh: 196000, naturalGasKwh: 78000, vehicleFuelLiters: 3050, renewablePercent: 55 },
    water: { consumptionM3: 700 },
    waste: { totalKg: 13900, recycledKg: 11400, hazardousKg: 720, recyclingRate: 82 },
    workforce: { totalEmployees: 281, femaleEmployees: 76, maleEmployees: 205, turnoverRate: 11, womenInLeadershipPercent: 30, collectiveBargainingPercent: 70, grievancesReported: 1 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 46400 },
    training: { trainingHours: 470 },
  },
  {
    period: '2025-11',
    energy: { electricityKwh: 188000, naturalGasKwh: 112000, vehicleFuelLiters: 2900, renewablePercent: 55 },
    water: { consumptionM3: 660 },
    waste: { totalKg: 13200, recycledKg: 10820, hazardousKg: 700, recyclingRate: 82 },
    workforce: { totalEmployees: 282, femaleEmployees: 76, maleEmployees: 206, turnoverRate: 11, womenInLeadershipPercent: 31, collectiveBargainingPercent: 70, grievancesReported: 0 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 46000 },
    training: { trainingHours: 430 },
  },
  {
    period: '2025-12',
    energy: { electricityKwh: 182000, naturalGasKwh: 135000, vehicleFuelLiters: 2600, renewablePercent: 56 },
    water: { consumptionM3: 610 },
    waste: { totalKg: 12200, recycledKg: 10010, hazardousKg: 660, recyclingRate: 82 },
    workforce: { totalEmployees: 283, femaleEmployees: 77, maleEmployees: 206, turnoverRate: 11, womenInLeadershipPercent: 31, collectiveBargainingPercent: 70, grievancesReported: 0 },
    healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, fatalities: 0, hoursWorked: 43800 },
    training: { trainingHours: 350 },
  },
];

/**
 * Seed localStorage with realistic demo data. Overwrites any existing data.
 */
export function loadDemoData() {
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

  // Mark relevant policies as available — gives the engine real policy
  // data for governance, certifications, and H&S template answers
  const ACTIVE_POLICIES = [
    'environmental_policy', 'environmental', 'climate_ghg',
    'health_safety', 'code_of_conduct', 'anti_corruption',
    'supplier_code', 'energy_management',
  ];
  const DRAFT_POLICIES = ['human_rights', 'data_protection'];

  data.policies = (data.policies || []).map(p => {
    if (ACTIVE_POLICIES.includes(p.id)) {
      return { ...p, status: 'available', updatedAt: new Date().toISOString() };
    }
    if (DRAFT_POLICIES.includes(p.id)) {
      return { ...p, status: 'in_progress', updatedAt: new Date().toISOString() };
    }
    return p;
  });

  // Seed a few confidence records as complete
  data.confidenceRecords = (data.confidenceRecords || []).map(c => {
    const dataBackedIds = [
      'electricity', 'scope1', 'scope2', 'totalEmployees',
      'workInjuries', 'totalWaste', 'naturalGas', 'fleetFuel',
      'waterConsumption', 'recyclingRate', 'diversityData',
      'trainingHours', 'hazardousWaste', 'turnoverRate',
    ];
    if (dataBackedIds.includes(c.id)) {
      return { ...c, status: 'complete', confidence: 'high', safeToShare: true, updatedAt: new Date().toISOString() };
    }
    return c;
  });

  // Seed some documents (evidence registry)
  data.documents = [
    { id: 'doc_iso14001', name: 'ISO 14001:2015 Certificate', category: 'certificate', validUntil: '2027-03-15', isValid: true, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: 'doc_iso45001', name: 'ISO 45001:2018 Certificate', category: 'certificate', validUntil: '2026-11-30', isValid: true, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: 'doc_iso9001', name: 'ISO 9001:2015 Certificate', category: 'certificate', validUntil: '2027-06-01', isValid: true, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: 'doc_energy_audit', name: 'Energy Audit Report 2025', category: 'audit', validUntil: '2029-12-31', isValid: true, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: 'doc_waste_manifest', name: 'Hazardous Waste Manifest 2025', category: 'evidence', validUntil: null, isValid: true, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  ];

  saveData(data);
  return true;
}

/**
 * Wipe everything back to a fresh-install state.
 */
export function resetDemoData() {
  resetData();
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
  const hash = window.location.hash || '';
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return null;
  const params = new URLSearchParams(hash.slice(queryStart + 1));
  const action = params.get('demo');
  if (action === 'load') {
    loadDemoData();
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

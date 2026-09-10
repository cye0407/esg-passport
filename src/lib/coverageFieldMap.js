// Question data-point label → the workspace fields that answer it, and the document
// that would supply them.
//
// This is the join COVERAGE-REPORT-SPEC.md calls for. The engine's matcher emits
// `suggestedDataPoints` as HUMAN LABELS ('Electricity consumption (kWh)'), while the
// workspace keys on field ids ('energy.electricityKwh') and the bridge hands the engine
// a third set of names ('electricityKwh'). String overlap between them is zero.
//
// Written as data with one test per row, never as fuzzy matching: a wrong row puts a
// value against the wrong question, which is worse than reporting no coverage at all.
// Rows exist ONLY for data points a document can actually supply — a label with no row
// is not a gap we can name, and inventing a document for it would be a fake door.
//
//   label            the exact string in ESG_DOMAIN_SUGGESTIONS (response-ready
//                    domain-packs/esg/keywordRules.ts)
//   companyDataKeys  keys on the object dataBridge.buildCompanyData() produces; used to
//                    ask whether the workspace can answer this at all
//   storeFields      `section.field` paths, which is what settings.dataSources records
//                    provenance against and what EXTRACT_FIELD_MAP writes
//   document         which document would supply it (i18n key suffix, see i18n doc.*)
export const COVERAGE_FIELD_MAP = Object.freeze([
  {
    label: 'Electricity consumption (kWh)',
    companyDataKeys: ['electricityKwh'],
    storeFields: ['energy.electricityKwh'],
    document: 'electricityBill',
  },
  {
    label: 'Renewable %',
    companyDataKeys: ['renewablePercent'],
    storeFields: ['energy.renewablePercent'],
    document: 'electricityBill',
  },
  {
    label: 'Fuel consumption by type',
    companyDataKeys: ['dieselLiters', 'naturalGasM3'],
    storeFields: ['energy.vehicleFuelLiters', 'energy.naturalGasKwh'],
    document: 'fuelInvoice',
  },
  {
    label: 'Heating fuel use',
    companyDataKeys: ['naturalGasM3'],
    storeFields: ['energy.naturalGasKwh'],
    document: 'fuelInvoice',
  },
  {
    label: 'Water withdrawal (m3)',
    companyDataKeys: ['waterM3'],
    storeFields: ['water.consumptionM3'],
    document: 'waterBill',
  },
  {
    label: 'Total waste (kg)',
    companyDataKeys: ['totalWasteKg'],
    storeFields: ['waste.totalKg'],
    document: 'wasteManifest',
  },
  {
    label: 'Diversion rate',
    companyDataKeys: ['recyclingPercent'],
    storeFields: ['waste.recyclingRate', 'waste.recycledKg'],
    document: 'wasteManifest',
  },
  {
    label: 'Hazardous waste',
    companyDataKeys: ['hazardousWasteKg'],
    storeFields: ['waste.hazardousKg'],
    document: 'wasteManifest',
  },
  {
    label: 'Total FTE',
    companyDataKeys: ['totalEmployees'],
    storeFields: ['workforce.totalEmployees'],
    document: 'hrReport',
  },
  {
    label: 'Gender breakdown',
    companyDataKeys: ['femalePercent'],
    storeFields: ['workforce.femaleEmployees', 'workforce.maleEmployees'],
    document: 'hrReport',
  },
  {
    label: 'Turnover rate',
    companyDataKeys: ['turnoverRate'],
    storeFields: ['workforce.turnoverRate', 'workforce.departures'],
    document: 'hrReport',
  },
  {
    label: 'Training hours per employee',
    companyDataKeys: ['trainingHoursPerEmployee'],
    storeFields: ['training.trainingHours'],
    document: 'trainingRecord',
  },
  {
    label: 'TRIR',
    companyDataKeys: ['trirRate'],
    storeFields: ['healthSafety.recordableIncidents', 'healthSafety.hoursWorked'],
    document: 'safetyLog',
  },
  {
    label: 'Lost time incidents',
    companyDataKeys: ['lostTimeIncidents'],
    storeFields: ['healthSafety.lostTimeIncidents'],
    document: 'safetyLog',
  },
]);

const BY_LABEL = new Map(COVERAGE_FIELD_MAP.map(row => [row.label, row]));

/** The row for a data-point label, or null when no document can supply it. */
export function rowForLabel(label) {
  return BY_LABEL.get(label) || null;
}

/** Every document type this map knows how to ask for. */
export const DOCUMENT_TYPES = Object.freeze(
  [...new Set(COVERAGE_FIELD_MAP.map(row => row.document))]
);

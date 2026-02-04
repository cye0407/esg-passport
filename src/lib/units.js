// ============================================
// Unit Conversion Utilities
// ============================================

// Conversion factors to base unit (kg, m³, kWh, km)
const FACTORS = {
  // Mass → base: kg
  kg: 1,
  tonnes: 1000,
  lbs: 0.453592,
  // Volume → base: m3
  m3: 1,
  liters: 0.001,
  gallons: 0.00378541,
  // Energy → base: kWh
  kwh: 1,
  mwh: 1000,
  mj: 1 / 3.6,
  gj: 277.778,
  // Distance → base: km
  km: 1,
  miles: 1.60934,
  // Area → base: m2
  m2: 1,
  hectares: 10000,
  sqft: 0.092903,
};

// Unit type groups
export const UNIT_GROUPS = {
  mass: [
    { value: 'kg', label: 'kg' },
    { value: 'tonnes', label: 'tonnes' },
    { value: 'lbs', label: 'lbs' },
  ],
  volume: [
    { value: 'm3', label: 'm\u00B3' },
    { value: 'liters', label: 'liters' },
    { value: 'gallons', label: 'gallons' },
  ],
  energy: [
    { value: 'kwh', label: 'kWh' },
    { value: 'mwh', label: 'MWh' },
    { value: 'mj', label: 'MJ' },
    { value: 'gj', label: 'GJ' },
  ],
  distance: [
    { value: 'km', label: 'km' },
    { value: 'miles', label: 'miles' },
  ],
  area: [
    { value: 'm2', label: 'm\u00B2' },
    { value: 'hectares', label: 'hectares' },
    { value: 'sqft', label: 'sq ft' },
  ],
};

// Which data fields support unit conversion
export const FIELD_UNITS = {
  electricityKwh: { type: 'energy', defaultUnit: 'kwh', baseUnit: 'kwh' },
  naturalGasKwh: { type: 'energy', defaultUnit: 'kwh', baseUnit: 'kwh' },
  vehicleFuelLiters: { type: 'volume', defaultUnit: 'liters', baseUnit: 'liters' },
  consumptionM3: { type: 'volume', defaultUnit: 'm3', baseUnit: 'm3' },
  totalKg: { type: 'mass', defaultUnit: 'kg', baseUnit: 'kg' },
  recycledKg: { type: 'mass', defaultUnit: 'kg', baseUnit: 'kg' },
  hazardousKg: { type: 'mass', defaultUnit: 'kg', baseUnit: 'kg' },
  totalKmDriven: { type: 'distance', defaultUnit: 'km', baseUnit: 'km' },
  businessTravelKm: { type: 'distance', defaultUnit: 'km', baseUnit: 'km' },
  officeSpaceM2: { type: 'area', defaultUnit: 'm2', baseUnit: 'm2' },
  landUseHectares: { type: 'area', defaultUnit: 'hectares', baseUnit: 'hectares' },
  concreteTonnes: { type: 'mass', defaultUnit: 'tonnes', baseUnit: 'tonnes' },
  steelTonnes: { type: 'mass', defaultUnit: 'tonnes', baseUnit: 'tonnes' },
  materialInputTonnes: { type: 'mass', defaultUnit: 'tonnes', baseUnit: 'tonnes' },
  waterDischargeM3: { type: 'volume', defaultUnit: 'm3', baseUnit: 'm3' },
  medicalWasteKg: { type: 'mass', defaultUnit: 'kg', baseUnit: 'kg' },
  pharmaceuticalWasteKg: { type: 'mass', defaultUnit: 'kg', baseUnit: 'kg' },
  packagingWasteKg: { type: 'mass', defaultUnit: 'kg', baseUnit: 'kg' },
  fertilizerKg: { type: 'mass', defaultUnit: 'kg', baseUnit: 'kg' },
  pesticideKg: { type: 'mass', defaultUnit: 'kg', baseUnit: 'kg' },
  energyGeneratedMwh: { type: 'energy', defaultUnit: 'mwh', baseUnit: 'mwh' },
  siteAreaM2: { type: 'area', defaultUnit: 'm2', baseUnit: 'm2' },
  warehouseSpaceM2: { type: 'area', defaultUnit: 'm2', baseUnit: 'm2' },
  storeAreaM2: { type: 'area', defaultUnit: 'm2', baseUnit: 'm2' },
  fabricProducedM2: { type: 'area', defaultUnit: 'm2', baseUnit: 'm2' },
};

/**
 * Convert a value between units.
 * @param {number} value - The value to convert
 * @param {string} fromUnit - Source unit (e.g., 'tonnes')
 * @param {string} toUnit - Target unit (e.g., 'kg')
 * @returns {number} Converted value
 */
export function convert(value, fromUnit, toUnit) {
  if (fromUnit === toUnit || !value) return value;
  const fromFactor = FACTORS[fromUnit];
  const toFactor = FACTORS[toUnit];
  if (fromFactor === undefined || toFactor === undefined) return value;
  return (value * fromFactor) / toFactor;
}

/**
 * Get available alternative units for a field.
 * @param {string} field - Field name (e.g., 'electricityKwh')
 * @returns {{ value: string, label: string }[]} Available units
 */
export function getAlternativeUnits(field) {
  const config = FIELD_UNITS[field];
  if (!config) return [];
  return UNIT_GROUPS[config.type] || [];
}

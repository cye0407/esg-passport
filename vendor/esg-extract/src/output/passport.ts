// ============================================
// Output: ESG Passport localStorage format
// ============================================

import type { ExtractionResult, PassportDataRecord } from '../types';

/**
 * Convert extraction results to ESG Passport dataRecord format.
 * Returns a partial record — only fields that were extracted.
 */
export function toPassportRecord(result: ExtractionResult): PassportDataRecord {
  const record: PassportDataRecord = {
    period: result.period || new Date().toISOString().slice(0, 7),
  };

  for (const field of result.fields) {
    const val = typeof field.value === 'number' ? field.value : undefined;
    if (val === undefined) continue;

    switch (field.field) {
      case 'electricityKwh':
        record.energy = { ...record.energy, electricityKwh: val };
        break;
      case 'renewablePercent':
        record.energy = { ...record.energy, renewablePercent: val };
        break;
      case 'naturalGasKwh':
        record.energy = { ...record.energy, naturalGasKwh: val };
        break;
      case 'dieselLiters':
        record.energy = { ...record.energy, vehicleFuelLiters: val };
        break;
      case 'petrolLiters':
        record.energy = { ...record.energy, vehicleFuelLiters: (record.energy?.vehicleFuelLiters || 0) + val };
        break;
      case 'waterM3':
        record.water = { ...record.water, consumptionM3: val };
        break;
      case 'totalWasteKg':
        record.waste = { ...record.waste, totalKg: val };
        break;
      case 'hazardousWasteKg':
        record.waste = { ...record.waste, hazardousKg: val };
        break;
      case 'recycledWasteKg':
        record.waste = { ...record.waste, recycledKg: val };
        break;
      case 'totalEmployees':
        record.workforce = { ...record.workforce, totalEmployees: val };
        break;
      case 'femaleEmployees':
        record.workforce = { ...record.workforce, femaleEmployees: val };
        break;
      case 'maleEmployees':
        record.workforce = { ...record.workforce, maleEmployees: val };
        break;
      case 'newHires':
        record.workforce = { ...record.workforce, newHires: val };
        break;
      case 'turnoverRate':
        record.workforce = { ...record.workforce, turnoverRate: val };
        break;
      case 'trainingHours':
        record.training = { ...record.training, trainingHours: val };
        break;
      case 'recordableIncidents':
        record.healthSafety = { ...record.healthSafety, recordableIncidents: val };
        break;
      case 'lostTimeIncidents':
        record.healthSafety = { ...record.healthSafety, lostTimeIncidents: val };
        break;
      case 'hoursWorked':
        record.healthSafety = { ...record.healthSafety, hoursWorked: val };
        break;
      case 'fatalities':
        record.healthSafety = { ...record.healthSafety, fatalities: val };
        break;
    }
  }

  return record;
}

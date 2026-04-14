// ============================================
// Output: ResponseReady ESGCompanyData format
// ============================================

import type { ExtractionResult, ResponseReadyData } from '../types';

/**
 * Convert extraction results to ResponseReady flat data format.
 * Returns a partial object — only fields that were extracted.
 */
export function toResponseReadyData(result: ExtractionResult): ResponseReadyData {
  const data: ResponseReadyData = {};

  for (const field of result.fields) {
    const val = typeof field.value === 'number' ? field.value : undefined;
    if (val === undefined) continue;

    switch (field.field) {
      case 'electricityKwh':
        data.electricityKwh = val;
        break;
      case 'naturalGasKwh':
        // ResponseReady expects m3, not kWh — convert (1 m3 ≈ 10.55 kWh)
        data.naturalGasM3 = Math.round(val / 10.55);
        break;
      case 'waterM3':
        data.waterM3 = val;
        break;
      case 'totalWasteKg':
        data.totalWasteKg = val;
        break;
      case 'hazardousWasteKg':
        data.hazardousWasteKg = val;
        break;
    }
  }

  return data;
}

// ============================================
// Generic Field Extraction Patterns
// ============================================
// These patterns work across providers for common bill formats.
// Provider-specific templates override these when matched.

import type { ExtractedField } from '../types';
import { parseNumber, detectUnit, convertToCanonical } from './units';

/** A generic extraction pattern */
interface GenericPattern {
  field: string;
  /** Patterns that precede or surround the target value */
  labelPatterns: RegExp[];
  /** Expected unit */
  expectedUnit: string;
  /** Alternative units that can be converted */
  altUnits?: { unit: string; convertTo: string }[];
}

const ENERGY_PATTERNS: GenericPattern[] = [
  {
    field: 'electricityKwh',
    labelPatterns: [
      /(?:total|net|gross)?\s*(?:electricity|power|energy)\s*(?:consumption|usage|used|delivered|supplied)[\s:]*([0-9.,\s]+)\s*(kwh|mwh|gwh)/i,
      /(?:verbrauch\s*(?:gesamt)?|gesamtverbrauch|lieferung|bezug)[\s:]*([0-9.,\s]+)\s*(kwh|mwh)/i, // German
      /(?:consommation|livraison)[\s:]*([0-9.,\s]+)\s*(kwh|mwh)/i, // French
      /([0-9.,\s]+)\s*(kwh|mwh)\s*(?:total|net|consumed|delivered)/i,
    ],
    expectedUnit: 'kWh',
    altUnits: [
      { unit: 'MWh', convertTo: 'kWh' },
      { unit: 'GWh', convertTo: 'kWh' },
    ],
  },
  {
    field: 'naturalGasKwh',
    labelPatterns: [
      /(?:natural\s*gas|gas)\s*(?:consumption|usage|used|delivered|supplied)[\s:]*([0-9.,\s]+)\s*(kwh|mwh|m[³3])/i,
      /(?:erdgas|gasverbrauch)[\s:]*([0-9.,\s]+)\s*(kwh|mwh|m[³3])/i, // German
      /(?:energie|energy)[\s:]*([0-9.,\s]+)\s*(kwh|mwh)/i, // "Energie: 376.840 kWh"
      /(?:verbrauch)[\s:]*([0-9.,\s]+)\s*(m[³3])/i, // "Verbrauch: 34.730 m³" (gas context)
      /(?:gaz\s*naturel|consommation\s*de\s*gaz)[\s:]*([0-9.,\s]+)\s*(kwh|mwh|m[³3])/i, // French
      /([0-9.,\s]+)\s*(kwh|mwh|m[³3])\s*(?:gas|erdgas|gaz)/i,
    ],
    expectedUnit: 'kWh',
    altUnits: [
      { unit: 'MWh', convertTo: 'kWh' },
      { unit: 'm3', convertTo: 'kWh' }, // handled specially
    ],
  },
];

const WATER_PATTERNS: GenericPattern[] = [
  {
    field: 'waterM3',
    labelPatterns: [
      /(?:total|net)?\s*(?:water)\s*(?:consumption|usage|withdrawal|intake|supplied|delivered)[\s:]*([0-9.,\s]+)\s*(m[³3]|liters?|litres?)/i,
      /(?:wasserverbrauch|wasserbezug|frischwasser|trinkwasser)[\s:]*([0-9.,\s]+)\s*(m[³3])/i, // German
      /(?:consommation\s*d'eau)[\s:]*([0-9.,\s]+)\s*(m[³3])/i, // French
      /([0-9.,\s]+)\s*(m[³3])\s*(?:water|wasser|eau|frischwasser)/i,
    ],
    expectedUnit: 'm3',
  },
];

const WASTE_PATTERNS: GenericPattern[] = [
  {
    field: 'totalWasteKg',
    labelPatterns: [
      /(?:total)\s*(?:waste)\s*(?:generated|produced|collected|disposed)[\s:]*([0-9.,\s]+)\s*(kg|tonnes?|tons?)/i,
      /(?:abfallmenge|gesamtabfall)[\s:]*([0-9.,\s]+)\s*(kg|tonnen?)/i, // German
      /([0-9.,\s]+)\s*(kg|tonnes?)\s*(?:total\s*waste)/i,
    ],
    expectedUnit: 'kg',
    altUnits: [{ unit: 'tonnes', convertTo: 'kg' }],
  },
  {
    field: 'hazardousWasteKg',
    labelPatterns: [
      /(?:hazardous|dangerous|special)\s*(?:waste)[\s:]*([0-9.,\s]+)\s*(kg|tonnes?|tons?)/i,
      /(?:sonderabfall|gefährlich)[\s:]*([0-9.,\s]+)\s*(kg|tonnen?)/i, // German
    ],
    expectedUnit: 'kg',
    altUnits: [{ unit: 'tonnes', convertTo: 'kg' }],
  },
];

const ALL_PATTERNS = [...ENERGY_PATTERNS, ...WATER_PATTERNS, ...WASTE_PATTERNS];

/**
 * Run generic pattern extraction across a text body.
 * Returns all matched fields with confidence scores.
 */
export function extractWithGenericPatterns(
  text: string,
  page?: number,
): ExtractedField[] {
  const fields: ExtractedField[] = [];

  for (const pattern of ALL_PATTERNS) {
    for (const regex of pattern.labelPatterns) {
      const match = regex.exec(text);
      if (!match) continue;

      const rawValue = match[1];
      const rawUnit = match[2];
      const value = parseNumber(rawValue);
      if (value === null || value <= 0) continue;

      const detectedUnit = detectUnit(rawUnit) || rawUnit;
      let finalValue = value;
      let finalUnit = pattern.expectedUnit;

      // Convert if needed
      if (detectedUnit !== pattern.expectedUnit && pattern.altUnits) {
        const alt = pattern.altUnits.find(a => a.unit === detectedUnit);
        if (alt) {
          finalValue = convertToCanonical(value, detectedUnit, alt.convertTo);
          finalUnit = alt.convertTo;
        }
      }

      fields.push({
        field: pattern.field,
        value: Math.round(finalValue * 100) / 100,
        unit: finalUnit,
        confidence: 'medium', // generic patterns get medium confidence
        score: 0.65,
        reasons: ['pattern_match'],
        rawValueText: rawValue.trim(),
        rawUnitText: rawUnit.trim(),
        normalizedValue: Math.round(finalValue * 100) / 100,
        normalizedUnit: finalUnit,
        source: {
          page,
          rawText: match[0].substring(0, 120),
        },
      });

      break; // first match per pattern wins
    }
  }

  return fields;
}

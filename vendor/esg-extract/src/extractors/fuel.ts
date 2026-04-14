// ============================================
// Fuel Extractor — diesel/petrol fleet receipts, fuel invoices
// ============================================

import type { ExtractionResult, ExtractedField, ExtractionConfig, Issue } from '../types';
import { parseNumber } from '../matchers/units';
import { adjustConfidence } from '../matchers/confidence';

function detectPeriod(text: string): string | undefined {
  const monthYear = /\b(jan(?:uar[iy]?)?|feb(?:ruar[iy]?)?|m[aä]r[czs]?|apr(?:il)?|ma[iy]|jun[ei]?|jul[iy]?|aug(?:ust)?|sep(?:tember)?|o[ck]t(?:ober)?|nov(?:ember)?|de[czs](?:ember)?)\s*(\d{4})\b/i;
  const myMatch = monthYear.exec(text);
  if (myMatch) {
    const map: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', mär: '03', apr: '04', mai: '05', may: '05',
      jun: '06', jul: '07', aug: '08', sep: '09', okt: '10', oct: '10',
      nov: '11', dez: '12', dec: '12',
    };
    const m = map[myMatch[1].substring(0, 3).toLowerCase()];
    if (m) return `${myMatch[2]}-${m}`;
  }
  const yearOnly = /\b(20[2-3]\d)\b/;
  const yearMatch = yearOnly.exec(text);
  if (yearMatch) return yearMatch[1];
  return undefined;
}

const FUEL_PATTERNS: { field: string; patterns: RegExp[]; unit: string }[] = [
  {
    field: 'dieselLiters',
    patterns: [
      /(?:summe|total|gesamt)\s*(?:diesel)[\s:]*([0-9.,\s]+)\s*(?:l(?:iter)?|L)\b/i,
      /(?:diesel)[\s:]*([0-9.,\s]+)\s*(?:l(?:iter)?|L)\b/i,
      /([0-9.,\s]+)\s*(?:l(?:iter)?|L)\s*(?:diesel)/i,
      /(?:summe|total|gesamt)\s*[\s:]*([0-9.,\s]+)\s*(?:l(?:iter)?|L)\b/i,
    ],
    unit: 'L',
  },
  {
    field: 'petrolLiters',
    patterns: [
      /(?:summe|total|gesamt)\s*(?:benzin|petrol|gasoline|super)[\s:]*([0-9.,\s]+)\s*(?:l(?:iter)?|L)\b/i,
      /(?:benzin|petrol|gasoline|super)[\s:]*([0-9.,\s]+)\s*(?:l(?:iter)?|L)\b/i,
    ],
    unit: 'L',
  },
];

export function extractFuel(
  text: string,
  config?: ExtractionConfig,
): ExtractionResult {
  const period = detectPeriod(text);
  let fields: ExtractedField[] = [];

  for (const pattern of FUEL_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = regex.exec(text);
      if (!match) continue;

      const value = parseNumber(match[1]);
      if (value === null || value <= 0) continue;

      fields.push({
        field: pattern.field,
        value: Math.round(value * 10) / 10,
        unit: pattern.unit,
        confidence: 'medium',
        score: 0.65,
        reasons: ['pattern_match'],
        rawValueText: match[1].trim(),
        rawUnitText: pattern.unit,
        normalizedValue: Math.round(value * 10) / 10,
        normalizedUnit: pattern.unit,
        source: { rawText: match[0].substring(0, 120) },
        period,
      });
      break;
    }
  }

  fields = adjustConfidence(fields);
  const issues: Issue[] = [];
  if (!period) {
    issues.push({
      code: 'period_not_found',
      message: 'Could not detect a reporting period.',
    });
  }
  if (fields.length === 0) {
    issues.push({
      code: 'missing_expected_field',
      field: 'dieselLiters',
      message: 'Could not extract fuel quantities. Manual entry may be required.',
    });
  }
  for (const field of fields) {
    if (field.score < 0.55) {
      issues.push({
        code: 'low_confidence_field',
        field: field.field,
        message: `Low confidence extraction for ${field.field}.`,
      });
    }
  }

  return {
    success: fields.length > 0,
    documentType: 'gas_invoice', // reuse closest type
    provider: undefined,
    period,
    fields,
    issues,
    gaps: fields.length === 0 ? ['dieselLiters'] : [],
    warnings: issues.map(issue => issue.message),
    rawText: text,
  };
}

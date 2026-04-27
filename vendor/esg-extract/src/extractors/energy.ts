// ============================================
// Energy Extractor — electricity bills, gas invoices
// ============================================

import type { ExtractionResult, ExtractionConfig, Issue } from '../types';
import { extractWithGenericPatterns } from '../matchers/patterns';
import { adjustConfidence } from '../matchers/confidence';

/** Detect billing period from text */
function detectPeriod(text: string): string | undefined {
  // ISO date range: 2025-01-01 to 2025-01-31
  const isoRange = /(\d{4}-\d{2})-\d{2}\s*(?:to|bis|au|–|-)\s*(\d{4}-\d{2})-\d{2}/i;
  const isoMatch = isoRange.exec(text);
  if (isoMatch) return isoMatch[1];

  // European date range: 01.01.2025 - 31.01.2025
  const euRange = /\d{1,2}\.\d{1,2}\.(\d{4})\s*(?:to|bis|au|–|-)\s*\d{1,2}\.\d{1,2}\.\d{4}/i;
  const euMatch = euRange.exec(text);
  if (euMatch) return euMatch[1];

  // Month + Year: January 2025, Januar 2025, Janvier 2025
  const monthYear = /\b(jan(?:uar[iy]?)?|feb(?:ruar[iy]?)?|m[aä]r[czs]?|apr(?:il)?|ma[iy]|jun[ei]?|jul[iy]?|aug(?:ust)?|sep(?:tember)?|o[ck]t(?:ober)?|nov(?:ember)?|de[czs](?:ember)?)\s*(\d{4})\b/i;
  const myMatch = monthYear.exec(text);
  if (myMatch) {
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', mär: '03', apr: '04', mai: '05', may: '05',
      jun: '06', jul: '07', aug: '08', sep: '09', okt: '10', oct: '10',
      nov: '11', dez: '12', dec: '12',
    };
    const prefix = myMatch[1].substring(0, 3).toLowerCase();
    const month = monthNames[prefix];
    if (month) return `${myMatch[2]}-${month}`;
  }

  // Just a year: 2025
  const yearOnly = /\b(20[2-3]\d)\b/;
  const yearMatch = yearOnly.exec(text);
  if (yearMatch) return yearMatch[1];

  return undefined;
}

/** Detect the energy provider from text */
function detectProvider(text: string): string | undefined {
  const providers: [RegExp, string][] = [
    [/\bE\.ON\b/i, 'E.ON'],
    [/\bVattenfall\b/i, 'Vattenfall'],
    [/\bEnBW\b/i, 'EnBW'],
    [/\bRWE\b/i, 'RWE'],
    [/\bEDF\b/i, 'EDF'],
    [/\bEngie\b/i, 'Engie'],
    [/\bTotalEnergies\b/i, 'TotalEnergies'],
    [/\bIberdrola\b/i, 'Iberdrola'],
    [/\bEnel\b/i, 'Enel'],
    [/\bNaturgy\b/i, 'Naturgy'],
    [/\bØrsted\b/i, 'Ørsted'],
    [/\bFortum\b/i, 'Fortum'],
    [/\bStatkraft\b/i, 'Statkraft'],
    [/\bEssent\b/i, 'Essent'],
    [/\bVatten[fF]all\b/, 'Vattenfall'],
    [/\bStadtwerke\b/i, 'Stadtwerke'],
    [/\bBritish\s*Gas\b/i, 'British Gas'],
    [/\bOctopus\s*Energy\b/i, 'Octopus Energy'],
    [/\bSSE\b/, 'SSE'],
    [/\bEDP\b/, 'EDP'],
  ];

  for (const [pattern, name] of providers) {
    if (pattern.test(text)) return name;
  }
  return undefined;
}

/** Detect if this is an electricity vs gas document */
function detectEnergyType(text: string): 'electricity_bill' | 'gas_invoice' {
  const lower = text.toLowerCase();
  const gasScore = (lower.match(/\b(gas|erdgas|gaz\s*naturel|natural\s*gas|gasverbrauch|facture\s*de\s*gaz)\b/g) || []).length;
  const elecScore = (lower.match(/\b(electricity|strom|électricité|stromrechnung)\b/g) || []).length;
  return gasScore > elecScore ? 'gas_invoice' : 'electricity_bill';
}

/**
 * Extract energy data from document text.
 */
export function extractEnergy(
  text: string,
  config?: ExtractionConfig,
): ExtractionResult {
  const documentType = config?.forceType || detectEnergyType(text);
  const provider = detectProvider(text);
  const period = detectPeriod(text);

  // Run generic pattern matching
  let fields = extractWithGenericPatterns(text);

  // Keep only fields that make sense for the detected document type and
  // recover obvious mislabeled kWh fields from provider-specific layouts.
  if (documentType === 'electricity_bill') {
    if (!fields.some(field => field.field === 'electricityKwh')) {
      const fallback = fields.find(field => field.field === 'naturalGasKwh');
      if (fallback) {
        fallback.field = 'electricityKwh';
      }
    }
    fields = fields.filter(field => field.field !== 'naturalGasKwh');
  } else if (documentType === 'gas_invoice') {
    if (!fields.some(field => field.field === 'naturalGasKwh')) {
      const fallback = fields.find(field => field.field === 'electricityKwh');
      if (fallback) {
        fallback.field = 'naturalGasKwh';
      }
    }
    fields = fields.filter(field => field.field !== 'electricityKwh' && field.field !== 'renewablePercent');
  }

  // If provider-specific template matched, those fields would override (future)

  // Apply confidence adjustments
  fields = adjustConfidence(fields);

  // Filter by minimum confidence
  const minConf = config?.minConfidence || 'low';
  const confOrder = { high: 3, medium: 2, low: 1 };
  fields = fields.filter(f => confOrder[f.confidence] >= confOrder[minConf]);

  // Set period on all fields
  if (period) {
    fields = fields.map(f => ({ ...f, period }));
  }

  // If only water fields were extracted, correct the document type
  const hasWaterOnly = fields.every(f => f.field === 'waterM3' || f.field === 'waterSourceMunicipalPercent');
  const hasWater = fields.some(f => f.field === 'waterM3');
  const finalDocType = (hasWater && hasWaterOnly) ? 'water_bill' as const : documentType;

  // Detect gaps
  const gaps: string[] = [];
  const issues: Issue[] = [];
  const expectedFields = finalDocType === 'water_bill'
    ? ['waterM3']
    : finalDocType === 'electricity_bill'
    ? ['electricityKwh']
    : ['naturalGasKwh'];

  for (const expected of expectedFields) {
    if (!fields.some(f => f.field === expected)) {
      gaps.push(expected);
      issues.push({
        code: 'missing_expected_field',
        field: expected,
        message: `Could not extract: ${expected}. Manual entry may be required.`,
      });
    }
  }

  if (!period) {
    issues.push({
      code: 'period_not_found',
      message: 'Could not detect a billing or service period.',
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
    documentType: finalDocType,
    provider,
    period,
    fields,
    issues,
    gaps,
    warnings: issues.map(issue => issue.message),
    rawText: text,
  };
}

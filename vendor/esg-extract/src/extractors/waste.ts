// ============================================
// Waste Extractor — manifests, disposal receipts, collection reports
// ============================================

import type { ExtractionResult, ExtractedField, ExtractionConfig, Issue } from '../types';
import { parseNumber, detectUnit, convertToCanonical } from '../matchers/units';
import { adjustConfidence } from '../matchers/confidence';

/** Detect billing/collection period */
function detectPeriod(text: string): string | undefined {
  const isoRange = /(\d{4}-\d{2})-\d{2}\s*(?:to|bis|au|–|-)\s*(\d{4}-\d{2})-\d{2}/i;
  const isoMatch = isoRange.exec(text);
  if (isoMatch) return isoMatch[1];

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

/** Detect waste disposal provider */
function detectProvider(text: string): string | undefined {
  const providers: [RegExp, string][] = [
    [/\bVeolia\b/i, 'Veolia'],
    [/\bSuez\b/i, 'Suez'],
    [/\bRemondis\b/i, 'Remondis'],
    [/\bPreZero\b/i, 'PreZero'],
    [/\bBiffa\b/i, 'Biffa'],
    [/\bStericycle\b/i, 'Stericycle'],
    [/\bClean\s*Harbors\b/i, 'Clean Harbors'],
    [/\bFCC\s*(Environment|Medio\s*Ambiente)\b/i, 'FCC Environment'],
    [/\bAlba\b/i, 'Alba'],
    [/\bSita\b/i, 'Sita'],
    [/\bRagn-Sells\b/i, 'Ragn-Sells'],
    [/\bStena\s*Recycling\b/i, 'Stena Recycling'],
  ];

  for (const [pattern, name] of providers) {
    if (pattern.test(text)) return name;
  }
  return undefined;
}

const WASTE_PATTERNS: { field: string; patterns: RegExp[]; unit: string; altUnits?: { from: string; to: string }[] }[] = [
  {
    field: 'totalWasteKg',
    patterns: [
      /(?:gesamtmenge|abfallmenge|total\s*des\s*déchets)[\s:]*([0-9.,\s]+)\s*(kg|tonnes?|tonnen?|t\b)/i,
      /(?:total|gesamt|netto)?\s*(?:waste|abfall|déchets)\s*(?:generated|collected|disposed|gesammelt|entsorgt|collectés)?[\s:]*([0-9.,\s]+)\s*(kg|tonnes?|tons?|tonnen?|t\b)/i,
      /(?:total\s*weight|gross\s*weight|net\s*weight)[\s:]*([0-9.,\s]+)\s*(kg|tonnes?|tons?)/i,
      /([0-9.,\s]+)\s*(kg|tonnes?|tons?)\s*(?:total\s*waste|gesamt|total\s*des\s*déchets)/i,
    ],
    unit: 'kg',
    altUnits: [{ from: 'tonnes', to: 'kg' }],
  },
  {
    field: 'hazardousWasteKg',
    patterns: [
      /(?:hazardous|dangerous|special|gefährlich|sonder|dangereux)\s*(?:waste|abfall|déchets)[\s:]*([0-9.,\s]+)\s*(kg|tonnes?|tons?|tonnen?|t\b)/i,
      /(?:sonderabfall|gefährliche\s*abfälle|déchets\s*dangereux)[\s:]*([0-9.,\s]+)\s*(kg|tonnes?|tonnen?)/i,
      /([0-9.,\s]+)\s*(kg|tonnes?)\s*(?:hazardous|dangerous|gefährlich|dangereux)/i,
    ],
    unit: 'kg',
    altUnits: [{ from: 'tonnes', to: 'kg' }],
  },
  {
    field: 'recycledWasteKg',
    patterns: [
      /(?:recyclingmenge|wertstoff|matières\s*recyclées|recycled\s*(?:waste|material))[\s()\w]*[\s:]+([0-9.,\s]+)\s*(kg|tonnes?|tons?|tonnen?|t\b)/i,
      /(?:recycled|recovered|diverted|recyclé|valorisé)\s*(?:waste|material|abfall|déchets)?[\s:]*([0-9.,\s]+)\s*(kg|tonnes?|tons?|tonnen?|t\b)/i,
      /([0-9.,\s]+)\s*(kg|tonnes?)\s*(?:recycled|recovered|diverted)/i,
    ],
    unit: 'kg',
    altUnits: [{ from: 'tonnes', to: 'kg' }],
  },
  {
    field: 'recyclingRate',
    patterns: [
      /(?:recycling|diversion|recovery|verwertungs?)\s*(?:rate|quote|taux)[\s:]*([0-9.,]+)\s*(%|percent|prozent)/i,
      /([0-9.,]+)\s*(%)\s*(?:recycling|diversion|recovery|verwertung)/i,
    ],
    unit: '%',
  },
];

/**
 * Extract waste data from document text.
 */
export function extractWaste(
  text: string,
  config?: ExtractionConfig,
): ExtractionResult {
  const provider = detectProvider(text);
  const period = detectPeriod(text);
  let fields: ExtractedField[] = [];

  for (const pattern of WASTE_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = regex.exec(text);
      if (!match) continue;

      const rawValue = match[1];
      const rawUnit = match[2];
      const value = parseNumber(rawValue);
      if (value === null || value < 0) continue;

      const detectedUnit = detectUnit(rawUnit) || rawUnit;
      let finalValue = value;

      if (detectedUnit !== pattern.unit && pattern.altUnits) {
        const alt = pattern.altUnits.find(a => a.from === detectedUnit);
        if (alt) {
          finalValue = convertToCanonical(value, detectedUnit, alt.to);
        }
      }

      fields.push({
        field: pattern.field,
        value: Math.round(finalValue * 100) / 100,
        unit: pattern.unit,
        confidence: 'medium',
        score: 0.65,
        reasons: ['pattern_match'],
        rawValueText: rawValue.trim(),
        rawUnitText: rawUnit.trim(),
        normalizedValue: Math.round(finalValue * 100) / 100,
        normalizedUnit: pattern.unit,
        source: { rawText: match[0].substring(0, 120) },
        period,
      });

      break;
    }
  }

  // Calculate recycling rate if we have total and recycled but not rate
  const total = fields.find(f => f.field === 'totalWasteKg');
  const recycled = fields.find(f => f.field === 'recycledWasteKg');
  const rateField = fields.find(f => f.field === 'recyclingRate');
  if (total && recycled && !rateField && typeof total.value === 'number' && typeof recycled.value === 'number' && total.value > 0) {
    fields.push({
      field: 'recyclingRate',
      value: Math.round((recycled.value as number) / (total.value as number) * 10000) / 100,
      unit: '%',
      confidence: 'medium',
      score: 0.7,
      reasons: ['derived_from_total_and_recycled'],
      rawValueText: `${recycled.value}/${total.value}`,
      rawUnitText: '%',
      normalizedValue: Math.round((recycled.value as number) / (total.value as number) * 10000) / 100,
      normalizedUnit: '%',
      source: { rawText: `Calculated: ${recycled.value} / ${total.value}` },
      period,
    });
  }

  fields = adjustConfidence(fields);

  const gaps: string[] = [];
  const issues: Issue[] = [];
  if (!fields.some(f => f.field === 'totalWasteKg')) gaps.push('totalWasteKg');
  for (const gap of gaps) {
    issues.push({
      code: 'missing_expected_field',
      field: gap,
      message: `Could not extract: ${gap}. Manual entry may be required.`,
    });
  }
  if (!period) {
    issues.push({
      code: 'period_not_found',
      message: 'Could not detect a billing or collection period.',
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
    documentType: 'waste_manifest',
    provider,
    period,
    fields,
    issues,
    gaps,
    warnings: issues.map(issue => issue.message),
    rawText: text,
  };
}

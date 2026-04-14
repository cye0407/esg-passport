// ============================================
// Workforce Extractor — payroll summaries, HR reports
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

const WORKFORCE_PATTERNS: { field: string; patterns: RegExp[]; unit: string }[] = [
  {
    field: 'totalEmployees',
    patterns: [
      /(?:total|gesamt)?\s*(?:employees?|staff|headcount|mitarbeiter|effectif|fte|full.time.equivalent)[\s:]*([0-9.,\s]+)/i,
      /(?:belegschaft|personalbestand|effectif\s*total)[\s:]*([0-9.,\s]+)/i,
      /([0-9.,\s]+)\s*(?:employees?|staff|fte|mitarbeiter)\s*(?:total|gesamt)?/i,
    ],
    unit: 'FTE',
  },
  {
    field: 'femaleEmployees',
    patterns: [
      /(?:female|women|weiblich|femmes)[\s:]*([0-9.,\s]+)/i,
      /([0-9.,\s]+)\s*(?:female|women|weiblich|femmes)/i,
    ],
    unit: 'FTE',
  },
  {
    field: 'maleEmployees',
    patterns: [
      /(?:male|men|männlich|hommes)[\s:]*([0-9.,\s]+)/i,
      /([0-9.,\s]+)\s*(?:male|men|männlich|hommes)\b/i,
    ],
    unit: 'FTE',
  },
  {
    field: 'newHires',
    patterns: [
      /(?:new\s*hires?|einstellungen|neue\s*mitarbeiter|embauches?|recrut)[\s:]*([0-9.,\s]+)/i,
      /([0-9.,\s]+)\s*(?:new\s*hires?|einstellungen|embauches?)/i,
    ],
    unit: 'count',
  },
  {
    field: 'departures',
    patterns: [
      /(?:departures?|leavers?|abgänge|austritte|départs?)[\s:]*([0-9.,\s]+)/i,
      /([0-9.,\s]+)\s*(?:departures?|leavers?|abgänge|austritte|départs?)/i,
    ],
    unit: 'count',
  },
  {
    field: 'turnoverRate',
    patterns: [
      /(?:turnover|attrition|fluktuation)\s*(?:rate)?[\s:]*([0-9.,]+)\s*(%|percent|prozent)/i,
      /([0-9.,]+)\s*(%)\s*(?:turnover|attrition|fluktuation)/i,
    ],
    unit: '%',
  },
  {
    field: 'trainingHours',
    patterns: [
      /(?:total\s*)?(?:training|schulung|formation)\s*(?:hours?|stunden|heures)[\s:]*([0-9.,\s]+)/i,
      /(?:schulungsstunden|heures?\s*de\s*formation)[\s:]*([0-9.,\s]+)/i,
      /([0-9.,\s]+)\s*(?:hours?|stunden|heures)\s*(?:of\s*)?(?:training|schulung|formation)/i,
    ],
    unit: 'hours',
  },
  {
    field: 'recordableIncidents',
    patterns: [
      /(?:recordable\s*incidents?|meldepflichtige\s*unfälle|accidents?\s*déclarés?)[\s:]*([0-9.,\s]+)/i,
      /([0-9.,\s]+)\s*(?:recordable\s*incidents?|workplace\s*(?:accidents?|incidents?))/i,
    ],
    unit: 'count',
  },
  {
    field: 'lostTimeIncidents',
    patterns: [
      /(?:lost[\s-]*time\s*(?:incidents?|injuries?|accidents?)|ltis?|arbeitsunfälle\s*mit\s*ausfall)[\s:]*([0-9.,\s]+)/i,
      /([0-9.,\s]+)\s*(?:lost[\s-]*time\s*(?:incidents?|injuries?))/i,
    ],
    unit: 'count',
  },
  {
    field: 'hoursWorked',
    patterns: [
      /(?:total\s*)?(?:hours?\s*worked|arbeitsstunden|heures?\s*travaillées?)[\s:]*([0-9.,\s]+)/i,
      /([0-9.,\s]+)\s*(?:hours?\s*worked|arbeitsstunden)/i,
    ],
    unit: 'hours',
  },
];

/**
 * Extract workforce data from document text.
 */
export function extractWorkforce(
  text: string,
  config?: ExtractionConfig,
): ExtractionResult {
  const period = detectPeriod(text);
  let fields: ExtractedField[] = [];

  for (const pattern of WORKFORCE_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = regex.exec(text);
      if (!match) continue;

      const rawValue = match[1];
      const value = parseNumber(rawValue);
      if (value === null || value < 0) continue;

      fields.push({
        field: pattern.field,
        value: Math.round(value * 100) / 100,
        unit: pattern.unit,
        confidence: 'medium',
        score: 0.65,
        reasons: ['pattern_match'],
        rawValueText: rawValue.trim(),
        normalizedValue: Math.round(value * 100) / 100,
        normalizedUnit: pattern.unit,
        source: { rawText: match[0].substring(0, 120) },
        period,
      });

      break;
    }
  }

  // Calculate female % if we have headcount and female count
  const total = fields.find(f => f.field === 'totalEmployees');
  const female = fields.find(f => f.field === 'femaleEmployees');
  if (total && female && typeof total.value === 'number' && typeof female.value === 'number' && total.value > 0) {
    fields.push({
      field: 'femalePercent',
      value: Math.round((female.value as number) / (total.value as number) * 10000) / 100,
      unit: '%',
      confidence: 'medium',
      score: 0.7,
      reasons: ['derived_from_total_and_female'],
      rawValueText: `${female.value}/${total.value}`,
      rawUnitText: '%',
      normalizedValue: Math.round((female.value as number) / (total.value as number) * 10000) / 100,
      normalizedUnit: '%',
      source: { rawText: `Calculated: ${female.value} / ${total.value}` },
      period,
    });
  }

  fields = adjustConfidence(fields);

  const gaps: string[] = [];
  const issues: Issue[] = [];
  if (!fields.some(f => f.field === 'totalEmployees')) gaps.push('totalEmployees');
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
      message: 'Could not detect a reporting period.',
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
    documentType: 'payroll_summary',
    provider: undefined,
    period,
    fields,
    issues,
    gaps,
    warnings: issues.map(issue => issue.message),
    rawText: text,
  };
}

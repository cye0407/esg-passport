import type { ExtractionResult } from '../types';

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[\s_-]+/g, '');
const parseDecimal = (value: string) => {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return undefined;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
};

/** Parse a fleet-card transaction export without confusing spend or odometer columns for litres. */
export function extractFleetCsv(text: string): ExtractionResult {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  const delimiter = (lines[0]?.match(/;/g) || []).length >= (lines[0]?.match(/,/g) || []).length ? ';' : ',';
  const headers = (lines[0] || '').split(delimiter).map(normalizeHeader);
  const dateIndex = headers.findIndex(header => ['datum', 'date', 'transactiondate'].includes(header));
  const litersIndex = headers.findIndex(header => ['liter', 'liters', 'litres', 'menge'].includes(header));

  if (dateIndex < 0 || litersIndex < 0) {
    return {
      success: false, documentType: 'fleet_fuel_report', fields: [], gaps: ['dieselLiters'], rawText: text,
      issues: [{ code: 'missing_expected_field', field: 'dieselLiters', message: 'Could not identify the date and litres columns in this fleet CSV.' }],
      warnings: ['Could not identify the date and litres columns in this fleet CSV.'],
    };
  }

  let total = 0;
  let transactions = 0;
  const periods = new Set<string>();
  for (const line of lines.slice(1)) {
    const columns = line.split(delimiter);
    const date = columns[dateIndex]?.trim() || '';
    const dateMatch = /^(\d{4})-(\d{2})-\d{2}$/.exec(date) || /^\d{1,2}\.([0-1]?\d)\.(\d{4})$/.exec(date);
    const liters = parseDecimal(columns[litersIndex] || '');
    if (!dateMatch || liters === undefined || liters < 0) continue;
    const year = date.includes('-') ? dateMatch[1] : dateMatch[2];
    const month = date.includes('-') ? dateMatch[2] : dateMatch[1].padStart(2, '0');
    periods.add(`${year}-${month}`);
    total += liters;
    transactions += 1;
  }

  const years = new Set([...periods].map(period => period.slice(0, 4)));
  const oneMonth = periods.size === 1;
  const fullYear = years.size === 1 && periods.size === 12;
  if (transactions === 0 || (!oneMonth && !fullYear)) {
    const message = transactions === 0
      ? 'No valid fuel transactions were found in this fleet CSV.'
      : `This fleet CSV covers ${periods.size} months. Upload a single month or a complete 12-month year so the total is not assigned to the wrong period.`;
    return {
      success: false, documentType: 'fleet_fuel_report', fields: [], gaps: ['dieselLiters'], rawText: text,
      issues: [{ code: 'period_not_found', message }], warnings: [message],
    };
  }

  const period = fullYear ? [...years][0] : [...periods][0];
  const value = +total.toFixed(2);
  return {
    success: true,
    documentType: 'fleet_fuel_report',
    provider: /\baral\b/i.test(text) ? 'ARAL' : undefined,
    period,
    fields: [{
      field: 'dieselLiters', value, unit: 'L', confidence: 'high', score: 0.99,
      reasons: [`Summed ${transactions} rows from the litres column`, `${periods.size} month${periods.size === 1 ? '' : 's'} covered`],
      rawValueText: String(value), normalizedValue: value, normalizedUnit: 'L', period,
      source: { region: `CSV litres column (${transactions} transactions)`, rawText: `Liter total: ${value}` },
    }],
    issues: [], gaps: [], warnings: [], rawText: text,
  };
}

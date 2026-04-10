import { describe, it, expect } from 'vitest';
import { detectNumberFormat, parseNumber, parsePeriod, buildColumnMap } from '../csvImport';

describe('detectNumberFormat', () => {
  it('detects EU format from thousands+decimal pattern', () => {
    expect(detectNumberFormat(['1.234,56', '12.345,00', '999,50'])).toBe('eu');
  });

  it('detects US format from thousands+decimal pattern', () => {
    expect(detectNumberFormat(['1,234.56', '12,345.00', '999.50'])).toBe('us');
  });

  it('defaults to US on empty / ambiguous input', () => {
    expect(detectNumberFormat([])).toBe('us');
    expect(detectNumberFormat(['100', '200', '300'])).toBe('us');
  });

  it('weighs strong signals over weak ones', () => {
    // One strong EU signal beats several weak US-looking ones
    expect(detectNumberFormat(['1.234,56', '10', '20', '30'])).toBe('eu');
  });

  it('ignores non-string and empty entries', () => {
    expect(detectNumberFormat([null, undefined, '', '1.234,56', '999,50'])).toBe('eu');
  });
});

describe('parseNumber', () => {
  it('parses US-format numbers', () => {
    expect(parseNumber('1,234.56', 'us')).toBe(1234.56);
    expect(parseNumber('999.50', 'us')).toBe(999.5);
    expect(parseNumber('42', 'us')).toBe(42);
  });

  it('parses EU-format numbers', () => {
    expect(parseNumber('1.234,56', 'eu')).toBe(1234.56);
    expect(parseNumber('999,50', 'eu')).toBe(999.5);
    expect(parseNumber('1.250', 'eu')).toBe(1250); // critical: not 1.25
    expect(parseNumber('42', 'eu')).toBe(42);
  });

  it('handles negative numbers in both formats', () => {
    expect(parseNumber('-1,234.56', 'us')).toBe(-1234.56);
    expect(parseNumber('-1.234,56', 'eu')).toBe(-1234.56);
  });

  it('returns null for empty / nullish / unparseable input', () => {
    expect(parseNumber('', 'us')).toBeNull();
    expect(parseNumber(null, 'us')).toBeNull();
    expect(parseNumber(undefined, 'us')).toBeNull();
    expect(parseNumber('   ', 'us')).toBeNull();
    expect(parseNumber('not a number', 'us')).toBeNull();
  });

  it('never returns NaN', () => {
    // The whole point: NaN silently corrupts downstream calculations
    const cases = ['', null, 'abc', '1.2.3.4', '...'];
    for (const c of cases) {
      const out = parseNumber(c, 'us');
      expect(Number.isNaN(out)).toBe(false);
    }
  });
});

describe('parsePeriod', () => {
  it('accepts canonical YYYY-MM', () => {
    expect(parsePeriod('2025-01')).toBe('2025-01');
    expect(parsePeriod('2025-12')).toBe('2025-12');
  });

  it('pads single-digit months', () => {
    expect(parsePeriod('2025-1')).toBe('2025-01');
    expect(parsePeriod('1/2025')).toBe('2025-01');
    expect(parsePeriod('2025/1')).toBe('2025-01');
  });

  it('accepts MM/YYYY', () => {
    expect(parsePeriod('01/2025')).toBe('2025-01');
    expect(parsePeriod('12/2025')).toBe('2025-12');
  });

  it('accepts YYYY/MM', () => {
    expect(parsePeriod('2025/03')).toBe('2025-03');
  });

  it('accepts English month names', () => {
    expect(parsePeriod('Jan 2025')).toBe('2025-01');
    expect(parsePeriod('January 2025')).toBe('2025-01');
    expect(parsePeriod('Dec 2024')).toBe('2024-12');
  });

  it('accepts German month names with umlauts', () => {
    expect(parsePeriod('Mär 2025')).toBe('2025-03');
    expect(parsePeriod('März 2025')).toBe('2025-03');
    expect(parsePeriod('Januar 2025')).toBe('2025-01');
    expect(parsePeriod('Dezember 2025')).toBe('2025-12');
    expect(parsePeriod('Mai 2025')).toBe('2025-05');
  });

  it('accepts YYYY-Mon variants', () => {
    expect(parsePeriod('2025-Jan')).toBe('2025-01');
    expect(parsePeriod('2025 März')).toBe('2025-03');
  });

  it('returns null for unrecognised input', () => {
    expect(parsePeriod('')).toBeNull();
    expect(parsePeriod(null)).toBeNull();
    expect(parsePeriod('garbage')).toBeNull();
    expect(parsePeriod('2025')).toBeNull();
    expect(parsePeriod('not a date')).toBeNull();
  });

  it('is case-insensitive on month names', () => {
    expect(parsePeriod('JAN 2025')).toBe('2025-01');
    expect(parsePeriod('january 2025')).toBe('2025-01');
  });
});

describe('buildColumnMap', () => {
  it('matches standard headers case-insensitively', () => {
    const headers = ['period', 'Electricity (kWh)', 'Water (m3)', 'Total Waste (kg)', 'Employees'];
    const map = buildColumnMap(headers);
    expect(map.electricityKwh.col).toBe(1);
    expect(map.consumptionM3.col).toBe(2);
    expect(map.totalKg.col).toBe(3);
    expect(map.totalEmployees.col).toBe(4);
  });

  it('returns -1 for missing columns', () => {
    const map = buildColumnMap(['period', 'electricity']);
    expect(map.consumptionM3.col).toBe(-1);
    expect(map.recordableIncidents.col).toBe(-1);
  });

  it('distinguishes male from female employees', () => {
    const headers = ['period', 'female employees', 'male employees'];
    const map = buildColumnMap(headers);
    expect(map.femaleEmployees.col).toBe(1);
    expect(map.maleEmployees.col).toBe(2);
  });

  it('handles empty / null header cells without crashing', () => {
    const headers = ['period', null, '', 'electricity'];
    const map = buildColumnMap(headers);
    expect(map.electricityKwh.col).toBe(3);
  });
});

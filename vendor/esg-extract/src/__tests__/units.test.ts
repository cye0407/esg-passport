import { describe, it, expect } from 'vitest';
import { parseNumber, detectUnit, convertToCanonical } from '../matchers/units';

describe('parseNumber', () => {
  it('parses plain integers', () => {
    expect(parseNumber('12345')).toBe(12345);
  });

  it('parses US format with commas', () => {
    expect(parseNumber('1,234,567')).toBe(1234567);
  });

  it('parses US decimal', () => {
    expect(parseNumber('1,234.56')).toBe(1234.56);
  });

  it('parses European format with dots as thousands', () => {
    expect(parseNumber('1.234,56')).toBe(1234.56);
  });

  it('parses European decimal without thousands', () => {
    expect(parseNumber('123,45')).toBe(123.45);
  });

  it('parses European large number with dots', () => {
    expect(parseNumber('76.543')).toBe(76543);
  });

  it('strips currency symbols', () => {
    expect(parseNumber('€1.234,56')).toBe(1234.56);
    expect(parseNumber('$12,345.67')).toBe(12345.67);
  });

  it('handles spaces as thousands separators', () => {
    expect(parseNumber('1 234 567')).toBe(1234567);
  });

  it('returns null for empty/invalid', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
  });
});

describe('detectUnit', () => {
  it('detects kWh', () => expect(detectUnit('kWh')).toBe('kWh'));
  it('detects MWh', () => expect(detectUnit('MWh')).toBe('MWh'));
  it('detects m3', () => expect(detectUnit('m³')).toBe('m3'));
  it('detects kg', () => expect(detectUnit('kg')).toBe('kg'));
  it('detects tonnes', () => expect(detectUnit('tonnes')).toBe('tonnes'));
  it('detects percent', () => expect(detectUnit('%')).toBe('%'));
  it('returns null for unknown', () => expect(detectUnit('widgets')).toBeNull());
});

describe('convertToCanonical', () => {
  it('converts MWh to kWh', () => {
    expect(convertToCanonical(1.5, 'MWh', 'kWh')).toBe(1500);
  });

  it('converts tonnes to kg', () => {
    expect(convertToCanonical(2.5, 'tonnes', 'kg')).toBe(2500);
  });

  it('returns value unchanged for same unit', () => {
    expect(convertToCanonical(100, 'kWh', 'kWh')).toBe(100);
  });
});

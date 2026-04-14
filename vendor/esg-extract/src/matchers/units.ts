// ============================================
// Unit Detection & Conversion
// ============================================

/** Normalize a number string from European or US format to a JS number */
export function parseNumber(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  let cleaned = raw.trim();

  // Remove currency symbols and whitespace
  cleaned = cleaned.replace(/[€$£¥]/g, '').trim();

  // Remove thousands separators and normalize decimal
  // European: 1.234,56 or 1 234,56
  // US/UK: 1,234.56
  if (/\d{1,3}\.\d{3},/.test(cleaned)) {
    // European with comma decimal: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/\d{1,3}\.\d{3}$/.test(cleaned)) {
    // European thousands with no decimal: 76.543 → 76543
    cleaned = cleaned.replace(/\./g, '');
  } else if (/\d{1,3},\d{3}[.]/.test(cleaned)) {
    // US: commas are thousands, dot is decimal
    cleaned = cleaned.replace(/,/g, '');
  } else if (/\d{1,3},\d{3}$/.test(cleaned)) {
    // US thousands with no decimal: 45,200 → 45200
    cleaned = cleaned.replace(/,/g, '');
  } else if (/\d+,\d{1,2}$/.test(cleaned)) {
    // European decimal with no thousands: 123,45
    cleaned = cleaned.replace(',', '.');
  } else {
    // US/plain: just remove commas
    cleaned = cleaned.replace(/,/g, '');
  }

  // Remove spaces used as thousands separators
  cleaned = cleaned.replace(/\s/g, '');

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Known unit patterns and their canonical forms */
const UNIT_MAP: [RegExp, string][] = [
  [/\bkwh\b/i, 'kWh'],
  [/\bmwh\b/i, 'MWh'],
  [/\bgwh\b/i, 'GWh'],
  [/m[³3]/i, 'm3'],
  [/\bliters?\b/i, 'L'],
  [/\blitres?\b/i, 'L'],
  [/\bkg\b/i, 'kg'],
  [/\btonnes?\b/i, 'tonnes'],
  [/\btons?\b/i, 'tonnes'],
  [/\btco2e?\b/i, 'tCO2e'],
  [/%/, '%'],
  [/\bpercent\b/i, '%'],
];

/** Detect unit from text near a number */
export function detectUnit(text: string): string | null {
  for (const [pattern, canonical] of UNIT_MAP) {
    if (pattern.test(text)) return canonical;
  }
  return null;
}

/** Convert a value from one unit to canonical */
export function convertToCanonical(value: number, fromUnit: string, toUnit: string): number {
  const key = `${fromUnit.toLowerCase()}->${toUnit.toLowerCase()}`;
  switch (key) {
    case 'mwh->kwh': return value * 1000;
    case 'gwh->kwh': return value * 1000000;
    case 'm3->kwh': return value * 10.55; // natural gas: 1 m³ ≈ 10.55 kWh
    case 'tonnes->kg': return value * 1000;
    case 'tons->kg': return value * 1000;
    default: return value;
  }
}

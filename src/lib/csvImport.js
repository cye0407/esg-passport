/**
 * CSV import helpers — locale-aware number parsing and lenient period parsing.
 *
 * The Passport's target market includes German Mittelstand suppliers, who
 * export from Excel using European number formats (1.234,56) and various
 * date formats. Naive parseFloat silently corrupts these values, so the
 * import flow detects the format from sample data and lets the user
 * confirm before committing anything to storage.
 */

/**
 * Detect whether a set of sample number strings looks European (1.234,56)
 * or US (1,234.56). Returns 'eu' or 'us'. Defaults to 'us' when ambiguous.
 */
export function detectNumberFormat(samples) {
  let eu = 0;
  let us = 0;
  for (const raw of samples) {
    if (raw === null || raw === undefined) continue;
    const s = String(raw).trim();
    if (!s) continue;
    // Strong signals: thousands separator AND decimal separator
    if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(s)) eu += 2;
    else if (/^-?\d{1,3}(,\d{3})+\.\d+$/.test(s)) us += 2;
    // Weak signals: only one separator
    else if (/^-?\d+,\d{1,2}$/.test(s)) eu += 1;
    else if (/^-?\d+\.\d{1,2}$/.test(s)) us += 1;
  }
  return eu > us ? 'eu' : 'us';
}

/**
 * Parse a number string under the given format. Returns null on failure
 * (NEVER NaN — caller should treat null as "skip this cell").
 */
export function parseNumber(raw, format = 'us') {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const cleaned = format === 'eu'
    ? s.replace(/\./g, '').replace(',', '.')
    : s.replace(/,/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

const MONTH_NAMES = {
  jan: '01', january: '01', januar: '01',
  feb: '02', february: '02', februar: '02',
  mar: '03', march: '03', mär: '03', märz: '03', mrz: '03',
  apr: '04', april: '04',
  may: '05', mai: '05',
  jun: '06', june: '06', juni: '06',
  jul: '07', july: '07', juli: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', okt: '10', october: '10', oktober: '10',
  nov: '11', november: '11',
  dec: '12', dez: '12', december: '12', dezember: '12',
};

/**
 * Parse various period formats into 'YYYY-MM'. Returns null if unrecognised.
 * Accepted: 2025-01, 2025-1, 01/2025, 1/2025, 2025/01, Jan 2025,
 * January 2025, Mär 2025, 2025-Jan, etc.
 */
export function parsePeriod(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}`;

  m = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, '0')}`;

  m = s.match(/^(\d{4})\/(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}`;

  m = s.match(/^([a-zA-ZäöüÄÖÜ]+)[\s.\-]+(\d{4})$/);
  if (m) {
    const mo = MONTH_NAMES[m[1].toLowerCase()];
    if (mo) return `${m[2]}-${mo}`;
  }

  m = s.match(/^(\d{4})[\s.\-]+([a-zA-ZäöüÄÖÜ]+)$/);
  if (m) {
    const mo = MONTH_NAMES[m[2].toLowerCase()];
    if (mo) return `${m[1]}-${mo}`;
  }

  return null;
}

/**
 * Build the column-to-field mapping from a header row. Same synonyms as the
 * old inline mapping, kept here so the Data page stays focused on rendering.
 */
export function buildColumnMap(headers) {
  const lower = headers.map(h => String(h || '').trim().toLowerCase());
  const find = (...terms) => lower.findIndex(h => terms.some(t => h.includes(t)));
  return {
    electricityKwh: { col: find('electricity'), section: 'energy' },
    naturalGasKwh: { col: find('natural gas', 'gas (kwh)'), section: 'energy' },
    vehicleFuelLiters: { col: find('vehicle fuel', 'fuel (l)', 'diesel'), section: 'energy' },
    renewablePercent: { col: find('renewable'), section: 'energy' },
    consumptionM3: { col: find('water'), section: 'water' },
    totalKg: { col: find('total waste', 'waste (kg)'), section: 'waste' },
    recycledKg: { col: find('recycled'), section: 'waste' },
    hazardousKg: { col: find('hazardous'), section: 'waste' },
    totalEmployees: { col: find('employee', 'fte', 'headcount'), section: 'workforce' },
    femaleEmployees: { col: find('female'), section: 'workforce' },
    maleEmployees: { col: lower.findIndex(h => h.includes('male') && !h.includes('female')), section: 'workforce' },
    workAccidents: { col: find('accident', 'incident', 'injury'), section: 'healthSafety' },
    trainingHours: { col: find('training'), section: 'training' },
  };
}

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
 * Build the column-to-field mapping from a header row.
 *
 * Synonyms cover EN, DE, PL, FR, ES, IT, NL — the target markets for the
 * Passport. A German user exporting their DATEV/Lexware bookkeeping CSV will
 * have headers like "Strom" or "Wasser" rather than "Electricity"; without
 * these aliases, the importer silently misses every column.
 *
 * Match is `String.includes`, case-insensitive, so partial headers like
 * "Stromverbrauch (kWh)" still match the "strom" alias.
 */
export function buildColumnMap(headers) {
  const lower = headers.map(h => String(h || '').trim().toLowerCase());
  const find = (...terms) => lower.findIndex(h => terms.some(t => h.includes(t)));
  // For "male" we must avoid matching "female" — same trick across all languages
  const findMaleNotFemale = (...terms) =>
    lower.findIndex(h => terms.some(t => h.includes(t)) && !h.includes('female') && !h.includes('weiblich') && !h.includes('kobiet') && !h.includes('femme') && !h.includes('mujer') && !h.includes('donn') && !h.includes('vrouw'));

  return {
    // Energy
    electricityKwh: {
      col: find('electricity', 'strom', 'elektrizität', 'energia elektryczna', 'prąd', 'électricité', 'electricidad', 'elettricità', 'elektriciteit'),
      section: 'energy',
    },
    naturalGasKwh: {
      col: find('natural gas', 'gas (kwh)', 'erdgas', 'gaz ziemny', 'gaz naturel', 'gas natural', 'gas naturale', 'aardgas'),
      section: 'energy',
    },
    vehicleFuelLiters: {
      col: find('vehicle fuel', 'fuel (l)', 'diesel', 'kraftstoff', 'paliwo', 'carburant', 'combustible', 'carburante', 'brandstof'),
      section: 'energy',
    },
    renewablePercent: {
      col: find('renewable', 'erneuerbar', 'odnawialn', 'renouvelable', 'renovable', 'rinnovabil', 'hernieuwbaar'),
      section: 'energy',
    },

    // Water
    consumptionM3: {
      col: find('water', 'wasser', 'woda', 'eau', 'agua', 'acqua'),
      section: 'water',
    },

    // Waste
    totalKg: {
      col: find('total waste', 'waste (kg)', 'abfall', 'odpad', 'déchets', 'residuos', 'rifiuti', 'afval'),
      section: 'waste',
    },
    recycledKg: {
      col: find('recycled', 'recycelt', 'recykling', 'recyclé', 'reciclado', 'riciclat', 'gerecycl'),
      section: 'waste',
    },
    hazardousKg: {
      col: find('hazardous', 'gefährlich', 'sondermüll', 'niebezpieczn', 'dangereux', 'peligroso', 'pericolos', 'gevaarlijk'),
      section: 'waste',
    },

    // Workforce
    totalEmployees: {
      col: find('employee', 'fte', 'headcount', 'mitarbeiter', 'beschäftigt', 'pracownik', 'zatrudni', 'employé', 'salarié', 'empleado', 'dipendent', 'medewerker', 'personeel'),
      section: 'workforce',
    },
    femaleEmployees: {
      col: find('female', 'weiblich', 'frauen', 'kobiet', 'femme', 'mujer', 'donn', 'vrouw'),
      section: 'workforce',
    },
    maleEmployees: {
      col: findMaleNotFemale('male', 'männlich', 'männer', 'mężcz', 'homme', 'hombre', 'uomo'),
      section: 'workforce',
    },

    // Health & Safety
    recordableIncidents: {
      col: find('recordable', 'accident', 'incident', 'injury', 'unfall', 'verletz', 'wypadek', 'urazy', 'blessure', 'accidente', 'lesión', 'infortun', 'ongeval', 'letsel'),
      section: 'healthSafety',
    },
    lostTimeIncidents: {
      col: find('lost time', 'lost-time', 'ausfallzeit', 'arbeitsausfall', 'utracon', 'temps perdu', 'tiempo perdido', 'tempo perso', 'verlette tijd'),
      section: 'healthSafety',
    },
    fatalities: {
      col: find('fatalit', 'todesfäll', 'todesfall', 'śmierteln', 'décès', 'mortels', 'mortalidad', 'fallecid', 'mortale', 'doden', 'overled'),
      section: 'healthSafety',
    },
    hoursWorked: {
      col: find('hours worked', 'arbeitsstunden', 'godziny prac', 'heures travaillées', 'horas trabajadas', 'ore lavorate', 'gewerkte uren'),
      section: 'healthSafety',
    },

    // Training
    trainingHours: {
      col: find('training', 'schulung', 'fortbildung', 'szkoleni', 'formation', 'formación', 'formazione', 'opleiding'),
      section: 'training',
    },

    // Social metrics
    turnoverRate: {
      col: find('turnover rate', 'turnover %', 'attrition', 'fluktuation', 'fluktuationsrate', 'rotacja', 'rotation', 'rotación', 'tasso di rotazione', 'verloop'),
      section: 'workforce',
    },
    womenInLeadershipPercent: {
      col: find('women in leadership', 'women in management', 'female leadership', 'frauen in führung', 'kobiety w zarząd', 'femmes dirigeantes', 'mujeres directivas', 'donne dirigenti', 'vrouwen in leiding'),
      section: 'workforce',
    },
    collectiveBargainingPercent: {
      col: find('collective bargaining', 'bargaining coverage', 'tarifbindung', 'tarifvertrag', 'układ zbiorowy', 'convention collective', 'convenio colectivo', 'contratto collettivo', 'cao'),
      section: 'workforce',
    },
    grievancesReported: {
      col: find('grievance', 'complaint', 'beschwerde', 'skarga', 'réclamation', 'queja', 'reclamo', 'klacht'),
      section: 'workforce',
    },
  };
}

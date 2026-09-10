import { EXTRACT_FIELD_MAP } from './extractFieldMap';
import { extractionAssignments } from './extractionWrite';

// A document that carries a year but no month is staged for confirmation rather than
// applied, because switching to annual entry overwrites that year. Several such
// documents can be dropped at once, and the staging used to be a single slot — so each
// one overwrote the last and only the final document was ever applied.
//
// Annual values are held for the SELECTED year and distributed across its months on
// save, so a year is the unit of work: everything staged for one year is confirmed and
// applied together, and other years wait their turn.
//
// Pure, and separate from the page, because this is where the data loss was.

/**
 * @param {Array<{year: number, fields: Array, fileName: string}>} pending
 * @returns {{year: number|null, bills: Array, conflicts: string[], remaining: number}}
 */
export function groupAnnualBills(pending) {
  const list = Array.isArray(pending) ? pending : [];
  if (list.length === 0) return { year: null, bills: [], conflicts: [], remaining: 0 };

  const year = list[0].year;
  const bills = list.filter(bill => bill.year === year);

  // Two documents reporting the same figure for the same year is ambiguous. We apply the
  // later one, which is a choice, so it has to be a stated one rather than a silent one.
  const seen = new Set();
  const conflicts = [];
  for (const bill of bills) {
    for (const field of bill.fields || []) {
      const mapping = EXTRACT_FIELD_MAP[field.field];
      if (!mapping) continue;
      const key = `${mapping.section}.${mapping.field}`;
      if (seen.has(key) && !conflicts.includes(field.field)) conflicts.push(field.field);
      seen.add(key);
    }
  }

  return { year, bills, conflicts, remaining: list.length - bills.length };
}

/**
 * The annual values a batch writes, as `section.field` → string. Later documents win,
 * which is what `conflicts` above warns about.
 */
export function mergeAnnualValues(bills) {
  const values = {};
  for (const bill of bills || []) {
    for (const assignment of extractionAssignments(bill.fields)) {
      values[assignment.key] = String(assignment.value);
    }
  }
  return values;
}

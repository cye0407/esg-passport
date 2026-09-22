import { EXTRACT_FIELD_MAP } from './extractFieldMap';

// Turning a reviewed document into workspace records, without the two lies the naive
// write told: that whichever fuel came last was the only fuel, and that a document
// covering a quarter describes a single month.
//
// The additive/snapshot split is NOT a new rule. `getAnnualTotals` in store.js is the
// authority on how a year is rebuilt from months — `sum()` for quantities, `avg()` or
// `last()` for rates and headcounts — and this table is the inverse of that aggregation,
// so a value split across months re-totals to the figure the document stated. A metric
// listed here is a snapshot (repeated into every covered month); anything else is a
// quantity (shared across them). extractionWrite.test.js locks the two together.
const SNAPSHOT_METRICS = new Set([
  'energy.renewablePercent',   // avg()
  'waste.recyclingRate',       // avg()
  'workforce.totalEmployees',  // last()
  'workforce.femaleEmployees', // last()
  'workforce.maleEmployees',   // last()
  'workforce.turnoverRate',    // avg()
]);

// Two extractor fields can legitimately mean one workspace metric: a fleet report states
// diesel and petrol separately, the workspace holds total vehicle fuel. Writing them as a
// sequence of assignments silently dropped whichever arrived first — the tank that was
// reported first simply vanished. These are added instead.
const ADDITIVE_COLLISIONS = new Set([
  'energy.vehicleFuelLiters',
]);

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Round the way the annual entry mode rounds a distributed value: two decimal places. */
function round2(value) {
  return Math.round(value * 100) / 100;
}

export function isSnapshotMetric(section, field) {
  return SNAPSHOT_METRICS.has(`${section}.${field}`);
}

/**
 * The reviewed fields as one unambiguous write per workspace metric. Collisions that are
 * genuinely additive are summed; anything else keeps the last value, which is the existing
 * behaviour and the one `groupAnnualBills` already warns about.
 *
 * @returns {Array<{section: string, field: string, key: string, value: number, inputFields: string[]}>}
 */
export function extractionAssignments(fields) {
  const assignments = new Map();

  for (const item of Array.isArray(fields) ? fields : []) {
    const mapping = EXTRACT_FIELD_MAP[item?.field];
    if (!mapping) continue;
    const value = typeof item.value === 'number' ? item.value : Number.parseFloat(item.value);
    if (!Number.isFinite(value)) continue;

    const key = `${mapping.section}.${mapping.field}`;
    const previous = assignments.get(key);
    // Only a DIFFERENT extractor field adds to the running total. The same field twice in
    // one document is a restatement of one figure, not two tanks.
    const isNewInput = previous && !previous.inputFields.includes(item.field);
    const value2 = previous && isNewInput && ADDITIVE_COLLISIONS.has(key)
      ? previous.value + value
      : value;

    assignments.set(key, {
      section: mapping.section,
      field: mapping.field,
      key,
      value: value2,
      inputFields: [...new Set([...(previous?.inputFields || []), item.field])],
    });
  }

  return [...assignments.values()];
}

/**
 * Spread one document across every month it actually covers.
 *
 * Returns [] when the document covers fewer than two months — there is nothing to spread,
 * and the caller keeps its existing single-period behaviour.
 *
 * @param {Array} fields reviewed extractor fields
 * @param {string[]} coveredMonths YYYY-MM periods the document reports on
 * @returns {Array<{period: string, assignments: Array}>}
 */
export function allocateExtraction(fields, coveredMonths) {
  const months = [...new Set((coveredMonths || []).filter(period => PERIOD_PATTERN.test(period)))].sort();
  if (months.length < 2) return [];

  const assignments = extractionAssignments(fields);
  if (!assignments.length) return [];

  return months.map(period => ({
    period,
    assignments: assignments.map(assignment => ({
      ...assignment,
      value: isSnapshotMetric(assignment.section, assignment.field)
        ? assignment.value
        : round2(assignment.value / months.length),
    })),
  }));
}

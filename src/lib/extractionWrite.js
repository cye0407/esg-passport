import { EXTRACT_FIELD_MAP } from './extractFieldMap';

// Several extractor fields can legitimately feed one Passport metric. In particular,
// diesel and petrol are separate figures in a fleet report but Passport stores total
// vehicle fuel. Treating the mapping as a sequence of assignments silently discarded
// whichever fuel appeared first.
const ADDITIVE_COLLISIONS = new Set([
  'energy.vehicleFuelLiters',
]);

const SNAPSHOT_METRICS = new Set([
  'energy.renewablePercent',
  'waste.recyclingRate',
  'workforce.totalEmployees',
  'workforce.femaleEmployees',
  'workforce.maleEmployees',
  'workforce.turnoverRate',
]);

/** Convert reviewed extractor fields into one unambiguous write per Passport metric. */
export function extractionAssignments(fields) {
  const assignments = new Map();

  for (const item of Array.isArray(fields) ? fields : []) {
    const mapping = EXTRACT_FIELD_MAP[item?.field];
    if (!mapping) continue;
    const value = typeof item.value === 'number' ? item.value : Number.parseFloat(item.value);
    if (!Number.isFinite(value)) continue;

    const key = `${mapping.section}.${mapping.field}`;
    const previous = assignments.get(key);
    const distinctInputs = previous && !previous.inputFields.includes(item.field);
    const nextValue = previous && distinctInputs && ADDITIVE_COLLISIONS.has(key)
      ? previous.value + value
      : value;

    assignments.set(key, {
      ...mapping,
      key,
      value: nextValue,
      inputFields: [...new Set([...(previous?.inputFields || []), item.field])],
    });
  }

  return [...assignments.values()];
}

/**
 * Allocate a multi-month document without pretending its total occurred in month one.
 * Additive totals are shared equally; rates and headcounts are repeated as snapshots.
 */
export function allocateExtraction(fields, coveredMonths) {
  const assignments = extractionAssignments(fields);
  const months = [...new Set((coveredMonths || []).filter(period => /^\d{4}-(0[1-9]|1[0-2])$/.test(period)))];
  if (months.length < 2) return [];
  return months.map(period => ({
    period,
    assignments: assignments.map(assignment => ({
      ...assignment,
      value: SNAPSHOT_METRICS.has(assignment.key)
        ? assignment.value
        : assignment.value / months.length,
    })),
  }));
}

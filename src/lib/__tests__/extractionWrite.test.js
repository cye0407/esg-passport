import { describe, it, expect, beforeEach } from 'vitest';
import { extractionAssignments, allocateExtraction, isSnapshotMetric } from '../extractionWrite';
import { EXTRACT_FIELD_MAP } from '../extractFieldMap';
import { resetData, saveDataRecord, getAnnualTotals } from '../store';

beforeEach(() => {
  resetData();
});

describe('extractionAssignments', () => {
  it('adds the fuels that share one workspace metric instead of dropping one', () => {
    const [fuel] = extractionAssignments([
      { field: 'dieselLiters', value: 1200 },
      { field: 'petrolLiters', value: 300 },
    ]);
    expect(fuel.key).toBe('energy.vehicleFuelLiters');
    expect(fuel.value).toBe(1500);
    expect(fuel.inputFields).toEqual(['dieselLiters', 'petrolLiters']);
  });

  it('treats the same field twice as one restated figure, not two tanks', () => {
    const [fuel] = extractionAssignments([
      { field: 'dieselLiters', value: 1200 },
      { field: 'dieselLiters', value: 1250 },
    ]);
    expect(fuel.value).toBe(1250);
  });

  it('keeps the last value for a collision that is not additive', () => {
    const [employees] = extractionAssignments([
      { field: 'totalEmployees', value: 120 },
      { field: 'totalEmployees', value: 124 },
    ]);
    expect(employees.value).toBe(124);
  });

  it('skips fields with no mapping and values that are not numbers', () => {
    expect(extractionAssignments([
      { field: 'invoiceNumber', value: 'INV-2025-04' },
      { field: 'electricityKwh', value: 'not a number' },
      { field: 'electricityKwh', value: '4200' },
    ])).toEqual([
      expect.objectContaining({ key: 'energy.electricityKwh', value: 4200 }),
    ]);
  });
});

describe('allocateExtraction', () => {
  const QUARTER = ['2025-01', '2025-02', '2025-03'];

  it('shares a quantity across the months the document covers', () => {
    const allocated = allocateExtraction([{ field: 'electricityKwh', value: 9000 }], QUARTER);
    expect(allocated.map(a => a.period)).toEqual(QUARTER);
    for (const month of allocated) {
      expect(month.assignments[0]).toMatchObject({ key: 'energy.electricityKwh', value: 3000 });
    }
    // The split re-totals to what the document actually said.
    const total = allocated.reduce((sum, month) => sum + month.assignments[0].value, 0);
    expect(total).toBe(9000);
  });

  it('repeats a rate or a headcount rather than splitting it into nonsense', () => {
    const allocated = allocateExtraction([
      { field: 'renewablePercent', value: 48 },
      { field: 'totalEmployees', value: 128 },
    ], QUARTER);
    for (const month of allocated) {
      expect(month.assignments.find(a => a.key === 'energy.renewablePercent').value).toBe(48);
      expect(month.assignments.find(a => a.key === 'workforce.totalEmployees').value).toBe(128);
    }
  });

  it('rounds a split quantity to two decimals, as annual entry mode does', () => {
    const [first] = allocateExtraction([{ field: 'electricityKwh', value: 1000 }], QUARTER);
    expect(first.assignments[0].value).toBe(333.33);
  });

  it('leaves a single-month or unknown period to the caller', () => {
    expect(allocateExtraction([{ field: 'electricityKwh', value: 100 }], ['2025-01'])).toEqual([]);
    expect(allocateExtraction([{ field: 'electricityKwh', value: 100 }], [])).toEqual([]);
    expect(allocateExtraction([{ field: 'electricityKwh', value: 100 }], undefined)).toEqual([]);
    expect(allocateExtraction([{ field: 'electricityKwh', value: 100 }], ['2025', 'nonsense'])).toEqual([]);
  });

  it('sorts the covered months and ignores duplicates', () => {
    const allocated = allocateExtraction(
      [{ field: 'electricityKwh', value: 100 }],
      ['2025-03', '2025-01', '2025-03'],
    );
    expect(allocated.map(a => a.period)).toEqual(['2025-01', '2025-03']);
  });
});

// The split is only honest if it is the inverse of how a year is put back together.
// getAnnualTotals is the authority on that, so this asks it directly for every metric the
// extractor can write: seed the same figure in two months, and see whether the year sums
// them (a quantity, which must be split) or reports the figure once (a snapshot, which
// must be repeated).
describe('the snapshot table matches how getAnnualTotals rebuilds a year', () => {
  const TOTALS_KEY = {
    'energy.electricityKwh': 'electricityKwh',
    'energy.naturalGasKwh': 'naturalGasKwh',
    'energy.renewablePercent': 'renewablePercent',
    'energy.vehicleFuelLiters': 'vehicleFuelLiters',
    'water.consumptionM3': 'waterM3',
    'waste.totalKg': 'totalWasteKg',
    'waste.hazardousKg': 'hazardousWasteKg',
    'waste.recycledKg': 'recycledWasteKg',
    'waste.recyclingRate': 'recyclingRate',
    'workforce.totalEmployees': 'totalEmployees',
    'workforce.femaleEmployees': 'femaleEmployees',
    'workforce.maleEmployees': 'maleEmployees',
    'workforce.newHires': 'newHires',
    'workforce.turnoverRate': 'turnoverRate',
    'workforce.departures': 'departures',
    'training.trainingHours': 'trainingHours',
    'healthSafety.recordableIncidents': 'recordableIncidents',
    'healthSafety.lostTimeIncidents': 'lostTimeIncidents',
    'healthSafety.hoursWorked': 'hoursWorked',
  };

  const targets = [...new Set(Object.values(EXTRACT_FIELD_MAP).map(m => `${m.section}.${m.field}`))];

  it('covers every metric the extractor can write', () => {
    expect(targets.filter(key => !TOTALS_KEY[key])).toEqual([]);
  });

  it.each(targets)('%s', (key) => {
    const [section, field] = key.split('.');
    const value = 40;
    resetData();
    saveDataRecord({ period: '2025-01', [section]: { [field]: value } });
    saveDataRecord({ period: '2025-02', [section]: { [field]: value } });

    const annual = getAnnualTotals('2025')[TOTALS_KEY[key]];
    // Summed across the two months → a quantity. Reported once → a snapshot.
    const aggregatedBySumming = annual === value * 2;
    expect(annual).toBe(aggregatedBySumming ? value * 2 : value);
    expect(isSnapshotMetric(section, field)).toBe(!aggregatedBySumming);
  });
});

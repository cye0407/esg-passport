import { describe, expect, it } from 'vitest';
import { EXTRACT_FIELD_MAP } from '../extractFieldMap';
import { allocateExtraction, extractionAssignments } from '../extractionWrite';
import { mergeAnnualValues } from '../annualBills';

describe('reviewed extraction writes', () => {
  it.each(Object.keys(EXTRACT_FIELD_MAP))('keeps the supported %s field', field => {
    const [assignment] = extractionAssignments([{ field, value: 12 }]);
    expect(assignment).toMatchObject({ ...EXTRACT_FIELD_MAP[field], value: 12 });
  });

  it('keeps a real zero rather than treating it as missing', () => {
    expect(extractionAssignments([{ field: 'recordableIncidents', value: 0 }])[0].value).toBe(0);
  });

  it('drops unsupported and non-numeric values instead of polluting the store', () => {
    expect(extractionAssignments([
      { field: 'unknownMetric', value: 10 },
      { field: 'waterM3', value: 'not known' },
    ])).toEqual([]);
  });

  it('adds diesel and petrol when both feed total vehicle fuel', () => {
    expect(extractionAssignments([
      { field: 'dieselLiters', value: 120 },
      { field: 'petrolLiters', value: 30 },
    ])).toEqual([{
      section: 'energy',
      field: 'vehicleFuelLiters',
      key: 'energy.vehicleFuelLiters',
      value: 150,
      inputFields: ['dieselLiters', 'petrolLiters'],
    }]);
  });

  it('also preserves both fuels in an annual extraction', () => {
    expect(mergeAnnualValues([{
      fields: [
        { field: 'dieselLiters', value: 120 },
        { field: 'petrolLiters', value: 30 },
      ],
    }])).toEqual({ 'energy.vehicleFuelLiters': '150' });
  });

  it('uses the reviewed final value if one extractor field is duplicated', () => {
    expect(extractionAssignments([
      { field: 'waterM3', value: 100 },
      { field: 'waterM3', value: 110 },
    ])[0].value).toBe(110);
  });

  it('allocates a quarterly total across all covered months', () => {
    const writes = allocateExtraction([{ field: 'waterM3', value: 2200 }], [
      '2025-01', '2025-02', '2025-03',
    ]);
    expect(writes.map(write => write.period)).toEqual(['2025-01', '2025-02', '2025-03']);
    expect(writes.reduce((sum, write) => sum + write.assignments[0].value, 0)).toBeCloseTo(2200);
  });

  it('repeats quarterly snapshots rather than dividing them', () => {
    const writes = allocateExtraction([{ field: 'totalEmployees', value: 90 }], [
      '2025-01', '2025-02', '2025-03',
    ]);
    expect(writes.map(write => write.assignments[0].value)).toEqual([90, 90, 90]);
  });

  it('refuses malformed coverage metadata', () => {
    expect(allocateExtraction([{ field: 'waterM3', value: 2200 }], ['2025-01', 'Q1'])).toEqual([]);
  });
});

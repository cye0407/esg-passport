import { describe, expect, it } from 'vitest';
import { groupAnnualBills, mergeAnnualValues } from '../annualBills';

const bill = (year, fileName, fields) => ({
  year,
  fileName,
  fields: fields.map(([field, value]) => ({ field, value })),
});

describe('groupAnnualBills', () => {
  // The reported bug: three bills for a past year, one applied, two silently lost —
  // because staging was a single slot and each document overwrote the last.
  it('keeps every document dropped for the same year', () => {
    const batch = groupAnnualBills([
      bill(2024, 'electricity.pdf', [['electricityKwh', 42000]]),
      bill(2024, 'water.pdf', [['waterM3', 3100]]),
      bill(2024, 'waste.pdf', [['totalWasteKg', 82000]]),
    ]);
    expect(batch.year).toBe(2024);
    expect(batch.bills.map(b => b.fileName)).toEqual([
      'electricity.pdf', 'water.pdf', 'waste.pdf',
    ]);
    expect(batch.remaining).toBe(0);
  });

  // Annual values belong to the selected year, so a year is the unit of work. Documents
  // for another year wait rather than being dropped or merged into the wrong one.
  it('confirms one year at a time and keeps the rest waiting', () => {
    const batch = groupAnnualBills([
      bill(2024, 'a.pdf', [['electricityKwh', 1]]),
      bill(2023, 'b.pdf', [['electricityKwh', 2]]),
      bill(2024, 'c.pdf', [['waterM3', 3]]),
    ]);
    expect(batch.year).toBe(2024);
    expect(batch.bills).toHaveLength(2);
    expect(batch.remaining).toBe(1);
  });

  it('names a figure two documents both report, rather than choosing in silence', () => {
    const batch = groupAnnualBills([
      bill(2024, 'q1-q2.pdf', [['electricityKwh', 20000]]),
      bill(2024, 'q3-q4.pdf', [['electricityKwh', 22000], ['waterM3', 3100]]),
    ]);
    expect(batch.conflicts).toEqual(['electricityKwh']);
  });

  it('says nothing when the documents cover different figures', () => {
    const batch = groupAnnualBills([
      bill(2024, 'a.pdf', [['electricityKwh', 1]]),
      bill(2024, 'b.pdf', [['waterM3', 2]]),
    ]);
    expect(batch.conflicts).toEqual([]);
  });

  it('ignores fields the workspace cannot store rather than reporting a phantom clash', () => {
    const batch = groupAnnualBills([
      bill(2024, 'a.pdf', [['somethingUnmapped', 1]]),
      bill(2024, 'b.pdf', [['somethingUnmapped', 2]]),
    ]);
    expect(batch.conflicts).toEqual([]);
  });

  it('handles nothing staged', () => {
    expect(groupAnnualBills([])).toEqual({ year: null, bills: [], conflicts: [], remaining: 0 });
    expect(groupAnnualBills(null).year).toBeNull();
  });
});

describe('mergeAnnualValues', () => {
  it('writes every document in the batch, not just the last one', () => {
    const values = mergeAnnualValues([
      bill(2024, 'electricity.pdf', [['electricityKwh', 42000]]),
      bill(2024, 'water.pdf', [['waterM3', 3100]]),
      bill(2024, 'waste.pdf', [['totalWasteKg', 82000], ['hazardousWasteKg', 400]]),
    ]);
    expect(values).toEqual({
      'energy.electricityKwh': '42000',
      'water.consumptionM3': '3100',
      'waste.totalKg': '82000',
      'waste.hazardousKg': '400',
    });
  });

  it('lets the later document win, which is what the conflict warning is about', () => {
    const values = mergeAnnualValues([
      bill(2024, 'a.pdf', [['electricityKwh', 20000]]),
      bill(2024, 'b.pdf', [['electricityKwh', 22000]]),
    ]);
    expect(values['energy.electricityKwh']).toBe('22000');
  });

  it('keeps a recorded zero and drops what is not a number', () => {
    const values = mergeAnnualValues([
      bill(2024, 'a.pdf', [['hazardousWasteKg', 0], ['waterM3', 'not a number']]),
    ]);
    expect(values['waste.hazardousKg']).toBe('0');
    expect(values['water.consumptionM3']).toBeUndefined();
  });
});

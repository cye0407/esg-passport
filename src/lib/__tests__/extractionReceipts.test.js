import { beforeEach, describe, expect, it } from 'vitest';
import { getExtractionReceipts, saveExtractionReceipt } from '../store';

describe('extraction receipts', () => {
  beforeEach(() => localStorage.clear());

  it('keeps a local record of accepted values and their destination', () => {
    saveExtractionReceipt({
      fileName: 'fleet-2025.csv',
      sourcePeriod: '2025',
      savedPeriod: '2025',
      annual: true,
      allocationMonths: 12,
      fields: [{ field: 'dieselLiters', value: 36680, unit: 'L', sourceText: 'not retained' }],
    });

    expect(getExtractionReceipts()).toEqual([
      expect.objectContaining({
        fileName: 'fleet-2025.csv',
        sourcePeriod: '2025',
        savedPeriod: '2025',
        annual: true,
        allocationMonths: 12,
        fields: [{ field: 'dieselLiters', value: 36680, unit: 'L' }],
      }),
    ]);
    expect(JSON.stringify(getExtractionReceipts())).not.toContain('not retained');
  });

  it('does not create a success record when there are no storable numeric values', () => {
    expect(saveExtractionReceipt({ fileName: 'empty.pdf', fields: [] })).toBeNull();
    expect(getExtractionReceipts()).toEqual([]);
  });

  it('bounds the history so document metadata cannot grow forever', () => {
    for (let i = 0; i < 35; i += 1) {
      saveExtractionReceipt({ fileName: `${i}.pdf`, fields: [{ field: 'waterM3', value: i, unit: 'm3' }] });
    }
    expect(getExtractionReceipts()).toHaveLength(30);
    expect(getExtractionReceipts()[0].fileName).toBe('34.pdf');
  });
});

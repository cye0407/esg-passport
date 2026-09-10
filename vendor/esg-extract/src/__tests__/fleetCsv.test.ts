import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { extractFleetCsv } from '../extractors/fleetCsv';

describe('fleet CSV extraction', () => {
  it('extracts the committed ARAL annual export from the litres column', () => {
    const path = join(process.cwd(), 'testing', 'sme-stress-stack', 'clean', 'fleet-aral-2025.csv');
    const result = extractFleetCsv(readFileSync(path, 'utf8'));
    expect(result.success).toBe(true);
    expect(result.provider).toBe('ARAL');
    expect(result.period).toBe('2025');
    expect(result.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'dieselLiters', value: 36680, unit: 'L', confidence: 'high' }),
    ]));
    expect(result.fields[0].reasons).toContain('Summed 174 rows from the litres column');
  });

  it('rejects incomplete multi-month exports instead of calling them annual', () => {
    const result = extractFleetCsv('Datum;Liter\n2025-01-01;10\n2025-02-01;20');
    expect(result.success).toBe(false);
    expect(result.fields).toHaveLength(0);
    expect(result.warnings[0]).toContain('covers 2 months');
  });
});

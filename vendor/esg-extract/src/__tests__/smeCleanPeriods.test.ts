import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { extractFromPdf } from '../extractors/registry';

const CLEAN = join(process.cwd(), 'testing', 'sme-stress-stack', 'clean');

describe('SME clean-stack periods through the real extractor', () => {
  it('does not classify monthly electricity bills as annual data', async () => {
    const files = [
      'elec-stadtwerke-01.pdf',
      'elec-stadtwerke-02.pdf',
      'elec-eon-03.pdf',
      ...Array.from({ length: 9 }, (_, index) => `elec-stadtwerke-${String(index + 4).padStart(2, '0')}.pdf`),
    ];

    for (let index = 0; index < files.length; index += 1) {
      const result = await extractFromPdf(readFileSync(join(CLEAN, files[index])));
      expect(result.period, files[index]).toBe(`2025-${String(index + 1).padStart(2, '0')}`);
      expect(result.fields.every(field => field.period === result.period), files[index]).toBe(true);
    }
  });

  it('assigns quarterly gas bills to their starting month instead of annual data', async () => {
    const expected = [
      ['gas-stadtwerke-q1.pdf', '2025-01'],
      ['gas-stadtwerke-q2.pdf', '2025-04'],
      ['gas-stadtwerke-q3.pdf', '2025-07'],
      ['gas-stadtwerke-q4.pdf', '2025-10'],
    ];

    for (const [file, period] of expected) {
      const result = await extractFromPdf(readFileSync(join(CLEAN, file)));
      expect(result.period, file).toBe(period);
    }
  });
});

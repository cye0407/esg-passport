import { describe, expect, it } from 'vitest';
import { INDUSTRIES } from '../../lib/constants';
import { getIndustryMetrics, INDUSTRY_METRICS } from '../industry-metrics';

describe('industry metric packs', () => {
  it('has dedicated metrics for every selectable non-generic industry', () => {
    const intentionallyGeneric = new Set(['Other']);
    const missing = INDUSTRIES.filter((industry) => (
      !intentionallyGeneric.has(industry) && getIndustryMetrics(industry).length === 0
    ));

    expect(missing).toEqual([]);
  });

  it('does not reuse Manufacturing metrics for Agriculture or Mining', () => {
    const manufacturingFields = new Set(
      INDUSTRY_METRICS.Manufacturing.map((row) => `${row.section}.${row.field}`)
    );

    for (const industry of ['Agriculture & Farming', 'Mining & Metals']) {
      const fields = getIndustryMetrics(industry).map((row) => `${row.section}.${row.field}`);
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some((field) => manufacturingFields.has(field))).toBe(false);
    }
  });

  it('uses stable row metadata needed by Data page rendering and annual aggregation', () => {
    for (const [industry, rows] of Object.entries(INDUSTRY_METRICS)) {
      expect(rows.length, `${industry} should have rows`).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.section).toMatch(/^[a-z][a-zA-Z0-9]*$/);
        expect(row.field).toMatch(/^[a-z][a-zA-Z0-9]*$/);
        expect(row.label).toBeTruthy();
      }
    }
  });
});

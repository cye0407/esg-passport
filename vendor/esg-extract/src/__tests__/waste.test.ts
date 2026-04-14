import { describe, it, expect } from 'vitest';
import { extractFromText } from '../extractors/registry';
import { toPassportRecord } from '../output/passport';

const GERMAN_WASTE_MANIFEST = `
Remondis
Entsorgungsnachweis

Zeitraum: Januar 2025

Gesamtmenge: 18.500 kg
Sonderabfall: 1.200 kg
Wertstoff (Recycling): 12.400 kg
Verwertungsquote: 67%

Restmüll: 4.900 kg
Entsorgungsanlage: Thermische Verwertung Düsseldorf
`;

const ENGLISH_WASTE_REPORT = `
Veolia Environmental Services
Monthly Waste Collection Report

Period: February 2025
Site: Manufacturing Plant A

Total waste collected: 22.5 tonnes
Hazardous waste: 1.8 tonnes
Recycled material: 15.2 tonnes
Diversion rate: 67.6%

Waste streams:
- Mixed recyclables: 10.3 tonnes
- Metal scrap: 4.9 tonnes
- Hazardous chemicals: 1.8 tonnes
- General waste: 5.5 tonnes
`;

const FRENCH_WASTE_REPORT = `
Suez Recyclage et Valorisation
Bordereau de suivi des déchets

Période: Mars 2025

Total des déchets: 14.200 kg
Déchets dangereux: 850 kg
Matières recyclées: 9.100 kg
`;

const MINIMAL_WASTE = `
Waste disposal receipt
Total waste: 5000 kg
Date: April 2025
`;

describe('Waste extraction', () => {
  it('extracts from German waste manifest', () => {
    const result = extractFromText(GERMAN_WASTE_MANIFEST);
    expect(result.success).toBe(true);
    expect(result.documentType).toBe('waste_manifest');
    expect(result.provider).toBe('Remondis');

    const total = result.fields.find(f => f.field === 'totalWasteKg');
    expect(total).toBeDefined();
    expect(total!.value).toBe(18500);

    const haz = result.fields.find(f => f.field === 'hazardousWasteKg');
    expect(haz).toBeDefined();
    expect(haz!.value).toBe(1200);

    const recycled = result.fields.find(f => f.field === 'recycledWasteKg');
    expect(recycled).toBeDefined();
    expect(recycled!.value).toBe(12400);
  });

  it('extracts from English waste report with tonnes', () => {
    const result = extractFromText(ENGLISH_WASTE_REPORT);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('Veolia');

    const total = result.fields.find(f => f.field === 'totalWasteKg');
    expect(total).toBeDefined();
    expect(total!.value).toBe(22500); // 22.5 tonnes = 22,500 kg

    const haz = result.fields.find(f => f.field === 'hazardousWasteKg');
    expect(haz).toBeDefined();
    expect(haz!.value).toBe(1800); // 1.8 tonnes = 1,800 kg
  });

  it('extracts from French waste report', () => {
    const result = extractFromText(FRENCH_WASTE_REPORT);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('Suez');

    const total = result.fields.find(f => f.field === 'totalWasteKg');
    expect(total).toBeDefined();
    expect(total!.value).toBe(14200);
  });

  it('calculates recycling rate from totals', () => {
    const result = extractFromText(GERMAN_WASTE_MANIFEST);
    const rate = result.fields.find(f => f.field === 'recyclingRate');
    // The text has 67% explicitly, but also 12400/18500 = 67.03%
    expect(rate).toBeDefined();
    expect(rate!.value).toBeCloseTo(67, 0);
  });

  it('converts to Passport format', () => {
    const result = extractFromText(GERMAN_WASTE_MANIFEST);
    const record = toPassportRecord(result);
    expect(record.waste?.totalKg).toBe(18500);
    expect(record.waste?.hazardousKg).toBe(1200);
    expect(record.waste?.recycledKg).toBe(12400);
  });

  it('handles minimal waste data', () => {
    const result = extractFromText(MINIMAL_WASTE);
    expect(result.success).toBe(true);
    const total = result.fields.find(f => f.field === 'totalWasteKg');
    expect(total).toBeDefined();
    expect(total!.value).toBe(5000);
  });

  it('never fabricates — no fields from unrelated text', () => {
    const result = extractFromText('This is an electricity bill for 50,000 kWh.');
    expect(result.fields.find(f => f.field === 'totalWasteKg')).toBeUndefined();
    expect(result.fields.find(f => f.field === 'hazardousWasteKg')).toBeUndefined();
  });
});

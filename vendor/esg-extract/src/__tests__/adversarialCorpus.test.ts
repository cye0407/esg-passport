import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractFromPdf, extractFromText } from '../extractors/registry';
import { toPassportRecord } from '../output/passport';

const DEMOS = resolve('testing/demo-bills');
const read = (name: string) => readFileSync(resolve(DEMOS, name), 'utf8');

describe('complete demo corpus through the public API', () => {
  const files = readdirSync(DEMOS).filter(name => name.endsWith('.txt'));

  it('covers every checked-in demo document', () => {
    expect(files).toHaveLength(70);
  });

  it.each(files.filter(name => name.startsWith('strom-')))('%s is electricity only', name => {
    const result = extractFromText(read(name));
    expect(result.documentType).toBe('electricity_bill');
    expect(result.fields.some(field => field.field === 'electricityKwh')).toBe(true);
    expect(result.fields.some(field => ['waterM3', 'naturalGasKwh', 'dieselLiters'].includes(field.field))).toBe(false);
  });

  it.each(files.filter(name => name.startsWith('erdgas-')))('%s is natural gas only', name => {
    const result = extractFromText(read(name));
    expect(result.documentType).toBe('gas_invoice');
    expect(result.fields.some(field => field.field === 'naturalGasKwh')).toBe(true);
    expect(result.fields.some(field => ['waterM3', 'electricityKwh', 'dieselLiters'].includes(field.field))).toBe(false);
  });

  it.each(files.filter(name => name.startsWith('wasser-')))('%s is water only', name => {
    const result = extractFromText(read(name));
    expect(result.documentType).toBe('water_bill');
    expect(result.fields.map(field => field.field)).toEqual(['waterM3']);
  });

  it.each(files.filter(name => name.startsWith('diesel-')))('%s is fleet fuel only', name => {
    const result = extractFromText(read(name));
    expect(result.documentType).toBe('fleet_fuel_report');
    expect(result.fields.map(field => field.field)).toEqual(['dieselLiters']);
  });

  it.each(files.filter(name => name.startsWith('abfall-')))('%s is waste only', name => {
    const result = extractFromText(read(name));
    expect(result.documentType).toBe('waste_manifest');
    expect(result.fields.map(field => field.field).sort()).toEqual([
      'hazardousWasteKg', 'recycledWasteKg', 'recyclingRate', 'totalWasteKg',
    ]);
  });

  it.each(files.filter(name => name.startsWith('personal-')))('%s is workforce only', name => {
    const result = extractFromText(read(name));
    expect(result.documentType).toBe('payroll_summary');
    expect(result.fields.some(field => field.field === 'totalEmployees')).toBe(true);
    expect(result.fields.some(field => ['waterM3', 'electricityKwh', 'naturalGasKwh', 'totalWasteKg'].includes(field.field))).toBe(false);
  });

  it.each([
    'jahresabrechnung-strom-2025.txt',
    'jahresabrechnung-erdgas-2025.txt',
    'jahresabrechnung-wasser-2025.txt',
    'jahresabrechnung-fleet-2025.txt',
    'jahresbericht-abfall-2025.txt',
    'jahresbericht-personal-2025.txt',
  ])('%s retains annual rather than January semantics', name => {
    const result = extractFromText(read(name));
    expect(result.period).toBe('2025');
    expect(result.periodStart).toBe('2025-01');
    expect(result.periodEnd).toBe('2025-12');
    expect(result.coveredMonths).toEqual(Array.from({ length: 12 }, (_, index) => `2025-${String(index + 1).padStart(2, '0')}`));
    expect(result.fields.every(field => field.period === '2025')).toBe(true);
  });

  it('extracts annual HR, training and safety totals whose labels end in total/gesamt', () => {
    const result = extractFromText(read('jahresbericht-personal-2025.txt'));
    expect(result.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'trainingHours', value: 4613 }),
      expect.objectContaining({ field: 'hoursWorked', value: 536800 }),
      expect.objectContaining({ field: 'fatalities', value: 0 }),
      expect.objectContaining({ field: 'trir', value: 1.49 }),
    ]));

    const passport = toPassportRecord(result);
    expect(passport.training?.trainingHours).toBe(4613);
    expect(passport.healthSafety).toMatchObject({ hoursWorked: 536800, fatalities: 0, trir: 1.49 });
    expect(passport.workforce).toMatchObject({ departures: 14, femalePercent: 26.86 });
  });

  it('does not discard a waste diversion rate in the Passport adapter', () => {
    const result = extractFromText(read('abfall-01-januar.txt'));
    expect(toPassportRecord(result).waste?.recyclingPercent).toBe(67.6);
  });
});

describe('adversarial totals, readings, rates and locale numbers', () => {
  it('uses labelled consumption, not meter readings or currency rates', () => {
    const result = extractFromText(`Stromrechnung\nAbrechnungszeitraum: 01.01.2025 - 31.01.2025\nZählerstand alt: 9.500 kWh\nZählerstand neu: 11.700 kWh\nStromverbrauch: 2.200 kWh\nArbeitspreis: 0,31 EUR/kWh`);
    expect(result.fields.find(field => field.field === 'electricityKwh')?.value).toBe(2200);
    expect(result.fields).toHaveLength(1);
  });

  it('does not reinterpret water meter readings as electricity or gas', () => {
    const result = extractFromText(`Wasserrechnung\n01.04.2025 - 30.06.2025\nZähler alt 12.100 m3\nZähler neu 14.000 m3\nWasserverbrauch: 1.900 m3\nAbwasserpreis 2,42 EUR/m3`);
    expect(result.fields).toEqual([expect.objectContaining({ field: 'waterM3', value: 1900 })]);
  });

  it('does not extract ESG data from an unrelated commercial invoice', () => {
    const result = extractFromText('Internet invoice 2025. Monthly fee 99 EUR. 24 month contract. Total 1,188 EUR.');
    expect(result.success).toBe(false);
    expect(result.fields).toHaveLength(0);
  });
});

describe('real clean-stack domain isolation', () => {
  const clean = resolve('testing/sme-stress-stack/clean');
  const truth = JSON.parse(readFileSync(resolve('testing/sme-stress-stack/ground-truth.json'), 'utf8')) as {
    files: Array<{ path: string; type: string }>;
  };
  const allowed: Record<string, string[]> = {
    electricity: ['electricityKwh', 'renewablePercent'],
    gas: ['naturalGasKwh'],
    water: ['waterM3', 'waterSourceMunicipalPercent'],
    waste: ['totalWasteKg', 'hazardousWasteKg', 'recycledWasteKg', 'recyclingRate'],
  };

  it.each(truth.files.filter(entry => entry.path.startsWith('clean/') && entry.path.endsWith('.pdf')))(
    '$path never emits a field from another ESG domain',
    async entry => {
      const result = await extractFromPdf(readFileSync(resolve(clean, entry.path.slice('clean/'.length))));
      expect(result.fields.map(field => field.field).filter(field => !allowed[entry.type]?.includes(field))).toEqual([]);
    },
  );
});

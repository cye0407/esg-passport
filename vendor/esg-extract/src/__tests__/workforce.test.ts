import { describe, it, expect } from 'vitest';
import { extractFromText } from '../extractors/registry';
import { toPassportRecord } from '../output/passport';

const GERMAN_HR_REPORT = `
Personalbericht
Monat: März 2025

Personalbestand: 285 Mitarbeiter
Weiblich: 98
Männlich: 187

Neue Einstellungen: 5
Austritte: 3
Fluktuationsrate: 12,6%

Schulungsstunden: 420 Stunden
Arbeitsstunden: 48.200

Meldepflichtige Unfälle: 1
Arbeitsunfälle mit Ausfall: 0
`;

const ENGLISH_PAYROLL = `
Monthly Payroll Summary
Period: January 2025

Total employees: 142
Female: 58
Male: 84

New hires: 3
Departures: 2
Turnover rate: 8.5%

Total hours worked: 24,500
Training hours: 180

Recordable incidents: 0
Lost-time incidents: 0
`;

const FRENCH_HR = `
Rapport RH Mensuel
Février 2025

Effectif total: 210
Femmes: 89
Hommes: 121

Embauches: 4
Départs: 2

Heures de formation: 315
`;

describe('Workforce extraction', () => {
  it('extracts from German HR report', () => {
    const result = extractFromText(GERMAN_HR_REPORT);
    expect(result.success).toBe(true);
    expect(result.documentType).toBe('payroll_summary');

    expect(result.fields.find(f => f.field === 'totalEmployees')?.value).toBe(285);
    expect(result.fields.find(f => f.field === 'femaleEmployees')?.value).toBe(98);
    expect(result.fields.find(f => f.field === 'trainingHours')?.value).toBe(420);
    expect(result.fields.find(f => f.field === 'hoursWorked')?.value).toBe(48200);
  });

  it('extracts from English payroll summary', () => {
    const result = extractFromText(ENGLISH_PAYROLL);
    expect(result.success).toBe(true);

    expect(result.fields.find(f => f.field === 'totalEmployees')?.value).toBe(142);
    expect(result.fields.find(f => f.field === 'femaleEmployees')?.value).toBe(58);
    expect(result.fields.find(f => f.field === 'newHires')?.value).toBe(3);
    expect(result.fields.find(f => f.field === 'turnoverRate')?.value).toBe(8.5);
    expect(result.fields.find(f => f.field === 'hoursWorked')?.value).toBe(24500);
    expect(result.fields.find(f => f.field === 'trainingHours')?.value).toBe(180);
  });

  it('extracts from French HR report', () => {
    const result = extractFromText(FRENCH_HR);
    expect(result.success).toBe(true);

    expect(result.fields.find(f => f.field === 'totalEmployees')?.value).toBe(210);
    expect(result.fields.find(f => f.field === 'femaleEmployees')?.value).toBe(89);
    expect(result.fields.find(f => f.field === 'trainingHours')?.value).toBe(315);
  });

  it('calculates female percentage', () => {
    const result = extractFromText(ENGLISH_PAYROLL);
    const pct = result.fields.find(f => f.field === 'femalePercent');
    expect(pct).toBeDefined();
    expect(pct!.value).toBeCloseTo(40.85, 1);
  });

  it('detects period', () => {
    const result = extractFromText(ENGLISH_PAYROLL);
    expect(result.period).toBe('2025-01');
  });

  it('converts to Passport format', () => {
    const result = extractFromText(ENGLISH_PAYROLL);
    const record = toPassportRecord(result);
    expect(record.workforce?.totalEmployees).toBe(142);
    expect(record.workforce?.femaleEmployees).toBe(58);
    expect(record.workforce?.newHires).toBe(3);
    expect(record.training?.trainingHours).toBe(180);
    expect(record.healthSafety?.recordableIncidents).toBe(0);
    expect(record.healthSafety?.hoursWorked).toBe(24500);
  });

  it('never fabricates — no workforce fields from energy text', () => {
    const result = extractFromText('Electricity consumption: 50,000 kWh. Renewable: 45%.');
    expect(result.fields.find(f => f.field === 'totalEmployees')).toBeUndefined();
    expect(result.fields.find(f => f.field === 'femaleEmployees')).toBeUndefined();
  });
});

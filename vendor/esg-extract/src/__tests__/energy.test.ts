import { describe, it, expect } from 'vitest';
import { extractFromText } from '../extractors/registry';
import { toPassportRecord } from '../output/passport';
import { toResponseReadyData } from '../output/responseReady';

// ============================================
// Simulated bill text — realistic electricity bill extracts
// ============================================

const GERMAN_ELECTRICITY_BILL = `
Stadtwerke München
Stromrechnung

Abrechnungszeitraum: 01.01.2025 - 31.01.2025

Verbrauch: 76.543 kWh

Arbeitspreis: 0,32 €/kWh
Grundpreis: 12,50 €/Monat

Nettobetrag: 24.505,26 €
MwSt. (19%): 4.655,99 €
Bruttobetrag: 29.161,25 €
`;

const ENGLISH_ELECTRICITY_BILL = `
E.ON Energy
Monthly Electricity Statement

Account: 12345678
Period: January 2025

Total electricity consumption: 45,200 kWh
Unit rate: £0.28/kWh
Standing charge: £15.00/month

Total amount due: £12,671.00
`;

const FRENCH_GAS_BILL = `
Engie
Facture de gaz naturel

Période: Janvier 2025

Consommation de gaz: 12.450 kWh

Prix unitaire: 0,08 €/kWh
Abonnement: 18,50 €/mois

Montant HT: 1.014,50 €
TVA (20%): 202,90 €
Montant TTC: 1.217,40 €
`;

const MWH_BILL = `
Vattenfall
Electricity Supply Statement

Billing period: 2025-02-01 to 2025-02-28

Total energy delivered: 89.5 MWh

Rate: €95.00/MWh
Network charges: €1,200.00
Total: €9,702.50
`;

const WATER_BILL = `
Berliner Wasserbetriebe
Wasserrechnung

Abrechnungszeitraum: Januar 2025

Wasserverbrauch: 245 m³

Trinkwasserpreis: 1,813 €/m³
Abwasserpreis: 2,425 €/m³
`;

// ============================================
// Tests
// ============================================

describe('Energy extraction', () => {
  it('extracts kWh from German electricity bill', () => {
    const result = extractFromText(GERMAN_ELECTRICITY_BILL);
    expect(result.success).toBe(true);
    expect(result.documentType).toBe('electricity_bill');

    const kwh = result.fields.find(f => f.field === 'electricityKwh');
    expect(kwh).toBeDefined();
    expect(kwh!.value).toBe(76543);
    expect(kwh!.unit).toBe('kWh');
  });

  it('extracts kWh from English electricity bill', () => {
    const result = extractFromText(ENGLISH_ELECTRICITY_BILL);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('E.ON');

    const kwh = result.fields.find(f => f.field === 'electricityKwh');
    expect(kwh).toBeDefined();
    expect(kwh!.value).toBe(45200);
  });

  it('detects E.ON as provider', () => {
    const result = extractFromText(ENGLISH_ELECTRICITY_BILL);
    expect(result.provider).toBe('E.ON');
  });

  it('detects period from English bill', () => {
    const result = extractFromText(ENGLISH_ELECTRICITY_BILL);
    expect(result.period).toBe('2025-01');
  });

  it('extracts gas consumption from French bill', () => {
    const result = extractFromText(FRENCH_GAS_BILL);
    expect(result.success).toBe(true);
    expect(result.documentType).toBe('gas_invoice');
    expect(result.provider).toBe('Engie');

    const gas = result.fields.find(f => f.field === 'naturalGasKwh');
    expect(gas).toBeDefined();
    expect(gas!.value).toBe(12450);
  });

  it('converts MWh to kWh', () => {
    const result = extractFromText(MWH_BILL);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('Vattenfall');

    const kwh = result.fields.find(f => f.field === 'electricityKwh');
    expect(kwh).toBeDefined();
    expect(kwh!.value).toBe(89500); // 89.5 MWh = 89,500 kWh
  });

  it('detects period from ISO date range', () => {
    const result = extractFromText(MWH_BILL);
    expect(result.period).toBe('2025-02');
  });
});

describe('Water extraction', () => {
  it('extracts m3 from German water bill', () => {
    const result = extractFromText(WATER_BILL);
    expect(result.success).toBe(true);

    const water = result.fields.find(f => f.field === 'waterM3');
    expect(water).toBeDefined();
    expect(water!.value).toBe(245);
    expect(water!.unit).toBe('m3');
  });
});

describe('Output: Passport format', () => {
  it('converts electricity extraction to Passport dataRecord', () => {
    const result = extractFromText(ENGLISH_ELECTRICITY_BILL);
    const record = toPassportRecord(result);

    expect(record.period).toBe('2025-01');
    expect(record.energy?.electricityKwh).toBe(45200);
  });

  it('converts water extraction to Passport dataRecord', () => {
    const result = extractFromText(WATER_BILL);
    const record = toPassportRecord(result);

    expect(record.water?.consumptionM3).toBe(245);
  });
});

describe('Output: ResponseReady format', () => {
  it('converts electricity extraction to ResponseReady data', () => {
    const result = extractFromText(ENGLISH_ELECTRICITY_BILL);
    const data = toResponseReadyData(result);

    expect(data.electricityKwh).toBe(45200);
  });

  it('converts gas kWh to m3 for ResponseReady', () => {
    const result = extractFromText(FRENCH_GAS_BILL);
    const data = toResponseReadyData(result);

    // 12,450 kWh / 10.55 ≈ 1,180 m3
    expect(data.naturalGasM3).toBe(1180);
  });
});

describe('No fabrication', () => {
  it('returns success=false when no fields extracted', () => {
    const result = extractFromText('This is just a random email about nothing.');
    expect(result.success).toBe(false);
    expect(result.fields).toHaveLength(0);
  });

  it('never invents values — only extracts what exists', () => {
    const result = extractFromText(ENGLISH_ELECTRICITY_BILL);
    // This bill only has electricity — should NOT have gas, water, waste
    expect(result.fields.find(f => f.field === 'naturalGasKwh')).toBeUndefined();
    expect(result.fields.find(f => f.field === 'waterM3')).toBeUndefined();
    expect(result.fields.find(f => f.field === 'totalWasteKg')).toBeUndefined();
  });

  it('reports gaps for expected fields that could not be found', () => {
    const result = extractFromText('E.ON Electricity bill with no consumption data listed.');
    expect(result.gaps).toContain('electricityKwh');
  });
});

describe('German gas m³ conversion', () => {
  it('converts m³ to kWh for German gas bill', () => {
    const text = `Stadtwerke Düsseldorf GmbH
Erdgasrechnung
Abrechnungszeitraum: 01.01.2025 - 31.01.2025
Gasverbrauch: 3.740 m³
Umrechnung: 3.740 m³ × 10,55 kWh/m³ = 39.457 kWh`;
    const result = extractFromText(text);
    expect(result.success).toBe(true);
    const gas = result.fields.find(f => f.field === 'naturalGasKwh');
    expect(gas).toBeDefined();
    console.log('GAS FIELD:', JSON.stringify(gas));
    // 3740 m³ × 10.55 = 39,457 kWh
    expect(gas!.value).toBeCloseTo(39457, 0);
  });
});

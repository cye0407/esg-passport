import { beforeEach, describe, expect, it } from 'vitest';
import { saveDataRecord, getAnnualTotals, storedScope } from '../store';
import { buildCompanyData } from '../dataBridge';

// An outside review saw a sample answer state "Scope 1: 0 tCO2e". The cause: the Data
// page turned blank inputs into zeros and saved scope1Tco2e: 0 onto every month with an
// electricity bill, so a supplier who had only entered electricity told their customer,
// as a record-backed fact, that they had no direct emissions.
describe('a blank emissions input is no figure, not zero', () => {
  beforeEach(() => localStorage.clear());

  it('reads past the zero older records carry when no Scope 1 input was entered', () => {
    saveDataRecord({ period: '2025-01', energy: { electricityKwh: 1000, naturalGasKwh: null, vehicleFuelLiters: null, scope1Tco2e: 0, scope2Tco2e: 0.4 } });
    saveDataRecord({ period: '2025-02', energy: { electricityKwh: 1200, naturalGasKwh: null, vehicleFuelLiters: null, scope1Tco2e: 0, scope2Tco2e: 0.48 } });
    const totals = getAnnualTotals('2025');
    expect(totals.scope1Tco2e).toBeNull();
    expect(totals.scope2Tco2e).toBeCloseTo(0.88);
    expect(buildCompanyData('2025').scope1Tco2e).toBeUndefined();
  });

  it('keeps a zero that was measured from an entered 0 kWh of gas', () => {
    saveDataRecord({ period: '2025-01', energy: { electricityKwh: 1000, naturalGasKwh: 0, vehicleFuelLiters: null, scope1Tco2e: 0, scope2Tco2e: 0.4 } });
    expect(getAnnualTotals('2025').scope1Tco2e).toBe(0);
    // ...and the confirmed zero reaches the engine as a gas figure, not as "missing".
    expect(buildCompanyData('2025').naturalGasM3).toBe(0);
  });

  it('keeps a non-zero figure entered without its inputs', () => {
    expect(storedScope({ energy: { scope1Tco2e: 12.5 } }, 'scope1Tco2e', ['naturalGasKwh', 'vehicleFuelLiters'])).toBe(12.5);
  });

  it('does not invent total energy from a month with only water data', () => {
    saveDataRecord({ period: '2025-01', water: { consumptionM3: 40 } });
    expect(getAnnualTotals('2025').totalEnergyKwh).toBeNull();
  });
});

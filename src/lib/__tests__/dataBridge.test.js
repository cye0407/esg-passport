import { describe, it, expect, beforeEach } from 'vitest';
import { buildCompanyData, buildCompanyProfile, computeYoYTrends } from '../dataBridge';
import { saveData, resetData, saveCompanyProfile, saveDataRecord } from '../store';

// ============================================
// Setup: clear localStorage between tests
// ============================================

beforeEach(() => {
  resetData();
});

// ============================================
// Helper: seed data for a given year+month
// ============================================

function seedProfile(overrides = {}) {
  saveCompanyProfile({
    tradingName: 'TestCorp',
    legalName: 'TestCorp GmbH',
    industrySector: 'Manufacturing',
    countryOfIncorporation: 'DE',
    totalEmployees: '250',
    numberOfFacilities: '3',
    annualRevenue: '10M-50M EUR',
    baselineYear: '2025',
    ...overrides,
  });
}

function seedMonthlyData(year, month, data) {
  const period = `${year}-${String(month).padStart(2, '0')}`;
  saveDataRecord({
    period,
    energy: data.energy || {},
    water: data.water || {},
    waste: data.waste || {},
    workforce: data.workforce || {},
    healthSafety: data.healthSafety || {},
    training: data.training || {},
    scope3: data.scope3 || {},
  });
}

function seedFullYear(year) {
  for (let m = 1; m <= 12; m++) {
    seedMonthlyData(year, m, {
      energy: {
        electricityKwh: 5000,
        naturalGasKwh: 2000,
        vehicleFuelLiters: 500,
        renewablePercent: 40,
      },
      water: { consumptionM3: 200 },
      waste: { totalKg: 1500, recycledKg: 1000, hazardousKg: 50 },
      workforce: { totalEmployees: 250, femaleEmployees: 105, maleEmployees: 145, newHires: 5, departures: 3 },
      healthSafety: { workAccidents: 0, hoursWorked: 40000 },
      training: { trainingHours: 300 },
    });
  }
}

// ============================================
// buildCompanyData
// ============================================

describe('buildCompanyData', () => {
  it('returns company profile fields', () => {
    seedProfile();
    const data = buildCompanyData('2025');
    expect(data.companyName).toBe('TestCorp');
    expect(data.industry).toBe('Manufacturing');
    expect(data.country).toBe('Germany');
    expect(data.employeeCount).toBe(250);
    expect(data.numberOfSites).toBe(3);
    expect(data.revenueBand).toBe('10M-50M EUR');
  });

  it('uses tradingName over legalName', () => {
    seedProfile({ tradingName: 'Trade Name', legalName: 'Legal Name' });
    const data = buildCompanyData('2025');
    expect(data.companyName).toBe('Trade Name');
  });

  it('falls back to legalName when tradingName is missing', () => {
    seedProfile({ tradingName: '', legalName: 'Legal Only GmbH' });
    const data = buildCompanyData('2025');
    expect(data.companyName).toBe('Legal Only GmbH');
  });

  it('converts country code to full name', () => {
    seedProfile({ countryOfIncorporation: 'FR' });
    const data = buildCompanyData('2025');
    expect(data.country).toBe('France');
  });

  it('handles unknown country codes gracefully', () => {
    seedProfile({ countryOfIncorporation: 'ZZ' });
    const data = buildCompanyData('2025');
    // Falls back to raw code
    expect(data.country).toBe('ZZ');
  });

  it('aggregates annual energy totals', () => {
    seedProfile();
    seedFullYear('2025');
    const data = buildCompanyData('2025');
    expect(data.electricityKwh).toBe(60000); // 5000 * 12
    expect(data.dieselLiters).toBe(6000);    // 500 * 12
  });

  it('converts natural gas from kWh to m³', () => {
    seedProfile();
    seedFullYear('2025');
    const data = buildCompanyData('2025');
    // 2000 kWh/month * 12 = 24000 kWh total, / 10.55 = ~2275 m³
    expect(data.naturalGasM3).toBe(Math.round(24000 / 10.55));
  });

  it('calculates female percentage from headcount', () => {
    seedProfile();
    seedMonthlyData('2025', 12, {
      workforce: { totalEmployees: 200, femaleEmployees: 80 },
    });
    const data = buildCompanyData('2025');
    expect(data.femalePercent).toBe(40); // 80/200 * 100
  });

  it('calculates training hours per employee', () => {
    seedProfile();
    // Last month headcount will be used
    seedMonthlyData('2025', 6, {
      workforce: { totalEmployees: 100 },
      training: { trainingHours: 500 },
    });
    const data = buildCompanyData('2025');
    // 500 total hours / 100 employees = 5.0
    expect(data.trainingHoursPerEmployee).toBe(5);
  });

  it('calculates TRIR from accidents and hours worked', () => {
    seedProfile();
    seedMonthlyData('2025', 1, {
      healthSafety: { workAccidents: 2, hoursWorked: 100000 },
      workforce: { totalEmployees: 50 },
    });
    const data = buildCompanyData('2025');
    // TRIR = (2 / 100000) * 200000 = 4.0
    expect(data.trirRate).toBe(4);
  });

  it('calculates recycling percentage', () => {
    seedProfile();
    seedMonthlyData('2025', 1, {
      waste: { totalKg: 10000, recycledKg: 7500 },
    });
    const data = buildCompanyData('2025');
    expect(data.recyclingPercent).toBe(75); // 7500/10000 * 100
  });

  it('returns undefined for metrics with no data', () => {
    seedProfile();
    const data = buildCompanyData('2025');
    expect(data.electricityKwh).toBeUndefined();
    expect(data.waterM3).toBeUndefined();
    expect(data.totalWasteKg).toBeUndefined();
    expect(data.femalePercent).toBeUndefined();
    expect(data.trirRate).toBeUndefined();
    expect(data.naturalGasM3).toBeUndefined();
  });

  it('passes through scope 1/2/3 when user has entered them', () => {
    seedProfile();
    seedMonthlyData('2025', 1, {
      energy: { scope1Tco2e: 50, scope2Tco2e: 100 },
      scope3: { totalScope3Tco2e: 500 },
    });
    const data = buildCompanyData('2025');
    expect(data.scope1Tco2e).toBe(50);
    expect(data.scope2Tco2e).toBe(100);
    expect(data.scope3Tco2e).toBe(500);
  });

  it('defaults reportingPeriod to baselineYear from profile', () => {
    seedProfile({ baselineYear: '2024' });
    const data = buildCompanyData();
    expect(data.reportingPeriod).toBe('2024');
  });
});

// ============================================
// buildCompanyProfile
// ============================================

describe('buildCompanyProfile', () => {
  it('returns a profile with all expected fields', () => {
    seedProfile();
    const profile = buildCompanyProfile();
    expect(profile.companyName).toBe('TestCorp');
    expect(profile.industry).toBe('Manufacturing');
    expect(profile.country).toBe('Germany');
    expect(profile.employeeCount).toBe(250);
    expect(profile.numberOfSites).toBe(3);
    expect(profile.maturityLevel).toBe('Emerging');
    expect(profile.maturityScore).toBe(0);
    expect(profile.informalPractices).toEqual([]);
  });

  it('returns empty strings for missing profile', () => {
    const profile = buildCompanyProfile();
    expect(profile.companyName).toBe('');
    expect(profile.industry).toBe('');
    expect(profile.country).toBe('');
    expect(profile.employeeCount).toBe(0);
  });
});

// ============================================
// computeYoYTrends
// ============================================

describe('computeYoYTrends', () => {
  it('computes improvement when emissions decrease', () => {
    seedProfile();
    // 2024 data: 10000 kWh/month
    for (let m = 1; m <= 12; m++) {
      seedMonthlyData('2024', m, {
        energy: { electricityKwh: 10000 },
      });
    }
    // 2025 data: 8000 kWh/month (20% decrease)
    for (let m = 1; m <= 12; m++) {
      seedMonthlyData('2025', m, {
        energy: { electricityKwh: 8000 },
      });
    }
    const trends = computeYoYTrends('2025');
    const elecTrend = trends.find(t => t.metric === 'electricityKwh');
    expect(elecTrend).toBeDefined();
    expect(elecTrend.improved).toBe(true);
    expect(elecTrend.change).toBeLessThan(0);
    expect(elecTrend.narrative).toContain('decreased');
  });

  it('computes worsening when waste increases', () => {
    seedProfile();
    for (let m = 1; m <= 12; m++) {
      seedMonthlyData('2024', m, { waste: { totalKg: 1000 } });
    }
    for (let m = 1; m <= 12; m++) {
      seedMonthlyData('2025', m, { waste: { totalKg: 1500 } });
    }
    const trends = computeYoYTrends('2025');
    const wasteTrend = trends.find(t => t.metric === 'totalWasteKg');
    expect(wasteTrend).toBeDefined();
    expect(wasteTrend.improved).toBe(false);
    expect(wasteTrend.change).toBeGreaterThan(0);
    expect(wasteTrend.narrative).toContain('implementing measures');
  });

  it('reports stable when change is <1%', () => {
    seedProfile();
    for (let m = 1; m <= 12; m++) {
      seedMonthlyData('2024', m, { water: { consumptionM3: 1000 } });
    }
    for (let m = 1; m <= 12; m++) {
      seedMonthlyData('2025', m, { water: { consumptionM3: 1005 } }); // 0.5% change
    }
    const trends = computeYoYTrends('2025');
    const waterTrend = trends.find(t => t.metric === 'waterM3');
    expect(waterTrend).toBeDefined();
    expect(waterTrend.narrative).toContain('stable');
  });

  it('returns empty array when no previous year data', () => {
    seedProfile();
    seedFullYear('2025');
    const trends = computeYoYTrends('2025');
    // No 2024 data, so no trends can be computed
    expect(trends).toEqual([]);
  });
});

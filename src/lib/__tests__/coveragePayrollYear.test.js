import { beforeEach, describe, expect, it } from 'vitest';
import { buildCompanyData } from '../dataBridge';
import { summarizeCoverage } from '../coverage';
import { COVERAGE_FIELD_MAP } from '../coverageFieldMap';
import { saveCompanyProfile, saveDataRecord } from '../store';

// Twelve monthly payroll summaries were read and written, and the report still said
// "Do this next: upload your HR or payroll summary". The map asked companyData for a key
// (`totalEmployees`) the bridge never sets, and turnover was never derived from the
// departures a payroll summary carries. This is that year, end to end.

function seedPayrollYear() {
  localStorage.clear();
  saveCompanyProfile({ legalName: 'Hartmann Präzisionstechnik GmbH', baselineYear: '2025' });
  for (let m = 1; m <= 12; m++) {
    saveDataRecord({
      period: `2025-${String(m).padStart(2, '0')}`,
      workforce: { totalEmployees: 280 + m, femaleEmployees: 76, maleEmployees: 204 + m, newHires: 2, departures: 1 },
      training: { trainingHours: 400 },
      healthSafety: { recordableIncidents: 0, lostTimeIncidents: 0, hoursWorked: 45000 },
    });
  }
}

// A draft the engine would produce for a headcount question with nothing behind it.
const headcountDraft = (answerConfidence) => ({
  questionId: 'q-fte', questionText: 'Number of employees (FTE)', answerConfidence,
  matchResult: { primaryDomain: 'workforce', suggestedDataPoints: ['Total FTE', 'Turnover rate'] },
});

describe('a year of payroll summaries', () => {
  beforeEach(seedPayrollYear);

  it('satisfies every HR row of the coverage map', () => {
    const cd = buildCompanyData('2025');
    const hrRows = COVERAGE_FIELD_MAP.filter(r => r.document === 'hrReport');
    expect(hrRows.length).toBeGreaterThan(0);
    for (const row of hrRows) {
      const present = row.companyDataKeys.some(k => cd[k] !== undefined && cd[k] !== null && cd[k] !== '');
      expect(present, `${row.label} (${row.companyDataKeys.join('/')})`).toBe(true);
    }
    expect(cd.employeeCount).toBe(292);
    // 12 departures over an average headcount of 286.5 → 4.2%
    expect(cd.turnoverRate).toBe(4.2);
  });

  it('no longer asks for the HR report once the payroll year is in', () => {
    // A written (medium) answer that wants FTE and turnover is where the prompt came
    // from: a high answer is never asked what it is missing.
    const cd = buildCompanyData('2025');
    const c = summarizeCoverage([headcountDraft('medium')], { companyData: cd });
    expect(c.missingDocuments.map(d => d.document)).not.toContain('hrReport');
  });

  it('still asks for it when nothing is there', () => {
    localStorage.clear();
    saveCompanyProfile({ legalName: 'X', baselineYear: '2025' });
    const c = summarizeCoverage([headcountDraft('none')], { companyData: buildCompanyData('2025') });
    expect(c.missingDocuments.map(d => d.document)).toContain('hrReport');
  });

  it('keeps a typed turnover rate over the derived one', () => {
    saveDataRecord({ period: '2025-06', workforce: { totalEmployees: 286, femaleEmployees: 76, maleEmployees: 210, newHires: 2, departures: 1, turnoverRate: 9.7 } });
    expect(buildCompanyData('2025').turnoverRate).toBe(9.7);
  });
});

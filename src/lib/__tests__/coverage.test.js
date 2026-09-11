import { describe, expect, it } from 'vitest';
import { esgDomainPack } from 'response-ready/domain-packs/esg';
import { COVERAGE_FIELD_MAP, rowForLabel } from '../coverageFieldMap';
import { EXTRACT_FIELD_MAP } from '../extractFieldMap';
import { remainingMissingDocuments, summarizeCoverage } from '../coverage';

const draft = (id, answerConfidence, suggestedDataPoints = [], extra = {}) => ({
  questionId: id,
  questionText: `Question ${id}`,
  answer: 'text',
  answerConfidence,
  matchResult: { suggestedDataPoints },
  ...extra,
});

describe('coverage field map', () => {
  // One assertion per row, as the spec requires. A row whose label the engine never
  // emits is dead weight; a row pointing at a field the workspace cannot store would
  // put a value against the wrong question.
  const engineLabels = new Set(Object.values(esgDomainPack.domainSuggestions).flat());
  const storableFields = new Set(
    Object.values(EXTRACT_FIELD_MAP).map(m => `${m.section}.${m.field}`)
  );

  it.each(COVERAGE_FIELD_MAP.map(row => [row.label, row]))(
    'row %s matches a label the matcher actually emits',
    (_label, row) => {
      expect(engineLabels).toContain(row.label);
    }
  );

  it.each(COVERAGE_FIELD_MAP.map(row => [row.label, row]))(
    'row %s names at least one field a document can fill',
    (_label, row) => {
      expect(row.storeFields.length).toBeGreaterThan(0);
      expect(row.companyDataKeys.length).toBeGreaterThan(0);
      expect(row.storeFields.some(f => storableFields.has(f))).toBe(true);
    }
  );

  it('has no duplicate labels', () => {
    const labels = COVERAGE_FIELD_MAP.map(r => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('returns null rather than guessing for a label it does not know', () => {
    expect(rowForLabel('Strengths')).toBeNull();
    expect(rowForLabel('nonsense')).toBeNull();
  });
});

describe('summarizeCoverage', () => {
  it('splits the questionnaire into the three groups and accounts for every question', () => {
    const result = summarizeCoverage([
      draft('a', 'high'),
      draft('b', 'medium'),
      draft('c', 'none'),
    ]);
    expect(result.total).toBe(3);
    expect(result.fromRecords).toHaveLength(1);
    expect(result.written).toHaveLength(1);
    expect(result.unanswerable).toHaveLength(1);
    expect(
      result.fromRecords.length + result.written.length + result.unanswerable.length
    ).toBe(result.total);
  });

  // The engine emits text for low-confidence questions. Showing it as an answer is how
  // a supplier signs something that is not true, so it is counted as unanswered.
  it('reports a low-confidence draft as unanswered, not as written', () => {
    const result = summarizeCoverage([draft('a', 'low'), draft('b', 'unknown'), draft('c')]);
    expect(result.written).toHaveLength(0);
    expect(result.unanswerable).toHaveLength(3);
  });

  it('names the document that would answer the most questions first', () => {
    const result = summarizeCoverage(
      [
        draft('a', 'none', ['Total waste (kg)']),
        draft('b', 'none', ['Hazardous waste']),
        draft('c', 'none', ['Diversion rate']),
        draft('d', 'none', ['Water withdrawal (m3)']),
      ],
      { companyData: {} }
    );
    expect(result.missingDocuments[0]).toMatchObject({ document: 'wasteManifest', unlocks: 3 });
    expect(result.missingDocuments[1]).toMatchObject({ document: 'waterBill', unlocks: 1 });
  });

  it('counts a question once for a document however many of its fields it wants', () => {
    const result = summarizeCoverage(
      [draft('a', 'none', ['Total waste (kg)', 'Hazardous waste', 'Diversion rate'])],
      { companyData: {} }
    );
    expect(result.missingDocuments).toMatchObject([{ document: 'wasteManifest', unlocks: 1 }]);
  });

  it('stops asking for a document once the workspace holds the figure', () => {
    const questions = [draft('a', 'none', ['Water withdrawal (m3)'])];
    expect(summarizeCoverage(questions, { companyData: {} }).missingDocuments).toHaveLength(1);
    expect(
      summarizeCoverage(questions, { companyData: { waterM3: 4200 } }).missingDocuments
    ).toHaveLength(0);
  });

  it('keeps asking for an annual flow when only part of the year is covered', () => {
    const questions = [draft('a', 'none', ['Water withdrawal (m3)'])];
    const partial = { waterM3: 2200, dataCoverage: { waterM3: { monthsCovered: 3, expectedMonths: 12, complete: false } } };
    const complete = { waterM3: 8000, dataCoverage: { waterM3: { monthsCovered: 12, expectedMonths: 12, complete: true } } };
    expect(summarizeCoverage(questions, { companyData: partial }).missingDocuments).toHaveLength(1);
    expect(summarizeCoverage(questions, { companyData: complete }).missingDocuments).toHaveLength(0);
  });

  it.each(COVERAGE_FIELD_MAP)(
    'rechecks the exact $label requirement after extraction',
    row => {
      const entry = summarizeCoverage(
        [draft('a', 'none', [row.label])],
        { companyData: {} },
      ).missingDocuments[0];
      const key = row.companyDataKeys[0];
      expect(remainingMissingDocuments([entry], { [key]: 0 })).toEqual([]);
      expect(remainingMissingDocuments([entry], {})).toEqual([entry]);
    },
  );

  it('does not clear a whole HR report when the uploaded file supplied only turnover', () => {
    const entry = summarizeCoverage([
      draft('fte', 'none', ['Total FTE']),
      draft('turnover', 'none', ['Turnover rate']),
    ], { companyData: {} }).missingDocuments[0];
    expect(remainingMissingDocuments([entry], { turnoverRate: 8.5 })).toEqual([entry]);
    expect(remainingMissingDocuments([entry], { turnoverRate: 8.5, totalEmployees: 42 })).toEqual([]);
  });

  it('does not silently clear requirements from an older session stash', () => {
    const legacy = { document: 'hrReport', unlocks: 2 };
    expect(remainingMissingDocuments([legacy], { totalEmployees: 42 })).toEqual([legacy]);
  });

  // A recorded zero is a figure, not a gap — the same rule the engine settled on.
  it('treats a recorded zero as data the user has', () => {
    const result = summarizeCoverage([draft('a', 'none', ['Hazardous waste'])], {
      companyData: { hazardousWasteKg: 0 },
    });
    expect(result.missingDocuments).toHaveLength(0);
  });

  it('never names a document for a data point the map does not cover', () => {
    const result = summarizeCoverage([draft('a', 'none', ['Strengths', 'Market scope'])], {
      companyData: {},
    });
    expect(result.missingDocuments).toHaveLength(0);
  });

  it('does not ask for documents to fill questions it already answered', () => {
    const result = summarizeCoverage([draft('a', 'high', ['Total waste (kg)'])], {
      companyData: {},
    });
    expect(result.missingDocuments).toHaveLength(0);
  });

  it('reports the document a figure came out of, and stays silent when none was recorded', () => {
    const questions = [draft('a', 'high', ['Electricity consumption (kWh)'], {
      dataValue: '42500', dataUnit: 'kWh', dataPeriod: '2026',
    })];
    const withSource = summarizeCoverage(questions, {
      dataSources: { 'energy.electricityKwh': 'stadtwerke-invoice-2026.pdf' },
    });
    expect(withSource.fromRecords[0]).toMatchObject({
      value: '42500',
      unit: 'kWh',
      document: 'stadtwerke-invoice-2026.pdf',
    });
    expect(summarizeCoverage(questions).fromRecords[0].document).toBeNull();
  });

  it('counts a missing policy only when a guided builder would actually write it', () => {
    const policy = (id, text) => draft(id, 'medium', [], {
      questionType: 'POLICY', confidenceSource: 'drafted', questionText: text,
    });
    const result = summarizeCoverage([
      policy('a', 'Do you have a code of conduct?'),
      policy('b', 'Do you have a whistleblowing procedure?'),
      policy('c', 'Do you have a business ethics policy?'),
      // No builder writes a modern slavery statement, so it is not counted.
      policy('d', 'Do you publish a modern slavery statement?'),
    ]);
    expect(result.policyGaps.questions).toBe(3);
    // Two questions, one document: the numbers are different and must stay so.
    expect(result.policyGaps.builders).toEqual(['code_of_conduct', 'whistleblowing']);
  });

  it('does not count a policy the company already has', () => {
    const held = draft('a', 'high', [], {
      questionType: 'POLICY', confidenceSource: 'provided',
      questionText: 'Do you have a code of conduct?',
    });
    expect(summarizeCoverage([held]).policyGaps.questions).toBe(0);
  });

  it('survives an empty or malformed questionnaire without inventing coverage', () => {
    expect(summarizeCoverage([]).total).toBe(0);
    expect(summarizeCoverage(null).total).toBe(0);
    expect(summarizeCoverage([{ questionId: 'x' }]).unanswerable).toHaveLength(1);
  });
});

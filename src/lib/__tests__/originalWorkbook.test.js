import { describe, expect, it } from 'vitest';
import { buildOriginalWrites, canReturnOriginal, describeAnswerPlacement, originalMatchesQuestionnaire } from '../originalWorkbook';

// Which drafts may be written into the buyer's file. The engine can write any text into
// any cell; this is where "should it" is decided, and the rules are the product's honesty
// rules — so each one is pinned here.

const q = (id, answerCell, extra = {}) => ({ id, text: id, location: { sheet: 'Q', row: 3, answerCell }, ...extra });
const draft = (questionId, answer, answerConfidence, extra = {}) => ({ questionId, answer, answerConfidence, ...extra });

describe('buildOriginalWrites', () => {
  it('writes high and medium drafts, leaves low and none blank, and says how many', () => {
    const questions = [q('a', 'B2'), q('b', 'B3'), q('c', 'B4'), q('d', 'B5')];
    const drafts = [
      draft('a', 'Yes', 'high'),
      draft('b', 'We maintain a code of conduct.', 'medium'),
      draft('c', 'This information is not currently tracked.', 'low'),
      draft('d', 'We do not have sufficient information.', 'none'),
    ];
    const { writes, leftBlank, noCell } = buildOriginalWrites(questions, drafts);
    expect(writes).toEqual([
      { sheet: 'Q', cell: 'B2', value: 'Yes' },
      { sheet: 'Q', cell: 'B3', value: 'We maintain a code of conduct.' },
    ]);
    expect(leftBlank).toBe(2);
    expect(noCell).toBe(0);
  });

  it("writes what the user decided — an edited answer or an N/A — whatever the engine thought", () => {
    const questions = [q('a', 'B2'), q('b', 'B3')];
    const drafts = [
      draft('a', 'See attached certificate.', 'none', { _edited: true }),
      draft('b', 'Not applicable. No production sites.', 'high', { _markedNA: true }),
    ];
    expect(buildOriginalWrites(questions, drafts).writes.map(w => w.value)).toEqual(['See attached certificate.', 'Not applicable. No production sites.']);
  });

  it('prefers the verified answer over the draft text', () => {
    const { writes } = buildOriginalWrites([q('a', 'B2')], [draft('a', 'draft text', 'high', { verifiedAnswer: 'verified text' })]);
    expect(writes[0].value).toBe('verified text');
  });

  it('writes a repeated question into every cell it appears in', () => {
    const questions = [q('a', 'B2', { locations: [{ sheet: 'Q', row: 9, answerCell: 'B9' }, { sheet: 'Sites', row: 4, answerCell: 'C4' }] })];
    const { writes } = buildOriginalWrites(questions, [draft('a', 'Yes', 'high')]);
    expect(writes.map(w => `${w.sheet}!${w.cell}`)).toEqual(['Q!B2', 'Q!B9', 'Sites!C4']);
  });

  it('counts questions with nowhere to write, and skips drafts for unknown questions', () => {
    const questions = [{ id: 'a', text: 'a', location: { sheet: 'Q', row: 2 } }];
    const { writes, noCell } = buildOriginalWrites(questions, [draft('a', 'Yes', 'high'), draft('ghost', 'x', 'high')]);
    expect(writes).toEqual([]);
    expect(noCell).toBe(1);
  });
});

describe('canReturnOriginal', () => {
  it('needs a spreadsheet still in memory and at least one answer cell', () => {
    const xlsx = { name: 'form.xlsx' };
    expect(canReturnOriginal(xlsx, [q('a', 'B2')])).toBe(true);
    expect(canReturnOriginal(xlsx, [{ id: 'a', text: 'a' }])).toBe(false);
    expect(canReturnOriginal({ name: 'form.pdf' }, [q('a', 'B2')])).toBe(false);
    expect(canReturnOriginal(null, [q('a', 'B2')])).toBe(false);
  });
});

describe('describeAnswerPlacement', () => {
  it('says boxes when the boxes were found by their shading, column when by a header, none when nothing', () => {
    expect(describeAnswerPlacement([q('a', 'D13', { answerCellSource: 'style' }), q('b', 'C15', { answerCellSource: 'style' })])).toEqual({ kind: 'boxes', count: 2, total: 2, columns: ['C', 'D'] });
    expect(describeAnswerPlacement([q('a', 'F11', { answerCellSource: 'header' }), q('b', 'F12', { answerCellSource: 'header' })])).toEqual({ kind: 'column', count: 2, total: 2, columns: ['F'] });
    expect(describeAnswerPlacement([{ id: 'a', text: 'a' }])).toEqual({ kind: 'none', count: 0, total: 1 });
  });
});

describe('originalMatchesQuestionnaire', () => {
  const fresh = [{ text: 'Registered legal entity name' }, { text: 'Answer in the shaded box.' }, { text: 'Number of employees (FTE)' }, { text: 'Do you measure Scope 1 and Scope 2 emissions?' }];

  it('accepts the same file after the user unticked junk rows at the confirm step', () => {
    const confirmed = [{ text: 'Registered legal entity name' }, { text: 'Number of employees (FTE)' }, { text: 'Do you measure Scope 1 and Scope 2 emissions?' }];
    expect(originalMatchesQuestionnaire(fresh, confirmed)).toBe(true);
  });

  it('is indifferent to case and spacing, which a re-parse may change', () => {
    expect(originalMatchesQuestionnaire(fresh, [{ text: '  registered   legal entity NAME ' }])).toBe(true);
  });

  it("refuses a different buyer's form, and an empty page", () => {
    expect(originalMatchesQuestionnaire(fresh, [{ text: 'Do you have a supplier code of conduct?' }, { text: 'Number of employees (FTE)' }])).toBe(false);
    expect(originalMatchesQuestionnaire(fresh, [])).toBe(false);
    expect(originalMatchesQuestionnaire([], [{ text: 'x' }])).toBe(false);
  });
});

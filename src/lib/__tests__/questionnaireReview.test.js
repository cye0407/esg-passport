import { describe, expect, it } from 'vitest';
import {
  questionnaireExtension,
  mappingColumnValue,
  mappingSelectValue,
  requiresQuestionConfirmation,
  SKIP_COLUMN_VALUE,
  thinParseSummary,
} from '../questionnaireReview';

describe('questionnaire review boundary', () => {
  it.each(['buyer.xlsx', 'buyer.xls', 'buyer.csv', 'buyer.pdf', 'buyer.docx'])(
    'requires confirmation for %s',
    fileName => expect(requiresQuestionConfirmation(fileName)).toBe(true),
  );

  it('does not route built-in labels or unsupported names through confirmation', () => {
    expect(requiresQuestionConfirmation('EcoVadis sample')).toBe(false);
    expect(requiresQuestionConfirmation('notes.txt')).toBe(false);
  });

  it('normalises the extension without exposing the file name', () => {
    expect(questionnaireExtension('Customer.Secret.Questionnaire.XLSX')).toBe('.xlsx');
    expect(questionnaireExtension('no-extension')).toBe('other');
  });

  it('uses a non-empty select sentinel while preserving an empty parser mapping', () => {
    expect(mappingSelectValue('')).toBe(SKIP_COLUMN_VALUE);
    expect(mappingSelectValue('Question')).toBe('Question');
    expect(mappingColumnValue(SKIP_COLUMN_VALUE)).toBe('');
    expect(mappingColumnValue('Frage')).toBe('Frage');
  });

  it('warns on extreme under-recovery without alarming a short form', () => {
    expect(thinParseSummary({ questions: [{}, {}], metadata: { totalRows: 40 } }).thin).toBe(true);
    expect(thinParseSummary({ questions: [{}, {}, {}], metadata: { totalRows: 100 } }).thin).toBe(true);
    expect(thinParseSummary({ questions: [{}, {}], metadata: { totalRows: 8 } }).thin).toBe(false);
    expect(thinParseSummary({ questions: Array(12).fill({}), metadata: { totalRows: 50 } }).thin).toBe(false);
  });
});

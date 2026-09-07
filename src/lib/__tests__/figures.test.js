import { describe, expect, it } from 'vitest';
import { formatFigure, figureWithUnit, answerStatesFigure } from '../figures';

describe('formatFigure', () => {
  // The reported case: fifteen decimal places of binary floating point next to prose
  // that correctly says 68.6.
  it('trims a floating point artefact to something a person would write', () => {
    expect(formatFigure('68.58000000000001 tCO2e')).toBe('68.6 tCO2e');
  });

  it('keeps precision on a small figure', () => {
    expect(formatFigure('0.0432000000001')).toBe('0.043');
    expect(formatFigure('4.256999999999')).toBe('4.26');
  });

  it('leaves a figure someone typed themselves alone', () => {
    expect(formatFigure('425000 kWh')).toBe('425000 kWh');
    expect(formatFigure('68.6 tCO2e')).toBe('68.6 tCO2e');
    expect(formatFigure('3.1 m3')).toBe('3.1 m3');
  });

  it('handles several numbers in one string, and negatives', () => {
    expect(formatFigure('from 12.30000000001 to 45.6700000000001')).toBe('from 12.3 to 45.7');
    expect(formatFigure('-2.50000000001 tCO2e')).toBe('-2.5 tCO2e');
  });

  it('says nothing when there is nothing', () => {
    expect(formatFigure(null)).toBeNull();
    expect(formatFigure(undefined)).toBeNull();
  });
});

describe('figureWithUnit', () => {
  it('joins the unit when the value does not already carry one', () => {
    expect(figureWithUnit('425000', 'kWh')).toBe('425000 kWh');
    expect(figureWithUnit('68.58000000000001 tCO2e', undefined)).toBe('68.6 tCO2e');
  });

  it('is null when there is no figure', () => {
    expect(figureWithUnit(null, 'kWh')).toBeNull();
  });
});

describe('answerStatesFigure', () => {
  // The defect this exists for: a Scope 3 question came back "we do not have this on
  // record" carrying the Scope 1 figure, and the figure was rendered underneath it.
  it('refuses a figure the answer never mentions', () => {
    const answer = 'We do not have quantified Scope 3 emissions or a category breakdown on record for this question.';
    expect(answerStatesFigure(answer, '68.58000000000001 tCO2e')).toBe(false);
  });

  it('accepts a figure the answer states', () => {
    const answer = 'Our Scope 1 (direct) greenhouse gas emissions for the reporting period are 68.6 tCO2e.';
    expect(answerStatesFigure(answer, '68.58000000000001 tCO2e')).toBe(true);
  });

  it('accepts prose that rounded further than we did', () => {
    expect(answerStatesFigure('Consumption was 4.3 tonnes.', '4.256999999999')).toBe(true);
  });

  it('refuses a different number of the same shape', () => {
    const answer = 'Our Scope 2 emissions were 163.6 tCO2e.';
    expect(answerStatesFigure(answer, '68.58000000000001 tCO2e')).toBe(false);
  });

  it('refuses when there is no answer or no figure', () => {
    expect(answerStatesFigure('', '68.6')).toBe(false);
    expect(answerStatesFigure('Some answer.', null)).toBe(false);
    expect(answerStatesFigure('Some answer.', 'no digits here')).toBe(false);
  });
});

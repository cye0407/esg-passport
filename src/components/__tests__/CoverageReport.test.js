import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const tracked = [];
vi.mock('@/lib/track', () => ({
  track: (event, props) => tracked.push({ event, props }),
  trackOnce: () => {},
}));

import CoverageReport from '../CoverageReport';
import { summarizeCoverage } from '@/lib/coverage';

const draft = (id, answerConfidence, extra = {}) => ({
  questionId: id,
  questionText: `Question ${id}`,
  answer: 'A drafted answer.',
  answerConfidence,
  matchResult: { suggestedDataPoints: [] },
  ...extra,
});

describe('CoverageReport', () => {
  let container;
  let root;

  beforeEach(() => {
    tracked.length = 0;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
  });

  async function render(drafts, options = {}, props = {}) {
    const coverage = summarizeCoverage(drafts, options);
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CoverageReport, {
            coverage,
            questionnaireName: 'buyer-saq.xlsx',
            tier: 'free',
            ...props,
          })
        )
      );
    });
    return coverage;
  }

  it('states the three counts against the questionnaire it read', async () => {
    await render([
      draft('a', 'high'),
      draft('b', 'medium'),
      draft('c', 'medium'),
      draft('d', 'none'),
    ]);
    const text = container.textContent;
    expect(text).toContain('Your questionnaire: 4 questions');
    expect(text).toContain('1 answered from your records');
    expect(text).toContain('2 written for you to check');
    expect(text).toContain('1 we cannot answer');
    expect(text).toContain('buyer-saq.xlsx');
  });

  // The spec's line: prove it works on their documents, do not do the work for free.
  it('shows three answers in full and counts the rest', async () => {
    const withValue = i => draft(`q${i}`, 'high', { dataValue: String(100 + i), dataUnit: 'kWh' });
    await render([withValue(1), withValue(2), withValue(3), withValue(4), withValue(5)]);
    expect(container.textContent).toContain('Question q1');
    expect(container.textContent).toContain('Question q3');
    expect(container.textContent).not.toContain('Question q4');
    expect(container.textContent).toContain('Showing 3 of 5');
  });

  it('names the document it came from only when one was recorded', async () => {
    const question = draft('a', 'high', { dataValue: '42500', dataUnit: 'kWh' });
    question.matchResult = { suggestedDataPoints: ['Electricity consumption (kWh)'] };
    await render([question], { dataSources: { 'energy.electricityKwh': 'stadtwerke.pdf' } });
    expect(container.textContent).toContain('42500 kWh');
    expect(container.textContent).toContain('from stadtwerke.pdf');

    await render([question]);
    expect(container.textContent).not.toContain('from stadtwerke.pdf');
  });

  it('asks for the document that would answer the most questions, first', async () => {
    const needing = (id, label) => draft(id, 'none', { matchResult: { suggestedDataPoints: [label] } });
    await render(
      [
        needing('a', 'Total waste (kg)'),
        needing('b', 'Hazardous waste'),
        needing('c', 'Water withdrawal (m3)'),
      ],
      { companyData: {} }
    );
    const text = container.textContent;
    expect(text).toContain('Your waste manifest');
    expect(text).toContain('would answer 2 of these');
    expect(text.indexOf('Your waste manifest')).toBeLessThan(text.indexOf('Your water bill'));
  });

  it('offers both prices, and only claims policies when a builder would write them', async () => {
    const plain = await render([draft('a', 'medium')]);
    expect(plain.policyGaps.builders).toHaveLength(0);
    expect(container.textContent).toContain('€99');
    expect(container.textContent).toContain('€499');
    expect(container.textContent).not.toContain('policy documents these questions ask for');

    await render([
      draft('a', 'medium', {
        questionType: 'POLICY',
        confidenceSource: 'drafted',
        questionText: 'Do you have a code of conduct?',
      }),
    ]);
    expect(container.textContent).toContain('policy documents these questions ask for');
  });

  // Non-negotiable: the report describes what the record supports. It never predicts
  // how a buyer will grade the response.
  it('never states a score, a percentage or a likelihood', async () => {
    await render([draft('a', 'high'), draft('b', 'medium'), draft('c', 'none')]);
    expect(container.textContent).not.toMatch(/\d+\s?%/);
    expect(container.textContent.toLowerCase()).not.toMatch(/score|readiness|likely to pass|will pass/);
  });

  it('reports that it was seen, with the numbers it showed', async () => {
    await render([draft('a', 'high'), draft('b', 'medium'), draft('c', 'none')]);
    const viewed = tracked.find(e => e.event === 'coverage_report_viewed');
    expect(viewed.props).toMatchObject({
      questions: 3,
      from_records: 1,
      written: 1,
      unanswerable: 1,
    });
  });

  // The report is not saved, so leaving to fetch a bill would otherwise mean coming
  // back to an empty upload screen and hunting for the file again - which is the exact
  // moment this loop breaks.
  it('hands the questionnaire back before sending the reader off to add documents', async () => {
    const onAddDocuments = vi.fn();
    const needing = draft('a', 'none', { matchResult: { suggestedDataPoints: ['Total waste (kg)'] } });
    await render([needing], { companyData: {} }, { onAddDocuments });
    const button = [...container.querySelectorAll('button')].find(b =>
      b.textContent.includes('Add documents')
    );
    expect(button).toBeTruthy();
    await act(async () => button.click());
    expect(onAddDocuments).toHaveBeenCalled();
  });
});

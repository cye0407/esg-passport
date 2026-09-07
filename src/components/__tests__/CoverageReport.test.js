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

let seq = 0;
const draft = (domain, answerConfidence, extra = {}) => ({
  questionId: `q${(seq += 1)}`,
  questionText: `Question about ${domain}`,
  answer: 'A drafted answer.',
  answerConfidence,
  matchResult: { primaryDomain: domain, suggestedDataPoints: [] },
  ...extra,
});

const needing = (domain, labels, answerConfidence = 'none') =>
  draft(domain, answerConfidence, { matchResult: { primaryDomain: domain, suggestedDataPoints: labels } });

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

  it('opens with the questionnaire it read', async () => {
    await render([draft('emissions', 'medium'), draft('workforce', 'medium')]);
    expect(container.textContent).toContain('Your questionnaire: 2 questions');
    expect(container.textContent).toContain('buyer-saq.xlsx');
  });

  it('shows what it read, and lets you see the rest', async () => {
    const questions = Array.from({ length: 8 }, (_, i) => ({ id: `r${i}`, text: `Read question ${i}` }));
    await render([draft('emissions', 'medium')], {}, { questions });
    expect(container.textContent).toContain('Read question 0');
    expect(container.textContent).toContain('Read question 4');
    expect(container.textContent).not.toContain('Read question 5');
    const more = [...container.querySelectorAll('button')].find(b => b.textContent.includes('Show all 8'));
    expect(more).toBeTruthy();
    await act(async () => more.click());
    expect(container.textContent).toContain('Read question 7');
  });

  // Grouped the way the customer asking the questions groups them. Confidence is our
  // category, not theirs, and it belongs on the individual answers instead.
  it('groups the questionnaire by topic, not by engine confidence', async () => {
    await render([
      draft('emissions', 'high'),
      draft('waste', 'medium'),
      draft('workforce', 'medium'),
      draft('regulatory', 'medium'),
    ]);
    const text = container.textContent;
    expect(text).toContain('Environmental');
    expect(text).toContain('Social');
    expect(text).toContain('Governance');
    // The old confidence headings are gone from the page.
    expect(text).not.toContain('written for you to check');
    expect(text).not.toContain('we cannot answer');
  });

  it('names the documents that would answer a topic', async () => {
    await render([needing('waste', ['Total waste (kg)'])], { companyData: {} });
    expect(container.textContent).toContain('Would answer these');
    expect(container.textContent).toContain('Your waste manifest');
  });

  it('offers both ways of supplying a missing document', async () => {
    await render([needing('workforce', ['Total FTE'])], { companyData: {} });
    const labels = [...container.querySelectorAll('button')].map(b => b.textContent);
    expect(labels.some(l => l.includes('Upload'))).toBe(true);
    // Typing four numbers beats fighting a scanned PDF, and some of these documents are
    // awkward.
    expect(labels.some(l => l.includes('Enter the figures'))).toBe(true);
  });

  it('samples the answers, leading with the ones built on the reader own figures', async () => {
    const supported = draft('emissions', 'high', { dataValue: '425000', dataUnit: 'kWh' });
    const drafted = Array.from({ length: 6 }, () => draft('workforce', 'medium'));
    await render([...drafted, supported]);
    const text = container.textContent;
    expect(text).toContain('Your first 5 answers');
    expect(text).toContain('425000 kWh');
    expect(text).toContain('2 more questions in this questionnaire');
  });

  it('names the document a figure came from only when one was recorded', async () => {
    const question = draft('energy_electricity', 'high', { dataValue: '42500', dataUnit: 'kWh' });
    question.matchResult = {
      primaryDomain: 'energy_electricity',
      suggestedDataPoints: ['Electricity consumption (kWh)'],
    };
    await render([question], { dataSources: { 'energy.electricityKwh': 'stadtwerke.pdf' } });
    expect(container.textContent).toContain('from stadtwerke.pdf');

    await render([question]);
    expect(container.textContent).not.toContain('from stadtwerke.pdf');
  });

  // The misleading half of a true number: the engine composes drafts from its template
  // library whether or not the reader has told us anything about their business.
  it('does not claim a draft came from the reader when they have entered nothing', async () => {
    await render([draft('workforce', 'medium')], { companyData: {} });
    expect(container.textContent).toContain('from our answer library');

    await render([draft('workforce', 'medium')], { companyData: { electricityKwh: 42000 } });
    expect(container.textContent).toContain('exactly as they will look when you finish');
  });

  it('offers both prices, and only claims policies when a builder would write them', async () => {
    const plain = await render([draft('workforce', 'medium')]);
    expect(plain.policyGaps.builders).toHaveLength(0);
    expect(container.textContent).toContain('€99');
    expect(container.textContent).toContain('€499');
    expect(container.textContent).not.toContain('policy documents these questions ask for');

    await render([
      draft('buyer_requirements', 'medium', {
        questionType: 'POLICY',
        confidenceSource: 'drafted',
        questionText: 'Do you have a code of conduct?',
      }),
    ]);
    expect(container.textContent).toContain('policy documents these questions ask for');
  });

  // Non-negotiable: the report describes what the record supports. It never predicts how
  // a buyer will grade the response.
  it('never states a score, a percentage or a likelihood', async () => {
    await render([draft('emissions', 'high'), draft('workforce', 'medium'), draft('site', 'none')]);
    expect(container.textContent).not.toMatch(/\d+\s?%/);
    expect(container.textContent.toLowerCase()).not.toMatch(/score|readiness|likely to pass|will pass/);
  });

  it('reports that it was seen, with the numbers it showed', async () => {
    await render([draft('emissions', 'high'), draft('workforce', 'medium'), draft('site', 'none')]);
    const viewed = tracked.find(e => e.event === 'coverage_report_viewed');
    expect(viewed.props).toMatchObject({
      questions: 3,
      from_records: 1,
      written: 1,
      unanswerable: 1,
    });
  });
});

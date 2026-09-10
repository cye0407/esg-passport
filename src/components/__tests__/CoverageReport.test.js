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

  it('opens with the questionnaire it read, and counts it once', async () => {
    await render([draft('emissions', 'medium'), draft('workforce', 'medium')]);
    expect(container.textContent).toContain('Questionnaire summary');
    expect(container.textContent).toContain('buyer-saq.xlsx');

    // The total is stated once, in the stat band above both columns. The heading used
    // to carry it too, and the panel carried it a third time.
    expect(container.textContent).toContain('Questions asked');
    expect(container.textContent).not.toContain('Your questionnaire: 2 questions');
    expect(container.textContent).not.toContain('Where you stand');
  });

  // The buyer's own question list is not first-impression material - the reader wrote
  // none of it and has read all of it, and PDF/Word uploads confirm the parsed list in a
  // step of its own before this screen. It stays reachable, because a spreadsheet skips
  // that confirmation and a wrong denominator makes every number here false.
  it('keeps every question it read, but not in the way', async () => {
    const questions = Array.from({ length: 8 }, (_, i) => ({ id: `r${i}`, text: `Read question ${i}` }));
    await render([draft('emissions', 'medium')], {}, { questions });

    expect(container.textContent).not.toContain('Read question 0');

    const disclose = [...container.querySelectorAll('button')]
      .find(b => b.textContent.includes('See the 8 questions we read'));
    expect(disclose).toBeTruthy();
    await act(async () => disclose.click());

    // All of them, not a truncated preview.
    for (let i = 0; i < 8; i += 1) {
      expect(container.textContent).toContain(`Read question ${i}`);
    }
  });

  it('does not sell free visitors a preview made from unverified generated answers', async () => {
    const drafts = Array.from({ length: 9 }, () => draft('workforce', 'medium'));
    await render(drafts);
    expect(container.textContent).not.toContain('Your first 5 answers');
    expect(container.textContent).not.toContain('A drafted answer.');
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

  it('labels topic counts as questions without repeating the missing-document list', async () => {
    await render([needing('waste', ['Total waste (kg)'])], { companyData: {} });
    expect(container.textContent).toContain('1 question');
    expect(container.textContent).not.toContain('Documents that would help here');
    // The document still appears once, in the actionable section with its buttons.
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
    const supported = draft('emissions', 'high', {
      answer: 'Electricity consumption was 425000 kWh.',
      dataValue: '425000', dataUnit: 'kWh',
    });
    const drafted = Array.from({ length: 6 }, () => draft('workforce', 'medium'));
    await render([...drafted, supported], {}, { tier: 'questionnaire-pass' });
    const text = container.textContent;
    expect(text).toContain('Your first 5 answers');
    expect(text).toContain('425000 kWh');
    expect(text).toContain('2 more questions in this questionnaire');
  });

  // The engine attaches a figure to a draft whether or not the answer it chose rests on
  // it: a Scope 3 question came back "we do not have this on record" carrying the Scope 1
  // number, and the number was rendered under the sentence denying it.
  it('will not show a figure the answer does not state, and rounds the one it does', async () => {
    const contradicted = draft('emissions', 'high', {
      answer: 'We do not have quantified Scope 3 emissions on record for this question.',
      dataValue: '68.58000000000001 tCO2e',
    });
    await render([contradicted], {}, { tier: 'questionnaire-pass' });
    expect(container.textContent).not.toContain('68.58');
    expect(container.textContent).not.toContain('68.6');

    const stated = draft('emissions', 'high', {
      answer: 'Our Scope 1 emissions for the reporting period are 68.6 tCO2e.',
      dataValue: '68.58000000000001 tCO2e',
    });
    await render([stated], {}, { tier: 'questionnaire-pass' });
    // Rounded, never fifteen decimal places of binary floating point.
    expect(container.textContent).not.toContain('68.58000000000001');
    expect(container.textContent).toContain('68.6 tCO2e');
  });

  it('names the document a figure came from only when one was recorded', async () => {
    const question = draft('energy_electricity', 'high', {
      answer: 'Electricity consumption was 42500 kWh.',
      dataValue: '42500', dataUnit: 'kWh',
    });
    question.matchResult = {
      primaryDomain: 'energy_electricity',
      suggestedDataPoints: ['Electricity consumption (kWh)'],
    };
    await render([question], { dataSources: { 'energy.electricityKwh': 'stadtwerke.pdf' } }, { tier: 'questionnaire-pass' });
    expect(container.textContent).toContain('from stadtwerke.pdf');

    await render([question], {}, { tier: 'questionnaire-pass' });
    expect(container.textContent).not.toContain('from stadtwerke.pdf');
  });

  // The misleading half of a true number: the engine composes drafts from its template
  // library whether or not the reader has told us anything about their business.
  it('does not claim a draft came from the reader when they have entered nothing', async () => {
    await render([draft('workforce', 'medium')], { companyData: {} }, { tier: 'questionnaire-pass' });
    expect(container.textContent).toContain('from our answer library');

    await render([draft('workforce', 'medium')], { companyData: { electricityKwh: 42000 } }, { tier: 'questionnaire-pass' });
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
    expect(container.textContent).toContain('policy document this questionnaire asks for');
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

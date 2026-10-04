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

import CoverageReport, { isPresentableDraft } from '../CoverageReport';
import { summarizeCoverage } from '@/lib/coverage';

let seq = 0;
const draft = (domain, answerConfidence, extra = {}) => ({
  questionId: `q${(seq += 1)}`,
  questionText: `Question about ${domain}`,
  // Distinct per draft: the report never shows the same sentence twice among the
  // strongest answers, so identical filler would collapse a fixture to one.
  answer: `A drafted answer (${seq}).`,
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
    // Leads with what is drafted; the outstanding work follows on one line.
    expect(container.textContent).toContain('2 of your 2 answers are drafted.');
    expect(container.textContent).toContain('buyer-saq.xlsx');
    expect(container.textContent).toContain('To finish: 2 company answers to confirm');
    expect(container.textContent).not.toContain('records to provide');
    expect(container.textContent).not.toContain('policies to attach or create');

    expect(container.textContent).toContain('Customer request');
    expect(container.textContent).toContain('Where you stand');
    expect(container.textContent).not.toContain('Your questionnaire: 2 questions');
  });

  it('makes the same-format promise explicit only when the original workbook can be returned', async () => {
    const questions = [{
      id: 'q1',
      text: 'Question about workforce',
      location: { sheet: 'Supplier response', row: 8, answerCell: 'D8' },
    }];
    await render([draft('workforce', 'medium')], {}, { questions });

    const guarantee = container.querySelector('[data-testid="coverage-format-guarantee"]');
    expect(guarantee.textContent).toContain('What you get back');
    expect(guarantee.textContent).toContain('original workbook');
    expect(guarantee.textContent).toContain('same file type, sheets, question order and template');

    await render([draft('workforce', 'medium')], {}, { questionnaireName: 'buyer-request.pdf', questions: [{ id: 'q2', text: 'Question about workforce' }] });
    expect(container.querySelector('[data-testid="coverage-format-guarantee"]').textContent).toContain('What you get back');
    expect(container.textContent).not.toContain('original workbook');
  });

  // The parsed question list used to sit behind two clicks, inside "Other options".
  // It is now resident, in a rail beside the report: for a spreadsheet this is the only
  // place the denominator can be checked, because xlsx skips the confirmation step that
  // PDF and Word go through, and a wrong question count makes every number here false.
  // Resident but small -- a fixed-height scroller, never 91 rows pushing the page down.
  it('keeps every question it read in view, without a click', async () => {
    const questions = Array.from({ length: 8 }, (_, i) => ({ id: `r${i}`, text: `Read question ${i}` }));
    const supported = draft('energy_electricity', 'high', { answer: 'During 2025, electricity consumption across our reporting boundary was 425000 kWh.', dataValue: 425000, dataUnit: 'kWh' });
    supported.matchResult = { primaryDomain: 'energy_electricity', suggestedDataPoints: ['Electricity consumption (kWh)'] };
    await render([supported], { dataSources: { 'energy.electricityKwh': 'electricity-2025.pdf' } }, { questions });

    // All of them, with no disclosure to open first, and only once on the page.
    for (let i = 0; i < 8; i += 1) {
      expect(container.textContent).toContain(`Read question ${i}`);
    }
    expect(container.textContent.split('Read question 0')).toHaveLength(2);
    expect(container.textContent).toContain('8 from your file');

    // Bounded, so a 91-question questionnaire cannot run the page off the screen.
    const list = [...container.querySelectorAll('ol')].find(o => o.textContent.includes('Read question 0'));
    expect([...list.classList].join(' ')).toContain('overflow-y-auto');
  });

  // Free sees the same drafts paid does — hiding them hid the product from the only
  // people still deciding whether to buy it. The claim each line makes is carried by
  // its badge, so a library draft must reach the reader marked as a draft, never as
  // something their own records support.
  it('shows free visitors the drafts, labelled as drafts rather than as evidence', async () => {
    // Distinct sentences: selectBestCoverageAnswers treats the text as the identity, so
    // nine copies of one answer would correctly collapse to a single preview line.
    const drafts = Array.from({ length: 9 }, (_, i) => draft('workforce', 'medium', {
      answer: `All employees receive health and safety instruction on joining and refresher briefing number ${i} each year.`,
    }));
    await render(drafts);
    expect(container.textContent).toContain('Your 5 drafted answers');
    expect(container.textContent).toContain('All employees receive health and safety instruction');
    expect(container.textContent).toContain('Draft');
    expect(container.textContent).not.toContain('Supported');
  });

  it('keeps a fragment out of the preview a free visitor sees', async () => {
    const fragment = draft('workforce', 'medium', { answer: 'Yes.' });
    await render([fragment]);
    expect(container.textContent).not.toContain('drafted answers');
    expect(container.textContent).not.toContain('Your drafted answer');
  });

  // The short figures a reader's own bills produce. A 45-character floor kept every one of
  // these out of the free preview, which is the panel meant to show what records buy.
  it.each([
    'Water withdrawal (2026): 8,154 m³.',
    '289 employees (FTE) (2026).',
    'Employee turnover rate (2026): 9.7 %.',
    'Annual revenue band: €10M – €50M (2026).',
    'Scope 2 emissions (2026), location-based: 992.5 tCO2e. A market-based figure is not available.',
    'No work-related fatalities (2026).',
  ])('treats a short answer that states a figure as presentable: %s', text => {
    expect(isPresentableDraft({ answer: text })).toBe(true);
  });

  it.each([
    'Yes.',
    'Reporting period: 2026.',
    'Electricity data is not available.',
    'We do not have details of how sustainability considerations are integrated into procurement decisions on record for this question.',
    'Energy policy',
    '',
    // What a workspace with only bills in it produced on the 96-question stress fixture:
    // a headcount nobody entered, defaulted to zero, and a policy nobody marked, defaulted
    // to "not in place". The 45-character floor hid both by accident.
    '0 employees (FTE) (2026).',
    'No. No grievance mechanism is in place.',
  ])('keeps a fragment or a "nothing on record" sentence out: %s', text => {
    expect(isPresentableDraft({ answer: text })).toBe(false);
  });

  it('shows a short record-backed figure in the preview a free visitor can see', async () => {
    const water = draft('water', 'high', { answer: 'Water withdrawal (2026): 8,154 m³.' });
    await render([water]);
    assertReachable('Water withdrawal (2026): 8,154 m³.');
  });

  it('rejects a nominally supported but poor answer and makes evidence the only next step', async () => {
    const poor = draft('energy_electricity', 'high', {
      answer: 'Electricity data is not available.',
      dataValue: 425000,
      dataUnit: 'kWh',
    });
    await render([poor]);
    // The sentence says the company has nothing on record; shown as a preview it reads
    // as the tool failing, so it stays out however confident the engine was.
    expect(container.textContent).not.toContain('Electricity data is not available.');
    expect(container.textContent).not.toContain('Your drafted answer');
    expect(container.textContent).not.toContain('Show a clearly labelled example');
  });

  it('shows free visitors a strongest-answer preview only when their records support it', async () => {
    const supported = draft('energy_electricity', 'high', {
      answer: 'During 2025, electricity consumption across our reporting boundary was 425000 kWh.',
      dataValue: 425000,
      dataUnit: 'kWh',
    });
    supported.matchResult = { primaryDomain: 'energy_electricity', suggestedDataPoints: ['Electricity consumption (kWh)'] };
    await render([supported], { dataSources: { 'energy.electricityKwh': 'electricity-2025.pdf' } });
    expect(container.textContent).toContain('Your drafted answer');
    expect(container.textContent).toContain('During 2025, electricity consumption across our reporting boundary was 425000 kWh.');
    expect(container.textContent).toContain('€99');
    expect(container.textContent).not.toContain('€499');
    expect(container.textContent).toContain('Auto-extract and prepare for review — €99');
  });

  // Free now sees the same sample pool paid does, so a strong answer is no longer
  // hidden for want of a recorded source. What must not happen is the report naming
  // a source it was never told about: silence is correct when nothing is known.
  it('shows a strong answer without inventing a source document for it', async () => {
    const answer = draft('energy_electricity', 'high', {
      answer: 'During 2025, electricity consumption across our reporting boundary was 425000 kWh.',
      dataValue: 425000,
      dataUnit: 'kWh',
    });
    await render([answer]);
    expect(container.textContent).toContain('During 2025, electricity consumption across our reporting boundary was 425000 kWh.');
    expect(container.textContent).not.toContain('from electricity-2025.pdf');
    expect(container.textContent).not.toContain('from undefined');
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

  it('opens About your company in place instead of navigating away', async () => {
    await render([draft('site', 'medium')]);
    const about = [...container.querySelectorAll('button')].find(button => button.textContent.includes('Add your company details'));
    expect(about).toBeTruthy();
    await act(async () => about.click());
    expect(document.body.textContent).toContain('Save and refresh analysis');
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
    expect(container.textContent).toContain('Documents that commonly answer this');
    expect(labels.some(l => l.includes('Upload'))).toBe(true);
    // Typing four numbers beats fighting a scanned PDF, and some of these documents are
    // awkward.
    expect(labels.some(l => l.includes('Enter the figures'))).toBe(true);
  });

  it('shows the full requirement before one automation option instead of sending the supplier through bills', async () => {
    await render([needing('workforce', ['Total FTE'])], { companyData: {} });

    const verdict = container.querySelector('[data-testid="coverage-verdict"]');
    const primary = verdict.querySelector('[data-testid="coverage-primary-action"]');
    const alternatives = verdict.querySelector('details');

    expect(verdict.textContent).toContain('What this customer request needs');
    expect(verdict.textContent).toContain('Your HR or payroll summary');
    expect(primary.textContent).toContain('Auto-extract and prepare for review — €99');
    expect(verdict.textContent).not.toContain('Upload this document');
    expect(verdict.textContent).not.toContain('Enter the figures');
    expect(alternatives.open).toBe(false);
    expect(alternatives.querySelector('summary').textContent).toContain('Questionnaire details and other actions');
  });

  it('shows every required record rather than only a ranked top three', async () => {
    await render([
      needing('energy_electricity', ['Electricity consumption (kWh)']),
      needing('water', ['Water withdrawal (m3)']),
      needing('waste', ['Total waste (kg)']),
      needing('workforce', ['Total FTE']),
    ]);

    const verdict = container.querySelector('[data-testid="coverage-verdict"]');
    expect(verdict.textContent).toContain('Your electricity bill');
    expect(verdict.textContent).toContain('Your water bill');
    expect(verdict.textContent).toContain('Your waste manifest');
    expect(verdict.textContent).toContain('Your HR or payroll summary');
  });

  it('takes a paid supplier straight to answer review when no document is missing', async () => {
    const onShowAnswers = vi.fn();
    await render(
      [draft('workforce', 'medium')],
      {},
      { tier: 'questionnaire-pass', onShowAnswers }
    );

    const primary = container.querySelector('[data-testid="coverage-primary-action"]');
    expect(primary.textContent).toContain('Review the answers');
    await act(async () => primary.click());
    expect(onShowAnswers).toHaveBeenCalledOnce();
  });

  it('does not ask for colleague files or repeat the purchase action when no record is missing', async () => {
    await render([draft('workforce', 'medium')]);
    expect(container.textContent).not.toContain('Someone else has these records?');
    expect([...container.querySelectorAll('button')].filter(button => button.textContent.includes('Auto-extract and prepare for review — €99'))).toHaveLength(1);
  });

  it('reserves policy creation for Passport while still accepting an existing policy', async () => {
    const policy = draft('governance', 'medium', {
      questionType: 'POLICY',
      confidenceSource: 'drafted',
      questionText: 'Do you have a code of conduct?',
    });

    await render([policy], {}, { tier: 'questionnaire-pass', onShowAnswers: vi.fn() });
    expect(container.querySelector('[data-testid="coverage-primary-action"]').textContent).toContain('Review the answers');
    expect([...container.querySelectorAll('button')].some(button => button.textContent.includes('Create policy'))).toBe(false);
    expect([...container.querySelectorAll('button')].some(button => button.textContent.includes('Upload policy'))).toBe(true);
    expect(container.textContent).toContain('full Passport adds the integrated policy builder');

    await render([policy], {}, { tier: 'pro', onShowAnswers: vi.fn() });
    expect(container.querySelector('[data-testid="coverage-primary-action"]').textContent).toContain('Review the answers');
    expect([...container.querySelectorAll('button')].some(button => button.textContent.includes('Create policy'))).toBe(true);
    expect(container.textContent).toContain('Your Passport includes the integrated policy builder');
  });

  it('samples the answers, leading with the ones built on the reader own figures', async () => {
    const supported = draft('emissions', 'high', {
      answer: 'Electricity consumption was 425000 kWh.',
      dataValue: '425000', dataUnit: 'kWh',
    });
    const drafted = Array.from({ length: 6 }, () => draft('workforce', 'medium'));
    await render([...drafted, supported], {}, { tier: 'questionnaire-pass' });
    const text = container.textContent;
    expect(text).toContain('Your 5 drafted answers');
    expect(text).toContain('425000 kWh');
    expect(text).toContain('2 more questions in this questionnaire');
  });

  it('does not call one month of annual data fully supported', async () => {
    const electricity = needing('energy_electricity', ['Electricity consumption (kWh)'], 'high');
    electricity.answer = 'Electricity consumption was 18000 kWh.';
    electricity.dataValue = 18000;
    electricity.dataUnit = 'kWh';
    const coverage = await render([electricity], {
      companyData: {
        electricityKwh: 18000,
        dataCoverage: {
          electricityKwh: { periods: ['2025-03'], monthsCovered: 1, expectedMonths: 12, complete: false },
        },
      },
      dataSources: { 'energy.electricityKwh': 'march-electricity.pdf' },
    }, { tier: 'questionnaire-pass' });

    expect(coverage.fromRecords).toHaveLength(0);
    expect(coverage.partial).toHaveLength(1);
    expect(coverage.unanswerable).toHaveLength(0);
    expect(coverage.missingDocuments).toEqual([{ document: 'electricityBill', unlocks: 1 }]);
    expect(container.textContent).toContain('1 answer uses records that cover only part of the requested period. Check the dates before sending.');
    expect(container.textContent).not.toContain('Your strongest 1 answers');
  });

  it('selects the strongest evidence-backed answers instead of the first rows', async () => {
    const weak = Array.from({ length: 5 }, () => draft('workforce', 'medium'));
    const strong = draft('energy_electricity', 'high', {
      questionText: 'Strong electricity answer',
      answer: 'Electricity consumption was 425000 kWh.',
      dataValue: 425000,
      dataUnit: 'kWh',
    });
    await render([...weak, strong], {}, { tier: 'questionnaire-pass' });
    expect(container.textContent).toContain('Strong electricity answer');
    expect(container.textContent).toContain('Your 5 drafted answers');
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

  // The offer is on the page whether or not a covered answer exists yet — hiding the
  // price from a visitor with no documents hid the purchase path from most visitors.
  // What changes is the figures line: it never claims records the reader has not got.
  it('shows the offer without a covered answer, says so honestly, and does not pitch Passport here', async () => {
    const plain = await render([draft('workforce', 'medium')]);
    expect(plain.policyGaps.builders).toHaveLength(0);
    expect(container.textContent).toContain('€99');
    // The honest figures line used to live in a second purchase block. That block was a
    // duplicate of the visible offer and is gone; the claim it made is now carried by the
    // standing count and the lead, both of which say plainly that nothing rests on the
    // reader's own records yet.
    expect(container.textContent).toContain('0ready from your records');
    expect(container.textContent).toContain('These are written from our answer library');
    expect(container.textContent).not.toContain('€499');
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

  // jsdom has no layout, so container.textContent reads display:none nodes just as
  // happily as visible ones. Between Sep 29 and Oct 3 the answer preview and every
  // topic card sat inside a `<div className="hidden" aria-hidden="true">` left by the
  // requirements-first refactor, and 26 tests passed green against UI no reader could
  // see. Assert reachability explicitly: no ancestor may hide the subtree.
  const assertReachable = (needle) => {
    const node = [...container.querySelectorAll('*')]
      .reverse()
      .find(element => element.textContent.includes(needle));
    expect(node, `nothing rendered containing ${needle}`).toBeTruthy();
    for (let el = node; el && el !== container; el = el.parentElement) {
      expect(el.getAttribute('aria-hidden'), `${needle} is inside aria-hidden ${el.tagName}`).not.toBe('true');
      expect([...el.classList], `${needle} is inside a .hidden ${el.tagName}`).not.toContain('hidden');
      expect(el.hasAttribute('hidden'), `${needle} is inside [hidden] ${el.tagName}`).toBe(false);
    }
  };

  it('renders the answer preview and the topic cards where a reader can actually see them', async () => {
    const supported = draft('energy_electricity', 'high', {
      answer: 'During 2025, electricity consumption across our reporting boundary was 425000 kWh.',
      dataValue: 425000,
      dataUnit: 'kWh',
    });
    supported.matchResult = { primaryDomain: 'energy_electricity', suggestedDataPoints: ['Electricity consumption (kWh)'] };
    await render([supported, draft('workforce', 'medium')], { dataSources: { 'energy.electricityKwh': 'electricity-2025.pdf' } });

    assertReachable('Where you stand');
    assertReachable('drafted answer');
    assertReachable('Questions by topic');
  });

});

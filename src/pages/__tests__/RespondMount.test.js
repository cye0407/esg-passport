import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A smoke test, deliberately shallow in what it asserts and deliberately real in what it
// renders. The Respond page shipped broken because a useEffect sat above the useState it
// named in its dependency array — dependency arrays are evaluated during render, so it
// threw on every render and took the whole page down. 281 tests passed through it,
// because not one of them mounted the component.
//
// Anything that throws at render time fails here now, whatever the cause.

const mockEntitlements = vi.fn();

vi.mock('@/components/LicenseContext', () => ({
  useLicense: () => mockEntitlements(),
}));

vi.mock('@/lib/track', () => ({ track: () => {}, trackOnce: () => {} }));

// pdfjs needs DOMMatrix, which jsdom does not have, and it is imported at module scope.
// Mounting a page does not need real PDF reading — only that the page renders.
vi.mock('../../../web-helpers/pdfReader', () => ({
  readPdfText: async () => '',
  isUnreadablePdfText: () => false,
}));

import Respond from '../Respond';
import Home from '../Home';
import Data from '../Data';
import { saveDataRecord, saveSettings } from '@/lib/store';
import { getDataRecords } from '@/lib/store';
import { setHandoff } from '@/lib/handoff';
import { writeCoverageStash } from '@/lib/coverageStash';

const TIERS = {
  free: {
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canAnalyseCoverage: true,
    canGenerateAnswers: false,
    canExportResponses: false,
    canBuildPolicies: false,
    canGenerateReport: false,
  },
  'questionnaire-pass': {
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canAnalyseCoverage: true,
    canGenerateAnswers: true,
    canExportResponses: true,
    canBuildPolicies: false,
    canGenerateReport: false,
  },
  pro: {
    canUploadQuestionnaire: true,
    canExtractDocuments: true,
    canAnalyseCoverage: true,
    canGenerateAnswers: true,
    canExportResponses: true,
    canBuildPolicies: true,
    canGenerateReport: true,
  },
};

describe('Respond renders', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
  });

  async function mount(tier, props = {}) {
    mockEntitlements.mockReturnValue({
      tier,
      entitlements: TIERS[tier],
      licenseKeyId: tier === 'free' ? null : 'key-1',
      isPaid: tier !== 'free',
    });
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(Respond, props)
        )
      );
    });
  }

  it.each(['free', 'questionnaire-pass', 'pro'])('mounts for %s without throwing', async tier => {
    await mount(tier);
    expect(container.textContent.length).toBeGreaterThan(0);
  });

  it('mounts the read-only sample route', async () => {
    await mount('free', { demoOnly: true });
    expect(container.textContent.length).toBeGreaterThan(0);
  });

  it('offers free an upload area rather than a paywall', async () => {
    await mount('free');
    // The whole point of the entitlement split: free brings its own questionnaire.
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('keeps onboarding questionnaire entry focused on the upload task', async () => {
    mockEntitlements.mockReturnValue({
      tier: 'free',
      entitlements: TIERS.free,
      licenseKeyId: null,
      isPaid: false,
    });
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/respond?focus=questionnaire'] },
          React.createElement(Respond),
        ),
      );
    });

    expect(container.textContent).not.toContain('Previous');
    expect(container.textContent).not.toContain('Readiness');
    expect(container.textContent).not.toContain('No questionnaire handy');
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
  });
});

// Home and Data took the same kind of edit this week — new effects, a moved early
// return — and were equally uncovered.
describe('the other pages I changed render', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockEntitlements.mockReturnValue({
      tier: 'free',
      entitlements: TIERS.free,
      licenseKeyId: null,
      isPaid: false,
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
  });

  async function mount(Component) {
    await act(async () => {
      root.render(React.createElement(MemoryRouter, null, React.createElement(Component)));
    });
  }

  it('the dashboard mounts, with somewhere to drop a questionnaire', async () => {
    saveSettings({ setupCompleted: true });
    await mount(Home);
    expect(container.querySelectorAll('input[type="file"]').length).toBeGreaterThan(0);
  });

  it('the data page mounts', async () => {
    await mount(Data);
    expect(container.textContent.length).toBeGreaterThan(0);
  });

  it('shows and persists the year delivered by an extraction handoff', async () => {
    setHandoff({
      kind: 'extraction',
      items: [{
        period: '2025-03',
        fileName: 'electricity-march.pdf',
        fields: [{ field: 'electricityKwh', value: 198000 }],
      }],
    });

    await act(async () => {
      root.render(React.createElement(
        React.StrictMode,
        null,
        React.createElement(MemoryRouter, null, React.createElement(Data)),
      ));
    });
    await act(async () => {});

    expect(container.textContent).toContain('2025');
    expect(getDataRecords().find(record => record.period === '2025-03')?.energy?.electricityKwh).toBe(198000);
  });

  it('returns questionnaire evidence to the questionnaire after saving', async () => {
    setHandoff({
      kind: 'extraction',
      returnTo: '/respond',
      items: [{
        period: '2025-04',
        fileName: 'electricity-april.pdf',
        fields: [{ field: 'electricityKwh', value: 180000 }],
      }],
    });

    await act(async () => {
      root.render(React.createElement(
        React.StrictMode,
        null,
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/data'] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: '/data', element: React.createElement(Data) }),
            React.createElement(Route, { path: '/respond', element: React.createElement('div', null, 'Questionnaire returned') }),
          ),
        ),
      ));
    });
    await act(async () => {});

    expect(container.textContent).toContain('Questionnaire returned');
    expect(getDataRecords().find(record => record.period === '2025-04')?.energy?.electricityKwh).toBe(180000);
  });

  it('onboarding mounts for someone who has not set up', async () => {
    const { default: Onboarding } = await import('../Onboarding');
    await mount(Onboarding);
    expect(container.textContent.length).toBeGreaterThan(0);
  });

  it('the evidence page mounts, with somewhere to drop a document', async () => {
    const { default: Evidence } = await import('../Evidence');
    await mount(Evidence);
    expect(container.querySelectorAll('input[type="file"]').length).toBeGreaterThan(0);
  });

  it('keeps an HR report in still-needed when only one of its requested figures was added', async () => {
    writeCoverageStash({
      questionCount: 2,
      reportingPeriod: '2025',
      missingDocuments: [{
        document: 'hrReport',
        unlocks: 2,
        requirements: [
          { label: 'Total FTE', companyDataKeys: ['totalEmployees'] },
          { label: 'Turnover rate', companyDataKeys: ['turnoverRate'] },
        ],
      }],
    });
    saveDataRecord({ period: '2025-12', workforce: { turnoverRate: 8.5 } });
    const { default: Evidence } = await import('../Evidence');
    await mount(Evidence);
    expect(container.textContent).toContain('Your HR or payroll summary');
  });

  it('removes an HR report from still-needed after all requested figures are saved', async () => {
    writeCoverageStash({
      questionCount: 2,
      reportingPeriod: '2025',
      missingDocuments: [{
        document: 'hrReport',
        unlocks: 2,
        requirements: [
          { label: 'Total FTE', companyDataKeys: ['totalEmployees'] },
          { label: 'Turnover rate', companyDataKeys: ['turnoverRate'] },
        ],
      }],
    });
    saveDataRecord({ period: '2025-12', workforce: { totalEmployees: 42, turnoverRate: 8.5 } });
    const { default: Evidence } = await import('../Evidence');
    await mount(Evidence);
    expect(container.textContent).not.toContain('Your HR or payroll summary');
  });
});

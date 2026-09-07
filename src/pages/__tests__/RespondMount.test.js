import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
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
import { saveSettings } from '@/lib/store';

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
});

// Home and Data took the same kind of edit this week — new effects, a moved early
// return — and were equally uncovered.
describe('the other pages I changed render', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
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
});

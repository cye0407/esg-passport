import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/components/LicenseContext', () => ({
  useLicense: () => ({
    tier: 'free',
    isChecking: false,
    entitlements: { canBuildPolicies: false },
  }),
}));

vi.mock('@/components/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', t: (key) => key }),
}));

vi.mock('@/lib/track', () => ({ track: () => {} }));

import PolicyBuilder from '../PolicyBuilder';
import { composeParagraphs } from '@/data/policyBuilders';
import { WORKED_EXAMPLE_ID, workedExampleAnswers } from '@/data/policyFreeTemplate';

describe('PolicyBuilder free preview', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
    window.scrollTo = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('shows the document structure without exposing copyable completed policy prose', async () => {
    const completedParagraph = composeParagraphs(
      WORKED_EXAMPLE_ID,
      workedExampleAnswers('en'),
      { company: 'Example GmbH', today: '2026-09-11', lang: 'en' },
    ).find(paragraph => paragraph.text)?.text;

    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: [`/policies?build=${WORKED_EXAMPLE_ID}`] },
          React.createElement(PolicyBuilder),
        ),
      );
    });

    expect(completedParagraph).toBeTruthy();
    expect(container.textContent).not.toContain(completedParagraph);
    expect(container.textContent).toContain('pb.example.previewLocked');
  });
});

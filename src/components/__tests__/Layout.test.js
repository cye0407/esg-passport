import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockUseLicense = vi.fn();

vi.mock('@/components/LicenseContext', () => ({
  useLicense: () => mockUseLicense(),
}));

vi.mock('@/lib/versionCheck', () => ({
  APP_VERSION: 'test',
  checkForUpdate: vi.fn(async () => ({ available: false })),
}));

import Layout from '../Layout';

describe('Layout navigation entitlements', () => {
  let container;
  let root;

  beforeEach(() => {
    mockUseLicense.mockReset();
    mockUseLicense.mockReturnValue({ isPaid: false });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }
    container?.remove();
  });

  async function renderLayout() {
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          React.createElement(
            Routes,
            null,
            React.createElement(
              Route,
              { element: React.createElement(Layout) },
              React.createElement(Route, {
                path: '/',
                element: React.createElement('div', null, 'Dashboard page'),
              }),
            ),
          ),
        ),
      );
    });
  }

  it('does not mark Respond or Requests as locked for free users, but keeps paid routes locked', async () => {
    await renderLayout();

    expect(container.textContent).toContain('Respond');
    // No "Example" badge any more. Free reaches the real Respond page with its own
    // questionnaire; the sample lives at /demo and is no longer what the nav offers.
    expect(container.textContent).not.toContain('Example');
    expect(container.querySelector('[aria-label="Respond locked"]')).toBeNull();
    expect(container.querySelector('[aria-label="Requests locked"]')).toBeNull();
    expect(container.querySelector('[aria-label="Report locked"]')).not.toBeNull();
  });

  it('labels the logo and mobile navigation controls for assistive technology', async () => {
    await renderLayout();

    expect(container.querySelector('a[aria-label="ESG Passport home"]')).not.toBeNull();
    const menu = container.querySelector('button[aria-label="Open navigation"]');
    expect(menu).not.toBeNull();
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(menu.getAttribute('aria-controls')).toBe('mobile-navigation');

    await act(async () => menu.click());
    expect(container.querySelector('#mobile-navigation')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Close navigation"]')?.getAttribute('aria-expanded')).toBe('true');
  });
});

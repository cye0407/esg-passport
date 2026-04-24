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

  it('does not mark Respond as locked for free users, but keeps paid routes locked', async () => {
    await renderLayout();

    expect(container.textContent).toContain('Respond');
    expect(container.textContent).toContain('Preview');
    expect(container.querySelector('[aria-label="Respond locked"]')).toBeNull();
    expect(container.querySelector('[aria-label="Report locked"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Requests locked"]')).not.toBeNull();
  });
});

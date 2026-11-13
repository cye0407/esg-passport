import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 20_000 });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Settings waited for a company profile and rendered "Loading..." until one existed.
// Onboarding is now a single questionnaire screen and the profile is deferred to /data,
// so a person who went straight to their questionnaire - the main path - never got past
// "Loading...": no licence field, no backups, no deactivation.

vi.mock('@/components/LicenseContext', () => ({
  useLicense: () => ({
    activate: async () => ({ valid: false, code: 'limit_reached', error: 'limit_reached' }),
    isPaid: false,
    tier: 'free',
    entitlements: {},
  }),
}));
vi.mock('@/lib/track', () => ({ track: () => {}, trackOnce: () => {} }));

import Settings from '../Settings';
import { normalizeLicenseError } from '@/lib/license';
import { loadData } from '@/lib/store';

describe('Settings with no company profile', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function mount() {
    await act(async () => {
      root.render(React.createElement(MemoryRouter, null, React.createElement(Settings)));
    });
  }

  it('renders the licence field instead of "Loading..."', async () => {
    await mount();
    expect(container.textContent).not.toMatch(/^Loading\.\.\.$/);
    const keyInput = [...container.querySelectorAll('input')].find(i => /licen[cs]e/i.test(i.placeholder || ''));
    expect(keyInput).toBeTruthy();
  });

  it('a key already active elsewhere gets a next step, not a dead end', async () => {
    await mount();
    const keyInput = [...container.querySelectorAll('input')].find(i => /licen[cs]e/i.test(i.placeholder || ''));
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    await act(async () => {
      setter.call(keyInput, 'AAAA-BBBB-CCCC-DDDD');
      keyInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      keyInput.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    const note = container.querySelector('[data-testid="license-error"]');
    expect(note?.textContent).toMatch(/already active on another computer or browser/);
    const link = note.querySelector('a');
    expect(link.getAttribute('href')).toBe('mailto:contact@esgforsuppliers.com?subject=Free%20my%20licence');
    expect(note.className).not.toMatch(/red/);
  });

  it('does not wipe stored settings when it renders with defaults', async () => {
    await mount();
    expect(loadData().companyProfile ?? null).toBeNull();
  });
});

describe('Lemon Squeezy activation-limit sentence', () => {
  it('maps to the limit_reached code', () => {
    expect(normalizeLicenseError('This license key has reached the activation limit.')).toBe('limit_reached');
    expect(normalizeLicenseError('limit_reached')).toBe('limit_reached');
    expect(normalizeLicenseError('not_found')).toBe('not_found');
  });
});

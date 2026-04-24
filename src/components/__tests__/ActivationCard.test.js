import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseLicense = vi.fn();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/components/LicenseContext', () => ({
  useLicense: () => mockUseLicense(),
}));

import ActivationCard from '../ActivationCard';

describe('ActivationCard', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
    mockUseLicense.mockReset();
    mockUseLicense.mockReturnValue({
      isPaid: false,
      isChecking: false,
      activate: vi.fn(),
    });

    window.history.replaceState({}, '', '/');
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

  async function renderCard() {
    await act(async () => {
      root.render(React.createElement(ActivationCard));
    });
  }

  it('does not block free users on a normal first visit', async () => {
    await renderCard();

    expect(container.textContent).not.toContain('Activate License');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows the activation modal after purchase redirect welcome state', async () => {
    window.history.replaceState({}, '', '/?welcome=pro');

    await renderCard();

    expect(container.textContent).toContain('Activate License');
    expect(container.textContent).toContain('Welcome');
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

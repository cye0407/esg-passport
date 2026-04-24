import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockUseLicense = vi.fn();

vi.mock('@/components/LicenseContext', () => ({
  useLicense: () => mockUseLicense(),
}));

import UpgradeGate from '../UpgradeGate';

describe('UpgradeGate', () => {
  let container;
  let root;

  beforeEach(() => {
    mockUseLicense.mockReset();
    mockUseLicense.mockReturnValue({
      activate: vi.fn(async () => ({ valid: true })),
    });
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

  async function renderGate(feature) {
    await act(async () => {
      root.render(React.createElement(UpgradeGate, { feature }));
    });
  }

  it('shows report-specific upgrade copy for the ESG Report gate', async () => {
    await renderGate('ESG Report');

    expect(container.textContent).toContain('Unlock ESG Report');
    expect(container.textContent).toContain('shareable ESG Passport report');
    expect(container.textContent).not.toContain('Upload any questionnaire');
  });

  it('shows request-specific upgrade copy for the Request Management gate', async () => {
    await renderGate('Request Management');

    expect(container.textContent).toContain('Unlock Request Management');
    expect(container.textContent).toContain('Track incoming customer requests and deadlines');
    expect(container.textContent).not.toContain('Upload any questionnaire');
  });
});

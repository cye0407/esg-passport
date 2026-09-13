import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/components/LicenseContext', () => ({
  useLicense: () => ({ entitlements: { canExtractDocuments: true } }),
}));
vi.mock('@/lib/track', () => ({ track: () => {}, trackOnce: () => {} }));
vi.mock('@/components/BillDrop', () => ({
  default: ({ onDataExtracted, onBatchComplete }) => React.createElement(
    'button',
    {
      type: 'button',
      onClick: () => {
        onDataExtracted([{ field: 'electricityKwh', value: 18000, unit: 'kWh' }], '2025-03', 'march-2025.pdf');
        onBatchComplete?.();
      },
    },
    'Apply extracted 2025 bill',
  ),
}));

import Data from '../Data';
import { getDataRecords, saveDataRecord, saveExtractionReceipt, saveSettings } from '@/lib/store';

describe('Data extraction year', () => {
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

  it('opens the extracted year when a past-period document is uploaded directly', async () => {
    await act(async () => {
      root.render(React.createElement(MemoryRouter, null, React.createElement(Data)));
    });

    const apply = [...container.querySelectorAll('button')]
      .find(button => button.textContent === 'Apply extracted 2025 bill');
    await act(async () => apply.click());
    await act(async () => {});

    expect(container.textContent).toContain('2025');
    expect(getDataRecords().find(record => record.period === '2025-03')?.energy?.electricityKwh).toBe(18000);
    expect(getDataRecords().find(record => record.period === '2026-03')?.energy?.electricityKwh).toBeUndefined();
  });

  it('does not show a past extraction source on an empty current-year table', async () => {
    saveDataRecord({ period: '2025-01', energy: { electricityKwh: 17000 } });
    saveSettings({ dataSources: { 'energy.electricityKwh': 'electricity-2025.pdf' } });
    saveExtractionReceipt({
      fileName: 'electricity-2025.pdf',
      savedPeriod: '2025-01',
      sourcePeriod: '2025-01',
      fields: [{ field: 'electricityKwh', value: 17000, unit: 'kWh' }],
    });

    await act(async () => {
      root.render(React.createElement(MemoryRouter, null, React.createElement(Data)));
    });

    expect(container.textContent).toContain('2026');
    expect(container.textContent).not.toContain('electricity-2025.pdf');
  });
});

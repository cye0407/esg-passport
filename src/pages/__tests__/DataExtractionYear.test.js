import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mounts the Data page; 3 s alone, 7–8 s inside the parallel suite on a busy machine,
// against vitest's 5 s default. The limit is for the machine, not the code (same as
// RespondMount.test.js).
vi.setConfig({ testTimeout: 20_000 });

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
import { getDataRecords, getSettings, saveDataRecord, saveExtractionReceipt, saveSettings } from '@/lib/store';

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

  const changeInput = (input, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

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

  it('names every file a figure came out of, not the first', async () => {
    // a second file already set this field last time
    saveSettings({ dataSources: { 'energy.electricityKwh': 'january-2025.pdf' }, dataSourceFiles: { 'energy.electricityKwh': ['january-2025.pdf'] } });
    await act(async () => {
      root.render(React.createElement(MemoryRouter, null, React.createElement(Data)));
    });
    const apply = [...container.querySelectorAll('button')].find(button => button.textContent === 'Apply extracted 2025 bill');
    await act(async () => apply.click());
    await act(async () => {});
    expect(getSettings().dataSources['energy.electricityKwh']).toBe('january-2025.pdf … march-2025.pdf (2)');
    expect(getSettings().dataSourceFiles['energy.electricityKwh']).toEqual(['january-2025.pdf', 'march-2025.pdf']);
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

  it('shows electricity emission factors in kg per kWh', async () => {
    await act(async () => {
      root.render(React.createElement(MemoryRouter, null, React.createElement(Data)));
    });

    expect(container.textContent).toContain('0.328 kg CO₂/kWh');
  });

  it('saves an edited annual total as a full year without expanding untouched YTD metrics', async () => {
    saveDataRecord({ period: '2026-01', waste: { totalKg: 500 } });
    await act(async () => {
      root.render(React.createElement(MemoryRouter, null, React.createElement(Data)));
    });

    const annual = [...container.querySelectorAll('button')].find(button => button.textContent === 'Annual');
    await act(async () => annual.click());

    const electricityRow = [...container.querySelectorAll('tr')]
      .find(row => row.textContent.includes('Electricity (kWh)'));
    await act(async () => changeInput(electricityRow.querySelector('input'), '120000'));

    const save = [...container.querySelectorAll('button')].find(button => button.textContent.trim() === 'Save');
    await act(async () => save.click());
    await act(async () => {});

    const records = getDataRecords().filter(record => record.period.startsWith('2026-'));
    expect(records.filter(record => record.energy?.electricityKwh === 10000)).toHaveLength(12);
    expect(records.filter(record => record.waste?.totalKg === 500).map(record => record.period)).toEqual(['2026-01']);
  });
});

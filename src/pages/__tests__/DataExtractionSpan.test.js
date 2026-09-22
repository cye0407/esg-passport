import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mounts the Data page (see DataExtractionYear.test.js on the timeout).
vi.setConfig({ testTimeout: 20_000 });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/components/LicenseContext', () => ({
  useLicense: () => ({ entitlements: { canExtractDocuments: true } }),
}));
vi.mock('@/lib/track', () => ({ track: () => {}, trackOnce: () => {} }));

// A quarterly fleet CSV: it names the three months it contains, and reports diesel and
// petrol separately though the workspace keeps one vehicle-fuel figure.
vi.mock('@/components/BillDrop', () => ({
  default: ({ onDataExtracted, onBatchComplete }) => React.createElement(
    'button',
    {
      type: 'button',
      onClick: () => {
        onDataExtracted(
          [
            { field: 'dieselLiters', value: 1200, unit: 'L' },
            { field: 'petrolLiters', value: 300, unit: 'L' },
            { field: 'totalEmployees', value: 128 },
          ],
          '2025-01',
          'fleet-q1-2025.csv',
          { coveredMonths: ['2025-01', '2025-02', '2025-03'], periodStart: '2025-01', periodEnd: '2025-03' },
        );
        onBatchComplete?.();
      },
    },
    'Apply quarterly fleet CSV',
  ),
}));

import Data from '../Data';
import { getDataRecords } from '@/lib/store';

describe('a document is written across the months it covers', () => {
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

  it('shares a quarterly total over its three months and keeps both fuels', async () => {
    await act(async () => {
      root.render(React.createElement(MemoryRouter, null, React.createElement(Data)));
    });

    const apply = [...container.querySelectorAll('button')]
      .find(button => button.textContent === 'Apply quarterly fleet CSV');
    await act(async () => apply.click());
    await act(async () => {});

    const records = getDataRecords();
    const fuelFor = period => Number(records.find(r => r.period === period)?.energy?.vehicleFuelLiters);

    // 1,200 diesel + 300 petrol = 1,500 L over three months. Neither tank is lost, and
    // the quarter's total is not claimed to have happened in January.
    expect(fuelFor('2025-01')).toBe(500);
    expect(fuelFor('2025-02')).toBe(500);
    expect(fuelFor('2025-03')).toBe(500);
    expect(fuelFor('2025-01') + fuelFor('2025-02') + fuelFor('2025-03')).toBe(1500);

    // A headcount is a snapshot: it is the same 128 people each month, not 42.67 of them.
    for (const period of ['2025-01', '2025-02', '2025-03']) {
      expect(Number(records.find(r => r.period === period)?.workforce?.totalEmployees)).toBe(128);
    }
  });
});

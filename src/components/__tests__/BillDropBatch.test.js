import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Twelve monthly payroll files chosen with the file picker were read as one: the user
// confirmed January and was handed off with eleven months never looked at. The cause
// was a LIVE FileList — the input's own list — cleared by handleFileSelect while the
// async read loop was still iterating it. This test hands BillDrop a FileList that
// empties itself the moment the input is cleared, exactly as a browser's does.

vi.setConfig({ testTimeout: 20_000 });
vi.mock('@/lib/track', () => ({ track: () => {}, trackOnce: () => {} }));
// pdfjs needs DOMMatrix, which jsdom does not have, and it is imported at module scope.
vi.mock('../../../web-helpers/pdfReader', () => ({
  readPdfText: async () => '',
  isUnreadablePdfText: () => false,
}));
vi.mock('@/components/LanguageContext', () => ({
  useLanguage: () => ({ t: (key, vars = {}) => `${key}${vars.count !== undefined ? `:${vars.count}` : ''}`, lang: 'en' }),
}));

// jsdom's Blob has neither text() nor arrayBuffer(); every browser's has both.
for (const [name, method] of [['text', 'readAsText'], ['arrayBuffer', 'readAsArrayBuffer']]) {
  if (!Blob.prototype[name]) {
    Blob.prototype[name] = function () {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader[method](this);
      });
    };
  }
}

const { default: BillDrop } = await import('../BillDrop');

function monthFile(month, name) {
  const text = `Hartmann GmbH\nPersonalbericht / HR Monthly Summary\nBerichtszeitraum: ${name} 2025\n\nPersonalbestand gesamt: ${280 + month} Mitarbeiter\nArbeitsstunden gesamt: ${45000 + month * 100} Stunden\n`;
  return new File([new TextEncoder().encode(text)], `personal-${String(month).padStart(2, '0')}.txt`, { type: 'text/plain' });
}

/** A FileList that behaves like the browser's: live, and emptied when the input is cleared. */
function liveFileList(files, input) {
  const list = { length: files.length, item: i => files[i] };
  files.forEach((f, i) => { list[i] = f; });
  // clearing the input's value empties the live list
  Object.defineProperty(input, 'value', {
    set(v) { if (v === '') { for (let i = 0; i < files.length; i++) delete list[i]; list.length = 0; } },
    get() { return ''; },
    configurable: true,
  });
  return list;
}

describe('BillDrop with a multi-file selection', () => {
  let container;
  let root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('reads every file the user chose, even though the input is cleared while reading', async () => {
    const extracted = [];
    let completed = 0;
    await act(async () => {
      root.render(React.createElement(BillDrop, { inputId: 'bills', onDataExtracted: (fields, period) => extracted.push(period), onBatchComplete: () => { completed += 1; } }));
    });
    const input = container.querySelector('input[type=file]');
    const files = [monthFile(1, 'Januar'), monthFile(2, 'Februar'), monthFile(3, 'März')];
    const list = liveFileList(files, input);
    Object.defineProperty(input, 'files', { get: () => list, configurable: true });

    // Reach React's handler through its own props rather than a synthetic DOM event —
    // what is under test is the async read loop, not event delegation.
    const propsKey = Object.keys(input).find(k => k.startsWith('__reactProps'));
    await act(async () => {
      input[propsKey].onChange({ target: input });
      await new Promise(r => setTimeout(r, 600));
    });

    // January's review card is up and says two more are waiting
    expect(document.body.textContent).toContain('bill.more:2');

    // confirm all three
    for (let i = 0; i < 3; i++) {
      const confirm = [...document.body.querySelectorAll('button')].find(b => b.textContent.includes('bill.apply'));
      expect(confirm, `apply button for file ${i + 1}`).toBeTruthy();
      await act(async () => { confirm.click(); });
    }
    expect(extracted).toEqual(['2025-01', '2025-02', '2025-03']);
    expect(completed).toBe(1);
  });
});

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import JourneySpine from '../JourneySpine';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('JourneySpine navigation', () => {
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

  it('links the evidence step once a questionnaire has been read', async () => {
    await act(async () => {
      root.render(React.createElement(
        MemoryRouter,
        null,
        React.createElement(JourneySpine, { step: 3, questionCount: 61, evidenceSkipped: true }),
      ));
    });

    const evidenceLink = [...container.querySelectorAll('a')]
      .find(link => link.textContent.includes('Your evidence'));
    expect(evidenceLink?.getAttribute('href')).toBe('/evidence');
  });
});

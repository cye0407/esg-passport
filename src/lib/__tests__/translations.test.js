import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

import { saveAs } from 'file-saver';
import {
  buildHtmlDocument,
  exportAnswersAsHtml,
  exportAnswersAsWord,
  printAnswersAsPdf,
} from '../respondExport';
import { localizeAnswerDrafts, translateAnswer } from '../translations';

const DATE_FORMAT = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

describe('translations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('localizes current renewable electricity template phrasing', () => {
    const source = 'Our total electricity consumption was 2,321,000 kWh during the reporting period. Of this, 52% (approximately 1,206,920 kWh) was sourced from renewable energy. We continue to prioritize the transition to renewable electricity across our operations.';

    const translated = translateAnswer(source, 'fr');

    expect(translated).toContain("Notre consommation totale d'électricité");
    expect(translated).toContain('environ 1,206,920 kWh');
    expect(translated).toContain('transition vers une électricité renouvelable');
    expect(translated).not.toContain('approximately');
    expect(translated).not.toContain('We continue to prioritize');
  });

  it('does not code-switch untouched freeform text via term replacement', () => {
    const source = 'Our renewable energy mix is evolving across the supply chain and supports our human rights commitments.';

    const translated = translateAnswer(source, 'fr');

    expect(translated).toBe(source);
    expect(translated).not.toContain('énergie renouvelable mix');
    expect(translated).not.toContain("chaîne d'approvisionnement");
  });

  it('localizes answer, verifiedAnswer, and draftAnswer independently', () => {
    const [draft] = localizeAnswerDrafts([
      {
        questionText: 'Energy summary',
        answer: 'This information is not currently tracked or reported.',
        verifiedAnswer: 'Our total electricity consumption was 2,321,000 kWh during the reporting period.',
        draftAnswer: 'Data gaps: Scope 3 incomplete. Water pending.',
      },
    ], 'de');

    expect(draft.answer).toBe('Diese Information wird derzeit nicht erfasst oder berichtet.');
    expect(draft.verifiedAnswer).toContain('Unser gesamter Stromverbrauch betrug im Berichtszeitraum 2,321,000 kWh.');
    expect(draft.draftAnswer).toBe('Datenlücken: Scope 3 incomplete. Water pending.');
  });

  it('localizes export titles, uses verified answers, and formats timestamps for the selected locale', () => {
    const generatedAt = '2026-04-21T10:15:00.000Z';
    const expectedFrTimestamp = new Intl.DateTimeFormat('fr-FR', DATE_FORMAT).format(new Date(generatedAt));
    const html = buildHtmlDocument([
      {
        questionText: 'Energy summary',
        answer: 'This information is not currently tracked or reported.',
        verifiedAnswer: '52% of our electricity for 2025 was sourced from renewable energy. Out of 2,321,000 kWh total consumption, approximately 1,206,920 kWh was renewable. We are on track to further increase renewable procurement across our operations.',
        draftAnswer: 'Suggested fallback draft.',
        supportLevel: 'supported',
        dataCoverage: 'complete',
      },
    ], {
      companyName: 'Acme',
      framework: 'VSME',
      reportingPeriod: '2025',
      generatedAt,
      language: 'fr',
    });

    const word = buildHtmlDocument([
      {
        questionText: 'Energy summary',
        answer: 'This information is not currently tracked or reported.',
        verifiedAnswer: '52% of our electricity for 2025 was sourced from renewable energy.',
        supportLevel: 'supported',
        dataCoverage: 'complete',
      },
    ], {
      companyName: 'Acme',
      generatedAt,
      language: 'fr',
    }, 'Réponses au questionnaire (Word)');

    exportAnswersAsHtml([
      {
        questionText: 'Energy summary',
        answer: 'This information is not currently tracked or reported.',
        verifiedAnswer: '52% of our electricity for 2025 was sourced from renewable energy. Out of 2,321,000 kWh total consumption, approximately 1,206,920 kWh was renewable. We are on track to further increase renewable procurement across our operations.',
        supportLevel: 'supported',
        dataCoverage: 'complete',
      },
    ], {
      companyName: 'Acme',
      framework: 'VSME',
      reportingPeriod: '2025',
      generatedAt,
      language: 'fr',
    });

    exportAnswersAsWord([
      {
        questionText: 'Energy summary',
        answer: 'This information is not currently tracked or reported.',
        verifiedAnswer: '52% of our electricity for 2025 was sourced from renewable energy.',
        supportLevel: 'supported',
        dataCoverage: 'complete',
      },
    ], {
      companyName: 'Acme',
      generatedAt,
      language: 'fr',
    });

    expect(saveAs).toHaveBeenCalledTimes(2);
    expect(saveAs.mock.calls[0][1]).toBe('acme-esg-responses.html');

    expect(html).toContain('<title>Acme - Réponses au questionnaire</title>');
    expect(html).not.toContain('Réponses au questionnaire (Word)');
    expect(html).not.toContain('Réponses au questionnaire (impression/PDF)');
    expect(html).toContain(`<p><strong>Généré:</strong> ${expectedFrTimestamp}</p>`);
    expect(html).toContain('Couverture');
    expect(html).toContain('Sur une consommation totale de 2,321,000 kWh');
    expect(html).not.toContain("Cette information n'est actuellement ni suivie ni publiée.");
    expect(html).not.toContain('Questionnaire Responses');

    expect(word).toContain('<title>Acme - Réponses au questionnaire (Word)</title>');
    expect(word).not.toContain('Questionnaire Responses (Word)');
  });

  it('throws a clear error when print preview is popup-blocked', () => {
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    const open = vi.fn(() => null);

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    vi.stubGlobal('window', {
      ...window,
      open,
      setTimeout: vi.fn(),
    });

    expect(() => printAnswersAsPdf([
      {
        questionText: 'Energy summary',
        answer: 'This information is not currently tracked or reported.',
        supportLevel: 'draft',
        dataCoverage: 'missing',
      },
    ], {
      companyName: 'Acme',
      language: 'de',
    })).toThrow('Popup blocked. Allow popups to open print preview.');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('blob:test', '_blank');
  });
});

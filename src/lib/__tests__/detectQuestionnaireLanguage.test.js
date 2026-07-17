import { describe, expect, it } from 'vitest';
import { detectQuestionnaireLanguage } from '../questionnaireLanguage';

const q = (...texts) => texts.map((text, i) => ({ id: String(i), text }));

describe('detectQuestionnaireLanguage', () => {
  it('reads a German questionnaire as German', () => {
    expect(detectQuestionnaireLanguage(q(
      'Wie hoch war Ihr gesamter Stromverbrauch im Berichtsjahr (in kWh)?',
      'Verfügen Sie über einen Lieferanten-Verhaltenskodex?',
      'Wie viele arbeitsbedingte Unfälle wurden im letzten Berichtsjahr verzeichnet?',
    ))).toBe('de');
  });

  it('reads an English questionnaire as English', () => {
    expect(detectQuestionnaireLanguage(q(
      'How does your organization define short-, medium-, and long-term time horizons?',
      'Have you identified any environmental risks which have had a substantive effect?',
      'Provide an overview and introduction to your organization.',
    ))).toBe('en');
  });

  // The case that motivated this: a German supplier answering an English CDP questionnaire in
  // German. Keying off the answer-language setting would wrongly declare this German and let
  // the German lexicon rewrite English questions.
  it('reads an English questionnaire as English regardless of the answer language', () => {
    expect(detectQuestionnaireLanguage(q(
      'What were your organization’s gross global Scope 1 emissions in metric tons CO2e?',
      'Do you provide personal protective equipment to all workers?',
      'Is there board-level oversight of environmental issues within your organization?',
    ))).toBe('en');
  });

  // Terse metric cells carry no function words at all — the reason per-cell detection was
  // rejected. Aggregated over a document there is still enough signal.
  it('handles a terse German questionnaire', () => {
    expect(detectQuestionnaireLanguage(q(
      'Abfall gesamt (t)',
      'Welche Zertifizierungen haben Sie?',
      'Wie ist der Anteil erneuerbarer Energien?',
    ))).toBe('de');
  });

  it('falls back to English on empty or unreadable input', () => {
    expect(detectQuestionnaireLanguage([])).toBe('en');
    expect(detectQuestionnaireLanguage(q('12345', '(t)', ''))).toBe('en');
    expect(detectQuestionnaireLanguage(q(null))).toBe('en');
  });
});

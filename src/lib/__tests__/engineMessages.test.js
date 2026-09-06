import { describe, expect, it } from 'vitest';
import { localizeEngineMessage, localizeEngineMessages } from '../engineMessages';
import { t as translate, UI_LANGUAGES, licenseErrorMessage } from '../i18n';
import { LANGUAGES, isOfferedAnswerLanguage } from '../translations';

const de = (key, vars) => translate(key, 'de', vars);
const en = (key, vars) => translate(key, 'en', vars);

// The literal strings response-ready emits today. If an engine wave rewords one,
// the matching test fails here rather than the user quietly getting English back.
const ENGINE = {
  legacyDoc: 'Legacy .doc format is not supported. Please save the file as .docx and try again.',
  unsupported: 'Unsupported file format: .pages. Please upload an Excel (.xlsx), CSV, PDF, or Word (.docx) file.',
  noQuestions: 'No questions could be extracted from the document. Make sure the file contains questionnaire items.',
  noneForMapping: 'No questions found with the selected column mapping.',
  noColumn: 'Could not identify question column. Try renaming the header to "Question" or use manual column mapping.',
  noSheets: 'No sheets found in file',
  tooMany: 'Extracted 412 questions — this seems high. Review the results and consider using manual column mapping if needed.',
  pdf: 'Failed to parse PDF: stream ended unexpectedly',
  word: 'Failed to parse Word document: central directory not found',
};

describe('localizeEngineMessage', () => {
  it('translates every parse error the engine can raise', () => {
    for (const message of Object.values(ENGINE)) {
      const german = localizeEngineMessage(message, de);
      expect(german, message).not.toBe(message);
      expect(german).not.toMatch(/\[\[/); // no missing-key placeholder
    }
  });

  it('names the format the user actually tried to upload', () => {
    expect(localizeEngineMessage(ENGINE.unsupported, en)).toContain('.pages');
    expect(localizeEngineMessage(ENGINE.unsupported, de)).toContain('.pages');
  });

  it('keeps the count and the underlying reason', () => {
    expect(localizeEngineMessage(ENGINE.tooMany, de)).toContain('412');
    expect(localizeEngineMessage(ENGINE.pdf, de)).toContain('stream ended unexpectedly');
  });

  it('passes an unrecognized message through rather than swallowing it', () => {
    const unknown = 'Some future engine error we have never seen.';
    expect(localizeEngineMessage(unknown, de)).toBe(unknown);
  });

  it('joins without the doubled full stop the old join(". ") produced', () => {
    const joined = localizeEngineMessages([ENGINE.noColumn, ENGINE.noSheets], en).join(' ');
    expect(joined).not.toMatch(/\.\./);
  });
});

describe('licenseErrorMessage', () => {
  it('answers a German buyer in German for every code license.js can return', () => {
    const codes = [
      'not_found', 'expired', 'disabled', 'limit_reached', 'unrecognized_product',
      'validation_failed', 'invalid_key', 'malformed_key', 'unreachable',
      'no_active_license', 'no_instance', 'deactivation_failed',
    ];
    for (const code of codes) {
      const message = licenseErrorMessage({ code, error: 'English fallback prose.' }, de);
      expect(message, code).not.toBe('English fallback prose.');
      expect(message).not.toMatch(/\[\[/);
    }
  });

  it('falls back to the English sentence when the API sends prose, not a slug', () => {
    const prose = 'license_key not found.';
    expect(licenseErrorMessage({ code: prose, error: prose }, de)).toBe(prose);
  });

  it('still says something when there is neither code nor error', () => {
    expect(licenseErrorMessage({}, de)).toBe(translate('lic.err.invalidKey', 'de'));
  });
});

describe('language pickers only offer what is real', () => {
  it('offers the interface in the two languages that are fully translated', () => {
    expect(UI_LANGUAGES.map((l) => l.code)).toEqual(['en', 'de']);
  });

  it('offers answers only in the languages the engine writes natively', () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(['en', 'de']);
  });

  it('rejects a language saved before the picker was trimmed', () => {
    expect(isOfferedAnswerLanguage('fr')).toBe(false);
    expect(isOfferedAnswerLanguage(undefined)).toBe(false);
    expect(isOfferedAnswerLanguage('de')).toBe(true);
  });
});

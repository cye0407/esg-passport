import { describe, expect, it } from 'vitest';
import { PASSPORT_CHECKOUT_URL, QUESTIONNAIRE_PASS_CHECKOUT_URL, marketingUrl } from '../checkout';

describe('marketingUrl', () => {
  it('sends a German reader to the German page, by its German slug', () => {
    expect(marketingUrl('/passport', 'de')).toBe('https://esgforsuppliers.com/de/passport');
    // The toolkit is not /de/esg-response-toolkit — it shipped with a German slug.
    expect(marketingUrl('/esg-response-toolkit', 'de')).toBe('https://esgforsuppliers.com/de/esg-antwort-toolkit');
  });

  it('leaves every other reader on the English page', () => {
    expect(marketingUrl('/passport', 'en')).toBe('https://esgforsuppliers.com/passport');
    expect(marketingUrl('/passport', undefined)).toBe('https://esgforsuppliers.com/passport');
  });

  it('keeps a path it has no German twin for', () => {
    expect(marketingUrl('/guides', 'de')).toBe('https://esgforsuppliers.com/guides');
  });
});

describe('checkout links', () => {
  it('has one Passport checkout, shared', () => {
    expect(PASSPORT_CHECKOUT_URL).toMatch(/^https:\/\/catyeldi\.lemonsqueezy\.com\/checkout\/buy\//);
  });

  it('has no Questionnaire Pass checkout yet, and says so with an empty string', () => {
    // Deliberate: the €99 tier is built and activatable but not purchasable from
    // inside the app. An empty constant renders nothing; a placeholder URL would
    // be a door that goes nowhere.
    expect(QUESTIONNAIRE_PASS_CHECKOUT_URL).toBe('');
  });
});

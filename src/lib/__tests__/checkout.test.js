import { describe, expect, it, vi } from 'vitest';
import {
  PASSPORT_CHECKOUT_URL,
  QUESTIONNAIRE_PASS_CHECKOUT_URL,
  PASS_PRICE,
  PASSPORT_PRICE,
  checkoutLinkProps,
  openCheckout,
  marketingUrl,
} from '../checkout';

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

  it('has a Questionnaire Pass checkout, and it is not the Passport one', () => {
    expect(QUESTIONNAIRE_PASS_CHECKOUT_URL).toMatch(/^https:\/\/catyeldi\.lemonsqueezy\.com\/checkout\/buy\//);
    // Two products, two checkouts. Selling the Pass through the Passport link would
    // charge €499 for the €99 offer.
    expect(QUESTIONNAIRE_PASS_CHECKOUT_URL).not.toBe(PASSPORT_CHECKOUT_URL);
  });

  it('names both prices in one place', () => {
    expect(PASS_PRICE).toBe('€99');
    expect(PASSPORT_PRICE).toBe('€499');
  });
});

describe('checkout instrumentation', () => {
  // checkout_opened fired from one of eleven checkout links for a year, and the
  // resulting "1 checkout opened" was read as evidence about demand.
  it('gives a real anchor its attributes and tracks without opening a second window', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const props = checkoutLinkProps(PASSPORT_CHECKOUT_URL, 'upgrade_gate', 'free');
    expect(props).toMatchObject({
      href: PASSPORT_CHECKOUT_URL,
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    props.onClick();
    // The browser follows the href; opening as well would give the reader two tabs.
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('opens from a button, and refuses to open nothing', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    openCheckout(QUESTIONNAIRE_PASS_CHECKOUT_URL, 'coverage_report_pass', 'free');
    expect(open).toHaveBeenCalledWith(QUESTIONNAIRE_PASS_CHECKOUT_URL, '_blank', 'noopener,noreferrer');
    open.mockClear();
    openCheckout('', 'somewhere', 'free');
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });
});

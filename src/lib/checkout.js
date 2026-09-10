import { track } from './track';

// ============================================
// Where a buyer goes to pay, and where they go to read
// ============================================
// The Passport checkout UUID was copy-pasted into four components; the €99
// Questionnaire Pass will need one of its own, and four copies is how one place
// gets missed. One module, so adding a price means editing one file.

export const PASSPORT_CHECKOUT_URL =
  'https://catyeldi.lemonsqueezy.com/checkout/buy/d5cb1011-fdd1-4936-afe8-819f53073970';

// The €99 Questionnaire Pass. Live on the marketing site since 2026-09-04 and now
// reachable from inside the app too, so the coverage report can offer the rung that
// actually matches the job in front of the buyer instead of pushing everyone at €499.
export const QUESTIONNAIRE_PASS_CHECKOUT_URL =
  'https://catyeldi.lemonsqueezy.com/checkout/buy/4b9e1f35-b99d-404f-9e98-69471ddee9e4';

// Display prices. The authority is Lemon Squeezy and the marketing site; these exist so
// an offer shown next to a buyer's own numbers can name a price without four components
// each hardcoding their own. If a price changes, it changes in one place here.
export const PASS_PRICE = '€99';
export const PASSPORT_PRICE = '€499';

// Every checkout in the app goes through one of these two. checkout_opened used to
// fire from exactly one of eleven checkout links, which is why a full year of
// analytics recorded a single opened checkout - and why nobody should have read that
// number as evidence about demand.
//
// Two helpers because both shapes exist and each has to stay honest: a real anchor
// keeps middle-click and "open in new tab" working, so it must only TRACK on click,
// never open a second window; a button has no href, so it opens.
export function checkoutLinkProps(url, source, tier) {
  return {
    href: url,
    target: '_blank',
    rel: 'noopener noreferrer',
    onClick: () => track('checkout_opened', { source, from_tier: tier }),
  };
}

export function openCheckout(url, source, tier) {
  if (!url) return;
  track('checkout_opened', { source, from_tier: tier });
  window.open(url, '_blank', 'noopener,noreferrer');
}

const MARKETING_BASE = 'https://esgforsuppliers.com';

// German pages live under /de with German slugs, so a link is not just a locale
// prefix. Pass the English path; unlisted paths keep it.
const DE_PATHS = {
  '/passport': '/de/passport',
  '/esg-response-toolkit': '/de/esg-antwort-toolkit',
};

export function marketingUrl(path, lang) {
  const localized = lang === 'de' ? (DE_PATHS[path] || path) : path;
  return `${MARKETING_BASE}${localized}`;
}

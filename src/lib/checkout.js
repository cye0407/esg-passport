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

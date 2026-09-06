// ============================================
// Where a buyer goes to pay, and where they go to read
// ============================================
// The Passport checkout UUID was copy-pasted into four components; the €99
// Questionnaire Pass will need one of its own, and four copies is how one place
// gets missed. One module, so adding a price means editing one file.

export const PASSPORT_CHECKOUT_URL =
  'https://catyeldi.lemonsqueezy.com/checkout/buy/d5cb1011-fdd1-4936-afe8-819f53073970';

// The €99 Questionnaire Pass has a Lemon Squeezy variant (license.js reads it
// from VITE_QUESTIONNAIRE_PASS_VARIANT_ID) and the tier, entitlements and
// activation path are all live — but no checkout link is wired into the app, so
// nobody can buy one from inside Passport. Fill this in and the Pass becomes
// purchasable wherever the Passport is. Left empty on purpose: a button that
// goes nowhere is worse than no button.
export const QUESTIONNAIRE_PASS_CHECKOUT_URL = '';

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

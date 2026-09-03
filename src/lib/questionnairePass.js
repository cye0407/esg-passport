const QUESTIONNAIRE_PASS_STORAGE_KEY = 'esg_passport_questionnaire_pass_claims_v1';
const STORAGE_VERSION = 1;

export function normalizeQuestionText(text) {
  return String(text || '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en-US');
}

function normalizedQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions
    .map(question => normalizeQuestionText(
      question?.text ?? question?.questionText ?? question?.label,
    ))
    .filter(Boolean);
}

// A compact deterministic local identity, not a security boundary. Two seeded
// 32-bit FNV-1a passes make accidental collisions less likely without retaining
// or transmitting any original questionnaire text.
function fnv1a(value, seed) {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function fingerprintQuestionnaire(questions) {
  const normalized = normalizedQuestions(questions);
  if (normalized.length === 0) return null;
  const identity = normalized.map(text => `${text.length}:${text}`).join('\u001f');
  return `qfp-v1-${normalized.length}-${fnv1a(identity, 0x811c9dc5)}${fnv1a(identity, 0x9e3779b9)}`;
}

function readClaims() {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUESTIONNAIRE_PASS_STORAGE_KEY) || 'null');
    if (parsed?.version !== STORAGE_VERSION || typeof parsed.claims !== 'object') {
      return { version: STORAGE_VERSION, claims: {} };
    }
    return parsed;
  } catch {
    return { version: STORAGE_VERSION, claims: {} };
  }
}

export function getQuestionnairePassClaim(licenseKeyId) {
  if (!licenseKeyId) return null;
  return readClaims().claims[String(licenseKeyId)] || null;
}

export function claimQuestionnaire({ licenseKeyId, fingerprint, displayName, claimedAt }) {
  if (!licenseKeyId || !fingerprint) {
    throw new Error('Questionnaire Pass claim identity is unavailable. Revalidate the license and try again.');
  }

  const state = readClaims();
  const key = String(licenseKeyId);
  const existing = state.claims[key];
  if (existing && existing.fingerprint !== fingerprint) {
    throw new Error('This Questionnaire Pass is already assigned to another questionnaire.');
  }
  if (existing) return existing;

  const claim = {
    fingerprint,
    displayName: String(displayName || 'Customer questionnaire'),
    claimedAt: claimedAt || new Date().toISOString(),
  };
  const updated = {
    version: STORAGE_VERSION,
    claims: { ...state.claims, [key]: claim },
  };
  localStorage.setItem(QUESTIONNAIRE_PASS_STORAGE_KEY, JSON.stringify(updated));

  const persisted = getQuestionnairePassClaim(licenseKeyId);
  if (persisted?.fingerprint !== fingerprint) {
    throw new Error('The Questionnaire Pass claim could not be saved on this device.');
  }
  return persisted;
}

export function getQuestionnairePassDecision({
  tier,
  licenseKeyId,
  questions,
  isBuiltInSample = false,
}) {
  const fingerprint = fingerprintQuestionnaire(questions);
  if (!fingerprint) return { status: 'unusable', fingerprint: null, claim: null };
  if (isBuiltInSample || tier !== 'questionnaire-pass') {
    return { status: 'allowed', fingerprint, claim: null };
  }

  const claim = getQuestionnairePassClaim(licenseKeyId);
  if (!claim) return { status: 'claim-required', fingerprint, claim: null };
  if (claim.fingerprint === fingerprint) return { status: 'allowed', fingerprint, claim };
  return { status: 'blocked', fingerprint, claim };
}

export { QUESTIONNAIRE_PASS_STORAGE_KEY };

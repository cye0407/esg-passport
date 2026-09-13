// ============================================
// ResponseReady — Response Pack
// ============================================
// The company's portable record: what it has already answered, the facts those answers
// rest on, its policies and certificates with their dates, what it rejected, and the
// questionnaire passes it has paid for. One file, owned by the company, opened on any
// machine, deleted by deleting it. No account behind it and no copy anywhere else.
//
// It is the alternative to keeping this in a browser's localStorage, where it survives
// exactly one device and one profile, and the alternative to keeping it on a server,
// which the product exists to refuse.
//
// What is NOT in it, by rule: raw documents (a bill is the confidential thing; only its
// name, hash and which fields came out of it are kept), and any credential (a field whose
// name looks like one is dropped on serialisation, whatever nesting it sits at).
export const RESPONSE_PACK_FORMAT = 'esg-passport-response-pack';
export const RESPONSE_PACK_VERSION = 1;
export const RESPONSE_PACK_EXTENSION = '.responsepack.json';
export const ENCRYPTED_PACK_EXTENSION = '.responsepack.enc';
export const RESPONSE_PACK_README = 'This file is your company\'s response pack: the answers you have approved for customer ' +
    'questionnaires, the facts they rest on, your policies and certificates with their dates, and ' +
    'the questionnaire passes you have paid for. It holds no copies of your documents and no ' +
    'passwords or keys. It is yours: keep it, move it to another computer, or delete it. Nothing ' +
    'in it is stored anywhere else.';
export class ResponsePackError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ResponsePackError';
    }
}
// ---- identity
export function normalizeAnswerKey(question) {
    return question
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .replace(/%/g, ' percent ')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/** Deterministic, short, content-free: used for rejection records, never for security. */
export function hashText(text) {
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
        h2 = Math.imul(h2 ^ c, 0x01000193) >>> 0;
    }
    return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}
// ---- create / serialise / parse
const SECRET_NAME = /(api[-_]?key|secret|password|passphrase|token|credential|bearer|licen[cs]e[-_]?key)/i;
function stripSecrets(value) {
    if (Array.isArray(value))
        return value.map(stripSecrets);
    if (value !== null && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            if (SECRET_NAME.test(k))
                continue;
            out[k] = stripSecrets(v);
        }
        return out;
    }
    return value;
}
export function createResponsePack(init, now = new Date()) {
    const stamp = now.toISOString();
    return {
        _readme: RESPONSE_PACK_README,
        format: RESPONSE_PACK_FORMAT,
        version: RESPONSE_PACK_VERSION,
        createdAt: init.createdAt ?? stamp,
        updatedAt: init.updatedAt ?? stamp,
        company: { ...init.company, reportingPeriods: init.company.reportingPeriods ?? [] },
        facts: init.facts ?? [],
        answers: init.answers ?? [],
        rejected: init.rejected ?? [],
        policies: init.policies ?? [],
        certificates: init.certificates ?? [],
        passClaims: init.passClaims ?? [],
        documents: init.documents ?? [],
    };
}
/** JSON text, readable in any editor, with the readme first and every credential-shaped field removed. */
export function serializeResponsePack(pack) {
    const clean = stripSecrets({ ...pack, _readme: RESPONSE_PACK_README, format: RESPONSE_PACK_FORMAT, version: RESPONSE_PACK_VERSION });
    return JSON.stringify(clean, null, 2) + '\n';
}
export function parseResponsePack(text) {
    let raw;
    try {
        raw = JSON.parse(text);
    }
    catch {
        throw new ResponsePackError('malformed', 'This file is not readable as a response pack.');
    }
    if (!raw || typeof raw !== 'object')
        throw new ResponsePackError('not-a-pack', 'This file is not a response pack.');
    const obj = raw;
    if (obj.format !== RESPONSE_PACK_FORMAT)
        throw new ResponsePackError('not-a-pack', 'This file is not a response pack.');
    if (obj.version !== RESPONSE_PACK_VERSION)
        throw new ResponsePackError('unsupported-version', `This response pack is version ${String(obj.version)}; this app reads version ${RESPONSE_PACK_VERSION}.`);
    const company = (obj.company && typeof obj.company === 'object') ? obj.company : { name: '', reportingPeriods: [] };
    const list = (k) => (Array.isArray(obj[k]) ? obj[k] : []);
    return createResponsePack({
        createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : undefined,
        updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
        company: { name: String(company.name ?? ''), country: company.country, reportingPeriods: Array.isArray(company.reportingPeriods) ? company.reportingPeriods : [] },
        facts: list('facts'), answers: list('answers'), rejected: list('rejected'), policies: list('policies'),
        certificates: list('certificates'), passClaims: list('passClaims'), documents: list('documents'),
    });
}
// ---- merge
function newer(a, b) {
    return (a ?? '') > (b ?? '');
}
/**
 * Import never replaces: facts merge by key + period and the newer approval wins; answers
 * merge by normalised question, the newer wins and the older is kept in its history;
 * rejections, pass claims, certificates and documents are unions; policies merge by id,
 * newer wins. `current` is what this machine already holds; `imported` is the file.
 */
export function mergeResponsePacks(current, imported, now = new Date()) {
    const facts = new Map();
    for (const f of [...current.facts, ...imported.facts]) {
        const k = `${f.key}|${f.period ?? ''}`;
        const have = facts.get(k);
        if (!have || newer(f.approvedAt, have.approvedAt))
            facts.set(k, f);
    }
    const answers = new Map();
    const consider = (a) => {
        const key = a.normalizedKey || normalizeAnswerKey(a.question);
        const have = answers.get(key);
        if (!have) {
            answers.set(key, { ...a, normalizedKey: key });
            return;
        }
        if (have.answer === a.answer && have.approvedAt === a.approvedAt)
            return;
        const [winner, loser] = newer(a.approvedAt, have.approvedAt) ? [a, have] : [have, a];
        const history = [...(winner.history ?? []), { answer: loser.answer, source: loser.source, sourceDate: loser.sourceDate, approvedAt: loser.approvedAt, edited: loser.edited }, ...(loser.history ?? [])]
            .filter((h, i, arr) => arr.findIndex(x => x.answer === h.answer && x.approvedAt === h.approvedAt) === i)
            .sort((x, y) => (y.approvedAt > x.approvedAt ? 1 : -1));
        answers.set(key, { ...winner, normalizedKey: key, history });
    };
    current.answers.forEach(consider);
    imported.answers.forEach(consider);
    const union = (items, id) => {
        const m = new Map();
        for (const it of items)
            if (!m.has(id(it)))
                m.set(id(it), it);
        return [...m.values()];
    };
    const policies = new Map();
    for (const p of [...current.policies, ...imported.policies]) {
        const have = policies.get(p.id);
        if (!have || newer(p.updatedAt, have.updatedAt))
            policies.set(p.id, p);
    }
    return createResponsePack({
        createdAt: [current.createdAt, imported.createdAt].sort()[0],
        updatedAt: now.toISOString(),
        company: {
            name: current.company.name || imported.company.name,
            country: current.company.country ?? imported.company.country,
            reportingPeriods: [...new Set([...current.company.reportingPeriods, ...imported.company.reportingPeriods])].sort(),
        },
        facts: [...facts.values()],
        answers: [...answers.values()],
        rejected: union([...current.rejected, ...imported.rejected], r => `${r.normalizedKey}|${r.priorAnswerHash}`),
        policies: [...policies.values()],
        certificates: union([...current.certificates, ...imported.certificates], c => `${c.name}|${c.issuedOn ?? ''}`),
        passClaims: union([...current.passClaims, ...imported.passClaims], c => `${c.licenceRef}|${c.fingerprint}`),
        documents: union([...current.documents, ...imported.documents], d => d.sha256),
    }, now);
}
// ---- encryption (optional, off by default)
const MAGIC = new TextEncoder().encode('ESGPACK1');
const PBKDF2_ITERATIONS = 210_000;
function subtle() {
    const c = globalThis.crypto;
    if (!c?.subtle)
        throw new ResponsePackError('no-crypto', 'Encryption is not available in this environment.');
    return c.subtle;
}
async function deriveKey(passphrase, salt) {
    const s = subtle();
    const material = await s.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return s.deriveKey({ name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export function isEncryptedPack(bytes) {
    if (bytes.length < MAGIC.length)
        return false;
    for (let i = 0; i < MAGIC.length; i++)
        if (bytes[i] !== MAGIC[i])
            return false;
    return true;
}
/** A passphrase the user will not lose is the only recovery there is; say so before it is set. */
export function passphraseStrength(passphrase) {
    if (passphrase.length < 12)
        return { ok: false, reason: 'too-short' };
    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/, /\s/].filter(r => r.test(passphrase)).length;
    if (kinds < 2)
        return { ok: false, reason: 'one-kind' };
    return { ok: true };
}
/** ESGPACK1 · salt(16) · iv(12) · AES-256-GCM ciphertext of the serialised pack. */
export async function encryptResponsePack(pack, passphrase) {
    const s = subtle();
    const salt = new Uint8Array(16);
    const iv = new Uint8Array(12);
    globalThis.crypto.getRandomValues(salt);
    globalThis.crypto.getRandomValues(iv);
    const key = await deriveKey(passphrase, salt);
    const plain = new TextEncoder().encode(serializeResponsePack(pack));
    const cipher = new Uint8Array(await s.encrypt({ name: 'AES-GCM', iv: iv }, key, plain));
    const out = new Uint8Array(MAGIC.length + salt.length + iv.length + cipher.length);
    out.set(MAGIC, 0);
    out.set(salt, MAGIC.length);
    out.set(iv, MAGIC.length + salt.length);
    out.set(cipher, MAGIC.length + salt.length + iv.length);
    return out;
}
export async function decryptResponsePack(bytes, passphrase) {
    if (!isEncryptedPack(bytes))
        throw new ResponsePackError('not-a-pack', 'This file is not an encrypted response pack.');
    const s = subtle();
    const salt = bytes.slice(MAGIC.length, MAGIC.length + 16);
    const iv = bytes.slice(MAGIC.length + 16, MAGIC.length + 28);
    const cipher = bytes.slice(MAGIC.length + 28);
    const key = await deriveKey(passphrase, salt);
    let plain;
    try {
        plain = await s.decrypt({ name: 'AES-GCM', iv: iv }, key, cipher);
    }
    catch {
        throw new ResponsePackError('wrong-passphrase', 'That passphrase does not open this response pack. There is no other way to open it.');
    }
    return parseResponsePack(new TextDecoder().decode(plain));
}
/** Open a pack from bytes whichever way it was saved. Encrypted without a passphrase → 'encrypted'. */
export async function openResponsePack(bytes, passphrase) {
    if (isEncryptedPack(bytes)) {
        if (!passphrase)
            throw new ResponsePackError('encrypted', 'This response pack is protected with a passphrase.');
        return decryptResponsePack(bytes, passphrase);
    }
    return parseResponsePack(new TextDecoder().decode(bytes));
}
export function responsePackFileName(companyName, encrypted = false) {
    const stem = (companyName || 'company').normalize('NFD').replace(/\p{Mn}/gu, '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'company';
    return `${stem}${encrypted ? ENCRYPTED_PACK_EXTENSION : RESPONSE_PACK_EXTENSION}`;
}
//# sourceMappingURL=responsePack.js.map
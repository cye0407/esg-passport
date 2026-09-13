export declare const RESPONSE_PACK_FORMAT = "esg-passport-response-pack";
export declare const RESPONSE_PACK_VERSION = 1;
export declare const RESPONSE_PACK_EXTENSION = ".responsepack.json";
export declare const ENCRYPTED_PACK_EXTENSION = ".responsepack.enc";
export declare const RESPONSE_PACK_README: string;
export interface PackSource {
    type: 'document' | 'questionnaire' | 'manual';
    name?: string;
    sheet?: string;
    row?: number;
    referenceId?: string;
}
export interface PackFact {
    key: string;
    value: string | number | boolean;
    unit?: string;
    period?: string;
    source?: PackSource;
    approvedAt: string;
}
export interface PackAnswer {
    question: string;
    /** Normalised question text; the identity answers merge on. */
    normalizedKey: string;
    answer: string | number;
    referenceId?: string;
    category?: string;
    source?: PackSource;
    /** ISO date the source questionnaire was completed, when known. */
    sourceDate?: string;
    approvedAt: string;
    edited?: boolean;
    /** Earlier approved answers to the same question, newest first. */
    history?: Array<Pick<PackAnswer, 'answer' | 'source' | 'sourceDate' | 'approvedAt' | 'edited'>>;
}
export interface PackRejection {
    normalizedKey: string;
    /** Hash of the prior answer text that was rejected, so the same suggestion is not made again. */
    priorAnswerHash: string;
    rejectedAt: string;
}
export interface PackPolicy {
    id: string;
    name?: string;
    status: 'available' | 'in_progress' | 'not_available' | 'not_planned';
    adoptedOn?: string;
    reviewDue?: string;
    file?: string;
    updatedAt: string;
}
export interface PackCertificate {
    name: string;
    issuedOn?: string;
    expiresOn?: string;
    issuer?: string;
    file?: string;
}
export interface PackPassClaim {
    /** The licence's identifier as the licence server reports it — not the licence key. */
    licenceRef: string;
    fingerprint: string;
    displayName: string;
    claimedAt: string;
}
export interface PackDocument {
    name: string;
    sha256: string;
    extractedFields: string[];
    addedAt: string;
}
export interface ResponsePack {
    _readme: string;
    format: typeof RESPONSE_PACK_FORMAT;
    version: typeof RESPONSE_PACK_VERSION;
    createdAt: string;
    updatedAt: string;
    company: {
        name: string;
        country?: string;
        reportingPeriods: string[];
    };
    facts: PackFact[];
    answers: PackAnswer[];
    rejected: PackRejection[];
    policies: PackPolicy[];
    certificates: PackCertificate[];
    passClaims: PackPassClaim[];
    documents: PackDocument[];
}
export type PackErrorCode = 'not-a-pack' | 'unsupported-version' | 'malformed' | 'encrypted' | 'wrong-passphrase' | 'no-crypto';
export declare class ResponsePackError extends Error {
    code: PackErrorCode;
    constructor(code: PackErrorCode, message: string);
}
export declare function normalizeAnswerKey(question: string): string;
/** Deterministic, short, content-free: used for rejection records, never for security. */
export declare function hashText(text: string): string;
export declare function createResponsePack(init: Partial<Omit<ResponsePack, '_readme' | 'format' | 'version'>> & {
    company: ResponsePack['company'];
}, now?: Date): ResponsePack;
/** JSON text, readable in any editor, with the readme first and every credential-shaped field removed. */
export declare function serializeResponsePack(pack: ResponsePack): string;
export declare function parseResponsePack(text: string): ResponsePack;
/**
 * Import never replaces: facts merge by key + period and the newer approval wins; answers
 * merge by normalised question, the newer wins and the older is kept in its history;
 * rejections, pass claims, certificates and documents are unions; policies merge by id,
 * newer wins. `current` is what this machine already holds; `imported` is the file.
 */
export declare function mergeResponsePacks(current: ResponsePack, imported: ResponsePack, now?: Date): ResponsePack;
export declare function isEncryptedPack(bytes: Uint8Array): boolean;
/** A passphrase the user will not lose is the only recovery there is; say so before it is set. */
export declare function passphraseStrength(passphrase: string): {
    ok: boolean;
    reason?: 'too-short' | 'one-kind';
};
/** ESGPACK1 · salt(16) · iv(12) · AES-256-GCM ciphertext of the serialised pack. */
export declare function encryptResponsePack(pack: ResponsePack, passphrase: string): Promise<Uint8Array>;
export declare function decryptResponsePack(bytes: Uint8Array, passphrase: string): Promise<ResponsePack>;
/** Open a pack from bytes whichever way it was saved. Encrypted without a passphrase → 'encrypted'. */
export declare function openResponsePack(bytes: Uint8Array, passphrase?: string): Promise<ResponsePack>;
export declare function responsePackFileName(companyName: string, encrypted?: boolean): string;
//# sourceMappingURL=responsePack.d.ts.map
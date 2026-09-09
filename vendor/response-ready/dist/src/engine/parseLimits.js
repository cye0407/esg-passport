// Bounds on what an uploaded questionnaire may cost us before it is parsed.
//
// A questionnaire file arrives from the customer's buyer — it is the least trusted
// input the product has, and it is fed straight into pdf.js, mammoth and SheetJS.
// Until now the only check was the filename extension, and every parser then read
// the whole file, every page, every sheet and every row into memory. A 400MB
// spreadsheet, a PDF with 90,000 pages, or a zip bomb saved as .xlsx would take the
// browser tab down with the customer's unsaved workspace in it. SheetJS also carries
// unpatched prototype-pollution and ReDoS advisories, so the less of an attacker's
// file that reaches it, the better.
//
// These are deliberately generous. A real EcoVadis or CDP questionnaire is a few
// hundred KB with tens to low hundreds of questions; the biggest genuine file seen
// in the corpus is a ~50-page PDF SAQ. Anything past these numbers is a mistake or
// an attack, and in both cases saying so beats hanging.
/** Largest questionnaire we will open at all. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Pages read from a PDF. Beyond this we parse what we have and say we stopped. */
export const MAX_PDF_PAGES = 300;
/** Characters of extracted text handed to the question splitter. */
export const MAX_TEXT_CHARS = 4_000_000;
/** Sheets opened in a workbook. */
export const MAX_SHEETS = 50;
/** Rows read from any one sheet. */
export const MAX_ROWS_PER_SHEET = 50_000;
/** Rows read across the whole workbook. */
export const MAX_TOTAL_ROWS = 200_000;
/** Questions returned. A questionnaire past this is not a questionnaire. */
export const MAX_QUESTIONS = 5_000;
/** Bytes of the file we sniff to check it is what its extension claims. */
const SIGNATURE_BYTES = 8;
function formatMb(bytes) {
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10}MB`;
}
/**
 * Reject a file on size before anything reads it.
 * Returns an error message, or null when the file is within bounds.
 */
export function checkFileSize(file) {
    const size = typeof file?.size === 'number' ? file.size : 0;
    if (size > MAX_FILE_BYTES) {
        return `This file is ${formatMb(size)}, and the largest questionnaire we open is ${formatMb(MAX_FILE_BYTES)}. If this really is a questionnaire, export just the question sheet and try again.`;
    }
    return null;
}
/**
 * Check the file's leading bytes against what its extension claims.
 *
 * Not a security boundary on its own — the parsers still have to be safe — but it
 * catches the cheap cases: an executable or an archive renamed to .xlsx, or an HTML
 * error page a portal served in place of the download. `null` means "consistent, or
 * we cannot tell", so a file is never rejected on a guess.
 */
export function checkSignature(extension, header) {
    const startsWith = (...bytes) => bytes.every((b, i) => header[i] === b);
    // xlsx and docx are ZIP containers; xls is an OLE2 compound file; pdf is %PDF-.
    const isZip = startsWith(0x50, 0x4b); // "PK"
    const isPdf = startsWith(0x25, 0x50, 0x44, 0x46); // "%PDF"
    const isOle2 = startsWith(0xd0, 0xcf, 0x11, 0xe0);
    switch (extension) {
        case 'pdf':
            return isPdf ? null : 'This does not look like a PDF inside, whatever the file is called. Re-export it and try again.';
        case 'docx':
            return isZip ? null : 'This does not look like a Word document inside. If it is an older .doc, save it as .docx first.';
        case 'xlsx':
            return isZip ? null : 'This does not look like an Excel workbook inside. Re-export it as .xlsx and try again.';
        case 'xls':
            // Deliberately unchecked. Plenty of export tools write .xls files that are
            // really CSV or an HTML table, SheetJS reads those correctly, and customers
            // do send them. There is no signature that separates "legacy Excel export"
            // from "not a spreadsheet", so the size and row caps carry this case.
            void isOle2;
            return null;
        default:
            // csv and anything else is text with no reliable signature.
            return null;
    }
}
/**
 * Read the first bytes of a file. Returns an empty array if the file cannot be
 * sliced (a plain object in tests, say), so callers treat it as "cannot tell".
 */
export async function readSignature(file) {
    try {
        const slice = file.slice(0, SIGNATURE_BYTES);
        return new Uint8Array(await slice.arrayBuffer());
    }
    catch {
        return new Uint8Array();
    }
}
/**
 * Truncate extracted text to MAX_TEXT_CHARS.
 * Returns the text and a warning when it was cut, so the caller can tell the user
 * rather than silently reporting on part of their document.
 */
export function capText(text) {
    if (text.length <= MAX_TEXT_CHARS)
        return { text, warning: null };
    return {
        text: text.slice(0, MAX_TEXT_CHARS),
        warning: `This document is unusually long, so only the first ${MAX_TEXT_CHARS.toLocaleString('en-GB')} characters were read. Questions after that point are not included.`,
    };
}
//# sourceMappingURL=parseLimits.js.map
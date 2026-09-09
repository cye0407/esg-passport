/** Largest questionnaire we will open at all. */
export declare const MAX_FILE_BYTES: number;
/** Pages read from a PDF. Beyond this we parse what we have and say we stopped. */
export declare const MAX_PDF_PAGES = 300;
/** Characters of extracted text handed to the question splitter. */
export declare const MAX_TEXT_CHARS = 4000000;
/** Sheets opened in a workbook. */
export declare const MAX_SHEETS = 50;
/** Rows read from any one sheet. */
export declare const MAX_ROWS_PER_SHEET = 50000;
/** Rows read across the whole workbook. */
export declare const MAX_TOTAL_ROWS = 200000;
/** Questions returned. A questionnaire past this is not a questionnaire. */
export declare const MAX_QUESTIONS = 5000;
/**
 * Reject a file on size before anything reads it.
 * Returns an error message, or null when the file is within bounds.
 */
export declare function checkFileSize(file: {
    size?: number;
    name?: string;
}): string | null;
/**
 * Check the file's leading bytes against what its extension claims.
 *
 * Not a security boundary on its own — the parsers still have to be safe — but it
 * catches the cheap cases: an executable or an archive renamed to .xlsx, or an HTML
 * error page a portal served in place of the download. `null` means "consistent, or
 * we cannot tell", so a file is never rejected on a guess.
 */
export declare function checkSignature(extension: string, header: Uint8Array): string | null;
/**
 * Read the first bytes of a file. Returns an empty array if the file cannot be
 * sliced (a plain object in tests, say), so callers treat it as "cannot tell".
 */
export declare function readSignature(file: File): Promise<Uint8Array>;
/**
 * Truncate extracted text to MAX_TEXT_CHARS.
 * Returns the text and a warning when it was cut, so the caller can tell the user
 * rather than silently reporting on part of their document.
 */
export declare function capText(text: string): {
    text: string;
    warning: string | null;
};
//# sourceMappingURL=parseLimits.d.ts.map
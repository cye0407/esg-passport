export interface AnswerWrite {
    sheet: string;
    /** Cell reference as Excel shows it, e.g. "D13". */
    cell: string;
    value: string | number | boolean;
    /** Write even if the cell already holds content. Default false. */
    overwrite?: boolean;
}
export type RefusalReason = 'formula' | 'non-empty' | 'sheet-not-found' | 'bad-cell';
export interface WriteRefusal {
    target: AnswerWrite;
    reason: RefusalReason;
}
export interface WriteReport {
    written: AnswerWrite[];
    refused: WriteRefusal[];
    /** Zip parts whose bytes changed. */
    touchedParts: string[];
    /** True when the workbook holds formulas and was told to recalculate on open. */
    recalcOnOpen: boolean;
}
/** The DOM implementation to parse and serialise XML with. Browsers have one built in. */
export interface XmlDom {
    DOMParser: new () => {
        parseFromString(source: string, mimeType: string): Document;
    };
    XMLSerializer: new () => {
        serializeToString(node: Node): string;
    };
}
export interface WriteOptions {
    dom?: XmlDom;
}
/**
 * Write answers into the workbook and return the new bytes plus a report of what was
 * written, what was refused and why, and which zip parts changed.
 */
export declare function writeAnswersIntoWorkbook(original: ArrayBuffer | Uint8Array, writes: AnswerWrite[], options?: WriteOptions): Promise<{
    bytes: Uint8Array;
    report: WriteReport;
}>;
/** "<name> - completed <YYYY-MM-DD>.xlsx": never the buyer's file name, so theirs survives. */
export declare function completedFileName(originalName: string, date?: Date): string;
//# sourceMappingURL=workbookWriter.d.ts.map
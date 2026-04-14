import type { AnswerDraft, ExportSheetConfig, ExportMetadata } from '../types';
export interface ExportOptions {
    answerDrafts: AnswerDraft[];
    metadata: ExportMetadata;
    customSheets?: ExportSheetConfig[];
    fileName?: string;
}
/**
 * Export answer drafts to a styled Excel workbook and trigger download.
 */
export declare function exportToExcel(opts: ExportOptions): Promise<void>;
/**
 * Build Excel workbook as a buffer (for server-side or programmatic use).
 */
export declare function exportToBuffer(opts: Omit<ExportOptions, 'fileName'>): Promise<Uint8Array>;
//# sourceMappingURL=excelExporter.d.ts.map
import type { ParsedQuestion, ParseResult, ColumnMapping } from '../types';
export declare function trimGuidance(text: string): string;
/**
 * Exported for tests. The PDF and DOCX paths both funnel through here, and the wrap
 * heuristics below it are the whole reason a question arrives complete or truncated —
 * testing them through a generated PDF would test pdf.js, not this.
 */
export declare function questionsFromText(text: string, fileName: string): ParseResult;
export declare function reprocessWithMapping(file: File, manualMapping: ColumnMapping): Promise<ParseResult>;
export declare function parseQuestionFile(file: File): Promise<ParseResult>;
export declare function parseQuestionsFromText(text: string): ParsedQuestion[];
//# sourceMappingURL=questionParser.d.ts.map
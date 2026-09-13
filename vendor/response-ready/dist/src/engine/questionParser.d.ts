import type { ParsedQuestion, ParseResult, ColumnMapping } from '../types';
export declare function trimGuidance(text: string): string;
/**
 * Exported for tests. The PDF and DOCX paths both funnel through here, and the wrap
 * heuristics below it are the whole reason a question arrives complete or truncated —
 * testing them through a generated PDF would test pdf.js, not this.
 */
export declare function questionsFromText(text: string, fileName: string): ParseResult;
/**
 * The user has named the columns. Row one is the header, as it always was for this
 * path; the mapping keys are the same sheet_to_json-style names the app showed them.
 * A named question column is trusted the way a labelled one is (`questionTextFromHeader`
 * is set unless the caller says otherwise), and the answer cell is still looked up by
 * header or by fill.
 */
export declare function reprocessWithMapping(file: File, manualMapping: ColumnMapping): Promise<ParseResult>;
export declare function parseQuestionFile(file: File): Promise<ParseResult>;
export declare function parseQuestionsFromText(text: string): ParsedQuestion[];
//# sourceMappingURL=questionParser.d.ts.map
import type { ParsedQuestion, ParseResult, ColumnMapping } from '../types';
export declare function reprocessWithMapping(file: File, manualMapping: ColumnMapping): Promise<ParseResult>;
export declare function parseQuestionFile(file: File): Promise<ParseResult>;
export declare function parseQuestionsFromText(text: string): ParsedQuestion[];
//# sourceMappingURL=questionParser.d.ts.map
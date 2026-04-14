import type { ParseResult, ParsedQuestion, MatchResult, DataContext, AnswerDraft, GenerationConfig, ClassificationResult, MappingRule } from './types';
import type { DomainPack } from './types/domain-pack';
import type { KeywordMatcherInstance } from './engine/keywordMatcher';
import type { ClassifierInstance } from './engine/questionClassifier';
import type { AnswerGeneratorInstance } from './engine/answerGenerator';
import type { RewriterInstance } from './engine/defensiveRewriter';
import type { ExportOptions } from './engine/excelExporter';
export interface ResponseEngine<TData = Record<string, unknown>, TProfile = Record<string, unknown>> {
    /** Pack identity */
    packName: string;
    packVersion: string;
    parseFile: (file: File) => Promise<ParseResult>;
    parseWithMapping: (file: File, mapping: {
        questionText: string;
        category?: string;
        subcategory?: string;
        referenceId?: string;
        required?: string;
    }) => Promise<ParseResult>;
    parseText: (text: string) => ParsedQuestion[];
    matcher: KeywordMatcherInstance;
    matchQuestion: (question: ParsedQuestion) => MatchResult;
    matchQuestions: (questions: ParsedQuestion[]) => MatchResult[];
    classifier: ClassifierInstance | null;
    classifyQuestion: ((questionId: string, text: string, category?: string) => ClassificationResult) | null;
    classifyQuestions: ((questions: Array<{
        id: string;
        text: string;
        category?: string;
    }>) => ClassificationResult[]) | null;
    retrieveData: (matchResult: MatchResult, data: TData) => DataContext;
    generator: AnswerGeneratorInstance<TProfile>;
    generateDraft: (question: ParsedQuestion, matchResult: MatchResult, dataContext: DataContext, config: GenerationConfig, profile?: TProfile, classification?: ClassificationResult) => AnswerDraft;
    generateDrafts: (questions: ParsedQuestion[], matchResults: MatchResult[], dataContexts: DataContext[], config: GenerationConfig, profile?: TProfile, classifications?: ClassificationResult[]) => AnswerDraft[];
    rewriter: RewriterInstance;
    exportToExcel: (opts: Omit<ExportOptions, 'customSheets'>) => Promise<void>;
    exportToBuffer: (opts: Omit<ExportOptions, 'customSheets' | 'fileName'>) => Promise<Uint8Array>;
    loadCsvRules: (url: string) => Promise<MappingRule[]>;
    buildLLMPrompt: DomainPack<TData, TProfile>['buildLLMPrompt'];
}
/**
 * Create a fully-wired response engine from a domain pack.
 *
 * @example
 * ```ts
 * import { createResponseEngine } from 'response-ready';
 * import { esgDomainPack } from 'response-ready/domain-packs/esg';
 *
 * const engine = createResponseEngine(esgDomainPack);
 * const result = await engine.parseFile(file);
 * const matches = engine.matchQuestions(result.questions);
 * ```
 */
export declare function createResponseEngine<TData = Record<string, unknown>, TProfile = Record<string, unknown>>(pack: DomainPack<TData, TProfile>): ResponseEngine<TData, TProfile>;
//# sourceMappingURL=create.d.ts.map
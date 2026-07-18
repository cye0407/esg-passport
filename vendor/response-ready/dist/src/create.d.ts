import type { ParseResult, ParsedQuestion, MatchResult, DataContext, AnswerDraft, GenerationConfig, ClassificationResult, MappingRule, Lang } from './types';
import type { DomainPack } from './types/domain-pack';
import type { KeywordMatcherInstance, MatchOptions } from './engine/keywordMatcher';
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
    matchQuestion: (question: ParsedQuestion, options?: MatchOptions) => MatchResult;
    matchQuestions: (questions: ParsedQuestion[], options?: MatchOptions) => MatchResult[];
    /** Declare the language of the questionnaire being matched, for calls that don't pass one.
     *  Prefer the per-call `options.language` on matchQuestion(s): this is engine-instance
     *  state, so a declaration made for one questionnaire silently applies to the next batch
     *  that omits its language. Batches with no declaration anywhere are auto-detected. */
    setQuestionLanguage: (lang: Lang) => void;
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
export declare function createResponseEngine<TData = Record<string, unknown>, TProfile = Record<string, unknown>>(pack: DomainPack<TData, TProfile>, options?: {
    questionLanguage?: Lang;
}): ResponseEngine<TData, TProfile>;
//# sourceMappingURL=create.d.ts.map
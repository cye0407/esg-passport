import type { ParsedQuestion, MatchResult, DataContext, AnswerDraft, GenerationConfig, RetrievedDataPoint, AnswerTemplate, ScrubRule, ClassificationResult } from '../types';
import type { MaturityResolver, MatrixGenerator, InformalPracticeHandler, IndustryContextProvider } from '../types/domain-pack';
export declare function val(dataMap: Map<string, RetrievedDataPoint>, field: string): string | number | boolean | null;
export declare function has(dataMap: Map<string, RetrievedDataPoint>, ...fields: string[]): boolean;
export declare function num(dataMap: Map<string, RetrievedDataPoint>, field: string): number;
export declare function str(dataMap: Map<string, RetrievedDataPoint>, field: string): string;
export declare function fmt(n: number): string;
export declare function buildDataMap(context: DataContext): Map<string, RetrievedDataPoint>;
export interface TopicRequirementSpec {
    requiredFields: string[];
    optionalFields?: string[];
    gapDescriptions: Record<string, string>;
}
export interface AnswerGeneratorDeps<TProfile = Record<string, unknown>> {
    templates: AnswerTemplate[];
    frameworkNotes?: Record<string, string>;
    fieldToMetricKey?: Record<string, string>;
    scrubRules?: ScrubRule[];
    /** Per-topic field requirements — used to validate answers and generate gap declarations */
    topicRequirements?: Record<string, TopicRequirementSpec>;
    maturityResolver?: MaturityResolver<TProfile>;
    matrixGenerator?: MatrixGenerator<TProfile>;
    informalPracticeHandler?: InformalPracticeHandler<TProfile>;
    industryContextProvider?: IndustryContextProvider;
}
export interface AnswerGeneratorInstance<TProfile = Record<string, unknown>> {
    generateAnswerDraft: (question: ParsedQuestion, matchResult: MatchResult, dataContext: DataContext, config: GenerationConfig, profile?: TProfile, classification?: ClassificationResult) => AnswerDraft;
    generateAnswerDrafts: (questions: ParsedQuestion[], matchResults: MatchResult[], dataContexts: DataContext[], config: GenerationConfig, profile?: TProfile, classifications?: ClassificationResult[]) => AnswerDraft[];
}
export declare function createAnswerGenerator<TProfile = Record<string, unknown>>(deps: AnswerGeneratorDeps<TProfile>): AnswerGeneratorInstance<TProfile>;
//# sourceMappingURL=answerGenerator.d.ts.map
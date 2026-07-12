import type { DomainPack } from '../types/domain-pack';
import type { AnswerDraft, GenerationConfig, LibraryMatch, MatchResult, ParsedQuestion, Playbook, ResponseLibrary } from '../types';
export type WorkspaceReviewStatus = 'ready' | 'review' | 'data_needed';
export interface PlaybookWorkspaceItem {
    question: ParsedQuestion;
    match: MatchResult;
    draft: AnswerDraft;
    reviewStatus: WorkspaceReviewStatus;
    suggestedOwner?: string;
    libraryMatches: LibraryMatch[];
    sourceReferences: string[];
}
export interface PlaybookWorkspaceMetrics {
    totalQuestions: number;
    readyCount: number;
    reviewCount: number;
    dataNeededCount: number;
    matchedDomains: Record<string, number>;
}
export interface PlaybookWorkspace<TData = Record<string, unknown>> {
    playbook: Playbook;
    packName: string;
    packVersion: string;
    requestText: string;
    data: TData;
    items: PlaybookWorkspaceItem[];
    metrics: PlaybookWorkspaceMetrics;
}
export interface PlaybookWorkspaceOptions<TProfile = Record<string, unknown>> {
    config?: GenerationConfig;
    library?: ResponseLibrary;
    profile?: TProfile;
    today?: string;
}
export declare const DEFAULT_WORKSPACE_GENERATION_CONFIG: GenerationConfig;
export declare function reviewStatusForDraft(draft: AnswerDraft): WorkspaceReviewStatus;
export declare function ownerForDraft(draft: AnswerDraft): string | undefined;
export declare function sourceReferencesForMatches(matches: LibraryMatch[]): string[];
export declare function applyLibraryFallback(draft: AnswerDraft, matches: LibraryMatch[]): AnswerDraft;
export declare function buildWorkspaceMetrics(items: PlaybookWorkspaceItem[]): PlaybookWorkspaceMetrics;
export declare function createPlaybookWorkspace<TData, TProfile = Record<string, unknown>>(playbook: Playbook, pack: DomainPack<TData, TProfile>, requestText: string, data: TData, options?: PlaybookWorkspaceOptions<TProfile>): PlaybookWorkspace<TData>;
//# sourceMappingURL=playbookWorkspace.d.ts.map
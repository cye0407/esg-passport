import type { ResponseLibrary } from '../types';
import { type PromoteAnswerOptions } from './libraryPromotion';
import type { PlaybookWorkspace, PlaybookWorkspaceItem } from './playbookWorkspace';
import type { SourceExtractionResult } from './sourceExtraction';
export type ReviewDecisionStatus = 'approved' | 'needs_info' | 'rejected';
export interface ReviewDecision {
    itemId: string;
    status: ReviewDecisionStatus;
    reviewer?: string;
    note?: string;
    decidedAt: string;
}
export interface ResponseProject<TData = unknown> {
    id: string;
    title: string;
    workspace: PlaybookWorkspace<TData>;
    library: ResponseLibrary;
    extractedSources?: SourceExtractionResult[];
    decisions: ReviewDecision[];
    promotedItemIds: string[];
}
export interface ResponseProjectOptions<TData = unknown> {
    id?: string;
    title?: string;
    workspace: PlaybookWorkspace<TData>;
    library?: ResponseLibrary;
    extractedSources?: SourceExtractionResult[];
    decisions?: ReviewDecision[];
    promotedItemIds?: string[];
}
export interface ReviewDecisionInput {
    itemId: string;
    status: ReviewDecisionStatus;
    reviewer?: string;
    note?: string;
    decidedAt?: string;
}
export interface ResponseProjectSummary {
    totalItems: number;
    ready: number;
    review: number;
    dataNeeded: number;
    approved: number;
    needsInfo: number;
    rejected: number;
    promoted: number;
    libraryItems: number;
    evidenceItems: number;
}
export declare function createResponseProject<TData = unknown>(options: ResponseProjectOptions<TData>): ResponseProject<TData>;
export declare function applyReviewDecision<TData>(project: ResponseProject<TData>, input: ReviewDecisionInput): ResponseProject<TData>;
export declare function latestDecisionForItem<TData>(project: ResponseProject<TData>, item: PlaybookWorkspaceItem): ReviewDecision | undefined;
export declare function promoteApprovedItems<TData>(project: ResponseProject<TData>, options?: PromoteAnswerOptions): ResponseProject<TData>;
export declare function getResponseProjectSummary<TData>(project: ResponseProject<TData>): ResponseProjectSummary;
//# sourceMappingURL=responseProject.d.ts.map
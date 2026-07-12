import type { PlaybookWorkspace, PlaybookWorkspaceItem, WorkspaceReviewStatus } from './playbookWorkspace';
export interface WorkspaceFilter {
    status?: WorkspaceReviewStatus;
    owner?: string;
    domain?: string;
    hasLibraryMatch?: boolean;
    missingEvidence?: boolean;
}
export interface WorkspaceRouteGroup {
    key: string;
    label: string;
    items: PlaybookWorkspaceItem[];
}
export declare function filterWorkspaceItems<TData>(workspace: PlaybookWorkspace<TData>, filter?: WorkspaceFilter): PlaybookWorkspaceItem[];
export declare function groupWorkspaceItemsByOwner<TData>(workspace: PlaybookWorkspace<TData>): WorkspaceRouteGroup[];
export declare function groupWorkspaceItemsByDomain<TData>(workspace: PlaybookWorkspace<TData>): WorkspaceRouteGroup[];
export declare function getWorkspaceRoutingSummary<TData>(workspace: PlaybookWorkspace<TData>): Record<string, number>;
//# sourceMappingURL=workspaceRouting.d.ts.map
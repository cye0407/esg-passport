import type { BusinessLibraryItem, LibraryApprovalStatus, LibraryItemType } from '../types';
import type { PlaybookWorkspaceItem } from './playbookWorkspace';
export interface PromoteAnswerOptions {
    id?: string;
    title?: string;
    type?: LibraryItemType;
    approvalStatus?: LibraryApprovalStatus;
    source?: string;
    reviewedOn?: string;
    expiresOn?: string;
    allowedUseNotes?: string;
}
export declare function promoteWorkspaceItemToLibraryItem(item: PlaybookWorkspaceItem, options?: PromoteAnswerOptions): BusinessLibraryItem;
//# sourceMappingURL=libraryPromotion.d.ts.map
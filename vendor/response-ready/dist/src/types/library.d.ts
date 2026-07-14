export type LibraryItemType = 'approved_answer' | 'company_fact' | 'capability' | 'policy' | 'certification' | 'proof_point' | 'case_study' | 'metric' | 'attachment' | 'prior_response';
export type LibraryApprovalStatus = 'approved' | 'draft' | 'needs_review' | 'expired';
export type EvidenceItemType = 'file' | 'url' | 'policy' | 'certificate' | 'report' | 'screenshot' | 'contract' | 'other';
export interface EvidenceItem {
    id: string;
    title: string;
    type: EvidenceItemType;
    fileRef?: string;
    url?: string;
    owner?: string;
    tags?: string[];
    expiresOn?: string;
    notes?: string;
}
export interface BusinessLibraryItem {
    id: string;
    title: string;
    type: LibraryItemType;
    body: string;
    tags: string[];
    domains?: string[];
    topics?: string[];
    owner?: string;
    approvalStatus: LibraryApprovalStatus;
    source?: string;
    evidenceIds?: string[];
    lastReviewedOn?: string;
    expiresOn?: string;
    allowedUseNotes?: string;
}
export interface ResponseLibrary {
    items: BusinessLibraryItem[];
    evidence?: EvidenceItem[];
}
export interface LibraryMatch {
    item: BusinessLibraryItem;
    score: number;
    matchedTerms: string[];
    evidence: EvidenceItem[];
    reason: string;
}
export interface LibraryMatchOptions {
    limit?: number;
    minScore?: number;
    approvedOnly?: boolean;
    today?: string;
    enforceExpiry?: boolean;
}
//# sourceMappingURL=library.d.ts.map
import type { LibraryApprovalStatus, ResponseLibrary } from '../types';
export type SourceDocumentKind = 'utility_bill' | 'waste_bill' | 'telecom_bill' | 'insurance_bill' | 'cloud_bill' | 'invoice' | 'unknown';
export interface SourceDocumentInput {
    id?: string;
    name: string;
    text: string;
    type?: string;
}
export interface ExtractedSourceFact {
    label: string;
    value: string;
    domain: string;
    topics: string[];
    tags: string[];
}
export interface ExtractedSourceMetric {
    label: string;
    value: number;
    unit: string;
    domain: string;
    topics: string[];
    tags: string[];
}
export interface SourceExtractionResult {
    library: ResponseLibrary;
    documents: Array<{
        sourceId: string;
        name: string;
        kind: SourceDocumentKind;
        facts: ExtractedSourceFact[];
        metrics: ExtractedSourceMetric[];
    }>;
}
export interface SourceExtractionOptions {
    approvalStatus?: LibraryApprovalStatus;
    reviewedOn?: string;
}
export declare function extractLibraryFromSourceDocuments(sources: SourceDocumentInput[], options?: SourceExtractionOptions): SourceExtractionResult;
//# sourceMappingURL=sourceExtraction.d.ts.map
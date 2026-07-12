import type { LibraryApprovalStatus, ResponseLibrary } from '../types';
export interface EsgExtractFieldLike {
    field: string;
    value: number | string;
    unit: string;
    confidence: 'high' | 'medium' | 'low';
    score?: number;
    reasons?: string[];
    normalizedValue?: number | string;
    normalizedUnit?: string;
    source?: {
        page?: number;
        region?: string;
        rawText: string;
    };
    period?: string;
}
export interface EsgExtractionResultLike {
    success: boolean;
    documentType: string;
    provider?: string;
    period?: string;
    fields: EsgExtractFieldLike[];
    gaps?: string[];
    warnings?: string[];
    rawText?: string;
}
export interface EsgExtractLibraryOptions {
    sourceId?: string;
    sourceName?: string;
    approvalStatus?: LibraryApprovalStatus;
    reviewedOn?: string;
}
export declare function libraryFromEsgExtractionResult(result: EsgExtractionResultLike, options?: EsgExtractLibraryOptions): ResponseLibrary;
export declare function mergeResponseLibraries(...libraries: ResponseLibrary[]): ResponseLibrary;
//# sourceMappingURL=esgExtractAdapter.d.ts.map
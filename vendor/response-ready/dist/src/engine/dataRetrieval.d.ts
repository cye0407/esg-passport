import type { MatchResult, DataContext, RetrievedDataPoint } from '../types';
/** Add a data point if the value is present (not undefined, empty, or zero). */
export declare function addIfPresent(points: RetrievedDataPoint[], domain: string, field: string, label: string, value: string | number | undefined, options?: {
    unit?: string;
    period?: string;
    confidence?: 'high' | 'medium' | 'low';
}): void;
/** Deduplicate data points by domain + field. */
export declare function deduplicatePoints(points: RetrievedDataPoint[]): RetrievedDataPoint[];
/** Create an empty DataContext with optional metadata. */
export declare function emptyDataContext(metadata?: Partial<DataContext['metadata']>): DataContext;
/**
 * Retrieve data for a matched question using the domain pack's retrieval function.
 * This is a thin orchestration wrapper — the real logic is in the pack.
 */
export declare function retrieveData<TData>(matchResult: MatchResult, data: TData, retrieveFn: (matchResult: MatchResult, data: TData) => DataContext): DataContext;
//# sourceMappingURL=dataRetrieval.d.ts.map
export declare const SAQ_QUESTIONS: readonly string[];
export type Variant = {
    name: string;
    fileName: string;
    /** Layouts the parser is known to find hardest, flagged so a report can rank them. */
    hard?: boolean;
    render: () => string;
};
export declare const VARIANTS: readonly Variant[];
/** Normalised for comparison: case, punctuation and whitespace are not recall. */
export declare function normalise(text: string): string;
//# sourceMappingURL=parseRecall.data.d.ts.map
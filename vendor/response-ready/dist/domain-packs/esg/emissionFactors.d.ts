export declare const NATURAL_GAS_FACTOR = 0.00202;
export declare const DIESEL_FACTOR = 0.00268;
export declare const GAS_M3_TO_KWH = 10.55;
export declare function getElectricityFactor(country?: string): {
    factor: number;
    isDefault: boolean;
    source: string;
};
export declare function estimateScope1(naturalGasM3?: number, dieselLiters?: number): number | null;
export declare function estimateScope2Location(electricityKwh?: number, country?: string): {
    value: number;
    source: string;
} | null;
export declare function estimateScope2Market(electricityKwh?: number, renewablePercent?: number, country?: string): {
    value: number;
    source: string;
} | null;
export declare const SUPPORTED_COUNTRIES: string[];
//# sourceMappingURL=emissionFactors.d.ts.map
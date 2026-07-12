export type RfpCapabilityStatus = 'live' | 'partial' | 'planned' | 'not_supported';
export interface RfpCapability {
    id: string;
    name: string;
    domain: string;
    status: RfpCapabilityStatus;
    summary: string;
    evidence?: string[];
    owner?: string;
    roadmapNote?: string;
    reusableLanguage?: string;
}
export interface RfpProofPoint {
    name: string;
    domain: string;
    description: string;
    source?: string;
}
export interface ProductOpsRfpData {
    companyName: string;
    productName: string;
    productSummary?: string;
    positioning?: string;
    implementationModel?: string;
    supportModel?: string;
    capabilities: RfpCapability[];
    proofPoints?: RfpProofPoint[];
}
//# sourceMappingURL=types.d.ts.map
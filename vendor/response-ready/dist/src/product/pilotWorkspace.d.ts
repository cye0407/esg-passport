import { type PlaybookWorkspaceItem, type PlaybookWorkspaceMetrics } from './playbookWorkspace';
import type { GenerationConfig, ResponseLibrary } from '../types';
import type { ProductOpsRfpData } from '../../domain-packs/product-ops-rfp';
export type RfpWorkspaceItem = PlaybookWorkspaceItem;
export type RfpPilotMetrics = PlaybookWorkspaceMetrics;
export interface RfpPilotWorkspace {
    productName: string;
    companyName: string;
    items: RfpWorkspaceItem[];
    metrics: RfpPilotMetrics;
    internalPitch: string;
}
export interface RfpWorkspaceOptions {
    config?: GenerationConfig;
    library?: ResponseLibrary;
    today?: string;
}
export declare function buildInternalPilotPitch(data: ProductOpsRfpData): string;
export declare function createProductOpsRfpWorkspace(rfpText: string, data: ProductOpsRfpData, configOrOptions?: GenerationConfig | RfpWorkspaceOptions): RfpPilotWorkspace;
//# sourceMappingURL=pilotWorkspace.d.ts.map
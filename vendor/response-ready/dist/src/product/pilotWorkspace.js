import { getPlaybookById } from '../engine/playbookRegistry';
import { createPlaybookWorkspace, DEFAULT_WORKSPACE_GENERATION_CONFIG, } from './playbookWorkspace';
import { productOpsRfpDomainPack } from '../../domain-packs/product-ops-rfp';
function isWorkspaceOptions(value) {
    return !('useLLM' in value);
}
export function buildInternalPilotPitch(data) {
    return `I have a lightweight RFP response workspace I would like to try with a few sanitized examples. The goal is to use our product operations lens to map RFP requirements back to ${data.productName} capabilities, reusable response language, evidence, and owner review. This is not a process rollout; it is a small internal pilot to see whether we can reduce manual coordination and make sales engineering review faster.`;
}
export function createProductOpsRfpWorkspace(rfpText, data, configOrOptions = DEFAULT_WORKSPACE_GENERATION_CONFIG) {
    const config = isWorkspaceOptions(configOrOptions)
        ? configOrOptions.config || DEFAULT_WORKSPACE_GENERATION_CONFIG
        : configOrOptions;
    const library = isWorkspaceOptions(configOrOptions)
        ? configOrOptions.library
        : undefined;
    const today = isWorkspaceOptions(configOrOptions)
        ? configOrOptions.today
        : undefined;
    const rfpPlaybook = getPlaybookById('rfp-response');
    if (!rfpPlaybook) {
        throw new Error('RFP response playbook is not registered.');
    }
    const workspace = createPlaybookWorkspace(rfpPlaybook, productOpsRfpDomainPack, rfpText, data, {
        config,
        library,
        today,
    });
    return {
        productName: data.productName,
        companyName: data.companyName,
        items: workspace.items,
        metrics: workspace.metrics,
        internalPitch: buildInternalPilotPitch(data),
    };
}
//# sourceMappingURL=pilotWorkspace.js.map
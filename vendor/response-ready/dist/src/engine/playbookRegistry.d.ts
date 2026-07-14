import type { Playbook, PlaybookDetectionInput, PlaybookDetectionResult } from '../types/playbook';
export declare function registerPlaybook(playbook: Playbook): void;
export declare function getRegisteredPlaybooks(): readonly Playbook[];
export declare function getDefaultPlaybooks(): readonly Playbook[];
export declare function getPlaybookById(id: string): Playbook | undefined;
export declare function clearPlaybooks(): void;
export declare function resetPlaybooks(): void;
export declare function scorePlaybooks(input: PlaybookDetectionInput): PlaybookDetectionResult[];
export declare function detectPlaybook(input: PlaybookDetectionInput): PlaybookDetectionResult;
//# sourceMappingURL=playbookRegistry.d.ts.map
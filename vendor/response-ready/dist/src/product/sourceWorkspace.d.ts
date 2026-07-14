import type { DomainPack } from '../types/domain-pack';
import type { Playbook, ResponseLibrary } from '../types';
import type { PlaybookWorkspace, PlaybookWorkspaceOptions } from './playbookWorkspace';
import type { SourceDocumentInput, SourceExtractionOptions, SourceExtractionResult } from './sourceExtraction';
export interface SourceWorkspaceOptions<TProfile = Record<string, unknown>> extends Omit<PlaybookWorkspaceOptions<TProfile>, 'library'> {
    library?: ResponseLibrary;
    sourceExtraction?: SourceExtractionOptions;
}
export interface SourceWorkspaceResult<TData = Record<string, unknown>> {
    workspace: PlaybookWorkspace<TData>;
    extracted: SourceExtractionResult;
    library: ResponseLibrary;
}
export declare function createWorkspaceFromSources<TData, TProfile = Record<string, unknown>>(playbook: Playbook, pack: DomainPack<TData, TProfile>, requestText: string, data: TData, sources: SourceDocumentInput[], options?: SourceWorkspaceOptions<TProfile>): SourceWorkspaceResult<TData>;
//# sourceMappingURL=sourceWorkspace.d.ts.map
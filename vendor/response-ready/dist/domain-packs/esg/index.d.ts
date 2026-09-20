import type { DomainPack } from '../../src/types/domain-pack';
import type { ESGCompanyData } from './dataModel';
import type { ESGCompanyProfile } from './types';
export declare const esgDomainPack: DomainPack<ESGCompanyData, ESGCompanyProfile>;
export type { ESGCompanyData } from './dataModel';
export { ESG_QUESTION_BANK, ESG_BANK_MAPPINGS, getCanonicalQuestion, summarizeLegalBasis } from './questionBank';
export type { CanonicalQuestion, SourceMapping } from './questionBank';
export { matchCanonical, matchCanonicalAll, matchCanonicalBatch } from './questionBank/matcher';
export { renderBankAnswer } from './questionBank/render';
export type { ESGCompanyProfile, InformalPractice, PracticeTopic, MaturityLevel } from './types';
export { SUPPORTED_COUNTRIES } from './emissionFactors';
//# sourceMappingURL=index.d.ts.map
export type PracticeTopic = 'ENVIRONMENT' | 'LABOR' | 'ETHICS' | 'SUPPLY_CHAIN';
export interface InformalPractice {
    id: string;
    topic: PracticeTopic;
    description: string;
    isFormalized: boolean;
}
export type MaturityLevel = 'Emerging' | 'Developing' | 'Established' | 'Leading';
export interface ESGCompanyProfile {
    companyName: string;
    industry: string;
    subIndustry?: string;
    country: string;
    employeeCount: number;
    numberOfSites: number;
    reportingPeriod: string;
    revenueBand: string;
    informalPractices: InformalPractice[];
    maturityLevel: MaturityLevel;
    maturityScore: number;
    completedAt?: string;
}
//# sourceMappingURL=types.d.ts.map
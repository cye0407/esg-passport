import type { MatchResult, DataContext } from '../../src/types';
export interface ESGCompanyData {
    companyName: string;
    /** The registered legal entity (e.g. "Hartmann Präzisionstechnik GmbH"). companyName is the
     *  trading name used in running prose; legal-name questions want this one. */
    legalEntityName?: string;
    /** Explicitly no direct combustion sources: no gas connection and no company vehicles.
     *  Distinct from a missing Scope 1 figure (unknown) and from a measured 0. */
    scope1NotApplicable?: boolean;
    industry?: string;
    country?: string;
    employeeCount?: number;
    numberOfSites?: number;
    revenueBand?: string;
    reportingPeriod?: string;
    /** Month-level provenance for values aggregated into a reporting-year total. */
    dataCoverage?: Record<string, {
        periods: string[];
        monthsCovered: number;
        expectedMonths: number;
        complete: boolean;
    }>;
    yearFounded?: string;
    productsServices?: string;
    operatingCountries?: string;
    ownership?: string;
    parentCompany?: string;
    subsidiaries?: string;
    customerTypes?: string;
    mainMarkets?: string;
    industryMetrics?: Record<string, Record<string, number>>;
    registeredAddress?: string;
    noSignificantFines?: string;
    dataProtectionPolicy?: boolean | 'not_applicable';
    publishesSustainabilityReport?: boolean;
    reportingFramework?: string;
    externalAssurance?: boolean | 'not_applicable';
    assuranceStandard?: string;
    csrdApplicable?: string;
    codeOfConductStatus?: string;
    antiCorruptionStatus?: string;
    humanRightsPolicyStatus?: string;
    humanRightsDueDiligenceStatus?: string;
    supplierCodeStatus?: string;
    supplierCorrectiveActionProcess?: string;
    responsibleSourcingPolicyStatus?: string;
    conflictMineralsStatus?: string;
    cmrtStatus?: string;
    emrtStatus?: string;
    wastewaterTreatmentDetails?: string;
    transportReductionMeasures?: string;
    fleetComposition?: string;
    packagingRecycledContentPercent?: number;
    electricityKwh?: number;
    energySavingsKwh?: number;
    renewablePercent?: number;
    naturalGasM3?: number;
    dieselLiters?: number;
    waterM3?: number;
    waterSourceMunicipalPercent?: number;
    suppliersAssessedPercent?: number;
    scope1Tco2e?: number;
    scope2Tco2e?: number;
    scope3Tco2e?: number;
    scope3Categories?: string;
    businessTravelKm?: number;
    employeeCommuteKm?: number;
    freightTonKm?: number;
    totalWasteKg?: number;
    recyclingPercent?: number;
    hazardousWasteKg?: number;
    femalePercent?: number;
    womenInLeadershipPercent?: number;
    turnoverRate?: number;
    collectiveBargainingPercent?: number;
    livingWageCompliant?: boolean | 'not_applicable';
    grievanceMechanismExists?: boolean;
    grievancesReported?: number;
    newHires?: number;
    trirRate?: number;
    lostTimeIncidents?: number;
    fatalities?: number;
    hoursWorked?: number;
    trainingHoursPerEmployee?: number;
    certifications?: string;
    sustainabilityGoal?: string;
    policies?: Array<{
        id: string;
        name: string;
        category: 'environmental' | 'social' | 'governance';
        exists: boolean;
        status: string;
        isCertification?: boolean;
    }>;
    documents?: Array<{
        name: string;
        category: string;
        validUntil?: string;
        isValid?: boolean;
    }>;
}
export declare function esgRetrieveData(matchResult: MatchResult, data: ESGCompanyData): DataContext;
//# sourceMappingURL=dataModel.d.ts.map
// ============================================
// ESG Domain Pack — Data Model & Retrieval
// ============================================
// Defines the ESG CompanyData shape and the retrieveData function
// that maps matched questions to relevant data points.
import { addIfPresent, deduplicatePoints } from '../../src/engine/dataRetrieval';
import { estimateScope1, estimateScope2Location, estimateScope2Market } from './emissionFactors';
function normalizePassportLikeInput(raw) {
    const anyRaw = raw;
    if (!anyRaw.companyProfile && !Array.isArray(anyRaw.dataRecords))
        return raw;
    const profile = (anyRaw.companyProfile || {});
    const records = Array.isArray(anyRaw.dataRecords) ? anyRaw.dataRecords : [];
    const reportingPeriod = records.length > 0
        ? String(records[records.length - 1]?.period || '').slice(0, 4) || String(profile.baselineYear || '')
        : String(profile.baselineYear || '');
    let electricityKwh = 0;
    let renewablePercentWeighted = 0;
    let renewableWeight = 0;
    let naturalGasKwh = 0;
    let dieselLiters = 0;
    let waterM3 = 0;
    let totalWasteKg = 0;
    let recycledWasteKg = 0;
    let hazardousWasteKg = 0;
    let employeeCount = Number(profile.totalEmployees || 0);
    let femaleEmployees = 0;
    let womenInLeadershipPercent = 0;
    let womenLeadershipCount = 0;
    let grievancesReported = 0;
    let newHires = 0;
    let recordableIncidents = 0;
    let lostTimeIncidents = 0;
    let fatalities = 0;
    let hoursWorked = 0;
    let trainingHours = 0;
    let suppliersAssessedPercent = 0;
    for (const record of records) {
        const energy = (record.energy || {});
        const water = (record.water || {});
        const waste = (record.waste || {});
        const workforce = (record.workforce || {});
        const healthSafety = (record.healthSafety || {});
        const training = (record.training || {});
        const supplyChain = (record.supplyChain || {});
        electricityKwh += Number(energy.electricityKwh || 0);
        naturalGasKwh += Number(energy.naturalGasKwh || 0);
        dieselLiters += Number(energy.vehicleFuelLiters || 0);
        if (energy.electricityKwh && energy.renewablePercent != null) {
            renewablePercentWeighted += Number(energy.electricityKwh) * Number(energy.renewablePercent);
            renewableWeight += Number(energy.electricityKwh);
        }
        waterM3 += Number(water.consumptionM3 || 0);
        totalWasteKg += Number(waste.totalKg || 0);
        recycledWasteKg += Number(waste.recycledKg || 0);
        hazardousWasteKg += Number(waste.hazardousKg || 0);
        employeeCount = Math.max(employeeCount, Number(workforce.totalEmployees || 0));
        femaleEmployees = Math.max(femaleEmployees, Number(workforce.femaleEmployees || 0));
        if (workforce.womenInLeadershipPercent != null) {
            womenInLeadershipPercent += Number(workforce.womenInLeadershipPercent);
            womenLeadershipCount += 1;
        }
        grievancesReported += Number(workforce.grievancesReported || 0);
        newHires += Number(workforce.newHires || 0);
        recordableIncidents += Number(healthSafety.recordableIncidents || 0);
        lostTimeIncidents += Number(healthSafety.lostTimeIncidents || 0);
        fatalities += Number(healthSafety.fatalities || 0);
        hoursWorked += Number(healthSafety.hoursWorked || 0);
        trainingHours += Number(training.trainingHours || 0);
        suppliersAssessedPercent = Math.max(suppliersAssessedPercent, Number(supplyChain.suppliersAssessedPercent || 0));
    }
    const renewablePercent = renewableWeight > 0 ? renewablePercentWeighted / renewableWeight : undefined;
    const recyclingPercent = totalWasteKg > 0 ? (recycledWasteKg / totalWasteKg) * 100 : undefined;
    const femalePercent = employeeCount > 0 ? (femaleEmployees / employeeCount) * 100 : undefined;
    const trirRate = hoursWorked > 0 ? (recordableIncidents / hoursWorked) * 200000 : undefined;
    const trainingHoursPerEmployee = employeeCount > 0 ? trainingHours / employeeCount : undefined;
    return {
        ...raw,
        companyName: String(profile.tradingName || profile.legalName || raw.companyName || ''),
        industry: String(profile.industrySector || raw.industry || ''),
        country: String(profile.countryOfIncorporation || raw.country || ''),
        employeeCount: employeeCount || raw.employeeCount,
        numberOfSites: Number(profile.numberOfFacilities || raw.numberOfSites || 0) || raw.numberOfSites,
        reportingPeriod: reportingPeriod || raw.reportingPeriod,
        certifications: Array.isArray(profile.certifications) ? profile.certifications.join(', ') : raw.certifications,
        publishesSustainabilityReport: profile.publishesSustainabilityReport === 'yes'
            ? true
            : profile.publishesSustainabilityReport === 'no'
                ? false
                : raw.publishesSustainabilityReport,
        electricityKwh: electricityKwh || raw.electricityKwh,
        renewablePercent: renewablePercent ?? raw.renewablePercent,
        naturalGasM3: naturalGasKwh > 0 ? naturalGasKwh / 10.55 : raw.naturalGasM3,
        dieselLiters: dieselLiters || raw.dieselLiters,
        waterM3: waterM3 || raw.waterM3,
        totalWasteKg: totalWasteKg || raw.totalWasteKg,
        recyclingPercent: recyclingPercent ?? raw.recyclingPercent,
        hazardousWasteKg: hazardousWasteKg || raw.hazardousWasteKg,
        femalePercent: femalePercent ?? raw.femalePercent,
        womenInLeadershipPercent: womenLeadershipCount > 0 ? womenInLeadershipPercent / womenLeadershipCount : raw.womenInLeadershipPercent,
        grievancesReported: grievancesReported || raw.grievancesReported,
        newHires: newHires || raw.newHires,
        trirRate: trirRate ?? raw.trirRate,
        lostTimeIncidents: lostTimeIncidents || raw.lostTimeIncidents,
        fatalities: fatalities || raw.fatalities,
        hoursWorked: hoursWorked || raw.hoursWorked,
        trainingHoursPerEmployee: trainingHoursPerEmployee ?? raw.trainingHoursPerEmployee,
        suppliersAssessedPercent: suppliersAssessedPercent || raw.suppliersAssessedPercent,
    };
}
// ============================================
// Data Retrieval
// ============================================
export function esgRetrieveData(matchResult, data) {
    data = normalizePassportLikeInput(data);
    const allDomains = [matchResult.primaryDomain, ...matchResult.secondaryDomains].filter((d) => d !== null);
    const company = [];
    const operational = [];
    const calculated = [];
    const dataGaps = [];
    for (const domain of allDomains) {
        switch (domain) {
            case 'effluents':
            case 'buyer_requirements':
            case 'materials':
            case 'swot':
            case 'external_context':
            case 'packaging':
                // These domains have keyword rules pointing at them but their templates are
                // primarily defensive (use company context as fallback). Surface basic identity
                // so confidence escapes 'unknown' and the template's fallback text can ship.
                addIfPresent(company, domain, 'legalEntityName', 'Company Name', data.companyName);
                addIfPresent(company, domain, 'industryDescription', 'Industry', data.industry);
                addIfPresent(company, domain, 'headquartersCountry', 'Country', data.country);
                addIfPresent(company, domain, 'totalFte', 'Total Employees (FTE)', data.employeeCount);
                addIfPresent(company, domain, 'numberOfSites', 'Number of Sites', data.numberOfSites);
                // Domain-specific extras
                if (domain === 'effluents') {
                    addIfPresent(company, domain, 'waterWithdrawal', 'Water Withdrawal', data.waterM3);
                }
                if (domain === 'materials' || domain === 'buyer_requirements') {
                    addIfPresent(company, domain, 'productsServices', 'Products & Services', data.productsServices);
                    addIfPresent(company, domain, 'mainMarkets', 'Main Markets', data.mainMarkets);
                    if (data.supplierCodeStatus)
                        operational.push({ domain, field: 'supplierCodeStatus', label: 'Supplier Code Status', value: data.supplierCodeStatus, confidence: 'high' });
                    if (data.responsibleSourcingPolicyStatus)
                        operational.push({ domain, field: 'responsibleSourcingPolicyStatus', label: 'Responsible Sourcing Policy Status', value: data.responsibleSourcingPolicyStatus, confidence: 'high' });
                    if (data.conflictMineralsStatus)
                        operational.push({ domain, field: 'conflictMineralsStatus', label: 'Conflict Minerals Due Diligence Status', value: data.conflictMineralsStatus, confidence: 'high' });
                    if (data.cmrtStatus)
                        operational.push({ domain, field: 'cmrtStatus', label: 'CMRT Status', value: data.cmrtStatus, confidence: 'high' });
                    if (data.emrtStatus)
                        operational.push({ domain, field: 'emrtStatus', label: 'EMRT Status', value: data.emrtStatus, confidence: 'high' });
                }
                if (domain === 'buyer_requirements' && data.suppliersAssessedPercent !== undefined) {
                    operational.push({ domain: 'buyer_requirements', field: 'suppliersAssessedPercent', label: 'Suppliers ESG-Assessed', value: data.suppliersAssessedPercent, unit: '%', confidence: 'high' });
                }
                break;
            case 'products':
                addIfPresent(company, 'products', 'legalEntityName', 'Company Name', data.companyName);
                addIfPresent(company, 'products', 'industryDescription', 'Industry', data.industry);
                addIfPresent(company, 'products', 'headquartersCountry', 'Country', data.country);
                addIfPresent(company, 'products', 'totalFte', 'Total Employees (FTE)', data.employeeCount);
                addIfPresent(company, 'products', 'productsServices', 'Products & Services', data.productsServices);
                addIfPresent(company, 'products', 'mainMarkets', 'Main Markets', data.mainMarkets);
                addIfPresent(company, 'products', 'customerTypes', 'Customer Types', data.customerTypes);
                addIfPresent(company, 'products', 'operatingCountries', 'Operating Countries', data.operatingCountries);
                if (!data.productsServices && !data.mainMarkets) {
                    dataGaps.push('No products/services description');
                }
                break;
            case 'company':
            case 'site':
                addIfPresent(company, 'company', 'legalEntityName', 'Company Name', data.companyName);
                addIfPresent(company, 'company', 'registeredAddress', 'Registered Address', data.registeredAddress);
                addIfPresent(company, 'company', 'industryDescription', 'Industry', data.industry);
                addIfPresent(company, 'company', 'headquartersCountry', 'Country', data.country);
                addIfPresent(company, 'company', 'totalFte', 'Total Employees (FTE)', data.employeeCount);
                addIfPresent(company, 'company', 'numberOfSites', 'Number of Sites', data.numberOfSites);
                addIfPresent(company, 'company', 'revenueBand', 'Revenue Band', data.revenueBand);
                addIfPresent(company, 'company', 'reportingPeriod', 'Reporting Period', data.reportingPeriod);
                addIfPresent(company, 'company', 'yearFounded', 'Year Founded', data.yearFounded);
                addIfPresent(company, 'company', 'productsServices', 'Products & Services', data.productsServices);
                addIfPresent(company, 'company', 'operatingCountries', 'Operating Countries', data.operatingCountries);
                addIfPresent(company, 'company', 'ownership', 'Ownership Structure', data.ownership);
                addIfPresent(company, 'company', 'parentCompany', 'Parent Company', data.parentCompany);
                addIfPresent(company, 'company', 'subsidiaries', 'Subsidiaries', data.subsidiaries);
                addIfPresent(company, 'company', 'ownershipStructure', 'Ownership Structure', data.ownership);
                addIfPresent(company, 'company', 'customerTypes', 'Customer Types', data.customerTypes);
                addIfPresent(company, 'company', 'mainMarkets', 'Main Markets', data.mainMarkets);
                break;
            case 'energy_electricity':
                if (data.electricityKwh != null && data.electricityKwh >= 0) {
                    operational.push({ domain: 'energy_electricity', field: 'totalElectricity', label: 'Total Electricity Consumption', value: data.electricityKwh, unit: 'kWh', period: data.reportingPeriod, confidence: 'high' });
                    if (data.renewablePercent !== undefined) {
                        operational.push({ domain: 'energy_electricity', field: 'renewablePercent', label: 'Renewable Electricity', value: data.renewablePercent, unit: '%', confidence: 'high' });
                    }
                    if (data.energySavingsKwh)
                        operational.push({ domain: 'energy_electricity', field: 'energySavingsKwh', label: 'Energy Savings Achieved', value: data.energySavingsKwh, unit: 'kWh', confidence: 'high' });
                }
                else {
                    dataGaps.push('No electricity consumption data');
                }
                break;
            case 'energy_fuel':
                if (data.naturalGasM3)
                    operational.push({ domain: 'energy_fuel', field: 'fuel_natural_gas', label: 'Natural Gas Consumption', value: data.naturalGasM3, unit: 'm3', confidence: 'high' });
                if (data.dieselLiters)
                    operational.push({ domain: 'energy_fuel', field: 'fuel_diesel', label: 'Diesel Consumption', value: data.dieselLiters, unit: 'L', confidence: 'high' });
                if (!data.naturalGasM3 && !data.dieselLiters)
                    dataGaps.push('No fuel consumption data');
                break;
            case 'energy_water':
                if (data.waterM3) {
                    operational.push({ domain: 'energy_water', field: 'waterWithdrawal', label: 'Water Withdrawal', value: data.waterM3, unit: 'm3', confidence: 'high' });
                    if (data.waterSourceMunicipalPercent !== undefined)
                        operational.push({ domain: 'energy_water', field: 'waterSourceMunicipalPercent', label: 'Municipal Water Supply', value: data.waterSourceMunicipalPercent, unit: '%', confidence: 'high' });
                }
                else {
                    dataGaps.push('No water consumption data');
                }
                break;
            case 'emissions': {
                if (data.scope1Tco2e !== undefined) {
                    calculated.push({ domain: 'emissions', field: 'scope1Estimate', label: 'Scope 1 Emissions (User Provided)', value: data.scope1Tco2e, unit: 'tCO2e', confidence: 'high' });
                }
                else {
                    const scope1 = estimateScope1(data.naturalGasM3, data.dieselLiters);
                    if (scope1 !== null) {
                        calculated.push({ domain: 'emissions', field: 'scope1Estimate', label: 'Scope 1 Emissions (Auto-calculated)', value: scope1, unit: 'tCO2e', confidence: 'medium' });
                    }
                    else {
                        dataGaps.push('No fuel data for Scope 1 calculation — enter natural gas or diesel consumption');
                    }
                }
                if (data.scope2Tco2e !== undefined) {
                    calculated.push({ domain: 'emissions', field: 'scope2Location', label: 'Scope 2 Emissions (User Provided)', value: data.scope2Tco2e, unit: 'tCO2e', confidence: 'high' });
                }
                else {
                    const scope2Location = estimateScope2Location(data.electricityKwh, data.country);
                    if (scope2Location) {
                        calculated.push({ domain: 'emissions', field: 'scope2Location', label: `Scope 2 Location-Based (Auto-calculated — ${scope2Location.source})`, value: scope2Location.value, unit: 'tCO2e', confidence: 'medium' });
                    }
                    else {
                        dataGaps.push('No electricity data for Scope 2 calculation — enter electricity consumption');
                    }
                    const scope2Market = estimateScope2Market(data.electricityKwh, data.renewablePercent, data.country);
                    if (scope2Market) {
                        calculated.push({ domain: 'emissions', field: 'scope2Market', label: `Scope 2 Market-Based (Auto-calculated — ${scope2Market.source})`, value: scope2Market.value, unit: 'tCO2e', confidence: 'medium' });
                    }
                }
                break;
            }
            case 'transport': {
                addIfPresent(company, 'transport', 'industryDescription', 'Industry', data.industry);
                addIfPresent(company, 'transport', 'totalFte', 'Total Employees (FTE)', data.employeeCount);
                addIfPresent(company, 'transport', 'productsServices', 'Products & Services', data.productsServices);
                if (data.scope3Tco2e !== undefined) {
                    calculated.push({ domain: 'transport', field: 'scope3Total', label: 'Scope 3 Emissions (User Provided)', value: data.scope3Tco2e, unit: 'tCO2e', confidence: 'high' });
                }
                if (data.scope3Categories) {
                    operational.push({ domain: 'transport', field: 'scope3Categories', label: 'Scope 3 Categories Reported', value: data.scope3Categories, confidence: 'high' });
                }
                if (data.businessTravelKm)
                    operational.push({ domain: 'transport', field: 'businessTravel', label: 'Business Travel', value: data.businessTravelKm, unit: 'km', confidence: 'high' });
                if (data.employeeCommuteKm)
                    operational.push({ domain: 'transport', field: 'employeeCommute', label: 'Employee Commuting', value: data.employeeCommuteKm, unit: 'km', confidence: 'high' });
                if (data.freightTonKm)
                    operational.push({ domain: 'transport', field: 'freightTransport', label: 'Freight Transport', value: data.freightTonKm, unit: 'ton-km', confidence: 'high' });
                if (!data.scope3Tco2e && !data.businessTravelKm && !data.employeeCommuteKm && !data.freightTonKm) {
                    dataGaps.push('No Scope 3 / transport data');
                }
                break;
            }
            case 'waste':
                if (data.totalWasteKg) {
                    operational.push({ domain: 'waste', field: 'totalWaste', label: 'Total Waste Generated', value: data.totalWasteKg, unit: 'kg', confidence: 'high' });
                    if (data.recyclingPercent !== undefined)
                        operational.push({ domain: 'waste', field: 'diversionRate', label: 'Waste Diversion Rate', value: data.recyclingPercent, unit: '%', confidence: 'high' });
                    if (data.hazardousWasteKg)
                        operational.push({ domain: 'waste', field: 'hazardousWaste', label: 'Hazardous Waste', value: data.hazardousWasteKg, unit: 'kg', confidence: 'high' });
                }
                else {
                    dataGaps.push('No waste data');
                }
                break;
            case 'workforce':
                addIfPresent(company, 'workforce', 'industryDescription', 'Industry', data.industry);
                addIfPresent(company, 'workforce', 'headquartersCountry', 'Country', data.country);
                addIfPresent(company, 'workforce', 'legalEntityName', 'Company Name', data.companyName);
                addIfPresent(company, 'workforce', 'ownershipStructure', 'Ownership Structure', data.ownership);
                addIfPresent(operational, 'workforce', 'totalFte', 'Total FTE', data.employeeCount);
                if (data.femalePercent !== undefined)
                    operational.push({ domain: 'workforce', field: 'femalePercent', label: 'Female Employees', value: data.femalePercent, unit: '%', confidence: 'high' });
                if (data.womenInLeadershipPercent !== undefined)
                    operational.push({ domain: 'workforce', field: 'womenInLeadershipPercent', label: 'Women in Leadership', value: data.womenInLeadershipPercent, unit: '%', confidence: 'high' });
                if (data.turnoverRate !== undefined)
                    operational.push({ domain: 'workforce', field: 'turnoverRate', label: 'Employee Turnover Rate', value: data.turnoverRate, unit: '%', confidence: 'high' });
                if (data.collectiveBargainingPercent !== undefined)
                    operational.push({ domain: 'workforce', field: 'collectiveBargainingPercent', label: 'Collective Bargaining Coverage', value: data.collectiveBargainingPercent, unit: '%', confidence: 'high' });
                if (data.livingWageCompliant !== undefined)
                    operational.push({ domain: 'workforce', field: 'livingWageCompliant', label: 'Living Wage Compliance', value: data.livingWageCompliant === 'not_applicable' ? 'Not applicable' : (data.livingWageCompliant ? 'Yes' : 'No'), confidence: 'high' });
                if (data.humanRightsPolicyStatus)
                    operational.push({ domain: 'workforce', field: 'humanRightsPolicyStatus', label: 'Human Rights Policy Status', value: data.humanRightsPolicyStatus, confidence: 'high' });
                if (data.grievanceMechanismExists !== undefined)
                    operational.push({ domain: 'workforce', field: 'grievanceMechanismExists', label: 'Grievance Mechanism', value: data.grievanceMechanismExists === 'not_applicable' ? 'Not applicable' : (data.grievanceMechanismExists ? 'Yes' : 'No'), confidence: 'high' });
                if (data.grievancesReported !== undefined)
                    operational.push({ domain: 'workforce', field: 'grievancesReported', label: 'Grievances Reported', value: data.grievancesReported, confidence: 'high' });
                if (data.newHires !== undefined)
                    operational.push({ domain: 'workforce', field: 'newHires', label: 'New Hires', value: data.newHires, confidence: 'high' });
                if (!data.employeeCount)
                    dataGaps.push('No workforce data');
                break;
            case 'health_safety':
                addIfPresent(company, 'health_safety', 'industryDescription', 'Industry', data.industry);
                addIfPresent(company, 'health_safety', 'legalEntityName', 'Company Name', data.companyName);
                if (data.trirRate !== undefined)
                    operational.push({ domain: 'health_safety', field: 'trir', label: 'TRIR', value: data.trirRate, confidence: 'high' });
                if (data.lostTimeIncidents !== undefined)
                    operational.push({ domain: 'health_safety', field: 'lostTimeIncidents', label: 'Lost Time Incidents', value: data.lostTimeIncidents, confidence: 'high' });
                if (data.fatalities !== undefined)
                    operational.push({ domain: 'health_safety', field: 'fatalities', label: 'Fatalities', value: data.fatalities, confidence: 'high' });
                if (data.hoursWorked !== undefined)
                    operational.push({ domain: 'health_safety', field: 'totalHoursWorked', label: 'Total Hours Worked', value: data.hoursWorked, confidence: 'high' });
                break;
            case 'training':
                if (data.trainingHoursPerEmployee !== undefined) {
                    operational.push({ domain: 'training', field: 'trainingHoursPerEmployee', label: 'Training Hours per Employee', value: data.trainingHoursPerEmployee, unit: 'hours', confidence: 'high' });
                    if (data.employeeCount) {
                        operational.push({ domain: 'training', field: 'totalTrainingHours', label: 'Total Training Hours', value: data.trainingHoursPerEmployee * data.employeeCount, unit: 'hours', confidence: 'high' });
                    }
                }
                break;
            case 'regulatory':
            case 'goals':
                addIfPresent(company, 'company', 'legalEntityName', 'Company Name', data.companyName);
                addIfPresent(company, 'company', 'industryDescription', 'Industry', data.industry);
                addIfPresent(company, 'company', 'headquartersCountry', 'Country', data.country);
                addIfPresent(company, 'company', 'totalFte', 'Total Employees (FTE)', data.employeeCount);
                addIfPresent(company, 'company', 'revenueBand', 'Revenue Band', data.revenueBand);
                if (data.certifications)
                    company.push({ domain: 'regulatory', field: 'certificationsHeld', label: 'Certifications Held', value: data.certifications, confidence: 'high' });
                if (data.sustainabilityGoal)
                    company.push({ domain: 'goals', field: 'primaryGoal', label: 'Sustainability Goal', value: data.sustainabilityGoal, confidence: 'high' });
                // Governance flags
                if (data.noSignificantFines)
                    operational.push({ domain: 'goals', field: 'noSignificantFines', label: 'Fines/Sanctions Status', value: data.noSignificantFines, confidence: 'high' });
                if (data.codeOfConductStatus)
                    operational.push({ domain: 'goals', field: 'codeOfConductStatus', label: 'Code of Conduct Status', value: data.codeOfConductStatus, confidence: 'high' });
                if (data.antiCorruptionStatus)
                    operational.push({ domain: 'goals', field: 'antiCorruptionStatus', label: 'Anti-Corruption Policy Status', value: data.antiCorruptionStatus, confidence: 'high' });
                if (data.dataProtectionPolicy !== undefined)
                    operational.push({ domain: 'goals', field: 'dataProtectionPolicy', label: 'Data Protection Policy', value: data.dataProtectionPolicy === 'not_applicable' ? 'Not applicable' : (data.dataProtectionPolicy ? 'Yes' : 'No'), confidence: 'high' });
                if (data.publishesSustainabilityReport !== undefined)
                    operational.push({ domain: 'regulatory', field: 'publishesSustainabilityReport', label: 'Publishes Sustainability Report', value: data.publishesSustainabilityReport === 'not_applicable' ? 'Not applicable' : (data.publishesSustainabilityReport ? 'Yes' : 'No'), confidence: 'high' });
                if (data.reportingFramework)
                    operational.push({ domain: 'regulatory', field: 'reportingFramework', label: 'Reporting Framework', value: data.reportingFramework, confidence: 'high' });
                if (data.externalAssurance !== undefined)
                    operational.push({ domain: 'regulatory', field: 'externalAssurance', label: 'External Assurance', value: data.externalAssurance === 'not_applicable' ? 'Not applicable' : (data.externalAssurance ? 'Yes' : 'No'), confidence: 'high' });
                if (data.assuranceStandard)
                    operational.push({ domain: 'regulatory', field: 'assuranceStandard', label: 'Assurance Standard', value: data.assuranceStandard, confidence: 'high' });
                if (data.csrdApplicable)
                    operational.push({ domain: 'regulatory', field: 'csrdApplicable', label: 'CSRD Applicability', value: data.csrdApplicable, confidence: 'high' });
                break;
            case 'financial_context':
                addIfPresent(company, 'financial_context', 'revenueBand', 'Revenue Band', data.revenueBand);
                break;
        }
    }
    // ---- Policy & document evidence injection ----
    // Maps policy categories to the operational domains they support
    const POLICY_CATEGORY_DOMAINS = {
        environmental: ['energy_electricity', 'energy_fuel', 'energy_water', 'emissions', 'waste', 'transport'],
        social: ['workforce', 'health_safety', 'training'],
        governance: ['regulatory', 'goals', 'company'],
    };
    // Certificate names (partial match) to domains they support
    const CERT_DOMAIN_MAP = [
        ['ISO 14001', ['energy_electricity', 'energy_fuel', 'energy_water', 'emissions', 'waste']],
        ['ISO 50001', ['energy_electricity', 'energy_fuel']],
        ['ISO 45001', ['health_safety']],
        ['EMAS', ['energy_electricity', 'energy_fuel', 'energy_water', 'emissions', 'waste']],
        ['ISO 9001', ['company', 'regulatory']],
        ['ISO 27001', ['company', 'regulatory']],
        ['SA8000', ['workforce', 'health_safety']],
        ['B Corp', ['company', 'regulatory']],
        ['EcoVadis', ['company', 'regulatory']],
        ['CDP', ['emissions', 'energy_electricity']],
        ['GRS', ['waste']],
        ['OEKO-TEX', ['waste', 'company']],
        ['Cradle to Cradle', ['waste', 'company']],
        ['FSC', ['company', 'regulatory']],
        ['PEFC', ['company', 'regulatory']],
        ['Fairtrade', ['workforce', 'company']],
    ];
    if (data.policies && data.policies.length > 0) {
        const approvedPolicies = data.policies.filter(p => p.status === 'available');
        const draftPolicies = data.policies.filter(p => p.status === 'in_progress');
        // For regulatory/goals questions: show all policy status
        if (allDomains.includes('regulatory') || allDomains.includes('goals')) {
            if (approvedPolicies.length > 0) {
                company.push({ domain: 'regulatory', field: 'approvedPolicies', label: 'Approved/Published Policies', value: approvedPolicies.map(p => p.name).join(', '), confidence: 'high' });
            }
            if (draftPolicies.length > 0) {
                company.push({ domain: 'regulatory', field: 'draftPolicies', label: 'Policies Under Development', value: draftPolicies.map(p => p.name).join(', '), confidence: 'medium' });
            }
            for (const category of ['environmental', 'social', 'governance']) {
                const relevant = approvedPolicies.filter(p => p.category === category);
                if (relevant.length > 0) {
                    company.push({
                        domain: 'regulatory',
                        field: `${category}PoliciesApproved`,
                        label: `${category.charAt(0).toUpperCase() + category.slice(1)} Policies in Place`,
                        value: relevant.map(p => p.name).join(', '),
                        confidence: 'high',
                    });
                }
            }
        }
        // For domain-specific questions: inject relevant approved policies as supporting evidence
        for (const [category, domains] of Object.entries(POLICY_CATEGORY_DOMAINS)) {
            if (allDomains.some(d => domains.includes(d))) {
                const relevant = approvedPolicies.filter(p => p.category === category);
                if (relevant.length > 0) {
                    company.push({ domain: 'regulatory', field: `${category}PoliciesApproved`, label: `${category.charAt(0).toUpperCase() + category.slice(1)} Policies in Place`, value: relevant.map(p => p.name).join(', '), confidence: 'high' });
                }
            }
        }
        const supplierPolicies = approvedPolicies.filter(p => p.name.toLowerCase().includes('supplier'));
        if (supplierPolicies.length > 0 && allDomains.some(d => ['buyer_requirements', 'materials'].includes(d))) {
            company.push({ domain: 'buyer_requirements', field: 'supplierPoliciesApproved', label: 'Supplier Policies in Place', value: supplierPolicies.map(p => p.name).join(', '), confidence: 'high' });
        }
    }
    if (data.documents && data.documents.length > 0) {
        const validCerts = data.documents.filter(d => d.category === 'certificate' && d.isValid !== false);
        const expiredCerts = data.documents.filter(d => d.category === 'certificate' && d.isValid === false);
        const validAudits = data.documents.filter(d => d.category === 'audit' && d.isValid !== false);
        const validEvidence = data.documents.filter(d => d.category === 'evidence' && d.isValid !== false);
        // For regulatory/goals: show all certificates
        if (allDomains.includes('regulatory') || allDomains.includes('goals')) {
            if (validCerts.length > 0) {
                company.push({ domain: 'regulatory', field: 'validCertificates', label: 'Valid Certificates', value: validCerts.map(d => d.name).join(', '), confidence: 'high' });
            }
            if (expiredCerts.length > 0) {
                company.push({ domain: 'regulatory', field: 'expiredCertificates', label: 'Expired Certificates (Renewal Needed)', value: expiredCerts.map(d => d.name).join(', '), confidence: 'low' });
            }
            if (validAudits.length > 0) {
                company.push({ domain: 'regulatory', field: 'auditReports', label: 'Audit Reports on File', value: validAudits.map(d => d.name).join(', '), confidence: 'high' });
            }
        }
        // For domain-specific questions: inject relevant certificates as supporting evidence
        for (const [certName, domains] of CERT_DOMAIN_MAP) {
            if (allDomains.some(d => domains.includes(d))) {
                const matching = validCerts.filter(d => d.name.includes(certName));
                if (matching.length > 0) {
                    company.push({ domain: 'regulatory', field: `cert_${certName.replace(/\s+/g, '_').toLowerCase()}`, label: `${certName} Certification`, value: 'Active', confidence: 'high' });
                }
            }
        }
        // Measurement evidence supports any operational domain
        if (validEvidence.length > 0 && allDomains.some(d => ['energy_electricity', 'energy_fuel', 'energy_water', 'emissions', 'waste', 'workforce', 'health_safety'].includes(d))) {
            company.push({ domain: 'regulatory', field: 'measurementEvidence', label: 'Measurement Evidence on File', value: validEvidence.map(d => d.name).join(', '), confidence: 'high' });
        }
    }
    return {
        company: deduplicatePoints(company),
        operational: deduplicatePoints(operational),
        calculated: deduplicatePoints(calculated),
        metadata: {
            reportingPeriod: data.reportingPeriod || undefined,
            sitesIncluded: [],
            dataGaps,
        },
    };
}
//# sourceMappingURL=dataModel.js.map
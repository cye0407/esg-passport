// ============================================
// ESG Domain Pack — Data Model & Retrieval
// ============================================
// Defines the ESG CompanyData shape and the retrieveData function
// that maps matched questions to relevant data points.
import { addIfPresent, deduplicatePoints } from '../../src/engine/dataRetrieval';
import { estimateScope1, estimateScope2Location, estimateScope2Market } from './emissionFactors';
function addIndustryMetric(target, data, domain, section, field, label, unit, outputField) {
    const value = data.industryMetrics?.[section]?.[field];
    if (value !== undefined && value !== null) {
        target.push({ domain, field: outputField || field, label, value, unit, confidence: 'high' });
    }
}
// ============================================
// Data Retrieval
// ============================================
export function esgRetrieveData(matchResult, data) {
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
                    addIndustryMetric(operational, data, domain, 'textile', 'waterDischargeM3', 'Water Discharge', 'm3');
                    addIndustryMetric(operational, data, domain, 'agriculture', 'irrigationWaterM3', 'Irrigation Water', 'm3');
                    addIndustryMetric(operational, data, domain, 'mining', 'waterReusedPercent', 'Water Reused', '%');
                }
                if (domain === 'materials' || domain === 'buyer_requirements') {
                    addIfPresent(company, domain, 'productsServices', 'Products & Services', data.productsServices);
                    addIfPresent(company, domain, 'mainMarkets', 'Main Markets', data.mainMarkets);
                }
                if (domain === 'materials') {
                    addIndustryMetric(operational, data, domain, 'production', 'materialInputTonnes', 'Material Input', 'tonnes');
                    addIndustryMetric(operational, data, domain, 'agriculture', 'landUseHectares', 'Land Use', 'hectares');
                    addIndustryMetric(operational, data, domain, 'agriculture', 'fertilizerKg', 'Fertilizer', 'kg');
                    addIndustryMetric(operational, data, domain, 'agriculture', 'pesticideKg', 'Pesticide', 'kg');
                    addIndustryMetric(operational, data, domain, 'agriculture', 'irrigationWaterM3', 'Irrigation Water', 'm3');
                    addIndustryMetric(operational, data, domain, 'agriculture', 'seasonalWorkers', 'Seasonal Workers');
                    addIndustryMetric(operational, data, domain, 'mining', 'oreProcessedTonnes', 'Ore / Material Processed', 'tonnes');
                    addIndustryMetric(operational, data, domain, 'mining', 'tailingsGeneratedTonnes', 'Tailings Generated', 'tonnes');
                    addIndustryMetric(operational, data, domain, 'mining', 'waterReusedPercent', 'Water Reused', '%');
                    addIndustryMetric(operational, data, domain, 'mining', 'rehabilitatedLandHectares', 'Rehabilitated Land', 'hectares');
                    addIndustryMetric(operational, data, domain, 'construction', 'concreteTonnes', 'Concrete', 'tonnes');
                    addIndustryMetric(operational, data, domain, 'construction', 'steelTonnes', 'Steel', 'tonnes');
                }
                if (domain === 'packaging') {
                    addIndustryMetric(operational, data, domain, 'retail', 'packagingWasteKg', 'Packaging Waste', 'kg');
                    addIndustryMetric(operational, data, domain, 'distribution', 'packagingWasteKg', 'Packaging Waste', 'kg');
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
                addIndustryMetric(operational, data, 'products', 'production', 'unitsProduced', 'Units Produced');
                addIndustryMetric(operational, data, 'products', 'production', 'productionHours', 'Production Hours', 'hours');
                addIndustryMetric(operational, data, 'products', 'production', 'materialInputTonnes', 'Material Input', 'tonnes');
                addIndustryMetric(operational, data, 'products', 'mining', 'oreProcessedTonnes', 'Ore / Material Processed', 'tonnes');
                addIndustryMetric(operational, data, 'products', 'retail', 'storeCount', 'Store Count');
                addIndustryMetric(operational, data, 'products', 'retail', 'storeAreaM2', 'Store Area', 'm2');
                addIndustryMetric(operational, data, 'products', 'distribution', 'warehouseSpaceM2', 'Warehouse Space', 'm2');
                addIndustryMetric(operational, data, 'products', 'distribution', 'deliveriesCount', 'Deliveries Made');
                addIndustryMetric(operational, data, 'products', 'office', 'officeSpaceM2', 'Office Space', 'm2');
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
                addIndustryMetric(operational, data, 'energy_water', 'agriculture', 'irrigationWaterM3', 'Irrigation Water', 'm3');
                addIndustryMetric(operational, data, 'energy_water', 'mining', 'waterReusedPercent', 'Water Reused', '%');
                addIndustryMetric(operational, data, 'energy_water', 'textile', 'waterDischargeM3', 'Water Discharge', 'm3');
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
                addIndustryMetric(operational, data, 'transport', 'fleet', 'totalKmDriven', 'Total km Driven', 'km');
                addIndustryMetric(operational, data, 'transport', 'fleet', 'fleetSize', 'Fleet Size', 'vehicles');
                addIndustryMetric(operational, data, 'transport', 'fleet', 'avgVehicleAge', 'Average Vehicle Age', 'years');
                addIndustryMetric(operational, data, 'transport', 'fleet', 'altFuelPercent', 'Alternative Fuel Vehicles', '%');
                addIndustryMetric(operational, data, 'transport', 'office', 'businessTravelKm', 'Business Travel', 'km', 'businessTravel');
                addIndustryMetric(operational, data, 'transport', 'office', 'wfhPercent', 'Remote Work', '%');
                addIndustryMetric(operational, data, 'transport', 'distribution', 'deliveriesCount', 'Deliveries Made');
                const hasIndustryTransport = Boolean(data.industryMetrics?.fleet || data.industryMetrics?.office || data.industryMetrics?.distribution);
                if (!data.scope3Tco2e && !data.businessTravelKm && !data.employeeCommuteKm && !data.freightTonKm && !hasIndustryTransport) {
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
                addIndustryMetric(operational, data, 'waste', 'healthcare', 'medicalWasteKg', 'Medical Waste', 'kg');
                addIndustryMetric(operational, data, 'waste', 'healthcare', 'pharmaceuticalWasteKg', 'Pharmaceutical Waste', 'kg');
                addIndustryMetric(operational, data, 'waste', 'mining', 'oreProcessedTonnes', 'Ore / Material Processed', 'tonnes');
                addIndustryMetric(operational, data, 'waste', 'mining', 'tailingsGeneratedTonnes', 'Tailings Generated', 'tonnes');
                addIndustryMetric(operational, data, 'waste', 'mining', 'waterReusedPercent', 'Water Reused', '%');
                addIndustryMetric(operational, data, 'waste', 'mining', 'rehabilitatedLandHectares', 'Rehabilitated Land', 'hectares');
                addIndustryMetric(operational, data, 'waste', 'retail', 'packagingWasteKg', 'Packaging Waste', 'kg');
                addIndustryMetric(operational, data, 'waste', 'distribution', 'packagingWasteKg', 'Packaging Waste', 'kg');
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
                    operational.push({ domain: 'workforce', field: 'livingWageCompliant', label: 'Living Wage Compliance', value: data.livingWageCompliant ? 'Yes' : 'No', confidence: 'high' });
                if (data.grievanceMechanismExists !== undefined)
                    operational.push({ domain: 'workforce', field: 'grievanceMechanismExists', label: 'Grievance Mechanism', value: data.grievanceMechanismExists ? 'Yes' : 'No', confidence: 'high' });
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
                        operational.push({ domain: 'training', field: 'employeesTrained', label: 'Employees Trained', value: data.employeeCount, confidence: 'high' });
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
                if (data.dataProtectionPolicy !== undefined)
                    operational.push({ domain: 'goals', field: 'dataProtectionPolicy', label: 'Data Protection Policy', value: data.dataProtectionPolicy ? 'Yes' : 'No', confidence: 'high' });
                if (data.publishesSustainabilityReport !== undefined)
                    operational.push({ domain: 'regulatory', field: 'publishesSustainabilityReport', label: 'Publishes Sustainability Report', value: data.publishesSustainabilityReport ? 'Yes' : 'No', confidence: 'high' });
                if (data.reportingFramework)
                    operational.push({ domain: 'regulatory', field: 'reportingFramework', label: 'Reporting Framework', value: data.reportingFramework, confidence: 'high' });
                if (data.externalAssurance !== undefined)
                    operational.push({ domain: 'regulatory', field: 'externalAssurance', label: 'External Assurance', value: data.externalAssurance ? 'Yes' : 'No', confidence: 'high' });
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
        // Supplier-facing policies (e.g. "Supplier Code of Conduct") are categorized as
        // governance, so they don't reach supply-chain question domains via the category
        // map above. Surface them explicitly so supplier-code questions don't wrongly
        // report "not established" when the policy exists.
        if (allDomains.includes('buyer_requirements') || allDomains.includes('materials')) {
            // Only an actual Supplier Code of Conduct — not any supplier-named policy
            // (e.g. "Supplier Onboarding Procedure") — satisfies "Supplier Code exists".
            const supplierPolicies = approvedPolicies.filter(p => /supplier code/i.test(p.name));
            if (supplierPolicies.length > 0) {
                company.push({ domain: 'buyer_requirements', field: 'supplierPoliciesApproved', label: 'Supplier Code of Conduct in Place', value: supplierPolicies.map(p => p.name).join(', '), confidence: 'high' });
            }
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
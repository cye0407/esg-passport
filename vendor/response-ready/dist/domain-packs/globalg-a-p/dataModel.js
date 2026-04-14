// ============================================
// GlobalG.A.P. Domain Pack — Data Model & Retrieval
// ============================================
// Defines the FarmData shape and the retrieveData function.
// Fields map closely to Ecosystems United baseline data so existing
// users get answers populated automatically from their tracked data.
import { addIfPresent, deduplicatePoints } from '../../src/engine/dataRetrieval';
// ============================================
// Data Retrieval
// ============================================
export function gapRetrieveData(matchResult, data) {
    const allDomains = [matchResult.primaryDomain, ...matchResult.secondaryDomains].filter((d) => d !== null);
    const company = [];
    const operational = [];
    const calculated = [];
    const dataGaps = [];
    for (const domain of allDomains) {
        switch (domain) {
            case 'site_management':
                addIfPresent(company, 'site_management', 'farmName', 'Farm Name', data.farmName);
                addIfPresent(company, 'site_management', 'country', 'Country', data.country);
                addIfPresent(company, 'site_management', 'region', 'Region', data.region);
                if (data.totalHectares)
                    operational.push({ domain: 'site_management', field: 'totalHectares', label: 'Total Area', value: data.totalHectares, unit: 'ha', confidence: 'high' });
                addIfPresent(company, 'site_management', 'numberOfSites', 'Number of Sites', data.numberOfSites);
                addIfPresent(company, 'site_management', 'cropTypes', 'Crop Types', data.cropTypes);
                addIfPresent(company, 'site_management', 'productionType', 'Production Type', data.productionType);
                break;
            case 'traceability':
                if (data.traceabilitySystem !== undefined)
                    operational.push({ domain: 'traceability', field: 'traceabilitySystem', label: 'Traceability System', value: data.traceabilitySystem ? 'In place' : 'Not in place', confidence: data.traceabilitySystem ? 'high' : 'low' });
                if (data.batchNumbering !== undefined)
                    operational.push({ domain: 'traceability', field: 'batchNumbering', label: 'Batch/Lot Numbering', value: data.batchNumbering ? 'In place' : 'Not in place', confidence: 'high' });
                if (data.recallProcedure !== undefined)
                    operational.push({ domain: 'traceability', field: 'recallProcedure', label: 'Recall Procedure', value: data.recallProcedure ? 'Documented' : 'Not documented', confidence: 'high' });
                addIfPresent(operational, 'traceability', 'recallTestDate', 'Last Mock Recall', data.recallTestDate);
                if (data.internalAuditDate)
                    operational.push({ domain: 'traceability', field: 'internalAuditDate', label: 'Last Internal Audit', value: data.internalAuditDate, confidence: 'high' });
                addIfPresent(operational, 'traceability', 'internalAuditFindings', 'Audit Findings', data.internalAuditFindings);
                if (!data.traceabilitySystem && !data.batchNumbering)
                    dataGaps.push('No traceability system information');
                break;
            case 'propagation':
                addIfPresent(operational, 'propagation', 'cropTypes', 'Crop Varieties', data.cropTypes);
                addIfPresent(operational, 'propagation', 'productionType', 'Production Type', data.productionType);
                break;
            case 'soil':
                addIfPresent(operational, 'soil', 'soilTypes', 'Soil Types', data.soilTypes);
                addIfPresent(operational, 'soil', 'soilAnalysisDate', 'Last Soil Analysis', data.soilAnalysisDate);
                addIfPresent(operational, 'soil', 'soilAnalysisResults', 'Soil Analysis Results', data.soilAnalysisResults);
                addIfPresent(operational, 'soil', 'erosionMeasures', 'Erosion Control Measures', data.erosionMeasures);
                if (!data.soilAnalysisDate && !data.soilTypes)
                    dataGaps.push('No soil analysis data');
                break;
            case 'fertilizer':
                addIfPresent(operational, 'fertilizer', 'fertiliserTypes', 'Fertiliser Types Used', data.fertiliserTypes);
                if (data.organicFertiliserPercent !== undefined)
                    operational.push({ domain: 'fertilizer', field: 'organicFertiliserPercent', label: 'Organic Fertiliser Share', value: data.organicFertiliserPercent, unit: '%', confidence: 'high' });
                if (data.fertiliserApplicationKg)
                    operational.push({ domain: 'fertilizer', field: 'fertiliserApplicationKg', label: 'Total Fertiliser Applied', value: data.fertiliserApplicationKg, unit: 'kg', confidence: 'high' });
                if (data.nutrientManagementPlan !== undefined)
                    operational.push({ domain: 'fertilizer', field: 'nutrientManagementPlan', label: 'Nutrient Management Plan', value: data.nutrientManagementPlan ? 'In place' : 'Not in place', confidence: 'high' });
                if (data.fertiliserStorageCompliant !== undefined)
                    operational.push({ domain: 'fertilizer', field: 'fertiliserStorageCompliant', label: 'Fertiliser Storage Compliance', value: data.fertiliserStorageCompliant ? 'Compliant' : 'Non-compliant', confidence: 'high' });
                if (!data.fertiliserTypes && data.fertiliserApplicationKg === undefined)
                    dataGaps.push('No fertiliser application data');
                break;
            case 'water':
                addIfPresent(operational, 'water', 'waterSourceTypes', 'Water Sources', data.waterSourceTypes);
                if (data.waterM3)
                    operational.push({ domain: 'water', field: 'waterM3', label: 'Water Use', value: data.waterM3, unit: 'm\u00B3', confidence: 'high' });
                addIfPresent(operational, 'water', 'waterQualityTestDate', 'Last Water Quality Test', data.waterQualityTestDate);
                addIfPresent(operational, 'water', 'waterQualityResults', 'Water Quality Results', data.waterQualityResults);
                addIfPresent(operational, 'water', 'irrigationMethod', 'Irrigation Method', data.irrigationMethod);
                if (!data.waterM3 && !data.waterSourceTypes)
                    dataGaps.push('No water use data');
                break;
            case 'ipm':
                if (data.ipmPlanInPlace !== undefined)
                    operational.push({ domain: 'ipm', field: 'ipmPlanInPlace', label: 'IPM Plan', value: data.ipmPlanInPlace ? 'In place' : 'Not in place', confidence: 'high' });
                addIfPresent(operational, 'ipm', 'cropRotationPlan', 'Crop Rotation Plan', data.cropRotationPlan);
                if (data.ipmPlanInPlace === undefined)
                    dataGaps.push('No IPM plan information');
                break;
            case 'crop_protection':
                addIfPresent(operational, 'crop_protection', 'pppProductsUsed', 'PPP Products Used', data.pppProductsUsed);
                if (data.sprayerCalibrated !== undefined)
                    operational.push({ domain: 'crop_protection', field: 'sprayerCalibrated', label: 'Sprayer Calibrated', value: data.sprayerCalibrated ? 'Yes' : 'No', confidence: 'high' });
                addIfPresent(operational, 'crop_protection', 'sprayerCalibrationDate', 'Last Sprayer Calibration', data.sprayerCalibrationDate);
                addIfPresent(operational, 'crop_protection', 'mrlTestDate', 'Last MRL Test', data.mrlTestDate);
                addIfPresent(operational, 'crop_protection', 'mrlTestResults', 'MRL Test Results', data.mrlTestResults);
                if (data.pppStorageCompliant !== undefined)
                    operational.push({ domain: 'crop_protection', field: 'pppStorageCompliant', label: 'PPP Storage Compliance', value: data.pppStorageCompliant ? 'Compliant' : 'Non-compliant', confidence: 'high' });
                addIfPresent(operational, 'crop_protection', 'emptyContainerProcedure', 'Container Disposal', data.emptyContainerProcedure);
                break;
            case 'harvest':
                addIfPresent(operational, 'harvest', 'harvestMethod', 'Harvest Method', data.harvestMethod);
                if (data.packingFacility !== undefined)
                    operational.push({ domain: 'harvest', field: 'packingFacility', label: 'Packing Facility', value: data.packingFacility ? 'Available' : 'Not available', confidence: 'high' });
                if (data.coldChainManaged !== undefined)
                    operational.push({ domain: 'harvest', field: 'coldChainManaged', label: 'Cold Chain Management', value: data.coldChainManaged ? 'In place' : 'Not in place', confidence: 'high' });
                if (data.hygieneProtocol !== undefined)
                    operational.push({ domain: 'harvest', field: 'hygieneProtocol', label: 'Hygiene Protocol', value: data.hygieneProtocol ? 'In place' : 'Not in place', confidence: 'high' });
                if (data.foreignBodyChecks !== undefined)
                    operational.push({ domain: 'harvest', field: 'foreignBodyChecks', label: 'Foreign Body Checks', value: data.foreignBodyChecks ? 'In place' : 'Not in place', confidence: 'high' });
                break;
            case 'food_safety':
                if (data.haccpPlan !== undefined)
                    operational.push({ domain: 'food_safety', field: 'haccpPlan', label: 'HACCP Plan', value: data.haccpPlan ? 'Documented' : 'Not documented', confidence: 'high' });
                if (data.foodSafetyRiskAssessment !== undefined)
                    operational.push({ domain: 'food_safety', field: 'foodSafetyRiskAssessment', label: 'Food Safety Risk Assessment', value: data.foodSafetyRiskAssessment ? 'Completed' : 'Not completed', confidence: 'high' });
                addIfPresent(operational, 'food_safety', 'microbiologicalTestDate', 'Last Microbiological Test', data.microbiologicalTestDate);
                addIfPresent(operational, 'food_safety', 'microbiologicalResults', 'Microbiological Results', data.microbiologicalResults);
                if (data.haccpPlan === undefined)
                    dataGaps.push('No HACCP plan information');
                break;
            case 'workers':
                addIfPresent(company, 'workers', 'employeeCount', 'Total Workers', data.employeeCount);
                if (data.workerTrainingRecords !== undefined)
                    operational.push({ domain: 'workers', field: 'workerTrainingRecords', label: 'Training Records', value: data.workerTrainingRecords ? 'Maintained' : 'Not maintained', confidence: 'high' });
                if (data.ppeProvided !== undefined)
                    operational.push({ domain: 'workers', field: 'ppeProvided', label: 'PPE Provided', value: data.ppeProvided ? 'Yes' : 'No', confidence: 'high' });
                if (data.firstAidKits !== undefined)
                    operational.push({ domain: 'workers', field: 'firstAidKits', label: 'First Aid Kits', value: data.firstAidKits ? 'Available' : 'Not available', confidence: 'high' });
                if (data.accidentRecords !== undefined)
                    operational.push({ domain: 'workers', field: 'accidentRecords', label: 'Accident Records', value: data.accidentRecords ? 'Maintained' : 'Not maintained', confidence: 'high' });
                if (data.welfareProvided !== undefined)
                    operational.push({ domain: 'workers', field: 'welfareProvided', label: 'Welfare Facilities', value: data.welfareProvided ? 'Provided' : 'Not provided', confidence: 'high' });
                if (data.workingHoursCompliant !== undefined)
                    operational.push({ domain: 'workers', field: 'workingHoursCompliant', label: 'Working Hours Compliance', value: data.workingHoursCompliant ? 'Compliant' : 'Non-compliant', confidence: 'high' });
                if (data.noChildLabour !== undefined)
                    operational.push({ domain: 'workers', field: 'noChildLabour', label: 'No Child Labour', value: data.noChildLabour ? 'Confirmed' : 'Not confirmed', confidence: 'high' });
                if (data.subcontractorAgreements !== undefined)
                    operational.push({ domain: 'workers', field: 'subcontractorAgreements', label: 'Subcontractor Agreements', value: data.subcontractorAgreements ? 'In place' : 'Not in place', confidence: 'high' });
                break;
            case 'environment':
                if (data.environmentalPolicy !== undefined)
                    operational.push({ domain: 'environment', field: 'environmentalPolicy', label: 'Environmental Policy', value: data.environmentalPolicy ? 'In place' : 'Not in place', confidence: 'high' });
                if (data.biodiversityPlan !== undefined)
                    operational.push({ domain: 'environment', field: 'biodiversityPlan', label: 'Biodiversity Action Plan', value: data.biodiversityPlan ? 'In place' : 'Not in place', confidence: 'high' });
                if (data.wasteManagementPlan !== undefined)
                    operational.push({ domain: 'environment', field: 'wasteManagementPlan', label: 'Waste Management Plan', value: data.wasteManagementPlan ? 'In place' : 'Not in place', confidence: 'high' });
                if (data.totalWasteKg)
                    operational.push({ domain: 'environment', field: 'totalWasteKg', label: 'Total Waste', value: data.totalWasteKg, unit: 'kg', confidence: 'high' });
                if (data.recyclingPercent !== undefined)
                    operational.push({ domain: 'environment', field: 'recyclingPercent', label: 'Recycling Rate', value: data.recyclingPercent, unit: '%', confidence: 'high' });
                if (data.energyKwh)
                    operational.push({ domain: 'environment', field: 'energyKwh', label: 'Energy Consumption', value: data.energyKwh, unit: 'kWh', confidence: 'high' });
                if (data.renewablePercent !== undefined)
                    operational.push({ domain: 'environment', field: 'renewablePercent', label: 'Renewable Energy Share', value: data.renewablePercent, unit: '%', confidence: 'high' });
                break;
            case 'quality':
                if (data.complaintProcedure !== undefined)
                    operational.push({ domain: 'quality', field: 'complaintProcedure', label: 'Complaint Procedure', value: data.complaintProcedure ? 'Documented' : 'Not documented', confidence: 'high' });
                if (data.complaintLog !== undefined)
                    operational.push({ domain: 'quality', field: 'complaintLog', label: 'Complaint Log', value: data.complaintLog ? 'Maintained' : 'Not maintained', confidence: 'high' });
                break;
        }
    }
    // ---- Certification & document evidence ----
    if (data.certifications) {
        company.push({ domain: 'site_management', field: 'certifications', label: 'Certifications', value: data.certifications, confidence: 'high' });
    }
    if (data.previousAuditDate) {
        company.push({ domain: 'site_management', field: 'previousAuditDate', label: 'Previous Audit Date', value: data.previousAuditDate, confidence: 'high' });
    }
    // Inject structured policies
    if (data.policies && data.policies.length > 0) {
        const approved = data.policies.filter(p => p.status === 'available');
        if (approved.length > 0 && (allDomains.includes('site_management') || allDomains.includes('environment') || allDomains.includes('workers') || allDomains.includes('food_safety'))) {
            company.push({ domain: 'site_management', field: 'approvedPolicies', label: 'Policies in Place', value: approved.map(p => p.name).join(', '), confidence: 'high' });
        }
    }
    // Inject structured documents
    if (data.documents && data.documents.length > 0) {
        const validCerts = data.documents.filter(d => d.category === 'certificate' && d.isValid !== false);
        if (validCerts.length > 0) {
            company.push({ domain: 'site_management', field: 'validCertificates', label: 'Valid Certificates', value: validCerts.map(d => d.name).join(', '), confidence: 'high' });
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
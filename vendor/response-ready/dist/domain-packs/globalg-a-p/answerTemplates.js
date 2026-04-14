// ============================================
// GlobalG.A.P. Domain Pack — Answer Templates
// ============================================
// Templates for generating answers to GlobalG.A.P. IFA control points.
// Structured around the main certification modules.
import { num, str, fmt } from '../../src/engine/answerGenerator';
export const GAP_ANSWER_TEMPLATES = [
    // ===================================================================
    // SITE MANAGEMENT & FARM PROFILE
    // ===================================================================
    {
        domains: ['site_management'],
        topics: ['site_history', 'site_reference'],
        generate: (dm) => {
            const farm = str(dm, 'farmName');
            const ha = num(dm, 'totalHectares');
            const crops = str(dm, 'cropTypes');
            const country = str(dm, 'country');
            const type = str(dm, 'productionType');
            const parts = [];
            if (farm)
                parts.push(`${farm} is a ${type || 'farming'} operation${country ? ` based in ${country}` : ''}.`);
            if (ha > 0)
                parts.push(`The farm covers ${fmt(ha)} hectares.`);
            if (crops)
                parts.push(`Primary crops: ${crops}.`);
            parts.push('Each field/plot is identified with a unique reference number and mapped for traceability purposes. Site history records are maintained covering at least the previous 5 years of land use.');
            return parts.length > 1 ? parts.join(' ') : null;
        },
    },
    {
        domains: ['site_management'],
        topics: ['risk_assessment'],
        questionTypes: ['DOCUMENT'],
        generate: (dm) => {
            const farm = str(dm, 'farmName');
            const name = farm || 'The farm';
            return `${name} maintains a documented risk assessment covering food safety, environmental, and occupational health hazards. The risk assessment is reviewed annually and updated whenever new hazards are identified or changes to operations occur. It covers site-specific risks including soil contamination, water quality, adjacent land use, and flooding risk.`;
        },
    },
    // ===================================================================
    // TRACEABILITY & RECORD KEEPING
    // ===================================================================
    {
        domains: ['traceability'],
        topics: ['traceability'],
        generate: (dm) => {
            const system = str(dm, 'traceabilitySystem');
            const batch = str(dm, 'batchNumbering');
            const parts = [];
            if (system === 'In place') {
                parts.push('A traceability system is in place that links all registered products to the production site, including field/plot identification, harvest date, and post-harvest handling steps.');
            }
            else {
                parts.push('We are implementing a traceability system to link all products from field to dispatch.');
            }
            if (batch === 'In place') {
                parts.push('Each product batch is assigned a unique lot number enabling trace-back to the specific production area and treatment records.');
            }
            parts.push('The system enables both upstream traceability (inputs, planting material) and downstream traceability (dispatch, buyer) within a maximum of 4 hours.');
            return parts.join(' ');
        },
    },
    {
        domains: ['traceability'],
        topics: ['recall_procedure'],
        generate: (dm) => {
            const procedure = str(dm, 'recallProcedure');
            const testDate = str(dm, 'recallTestDate');
            const parts = [];
            if (procedure === 'Documented') {
                parts.push('A documented product recall/withdrawal procedure is in place.');
            }
            else {
                parts.push('We are finalising a documented product recall/withdrawal procedure.');
            }
            parts.push('The procedure covers identification of the affected product, notification of relevant parties (buyers, authorities), and physical segregation or retrieval of the product.');
            if (testDate) {
                parts.push(`A mock recall exercise was last conducted on ${testDate} to verify the effectiveness of the procedure.`);
            }
            else {
                parts.push('Mock recall exercises are conducted annually to verify the effectiveness of the system.');
            }
            return parts.join(' ');
        },
    },
    {
        domains: ['traceability'],
        topics: ['internal_audit'],
        generate: (dm) => {
            const auditDate = str(dm, 'internalAuditDate');
            const findings = str(dm, 'internalAuditFindings');
            const parts = [];
            parts.push('An internal self-assessment is conducted annually against the GlobalG.A.P. checklist.');
            if (auditDate)
                parts.push(`The most recent internal audit was completed on ${auditDate}.`);
            if (findings)
                parts.push(`Key findings: ${findings}.`);
            parts.push('Non-conformances identified are documented with corrective actions and timelines for resolution.');
            return parts.join(' ');
        },
    },
    // ===================================================================
    // SOIL MANAGEMENT
    // ===================================================================
    {
        domains: ['soil'],
        topics: ['soil_management', 'soil_analysis'],
        generate: (dm) => {
            const types = str(dm, 'soilTypes');
            const analysisDate = str(dm, 'soilAnalysisDate');
            const results = str(dm, 'soilAnalysisResults');
            const erosion = str(dm, 'erosionMeasures');
            const parts = [];
            parts.push('Soil management practices are in place to maintain and improve soil structure and fertility.');
            if (types)
                parts.push(`Primary soil types on-farm: ${types}.`);
            if (analysisDate)
                parts.push(`Soil analysis was last conducted on ${analysisDate}.`);
            if (results)
                parts.push(`Results: ${results}.`);
            parts.push('Soil analysis results are used to determine fertiliser application rates as part of the nutrient management plan.');
            if (erosion)
                parts.push(`Erosion control measures include: ${erosion}.`);
            return parts.join(' ');
        },
    },
    // ===================================================================
    // FERTILIZER & NUTRIENT MANAGEMENT
    // ===================================================================
    {
        domains: ['fertilizer'],
        topics: ['nutrient_management', 'fertilizer_records'],
        generate: (dm) => {
            const types = str(dm, 'fertiliserTypes');
            const orgPct = num(dm, 'organicFertiliserPercent');
            const totalKg = num(dm, 'fertiliserApplicationKg');
            const plan = str(dm, 'nutrientManagementPlan');
            const storage = str(dm, 'fertiliserStorageCompliant');
            const parts = [];
            if (plan === 'In place') {
                parts.push('A nutrient management plan is in place, informed by soil analysis results and crop requirements.');
            }
            else {
                parts.push('We are developing a nutrient management plan based on soil analysis and expected crop uptake.');
            }
            if (types)
                parts.push(`Fertiliser types used: ${types}.`);
            if (totalKg > 0)
                parts.push(`Total fertiliser applied during the reporting period: ${fmt(totalKg)} kg.`);
            if (orgPct > 0)
                parts.push(`${fmt(orgPct)}% of fertiliser applied is from organic sources (compost, manure).`);
            parts.push('All fertiliser applications are recorded with date, field/plot, product name, quantity, method, and operator.');
            if (storage === 'Compliant')
                parts.push('Fertiliser is stored in a dedicated, covered area separated from crop protection products, with organic and inorganic fertilisers segregated.');
            return parts.join(' ');
        },
    },
    {
        domains: ['fertilizer'],
        topics: ['organic_fertilizer'],
        generate: (dm) => {
            const orgPct = num(dm, 'organicFertiliserPercent');
            const types = str(dm, 'fertiliserTypes');
            const parts = [];
            parts.push('Organic fertilisers are used as part of our nutrient management strategy to improve soil organic matter and structure.');
            if (orgPct > 0)
                parts.push(`Organic sources account for ${fmt(orgPct)}% of total fertiliser inputs.`);
            if (types)
                parts.push(`Sources include: ${types}.`);
            parts.push('Risk assessments are conducted for organic fertilisers (especially manure and biosolids) covering heavy metals, pathogens, and pre-harvest intervals. Application records document source, date, rate, and field/plot.');
            return parts.join(' ');
        },
    },
    // ===================================================================
    // WATER MANAGEMENT
    // ===================================================================
    {
        domains: ['water'],
        topics: ['water_quality', 'irrigation_management', 'water_usage', 'water_management_plan'],
        generate: (dm) => {
            const source = str(dm, 'waterSourceTypes');
            const m3 = num(dm, 'waterM3');
            const testDate = str(dm, 'waterQualityTestDate');
            const results = str(dm, 'waterQualityResults');
            const method = str(dm, 'irrigationMethod');
            const parts = [];
            parts.push('A water management plan is maintained covering water sources, quality testing, and efficient use.');
            if (source)
                parts.push(`Water sources: ${source}.`);
            if (m3 > 0)
                parts.push(`Total water use during the reporting period: ${fmt(m3)} m\u00B3.`);
            if (method)
                parts.push(`Primary irrigation method: ${method}.`);
            if (testDate)
                parts.push(`Water quality was last tested on ${testDate}.`);
            if (results)
                parts.push(`Results: ${results}.`);
            parts.push('Water quality analysis covers microbiological parameters (E. coli) and chemical contaminants as appropriate to the water source and use (irrigation, post-harvest washing). Records are maintained for all irrigation events including date, volume, and duration.');
            return parts.join(' ');
        },
    },
    // ===================================================================
    // IPM
    // ===================================================================
    {
        domains: ['ipm'],
        topics: ['ipm_system', 'pest_monitoring', 'biological_control', 'crop_rotation'],
        generate: (dm) => {
            const plan = str(dm, 'ipmPlanInPlace');
            const rotation = str(dm, 'cropRotationPlan');
            const parts = [];
            if (plan === 'In place') {
                parts.push('An Integrated Pest Management (IPM) plan is in place and implemented.');
            }
            else {
                parts.push('We are developing a formal Integrated Pest Management (IPM) plan.');
            }
            parts.push('The IPM approach prioritises prevention (crop rotation, resistant varieties, hygiene), observation (regular scouting and monitoring with recorded thresholds), and intervention (biological and physical methods before chemical control).');
            if (rotation)
                parts.push(`Crop rotation plan: ${rotation}.`);
            parts.push('Pest and disease observations are recorded for each field/plot. Chemical interventions are used only when monitoring indicates that action thresholds have been reached and non-chemical alternatives have been considered.');
            return parts.join(' ');
        },
    },
    // ===================================================================
    // CROP PROTECTION / PPP
    // ===================================================================
    {
        domains: ['crop_protection'],
        topics: ['ppp_use', 'ppp_records'],
        generate: (dm) => {
            const products = str(dm, 'pppProductsUsed');
            const calibrated = str(dm, 'sprayerCalibrated');
            const calibDate = str(dm, 'sprayerCalibrationDate');
            const storage = str(dm, 'pppStorageCompliant');
            const parts = [];
            parts.push('All plant protection products (PPPs) used are officially registered and approved for the target crop and pest/disease in the country of use.');
            if (products)
                parts.push(`Products currently in use: ${products}.`);
            parts.push('Application records are maintained for every treatment, documenting: crop and field/plot, product trade name and active ingredient, justification/reason, date and time, pre-harvest interval, re-entry interval, operator name, and weather conditions.');
            if (calibrated === 'Yes') {
                parts.push(`Application equipment is calibrated and verified.${calibDate ? ` Last calibration: ${calibDate}.` : ''}`);
            }
            if (storage === 'Compliant')
                parts.push('PPPs are stored in a secure, well-ventilated, locked facility with appropriate signage, spill containment, and inventory management.');
            return parts.join(' ');
        },
    },
    {
        domains: ['crop_protection'],
        topics: ['residue_management'],
        generate: (dm) => {
            const mrlDate = str(dm, 'mrlTestDate');
            const mrlResults = str(dm, 'mrlTestResults');
            const parts = [];
            parts.push('Maximum Residue Level (MRL) compliance is ensured through strict adherence to pre-harvest intervals (PHI), correct application rates, and approved product selection.');
            if (mrlDate)
                parts.push(`Residue analysis was last conducted on ${mrlDate}.`);
            if (mrlResults)
                parts.push(`Results: ${mrlResults}.`);
            parts.push('MRL limits are verified against destination-country requirements. Where buyers specify stricter limits, these are observed.');
            return parts.join(' ');
        },
    },
    {
        domains: ['crop_protection'],
        topics: ['container_management', 'ppp_disposal'],
        generate: (dm) => {
            const procedure = str(dm, 'emptyContainerProcedure');
            const parts = [];
            if (procedure) {
                parts.push(`Empty PPP containers are managed as follows: ${procedure}.`);
            }
            else {
                parts.push('Empty PPP containers are triple-rinsed before disposal.');
            }
            parts.push('Rinsate is added to the spray tank. Rinsed containers are punctured to prevent re-use and stored in a designated, secure area until collected by an authorised disposal/recycling scheme. Obsolete or expired products are securely stored and disposed of through licensed waste handlers.');
            return parts.join(' ');
        },
    },
    // ===================================================================
    // HARVEST & POST-HARVEST
    // ===================================================================
    {
        domains: ['harvest'],
        topics: ['harvest_management', 'post_harvest', 'hygiene', 'cold_chain'],
        generate: (dm) => {
            const method = str(dm, 'harvestMethod');
            const packing = str(dm, 'packingFacility');
            const cold = str(dm, 'coldChainManaged');
            const hygiene = str(dm, 'hygieneProtocol');
            const foreign = str(dm, 'foreignBodyChecks');
            const parts = [];
            if (method)
                parts.push(`Harvesting is carried out using the following method: ${method}.`);
            parts.push('Harvest dates and quantities are recorded per field/plot. Workers involved in harvesting receive training on hygiene, safe handling, and identification of foreign bodies.');
            if (hygiene === 'In place')
                parts.push('A hygiene protocol is in place covering worker personal hygiene, cleaning schedules for equipment and containers, and prevention of cross-contamination.');
            if (packing === 'Available')
                parts.push('An on-site packing facility is available with documented cleaning and sanitation procedures.');
            if (cold === 'In place')
                parts.push('Cold chain management is in place from harvest through to dispatch, with temperature monitoring and records maintained.');
            if (foreign === 'In place')
                parts.push('Foreign body prevention measures are implemented, including visual inspections and, where appropriate, detection equipment.');
            return parts.join(' ');
        },
    },
    // ===================================================================
    // FOOD SAFETY
    // ===================================================================
    {
        domains: ['food_safety'],
        topics: ['food_safety_management', 'haccp', 'microbiological_control'],
        generate: (dm) => {
            const haccp = str(dm, 'haccpPlan');
            const riskAssessment = str(dm, 'foodSafetyRiskAssessment');
            const microDate = str(dm, 'microbiologicalTestDate');
            const microResults = str(dm, 'microbiologicalResults');
            const parts = [];
            if (haccp === 'Documented') {
                parts.push('A HACCP-based food safety plan is documented and implemented.');
            }
            else {
                parts.push('We are developing a HACCP-based food safety plan covering all critical control points from production to dispatch.');
            }
            if (riskAssessment === 'Completed')
                parts.push('A food safety risk assessment has been completed covering biological, chemical, and physical hazards.');
            if (microDate)
                parts.push(`Microbiological testing was last conducted on ${microDate}.`);
            if (microResults)
                parts.push(`Results: ${microResults}.`);
            parts.push('The food safety management system is reviewed at least annually and updated to reflect changes in operations, new hazards, or regulatory requirements.');
            return parts.join(' ');
        },
    },
    // ===================================================================
    // WORKERS
    // ===================================================================
    {
        domains: ['workers'],
        topics: ['worker_health_safety', 'training_competence', 'ppe'],
        generate: (dm) => {
            const count = num(dm, 'employeeCount');
            const training = str(dm, 'workerTrainingRecords');
            const ppe = str(dm, 'ppeProvided');
            const firstAid = str(dm, 'firstAidKits');
            const accidents = str(dm, 'accidentRecords');
            const parts = [];
            if (count > 0)
                parts.push(`The farm employs ${fmt(count)} workers.`);
            parts.push('Worker health, safety, and welfare are managed in accordance with GlobalG.A.P. requirements and national legislation.');
            if (training === 'Maintained')
                parts.push('Training records are maintained for all workers, including induction training, task-specific competence, and PPP handling where applicable.');
            if (ppe === 'Yes')
                parts.push('Appropriate personal protective equipment (PPE) is provided to all workers based on risk assessment and product label requirements.');
            if (firstAid === 'Available')
                parts.push('First aid kits are available at all work locations and regularly checked.');
            if (accidents === 'Maintained')
                parts.push('Accident and incident records are maintained with investigation findings and corrective actions.');
            return parts.join(' ');
        },
    },
    {
        domains: ['workers'],
        topics: ['welfare_facilities', 'labour_practices', 'social_practice'],
        generate: (dm) => {
            const welfare = str(dm, 'welfareProvided');
            const hours = str(dm, 'workingHoursCompliant');
            const child = str(dm, 'noChildLabour');
            const subs = str(dm, 'subcontractorAgreements');
            const parts = [];
            if (welfare === 'Provided')
                parts.push('Worker welfare facilities are provided including clean toilets, handwashing stations, drinking water, and designated rest areas, all within reasonable proximity to the work area.');
            if (hours === 'Compliant')
                parts.push('Working hours comply with national legislation and applicable collective agreements. Overtime is voluntary and compensated in accordance with the law.');
            if (child === 'Confirmed')
                parts.push('The farm confirms that no child labour is employed. Workers below 18 years are not engaged in hazardous work.');
            if (subs === 'In place')
                parts.push('Subcontractor and agency worker agreements include clauses on health, safety, welfare, and compliance with labour legislation.');
            if (parts.length === 0)
                parts.push('Worker welfare provisions and working conditions comply with national legislation and GlobalG.A.P. GRASP requirements.');
            return parts.join(' ');
        },
    },
    // ===================================================================
    // ENVIRONMENT
    // ===================================================================
    {
        domains: ['environment'],
        topics: ['environmental_management', 'biodiversity', 'waste_management', 'energy', 'pollution_prevention'],
        generate: (dm) => {
            const policy = str(dm, 'environmentalPolicy');
            const bio = str(dm, 'biodiversityPlan');
            const waste = str(dm, 'wasteManagementPlan');
            const wasteKg = num(dm, 'totalWasteKg');
            const recycling = num(dm, 'recyclingPercent');
            const energy = num(dm, 'energyKwh');
            const renewable = num(dm, 'renewablePercent');
            const parts = [];
            if (policy === 'In place')
                parts.push('An environmental policy is in place covering biodiversity, waste, energy, water, and pollution prevention.');
            if (bio === 'In place')
                parts.push('A biodiversity action plan has been developed, including identification of priority habitats, conservation of ecological infrastructure (hedgerows, buffer zones, water courses), and monitoring of wildlife indicators.');
            if (waste === 'In place')
                parts.push('A waste management plan is in place covering identification, segregation, and responsible disposal of all waste streams.');
            if (wasteKg > 0) {
                const tonnes = Math.round(wasteKg / 100) / 10;
                parts.push(`Total waste during the reporting period: ${fmt(tonnes)} tonnes.`);
            }
            if (recycling > 0)
                parts.push(`Current recycling rate: ${fmt(recycling)}%.`);
            if (energy > 0)
                parts.push(`Energy consumption: ${fmt(energy)} kWh.`);
            if (renewable > 0)
                parts.push(`${fmt(renewable)}% of energy is from renewable sources.`);
            parts.push('Environmental impact is minimised through efficient resource use, pollution prevention measures, and continuous improvement.');
            return parts.join(' ');
        },
    },
    // ===================================================================
    // QUALITY & COMPLAINTS
    // ===================================================================
    {
        domains: ['quality'],
        topics: ['complaints', 'continuous_improvement', 'quality_control'],
        generate: (dm) => {
            const procedure = str(dm, 'complaintProcedure');
            const log = str(dm, 'complaintLog');
            const parts = [];
            if (procedure === 'Documented')
                parts.push('A documented complaint procedure is in place for receiving, recording, and resolving customer complaints.');
            if (log === 'Maintained')
                parts.push('A complaint log is maintained with details of each complaint, investigation, root cause analysis, and corrective actions taken.');
            parts.push('All non-conformances identified through internal audits, customer feedback, or operational checks are documented with corrective action plans and timelines for resolution. Effectiveness of corrective actions is verified during subsequent reviews.');
            return parts.join(' ');
        },
    },
    // ===================================================================
    // LABELLING
    // ===================================================================
    {
        domains: ['traceability'],
        topics: ['labelling'],
        generate: (dm) => {
            const batch = str(dm, 'batchNumbering');
            const parts = [];
            parts.push('All packed products are labelled in accordance with destination-country regulations and buyer requirements.');
            if (batch === 'In place')
                parts.push('Each package carries a unique batch/lot number enabling full traceability.');
            parts.push('Labels include: product name, variety (where applicable), country of origin, packer/producer identification, and GlobalG.A.P. Number (GGN) where required.');
            return parts.join(' ');
        },
    },
];
//# sourceMappingURL=answerTemplates.js.map
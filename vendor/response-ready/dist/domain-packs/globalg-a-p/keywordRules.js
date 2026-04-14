// ============================================
// GlobalG.A.P. Domain Pack — Keyword Rules
// ============================================
// Keyword rules mapping question text to GlobalG.A.P. IFA (Integrated
// Farm Assurance) control-point domains. Covers Crops Base, Fruit &
// Vegetables, and Combinable Crops modules.
export const GAP_KEYWORD_RULES = [
    // === Site History & Management ===
    { keywords: ['site history', 'land history', 'previous use', 'land use history', 'prior crop', 'prior land use'], domain: 'site_management', topics: ['site_history'], weight: 10 },
    { keywords: ['risk assessment', 'site risk', 'hazard analysis', 'food safety risk', 'risk register', 'risk identification'], domain: 'site_management', topics: ['risk_assessment'], weight: 10 },
    { keywords: ['reference system', 'visual identification', 'field identification', 'plot reference', 'field map', 'farm map', 'gis', 'mapping'], domain: 'site_management', topics: ['site_reference'], weight: 9 },
    // === Record Keeping & Traceability ===
    { keywords: ['traceability', 'traceable', 'trace back', 'batch', 'lot number', 'product identification'], domain: 'traceability', topics: ['traceability'], weight: 11 },
    { keywords: ['record keeping', 'record-keeping', 'documentation', 'records maintained', 'record system', 'filing system'], domain: 'traceability', topics: ['record_keeping'], weight: 10 },
    { keywords: ['internal audit', 'self-assessment', 'self-inspection', 'internal inspection'], domain: 'traceability', topics: ['internal_audit'], weight: 10 },
    { keywords: ['recall', 'withdrawal', 'product recall', 'recall procedure', 'mock recall', 'traceability test'], domain: 'traceability', topics: ['recall_procedure'], weight: 11 },
    // === Propagation Material & Varieties ===
    { keywords: ['propagation', 'seed', 'seedling', 'rootstock', 'planting material', 'nursery', 'transplant'], domain: 'propagation', topics: ['planting_material'], weight: 10 },
    { keywords: ['variety', 'cultivar', 'gmo', 'genetically modified', 'transgenic', 'genetic modification'], domain: 'propagation', topics: ['variety_selection', 'gmo'], weight: 10 },
    { keywords: ['seed treatment', 'seed dressing', 'treated seed'], domain: 'propagation', topics: ['seed_treatment'], weight: 10 },
    // === Soil & Substrate Management ===
    { keywords: ['soil management', 'soil health', 'soil conservation', 'erosion', 'soil erosion', 'soil structure'], domain: 'soil', topics: ['soil_management'], weight: 10 },
    { keywords: ['soil analysis', 'soil test', 'soil sample', 'soil fertility', 'nutrient analysis', 'soil map'], domain: 'soil', topics: ['soil_analysis'], weight: 10 },
    { keywords: ['substrate', 'growing media', 'growing medium', 'soilless', 'hydroponics', 'peat'], domain: 'soil', topics: ['substrate_management'], weight: 10 },
    { keywords: ['soil fumigation', 'fumigant', 'methyl bromide', 'soil disinfection', 'soil sterilisation', 'soil sterilization'], domain: 'soil', topics: ['fumigation'], weight: 11 },
    // === Fertilizer & Nutrient Management ===
    { keywords: ['fertiliser', 'fertilizer', 'nutrient management', 'nutrient plan', 'fertilisation', 'fertilization', 'npk'], domain: 'fertilizer', topics: ['nutrient_management'], weight: 10 },
    { keywords: ['organic fertiliser', 'organic fertilizer', 'manure', 'compost', 'biosolid', 'organic matter', 'green manure'], domain: 'fertilizer', topics: ['organic_fertilizer'], weight: 10 },
    { keywords: ['fertiliser storage', 'fertilizer storage', 'chemical storage', 'nutrient storage'], domain: 'fertilizer', topics: ['fertilizer_storage'], weight: 10 },
    { keywords: ['fertiliser record', 'fertilizer record', 'application record', 'nutrient record', 'application rate', 'application date'], domain: 'fertilizer', topics: ['fertilizer_records'], weight: 10 },
    { keywords: ['inorganic fertiliser', 'inorganic fertilizer', 'mineral fertiliser', 'mineral fertilizer', 'synthetic fertiliser', 'synthetic fertilizer'], domain: 'fertilizer', topics: ['inorganic_fertilizer'], weight: 9 },
    // === Water Management & Irrigation ===
    { keywords: ['irrigation', 'irrigate', 'drip', 'sprinkler', 'overhead irrigation', 'fertigation'], domain: 'water', topics: ['irrigation_management'], weight: 10 },
    { keywords: ['water source', 'water quality', 'water analysis', 'water test', 'water sampling', 'microbiological', 'e. coli', 'coliform'], domain: 'water', topics: ['water_quality'], weight: 10 },
    { keywords: ['water use', 'water consumption', 'water volume', 'water meter', 'water withdrawal', 'water efficiency'], domain: 'water', topics: ['water_usage'], weight: 9 },
    { keywords: ['water management plan', 'water stewardship', 'water risk', 'water stress', 'water scarcity'], domain: 'water', topics: ['water_management_plan'], weight: 10 },
    { keywords: ['pre-harvest water', 'post-harvest water', 'wash water', 'process water', 'potable'], domain: 'water', topics: ['water_quality', 'food_safety'], weight: 10 },
    // === Integrated Pest Management (IPM) ===
    { keywords: ['integrated pest management', 'ipm', 'pest management', 'pest control strategy'], domain: 'ipm', topics: ['ipm_system'], weight: 11 },
    { keywords: ['pest', 'disease', 'weed', 'insect', 'pathogen', 'fungal', 'fungus', 'virus'], domain: 'ipm', topics: ['pest_monitoring'], weight: 8 },
    { keywords: ['biological control', 'biocontrol', 'beneficial insect', 'natural enemy', 'predator', 'parasitoid'], domain: 'ipm', topics: ['biological_control'], weight: 10 },
    { keywords: ['scouting', 'monitoring', 'threshold', 'action threshold', 'economic threshold', 'pest observation'], domain: 'ipm', topics: ['pest_monitoring'], weight: 9 },
    { keywords: ['crop rotation', 'rotation plan', 'rotation programme', 'crop sequence'], domain: 'ipm', topics: ['crop_rotation'], weight: 10 },
    // === Plant Protection Products (PPP) ===
    { keywords: ['plant protection product', 'ppp', 'pesticide', 'herbicide', 'fungicide', 'insecticide', 'acaricide', 'rodenticide'], domain: 'crop_protection', topics: ['ppp_use'], weight: 11 },
    { keywords: ['spray', 'spraying', 'application equipment', 'sprayer calibration', 'nozzle', 'spray drift'], domain: 'crop_protection', topics: ['application_equipment'], weight: 10 },
    { keywords: ['mrl', 'maximum residue', 'residue analysis', 'residue test', 'residue limit', 'pre-harvest interval', 'phi'], domain: 'crop_protection', topics: ['residue_management'], weight: 11 },
    { keywords: ['ppp storage', 'pesticide storage', 'chemical store', 'agrochemical store', 'locked store'], domain: 'crop_protection', topics: ['ppp_storage'], weight: 10 },
    { keywords: ['ppp record', 'spray record', 'spray diary', 'application log', 'treatment record'], domain: 'crop_protection', topics: ['ppp_records'], weight: 10 },
    { keywords: ['empty container', 'container disposal', 'triple rinsed', 'container management', 'container recycling'], domain: 'crop_protection', topics: ['container_management'], weight: 10 },
    { keywords: ['obsolete', 'expired chemical', 'out of date', 'disposal of ppp', 'surplus chemical'], domain: 'crop_protection', topics: ['ppp_disposal'], weight: 10 },
    { keywords: ['re-entry', 'reentry', 're-entry interval', 'rei', 'restricted entry'], domain: 'crop_protection', topics: ['safety_intervals'], weight: 10 },
    // === Harvest & Post-Harvest ===
    { keywords: ['harvest', 'harvesting', 'picking', 'harvest date', 'harvest record', 'yield'], domain: 'harvest', topics: ['harvest_management'], weight: 9 },
    { keywords: ['post-harvest', 'postharvest', 'packing', 'packhouse', 'pack house', 'grading', 'sorting', 'cold chain'], domain: 'harvest', topics: ['post_harvest'], weight: 10 },
    { keywords: ['hygiene', 'sanitation', 'cleaning', 'disinfection', 'cross contamination', 'cross-contamination'], domain: 'harvest', topics: ['hygiene'], weight: 10 },
    { keywords: ['cool chain', 'cold storage', 'temperature control', 'refrigeration', 'chilled', 'cooling'], domain: 'harvest', topics: ['cold_chain'], weight: 10 },
    { keywords: ['foreign body', 'physical contaminant', 'glass', 'metal detection', 'contamination prevention'], domain: 'harvest', topics: ['contamination_prevention'], weight: 10 },
    // === Food Safety ===
    { keywords: ['food safety', 'food hygiene', 'food defence', 'food defense', 'food fraud', 'adulteration'], domain: 'food_safety', topics: ['food_safety_management'], weight: 11 },
    { keywords: ['haccp', 'hazard analysis', 'critical control point', 'food safety plan', 'food safety management'], domain: 'food_safety', topics: ['haccp'], weight: 11 },
    { keywords: ['allergen', 'allergen management', 'allergen control'], domain: 'food_safety', topics: ['allergen_management'], weight: 10 },
    { keywords: ['microbial', 'microbiological', 'pathogen', 'listeria', 'salmonella'], domain: 'food_safety', topics: ['microbiological_control'], weight: 10 },
    // === Worker Health, Safety & Welfare ===
    { keywords: ['worker health', 'worker safety', 'worker welfare', 'occupational health', 'employee health', 'worker wellbeing'], domain: 'workers', topics: ['worker_health_safety'], weight: 10 },
    { keywords: ['ppe', 'personal protective equipment', 'protective clothing', 'safety equipment', 'gloves', 'respirator', 'face mask'], domain: 'workers', topics: ['ppe'], weight: 10 },
    { keywords: ['training', 'competence', 'qualified', 'certification of competence', 'worker training', 'safety training', 'induction'], domain: 'workers', topics: ['training_competence'], weight: 9 },
    { keywords: ['first aid', 'accident', 'emergency procedure', 'emergency plan', 'incident', 'medical'], domain: 'workers', topics: ['emergency_procedures'], weight: 10 },
    { keywords: ['welfare', 'sanitary', 'toilet', 'hand washing', 'handwashing', 'clean water', 'drinking water', 'rest area'], domain: 'workers', topics: ['welfare_facilities'], weight: 10 },
    { keywords: ['working hours', 'minimum age', 'child labour', 'child labor', 'forced labour', 'forced labor', 'labour rights', 'labor rights'], domain: 'workers', topics: ['labour_practices'], weight: 10 },
    { keywords: ['subcontractor', 'contractor', 'agency worker', 'seasonal worker', 'temporary worker'], domain: 'workers', topics: ['subcontractors'], weight: 9 },
    { keywords: ['grasp', 'social practice', 'social assessment', 'fair working conditions', 'human rights'], domain: 'workers', topics: ['social_practice'], weight: 10 },
    // === Environmental Management ===
    { keywords: ['environment', 'environmental management', 'environmental impact', 'environmental policy', 'ecology', 'ecological'], domain: 'environment', topics: ['environmental_management'], weight: 8 },
    { keywords: ['biodiversity', 'wildlife', 'habitat', 'conservation area', 'buffer zone', 'ecological infrastructure', 'flora', 'fauna'], domain: 'environment', topics: ['biodiversity'], weight: 10 },
    { keywords: ['waste management', 'waste disposal', 'waste reduction', 'waste recycling', 'farm waste'], domain: 'environment', topics: ['waste_management'], weight: 9 },
    { keywords: ['energy efficiency', 'energy consumption', 'energy use', 'energy management', 'carbon footprint', 'greenhouse gas'], domain: 'environment', topics: ['energy'], weight: 9 },
    { keywords: ['pollution', 'contamination', 'pollutant', 'air quality', 'noise', 'light pollution', 'emission'], domain: 'environment', topics: ['pollution_prevention'], weight: 9 },
    { keywords: ['packaging', 'packaging waste', 'packaging material', 'recyclable packaging'], domain: 'environment', topics: ['packaging'], weight: 8 },
    // === Complaints & Continuous Improvement ===
    { keywords: ['complaint', 'customer complaint', 'grievance', 'non-conformance', 'non-conformity', 'corrective action', 'corrective measure'], domain: 'quality', topics: ['complaints'], weight: 10 },
    { keywords: ['continuous improvement', 'improvement plan', 'action plan', 'capa', 'preventive action'], domain: 'quality', topics: ['continuous_improvement'], weight: 9 },
    // === Produce Handling & Quality ===
    { keywords: ['produce handling', 'product handling', 'produce quality', 'quality control', 'quality standard'], domain: 'quality', topics: ['quality_control'], weight: 9 },
    { keywords: ['labelling', 'labeling', 'label', 'product label', 'package marking', 'country of origin'], domain: 'traceability', topics: ['labelling'], weight: 10 },
    { keywords: ['transport', 'transportation', 'vehicle', 'vehicle cleanliness', 'transport conditions'], domain: 'harvest', topics: ['transport'], weight: 8 },
];
export const GAP_DOMAIN_SUGGESTIONS = {
    site_management: ['Site/field maps', 'Land use history', 'Risk assessment register', 'Field/plot reference numbers'],
    traceability: ['Batch/lot numbering system', 'Recall procedure', 'Internal audit records', 'Product labels'],
    propagation: ['Seed/seedling suppliers', 'Variety records', 'Seed treatment records', 'GMO status'],
    soil: ['Soil analysis reports', 'Soil management plan', 'Erosion control measures', 'Substrate specifications'],
    fertilizer: ['Nutrient management plan', 'Fertiliser application records', 'Soil analysis results', 'Fertiliser stock inventory', 'Organic fertiliser sources'],
    water: ['Water sources', 'Water quality analysis', 'Irrigation records', 'Water management plan', 'Water meter readings'],
    ipm: ['IPM plan', 'Pest monitoring records', 'Crop rotation plan', 'Biological control agents used', 'Scouting records'],
    crop_protection: ['PPP application records', 'Spray diary', 'Sprayer calibration certificates', 'MRL test results', 'Chemical store inventory', 'Container disposal records'],
    harvest: ['Harvest records', 'Packhouse hygiene logs', 'Cold chain temperature logs', 'Foreign body checks'],
    food_safety: ['HACCP plan', 'Food safety risk assessment', 'Microbiological test results', 'Allergen register'],
    workers: ['Training records', 'PPE inventory', 'Accident records', 'First aid kits', 'Worker welfare facilities', 'Working hours records', 'Subcontractor agreements'],
    environment: ['Environmental policy', 'Biodiversity action plan', 'Waste disposal records', 'Energy consumption records', 'Recycling records'],
    quality: ['Complaint register', 'Corrective action records', 'Quality inspection records'],
};
//# sourceMappingURL=keywordRules.js.map
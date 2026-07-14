// ============================================
// ESG Domain Pack — Keyword Rules
// ============================================
// 55 keyword rules mapping question text to ESG data domains.
export const ESG_KEYWORD_RULES = [
    // === HIGH-PRIORITY ROUTING OVERRIDES ===
    // These fix persistent routing failures where generic keywords override specific ones.
    // Weight 15+ ensures they win over any combination of lower-weight rules.
    { keywords: ['how many sites', 'how many facilities', 'operational sites', 'operational facilities', 'number of sites', 'number of facilities'], domain: 'site', topics: ['facilities'], weight: 15 },
    { keywords: ['work-related fatalities', 'work-related fatality', 'fatalities during the reporting', 'any fatalities'], domain: 'health_safety', topics: ['fatalities'], weight: 15 },
    { keywords: ['grievance mechanism', 'whistleblowing channel', 'whistleblowing hotline', 'whistleblowing policy', 'whistleblowing', 'whistleblower', 'grievances were reported', 'grievances reported'], domain: 'workforce', topics: ['grievance', 'ethics'], weight: 15 },
    { keywords: ['significant fines', 'sanctions', 'legal proceedings', 'fines or sanctions'], domain: 'goals', topics: ['fines_sanctions'], weight: 15 },
    { keywords: ['list all certifications', 'all current certifications', 'certifications held', 'certifications with validity'], domain: 'regulatory', topics: ['certifications'], weight: 15 },
    { keywords: ['externally verified', 'externally assured', 'external assurance', 'external verification', 'third-party assurance', 'isae 3000', 'aa1000'], domain: 'regulatory', topics: ['external_assurance'], weight: 15 },
    { keywords: ['publish a sustainability report', 'publish a sustainability', 'publish an esg report', 'do you publish'], domain: 'regulatory', topics: ['transparency'], weight: 15 },
    { keywords: ['csrd', 'subject to csrd', 'csrd reporting obligations', 'csrd applicability', 'csrd timeline', 'compliance with the european sustainability'], domain: 'regulatory', topics: ['csrd'], weight: 15 },
    { keywords: ['water management policy', 'water stewardship'], domain: 'energy_water', topics: ['water_usage', 'water_stress'], weight: 30 },
    { keywords: ['supplier code of conduct'], domain: 'buyer_requirements', topics: ['supplier_code'], weight: 30 },
    { keywords: ['business model', 'principal products', 'markets served'], domain: 'products', topics: ['products_services', 'company_profile'], weight: 30 },
    // Narrow, high-weight overrides for new-domain topics. Keyed on SPECIFIC terms only
    // so they win for genuine questions without contaminating broader workforce/regulatory
    // questions (e.g. a gender-breakdown question filed under a "human rights" category).
    { keywords: ['child labor', 'child labour', 'forced labor', 'forced labour', 'forced or compulsory labor', 'forced or compulsory labour', 'bonded labor', 'bonded labour', 'involuntary labor', 'involuntary labour', 'indentured', 'modern slavery', 'human trafficking', 'surrender', 'identification or passport', 'passports as a condition'], domain: 'workforce', topics: ['forced_child_labor'], weight: 16 },
    { keywords: ['mrsl', 'zdhc', 'restricted substances', 'restricted substance', 'chemical inventory', 'chemical management', 'chemical discharge', 'svhc', 'pfas'], domain: 'regulatory', topics: ['chemical_management'], weight: 16 },
    { keywords: ['sanctions screening', 'sanctioned parties', 'denied parties', 'export control', 'export controls', 'trade compliance', 'dual-use'], domain: 'goals', topics: ['trade_compliance'], weight: 30 },
    { keywords: ['incidents of bribery', 'bribery or corruption', 'incidents of corruption', 'corruption been identified', 'corruption or bribery', 'bribery been identified'], domain: 'goals', topics: ['fines_sanctions'], weight: 16 },
    { keywords: ['eco-label', 'ecolabel', 'eu ecolabel', 'blue angel', 'nordic swan', 'type i ecolabel'], domain: 'regulatory', topics: ['ecolabels'], weight: 16 },
    { keywords: ['sustainable fibers', 'sustainable fibres', 'recycled polyester', 'recycled cotton', 'organic cotton', 'gots', 'grs', 'rds', 'animal-derived', 'animal welfare', 'primary fibers', 'primary fibres', 'leather, wool', 'wool, down'], domain: 'materials', topics: ['sustainable_materials'], weight: 16 },
    { keywords: ['conflict minerals', 'responsible minerals', '3tg', 'cmrt', 'emrt', 'tantalum', 'tungsten', 'cobalt', 'smelter', 'refiner', 'oecd due diligence', 'conflict-free', 'drc conflict'], domain: 'materials', topics: ['conflict_minerals'], weight: 16 },
    // === GHG Emissions (all scopes route to 'emissions' domain) ===
    { keywords: ['scope 1', 'scope1', 'direct emission', 'direct ghg', 'stationary combustion', 'mobile combustion', 'fugitive'], domain: 'emissions', topics: ['ghg_emissions', 'scope_1'], weight: 10 },
    { keywords: ['scope 2', 'scope2', 'indirect emission', 'purchased electricity emission', 'purchased energy emission', 'market-based', 'location-based'], domain: 'emissions', topics: ['ghg_emissions', 'scope_2'], weight: 10 },
    { keywords: ['scope 3', 'scope3', 'value chain emission', 'upstream emission', 'downstream emission'], domain: 'emissions', topics: ['ghg_emissions', 'scope_3'], weight: 10 },
    { keywords: ['greenhouse gas', 'ghg', 'carbon emission', 'co2', 'carbon dioxide', 'tco2e', 'carbon footprint', 'climate change'], domain: 'emissions', topics: ['ghg_emissions', 'climate_targets'], weight: 8 },
    { keywords: ['carbon neutral', 'net zero', 'net-zero', 'climate target', 'sbti', 'science based target', 'emission reduction target'], domain: 'goals', topics: ['climate_targets', 'ghg_emissions'], weight: 8 },
    { keywords: ['refrigerant', 'hfc', 'f-gas', 'fluorinated'], domain: 'emissions', topics: ['ghg_emissions', 'scope_1'], weight: 9 },
    // === Energy ===
    { keywords: ['electricity', 'electric', 'kwh', 'kilowatt', 'power consumption', 'grid'], domain: 'energy_electricity', topics: ['energy_consumption'], weight: 9 },
    { keywords: ['percentage renewable', 'percent renewable', 'renewable source', 'share of renewable', 'renewable percentage'], domain: 'energy_electricity', topics: ['renewable_share'], weight: 11 },
    { keywords: ['renewable', 'solar', 'wind', 'hydro', 'green energy', 'clean energy', 'ppa', 'power purchase agreement', 'green tariff'], domain: 'energy_electricity', topics: ['renewable_energy'], weight: 9 },
    { keywords: ['natural gas', 'fuel oil', 'diesel', 'petrol', 'gasoline', 'lpg', 'propane', 'heating oil', 'combustion'], domain: 'energy_fuel', topics: ['energy_consumption', 'scope_1'], weight: 9 },
    { keywords: ['fuel type', 'fuel source', 'fuel consumption', 'fuel quantities'], domain: 'energy_fuel', topics: ['energy_consumption', 'scope_1'], weight: 10 },
    { keywords: ['energy efficiency', 'energy saving', 'energy reduction', 'energy measure'], domain: 'energy_electricity', topics: ['energy_efficiency'], weight: 10 },
    { keywords: ['energy consumption', 'energy use', 'energy intensity', 'energy management'], domain: 'energy_electricity', topics: ['energy_consumption'], weight: 7 },
    // === Water ===
    { keywords: ['water consumption', 'water use', 'water withdrawal', 'water intake', 'water intensity'], domain: 'energy_water', topics: ['water_usage'], weight: 9 },
    { keywords: ['wastewater', 'effluent', 'water discharge', 'water treatment', 'water pollution'], domain: 'effluents', topics: ['wastewater', 'water_usage'], weight: 9 },
    { keywords: ['water stress', 'water scarcity', 'water risk', 'water-stressed'], domain: 'energy_water', topics: ['water_stress'], weight: 10 },
    { keywords: ['irrigation', 'irrigation water', 'water reused', 'water reuse'], domain: 'energy_water', topics: ['water_usage', 'sector_metrics'], weight: 12 },
    // === Waste (fine-grained topics) ===
    { keywords: ['total waste', 'waste generated', 'waste volume', 'waste weight'], domain: 'waste', topics: ['waste_total'], weight: 10 },
    { keywords: ['recycling', 'recycle', 'recycling rate', 'diversion rate', 'waste diversion'], domain: 'waste', topics: ['recycling'], weight: 10 },
    { keywords: ['hazardous waste', 'hazardous material', 'dangerous goods', 'special waste'], domain: 'waste', topics: ['hazardous_waste'], weight: 11 },
    { keywords: ['medical waste', 'pharmaceutical waste', 'clinical waste'], domain: 'waste', topics: ['healthcare_waste'], weight: 12 },
    { keywords: ['tailings', 'tailings generated', 'mine waste'], domain: 'waste', topics: ['mining_metrics'], weight: 12 },
    { keywords: ['circular economy', 'circularity', 'closed loop', 'take-back', 'material reuse', 'product reuse', 'refurbish'], domain: 'waste', topics: ['circular_economy'], weight: 10 },
    { keywords: ['waste', 'landfill', 'incineration', 'disposal'], domain: 'waste', topics: ['waste_management'], weight: 7 },
    // === Materials & Packaging ===
    { keywords: ['raw material', 'material consumption', 'material use', 'virgin material', 'primary material', 'recycled source', 'primary raw'], domain: 'materials', topics: ['raw_materials'], weight: 11 },
    { keywords: ['fertilizer', 'fertiliser', 'pesticide', 'land use', 'hectares', 'seasonal workers'], domain: 'materials', topics: ['agriculture_inputs', 'raw_materials'], weight: 12 },
    { keywords: ['ore processed', 'material processed', 'rehabilitated land', 'mining inputs'], domain: 'materials', topics: ['mining_metrics', 'raw_materials'], weight: 12 },
    { keywords: ['concrete', 'steel tonnes', 'equipment hours', 'construction materials'], domain: 'materials', topics: ['construction_materials', 'raw_materials'], weight: 12 },
    { keywords: ['recycled content', 'recycled material', 'secondary material', 'post-consumer', 'pre-consumer'], domain: 'materials', topics: ['raw_materials', 'circular_economy'], weight: 11 },
    { keywords: ['packaging', 'package', 'packaging material', 'single-use', 'plastic packaging', 'recyclable packaging', 'recycled content packaging'], domain: 'packaging', topics: ['packaging'], weight: 10 },
    // === Supply Chain ===
    // Includes non-contiguous "assessment/audit … of your suppliers" phrasings (C): the matcher
    // has no keyword co-occurrence logic, so the natural EN word orders are enumerated here, and
    // the German "Audits/Bewertungen Ihrer Lieferanten" phrasings are bridged via germanAliases.
    { keywords: ['supplier assessment', 'supplier audit', 'supplier screening', 'suppliers assessed', 'percentage of suppliers', 'percent of suppliers', '% of suppliers', 'audits of your suppliers', 'audit of your suppliers', 'audits of suppliers', 'audit of suppliers', 'assessments of your suppliers', 'assessment of your suppliers', 'assessments of suppliers', 'assessment of suppliers', 'audit your suppliers', 'assess your suppliers'], domain: 'buyer_requirements', topics: ['supply_chain_monitoring'], weight: 16 },
    { keywords: ['supply chain esg', 'supply chain sustainability', 'supplier esg', 'esg performance supply'], domain: 'buyer_requirements', topics: ['supply_chain_monitoring'], weight: 10 },
    { keywords: ['conflict minerals', 'cmrt', 'conflict mineral reporting', '3tg', 'responsible minerals'], domain: 'materials', topics: ['conflict_minerals', 'compliance'], weight: 10 },
    { keywords: ['supplier', 'supply chain', 'vendor', 'procurement', 'sourcing'], domain: 'buyer_requirements', topics: ['supplier_management'], weight: 7 },
    // Supply-chain / human-rights due diligence (LkSG, EUDR, CSDDD). Weight 14 so specific
    // due-diligence language wins over the generic supplier rule but sits below the w16
    // supplier-assessment override.
    { keywords: ['due diligence', 'human rights due diligence', 'hrdd', 'lksg', 'lieferkettengesetz', 'supply chain act', 'csddd', 'cs3d', 'eudr', 'deforestation regulation'], domain: 'buyer_requirements', topics: ['supply_chain_monitoring', 'human_rights'], weight: 14 },
    // === Transport & Logistics ===
    { keywords: ['business travel', 'employee commuting', 'commute'], domain: 'transport', topics: ['scope_3', 'business_travel'], weight: 10 },
    { keywords: ['remote work', 'work from home', 'wfh'], domain: 'transport', topics: ['business_travel', 'scope_3'], weight: 10 },
    { keywords: ['fleet', 'vehicle', 'truck', 'delivery', 'fleet composition', 'km driven', 'kilometers driven', 'alternative fuel vehicles'], domain: 'transport', topics: ['fleet'], weight: 9 },
    { keywords: ['transport', 'transportation', 'logistics', 'shipping', 'freight', 'distribution'], domain: 'transport', topics: ['transport', 'logistics'], weight: 8 },
    // === Workforce (fine-grained topics) ===
    // 'fte' as a bare token is dropped (M17 stopgap): German umlaut-folding turns '-kräfte'
    // compounds (Fachkräfte, Pflegekräfte) into a stray 'fte' and spuriously hit employee_count.
    // The 'vollzeitäquivalent' alias still injects 'full-time equivalent' (and 'fte') for real FTE questions.
    { keywords: ['employee', 'headcount', 'full-time equivalent', 'workforce size', 'staff', 'personnel', 'how many employees', 'number of employees', 'total number of employees'], domain: 'workforce', topics: ['employee_count'], weight: 9 },
    { keywords: ['diversity', 'gender', 'female', 'male', 'women', 'minority', 'inclusion', 'gender breakdown'], domain: 'workforce', topics: ['diversity'], weight: 10 },
    { keywords: ['dei', 'diversity equity inclusion', 'diversity and inclusion', 'diversity policy', 'equal opportunity', 'non-discrimination'], domain: 'workforce', topics: ['dei_policy'], weight: 11 },
    { keywords: ['human rights', 'forced labor', 'child labor', 'modern slavery', 'labor rights'], domain: 'workforce', topics: ['human_rights'], weight: 10 },
    { keywords: ['freedom of association', 'right to organize', 'union rights'], domain: 'workforce', topics: ['freedom_of_association'], weight: 11 },
    { keywords: ['working conditions', 'working hours', 'overtime', 'rest period', 'rest break', 'break time', 'leave entitlement'], domain: 'workforce', topics: ['working_conditions'], weight: 10 },
    { keywords: ['wage', 'compensation', 'living wage', 'fair pay', 'minimum wage', 'fair wage'], domain: 'workforce', topics: ['labor_practices'], weight: 9 },
    { keywords: ['new hire', 'new hires', 'departure', 'departures', 'joiners', 'leavers', 'how many joined', 'how many departed'], domain: 'workforce', topics: ['hires_departures'], weight: 10 },
    { keywords: ['attrition', 'employee retention', 'staff turnover', 'employee turnover', 'turnover rate'], domain: 'workforce', topics: ['turnover', 'labor_practices'], weight: 9 },
    // HR / social metrics (ESRS S1 / EcoVadis): absenteeism, leave, engagement, pay equity.
    { keywords: ['absenteeism', 'absence rate', 'sick leave', 'parental leave', 'maternity leave', 'paternity leave', 'employee engagement', 'employee satisfaction', 'gender pay gap', 'pay equity', 'equal pay'], domain: 'workforce', topics: ['labor_practices'], weight: 10 },
    { keywords: ['collective bargaining', 'trade union', 'works council', 'labor union', 'union representation', 'freedom of association', 'cba'], domain: 'workforce', topics: ['collective_bargaining', 'labor_practices'], weight: 9 },
    { keywords: ['grievance', 'complaint mechanism', 'whistleblow', 'whistleblowing', 'speak up', 'reporting channel', 'ethics hotline', 'grievance mechanism'], domain: 'workforce', topics: ['grievance', 'ethics'], weight: 11 },
    { keywords: ['leadership diversity', 'women in leadership', 'women in management', 'board diversity', 'management diversity'], domain: 'workforce', topics: ['diversity', 'leadership_diversity'], weight: 10 },
    // === Health & Safety ===
    { keywords: ['trir', 'ltir', 'incident rate', 'recordable incident', 'lost time', 'injury', 'accident'], domain: 'health_safety', topics: ['health_safety_kpi'], weight: 10 },
    { keywords: ['fatality', 'fatalities', 'work-related death', 'work-related fatality'], domain: 'health_safety', topics: ['fatalities'], weight: 11 },
    { keywords: ['health and safety', 'health & safety', 'occupational health', 'workplace safety', 'ohs', 'ehs', 'safety management system'], domain: 'health_safety', topics: ['health_safety_management'], weight: 9 },
    // === Training ===
    // weight 11 (> workforce 'employee' 9) so a training question phrased "…per employee"
    // (DE: "…pro Mitarbeitendem") routes to training, not employee_count.
    { keywords: ['training', 'learning', 'development', 'skill', 'capacity building', 'training hours', 'training programme'], domain: 'training', topics: ['training'], weight: 11 },
    // === Certifications & Compliance ===
    { keywords: ['certification', 'certified', 'iso certification', 'iso standard', 'accreditation'], domain: 'regulatory', topics: ['certifications'], weight: 8 },
    { keywords: ['iso 14001', 'emas', 'environmental management'], domain: 'regulatory', topics: ['certifications', 'policies'], weight: 9 },
    { keywords: ['iso 45001', 'ohsas', 'safety management', 'safety certification'], domain: 'regulatory', topics: ['certifications', 'health_safety_management'], weight: 10 },
    { keywords: ['iatf 16949', 'iatf16949', 'automotive quality management'], domain: 'regulatory', topics: ['certifications', 'compliance'], weight: 9 },
    { keywords: ['rohs', 'restriction of hazardous substances'], domain: 'regulatory', topics: ['certifications', 'compliance'], weight: 9 },
    { keywords: ['reach', 'reach regulation', 'reach compliance', 'svhc'], domain: 'regulatory', topics: ['certifications', 'compliance'], weight: 9 },
    { keywords: ['weee', 'waste electrical', 'electronic waste', 'e-waste'], domain: 'waste', topics: ['waste_management', 'compliance'], weight: 9 },
    { keywords: ['haccp', 'food safety', 'brc', 'fssc 22000'], domain: 'regulatory', topics: ['certifications', 'compliance'], weight: 9 },
    { keywords: ['oeko-tex', 'oeko tex', 'gots', 'bluesign', 'textile standard'], domain: 'regulatory', topics: ['certifications', 'compliance'], weight: 9 },
    // === Governance & Strategy ===
    { keywords: ['policy', 'policies', 'commitment'], domain: 'goals', topics: ['policies'], weight: 6 },
    { keywords: ['compliance', 'regulation', 'regulatory', 'legal requirement', 'legislation'], domain: 'regulatory', topics: ['compliance'], weight: 7 },
    // EU Taxonomy gets its own topic (D) so it beats the generic transparency/compliance route
    // and lands on the dedicated EU-Taxonomy template rather than the sustainability-report one.
    { keywords: ['eu taxonomy', 'taxonomy alignment', 'taxonomy assessment', 'taxonomy-aligned', 'taxonomy eligible', 'taxonomy eligibility'], domain: 'regulatory', topics: ['eu_taxonomy', 'compliance'], weight: 12 },
    { keywords: ['data protection', 'data privacy', 'privacy policy', 'gdpr', 'personal data', 'information security policy', 'cybersecurity', 'cyber security', 'information security', 'infosec', 'data breach', 'ransomware', 'soc 2'], domain: 'goals', topics: ['data_protection'], weight: 11 },
    { keywords: ['fine', 'fines', 'sanction', 'sanctions', 'legal proceedings', 'penalty', 'penalties', 'regulatory action'], domain: 'goals', topics: ['fines_sanctions'], weight: 11 },
    { keywords: ['esg compensation', 'esg incentive', 'esg-linked', 'sustainability incentive', 'executive compensation linked', 'remuneration linked'], domain: 'goals', topics: ['esg_compensation'], weight: 11 },
    { keywords: ['incident investigation', 'root cause analysis', 'corrective action', 'near miss'], domain: 'health_safety', topics: ['incident_investigation'], weight: 10 },
    { keywords: ['ethics', 'ethical', 'code of ethics', 'code of conduct', 'anti-corruption', 'bribery', 'animal testing', 'cruelty-free'], domain: 'goals', topics: ['ethics', 'policies'], weight: 8 },
    // Governance / business-ethics topics (EcoVadis Ethics / CDP governance).
    { keywords: ['conflict of interest', 'anti-money laundering', 'aml', 'money laundering', 'lobbying', 'political contributions', 'political donations', 'tax transparency', 'tax strategy', 'fair competition', 'antitrust', 'anti-competitive'], domain: 'goals', topics: ['ethics', 'policies'], weight: 10 },
    { keywords: ['corporate governance', 'board oversight', 'esg governance', 'esg oversight', 'senior management oversight', 'governance structure', 'management responsibility'], domain: 'goals', topics: ['governance', 'strategy'], weight: 9 },
    { keywords: ['subsidiary', 'parent company', 'group structure', 'holding company', 'corporate structure'], domain: 'company', topics: ['group_structure'], weight: 10 },
    { keywords: ['sustainability report', 'sustainability reporting', 'annual report', 'esg report', 'publish a sustainability'], domain: 'regulatory', topics: ['transparency'], weight: 9 },
    { keywords: ['sustainability goal', 'sustainability target', 'target timeline'], domain: 'goals', topics: ['targets', 'strategy'], weight: 8 },
    { keywords: ['esg risk', 'material esg risk', 'material risk', 'risk identification', 'manage material'], domain: 'swot', topics: ['risk_management'], weight: 9 },
    { keywords: ['risk assessment', 'risk management'], domain: 'swot', topics: ['risk_management'], weight: 7 },
    { keywords: ['procurement decision', 'sourcing decision', 'sustainable procurement', 'sustainability procurement', 'sustainability considerations'], domain: 'goals', topics: ['strategy', 'supplier_management'], weight: 9 },
    // === Company Profile ===
    { keywords: ['company name', 'legal name', 'legal entity', 'registered name', 'headquarters', 'head office'], domain: 'company', topics: ['company_profile'], weight: 8 },
    { keywords: ['production volume', 'units produced', 'production hours', 'production output'], domain: 'products', topics: ['production_metrics', 'products_services'], weight: 12 },
    { keywords: ['warehouse space', 'deliveries made', 'store count', 'store area', 'office space'], domain: 'products', topics: ['facility_metrics', 'products_services'], weight: 11 },
    { keywords: ['product', 'service', 'main products', 'primary markets'], domain: 'products', topics: ['products_services'], weight: 8 },
    { keywords: ['revenue', 'sales', 'financial', 'revenue band'], domain: 'financial_context', topics: ['revenue'], weight: 8 },
    // High-weight revenue override: 'annual/net/company turnover' is a revenue question, not
    // workforce attrition. Bare 'turnover' was dropped from both financial and workforce rules
    // to break the collision (M7).
    { keywords: ['annual turnover', 'net turnover', 'company turnover', 'gross turnover'], domain: 'financial_context', topics: ['revenue'], weight: 15 },
    { keywords: ['site', 'facility', 'location', 'factory', 'office', 'premises'], domain: 'site', topics: ['facilities'], weight: 5 },
    { keywords: ['objective', 'ambition', 'sustainability target', 'emission target', 'reduction target', 'esg goal', 'esg target'], domain: 'goals', topics: ['targets', 'strategy'], weight: 3 },
    { keywords: ['customer', 'client', 'buyer', 'target market', 'market scope'], domain: 'external_context', topics: ['company_profile'], weight: 6 },
    { keywords: ['questionnaire', 'assessment', 'rating'], domain: 'buyer_requirements', topics: ['compliance', 'transparency'], weight: 7 },
    // Named external ESG rating / assessment schemes (E). Distinct topic + weight so these land
    // on the dedicated external-ratings template (reports EcoVadis/CDP if held, honest gap
    // otherwise) instead of falling through to a procurement/insufficiency answer or, in DE, the
    // matrix data-dump that leaks raw English status strings. EN and DE hit the same rule because
    // the scheme names are English tokens in both.
    { keywords: ['ecovadis', 'cdp', 'djsi', 'dow jones sustainability', 'sedex', 'smeta', 'integritynext', 'nqc', 'achilles', 'supplier assurance', 'esg rating', 'esg ratings', 'sustainability rating'], domain: 'buyer_requirements', topics: ['external_ratings'], weight: 12 },
    // === Coverage additions (new ESG topic areas) ===
    // Materiality / double materiality (CSRD/ESRS IRO-1, EcoVadis). Weight 12 so it beats the
    // generic 'assessment'/'rating' rule for "materiality assessment".
    { keywords: ['materiality', 'material topics', 'double materiality', 'materiality assessment', 'impact materiality', 'financial materiality'], domain: 'goals', topics: ['strategy', 'governance'], weight: 12 },
    // Biodiversity / nature / deforestation (ESRS E4 / CDP Forests / EUDR). Weight 13 so
    // 'land use change' outranks the agriculture 'land use' rule (weight 12).
    { keywords: ['biodiversity', 'biodiverse', 'ecosystem', 'nature-related', 'deforestation', 'land use change', 'land-use change', 'palm oil', 'no-deforestation'], domain: 'goals', topics: ['biodiversity', 'strategy'], weight: 13 },
    // Air / other pollution + environmental incidents (ESRS E2). Routed to effluents/pollution
    // (kept distinct from the carbon 'emissions' domain so NOx/SOx aren't read as GHG).
    { keywords: ['air pollution', 'air emissions', 'nox', 'sox', 'so2', 'voc', 'particulate', 'pm2.5', 'pm10', 'noise pollution', 'environmental incident', 'spill', 'chemical spill', 'release to environment'], domain: 'effluents', topics: ['pollution'], weight: 10 },
    // Community engagement / social investment (GRI 413 / EcoVadis).
    { keywords: ['community engagement', 'local community', 'community investment', 'corporate social responsibility', 'philanthropy', 'charitable', 'indigenous'], domain: 'goals', topics: ['strategy', 'company_profile'], weight: 8 },
];
export const ESG_DOMAIN_SUGGESTIONS = {
    company: ['Company name', 'Industry', 'Number of employees', 'Revenue band'],
    site: ['Site locations', 'Floor area', 'Site types'],
    goals: ['Sustainability goals', 'Target timelines', 'Code of ethics'],
    swot: ['Strengths', 'Opportunities', 'Risk areas'],
    regulatory: ['Certifications held', 'CSRD applicability', 'Compliance frameworks'],
    materials: ['Raw material sources', 'Recycled content %', 'Conflict minerals due diligence'],
    packaging: ['Packaging types', 'Packaging weight', 'Recyclability %'],
    energy_electricity: ['Electricity consumption (kWh)', 'Renewable %', 'Energy efficiency measures'],
    energy_fuel: ['Fuel consumption by type', 'Heating fuel use'],
    energy_water: ['Water withdrawal (m3)', 'Water sources', 'Water stress assessment'],
    emissions: ['Scope 1 emissions (tCO2e)', 'Scope 2 emissions (location & market-based)', 'Scope 3 emissions'],
    infrastructure: ['Floor area (m2)', 'Building age', 'Major equipment'],
    transport: ['Fleet composition', 'Business travel km', 'Employee commuting'],
    workforce: ['Total FTE', 'Gender breakdown', 'Women in leadership %', 'Turnover rate', 'Collective bargaining %', 'Living wage', 'Grievance mechanism', 'Human rights policy', 'Fair wages'],
    health_safety: ['TRIR', 'Lost time incidents', 'H&S management system'],
    training: ['Training hours per employee', 'Safety training', 'Sustainability training'],
    waste: ['Total waste (kg)', 'Diversion rate', 'Hazardous waste', 'Circular economy initiatives'],
    products: ['Main products/services', 'Markets served'],
    effluents: ['Wastewater discharge', 'Treatment level'],
    external_context: ['Market scope', 'Customer types'],
    financial_context: ['Revenue band', 'Sustainability budget'],
    buyer_requirements: ['Supplier code of conduct', 'Supply chain ESG monitoring'],
};
//# sourceMappingURL=keywordRules.js.map
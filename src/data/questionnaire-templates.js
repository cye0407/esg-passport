// ============================================
// Pre-loaded Questionnaire Templates
// ============================================
// These provide ready-to-use question sets for common ESG frameworks,
// so users don't need to upload a file.

export const QUESTIONNAIRE_TEMPLATES = {
  ecovadis: {
    id: 'ecovadis',
    name: 'EcoVadis Assessment',
    description: 'Standard EcoVadis sustainability assessment covering Environment, Labor, Ethics, and Sustainable Procurement.',
    framework: 'EcoVadis',
    questionCount: 35,
    questions: [
      // Environment — Energy & GHG
      { id: 'ev-1', text: 'What is your total energy consumption for the reporting period (in kWh or MWh)?', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      { id: 'ev-2', text: 'What percentage of your total energy consumption comes from renewable sources?', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      { id: 'ev-3', text: 'What are your total Scope 1 (direct) greenhouse gas emissions in tCO2e?', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      { id: 'ev-4', text: 'What are your total Scope 2 (indirect - electricity) greenhouse gas emissions in tCO2e?', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      { id: 'ev-5', text: 'Do you have a policy or commitment to reduce greenhouse gas emissions? If so, describe your targets and timeline.', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      { id: 'ev-6', text: 'What actions have you taken to reduce energy consumption and improve energy efficiency?', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      // Environment — Water
      { id: 'ev-7', text: 'What is your total water consumption (in m³) for the reporting period?', category: 'Environment', subcategory: 'Water' },
      { id: 'ev-8', text: 'Do you have a water management policy? Describe your approach to water stewardship.', category: 'Environment', subcategory: 'Water' },
      // Environment — Waste & Pollution
      { id: 'ev-9', text: 'What is the total weight of waste generated (in kg or tonnes)?', category: 'Environment', subcategory: 'Pollution & Waste' },
      { id: 'ev-10', text: 'What is your waste recycling or diversion rate?', category: 'Environment', subcategory: 'Pollution & Waste' },
      { id: 'ev-11', text: 'How much hazardous waste did your operations generate?', category: 'Environment', subcategory: 'Pollution & Waste' },
      { id: 'ev-12', text: 'What measures are in place to prevent and manage pollution (air, water, soil)?', category: 'Environment', subcategory: 'Pollution & Waste' },
      // Environment — Biodiversity & EMS
      { id: 'ev-13', text: 'Do you have an Environmental Management System (e.g., ISO 14001)? Describe your environmental management approach.', category: 'Environment', subcategory: 'Environmental Management' },
      { id: 'ev-14', text: 'What actions do you take to protect biodiversity and ecosystems?', category: 'Environment', subcategory: 'Biodiversity' },
      // Labor & Human Rights
      { id: 'ev-15', text: 'How many employees (FTE) does your company employ?', category: 'Labor & Human Rights', subcategory: 'Workforce' },
      { id: 'ev-16', text: 'What is the gender breakdown of your workforce (% female, % male)?', category: 'Labor & Human Rights', subcategory: 'Diversity & Inclusion' },
      { id: 'ev-17', text: 'What is your Total Recordable Incident Rate (TRIR) or Lost Time Injury Frequency Rate (LTIFR)?', category: 'Labor & Human Rights', subcategory: 'Health & Safety' },
      { id: 'ev-18', text: 'How many work-related fatalities occurred during the reporting period?', category: 'Labor & Human Rights', subcategory: 'Health & Safety' },
      { id: 'ev-19', text: 'Do you have a health and safety management system (e.g., ISO 45001)? Describe your approach.', category: 'Labor & Human Rights', subcategory: 'Health & Safety' },
      { id: 'ev-20', text: 'What is the average number of training hours per employee per year?', category: 'Labor & Human Rights', subcategory: 'Training & Development' },
      { id: 'ev-21', text: 'Do you have policies addressing child labor, forced labor, and freedom of association?', category: 'Labor & Human Rights', subcategory: 'Human Rights' },
      { id: 'ev-22', text: 'Do you have a diversity and inclusion policy? Describe your commitments.', category: 'Labor & Human Rights', subcategory: 'Diversity & Inclusion' },
      { id: 'ev-23', text: 'What is your employee turnover rate?', category: 'Labor & Human Rights', subcategory: 'Working Conditions' },
      // Ethics
      { id: 'ev-24', text: 'Do you have a Code of Conduct or Business Ethics policy? Describe its scope and enforcement.', category: 'Ethics', subcategory: 'Business Ethics' },
      { id: 'ev-25', text: 'Do you have an anti-corruption and anti-bribery policy? How is it implemented?', category: 'Ethics', subcategory: 'Anti-Corruption' },
      { id: 'ev-26', text: 'Do you have a whistleblowing or grievance mechanism? How do employees report concerns?', category: 'Ethics', subcategory: 'Grievance Mechanism' },
      { id: 'ev-27', text: 'Do you have a data protection and privacy policy (e.g., GDPR compliance)?', category: 'Ethics', subcategory: 'Information Security' },
      { id: 'ev-28', text: 'Have there been any significant fines or sanctions related to business ethics in the past 3 years?', category: 'Ethics', subcategory: 'Compliance' },
      // Sustainable Procurement
      { id: 'ev-29', text: 'Do you have a Supplier Code of Conduct? What standards do you require from suppliers?', category: 'Sustainable Procurement', subcategory: 'Supplier Standards' },
      { id: 'ev-30', text: 'How do you assess and monitor your suppliers on ESG criteria?', category: 'Sustainable Procurement', subcategory: 'Supplier Assessment' },
      { id: 'ev-31', text: 'What percentage of your critical suppliers have been assessed on sustainability criteria?', category: 'Sustainable Procurement', subcategory: 'Supplier Assessment' },
      { id: 'ev-32', text: 'Do you have a responsible sourcing policy for raw materials?', category: 'Sustainable Procurement', subcategory: 'Responsible Sourcing' },
      { id: 'ev-33', text: 'What actions do you take to address ESG risks in your supply chain?', category: 'Sustainable Procurement', subcategory: 'Supply Chain Risk' },
      // Overall
      { id: 'ev-34', text: 'Do you publish a sustainability or CSR report? If so, which standards does it follow (GRI, CSRD/ESRS, etc.)?', category: 'General', subcategory: 'Reporting' },
      { id: 'ev-35', text: 'What certifications does your company hold (ISO 14001, ISO 45001, ISO 9001, SA8000, etc.)?', category: 'General', subcategory: 'Certifications' },
    ],
  },

  cdp_climate: {
    id: 'cdp_climate',
    name: 'CDP Climate Change',
    description: 'CDP Climate Change questionnaire covering governance, risks, emissions, targets, and strategy.',
    framework: 'CDP',
    questionCount: 25,
    questions: [
      // Governance
      { id: 'cdp-1', text: 'Does your board or most senior governing body have oversight of climate-related issues?', category: 'Governance', subcategory: 'Board Oversight' },
      { id: 'cdp-2', text: 'Describe the highest management-level position(s) with responsibility for climate-related issues.', category: 'Governance', subcategory: 'Management Responsibility' },
      { id: 'cdp-3', text: 'Do you have an incentive scheme linked to climate targets? Describe.', category: 'Governance', subcategory: 'Incentives' },
      // Risks & Opportunities
      { id: 'cdp-4', text: 'Have you identified any climate-related risks with the potential to have a substantive financial impact? Describe.', category: 'Risks & Opportunities', subcategory: 'Climate Risks' },
      { id: 'cdp-5', text: 'Have you identified any climate-related opportunities? Describe.', category: 'Risks & Opportunities', subcategory: 'Climate Opportunities' },
      // Emissions — Scope 1
      { id: 'cdp-6', text: 'What are your total gross Scope 1 emissions in tCO2e?', category: 'Emissions', subcategory: 'Scope 1' },
      { id: 'cdp-7', text: 'What methodology and emission factors did you use to calculate Scope 1 emissions?', category: 'Emissions', subcategory: 'Scope 1' },
      // Emissions — Scope 2
      { id: 'cdp-8', text: 'What are your Scope 2 location-based emissions in tCO2e?', category: 'Emissions', subcategory: 'Scope 2' },
      { id: 'cdp-9', text: 'What are your Scope 2 market-based emissions in tCO2e?', category: 'Emissions', subcategory: 'Scope 2' },
      { id: 'cdp-10', text: 'What methodology did you use to calculate Scope 2 emissions?', category: 'Emissions', subcategory: 'Scope 2' },
      // Emissions — Scope 3
      { id: 'cdp-11', text: 'Which Scope 3 categories are relevant to your organization and have you calculated emissions for them?', category: 'Emissions', subcategory: 'Scope 3' },
      { id: 'cdp-12', text: 'What are your total Scope 3 emissions in tCO2e? Break down by relevant category.', category: 'Emissions', subcategory: 'Scope 3' },
      { id: 'cdp-13', text: 'Do you measure emissions from your upstream supply chain? Describe your approach.', category: 'Emissions', subcategory: 'Scope 3' },
      // Energy
      { id: 'cdp-14', text: 'What is your total energy consumption in MWh?', category: 'Energy', subcategory: 'Consumption' },
      { id: 'cdp-15', text: 'What percentage of your energy consumption is from renewable sources?', category: 'Energy', subcategory: 'Renewables' },
      { id: 'cdp-16', text: 'What energy efficiency measures have you implemented?', category: 'Energy', subcategory: 'Efficiency' },
      // Targets
      { id: 'cdp-17', text: 'Do you have an emissions reduction target? Describe the target, base year, and timeline.', category: 'Targets', subcategory: 'Emission Targets' },
      { id: 'cdp-18', text: 'Is your target a science-based target (SBTi)? What is the status?', category: 'Targets', subcategory: 'SBTi' },
      { id: 'cdp-19', text: 'What progress have you made toward your emissions reduction target?', category: 'Targets', subcategory: 'Progress' },
      // Strategy
      { id: 'cdp-20', text: 'How does climate change influence your business strategy?', category: 'Strategy', subcategory: 'Climate Strategy' },
      { id: 'cdp-21', text: 'Have you conducted scenario analysis (e.g., 1.5°C, 2°C)? Describe findings.', category: 'Strategy', subcategory: 'Scenario Analysis' },
      { id: 'cdp-22', text: 'What is your organization\'s transition plan to a low-carbon economy?', category: 'Strategy', subcategory: 'Transition Plan' },
      // Verification
      { id: 'cdp-23', text: 'Have your Scope 1 and/or Scope 2 emissions been third-party verified? By whom?', category: 'Verification', subcategory: 'Assurance' },
      { id: 'cdp-24', text: 'Do you participate in any carbon pricing schemes or use an internal carbon price?', category: 'Strategy', subcategory: 'Carbon Pricing' },
      { id: 'cdp-25', text: 'What is your total revenue for the reporting period?', category: 'General', subcategory: 'Financial' },
    ],
  },

  basic_supplier: {
    id: 'basic_supplier',
    name: 'Basic Supplier Questionnaire',
    description: 'A typical customer-sent supplier sustainability questionnaire covering core ESG topics.',
    framework: 'Custom',
    questionCount: 15,
    questions: [
      { id: 'bs-1', text: 'Please provide your company name, address, and number of employees.', category: 'Company Profile', subcategory: 'General' },
      { id: 'bs-2', text: 'What is your annual energy consumption (electricity and fuel)?', category: 'Environment', subcategory: 'Energy' },
      { id: 'bs-3', text: 'What are your Scope 1 and Scope 2 greenhouse gas emissions?', category: 'Environment', subcategory: 'Emissions' },
      { id: 'bs-4', text: 'What percentage of your energy comes from renewable sources?', category: 'Environment', subcategory: 'Energy' },
      { id: 'bs-5', text: 'How much waste does your company generate annually, and what is your recycling rate?', category: 'Environment', subcategory: 'Waste' },
      { id: 'bs-6', text: 'Do you have an environmental management system or environmental policy?', category: 'Environment', subcategory: 'Management' },
      { id: 'bs-7', text: 'What health and safety measures are in place? What is your incident/injury rate?', category: 'Social', subcategory: 'Health & Safety' },
      { id: 'bs-8', text: 'Do you have a Code of Conduct? What ethical standards apply to your operations?', category: 'Governance', subcategory: 'Ethics' },
      { id: 'bs-9', text: 'Do you have an anti-corruption and anti-bribery policy?', category: 'Governance', subcategory: 'Ethics' },
      { id: 'bs-10', text: 'Do you have a Supplier Code of Conduct? How do you assess your own suppliers?', category: 'Governance', subcategory: 'Supply Chain' },
      { id: 'bs-11', text: 'What certifications does your company hold (ISO 14001, ISO 45001, etc.)?', category: 'Governance', subcategory: 'Certifications' },
      { id: 'bs-12', text: 'Do you have a diversity and inclusion policy? What is your gender breakdown?', category: 'Social', subcategory: 'Diversity' },
      { id: 'bs-13', text: 'What training and development programs do you provide for employees?', category: 'Social', subcategory: 'Training' },
      { id: 'bs-14', text: 'Do you have climate targets or a decarbonization plan?', category: 'Environment', subcategory: 'Targets' },
      { id: 'bs-15', text: 'Do you publish a sustainability report? Which frameworks do you follow?', category: 'General', subcategory: 'Reporting' },
    ],
  },

  csrd_vsme: {
    id: 'csrd_vsme',
    name: 'CSRD / VSME (SME Standard)',
    description: 'Voluntary SME sustainability reporting standard aligned with CSRD requirements for value chain companies.',
    framework: 'CSRD',
    questionCount: 20,
    questions: [
      { id: 'vsme-1', text: 'Describe your business model, including principal products/services, markets served, and number of employees.', category: 'General Disclosures', subcategory: 'Business Model' },
      { id: 'vsme-2', text: 'What is your total energy consumption in MWh, split by electricity, heating fuels, and transport fuels?', category: 'Environment', subcategory: 'Energy' },
      { id: 'vsme-3', text: 'What percentage of your energy is from renewable sources?', category: 'Environment', subcategory: 'Energy' },
      { id: 'vsme-4', text: 'What are your Scope 1 GHG emissions (tCO2e) from direct combustion?', category: 'Environment', subcategory: 'Climate' },
      { id: 'vsme-5', text: 'What are your Scope 2 GHG emissions (tCO2e) from purchased electricity, using both location-based and market-based methods?', category: 'Environment', subcategory: 'Climate' },
      { id: 'vsme-6', text: 'What is your total water consumption in m³?', category: 'Environment', subcategory: 'Water' },
      { id: 'vsme-7', text: 'What is the total weight of waste generated, and what percentage is recycled or diverted from landfill?', category: 'Environment', subcategory: 'Waste' },
      { id: 'vsme-8', text: 'Do you generate hazardous waste? If so, how much (in kg or tonnes)?', category: 'Environment', subcategory: 'Waste' },
      { id: 'vsme-9', text: 'Do you have an environmental policy or environmental management system?', category: 'Environment', subcategory: 'Policy' },
      { id: 'vsme-10', text: 'How many employees (FTE) do you have, split by gender?', category: 'Social', subcategory: 'Workforce' },
      { id: 'vsme-11', text: 'What is your employee turnover rate for the reporting period?', category: 'Social', subcategory: 'Workforce' },
      { id: 'vsme-12', text: 'How many work-related injuries and fatalities occurred?', category: 'Social', subcategory: 'Health & Safety' },
      { id: 'vsme-13', text: 'What is the average number of training hours per employee?', category: 'Social', subcategory: 'Training' },
      { id: 'vsme-14', text: 'Do you have policies on human rights, child labor, and forced labor?', category: 'Social', subcategory: 'Human Rights' },
      { id: 'vsme-15', text: 'Do you have a Code of Conduct covering business ethics, anti-corruption, and anti-bribery?', category: 'Governance', subcategory: 'Ethics' },
      { id: 'vsme-16', text: 'Do you have a whistleblowing or grievance mechanism?', category: 'Governance', subcategory: 'Governance' },
      { id: 'vsme-17', text: 'Do you have a Supplier Code of Conduct and do you assess suppliers on sustainability criteria?', category: 'Governance', subcategory: 'Supply Chain' },
      { id: 'vsme-18', text: 'What sustainability-related certifications does your company hold?', category: 'Governance', subcategory: 'Certifications' },
      { id: 'vsme-19', text: 'Do you have climate targets? Describe your decarbonization roadmap.', category: 'Environment', subcategory: 'Targets' },
      { id: 'vsme-20', text: 'Has any of your sustainability data been externally verified or assured?', category: 'Governance', subcategory: 'Verification' },
    ],
  },

  integritynext: {
    id: 'integritynext',
    name: 'IntegrityNext SAQ',
    description: 'IntegrityNext Self-Assessment Questionnaire covering environment, social responsibility, and governance topics for supply chain compliance.',
    framework: 'IntegrityNext',
    questionCount: 25,
    questions: [
      // Environment
      { id: 'in-1', text: 'Do you have an energy management program in place? Describe your approach to monitoring and reducing energy consumption.', category: 'Environment', subcategory: 'Energy Management' },
      { id: 'in-2', text: 'What are your total greenhouse gas emissions (Scope 1 and Scope 2) for the last reporting period?', category: 'Environment', subcategory: 'Emissions' },
      { id: 'in-3', text: 'Do you have targets for reducing greenhouse gas emissions? If so, describe the targets and timelines.', category: 'Environment', subcategory: 'Emissions' },
      { id: 'in-4', text: 'How do you manage waste streams at your facilities? Describe your waste reduction, recycling, and disposal practices.', category: 'Environment', subcategory: 'Waste' },
      { id: 'in-5', text: 'What is your total water withdrawal and consumption? Do you operate in water-stressed regions?', category: 'Environment', subcategory: 'Water' },
      { id: 'in-6', text: 'Do you hold any environmental certifications (e.g., ISO 14001, EMAS)? List all current certifications.', category: 'Environment', subcategory: 'Environmental Certifications' },
      { id: 'in-7', text: 'What measures do you have in place to prevent pollution of air, water, and soil from your operations?', category: 'Environment', subcategory: 'Pollution Prevention' },
      // Social
      { id: 'in-8', text: 'Do you have an occupational health and safety management system (e.g., ISO 45001)? Describe your OHS approach.', category: 'Social', subcategory: 'Occupational Health & Safety' },
      { id: 'in-9', text: 'What is your Lost Time Injury Frequency Rate (LTIFR) or equivalent safety performance metric?', category: 'Social', subcategory: 'Occupational Health & Safety' },
      { id: 'in-10', text: 'Do you ensure compliance with applicable labor laws regarding working hours, minimum wage, and overtime compensation?', category: 'Social', subcategory: 'Labor Rights' },
      { id: 'in-11', text: 'Describe the working conditions at your facilities, including provisions for breaks, rest periods, and leave entitlements.', category: 'Social', subcategory: 'Working Conditions' },
      { id: 'in-12', text: 'Do you have a diversity and equal opportunity policy? How do you promote non-discrimination in hiring and employment?', category: 'Social', subcategory: 'Diversity' },
      { id: 'in-13', text: 'What measures do you take to ensure no child labor is used in your operations or supply chain?', category: 'Social', subcategory: 'Child Labor' },
      { id: 'in-14', text: 'What measures do you take to ensure no forced or compulsory labor is used in your operations or supply chain?', category: 'Social', subcategory: 'Forced Labor' },
      { id: 'in-15', text: 'Do you respect employees\' rights to freedom of association and collective bargaining?', category: 'Social', subcategory: 'Labor Rights' },
      // Governance
      { id: 'in-16', text: 'Do you have an anti-corruption and anti-bribery policy? Describe its scope and how it is communicated to employees.', category: 'Governance', subcategory: 'Anti-Corruption' },
      { id: 'in-17', text: 'Have there been any incidents of corruption or bribery in the past three years? If so, describe the actions taken.', category: 'Governance', subcategory: 'Anti-Corruption' },
      { id: 'in-18', text: 'Do you have a data protection and privacy policy (e.g., GDPR compliance)? How do you safeguard personal data?', category: 'Governance', subcategory: 'Data Protection' },
      { id: 'in-19', text: 'Do you conduct supply chain due diligence to identify and mitigate ESG risks among your suppliers?', category: 'Governance', subcategory: 'Supply Chain Due Diligence' },
      { id: 'in-20', text: 'Do you have a Supplier Code of Conduct? What requirements do you impose on your supply chain?', category: 'Governance', subcategory: 'Supply Chain Due Diligence' },
      { id: 'in-21', text: 'Do you have a compliance management system? Describe how you ensure adherence to applicable laws and regulations.', category: 'Governance', subcategory: 'Compliance' },
      { id: 'in-22', text: 'Do you have a whistleblower or grievance mechanism for reporting compliance violations?', category: 'Governance', subcategory: 'Compliance' },
      { id: 'in-23', text: 'Do you conduct sanctions screening for business partners and transactions? Describe your process.', category: 'Governance', subcategory: 'Sanctions Screening' },
      { id: 'in-24', text: 'Do you have export control procedures in place to ensure compliance with applicable trade regulations?', category: 'Governance', subcategory: 'Compliance' },
      { id: 'in-25', text: 'Do you have a conflict of interest policy? How do you identify and manage potential conflicts?', category: 'Governance', subcategory: 'Anti-Corruption' },
    ],
  },

  rba_saq: {
    id: 'rba_saq',
    name: 'RBA Code of Conduct SAQ',
    description: 'Responsible Business Alliance Self-Assessment Questionnaire based on the RBA Code of Conduct covering labor, health & safety, environment, ethics, and management systems.',
    framework: 'RBA',
    questionCount: 30,
    questions: [
      // Labor
      { id: 'rba-1', text: 'Do you ensure that working hours do not exceed 60 hours per week (or the legal limit, whichever is lower), including overtime?', category: 'Labor', subcategory: 'Working Hours' },
      { id: 'rba-2', text: 'Do workers receive at least one day off every seven consecutive days?', category: 'Labor', subcategory: 'Working Hours' },
      { id: 'rba-3', text: 'Do you ensure that wages paid meet or exceed the legal minimum wage and that overtime is compensated at premium rates?', category: 'Labor', subcategory: 'Wages & Benefits' },
      { id: 'rba-4', text: 'Are wage deductions as a disciplinary measure prohibited in your operations?', category: 'Labor', subcategory: 'Wages & Benefits' },
      { id: 'rba-5', text: 'Do workers have the right to freedom of association and collective bargaining in accordance with local laws?', category: 'Labor', subcategory: 'Freedom of Association' },
      { id: 'rba-6', text: 'Do you have a non-discrimination policy covering race, color, age, gender, sexual orientation, disability, religion, and other protected characteristics?', category: 'Labor', subcategory: 'Non-Discrimination' },
      { id: 'rba-7', text: 'Do you verify the age of all workers and ensure no person under the age of 15 (or applicable minimum age) is employed?', category: 'Labor', subcategory: 'Young Workers' },
      { id: 'rba-8', text: 'Do you have protections in place for young workers (under 18) regarding hazardous work, night shifts, and working hours?', category: 'Labor', subcategory: 'Young Workers' },
      { id: 'rba-9', text: 'What measures are in place to ensure no forced, bonded, indentured, or involuntary labor is used?', category: 'Labor', subcategory: 'Forced Labor' },
      { id: 'rba-10', text: 'Do you ensure that workers are not required to surrender government-issued identification or passports as a condition of employment?', category: 'Labor', subcategory: 'Forced Labor' },
      // Health & Safety
      { id: 'rba-11', text: 'Do you conduct regular occupational safety risk assessments and implement controls to minimize workplace hazards?', category: 'Health & Safety', subcategory: 'Occupational Safety' },
      { id: 'rba-12', text: 'What is your process for reporting and investigating workplace incidents, injuries, and near-misses?', category: 'Health & Safety', subcategory: 'Occupational Safety' },
      { id: 'rba-13', text: 'Do you have emergency preparedness and response plans, including evacuation procedures, drills, and fire detection/suppression systems?', category: 'Health & Safety', subcategory: 'Emergency Preparedness' },
      { id: 'rba-14', text: 'How do you identify, evaluate, and control worker exposure to chemical, biological, and physical hazards (industrial hygiene)?', category: 'Health & Safety', subcategory: 'Industrial Hygiene' },
      { id: 'rba-15', text: 'What safeguards are in place for machinery and equipment to prevent worker injuries (e.g., guards, interlocks, lockout/tagout)?', category: 'Health & Safety', subcategory: 'Machine Safeguarding' },
      { id: 'rba-16', text: 'Are appropriate personal protective equipment (PPE) and safety training provided to all workers exposed to hazards?', category: 'Health & Safety', subcategory: 'Occupational Safety' },
      // Environmental
      { id: 'rba-17', text: 'Do you obtain and maintain all required environmental permits, licenses, and registrations?', category: 'Environmental', subcategory: 'Permits & Reporting' },
      { id: 'rba-18', text: 'What pollution prevention and resource reduction measures have you implemented (e.g., source reduction, substitution, conservation)?', category: 'Environmental', subcategory: 'Pollution Prevention' },
      { id: 'rba-19', text: 'How do you identify, manage, and safely handle hazardous substances and chemicals used in your operations?', category: 'Environmental', subcategory: 'Hazardous Substances' },
      { id: 'rba-20', text: 'Describe your solid waste management approach, including reduction, recycling, and responsible disposal methods.', category: 'Environmental', subcategory: 'Solid Waste' },
      { id: 'rba-21', text: 'How do you monitor and control air emissions, including volatile organic compounds (VOCs), particulates, and ozone-depleting substances?', category: 'Environmental', subcategory: 'Air Emissions' },
      { id: 'rba-22', text: 'How do you manage wastewater and stormwater discharges? Do you treat effluent before discharge?', category: 'Environmental', subcategory: 'Water Management' },
      { id: 'rba-23', text: 'What are your total energy consumption and greenhouse gas emissions? Describe your approach to improving energy efficiency and reducing GHG emissions.', category: 'Environmental', subcategory: 'Energy & GHG' },
      // Ethics
      { id: 'rba-24', text: 'Do you have a policy prohibiting corruption, extortion, and embezzlement? How is it enforced?', category: 'Ethics', subcategory: 'Business Integrity' },
      { id: 'rba-25', text: 'Do you prohibit offering or accepting bribes, kickbacks, or other improper payments to gain business advantage?', category: 'Ethics', subcategory: 'No Improper Advantage' },
      { id: 'rba-26', text: 'Do you commit to transparency in business dealings and accurate disclosure of information to stakeholders?', category: 'Ethics', subcategory: 'Disclosure' },
      { id: 'rba-27', text: 'How do you protect intellectual property rights, including safeguarding customer and supplier information?', category: 'Ethics', subcategory: 'Intellectual Property' },
      { id: 'rba-28', text: 'Do you have a responsible sourcing policy for minerals (tin, tantalum, tungsten, gold, cobalt)? Describe your due diligence process.', category: 'Ethics', subcategory: 'Responsible Sourcing' },
      // Management Systems
      { id: 'rba-29', text: 'Does senior management demonstrate commitment to social and environmental responsibility through policy statements and resource allocation?', category: 'Management Systems', subcategory: 'Commitment & Accountability' },
      { id: 'rba-30', text: 'Do you have a process for identifying, assessing, and mitigating risks related to labor, health & safety, environment, and ethics, including a corrective action process and worker training programs?', category: 'Management Systems', subcategory: 'Risk Assessment & Corrective Action' },
    ],
  },

  sedex_smeta: {
    id: 'sedex_smeta',
    name: 'SEDEX/SMETA',
    description: 'SEDEX Members Ethical Trade Audit (SMETA) questionnaire covering labor standards, health & safety, environment, and business ethics.',
    framework: 'SEDEX',
    questionCount: 25,
    questions: [
      // Labor Standards
      { id: 'sed-1', text: 'Do all workers have written employment contracts in a language they understand, specifying terms and conditions of employment?', category: 'Labor Standards', subcategory: 'Employment Practices' },
      { id: 'sed-2', text: 'Do you maintain accurate records of employment, including contracts, working hours, and payroll documentation?', category: 'Labor Standards', subcategory: 'Employment Practices' },
      { id: 'sed-3', text: 'Do you pay at least the legal minimum wage or the applicable industry benchmark wage, whichever is higher?', category: 'Labor Standards', subcategory: 'Wages' },
      { id: 'sed-4', text: 'Are wages paid regularly and on time, with clear and itemized pay slips provided to all workers?', category: 'Labor Standards', subcategory: 'Wages' },
      { id: 'sed-5', text: 'Do you ensure that regular working hours comply with national law and do not exceed 48 hours per week?', category: 'Labor Standards', subcategory: 'Working Hours' },
      { id: 'sed-6', text: 'Is overtime voluntary, limited to 12 hours per week, and compensated at a premium rate as required by law?', category: 'Labor Standards', subcategory: 'Overtime' },
      { id: 'sed-7', text: 'Are all agency, temporary, and contract workers treated fairly and provided the same protections as permanent employees?', category: 'Labor Standards', subcategory: 'Contracts' },
      // Health & Safety
      { id: 'sed-8', text: 'Do you conduct regular workplace risk assessments covering all areas, tasks, and worker groups?', category: 'Health & Safety', subcategory: 'Risk Assessment' },
      { id: 'sed-9', text: 'Do you maintain records of workplace incidents, injuries, and near-misses, and investigate root causes?', category: 'Health & Safety', subcategory: 'Incidents' },
      { id: 'sed-10', text: 'Is appropriate personal protective equipment (PPE) provided free of charge and are workers trained in its use?', category: 'Health & Safety', subcategory: 'PPE' },
      { id: 'sed-11', text: 'Do you have fire safety measures in place, including fire detection, alarm systems, extinguishers, and clearly marked emergency exits?', category: 'Health & Safety', subcategory: 'Fire Safety' },
      { id: 'sed-12', text: 'Are first aid facilities and trained first aiders available at all times during working hours?', category: 'Health & Safety', subcategory: 'First Aid' },
      { id: 'sed-13', text: 'Do you conduct regular fire drills and emergency evacuation exercises? How frequently?', category: 'Health & Safety', subcategory: 'Fire Safety' },
      // Environment
      { id: 'sed-14', text: 'Do you have a documented environmental policy that is communicated to all employees and stakeholders?', category: 'Environment', subcategory: 'Environmental Policy' },
      { id: 'sed-15', text: 'How do you manage waste generated by your operations, including segregation, recycling, and safe disposal of hazardous waste?', category: 'Environment', subcategory: 'Waste' },
      { id: 'sed-16', text: 'Do you monitor and record your greenhouse gas emissions and other significant air emissions?', category: 'Environment', subcategory: 'Emissions' },
      { id: 'sed-17', text: 'What measures have you taken to improve resource efficiency (energy, water, raw materials) in your operations?', category: 'Environment', subcategory: 'Resource Efficiency' },
      { id: 'sed-18', text: 'Do you hold any environmental management certifications (e.g., ISO 14001)? List all current certifications.', category: 'Environment', subcategory: 'Environmental Policy' },
      { id: 'sed-19', text: 'How do you manage wastewater discharge and ensure compliance with local environmental regulations?', category: 'Environment', subcategory: 'Emissions' },
      // Business Ethics
      { id: 'sed-20', text: 'Do you have a policy prohibiting bribery and corruption? How is it communicated and enforced across your organization?', category: 'Business Ethics', subcategory: 'Bribery & Corruption' },
      { id: 'sed-21', text: 'Have any incidents of bribery or corruption been identified in the past three years? If so, what corrective actions were taken?', category: 'Business Ethics', subcategory: 'Bribery & Corruption' },
      { id: 'sed-22', text: 'Do you engage in fair business dealings and ensure honest representation in all transactions with partners and customers?', category: 'Business Ethics', subcategory: 'Fair Dealing' },
      { id: 'sed-23', text: 'How do you protect the personal data and privacy of employees, customers, and business partners?', category: 'Business Ethics', subcategory: 'Data Privacy' },
      { id: 'sed-24', text: 'Do you have a confidential grievance or whistleblowing mechanism available to all workers and external stakeholders?', category: 'Business Ethics', subcategory: 'Fair Dealing' },
      { id: 'sed-25', text: 'Do you conduct due diligence on subcontractors and suppliers to ensure compliance with ethical trade standards?', category: 'Business Ethics', subcategory: 'Fair Dealing' },
    ],
  },

  cmrt: {
    id: 'cmrt',
    name: 'Conflict Minerals (CMRT)',
    description: 'Conflict Minerals Reporting Template for identifying the use of tin, tantalum, tungsten, and gold (3TG) in products and supply chains.',
    framework: 'CMRT',
    questionCount: 15,
    questions: [
      // 3TG Usage
      { id: 'cm-1', text: 'Do any of your products contain tin (Sn)? If yes, describe in which products and components tin is used.', category: '3TG', subcategory: 'Tin' },
      { id: 'cm-2', text: 'Do any of your products contain tantalum (Ta)? If yes, describe in which products and components tantalum is used.', category: '3TG', subcategory: 'Tantalum' },
      { id: 'cm-3', text: 'Do any of your products contain tungsten (W)? If yes, describe in which products and components tungsten is used.', category: '3TG', subcategory: 'Tungsten' },
      { id: 'cm-4', text: 'Do any of your products contain gold (Au)? If yes, describe in which products and components gold is used.', category: '3TG', subcategory: 'Gold' },
      { id: 'cm-5', text: 'Are any of the 3TG minerals necessary to the functionality or production of your products?', category: '3TG', subcategory: 'Usage' },
      // Due Diligence
      { id: 'cm-6', text: 'Have you identified all smelters and refiners in your supply chain for each of the 3TG minerals? List them.', category: 'Due Diligence', subcategory: 'Smelter Identification' },
      { id: 'cm-7', text: 'Are all identified smelters and refiners validated as conformant by the Responsible Minerals Assurance Process (RMAP) or equivalent?', category: 'Due Diligence', subcategory: 'Smelter Identification' },
      { id: 'cm-8', text: 'Have you determined the country of origin for the 3TG minerals used in your products?', category: 'Due Diligence', subcategory: 'Country of Origin' },
      { id: 'cm-9', text: 'Do any of the 3TG minerals in your supply chain originate from the Democratic Republic of Congo (DRC) or adjoining countries?', category: 'Due Diligence', subcategory: 'DRC Conflict-Free' },
      { id: 'cm-10', text: 'Can you certify that your products are DRC conflict-free? If not, describe the steps you are taking to achieve this status.', category: 'Due Diligence', subcategory: 'DRC Conflict-Free' },
      { id: 'cm-11', text: 'Do you conduct due diligence on your 3TG supply chain in conformance with the OECD Due Diligence Guidance?', category: 'Due Diligence', subcategory: 'OECD Guidance' },
      // Policy
      { id: 'cm-12', text: 'Do you have a conflict minerals policy in place? Describe its scope and how it is communicated to suppliers.', category: 'Policy', subcategory: 'Conflict Minerals Policy' },
      { id: 'cm-13', text: 'Have you mapped your supply chain to identify all suppliers who provide components containing 3TG minerals?', category: 'Policy', subcategory: 'Supply Chain Mapping' },
      { id: 'cm-14', text: 'Do you require your direct suppliers to complete a CMRT or equivalent conflict minerals declaration?', category: 'Policy', subcategory: 'Supply Chain Mapping' },
      { id: 'cm-15', text: 'Do you have a grievance mechanism or process for reporting concerns related to conflict minerals sourcing?', category: 'Policy', subcategory: 'Conflict Minerals Policy' },
    ],
  },

  fashion_textile: {
    id: 'fashion_textile',
    name: 'Fashion & Textile Sustainability',
    description: 'Sustainability assessment for fashion and textile supply chains covering chemical management, water stewardship, worker welfare, and sustainable materials.',
    framework: 'Textile',
    questionCount: 20,
    questions: [
      // Chemical Management
      { id: 'ft-1', text: 'Do you comply with the ZDHC Manufacturing Restricted Substances List (MRSL)? Describe your level of conformance.', category: 'Chemical Management', subcategory: 'MRSL Compliance' },
      { id: 'ft-2', text: 'Are you a contributor to the ZDHC Gateway and do you report chemical discharge data through the ZDHC platform?', category: 'Chemical Management', subcategory: 'ZDHC' },
      { id: 'ft-3', text: 'Do you maintain a comprehensive chemical inventory for all chemicals used in your production processes?', category: 'Chemical Management', subcategory: 'Chemical Inventory' },
      { id: 'ft-4', text: 'How do you ensure that restricted substances (e.g., REACH SVHC, PFAS, heavy metals) are not present in your finished products?', category: 'Chemical Management', subcategory: 'Restricted Substances' },
      { id: 'ft-5', text: 'Do you have a Chemical Management System (CMS) in place? Is it third-party verified?', category: 'Chemical Management', subcategory: 'Chemical Inventory' },
      // Water
      { id: 'ft-6', text: 'What is your total water consumption (in m³) for the reporting period, and what is your water intensity per unit of production?', category: 'Water', subcategory: 'Consumption' },
      { id: 'ft-7', text: 'Do you monitor the quality of your wastewater discharge? Does it meet ZDHC Wastewater Guidelines or local regulatory limits?', category: 'Water', subcategory: 'Discharge Quality' },
      { id: 'ft-8', text: 'Do you operate an on-site wastewater treatment plant? Describe the treatment technology and effluent quality achieved.', category: 'Water', subcategory: 'Wastewater Treatment' },
      { id: 'ft-9', text: 'What measures have you implemented to reduce water consumption in your dyeing, finishing, and washing processes?', category: 'Water', subcategory: 'Consumption' },
      // Worker Welfare
      { id: 'ft-10', text: 'Do your workers\' regular working hours comply with local law and not exceed 48 hours per week, with overtime limited and voluntary?', category: 'Worker Welfare', subcategory: 'Working Hours' },
      { id: 'ft-11', text: 'Do you pay at least the legal minimum wage, and are you working toward paying a living wage to all workers?', category: 'Worker Welfare', subcategory: 'Wages' },
      { id: 'ft-12', text: 'If dormitory housing is provided, does it meet applicable safety and habitability standards, including ventilation, sanitation, and privacy?', category: 'Worker Welfare', subcategory: 'Dormitory Conditions' },
      { id: 'ft-13', text: 'Do you have a confidential and accessible grievance mechanism for workers to raise complaints without fear of retaliation?', category: 'Worker Welfare', subcategory: 'Grievance Mechanisms' },
      { id: 'ft-14', text: 'How do you ensure freedom of association and the right to collective bargaining for your workers?', category: 'Worker Welfare', subcategory: 'Grievance Mechanisms' },
      // Materials
      { id: 'ft-15', text: 'What are the primary fibers and materials used in your products? Do you source certified sustainable fibers (e.g., GOTS, OCS, GRS, FSC)?', category: 'Materials', subcategory: 'Fiber Sourcing' },
      { id: 'ft-16', text: 'Can you trace your raw materials back to their origin (farm, forest, or recycling facility)? Describe your traceability system.', category: 'Materials', subcategory: 'Traceability' },
      { id: 'ft-17', text: 'What percentage of your products contain recycled content? Which recycled materials do you use (e.g., recycled polyester, recycled cotton)?', category: 'Materials', subcategory: 'Recycled Content' },
      { id: 'ft-18', text: 'Do you have targets for increasing the use of sustainable or recycled materials? Describe your goals and progress.', category: 'Materials', subcategory: 'Recycled Content' },
      { id: 'ft-19', text: 'Do you use any animal-derived materials (leather, wool, down, silk)? If so, are they certified to animal welfare standards?', category: 'Materials', subcategory: 'Fiber Sourcing' },
      { id: 'ft-20', text: 'Do you have a take-back, recycling, or circularity program for end-of-life textile products?', category: 'Materials', subcategory: 'Recycled Content' },
    ],
  },

  eu_gpp: {
    id: 'eu_gpp',
    name: 'EU Green Public Procurement',
    description: 'EU Green Public Procurement questionnaire assessing environmental, social, and governance criteria for public sector suppliers.',
    framework: 'EU GPP',
    questionCount: 15,
    questions: [
      // Environmental
      { id: 'gpp-1', text: 'What is the energy efficiency rating of your primary products or services? Do they meet or exceed EU energy labeling requirements?', category: 'Environmental', subcategory: 'Energy Efficiency' },
      { id: 'gpp-2', text: 'What measures have you implemented to reduce greenhouse gas emissions across your operations and product lifecycle?', category: 'Environmental', subcategory: 'Emissions Reduction' },
      { id: 'gpp-3', text: 'What is your approach to waste minimization, including product design for durability, repairability, and recyclability?', category: 'Environmental', subcategory: 'Waste Minimization' },
      { id: 'gpp-4', text: 'Do you apply EU GPP criteria or equivalent green procurement standards when selecting materials and components?', category: 'Environmental', subcategory: 'Green Procurement Criteria' },
      { id: 'gpp-5', text: 'Do your products or services carry recognized eco-labels (e.g., EU Ecolabel, Blue Angel, Nordic Swan)?', category: 'Environmental', subcategory: 'Green Procurement Criteria' },
      { id: 'gpp-6', text: 'What percentage of your packaging is recyclable, reusable, or made from recycled materials?', category: 'Environmental', subcategory: 'Waste Minimization' },
      { id: 'gpp-7', text: 'Do you conduct lifecycle assessments (LCA) for your key products or services to evaluate environmental impacts?', category: 'Environmental', subcategory: 'Emissions Reduction' },
      // Social
      { id: 'gpp-8', text: 'Do you comply with ILO core labor standards and ensure fair working conditions throughout your supply chain?', category: 'Social', subcategory: 'Labor Standards' },
      { id: 'gpp-9', text: 'How do you ensure accessibility of your products and services for persons with disabilities, in line with EU accessibility requirements?', category: 'Social', subcategory: 'Accessibility' },
      { id: 'gpp-10', text: 'Do you engage with or subcontract to social enterprises, sheltered workshops, or organizations promoting social inclusion?', category: 'Social', subcategory: 'Social Enterprises' },
      { id: 'gpp-11', text: 'Do you provide training and apprenticeship opportunities as part of contract execution?', category: 'Social', subcategory: 'Labor Standards' },
      // Governance
      { id: 'gpp-12', text: 'How do you ensure compliance with all applicable environmental, social, and procurement regulations in the EU member states where you operate?', category: 'Governance', subcategory: 'Compliance' },
      { id: 'gpp-13', text: 'Do you publish sustainability reports or environmental product declarations (EPDs)? Which standards or frameworks do you follow?', category: 'Governance', subcategory: 'Reporting' },
      { id: 'gpp-14', text: 'What continuous improvement processes do you have in place to enhance environmental and social performance over the contract period?', category: 'Governance', subcategory: 'Continuous Improvement' },
      { id: 'gpp-15', text: 'Do you have an environmental management system (e.g., ISO 14001, EMAS) and can you provide evidence of certification?', category: 'Governance', subcategory: 'Compliance' },
    ],
  },
};

/**
 * Convert a template into a ParseResult-compatible format for the answer engine.
 */
export function templateToParseResult(templateId) {
  const template = QUESTIONNAIRE_TEMPLATES[templateId];
  if (!template) return null;

  return {
    success: true,
    questions: template.questions.map((q, i) => ({
      id: q.id,
      rowIndex: i,
      text: q.text,
      category: q.category,
      subcategory: q.subcategory,
      referenceId: q.id,
      framework: template.framework,
      required: true,
      rawRow: q,
    })),
    errors: [],
    metadata: {
      fileName: `${template.name} (Template)`,
      totalRows: template.questions.length,
      parsedRows: template.questions.length,
      detectedFramework: template.framework,
      columnMapping: { questionText: 'text', category: 'category', subcategory: 'subcategory', referenceId: 'id' },
      autoDetectionConfidence: 'high',
    },
  };
}

// ============================================
// Pre-loaded Questionnaire Templates
// ============================================
// These provide ready-to-use question sets for common ESG frameworks,
// so users don't need to upload a file.

export const QUESTIONNAIRE_TEMPLATES = {
  ecovadis: {
    id: 'ecovadis',
    name: 'EcoVadis Assessment',
    nameDe: 'EcoVadis-Bewertung',
    description: 'Standard EcoVadis sustainability assessment covering Environment, Labor, Ethics, and Sustainable Procurement.',
    descriptionDe: 'Standard-EcoVadis-Nachhaltigkeitsbewertung zu Umwelt, Arbeit & Menschenrechten, Ethik und nachhaltiger Beschaffung.',
    framework: 'EcoVadis',
    questionCount: 35,
    questions: [
      // Environment — Energy & GHG
      { id: 'ev-1', text: 'What is your total energy consumption for the reporting period (in kWh or MWh)?', textDe: 'Wie hoch ist Ihr gesamter Energieverbrauch im Berichtszeitraum (in kWh oder MWh)?', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      { id: 'ev-2', text: 'What percentage of your total energy consumption comes from renewable sources?', textDe: 'Welcher Anteil Ihres gesamten Energieverbrauchs stammt aus erneuerbaren Quellen?', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      { id: 'ev-3', text: 'What are your total Scope 1 (direct) greenhouse gas emissions in tCO2e?', textDe: 'Wie hoch sind Ihre gesamten Scope-1-Treibhausgasemissionen (direkt) in t CO₂e?', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      { id: 'ev-4', text: 'What are your total Scope 2 (indirect - electricity) greenhouse gas emissions in tCO2e?', textDe: 'Wie hoch sind Ihre gesamten Scope-2-Treibhausgasemissionen (indirekt – Strom) in t CO₂e?', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      { id: 'ev-5', text: 'Do you have a policy or commitment to reduce greenhouse gas emissions? If so, describe your targets and timeline.', textDe: 'Verfügen Sie über eine Richtlinie oder Verpflichtung zur Reduktion von Treibhausgasemissionen? Falls ja, beschreiben Sie Ihre Ziele und den Zeithorizont.', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      { id: 'ev-6', text: 'What actions have you taken to reduce energy consumption and improve energy efficiency?', textDe: 'Welche Maßnahmen haben Sie ergriffen, um den Energieverbrauch zu senken und die Energieeffizienz zu verbessern?', category: 'Environment', subcategory: 'Energy Consumption & GHGs' },
      // Environment — Water
      { id: 'ev-7', text: 'What is your total water consumption (in m³) for the reporting period?', textDe: 'Wie hoch ist Ihr gesamter Wasserverbrauch (in m³) im Berichtszeitraum?', category: 'Environment', subcategory: 'Water' },
      { id: 'ev-8', text: 'Do you have a water management policy? Describe your approach to water stewardship.', textDe: 'Verfügen Sie über eine Richtlinie zum Wassermanagement? Beschreiben Sie Ihren Ansatz zum verantwortungsvollen Umgang mit Wasser.', category: 'Environment', subcategory: 'Water' },
      // Environment — Waste & Pollution
      { id: 'ev-9', text: 'What is the total weight of waste generated (in kg or tonnes)?', textDe: 'Wie hoch ist das Gesamtgewicht des erzeugten Abfalls (in kg oder Tonnen)?', category: 'Environment', subcategory: 'Pollution & Waste' },
      { id: 'ev-10', text: 'What is your waste recycling or diversion rate?', textDe: 'Wie hoch ist Ihre Recycling- bzw. Verwertungsquote für Abfälle?', category: 'Environment', subcategory: 'Pollution & Waste' },
      { id: 'ev-11', text: 'How much hazardous waste did your operations generate?', textDe: 'Wie viel Sonderabfall ist bei Ihrer Geschäftstätigkeit angefallen?', category: 'Environment', subcategory: 'Pollution & Waste' },
      { id: 'ev-12', text: 'What measures are in place to prevent and manage pollution (air, water, soil)?', textDe: 'Welche Maßnahmen bestehen zur Vermeidung und Bewältigung von Umweltverschmutzung (Luft, Wasser, Boden)?', category: 'Environment', subcategory: 'Pollution & Waste' },
      // Environment — Biodiversity & EMS
      { id: 'ev-13', text: 'Do you have an Environmental Management System (e.g., ISO 14001)? Describe your environmental management approach.', textDe: 'Verfügen Sie über ein Umweltmanagementsystem (z. B. ISO 14001)? Beschreiben Sie Ihren Ansatz im Umweltmanagement.', category: 'Environment', subcategory: 'Environmental Management' },
      { id: 'ev-14', text: 'What actions do you take to protect biodiversity and ecosystems?', textDe: 'Welche Maßnahmen ergreifen Sie zum Schutz der Biodiversität und der Ökosysteme?', category: 'Environment', subcategory: 'Biodiversity' },
      // Labor & Human Rights
      { id: 'ev-15', text: 'How many employees (FTE) does your company employ?', textDe: 'Wie viele Mitarbeitende (VZÄ) beschäftigt Ihr Unternehmen?', category: 'Labor & Human Rights', subcategory: 'Workforce' },
      { id: 'ev-16', text: 'What is the gender breakdown of your workforce (% female, % male)?', textDe: 'Wie ist die Geschlechterverteilung Ihrer Belegschaft (% weiblich, % männlich)?', category: 'Labor & Human Rights', subcategory: 'Diversity & Inclusion' },
      { id: 'ev-17', text: 'What is your Total Recordable Incident Rate (TRIR) or Lost Time Injury Frequency Rate (LTIFR)?', textDe: 'Wie hoch ist Ihre Gesamtrate meldepflichtiger Unfälle (TRIR) bzw. Ihre Ausfallzeit-Unfallhäufigkeitsrate (LTIFR)?', category: 'Labor & Human Rights', subcategory: 'Health & Safety' },
      { id: 'ev-18', text: 'How many work-related fatalities occurred during the reporting period?', textDe: 'Wie viele arbeitsbedingte Todesfälle sind im Berichtszeitraum aufgetreten?', category: 'Labor & Human Rights', subcategory: 'Health & Safety' },
      { id: 'ev-19', text: 'Do you have a health and safety management system (e.g., ISO 45001)? Describe your approach.', textDe: 'Verfügen Sie über ein Arbeitsschutzmanagementsystem (z. B. ISO 45001)? Beschreiben Sie Ihren Ansatz.', category: 'Labor & Human Rights', subcategory: 'Health & Safety' },
      { id: 'ev-20', text: 'What is the average number of training hours per employee per year?', textDe: 'Wie hoch ist die durchschnittliche Anzahl an Schulungsstunden pro Mitarbeitendem und Jahr?', category: 'Labor & Human Rights', subcategory: 'Training & Development' },
      { id: 'ev-21', text: 'Do you have policies addressing child labor, forced labor, and freedom of association?', textDe: 'Verfügen Sie über Richtlinien zu Kinderarbeit, Zwangsarbeit und Vereinigungsfreiheit?', category: 'Labor & Human Rights', subcategory: 'Human Rights' },
      { id: 'ev-22', text: 'Do you have a diversity and inclusion policy? Describe your commitments.', textDe: 'Verfügen Sie über eine Richtlinie zu Vielfalt und Inklusion? Beschreiben Sie Ihre Verpflichtungen.', category: 'Labor & Human Rights', subcategory: 'Diversity & Inclusion' },
      { id: 'ev-23', text: 'What is your employee turnover rate?', textDe: 'Wie hoch ist Ihre Mitarbeiterfluktuationsrate?', category: 'Labor & Human Rights', subcategory: 'Working Conditions' },
      // Ethics
      { id: 'ev-24', text: 'Do you have a Code of Conduct or Business Ethics policy? Describe its scope and enforcement.', textDe: 'Verfügen Sie über einen Verhaltenskodex oder eine Richtlinie zur Geschäftsethik? Beschreiben Sie deren Geltungsbereich und Durchsetzung.', category: 'Ethics', subcategory: 'Business Ethics' },
      { id: 'ev-25', text: 'Do you have an anti-corruption and anti-bribery policy? How is it implemented?', textDe: 'Verfügen Sie über eine Richtlinie zur Korruptions- und Bestechungsbekämpfung? Wie wird sie umgesetzt?', category: 'Ethics', subcategory: 'Anti-Corruption' },
      { id: 'ev-26', text: 'Do you have a whistleblowing or grievance mechanism? How do employees report concerns?', textDe: 'Verfügen Sie über einen Hinweisgeber- oder Beschwerdemechanismus? Wie melden Mitarbeitende Bedenken?', category: 'Ethics', subcategory: 'Grievance Mechanism' },
      { id: 'ev-27', text: 'Do you have a data protection and privacy policy (e.g., GDPR compliance)?', textDe: 'Verfügen Sie über eine Datenschutzrichtlinie (z. B. DSGVO-Konformität)?', category: 'Ethics', subcategory: 'Information Security' },
      { id: 'ev-28', text: 'Have there been any significant fines or sanctions related to business ethics in the past 3 years?', textDe: 'Gab es in den letzten 3 Jahren wesentliche Bußgelder oder Sanktionen im Zusammenhang mit der Geschäftsethik?', category: 'Ethics', subcategory: 'Compliance' },
      // Sustainable Procurement
      { id: 'ev-29', text: 'Do you have a Supplier Code of Conduct? What standards do you require from suppliers?', textDe: 'Verfügen Sie über einen Verhaltenskodex für Lieferanten? Welche Standards verlangen Sie von Ihren Lieferanten?', category: 'Sustainable Procurement', subcategory: 'Supplier Standards' },
      { id: 'ev-30', text: 'How do you assess and monitor your suppliers on ESG criteria?', textDe: 'Wie bewerten und überwachen Sie Ihre Lieferanten anhand von ESG-Kriterien?', category: 'Sustainable Procurement', subcategory: 'Supplier Assessment' },
      { id: 'ev-31', text: 'What percentage of your critical suppliers have been assessed on sustainability criteria?', textDe: 'Welcher Anteil Ihrer kritischen Lieferanten wurde anhand von Nachhaltigkeitskriterien bewertet?', category: 'Sustainable Procurement', subcategory: 'Supplier Assessment' },
      { id: 'ev-32', text: 'Do you have a responsible sourcing policy for raw materials?', textDe: 'Verfügen Sie über eine Richtlinie zur verantwortungsvollen Beschaffung von Rohstoffen?', category: 'Sustainable Procurement', subcategory: 'Responsible Sourcing' },
      { id: 'ev-33', text: 'What actions do you take to address ESG risks in your supply chain?', textDe: 'Welche Maßnahmen ergreifen Sie, um ESG-Risiken in Ihrer Lieferkette zu begegnen?', category: 'Sustainable Procurement', subcategory: 'Supply Chain Risk' },
      // Overall
      { id: 'ev-34', text: 'Do you publish a sustainability or CSR report? If so, which standards does it follow (GRI, CSRD/ESRS, etc.)?', textDe: 'Veröffentlichen Sie einen Nachhaltigkeits- oder CSR-Bericht? Falls ja, welchen Standards folgt er (GRI, CSRD/ESRS usw.)?', category: 'General', subcategory: 'Reporting' },
      { id: 'ev-35', text: 'What certifications does your company hold (ISO 14001, ISO 45001, ISO 9001, SA8000, etc.)?', textDe: 'Über welche Zertifizierungen verfügt Ihr Unternehmen (ISO 14001, ISO 45001, ISO 9001, SA8000 usw.)?', category: 'General', subcategory: 'Certifications' },
    ],
  },

  cdp_climate: {
    id: 'cdp_climate',
    name: 'CDP Climate Change',
    nameDe: 'CDP Klimawandel',
    description: 'CDP Climate Change questionnaire covering governance, risks, emissions, targets, and strategy.',
    descriptionDe: 'CDP-Klimawandel-Fragebogen zu Governance, Risiken, Emissionen, Zielen und Strategie.',
    framework: 'CDP',
    questionCount: 25,
    questions: [
      // Governance
      { id: 'cdp-1', text: 'Does your board or most senior governing body have oversight of climate-related issues?', textDe: 'Übt Ihr Vorstand bzw. Ihr oberstes Leitungsorgan die Aufsicht über klimabezogene Themen aus?', category: 'Governance', subcategory: 'Board Oversight' },
      { id: 'cdp-2', text: 'Describe the highest management-level position(s) with responsibility for climate-related issues.', textDe: 'Beschreiben Sie die höchste(n) Managementposition(en) mit Verantwortung für klimabezogene Themen.', category: 'Governance', subcategory: 'Management Responsibility' },
      { id: 'cdp-3', text: 'Do you have an incentive scheme linked to climate targets? Describe.', textDe: 'Verfügen Sie über ein an Klimaziele gekoppeltes Anreizsystem? Bitte beschreiben.', category: 'Governance', subcategory: 'Incentives' },
      // Risks & Opportunities
      { id: 'cdp-4', text: 'Have you identified any climate-related risks with the potential to have a substantive financial impact? Describe.', textDe: 'Haben Sie klimabezogene Risiken mit potenziell wesentlichen finanziellen Auswirkungen identifiziert? Bitte beschreiben.', category: 'Risks & Opportunities', subcategory: 'Climate Risks' },
      { id: 'cdp-5', text: 'Have you identified any climate-related opportunities? Describe.', textDe: 'Haben Sie klimabezogene Chancen identifiziert? Bitte beschreiben.', category: 'Risks & Opportunities', subcategory: 'Climate Opportunities' },
      // Emissions — Scope 1
      { id: 'cdp-6', text: 'What are your total gross Scope 1 emissions in tCO2e?', textDe: 'Wie hoch sind Ihre gesamten Brutto-Scope-1-Emissionen in t CO₂e?', category: 'Emissions', subcategory: 'Scope 1' },
      { id: 'cdp-7', text: 'What methodology and emission factors did you use to calculate Scope 1 emissions?', textDe: 'Welche Methodik und welche Emissionsfaktoren haben Sie zur Berechnung der Scope-1-Emissionen verwendet?', category: 'Emissions', subcategory: 'Scope 1' },
      // Emissions — Scope 2
      { id: 'cdp-8', text: 'What are your Scope 2 location-based emissions in tCO2e?', textDe: 'Wie hoch sind Ihre standortbasierten Scope-2-Emissionen in t CO₂e?', category: 'Emissions', subcategory: 'Scope 2' },
      { id: 'cdp-9', text: 'What are your Scope 2 market-based emissions in tCO2e?', textDe: 'Wie hoch sind Ihre marktbasierten Scope-2-Emissionen in t CO₂e?', category: 'Emissions', subcategory: 'Scope 2' },
      { id: 'cdp-10', text: 'What methodology did you use to calculate Scope 2 emissions?', textDe: 'Welche Methodik haben Sie zur Berechnung der Scope-2-Emissionen verwendet?', category: 'Emissions', subcategory: 'Scope 2' },
      // Emissions — Scope 3
      { id: 'cdp-11', text: 'Which Scope 3 categories are relevant to your organization and have you calculated emissions for them?', textDe: 'Welche Scope-3-Kategorien sind für Ihr Unternehmen relevant, und haben Sie deren Emissionen berechnet?', category: 'Emissions', subcategory: 'Scope 3' },
      { id: 'cdp-12', text: 'What are your total Scope 3 emissions in tCO2e? Break down by relevant category.', textDe: 'Wie hoch sind Ihre gesamten Scope-3-Emissionen in t CO₂e? Bitte nach relevanten Kategorien aufschlüsseln.', category: 'Emissions', subcategory: 'Scope 3' },
      { id: 'cdp-13', text: 'Do you measure emissions from your upstream supply chain? Describe your approach.', textDe: 'Erfassen Sie Emissionen aus Ihrer vorgelagerten Lieferkette? Beschreiben Sie Ihr Vorgehen.', category: 'Emissions', subcategory: 'Scope 3' },
      // Energy
      { id: 'cdp-14', text: 'What is your total energy consumption in MWh?', textDe: 'Wie hoch ist Ihr gesamter Energieverbrauch in MWh?', category: 'Energy', subcategory: 'Consumption' },
      { id: 'cdp-15', text: 'What percentage of your energy consumption is from renewable sources?', textDe: 'Welcher Anteil Ihres Energieverbrauchs stammt aus erneuerbaren Quellen?', category: 'Energy', subcategory: 'Renewables' },
      { id: 'cdp-16', text: 'What energy efficiency measures have you implemented?', textDe: 'Welche Energieeffizienzmaßnahmen haben Sie umgesetzt?', category: 'Energy', subcategory: 'Efficiency' },
      // Targets
      { id: 'cdp-17', text: 'Do you have an emissions reduction target? Describe the target, base year, and timeline.', textDe: 'Verfügen Sie über ein Emissionsminderungsziel? Beschreiben Sie das Ziel, das Basisjahr und den Zeithorizont.', category: 'Targets', subcategory: 'Emission Targets' },
      { id: 'cdp-18', text: 'Is your target a science-based target (SBTi)? What is the status?', textDe: 'Handelt es sich um ein wissenschaftsbasiertes Ziel (SBTi)? Wie ist der Status?', category: 'Targets', subcategory: 'SBTi' },
      { id: 'cdp-19', text: 'What progress have you made toward your emissions reduction target?', textDe: 'Welche Fortschritte haben Sie bei Ihrem Emissionsminderungsziel erzielt?', category: 'Targets', subcategory: 'Progress' },
      // Strategy
      { id: 'cdp-20', text: 'How does climate change influence your business strategy?', textDe: 'Wie beeinflusst der Klimawandel Ihre Unternehmensstrategie?', category: 'Strategy', subcategory: 'Climate Strategy' },
      { id: 'cdp-21', text: 'Have you conducted scenario analysis (e.g., 1.5°C, 2°C)? Describe findings.', textDe: 'Haben Sie eine Szenarioanalyse durchgeführt (z. B. 1,5 °C, 2 °C)? Beschreiben Sie die Ergebnisse.', category: 'Strategy', subcategory: 'Scenario Analysis' },
      { id: 'cdp-22', text: 'What is your organization\'s transition plan to a low-carbon economy?', textDe: 'Wie sieht Ihr Transformationsplan hin zu einer kohlenstoffarmen Wirtschaft aus?', category: 'Strategy', subcategory: 'Transition Plan' },
      // Verification
      { id: 'cdp-23', text: 'Have your Scope 1 and/or Scope 2 emissions been third-party verified? By whom?', textDe: 'Wurden Ihre Scope-1- und/oder Scope-2-Emissionen durch Dritte verifiziert? Durch wen?', category: 'Verification', subcategory: 'Assurance' },
      { id: 'cdp-24', text: 'Do you participate in any carbon pricing schemes or use an internal carbon price?', textDe: 'Nehmen Sie an CO₂-Bepreisungssystemen teil oder verwenden Sie einen internen CO₂-Preis?', category: 'Strategy', subcategory: 'Carbon Pricing' },
      { id: 'cdp-25', text: 'What is your total revenue for the reporting period?', textDe: 'Wie hoch ist Ihr Gesamtumsatz im Berichtszeitraum?', category: 'General', subcategory: 'Financial' },
    ],
  },

  basic_supplier: {
    id: 'basic_supplier',
    name: 'ESG Questionnaire',
    nameDe: 'ESG-Fragebogen',
    description: 'A typical customer-sent supplier sustainability questionnaire covering core ESG topics.',
    descriptionDe: 'Ein typischer, von Kunden versandter Lieferanten-Nachhaltigkeitsfragebogen zu den zentralen ESG-Themen.',
    framework: 'Custom',
    questionCount: 15,
    questions: [
      { id: 'bs-1', text: 'Please provide your company name, address, and number of employees.', textDe: 'Bitte geben Sie Ihren Firmennamen, Ihre Anschrift und die Anzahl der Mitarbeitenden an.', category: 'Company Profile', subcategory: 'General' },
      { id: 'bs-2', text: 'What is your annual energy consumption (electricity and fuel)?', textDe: 'Wie hoch ist Ihr jährlicher Energieverbrauch (Strom und Brennstoffe)?', category: 'Environment', subcategory: 'Energy' },
      { id: 'bs-3', text: 'What are your Scope 1 and Scope 2 greenhouse gas emissions?', textDe: 'Wie hoch sind Ihre Scope-1- und Scope-2-Treibhausgasemissionen?', category: 'Environment', subcategory: 'Emissions' },
      { id: 'bs-4', text: 'What percentage of your energy comes from renewable sources?', textDe: 'Welcher Anteil Ihrer Energie stammt aus erneuerbaren Quellen?', category: 'Environment', subcategory: 'Energy' },
      { id: 'bs-5', text: 'How much waste does your company generate annually, and what is your recycling rate?', textDe: 'Wie viel Abfall erzeugt Ihr Unternehmen jährlich, und wie hoch ist Ihre Recyclingquote?', category: 'Environment', subcategory: 'Waste' },
      { id: 'bs-6', text: 'Do you have an environmental management system or environmental policy?', textDe: 'Verfügen Sie über ein Umweltmanagementsystem oder eine Umweltrichtlinie?', category: 'Environment', subcategory: 'Management' },
      { id: 'bs-7', text: 'What health and safety measures are in place? What is your incident/injury rate?', textDe: 'Welche Arbeitsschutzmaßnahmen bestehen? Wie hoch ist Ihre Unfall- bzw. Verletzungsrate?', category: 'Social', subcategory: 'Health & Safety' },
      { id: 'bs-8', text: 'Do you have a Code of Conduct? What ethical standards apply to your operations?', textDe: 'Verfügen Sie über einen Verhaltenskodex? Welche ethischen Standards gelten für Ihre Geschäftstätigkeit?', category: 'Governance', subcategory: 'Ethics' },
      { id: 'bs-9', text: 'Do you have an anti-corruption and anti-bribery policy?', textDe: 'Verfügen Sie über eine Richtlinie zur Korruptions- und Bestechungsbekämpfung?', category: 'Governance', subcategory: 'Ethics' },
      { id: 'bs-10', text: 'Do you have a Supplier Code of Conduct? How do you assess your own suppliers?', textDe: 'Verfügen Sie über einen Verhaltenskodex für Lieferanten? Wie bewerten Sie Ihre eigenen Lieferanten?', category: 'Governance', subcategory: 'Supply Chain' },
      { id: 'bs-11', text: 'What certifications does your company hold (ISO 14001, ISO 45001, etc.)?', textDe: 'Über welche Zertifizierungen verfügt Ihr Unternehmen (ISO 14001, ISO 45001 usw.)?', category: 'Governance', subcategory: 'Certifications' },
      { id: 'bs-12', text: 'Do you have a diversity and inclusion policy? What is your gender breakdown?', textDe: 'Verfügen Sie über eine Richtlinie zu Vielfalt und Inklusion? Wie ist Ihre Geschlechterverteilung?', category: 'Social', subcategory: 'Diversity' },
      { id: 'bs-13', text: 'What training and development programs do you provide for employees?', textDe: 'Welche Schulungs- und Weiterbildungsprogramme bieten Sie Ihren Mitarbeitenden an?', category: 'Social', subcategory: 'Training' },
      { id: 'bs-14', text: 'Do you have climate targets or a decarbonization plan?', textDe: 'Verfügen Sie über Klimaziele oder einen Dekarbonisierungsplan?', category: 'Environment', subcategory: 'Targets' },
      { id: 'bs-15', text: 'Do you publish a sustainability report? Which frameworks do you follow?', textDe: 'Veröffentlichen Sie einen Nachhaltigkeitsbericht? Welchen Rahmenwerken folgen Sie?', category: 'General', subcategory: 'Reporting' },
    ],
  },

  csrd_vsme: {
    id: 'csrd_vsme',
    name: 'CSRD / VSME (SME Standard)',
    nameDe: 'CSRD / VSME (KMU-Standard)',
    description: 'Voluntary SME sustainability reporting standard aligned with CSRD requirements for value chain companies.',
    descriptionDe: 'Freiwilliger Nachhaltigkeits-Berichtsstandard für KMU, abgestimmt auf die CSRD-Anforderungen für Unternehmen in der Wertschöpfungskette.',
    framework: 'CSRD',
    questionCount: 20,
    questions: [
      { id: 'vsme-1', text: 'Describe your business model, including principal products/services, markets served, and number of employees.', textDe: 'Beschreiben Sie Ihr Geschäftsmodell, einschließlich der wichtigsten Produkte/Dienstleistungen, der bedienten Märkte und der Anzahl der Mitarbeitenden.', category: 'General Disclosures', subcategory: 'Business Model', vsmeCode: 'B1' },
      { id: 'vsme-2', text: 'What is your total energy consumption in MWh, split by electricity, heating fuels, and transport fuels?', textDe: 'Wie hoch ist Ihr gesamter Energieverbrauch in MWh, aufgeschlüsselt nach Strom, Heizbrennstoffen und Kraftstoffen?', category: 'Environment', subcategory: 'Energy', vsmeCode: 'B4' },
      { id: 'vsme-3', text: 'What percentage of your energy is from renewable sources?', textDe: 'Welcher Anteil Ihrer Energie stammt aus erneuerbaren Quellen?', category: 'Environment', subcategory: 'Energy', vsmeCode: 'B4' },
      { id: 'vsme-4', text: 'What are your Scope 1 GHG emissions (tCO2e) from direct combustion?', textDe: 'Wie hoch sind Ihre Scope-1-Treibhausgasemissionen (t CO₂e) aus direkter Verbrennung?', category: 'Environment', subcategory: 'Climate', vsmeCode: 'B4' },
      { id: 'vsme-5', text: 'What are your Scope 2 GHG emissions (tCO2e) from purchased electricity, using both location-based and market-based methods?', textDe: 'Wie hoch sind Ihre Scope-2-Treibhausgasemissionen (t CO₂e) aus eingekauftem Strom, sowohl standortbasiert als auch marktbasiert?', category: 'Environment', subcategory: 'Climate', vsmeCode: 'B4' },
      { id: 'vsme-6', text: 'What is your total water consumption in m³?', textDe: 'Wie hoch ist Ihr gesamter Wasserverbrauch in m³?', category: 'Environment', subcategory: 'Water', vsmeCode: 'B6' },
      { id: 'vsme-7', text: 'What is the total weight of waste generated, and what percentage is recycled or diverted from landfill?', textDe: 'Wie hoch ist das Gesamtgewicht des erzeugten Abfalls, und welcher Anteil wird recycelt oder von der Deponie ferngehalten?', category: 'Environment', subcategory: 'Waste', vsmeCode: 'B8' },
      { id: 'vsme-8', text: 'Do you generate hazardous waste? If so, how much (in kg or tonnes)?', textDe: 'Fällt bei Ihnen Sonderabfall an? Falls ja, wie viel (in kg oder Tonnen)?', category: 'Environment', subcategory: 'Waste', vsmeCode: 'B8' },
      { id: 'vsme-9', text: 'Do you have an environmental policy or environmental management system?', textDe: 'Verfügen Sie über eine Umweltrichtlinie oder ein Umweltmanagementsystem?', category: 'Environment', subcategory: 'Policy', vsmeCode: 'B2' },
      { id: 'vsme-10', text: 'How many employees (FTE) do you have, split by gender?', textDe: 'Wie viele Mitarbeitende (VZÄ) beschäftigen Sie, aufgeschlüsselt nach Geschlecht?', category: 'Social', subcategory: 'Workforce', vsmeCode: 'B9' },
      { id: 'vsme-11', text: 'What is your employee turnover rate for the reporting period?', textDe: 'Wie hoch ist Ihre Mitarbeiterfluktuationsrate im Berichtszeitraum?', category: 'Social', subcategory: 'Workforce', vsmeCode: 'B9' },
      { id: 'vsme-12', text: 'How many work-related injuries and fatalities occurred?', textDe: 'Wie viele arbeitsbedingte Verletzungen und Todesfälle sind aufgetreten?', category: 'Social', subcategory: 'Health & Safety', vsmeCode: 'B10' },
      { id: 'vsme-13', text: 'What is the average number of training hours per employee?', textDe: 'Wie hoch ist die durchschnittliche Anzahl an Schulungsstunden pro Mitarbeitendem?', category: 'Social', subcategory: 'Training', vsmeCode: 'B11' },
      { id: 'vsme-14', text: 'Do you have policies on human rights, child labor, and forced labor?', textDe: 'Verfügen Sie über Richtlinien zu Menschenrechten, Kinderarbeit und Zwangsarbeit?', category: 'Social', subcategory: 'Human Rights', vsmeCode: 'B9' },
      { id: 'vsme-15', text: 'Do you have a Code of Conduct covering business ethics, anti-corruption, and anti-bribery?', textDe: 'Verfügen Sie über einen Verhaltenskodex zu Geschäftsethik, Korruptions- und Bestechungsbekämpfung?', category: 'Governance', subcategory: 'Ethics', vsmeCode: 'B2' },
      { id: 'vsme-16', text: 'Do you have a whistleblowing or grievance mechanism?', textDe: 'Verfügen Sie über einen Hinweisgeber- oder Beschwerdemechanismus?', category: 'Governance', subcategory: 'Governance', vsmeCode: 'B2' },
      { id: 'vsme-17', text: 'Do you have a Supplier Code of Conduct and do you assess suppliers on sustainability criteria?', textDe: 'Verfügen Sie über einen Verhaltenskodex für Lieferanten und bewerten Sie Lieferanten anhand von Nachhaltigkeitskriterien?', category: 'Governance', subcategory: 'Supply Chain', vsmeCode: 'B2' },
      { id: 'vsme-18', text: 'What sustainability-related certifications does your company hold?', textDe: 'Über welche nachhaltigkeitsbezogenen Zertifizierungen verfügt Ihr Unternehmen?', category: 'Governance', subcategory: 'Certifications', vsmeCode: 'B2' },
      { id: 'vsme-19', text: 'Do you have climate targets? Describe your decarbonization roadmap.', textDe: 'Verfügen Sie über Klimaziele? Beschreiben Sie Ihren Dekarbonisierungsfahrplan.', category: 'Environment', subcategory: 'Targets', vsmeCode: 'B4' },
      { id: 'vsme-20', text: 'Has any of your sustainability data been externally verified or assured?', textDe: 'Wurden Ihre Nachhaltigkeitsdaten extern verifiziert oder mit Prüfsicherheit versehen?', category: 'Governance', subcategory: 'Verification', vsmeCode: 'B1' },
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
  comprehensive_buyer: {
    id: 'comprehensive_buyer',
    name: 'Comprehensive Buyer ESG Assessment',
    description: '60-question deep-dive covering environment, social, governance, and supply chain — modeled on what Tier 1 industrial buyers actually send. Tests every data field in the engine.',
    framework: 'Buyer Assessment',
    questionCount: 60,
    questions: [
      // ── COMPANY PROFILE (5) ──
      { id: 'cb-1', text: 'Please provide your company\'s legal name, registered address, and country of incorporation.', category: 'Company Profile', subcategory: 'Identity' },
      { id: 'cb-2', text: 'Describe your main products or services, primary markets, and customer segments.', category: 'Company Profile', subcategory: 'Products & Markets' },
      { id: 'cb-3', text: 'What is your company\'s annual revenue band and ownership structure (e.g., private, PE-backed, public)?', category: 'Company Profile', subcategory: 'Financial' },
      { id: 'cb-4', text: 'How many operational sites/facilities does your company operate, and in which countries?', category: 'Company Profile', subcategory: 'Facilities' },
      { id: 'cb-5', text: 'Is your company a subsidiary of a larger group? If so, name the parent company and describe the group structure.', category: 'Company Profile', subcategory: 'Structure' },

      // ── ENERGY & CLIMATE (8) ──
      { id: 'cb-6', text: 'What was your total electricity consumption (in kWh) for the most recent reporting period?', category: 'Environment', subcategory: 'Energy' },
      { id: 'cb-7', text: 'What percentage of your electricity was sourced from certified renewable sources (PPAs, green tariffs, on-site generation)?', category: 'Environment', subcategory: 'Renewable Energy' },
      { id: 'cb-8', text: 'What was your natural gas consumption (in kWh or m³) and diesel/fuel consumption (in liters)?', category: 'Environment', subcategory: 'Fuel' },
      { id: 'cb-9', text: 'What are your total Scope 1 (direct) greenhouse gas emissions in tCO₂e? Describe the methodology and emission factors used.', category: 'Environment', subcategory: 'Scope 1' },
      { id: 'cb-10', text: 'What are your Scope 2 greenhouse gas emissions (both location-based and market-based) in tCO₂e?', category: 'Environment', subcategory: 'Scope 2' },
      { id: 'cb-11', text: 'Do you measure Scope 3 emissions? If so, which categories do you report and what is the total?', category: 'Environment', subcategory: 'Scope 3' },
      { id: 'cb-12', text: 'What specific energy efficiency measures have you implemented in the past 12 months, and what savings have they achieved?', category: 'Environment', subcategory: 'Energy Efficiency' },
      { id: 'cb-13', text: 'Do you have science-based emissions reduction targets (SBTi-aligned)? Describe your decarbonization roadmap, including interim milestones.', category: 'Environment', subcategory: 'Climate Targets' },

      // ── WATER (3) ──
      { id: 'cb-14', text: 'What was your total water withdrawal (in m³) during the reporting period, and from which sources (municipal, groundwater, surface water)?', category: 'Environment', subcategory: 'Water' },
      { id: 'cb-15', text: 'Do any of your facilities operate in water-stressed regions (as defined by WRI Aqueduct or equivalent)? If so, what measures are in place?', category: 'Environment', subcategory: 'Water Stress' },
      { id: 'cb-16', text: 'How do you manage wastewater discharge? Describe treatment processes and compliance with local discharge permits.', category: 'Environment', subcategory: 'Wastewater' },

      // ── WASTE & CIRCULAR ECONOMY (5) ──
      { id: 'cb-17', text: 'What was the total weight of waste generated (in kg or tonnes) during the reporting period?', category: 'Environment', subcategory: 'Waste' },
      { id: 'cb-18', text: 'What was your waste recycling/diversion rate (percentage diverted from landfill)?', category: 'Environment', subcategory: 'Recycling' },
      { id: 'cb-19', text: 'How much hazardous waste did your operations generate? Describe your hazardous waste management and disposal procedures.', category: 'Environment', subcategory: 'Hazardous Waste' },
      { id: 'cb-20', text: 'What packaging materials do you use, and what percentage is recyclable or made from recycled content?', category: 'Environment', subcategory: 'Packaging' },
      { id: 'cb-21', text: 'Describe any circular economy initiatives (take-back programmes, design for disassembly, material recovery) currently in operation.', category: 'Environment', subcategory: 'Circular Economy' },

      // ── WORKFORCE & DIVERSITY (8) ──
      { id: 'cb-22', text: 'How many employees (full-time equivalents) does your company employ as of the end of the reporting period?', category: 'Social', subcategory: 'Workforce' },
      { id: 'cb-23', text: 'Provide a gender breakdown of your total workforce (% female, % male).', category: 'Social', subcategory: 'Diversity' },
      { id: 'cb-24', text: 'What percentage of your management and leadership positions are held by women?', category: 'Social', subcategory: 'Leadership Diversity' },
      { id: 'cb-25', text: 'What was your total employee turnover rate (voluntary and involuntary combined) for the reporting period?', category: 'Social', subcategory: 'Turnover' },
      { id: 'cb-26', text: 'What percentage of your workforce is covered by collective bargaining agreements or works council arrangements?', category: 'Social', subcategory: 'Collective Bargaining' },
      { id: 'cb-27', text: 'Do all employees receive compensation at or above the applicable living wage (not just minimum wage)? Describe your approach to fair compensation benchmarking.', category: 'Social', subcategory: 'Living Wage' },
      { id: 'cb-28', text: 'Do you have a diversity, equity, and inclusion (DEI) policy? Describe specific initiatives and measurable outcomes.', category: 'Social', subcategory: 'Diversity' },
      { id: 'cb-29', text: 'How many new hires joined and how many employees departed during the reporting period?', category: 'Social', subcategory: 'Workforce' },

      // ── HEALTH & SAFETY (5) ──
      { id: 'cb-30', text: 'What is your Total Recordable Incident Rate (TRIR) for the reporting period? Provide the underlying data: recordable incidents and total hours worked.', category: 'Social', subcategory: 'Health & Safety' },
      { id: 'cb-31', text: 'How many lost-time incidents occurred, and what was the resulting Lost Time Injury Rate (LTIR)?', category: 'Social', subcategory: 'Health & Safety' },
      { id: 'cb-32', text: 'Were there any work-related fatalities during the reporting period? If yes, describe the circumstances and corrective actions.', category: 'Social', subcategory: 'Health & Safety' },
      { id: 'cb-33', text: 'Do you have a certified occupational health and safety management system (e.g., ISO 45001)? Describe your safety management approach.', category: 'Social', subcategory: 'Safety Management' },
      { id: 'cb-34', text: 'Describe your process for incident investigation, root cause analysis, and implementation of corrective actions.', category: 'Social', subcategory: 'Safety Management' },

      // ── TRAINING & DEVELOPMENT (3) ──
      { id: 'cb-35', text: 'What is the average number of training hours delivered per employee per year? Provide the total training hours and headcount used in the calculation.', category: 'Social', subcategory: 'Training' },
      { id: 'cb-36', text: 'What types of training do you provide (e.g., health & safety, technical skills, sustainability awareness, compliance, leadership)?', category: 'Social', subcategory: 'Training' },
      { id: 'cb-37', text: 'Do you have structured career development and succession planning programmes? How do you measure training effectiveness?', category: 'Social', subcategory: 'Development' },

      // ── HUMAN RIGHTS & LABOR (5) ──
      { id: 'cb-38', text: 'Do you have a formal human rights policy covering forced labor, child labor, and freedom of association? Describe its scope and how it is communicated.', category: 'Social', subcategory: 'Human Rights' },
      { id: 'cb-39', text: 'What due diligence processes do you have in place to identify and mitigate human rights risks in your own operations and supply chain?', category: 'Social', subcategory: 'Human Rights' },
      { id: 'cb-40', text: 'Do you have a formal grievance mechanism or whistleblowing channel available to all employees and external stakeholders? How many grievances were reported in the last reporting period?', category: 'Social', subcategory: 'Grievance Mechanism' },
      { id: 'cb-41', text: 'Do you respect employees\' right to freedom of association and collective bargaining? Have there been any incidents of restriction?', category: 'Social', subcategory: 'Labor Rights' },
      { id: 'cb-42', text: 'Describe the working conditions at your facilities, including standard working hours, overtime policy, rest periods, and leave entitlements.', category: 'Social', subcategory: 'Working Conditions' },

      // ── GOVERNANCE & ETHICS (7) ──
      { id: 'cb-43', text: 'Do you have a Code of Conduct or Business Ethics policy? Describe its scope, how it is communicated, and how compliance is enforced.', category: 'Governance', subcategory: 'Ethics' },
      { id: 'cb-44', text: 'Do you have an anti-corruption and anti-bribery policy? Describe training, monitoring, and enforcement mechanisms.', category: 'Governance', subcategory: 'Anti-Corruption' },
      { id: 'cb-45', text: 'Have there been any significant fines, sanctions, or legal proceedings related to environmental, social, or governance matters in the past three years?', category: 'Governance', subcategory: 'Compliance' },
      { id: 'cb-46', text: 'Do you have a data protection and privacy policy (e.g., GDPR compliance)? Describe your approach to safeguarding personal and customer data.', category: 'Governance', subcategory: 'Data Protection' },
      { id: 'cb-47', text: 'Describe your corporate governance structure. Does your board or senior management have explicit oversight of ESG and sustainability issues?', category: 'Governance', subcategory: 'Board Oversight' },
      { id: 'cb-48', text: 'Do you have ESG-linked executive compensation or incentive structures? Describe.', category: 'Governance', subcategory: 'Incentives' },
      { id: 'cb-49', text: 'How do you identify, assess, and manage material ESG risks and opportunities? Describe your risk management framework.', category: 'Governance', subcategory: 'Risk Management' },

      // ── CERTIFICATIONS & REPORTING (4) ──
      { id: 'cb-50', text: 'List all current certifications held (ISO 14001, ISO 45001, ISO 9001, ISO 50001, ISO 27001, SA8000, B Corp, EMAS, etc.) with validity dates.', category: 'Governance', subcategory: 'Certifications' },
      { id: 'cb-51', text: 'Do you publish a sustainability or ESG report? Which reporting framework do you follow (GRI, CSRD/ESRS, TCFD, UN Global Compact)?', category: 'Governance', subcategory: 'Reporting' },
      { id: 'cb-52', text: 'Has any of your ESG data been externally verified or assured by a third party? If so, to what standard (ISAE 3000, AA1000)?', category: 'Governance', subcategory: 'Verification' },
      { id: 'cb-53', text: 'Are you subject to CSRD reporting obligations? If so, what is your timeline for compliance with the European Sustainability Reporting Standards (ESRS)?', category: 'Governance', subcategory: 'CSRD' },

      // ── SUPPLY CHAIN (5) ──
      { id: 'cb-54', text: 'Do you have a Supplier Code of Conduct? What ESG standards do you require from your suppliers?', category: 'Supply Chain', subcategory: 'Supplier Standards' },
      { id: 'cb-55', text: 'What percentage of your critical Tier 1 suppliers have been assessed or audited on ESG criteria in the past 12 months?', category: 'Supply Chain', subcategory: 'Supplier Assessment' },
      { id: 'cb-56', text: 'How do you monitor ongoing ESG performance of your supply chain? Describe your supplier risk screening and monitoring tools.', category: 'Supply Chain', subcategory: 'Supply Chain Monitoring' },
      { id: 'cb-57', text: 'Do you have a responsible sourcing policy for raw materials? Do you conduct conflict minerals due diligence (CMRT/EMRT)?', category: 'Supply Chain', subcategory: 'Responsible Sourcing' },
      { id: 'cb-58', text: 'How do you handle ESG non-compliance by a supplier? Describe your corrective action and escalation process.', category: 'Supply Chain', subcategory: 'Non-Compliance' },

      // ── TRANSPORT & LOGISTICS (2) ──
      { id: 'cb-59', text: 'What are your Scope 3 transport-related emissions? Describe your fleet composition, business travel volume (km), and employee commuting data.', category: 'Environment', subcategory: 'Transport' },
      { id: 'cb-60', text: 'What measures are you taking to reduce transport emissions (fleet electrification, route optimization, modal shift, remote work policies)?', category: 'Environment', subcategory: 'Transport Reduction' },
    ],
  },
};

/**
 * Convert a template into a ParseResult-compatible format for the answer engine.
 */
// Return a template's display name in the requested UI language (falls back to English).
export function templateName(template, lang = 'en') {
  return lang === 'de' && template.nameDe ? template.nameDe : template.name;
}

// Return a template's description in the requested UI language (falls back to English).
export function templateDescription(template, lang = 'en') {
  return lang === 'de' && template.descriptionDe ? template.descriptionDe : template.description;
}

export function templateToParseResult(templateId, lang = 'en') {
  const template = QUESTIONNAIRE_TEMPLATES[templateId];
  if (!template) return null;

  // Feed the questionnaire to the engine in the visitor's UI language when a German
  // rendering exists. The `text` field drives BOTH engine matching (the ESG pack has
  // German aliases) and the on-screen question list, so localizing it here makes the
  // whole sample/demo German. Questions without a textDe fall back to English.
  const localize = (q) => (lang === 'de' && q.textDe ? q.textDe : q.text);

  return {
    success: true,
    questions: template.questions.map((q, i) => ({
      id: q.id,
      rowIndex: i,
      text: localize(q),
      category: q.category,
      subcategory: q.subcategory,
      referenceId: q.id,
      framework: template.framework,
      required: true,
      rawRow: q,
    })),
    errors: [],
    metadata: {
      fileName: `${templateName(template, lang)} (Template)`,
      totalRows: template.questions.length,
      parsedRows: template.questions.length,
      detectedFramework: template.framework,
      columnMapping: { questionText: 'text', category: 'category', subcategory: 'subcategory', referenceId: 'id' },
      autoDetectionConfidence: 'high',
    },
  };
}

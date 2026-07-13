// ============================================
// ESG Domain Pack — Topic Requirements
// ============================================
// Defines what data fields each topic REQUIRES to produce a valid answer.
// Used post-generation to:
//   1. Validate that a template answer only claims what's supported
//   2. Generate specific gap declarations for missing fields
//   3. Cap confidence when required subparts are missing
export const ESG_TOPIC_REQUIREMENTS = {
    // ── Energy ──
    energy_consumption: {
        requiredFields: ['totalElectricity'],
        optionalFields: ['renewablePercent', 'energySavingsKwh'],
        gapDescriptions: {
            totalElectricity: 'Total electricity consumption (kWh) not tracked',
        },
    },
    renewable_share: {
        requiredFields: ['renewablePercent'],
        optionalFields: ['totalElectricity'],
        gapDescriptions: {
            renewablePercent: 'Renewable electricity percentage not tracked',
        },
    },
    energy_efficiency: {
        requiredFields: ['totalElectricity'],
        optionalFields: ['energySavingsKwh', 'renewablePercent'],
        gapDescriptions: {
            totalElectricity: 'Energy consumption data not available',
            energySavingsKwh: 'Energy savings not quantified',
        },
    },
    // ── Water ──
    water_usage: {
        requiredFields: ['waterWithdrawal'],
        optionalFields: ['waterSourceMunicipalPercent'],
        gapDescriptions: {
            waterWithdrawal: 'Water withdrawal (m³) not tracked',
            waterSourceMunicipalPercent: 'Water source breakdown not tracked',
        },
    },
    water_stress: {
        requiredFields: [],
        gapDescriptions: {},
    },
    wastewater: {
        requiredFields: [],
        gapDescriptions: {},
    },
    // ── Emissions ──
    ghg_emissions: {
        requiredFields: ['scope1Estimate'],
        optionalFields: ['scope2Location', 'scope2Market'],
        gapDescriptions: {
            scope1Estimate: 'Scope 1 emissions not calculated',
        },
    },
    scope_1: {
        requiredFields: [],
        optionalFields: ['scope1Estimate'],
        gapDescriptions: {},
    },
    scope_2: {
        requiredFields: ['scope2Location'],
        gapDescriptions: { scope2Location: 'Scope 2 emissions not calculated' },
    },
    scope_3: {
        requiredFields: [],
        gapDescriptions: {},
    },
    climate_targets: {
        requiredFields: [],
        gapDescriptions: {},
    },
    // ── Waste ──
    waste_total: {
        requiredFields: ['totalWaste'],
        gapDescriptions: { totalWaste: 'Total waste generated not tracked' },
    },
    waste_management: {
        requiredFields: ['totalWaste'],
        gapDescriptions: { totalWaste: 'Total waste generated not tracked' },
    },
    recycling: {
        requiredFields: ['diversionRate'],
        gapDescriptions: { diversionRate: 'Waste diversion/recycling rate not tracked' },
    },
    hazardous_waste: {
        requiredFields: ['hazardousWaste'],
        optionalFields: ['totalWaste'],
        gapDescriptions: { hazardousWaste: 'Hazardous waste quantity not tracked' },
    },
    circular_economy: {
        requiredFields: [],
        gapDescriptions: {},
    },
    packaging: {
        requiredFields: [],
        gapDescriptions: {},
    },
    // ── Workforce ──
    employee_count: {
        requiredFields: ['totalFte'],
        gapDescriptions: { totalFte: 'Employee headcount not available' },
    },
    diversity: {
        requiredFields: ['totalFte', 'femalePercent'],
        gapDescriptions: {
            totalFte: 'Employee headcount not available',
            femalePercent: 'Gender breakdown not tracked',
        },
    },
    leadership_diversity: {
        requiredFields: ['womenInLeadershipPercent'],
        gapDescriptions: { womenInLeadershipPercent: 'Women in leadership percentage not tracked' },
    },
    dei_policy: {
        requiredFields: [],
        gapDescriptions: {},
    },
    turnover: {
        requiredFields: ['turnoverRate'],
        gapDescriptions: { turnoverRate: 'Employee turnover rate not tracked' },
    },
    hires_departures: {
        requiredFields: ['totalFte'],
        optionalFields: ['newHires', 'turnoverRate'],
        gapDescriptions: {
            newHires: 'New hire count not tracked',
            turnoverRate: 'Turnover rate not tracked',
        },
    },
    collective_bargaining: {
        requiredFields: ['collectiveBargainingPercent'],
        gapDescriptions: { collectiveBargainingPercent: 'Collective bargaining coverage not tracked' },
    },
    labor_practices: {
        requiredFields: [],
        gapDescriptions: {},
    },
    human_rights: {
        requiredFields: [],
        gapDescriptions: {},
    },
    freedom_of_association: {
        requiredFields: [],
        gapDescriptions: {},
    },
    working_conditions: {
        requiredFields: [],
        gapDescriptions: {},
    },
    grievance: {
        requiredFields: ['grievanceMechanismExists'],
        optionalFields: ['grievancesReported'],
        gapDescriptions: {
            grievanceMechanismExists: 'Grievance mechanism status not recorded',
            grievancesReported: 'Grievance count not tracked',
        },
    },
    // ── H&S ──
    health_safety_kpi: {
        requiredFields: ['trir'],
        optionalFields: ['lostTimeIncidents', 'fatalities', 'totalHoursWorked'],
        gapDescriptions: {
            trir: 'TRIR not calculated',
            lostTimeIncidents: 'Lost time incidents not tracked',
            fatalities: 'Fatality count not tracked',
            totalHoursWorked: 'Total hours worked not tracked',
        },
    },
    fatalities: {
        requiredFields: ['fatalities'],
        gapDescriptions: { fatalities: 'Fatality data not tracked' },
    },
    health_safety_management: {
        requiredFields: [],
        gapDescriptions: {},
    },
    incident_investigation: {
        requiredFields: [],
        gapDescriptions: {},
    },
    // ── Training ──
    training: {
        requiredFields: ['trainingHoursPerEmployee'],
        gapDescriptions: { trainingHoursPerEmployee: 'Training hours per employee not tracked' },
    },
    // ── Governance ──
    ethics: {
        requiredFields: [],
        gapDescriptions: {},
    },
    governance: {
        requiredFields: [],
        gapDescriptions: {},
    },
    fines_sanctions: {
        requiredFields: ['noSignificantFines'],
        gapDescriptions: { noSignificantFines: 'Fines/sanctions status not recorded in Company Profile' },
    },
    data_protection: {
        requiredFields: ['dataProtectionPolicy'],
        gapDescriptions: { dataProtectionPolicy: 'Data protection policy status not recorded' },
    },
    esg_compensation: {
        requiredFields: [],
        gapDescriptions: {},
    },
    csrd: {
        requiredFields: ['csrdApplicable'],
        gapDescriptions: { csrdApplicable: 'CSRD applicability not assessed in Company Profile' },
    },
    transparency: {
        requiredFields: [],
        optionalFields: ['publishesSustainabilityReport', 'reportingFramework'],
        gapDescriptions: {
            publishesSustainabilityReport: 'Sustainability report publication status not recorded',
        },
    },
    // ── Certifications ──
    certifications: {
        requiredFields: [],
        optionalFields: ['certificationsHeld', 'validCertificates'],
        gapDescriptions: {},
    },
    // ── Supply chain ──
    supplier_code: {
        requiredFields: [],
        gapDescriptions: {},
    },
    supply_chain_monitoring: {
        requiredFields: [],
        optionalFields: ['suppliersAssessedPercent'],
        gapDescriptions: {
            suppliersAssessedPercent: 'Supplier ESG assessment percentage not tracked',
        },
    },
    conflict_minerals: {
        requiredFields: [],
        gapDescriptions: {},
    },
    supplier_management: {
        requiredFields: [],
        gapDescriptions: {},
    },
    // ── Company ──
    company_profile: {
        requiredFields: ['legalEntityName'],
        gapDescriptions: { legalEntityName: 'Company name not available' },
    },
    group_structure: {
        requiredFields: [],
        gapDescriptions: {},
    },
    facilities: {
        requiredFields: ['numberOfSites'],
        gapDescriptions: { numberOfSites: 'Number of sites/facilities not recorded' },
    },
    products_services: {
        requiredFields: ['legalEntityName'],
        gapDescriptions: {},
    },
    revenue: {
        requiredFields: ['revenueBand'],
        gapDescriptions: { revenueBand: 'Revenue band not recorded' },
    },
    // ── Transport ──
    fleet: {
        requiredFields: [],
        gapDescriptions: {},
    },
    transport: {
        requiredFields: [],
        gapDescriptions: {},
    },
    logistics: {
        requiredFields: [],
        gapDescriptions: {},
    },
    business_travel: {
        requiredFields: [],
        optionalFields: ['businessTravel', 'employeeCommute', 'scope3Total'],
        gapDescriptions: {
            businessTravel: 'Business travel km not tracked',
            employeeCommute: 'Employee commuting km not tracked',
        },
    },
    // ── Risk ──
    risk_management: {
        requiredFields: [],
        gapDescriptions: {},
    },
};
// German translations for every distinct gap-description phrase above.
// Keyed by the exact English string so the mapping stays DRY across topics.
// If you add a new gapDescriptions phrase, add its German here — the loop
// below (and the assertion test) will flag any untranslated phrase.
export const GAP_DESCRIPTIONS_DE = {
    'Total electricity consumption (kWh) not tracked': 'Gesamtstromverbrauch (kWh) nicht erfasst',
    'Renewable electricity percentage not tracked': 'Anteil erneuerbaren Stroms nicht erfasst',
    'Energy consumption data not available': 'Keine Daten zum Energieverbrauch verfügbar',
    'Energy savings not quantified': 'Energieeinsparungen nicht quantifiziert',
    'Water withdrawal (m³) not tracked': 'Wasserentnahme (m³) nicht erfasst',
    'Water source breakdown not tracked': 'Aufschlüsselung der Wasserquellen nicht erfasst',
    'Scope 1 emissions not calculated': 'Scope-1-Emissionen nicht berechnet',
    'Scope 2 emissions not calculated': 'Scope-2-Emissionen nicht berechnet',
    'Total waste generated not tracked': 'Gesamtes Abfallaufkommen nicht erfasst',
    'Waste diversion/recycling rate not tracked': 'Recycling-/Verwertungsquote nicht erfasst',
    'Hazardous waste quantity not tracked': 'Menge des gefährlichen Abfalls nicht erfasst',
    'Employee headcount not available': 'Mitarbeiterzahl nicht verfügbar',
    'Gender breakdown not tracked': 'Geschlechterverteilung nicht erfasst',
    'Women in leadership percentage not tracked': 'Frauenanteil in Führungspositionen nicht erfasst',
    'Employee turnover rate not tracked': 'Mitarbeiterfluktuationsquote nicht erfasst',
    'New hire count not tracked': 'Anzahl der Neueinstellungen nicht erfasst',
    'Turnover rate not tracked': 'Fluktuationsquote nicht erfasst',
    'Collective bargaining coverage not tracked': 'Abdeckung durch Tarifverträge nicht erfasst',
    'Grievance mechanism status not recorded': 'Status des Beschwerdemechanismus nicht erfasst',
    'Grievance count not tracked': 'Anzahl der Beschwerden nicht erfasst',
    'TRIR not calculated': 'TRIR nicht berechnet',
    'Lost time incidents not tracked': 'Ausfallzeit-Unfälle nicht erfasst',
    'Fatality count not tracked': 'Anzahl der Todesfälle nicht erfasst',
    'Total hours worked not tracked': 'Gesamte geleistete Arbeitsstunden nicht erfasst',
    'Fatality data not tracked': 'Daten zu Todesfällen nicht erfasst',
    'Training hours per employee not tracked': 'Weiterbildungsstunden pro Mitarbeitendem nicht erfasst',
    'Fines/sanctions status not recorded in Company Profile': 'Status zu Bußgeldern/Sanktionen nicht im Firmenprofil erfasst',
    'Data protection policy status not recorded': 'Status der Datenschutzrichtlinie nicht erfasst',
    'CSRD applicability not assessed in Company Profile': 'CSRD-Anwendbarkeit nicht im Firmenprofil bewertet',
    'Sustainability report publication status not recorded': 'Status der Veröffentlichung des Nachhaltigkeitsberichts nicht erfasst',
    'Supplier ESG assessment percentage not tracked': 'Anteil der ESG-bewerteten Lieferanten nicht erfasst',
    'Company name not available': 'Firmenname nicht verfügbar',
    'Number of sites/facilities not recorded': 'Anzahl der Standorte/Betriebsstätten nicht erfasst',
    'Revenue band not recorded': 'Umsatzgrößenklasse nicht erfasst',
    'Business travel km not tracked': 'Geschäftsreise-Kilometer nicht erfasst',
    'Employee commuting km not tracked': 'Pendel-Kilometer der Mitarbeitenden nicht erfasst',
};
// Attach German gap descriptions to each topic by translating its English
// phrases. Keeps the German DRY: one phrase → one translation, reused everywhere.
for (const req of Object.values(ESG_TOPIC_REQUIREMENTS)) {
    const de = {};
    for (const [field, en] of Object.entries(req.gapDescriptions)) {
        if (GAP_DESCRIPTIONS_DE[en])
            de[field] = GAP_DESCRIPTIONS_DE[en];
    }
    if (Object.keys(de).length > 0)
        req.gapDescriptionsDe = de;
}
/**
 * Check which required fields are missing for a set of topics.
 * Returns gap descriptions for all missing required fields.
 */
export function checkTopicGaps(topics, dataMap) {
    const gaps = [];
    const seen = new Set();
    for (const topic of topics) {
        const req = ESG_TOPIC_REQUIREMENTS[topic];
        if (!req)
            continue;
        for (const field of req.requiredFields) {
            if (seen.has(field))
                continue;
            seen.add(field);
            const point = dataMap.get(field);
            if (!point || point.value === null || point.value === undefined || point.value === '') {
                const desc = req.gapDescriptions[field];
                if (desc)
                    gaps.push(desc);
            }
        }
    }
    return gaps;
}
//# sourceMappingURL=topicRequirements.js.map
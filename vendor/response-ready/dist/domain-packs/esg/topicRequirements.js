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
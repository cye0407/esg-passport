// ============================================
// ESG Domain Pack — Framework Notes & Field Mapping
// ============================================
// Framework notes intentionally empty — the questionnaire already
// identifies the framework; repeating it on every answer adds noise.
export const ESG_FRAMEWORK_NOTES = {};
export const ESG_FIELD_TO_METRIC_KEY = {
    'totalElectricity': 'energy.electricity_kwh_12m',
    'fuel_natural_gas': 'energy.natural_gas_kwh_12m',
    'fuel_diesel': 'energy.fuel_diesel_l_12m',
    'waterWithdrawal': 'water.withdrawal_m3_12m',
    'totalWaste': 'waste.total_kg_12m',
    'diversionRate': 'waste.recycled_kg_12m',
    'hazardousWaste': 'waste.hazardous_kg_12m',
    'totalFte': 'workforce.headcount_avg_12m',
    'trir': 'workforce.ltifr_12m',
    'scope1Estimate': 'emissions.scope1_tco2e_12m',
    'scope2Location': 'emissions.scope2_tco2e_12m',
    'certificationsHeld': 'governance.code_of_conduct',
};
//# sourceMappingURL=frameworkNotes.js.map
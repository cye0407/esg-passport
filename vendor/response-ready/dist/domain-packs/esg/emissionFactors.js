// ============================================
// ESG Domain Pack — Emission Factors
// ============================================
// Country-specific emission factors for GHG calculations.
// Sources: IEA 2023, DEFRA 2023
const ELECTRICITY_FACTORS = {
    // Europe
    'Albania': 0.000012, 'Austria': 0.000090, 'Belgium': 0.000135,
    'Bosnia and Herzegovina': 0.000700, 'Bulgaria': 0.000395, 'Croatia': 0.000175,
    'Czech Republic': 0.000430, 'Denmark': 0.000120, 'Estonia': 0.000510,
    'Finland': 0.000070, 'France': 0.000052, 'Germany': 0.000385,
    'Greece': 0.000340, 'Hungary': 0.000230, 'Iceland': 0.000010,
    'Ireland': 0.000300, 'Italy': 0.000260, 'Latvia': 0.000095,
    'Lithuania': 0.000040, 'Luxembourg': 0.000155, 'Montenegro': 0.000350,
    'Netherlands': 0.000340, 'North Macedonia': 0.000480, 'Norway': 0.000008,
    'Poland': 0.000765, 'Portugal': 0.000175, 'Romania': 0.000290,
    'Serbia': 0.000700, 'Slovakia': 0.000120, 'Slovenia': 0.000240,
    'Spain': 0.000150, 'Sweden': 0.000012, 'Switzerland': 0.000020,
    'Turkey': 0.000430, 'United Kingdom': 0.000207,
    // Americas
    'United States': 0.000417, 'Canada': 0.000120, 'Mexico': 0.000420,
    'Brazil': 0.000070, 'Argentina': 0.000310, 'Chile': 0.000350,
    'Colombia': 0.000140,
    // Asia-Pacific
    'Australia': 0.000680, 'China': 0.000560, 'India': 0.000720,
    'Indonesia': 0.000720, 'Japan': 0.000470, 'South Korea': 0.000420,
    'Malaysia': 0.000580, 'New Zealand': 0.000100, 'Philippines': 0.000610,
    'Singapore': 0.000400, 'Taiwan': 0.000500, 'Thailand': 0.000440,
    'Vietnam': 0.000480,
    // Middle East & Africa
    'Egypt': 0.000450, 'Israel': 0.000530, 'Morocco': 0.000610,
    'Nigeria': 0.000410, 'Saudi Arabia': 0.000640, 'South Africa': 0.000920,
    'United Arab Emirates': 0.000430,
};
export const NATURAL_GAS_FACTOR = 0.00202; // tCO2e per m3
export const DIESEL_FACTOR = 0.00268; // tCO2e per litre
export const GAS_M3_TO_KWH = 10.55; // kWh per m3 of natural gas
const DEFAULT_ELECTRICITY_FACTOR = 0.0004;
export function getElectricityFactor(country) {
    if (!country) {
        return { factor: DEFAULT_ELECTRICITY_FACTOR, isDefault: true, source: 'Global average (no country specified)' };
    }
    const normalized = country.trim();
    const factor = ELECTRICITY_FACTORS[normalized];
    if (factor !== undefined) {
        return { factor, isDefault: false, source: `IEA 2023 — ${normalized}` };
    }
    const lower = normalized.toLowerCase();
    for (const [key, val] of Object.entries(ELECTRICITY_FACTORS)) {
        if (key.toLowerCase() === lower) {
            return { factor: val, isDefault: false, source: `IEA 2023 — ${key}` };
        }
    }
    return { factor: DEFAULT_ELECTRICITY_FACTOR, isDefault: true, source: `Global average (${normalized} not in database)` };
}
export function estimateScope1(naturalGasM3, dieselLiters) {
    if (!naturalGasM3 && !dieselLiters)
        return null;
    const gasEmissions = (naturalGasM3 || 0) * NATURAL_GAS_FACTOR;
    const dieselEmissions = (dieselLiters || 0) * DIESEL_FACTOR;
    return Math.round((gasEmissions + dieselEmissions) * 10) / 10;
}
export function estimateScope2Location(electricityKwh, country) {
    if (!electricityKwh)
        return null;
    const { factor, source } = getElectricityFactor(country);
    return { value: Math.round(electricityKwh * factor * 10) / 10, source };
}
export function estimateScope2Market(electricityKwh, renewablePercent, country) {
    if (!electricityKwh)
        return null;
    if (renewablePercent === undefined)
        return null;
    const { factor, source } = getElectricityFactor(country);
    const clamped = Math.max(0, Math.min(100, renewablePercent));
    const nonRenewableFraction = 1 - (clamped / 100);
    return {
        value: Math.round(electricityKwh * nonRenewableFraction * factor * 10) / 10,
        source: `${source} (adjusted for ${renewablePercent}% renewable)`,
    };
}
export const SUPPORTED_COUNTRIES = Object.keys(ELECTRICITY_FACTORS).sort();
//# sourceMappingURL=emissionFactors.js.map
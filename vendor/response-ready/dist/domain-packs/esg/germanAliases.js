// ============================================
// ESG Domain Pack — German Term Aliases
// ============================================
// Hand-built German→English ESG lexicon (no machine translation). Each entry maps a German
// term to the canonical English keyword(s) that ESG_KEYWORD_RULES already match on. When a
// German term appears in a question, the matcher appends the English keyword(s) before
// matching, so a German questionnaire routes to the same domains/topics as the English one.
//
// Matching notes:
//  - `term` is compared as a normalized substring, so German compounds resolve from a stem:
//    'abfall' hits 'Abfallaufkommen', 'strom' hits 'Stromverbrauch'.
//  - Normalization turns ä/ö/ü/ß into spaces on both sides, so terms with umlauts are written
//    naturally here (e.g. 'gefährlich', 'unfälle') and still match.
//  - `add` values MUST be strings that appear in ESG_KEYWORD_RULES keywords.
export const ESG_TERM_ALIASES = [
    // --- Energy ---
    { term: 'strom', add: ['electricity'] },
    { term: 'elektrizität', add: ['electricity'] },
    { term: 'energieverbrauch', add: ['energy consumption'] },
    { term: 'energieeffizienz', add: ['energy efficiency'] },
    { term: 'energie', add: ['energy consumption'] },
    { term: 'erneuerbar', add: ['renewable', 'renewable source'] },
    { term: 'ökostrom', add: ['green energy', 'renewable'] },
    // Gas questions are often stated "in kWh", which alone would tie/route to electricity.
    // Injecting 'fuel consumption' (energy_fuel, weight 10) gives gas the stronger signal.
    { term: 'erdgas', add: ['natural gas', 'fuel consumption'] },
    { term: 'gasverbrauch', add: ['natural gas', 'fuel consumption'] },
    { term: 'kraftstoff', add: ['fuel consumption'] },
    { term: 'treibstoff', add: ['fuel consumption'] },
    { term: 'benzin', add: ['petrol'] },
    { term: 'heizöl', add: ['heating oil'] },
    // --- Emissions ---
    { term: 'treibhausgas', add: ['greenhouse gas'] },
    { term: 'thg', add: ['ghg'] },
    { term: 'emission', add: ['carbon emission'] },
    { term: 'kohlendioxid', add: ['carbon dioxide'] },
    { term: 'kohlenstoff', add: ['carbon footprint'] },
    { term: 'klimaneutral', add: ['carbon neutral'] },
    { term: 'netto-null', add: ['net zero'] },
    { term: 'klimaziel', add: ['climate target'] },
    // --- Water ---
    { term: 'wasser', add: ['water consumption'] },
    { term: 'abwasser', add: ['wastewater'] },
    { term: 'wasserentnahme', add: ['water withdrawal'] },
    // --- Waste ---
    { term: 'abfall', add: ['waste'] },
    { term: 'abfallaufkommen', add: ['total waste', 'waste generated'] },
    { term: 'gesamtabfall', add: ['total waste'] },
    { term: 'müll', add: ['waste'] },
    { term: 'recycling', add: ['recycling'] },
    { term: 'wiederverwertung', add: ['recycling'] },
    { term: 'verwertung', add: ['recycling'] },
    { term: 'recyclingquote', add: ['diversion rate'] },
    { term: 'gefährlich', add: ['hazardous waste'] },
    { term: 'sondermüll', add: ['special waste', 'hazardous waste'] },
    { term: 'entsorgung', add: ['disposal'] },
    { term: 'deponie', add: ['landfill'] },
    { term: 'kreislaufwirtschaft', add: ['circular economy'] },
    { term: 'verpackung', add: ['packaging'] },
    // --- Materials ---
    { term: 'rohstoff', add: ['raw material'] },
    { term: 'rezyklat', add: ['recycled material'] },
    // --- Workforce ---
    { term: 'mitarbeit', add: ['employee'] },
    { term: 'beschäftigt', add: ['employee'] },
    { term: 'belegschaft', add: ['workforce size', 'employee'] },
    { term: 'personal', add: ['personnel'] },
    { term: 'vollzeitäquivalent', add: ['fte', 'full-time equivalent'] },
    { term: 'frauenanteil', add: ['gender', 'women'] },
    { term: 'geschlecht', add: ['gender'] },
    { term: 'diversität', add: ['diversity'] },
    { term: 'vielfalt', add: ['diversity'] },
    { term: 'fluktuation', add: ['turnover'] },
    { term: 'gewerkschaft', add: ['trade union'] },
    { term: 'tarifvertrag', add: ['collective bargaining'] },
    { term: 'betriebsrat', add: ['works council'] },
    { term: 'menschenrechte', add: ['human rights'] },
    { term: 'existenzsichernd', add: ['living wage'] },
    { term: 'mindestlohn', add: ['minimum wage'] },
    { term: 'lohn', add: ['wage'] },
    { term: 'gehalt', add: ['compensation'] },
    { term: 'kinderarbeit', add: ['child labor'] },
    { term: 'zwangsarbeit', add: ['forced labor'] },
    { term: 'neueinstellung', add: ['new hire'] },
    { term: 'abgänge', add: ['departures'] },
    { term: 'arbeitszeit', add: ['working hours'] },
    { term: 'überstunden', add: ['overtime'] },
    // --- Training ---
    { term: 'weiterbildung', add: ['training'] },
    { term: 'schulung', add: ['training'] },
    { term: 'fortbildung', add: ['training'] },
    { term: 'ausbildung', add: ['training'] },
    // --- Health & Safety ---
    { term: 'arbeitssicherheit', add: ['health and safety'] },
    { term: 'arbeitsschutz', add: ['health and safety', 'occupational health'] },
    { term: 'unfall', add: ['accident', 'injury'] },
    { term: 'unfälle', add: ['accident'] },
    { term: 'verletzung', add: ['injury'] },
    { term: 'berufskrankheit', add: ['occupational health'] },
    // --- Governance & policies ---
    { term: 'lieferanten verhaltenskodex', add: ['supplier code of conduct'] },
    { term: 'lieferantenverhaltenskodex', add: ['supplier code of conduct'] },
    { term: 'lieferantenkodex', add: ['supplier code of conduct'] },
    { term: 'verhaltenskodex', add: ['code of conduct'] },
    { term: 'korruption', add: ['anti-corruption'] },
    { term: 'bestechung', add: ['bribery'] },
    { term: 'richtlinie', add: ['policy'] },
    { term: 'umweltrichtlinie', add: ['environmental management'] },
    { term: 'umweltmanagement', add: ['environmental management'] },
    { term: 'datenschutz', add: ['data protection', 'gdpr'] },
    { term: 'hinweisgeber', add: ['whistleblower'] },
    { term: 'beschwerde', add: ['grievance'] },
    { term: 'nachhaltigkeitsbericht', add: ['sustainability report'] },
    { term: 'unternehmensführung', add: ['corporate governance'] },
    { term: 'ethik', add: ['ethics'] },
    // --- Certifications ---
    { term: 'zertifizierung', add: ['certification'] },
    { term: 'zertifikat', add: ['certification'] },
    { term: 'bewertung', add: ['assessment', 'rating'] },
    // --- Supply chain ---
    { term: 'lieferant', add: ['supplier'] },
    { term: 'lieferkette', add: ['supply chain'] },
    { term: 'beschaffung', add: ['procurement'] },
    // --- Company / financial ---
    { term: 'umsatz', add: ['revenue', 'turnover'] },
    { term: 'standort', add: ['site', 'location'] },
    { term: 'produktionsvolumen', add: ['production volume'] },
];
//# sourceMappingURL=germanAliases.js.map
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
//  - Normalization folds umlauts to their base letter on both sides ('gefährlich' and
//    'gefährlicher' both become 'gefahrlich…'), so terms are written naturally here. ß has no
//    decomposition and still folds to a space, again on both sides — so 'bußgeld' matches, it
//    just does so as two tokens.
//  - `add` values MUST be strings that appear in ESG_KEYWORD_RULES keywords.
//  - Every entry is tagged lang:'de' on export, so these fire only when the matcher is told
//    the questionnaire is German (matcher.setLanguage('de')). Without the tag, substring
//    matching would apply this lexicon to English text too — 'personal' (staff) hits the
//    English word "personal", 'emission' sits inside "emissions".
// 'gefährlich' alone must NOT inject 'hazardous waste': it is a bare adjective stem, so it
// fires on hazardous *anything* — "Gibt es gefährliche Arbeitsplätze?" is a health & safety
// question and was routing to waste at high confidence (high, so never flagged for review).
// Alias terms are matched as plain substrings, so the hazard word is paired with each waste
// noun explicitly; German adjectives decline, hence the ending set.
const HAZARD_ADJECTIVES = ['gefährlicher', 'gefährlichen', 'gefährliche', 'gefährlichem', 'gefährliches'];
const WASTE_NOUNS = ['abfall', 'abfalls', 'abfälle', 'abfällen'];
const HAZARDOUS_WASTE_ALIASES = HAZARD_ADJECTIVES.flatMap(adj => WASTE_NOUNS.map(noun => ({ term: `${adj} ${noun}`, add: ['hazardous waste'] })));
const GERMAN_ALIASES = [
    // --- Energy ---
    { term: 'strom', add: ['electricity'] },
    { term: 'elektrizität', add: ['electricity'] },
    { term: 'energieverbrauch', add: ['energy consumption'] },
    { term: 'energieeffizienz', add: ['energy efficiency'] },
    { term: 'energie', add: ['energy consumption'] },
    { term: 'erneuerbar', add: ['renewable', 'renewable source'] },
    { term: 'ökostrom', add: ['renewable'] },
    // Gas questions are often stated "in kWh", which alone would tie/route to electricity.
    // Injecting 'fuel consumption' (energy_fuel, weight 10) gives gas the stronger signal.
    { term: 'erdgas', add: ['natural gas', 'fuel consumption'] },
    { term: 'gasverbrauch', add: ['natural gas', 'fuel consumption'] },
    { term: 'kraftstoff', add: ['fuel consumption'] },
    { term: 'treibstoff', add: ['fuel consumption'] },
    { term: 'benzin', add: ['petrol'] },
    { term: 'heizöl', add: ['heating oil'] },
    // --- Emissions ---
    // German questionnaires write scopes hyphenated ("Scope-1-Emissionen"). Keyword matching
    // keeps hyphens, so the space-separated keywords 'scope 1/2/3' never match the hyphenated
    // form and every scope question collapses onto the same generic emissions answer. Alias
    // normalization folds hyphens to spaces, so these bridge the hyphenated German scopes back
    // to the canonical scope keywords. Purely additive (English never contains 'scope-N-…').
    { term: 'scope 1', add: ['scope 1'] },
    { term: 'scope 2', add: ['scope 2'] },
    { term: 'scope 3', add: ['scope 3'] },
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
    { term: 'wasserknappheit', add: ['water stress'] },
    { term: 'wasserstress', add: ['water stress'] },
    { term: 'wassermangel', add: ['water stress'] },
    // --- Waste ---
    { term: 'abfall', add: ['waste'] },
    { term: 'abfallaufkommen', add: ['total waste'] },
    { term: 'gesamtabfall', add: ['total waste'] },
    { term: 'müll', add: ['waste'] },
    { term: 'recycling', add: ['recycling'] },
    { term: 'wiederverwertung', add: ['recycling'] },
    { term: 'verwertung', add: ['recycling'] },
    { term: 'recyclingquote', add: ['diversion rate'] },
    ...HAZARDOUS_WASTE_ALIASES,
    { term: 'sondermüll', add: ['hazardous waste'] },
    { term: 'entsorgung', add: ['disposal'] },
    { term: 'deponie', add: ['landfill'] },
    { term: 'kreislaufwirtschaft', add: ['circular economy'] },
    { term: 'verpackung', add: ['packaging'] },
    // --- Materials ---
    { term: 'rohstoff', add: ['raw material'] },
    { term: 'rezyklat', add: ['recycled material'] },
    // 'recycelt' is not a substring of the 'recycling' alias; map it to the waste recycling
    // keyword so bulk-waste "…recycelt" questions route to waste at rule strength (L14).
    { term: 'recycelt', add: ['recycling'] },
    // --- Workforce ---
    { term: 'mitarbeit', add: ['employee'] },
    { term: 'beschäftigt', add: ['employee'] },
    { term: 'belegschaft', add: ['employee'] },
    { term: 'personal', add: ['personnel'] },
    { term: 'vollzeitäquivalent', add: ['full-time equivalent'] },
    { term: 'frauenanteil', add: ['women'] },
    { term: 'weiblich', add: ['women'] },
    // Women-in-leadership: route to leadership_diversity (weight 10) so it beats the plain
    // workforce/employee_count rule that "Führungskräfte" also reaches.
    { term: 'führungskräfte', add: ['women in leadership'] },
    { term: 'führungsposition', add: ['women in leadership'] },
    { term: 'leitungsposition', add: ['women in leadership'] },
    { term: 'geschlecht', add: ['gender'] },
    { term: 'diversität', add: ['diversity'] },
    { term: 'vielfalt', add: ['diversity'] },
    // → 'turnover rate' (not 'staff turnover'/'employee turnover', which contain the rule-88
    // tokens 'staff'/'employee' and would re-add a spurious employee_count topic).
    { term: 'fluktuation', add: ['turnover rate'] },
    // HR / social metrics (M16) + apprentices/absenteeism (M14).
    { term: 'krankenstand', add: ['absenteeism'] },
    { term: 'krankheitstage', add: ['absenteeism'] },
    { term: 'fehlzeiten', add: ['absenteeism'] },
    { term: 'elternzeit', add: ['parental leave'] },
    { term: 'mutterschutz', add: ['maternity leave'] },
    { term: 'mitarbeiterzufriedenheit', add: ['employee satisfaction'] },
    { term: 'lohngefälle', add: ['gender pay gap'] },
    { term: 'entgeltlücke', add: ['gender pay gap'] },
    { term: 'auszubildende', add: ['training', 'employee'] },
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
    { term: 'arbeitsschutz', add: ['occupational health'] },
    { term: 'unfall', add: ['accident'] },
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
    { term: 'bußgeld', add: ['fine'] },
    { term: 'sanktion', add: ['sanction'] },
    { term: 'strafzahlung', add: ['penalty'] },
    { term: 'externe prüfung', add: ['external assurance'] },
    { term: 'extern geprüft', add: ['external assurance'] },
    { term: 'unabhängige prüfung', add: ['external assurance'] },
    // 'verifiziert'/'vermerk' catch verified/Prüfvermerk phrasings (M12).
    { term: 'verifiziert', add: ['external assurance'] },
    { term: 'vermerk', add: ['external assurance'] },
    { term: 'richtlinie', add: ['policy'] },
    // An "Umweltrichtlinie" is an environmental POLICY — route it like a policy question
    // (via 'policy' → goals/policies), NOT to 'environmental management' which pulls to the
    // certifications answer. 'umweltmanagement'/EMS still maps to environmental management.
    { term: 'umweltrichtlinie', add: ['policy'] },
    { term: 'umweltmanagement', add: ['environmental management'] },
    { term: 'datenschutz', add: ['data protection'] },
    { term: 'cybersicherheit', add: ['cybersecurity'] },
    { term: 'informationssicherheit', add: ['information security'] },
    { term: 'datenpanne', add: ['data breach'] },
    { term: 'datenschutzverletzung', add: ['data breach'] },
    // Governance / business ethics (M20).
    { term: 'interessenkonflikt', add: ['conflict of interest'] },
    { term: 'geldwäsche', add: ['anti-money laundering'] },
    { term: 'lobbyarbeit', add: ['lobbying'] },
    { term: 'steuertransparenz', add: ['tax transparency'] },
    { term: 'hinweisgeber', add: ['whistleblower'] },
    { term: 'beschwerde', add: ['grievance'] },
    { term: 'nachhaltigkeitsbericht', add: ['sustainability report'] },
    { term: 'unternehmensführung', add: ['corporate governance'] },
    { term: 'ethik', add: ['ethics'] },
    // --- Certifications ---
    { term: 'zertifizierung', add: ['certification'] },
    { term: 'zertifikat', add: ['certification'] },
    // Narrowed to 'assessment' only (was ['assessment','rating']) so bare '-bewertung' compounds
    // stop being pulled into the EcoVadis buyer_requirements domain (M10). Specific compounds
    // are handled explicitly below.
    { term: 'bewertung', add: ['assessment'] },
    { term: 'risikobewertung', add: ['risk assessment'] },
    { term: 'lieferantenbewertung', add: ['supplier assessment'] },
    // "Audits/Bewertungen Ihrer Lieferanten" — the German word order separates audit/assessment
    // from the supplier noun, so the contiguous 'supplier audit'/'supplier assessment' keyword
    // never fires from alias-stemming alone (C). Bridge the whole phrase to the keyword.
    { term: 'audits ihrer lieferanten', add: ['supplier audit'] },
    { term: 'audit ihrer lieferanten', add: ['supplier audit'] },
    { term: 'audits ihrer zulieferer', add: ['supplier audit'] },
    { term: 'bewertungen ihrer lieferanten', add: ['supplier assessment'] },
    { term: 'bewertung ihrer lieferanten', add: ['supplier assessment'] },
    { term: 'lieferantenaudit', add: ['supplier audit'] },
    { term: 'taxonomie', add: ['eu taxonomy'] },
    { term: 'eu-taxonomie', add: ['eu taxonomy'] },
    // Materiality (H7).
    { term: 'wesentlichkeit', add: ['materiality'] },
    { term: 'wesentlichkeitsanalyse', add: ['materiality assessment'] },
    { term: 'doppelte wesentlichkeit', add: ['double materiality'] },
    // --- Supply chain ---
    { term: 'lieferant', add: ['supplier'] },
    { term: 'zulieferer', add: ['supplier'] },
    { term: 'lieferkette', add: ['supply chain'] },
    { term: 'beschaffung', add: ['procurement'] },
    // Due diligence / supply-chain law (M13).
    { term: 'sorgfaltspflicht', add: ['due diligence'] },
    { term: 'lieferkettensorgfaltspflichtengesetz', add: ['lksg', 'due diligence'] },
    { term: 'lksg', add: ['lksg', 'due diligence'] },
    { term: 'lieferkettengesetz', add: ['lieferkettengesetz'] },
    // --- Biodiversity / pollution / community ---
    { term: 'biodiversität', add: ['biodiversity'] },
    { term: 'artenvielfalt', add: ['biodiversity'] },
    { term: 'entwaldung', add: ['deforestation'] },
    { term: 'ökosystem', add: ['ecosystem'] },
    { term: 'luftverschmutzung', add: ['air pollution'] },
    { term: 'luftemission', add: ['air pollution'] },
    { term: 'umweltvorfall', add: ['environmental incident'] },
    { term: 'gemeinschaft', add: ['local community'] },
    { term: 'gemeinde', add: ['local community'] },
    { term: 'soziales engagement', add: ['community engagement'] },
    // --- Company / financial ---
    // 'umsatz' → revenue ONLY. German employee turnover is 'Fluktuation', never 'Umsatz', so
    // injecting 'turnover' spuriously raised a workforce/turnover secondary domain (M11).
    { term: 'umsatz', add: ['revenue'] },
    // Only 'site' — 'site' and 'location' are the same keyword rule, so adding both
    // double-scored the site domain and hijacked e.g. water-scarcity "…an Ihren Standorten".
    { term: 'standort', add: ['site'] },
    { term: 'produktionsvolumen', add: ['production volume'] },
];
export const ESG_TERM_ALIASES = GERMAN_ALIASES.map(a => ({ ...a, lang: 'de' }));
//# sourceMappingURL=germanAliases.js.map
// ============================================
// ESG Domain Pack — Question Bank: VSME records
// ============================================
// The spine of the bank: EFRAG's VSME standard (Basic Module B1–B11, Comprehensive Module C1–C9),
// at the grain a buyer asks — one record per question, not one per XBRL element (mass and
// volume of the same waste stream are one question; training hours by gender are one question).
// Element names come from the VSME XBRL taxonomy 2026-05-01; the German intent follows EFRAG's
// own German labels. Every record here is inside the CSRD value-chain cap.
const v = (q) => ({ ...q, legalBasis: 'vsme' });
export const VSME_QUESTIONS = [
    // ------------------------------------------------------------------ B1 · general
    v({
        id: 'vsme.b1.employees', topic: 'general', answerType: 'number', unit: 'employees',
        intent: { en: 'Number of employees (headcount or FTE)', de: 'Beschäftigtenzahl (Köpfe oder VZÄ)' },
        variants: {
            en: ['number of employees', 'total number of employees', 'how many employees', 'staff headcount', 'total staff headcount', 'full-time equivalents', 'FTE', 'workforce size', 'total headcount for the company group'],
            de: ['Anzahl der Mitarbeitenden', 'Beschäftigtenzahl', 'wie viele Mitarbeitende', 'Vollzeitäquivalente', 'VZÄ', 'Mitarbeiterzahl', 'Gesamtzahl der Beschäftigten'],
        },
        refs: ['VSME B1 ¶24(e)', 'GRI 2-7', 'SAQ5 headcount'], vsme: ['NumberOfEmployees', 'TypeOfNumberOfEmployees', 'EmployeeCountingMethodology'],
        needs: ['employeeCount'], needsDocument: { en: 'HR headcount report', de: 'Personalbericht / Kopfzahlen' },
    }),
    v({
        id: 'vsme.b1.turnover', topic: 'general', answerType: 'money', unit: 'EUR',
        intent: { en: 'Annual turnover / revenue', de: 'Umsatzerlöse' },
        variants: {
            en: ['annual turnover', 'net turnover', 'revenue', 'annual revenue', 'revenue band', 'sales', 'turnover in the last financial year'],
            de: ['Umsatz', 'Jahresumsatz', 'Nettoumsatz', 'Umsatzerlöse', 'Umsatzklasse', 'Umsatz im letzten Geschäftsjahr'],
        },
        refs: ['VSME B1 ¶24(e)', 'GRI 201-1'], vsme: ['Turnover'],
        needs: ['revenueBand'], never: ['turnoverRate'], needsDocument: { en: 'annual accounts', de: 'Jahresabschluss' },
    }),
    v({
        id: 'vsme.b1.assets', topic: 'general', answerType: 'money', unit: 'EUR',
        intent: { en: 'Balance sheet total (assets)', de: 'Bilanzsumme (Vermögenswerte)' },
        variants: { en: ['balance sheet total', 'total assets', 'assets'], de: ['Bilanzsumme', 'Vermögenswerte', 'Gesamtvermögen'] },
        refs: ['VSME B1 ¶24(e)'], vsme: ['Assets'], needs: [], needsDocument: { en: 'annual accounts', de: 'Jahresabschluss' },
    }),
    v({
        id: 'vsme.b1.legalForm', topic: 'general', answerType: 'text',
        intent: { en: 'Legal form of the company', de: 'Rechtsform des Unternehmens' },
        variants: { en: ['legal form', 'legal entity type', 'type of company', 'ownership structure', 'ownership'], de: ['Rechtsform', 'Gesellschaftsform', 'Eigentümerstruktur'] },
        refs: ['VSME B1 ¶24(a)'], vsme: ['UndertakingsLegalForm', 'OtherUndertakingsLegalForm'], needs: ['ownership'],
    }),
    v({
        id: 'vsme.b1.nace', topic: 'general', answerType: 'list',
        intent: { en: 'Sector / NACE classification', de: 'Branche / NACE-Code' },
        variants: { en: ['NACE code', 'sector classification', 'industry sector', 'main industry', 'business area', 'which sector do you operate in'], de: ['NACE-Code', 'Branche', 'Wirtschaftszweig', 'Geschäftsbereich', 'Industriezweig'] },
        refs: ['VSME B1 ¶24(b)'], vsme: ['NaceSectorClassificationCodes'], needs: ['industry'],
    }),
    v({
        id: 'vsme.b1.sites', topic: 'general', answerType: 'list',
        intent: { en: 'Sites: number, addresses, countries', de: 'Standorte: Anzahl, Adressen, Länder' },
        variants: {
            en: ['how many sites', 'number of sites', 'operational sites', 'facilities', 'production sites', 'site address', 'address of site', 'locations', 'in which countries do you operate', 'list of sites', 'list all production assembly warehousing and service sites', 'how many operational sites facilities and in which countries'],
            de: ['wie viele Standorte', 'Anzahl der Standorte', 'Produktionsstandorte', 'Adresse des Standorts', 'Betriebsstätten', 'in welchen Ländern sind Sie tätig'],
        },
        refs: ['VSME B1 ¶24(d)', 'GRI 2-1'], vsme: ['CountryOfSite', 'AddressOfSite', 'CityOfSite', 'PostalCodeOfSite', 'GPSLocationOfSite'],
        needs: ['numberOfSites', 'registeredAddress', 'operatingCountries', 'country'],
    }),
    v({
        id: 'vsme.b1.primaryCountry', topic: 'general', answerType: 'text',
        intent: { en: 'Country of primary operations / headquarters', de: 'Land der Hauptgeschäftstätigkeit / Hauptsitz' },
        variants: { en: ['country of primary operations', 'headquarters country', 'where is your company headquartered', 'country of registration', 'headquarter'], de: ['Hauptsitz', 'Land der Hauptgeschäftstätigkeit', 'Sitz des Unternehmens', 'Firmensitz'] },
        refs: ['VSME B1 ¶24(c)'], vsme: ['CountryOfPrimaryOperationsAndLocationOfSignificantAssets'], needs: ['country', 'registeredAddress'],
    }),
    v({
        id: 'vsme.b1.subsidiaries', topic: 'general', answerType: 'list',
        intent: { en: 'Subsidiaries and parent company', de: 'Tochterunternehmen und Muttergesellschaft' },
        variants: { en: ['subsidiaries', 'parent company', 'group structure', 'consolidated basis', 'list of subsidiaries', 'name of the parent company', 'subsidiary of a larger group name the parent company and group structure', 'ultimate parent company'], de: ['Tochterunternehmen', 'Muttergesellschaft', 'Konzernstruktur', 'Konzernzugehörigkeit'] },
        refs: ['VSME B1 ¶24', 'GRI 2-2'], vsme: ['BasisForReporting', 'NameOfTheSubsidiary', 'RegisteredAddressOfTheSubsidiary'], needs: ['parentCompany', 'subsidiaries'],
    }),
    v({
        id: 'vsme.b1.certifications', topic: 'general', answerType: 'list',
        intent: { en: 'Sustainability-related certifications or labels held', de: 'Nachhaltigkeitsbezogene Zertifizierungen oder Siegel' },
        variants: {
            en: ['sustainability certifications', 'certifications held', 'list all certifications', 'which certifications do you hold', 'ISO certifications', 'certified to ISO', 'labels or certifications', 'certificates with validity dates', 'list all current certifications held iso 14001 iso 45001 iso 9001 iso 50001 iso 27001 sa8000 b corp emas with validity dates'],
            de: ['Zertifizierungen', 'welche Zertifizierungen liegen vor', 'ISO-Zertifizierungen', 'Zertifikate', 'Siegel und Zertifizierungen', 'Zertifizierungen mit Gültigkeit'],
        },
        refs: ['VSME B1 ¶24(f)', 'SAQ5 11', 'SAQ5 8'], vsme: ['DescriptionOfSustainabilityRelatedCertificationsOrLabels'],
        needs: ['certifications', 'policies'], needsDocument: { en: 'the certificates', de: 'die Zertifikate' },
    }),
    // ------------------------------------------------------------------ B2 · practices, policies, targets
    v({
        id: 'vsme.b2.policiesOverview', topic: 'governance', answerType: 'list',
        intent: { en: 'Which sustainability issues are covered by a practice, policy or initiative', de: 'Welche Nachhaltigkeitsaspekte durch Verfahrensweisen, Richtlinien oder Initiativen abgedeckt sind' },
        variants: {
            en: ['which sustainability policies do you have', 'list your ESG policies', 'policies in place', 'do you have policies covering environmental social and governance topics', 'sustainability practices policies and initiatives', 'overview of policies'],
            de: ['welche Nachhaltigkeitsrichtlinien haben Sie', 'Übersicht der Richtlinien', 'welche ESG-Richtlinien liegen vor', 'Verfahrensweisen Richtlinien und Initiativen'],
        },
        refs: ['VSME B2 ¶27'], vsme: ['SustainabilityIssueAddressedByPracticePolicyAndOrFutureInitiative'], needs: ['policies'],
    }),
    v({
        id: 'vsme.b2.policiesPublic', topic: 'governance', answerType: 'yesno',
        intent: { en: 'Are the policies publicly available', de: 'Sind die Richtlinien öffentlich verfügbar' },
        variants: { en: ['are your policies publicly available', 'is the policy published', 'publicly available policy', 'link to your policy'], de: ['sind Ihre Richtlinien öffentlich zugänglich', 'ist die Richtlinie veröffentlicht', 'öffentlich verfügbar'] },
        refs: ['VSME B2 ¶28'], vsme: ['PracticePolicyAndOrFutureInitiativeIsPubliclyAvailable'], needs: [],
    }),
    v({
        id: 'vsme.b2.targets', topic: 'governance', answerType: 'yesno',
        intent: { en: 'Has the company set sustainability targets', de: 'Hat das Unternehmen Nachhaltigkeitsziele festgelegt' },
        variants: { en: ['do you have sustainability targets', 'have you set targets', 'measurable targets', 'ESG goals', 'sustainability goals and targets', 'targets related to your policies', 'does the policy include quantitative commitments for energy greenhouse gases water and waste', 'targets for increasing the use of sustainable or recycled materials'], de: ['haben Sie Nachhaltigkeitsziele', 'Ziele festgelegt', 'messbare Ziele', 'ESG-Ziele', 'quantitative Verpflichtungen in der Richtlinie'] },
        refs: ['VSME B2 ¶28', 'VSME C2'], vsme: ['UndertakingHasSetATargetWhichIsRelatedToAPolicy', 'DescriptionOfATargetRelatedToAPolicy'], needs: ['sustainabilityGoal'],
    }),
    // ------------------------------------------------------------------ B3 · energy and GHG
    v({
        id: 'vsme.b3.energyTotal', topic: 'environment', answerType: 'number', unit: 'MWh',
        intent: { en: 'Total energy consumption (all carriers)', de: 'Gesamtenergieverbrauch (alle Energieträger)' },
        variants: {
            en: ['total energy consumption', 'energy consumption in MWh', 'total energy use', 'energy consumed', 'how much energy do you consume', 'annual energy consumption', 'total energy consumed', 'energy consumed separated by electricity fuels district energy', 'energy consumption by source and facility', 'annual energy consumption electricity and fuel', 'total energy consumption and greenhouse gas emissions', 'total energy consumption in mwh split by electricity heating fuels and transport fuels'],
            de: ['Gesamtenergieverbrauch', 'Energieverbrauch in MWh', 'gesamter Energieverbrauch', 'jährlicher Energieverbrauch', 'wie viel Energie verbrauchen Sie', 'Energieverbrauch nach Energieträger', 'Strom- und Brennstoffverbrauch gesamt'],
        },
        refs: ['VSME B3 ¶29', 'GRI 302-1', 'CDP SME'], vsme: ['TotalEnergyConsumption'],
        needs: ['electricityKwh', 'naturalGasM3', 'dieselLiters'], needsDocument: { en: 'electricity, gas and fuel bills for the year', de: 'Strom-, Gas- und Kraftstoffrechnungen des Jahres' },
    }),
    v({
        id: 'vsme.b3.electricity', topic: 'environment', answerType: 'number', unit: 'kWh',
        intent: { en: 'Electricity consumption', de: 'Stromverbrauch' },
        variants: { en: ['electricity consumption', 'total electricity consumption', 'purchased electricity', 'electricity use in kWh', 'kWh consumed'], de: ['Stromverbrauch', 'gesamter Stromverbrauch', 'eingekaufter Strom', 'Stromverbrauch in kWh'] },
        refs: ['VSME B3 ¶29', 'GRI 302-1'], vsme: ['EnergyConsumptionFromElectricity'],
        needs: ['electricityKwh'], never: ['naturalGasM3', 'dieselLiters'], needsDocument: { en: 'electricity bills for the year', de: 'Stromrechnungen des Jahres' },
    }),
    v({
        id: 'vsme.b3.fuels', topic: 'environment', answerType: 'number', unit: 'MWh',
        intent: { en: 'Energy from fuels (gas, oil, diesel)', de: 'Energieverbrauch aus Brennstoffen (Gas, Öl, Diesel)' },
        variants: { en: ['fuel consumption', 'natural gas consumption', 'diesel consumption', 'heating oil', 'energy from fuels', 'fuel quantities by type', 'fuel type and quantity', 'natural gas consumption and diesel fuel consumption in liters', 'emissions and fuel consumption from stationary combustion by fuel type'], de: ['Kraftstoffverbrauch', 'Erdgasverbrauch', 'Dieselverbrauch', 'Heizöl', 'Brennstoffverbrauch', 'Kraftstoffmengen nach Art', 'Erdgas- und Dieselverbrauch'] },
        refs: ['VSME B3 ¶29', 'GRI 302-1'], vsme: ['EnergyConsumptionFromFuels'],
        needs: ['naturalGasM3', 'dieselLiters'], never: ['electricityKwh'], needsDocument: { en: 'gas and fuel invoices', de: 'Gas- und Kraftstoffrechnungen' },
    }),
    v({
        id: 'vsme.b3.renewableShare', topic: 'environment', answerType: 'percent', unit: '%',
        intent: { en: 'Share of energy / electricity from renewable sources', de: 'Anteil erneuerbarer Energie am Verbrauch' },
        variants: {
            en: ['percentage renewable', 'share of renewable energy', 'renewable electricity', 'what percentage of electricity came from renewable sources', 'green electricity', 'renewable energy share', 'percent of energy from renewable sources', 'renewable electricity share by instrument type and country', 'percentage of electricity sourced from certified renewable sources ppas green tariffs on-site generation', 'percentage of your energy consumption from renewable sources'],
            de: ['Anteil erneuerbarer Energien', 'Ökostromanteil', 'wie viel Prozent des Stroms stammt aus erneuerbaren Quellen', 'erneuerbarer Anteil', 'Grünstrom'],
        },
        refs: ['VSME B3 ¶29', 'GRI 302-1', 'SAQ5 13'], vsme: ['TotalEnergyConsumption'],
        needs: ['renewablePercent'], needsDocument: { en: 'electricity contract or green-tariff certificate', de: 'Stromvertrag oder Ökostromnachweis' },
    }),
    v({
        id: 'vsme.b3.renewableHeat', topic: 'environment', answerType: 'percent', unit: '%',
        intent: { en: 'Share of heating / cooling from renewable sources', de: 'Anteil erneuerbarer Energie an Wärme / Kälte' },
        variants: {
            en: ['percentage of heating cooling from renewable sources', 'renewable heat', 'renewable share of heating and cooling', 'district heating renewable share', 'green heat'],
            de: ['Anteil erneuerbarer Wärme', 'Wärme aus erneuerbaren Quellen', 'erneuerbarer Anteil an Heizung und Kühlung', 'Fernwärme erneuerbar'],
        },
        refs: ['VSME B3 ¶29', 'SAQ5 14'], vsme: ['TotalEnergyConsumption'],
        needs: [], needsDocument: { en: 'heating supply contract or fuel bills', de: 'Wärmeliefervertrag oder Brennstoffrechnungen' },
    }),
    v({
        id: 'vsme.b3.selfGenerated', topic: 'environment', answerType: 'number', unit: 'kWh',
        intent: { en: 'Self-generated electricity (e.g. rooftop solar)', de: 'Selbst erzeugter Strom (z. B. Photovoltaik)' },
        variants: { en: ['self-generated electricity', 'on-site generation', 'solar panels', 'own renewable generation', 'do you generate your own electricity', 'on-site renewable generation self-consumption and exported electricity'], de: ['selbst erzeugter Strom', 'Eigenerzeugung', 'Photovoltaikanlage', 'eigene Stromerzeugung'] },
        refs: ['VSME B3 ¶29'], vsme: ['EnergyConsumptionFromSelfGeneratedElectricity'], needs: [],
    }),
    v({
        id: 'vsme.b3.scope1', topic: 'environment', answerType: 'number', unit: 'tCO2e',
        intent: { en: 'Scope 1 (direct) GHG emissions', de: 'Scope-1-Treibhausgasemissionen (direkt)' },
        variants: { en: ['scope 1 emissions', 'direct emissions', 'direct GHG emissions', 'scope 1 in tCO2e', 'emissions from direct combustion', 'scope 1 only', 'scope 1 direct greenhouse gas emissions', 'total scope 1 greenhouse gas emissions in tco2e', 'gross scope 1 emissions', 'scope 1 greenhouse gas emissions and the calculation standard applied', 'scope 1 ghg emissions from direct combustion'], de: ['Scope-1-Emissionen', 'direkte Emissionen', 'direkte Treibhausgasemissionen', 'Scope 1 in tCO2e', 'Scope-1-Treibhausgasemissionen', 'direkte THG-Emissionen in tCO2e'] },
        refs: ['VSME B3 ¶30', 'GRI 305-1', 'CDP SME', 'ESRS E1-6'], vsme: ['GrossScope1GreenhouseGasEmissions'],
        needs: ['scope1Tco2e'], never: ['scope2Tco2e', 'scope3Tco2e'], needsDocument: { en: 'fuel and gas bills (Scope 1 is calculated from them)', de: 'Kraftstoff- und Gasrechnungen (Scope 1 wird daraus berechnet)' },
    }),
    v({
        id: 'vsme.b3.scope2', topic: 'environment', answerType: 'number', unit: 'tCO2e',
        intent: { en: 'Scope 2 GHG emissions (location- and market-based)', de: 'Scope-2-Treibhausgasemissionen (standort- und marktbasiert)' },
        variants: { en: ['scope 2 emissions', 'indirect emissions from purchased electricity', 'location-based scope 2', 'market-based scope 2', 'scope 2 in tCO2e', 'scope 2 location-based and market-based emissions', 'scope 2 greenhouse gas emissions from purchased electricity', 'location-based scope 2 emissions and purchased energy quantities', 'market-based scope 2 emissions and the instruments applied'], de: ['Scope-2-Emissionen', 'indirekte Emissionen aus eingekauftem Strom', 'standortbasiert', 'marktbasiert', 'Scope 2 in tCO2e', 'Scope-2-Treibhausgasemissionen aus eingekauftem Strom'] },
        refs: ['VSME B3 ¶30', 'GRI 305-2', 'CDP SME'], vsme: ['GrossLocationBasedScope2GreenhouseGasEmissions', 'GrossMarketBasedScope2GreenhouseGasEmissions'],
        needs: ['scope2Tco2e', 'electricityKwh'], never: ['scope1Tco2e', 'scope3Tco2e'], needsDocument: { en: 'electricity bills (Scope 2 is calculated from them)', de: 'Stromrechnungen (Scope 2 wird daraus berechnet)' },
    }),
    v({
        id: 'vsme.b3.scope3', topic: 'environment', answerType: 'number', unit: 'tCO2e',
        intent: { en: 'Scope 3 GHG emissions and categories covered', de: 'Scope-3-Treibhausgasemissionen und erfasste Kategorien' },
        variants: { en: ['scope 3 emissions', 'do you measure scope 3', 'value chain emissions', 'upstream emissions', 'which scope 3 categories', 'indirect value chain emissions', 'scope 3 screening method and categories assessed', 'category 1 emissions', 'category 2 emissions', 'category 3 emissions', 'category 4 emissions', 'category 5 emissions', 'category 6 emissions', 'category 7 emissions', 'category 8 emissions', 'category 9 emissions', 'category 10 emissions', 'category 11 emissions', 'category 12 emissions', 'category 13 emissions', 'category 14 emissions', 'category 15 emissions', 'purchased goods and services emissions', 'total scope 3 emissions broken down by category', 'upstream supply chain emissions'], de: ['Scope-3-Emissionen', 'erfassen Sie Scope 3', 'Emissionen der Wertschöpfungskette', 'welche Scope-3-Kategorien', 'vorgelagerte Emissionen', 'Scope-3-Kategorien', 'Emissionen der Kategorie'] },
        refs: ['VSME B3 ¶31 (comprehensive)', 'GRI 305-3', 'CDP SME'], vsme: ['GrossScope3GreenhouseGasEmissions'],
        needs: ['scope3Tco2e', 'scope3Categories'], never: ['scope1Tco2e', 'scope2Tco2e'],
    }),
    v({
        id: 'vsme.b3.ghgTotal', topic: 'environment', answerType: 'number', unit: 'tCO2e',
        intent: { en: 'Total GHG emissions (Scope 1 + 2, optionally + 3)', de: 'Gesamte Treibhausgasemissionen (Scope 1 + 2, ggf. + 3)' },
        variants: { en: ['total greenhouse gas emissions', 'total GHG emissions', 'scope 1 and scope 2 emissions', 'carbon footprint', 'total CO2 emissions', 'combined scope 1 and 2', 'total greenhouse gas emissions scope 1 and scope 2', 'monitor and record your greenhouse gas emissions', 'scope 1 and scope 2 greenhouse gas emissions for the last reporting period'], de: ['gesamte Treibhausgasemissionen', 'THG-Emissionen gesamt', 'Scope 1 und 2', 'CO2-Fußabdruck', 'Gesamtemissionen', 'Scope 1 und Scope 2 gesamt'] },
        refs: ['VSME B3 ¶30', 'GRI 305'], vsme: ['TotalGrossLocationBasedScope1AndScope2GHGEmissions', 'TotalGrossMarketBasedScope1AndScope2GHGEmissions', 'TotalGrossLocationBasedGHGEmissions'],
        needs: ['scope1Tco2e', 'scope2Tco2e'],
    }),
    v({
        id: 'vsme.b3.ghgIntensity', topic: 'environment', answerType: 'number', unit: 'tCO2e/EUR',
        intent: { en: 'GHG intensity per turnover', de: 'Treibhausgas-Emissionsintensität je Umsatz' },
        variants: { en: ['GHG intensity', 'emissions intensity', 'emissions per revenue', 'carbon intensity', 'tCO2e per million euro'], de: ['Emissionsintensität', 'THG-Intensität', 'Emissionen je Umsatz', 'CO2-Intensität'] },
        refs: ['VSME B3 ¶30', 'GRI 305-4'], vsme: ['Scope1AndScope2GreenhouseGasEmissionsIntensityValueLocationBased', 'Scope1AndScope2GreenhouseGasEmissionsIntensityValueMarketBased'],
        needs: ['scope1Tco2e', 'scope2Tco2e', 'revenueBand'],
    }),
    // ------------------------------------------------------------------ B4 · pollution
    v({
        id: 'vsme.b4.pollutants', topic: 'environment', answerType: 'number', unit: 'kg',
        intent: { en: 'Pollutant emissions to air, water and soil', de: 'Schadstoffemissionen in Luft, Wasser und Boden' },
        variants: {
            en: ['air emissions', 'pollutants emitted', 'NOx SOx VOC particulate matter', 'emissions to water', 'emissions to soil', 'pollution to air water and soil', 'air pollutants', 'PM2.5 PM10', 'environmental incidents and spills', 'nox sox voc and particulate emissions where material', 'material spills releases permit breaches and environmental penalties'],
            de: ['Luftemissionen', 'Schadstoffemissionen', 'NOx SOx VOC Feinstaub', 'Emissionen in Wasser', 'Emissionen in den Boden', 'Luftschadstoffe', 'Umweltvorfälle und Leckagen'],
        },
        refs: ['VSME B4 ¶32', 'GRI 305-7', 'GRI 303-4'], vsme: ['AmountOfEmissionToAir', 'AmountOfEmissionToWater', 'AmountOfEmissionToSoil', 'PubliclyAvailableDisclosure'],
        needs: [], needsDocument: { en: 'emissions permit or E-PRTR / regulator reporting', de: 'Emissionsgenehmigung oder Meldung an die Behörde (PRTR)' },
    }),
    // ------------------------------------------------------------------ B5 · biodiversity
    v({
        id: 'vsme.b5.sensitiveArea', topic: 'environment', answerType: 'yesno',
        intent: { en: 'Sites in or near biodiversity-sensitive areas', de: 'Standorte in oder nahe schutzbedürftigen Gebieten (Biodiversität)' },
        variants: { en: ['biodiversity sensitive area', 'protected areas', 'sites near protected areas', 'Natura 2000', 'biodiversity impact of your sites', 'operate in or near areas of high biodiversity value', 'sites near protected or biodiversity-sensitive areas and impact controls'], de: ['schutzbedürftige Gebiete', 'Schutzgebiete', 'Standorte in der Nähe von Schutzgebieten', 'Natura 2000', 'Biodiversität am Standort'] },
        refs: ['VSME B5 ¶33', 'GRI 304-1'], vsme: ['SiteLocatedInABiodiversitySensitiveArea', 'SiteLocatedNearABiodiversitySensitiveArea', 'AreaOfSiteInBiodiversitySensitiveArea'],
        needs: [],
    }),
    v({
        id: 'vsme.b5.landUse', topic: 'environment', answerType: 'number', unit: 'ha',
        intent: { en: 'Land use: total, sealed, nature-oriented area', de: 'Flächenverbrauch: gesamt, versiegelt, naturnah' },
        variants: { en: ['land use', 'total land use', 'sealed area', 'nature-oriented area', 'hectares used', 'land footprint'], de: ['Flächenverbrauch', 'versiegelte Fläche', 'naturnahe Fläche', 'Flächennutzung', 'Hektar'] },
        refs: ['VSME B5 ¶34'], vsme: ['TotalUseOfLand', 'TotalSealedArea', 'TotalNatureOrientedAreaOnSite', 'TotalNatureOrientedAreaOffSite'], needs: [],
    }),
    // ------------------------------------------------------------------ B6 · water
    v({
        id: 'vsme.b6.withdrawal', topic: 'environment', answerType: 'number', unit: 'm³',
        intent: { en: 'Water withdrawal / consumption', de: 'Wasserentnahme / Wasserverbrauch' },
        variants: { en: ['water consumption', 'total water consumption', 'water withdrawal', 'water use in m3', 'how much water', 'water intake', 'freshwater consumption', 'water withdrawal by source and facility', 'water withdrawal by source and operations in areas of high water stress', 'total water withdrawal and consumption', 'water consumption and calculation method', 'water withdrawal in m3 municipal groundwater surface water'], de: ['Wasserverbrauch', 'Wasserentnahme', 'Wasserverbrauch in m³', 'wie viel Wasser', 'Frischwasserverbrauch', 'Wasserentnahme nach Quelle'] },
        refs: ['VSME B6 ¶35', 'GRI 303-3', 'GRI 303-5'], vsme: ['TotalAmountOfWaterWithdrawnFromAllSites', 'TotalWaterConsumption'],
        needs: ['waterM3'], needsDocument: { en: 'water bills for the year', de: 'Wasserrechnungen des Jahres' },
    }),
    v({
        id: 'vsme.b6.waterStress', topic: 'environment', answerType: 'number', unit: 'm³',
        intent: { en: 'Water withdrawn in areas of high water stress', de: 'Wasserentnahme in Gebieten mit hohem Wasserstress' },
        variants: { en: ['water stress', 'water-stressed areas', 'water scarcity', 'sites in areas of high water stress', 'water risk assessment', 'facilities operate in water-stressed regions wri aqueduct', 'facilities in high or extremely high water-stress areas', 'assessed water scarcity water stress at your sites'], de: ['Wasserstress', 'Wasserknappheit', 'Standorte in Gebieten mit Wasserstress', 'Wassermangel', 'Wasserrisiko'] },
        refs: ['VSME B6 ¶35', 'GRI 303-3'], vsme: ['AmountOfWaterWithdrawnAtSitesLocatedInAreasOfHighWaterStress'], needs: ['waterM3', 'country'],
    }),
    v({
        id: 'vsme.b6.discharge', topic: 'environment', answerType: 'number', unit: 'm³',
        intent: { en: 'Water discharge / wastewater from production', de: 'Wasserableitung / Abwasser aus der Produktion' },
        variants: { en: ['wastewater', 'water discharge', 'effluent', 'wastewater treatment', 'how do you manage wastewater discharge', 'discharge permits'], de: ['Abwasser', 'Wasserableitung', 'Abwasserbehandlung', 'Einleitung', 'Abwassermenge'] },
        refs: ['VSME B6 ¶35', 'GRI 303-4'], vsme: ['WaterDischargeFromUndertakingProductionProcesses'], needs: ['wastewaterTreatmentDetails'],
    }),
    // ------------------------------------------------------------------ B7 · resource use, circular economy, waste
    v({
        id: 'vsme.b7.circular', topic: 'environment', answerType: 'yesno',
        intent: { en: 'Circular economy principles applied, and how', de: 'Anwendung von Grundsätzen der Kreislaufwirtschaft' },
        variants: { en: ['circular economy', 'circularity', 'do you apply circular economy principles', 'take-back', 'reuse and repair', 'product reuse', 'closed loop', 'approach to waste minimization product design for durability repairability and recyclability', 'take-back recycling or circularity program for end-of-life products', 'circular economy initiatives take-back programmes design for disassembly material recovery'], de: ['Kreislaufwirtschaft', 'zirkuläre Wirtschaft', 'Rücknahme', 'Wiederverwendung', 'Grundsätze der Kreislaufwirtschaft', 'Rücknahmeprogramm für Altprodukte'] },
        refs: ['VSME B7 ¶36'], vsme: ['UndertakingAppliesCircularEconomyPrinciples', 'DescriptionOfHowCircularEconomyPrinciplesAreApplied'], needs: [],
    }),
    v({
        id: 'vsme.b7.materials', topic: 'environment', answerType: 'number', unit: 'kg',
        intent: { en: 'Materials used by mass / volume, incl. recycled share', de: 'Eingesetzte Materialien nach Masse / Volumen, inkl. Rezyklatanteil' },
        variants: { en: ['raw materials used', 'material consumption', 'annual mass flow of materials', 'recycled content', 'secondary materials', 'virgin material', 'materials by weight', 'recycled or renewable content used in products and packaging', 'total material input by material category and recycled renewable content', 'percentage of products contain recycled content which recycled materials'], de: ['eingesetzte Rohstoffe', 'Materialverbrauch', 'Rezyklatanteil', 'Sekundärrohstoffe', 'Materialien nach Gewicht', 'Primärrohstoffe', 'Materialeinsatz nach Kategorie'] },
        refs: ['VSME B7 ¶37', 'GRI 301-1', 'GRI 301-2'], vsme: ['WeightOfMaterialUsed', 'VolumeOfMaterialUsed', 'TotalMassOfMaterialUsed', 'TotalVolumeOfMaterialUsed', 'NameOfMaterialUsed'],
        needs: ['packagingRecycledContentPercent'],
    }),
    v({
        id: 'vsme.b7.wasteTotal', topic: 'environment', answerType: 'number', unit: 'kg',
        intent: { en: 'Total waste generated', de: 'Gesamtabfallaufkommen' },
        variants: { en: ['total waste', 'waste generated', 'waste volume', 'total waste generated in tonnes', 'how much waste', 'how much waste does your company generate annually', 'total weight of waste generated', 'total waste generated hazardous waste non-hazardous waste', 'hazardous and non-hazardous waste generated by treatment route', 'waste generated in kg or tonnes'], de: ['Gesamtabfall', 'Abfallaufkommen', 'Abfallmenge', 'erzeugter Abfall', 'wie viel Abfall', 'Abfallaufkommen gesamt in Tonnen'] },
        refs: ['VSME B7 ¶38', 'GRI 306-3'], vsme: ['TotalWasteGeneratedMass', 'TotalWasteGeneratedVolume'],
        needs: ['totalWasteKg'], needsDocument: { en: 'waste disposal invoices or manifests', de: 'Entsorgungsrechnungen oder Entsorgungsnachweise' },
    }),
    v({
        id: 'vsme.b7.wasteHazardous', topic: 'environment', answerType: 'number', unit: 'kg',
        intent: { en: 'Hazardous waste generated and how it is handled', de: 'Gefährliche Abfälle und deren Entsorgung' },
        variants: { en: ['hazardous waste', 'hazardous waste generated', 'disposal of hazardous waste', 'licensed carriers manifests', 'special waste', 'dangerous waste', 'do you generate hazardous waste and how much', 'hazardous waste disposal process and manifest controls', 'hazardous-material storage labeling transport and disposal'], de: ['gefährliche Abfälle', 'Sondermüll', 'Entsorgung gefährlicher Abfälle', 'Sonderabfall', 'Entsorgungsnachweis'] },
        refs: ['VSME B7 ¶38', 'GRI 306-3'], vsme: ['TotalHazardousWasteGeneratedMass', 'TotalHazardousWasteGeneratedVolume'],
        needs: ['hazardousWasteKg'], needsDocument: { en: 'hazardous-waste manifests', de: 'Entsorgungsnachweise für gefährliche Abfälle' },
    }),
    v({
        id: 'vsme.b7.wasteRecycled', topic: 'environment', answerType: 'percent', unit: '%',
        intent: { en: 'Waste recycled or reused vs. sent to disposal', de: 'Recycelter / wiederverwendeter Abfall vs. Beseitigung' },
        variants: { en: ['recycling rate', 'waste recycled', 'diversion rate', 'waste diverted from landfill', 'waste sent to landfill', 'how much waste was recycled', 'waste to disposal'], de: ['Recyclingquote', 'recycelter Abfall', 'Abfall zur Beseitigung', 'Deponie', 'wie viel Abfall wurde recycelt', 'Verwertungsquote'] },
        refs: ['VSME B7 ¶38', 'GRI 306-4', 'GRI 306-5'], vsme: ['WasteDivertedToRecycleOrReuseMass', 'WasteDirectedToDisposalMass', 'TotalWasteRecycledReusedAndDirectedToDisposalMass'],
        needs: ['recyclingPercent', 'totalWasteKg'],
    }),
    // ------------------------------------------------------------------ B8 · workforce
    v({
        id: 'vsme.b8.contractType', topic: 'social', answerType: 'number', unit: 'employees',
        intent: { en: 'Employees by contract type (permanent / temporary)', de: 'Beschäftigte nach Vertragsart (unbefristet / befristet)' },
        variants: { en: ['permanent employees', 'temporary employees', 'employees by contract type', 'fixed-term contracts', 'number of temporary workers'], de: ['unbefristet Beschäftigte', 'befristet Beschäftigte', 'Beschäftigte nach Vertragsart', 'Zeitverträge', 'befristete Verträge'] },
        refs: ['VSME B8 ¶39', 'GRI 2-7'], vsme: ['NumberOfPermanentContractEmployees', 'NumberOfTemporaryContractEmployees'], needs: [],
    }),
    v({
        id: 'vsme.b8.gender', topic: 'social', answerType: 'number', unit: 'employees',
        intent: { en: 'Employees by gender', de: 'Beschäftigte nach Geschlecht' },
        variants: { en: ['employees by gender', 'gender breakdown', 'female employees', 'percentage of women', 'gender split of the workforce', 'how many women', 'workforce and management gender representation and equal-opportunity measures', 'gender breakdown of your workforce female male', 'employees fte split by gender'], de: ['Beschäftigte nach Geschlecht', 'Frauenanteil', 'Geschlechterverteilung', 'weibliche Beschäftigte', 'wie viele Frauen', 'Geschlechterverteilung der Belegschaft'] },
        refs: ['VSME B8 ¶39', 'GRI 405-1'], vsme: ['NumberOfFemaleEmployees', 'NumberOfMaleEmployees', 'NumberOfOtherGenderEmployees', 'NumberOfNonReportedGenderEmployees'],
        needs: ['femalePercent', 'employeeCount'], never: ['womenInLeadershipPercent'],
    }),
    v({
        id: 'vsme.b8.byCountry', topic: 'social', answerType: 'list',
        intent: { en: 'Employees by country', de: 'Beschäftigte nach Land' },
        variants: { en: ['employees by country', 'workforce by country', 'headcount per country', 'in which countries are your employees', 'total employees temporary workers and agency workers by country'], de: ['Beschäftigte nach Land', 'Mitarbeitende je Land', 'Personal nach Ländern'] },
        refs: ['VSME B8 ¶39'], vsme: ['NumberOfEmployeesForCountryOfEmploymentContract'], needs: ['operatingCountries', 'country'],
    }),
    v({
        id: 'vsme.b8.turnoverRate', topic: 'social', answerType: 'percent', unit: '%',
        intent: { en: 'Employee turnover rate', de: 'Fluktuationsrate' },
        variants: { en: ['employee turnover rate', 'staff turnover', 'attrition rate', 'attrition', 'turnover of employees'], de: ['Fluktuationsrate', 'Mitarbeiterfluktuation', 'Personalfluktuation', 'Fluktuation'] },
        refs: ['VSME B8 ¶40', 'GRI 401-1'], vsme: ['EmployeeTurnoverRate'],
        needs: ['turnoverRate'], never: ['revenueBand'], needsDocument: { en: 'HR report with leavers and average headcount', de: 'Personalbericht mit Abgängen und durchschnittlicher Belegschaft' },
    }),
    // ------------------------------------------------------------------ B9 · health and safety
    v({
        id: 'vsme.b9.accidents', topic: 'social', answerType: 'number',
        intent: { en: 'Recordable work-related accidents: number and rate', de: 'Meldepflichtige Arbeitsunfälle: Anzahl und Quote' },
        variants: { en: ['accident rate', 'incident rate', 'TRIR', 'LTIR', 'LTIFR', 'recordable injuries', 'lost time incidents', 'number of work-related accidents', 'injury rate', 'occupational accidents', 'work-related injuries and fatalities', 'fatalities lost-time injuries total recordable injuries and hours worked', 'incident injury rate', 'lost time injury frequency rate ltifr', 'total recordable incident rate'], de: ['Unfallquote', 'Arbeitsunfälle', 'Unfallrate', 'meldepflichtige Unfälle', 'Ausfallzeit-Unfälle', 'Verletzungsrate', 'LTIR', 'Arbeitsunfälle und Todesfälle'] },
        refs: ['VSME B9 ¶41', 'GRI 403-9'], vsme: ['NumberOfRecordableWorkRelatedAccidentsInTheReportingPeriod', 'RateOfRecordableWorkRelatedAccidentsInTheReportingPeriod'],
        needs: ['trirRate', 'lostTimeIncidents', 'hoursWorked'], never: ['fatalities'], needsDocument: { en: 'accident log / insurer report', de: 'Unfallbuch / BG-Meldung' },
    }),
    v({
        id: 'vsme.b9.fatalities', topic: 'social', answerType: 'number',
        intent: { en: 'Work-related fatalities', de: 'Arbeitsbedingte Todesfälle' },
        variants: { en: ['fatalities', 'work-related fatalities', 'any fatalities during the reporting period', 'deaths'], de: ['Todesfälle', 'arbeitsbedingte Todesfälle', 'tödliche Arbeitsunfälle'] },
        refs: ['VSME B9 ¶41', 'GRI 403-9'], vsme: ['NumberOfFatalitiesAsAResultOfWorkRelatedInjuriesAndWorkRelatedIllHealth'],
        needs: ['fatalities'], never: ['trirRate', 'lostTimeIncidents'],
    }),
    // ------------------------------------------------------------------ B10 · remuneration, collective bargaining, training
    v({
        id: 'vsme.b10.minimumWage', topic: 'social', answerType: 'yesno',
        intent: { en: 'All employees paid at or above the applicable minimum wage', de: 'Alle Beschäftigten erhalten mindestens den geltenden Mindestlohn' },
        variants: { en: ['minimum wage', 'living wage', 'are all employees paid at least the minimum wage', 'wages comply with legal minimum', 'fair wages', 'adequate wages', 'wages paid meet or exceed the legal minimum wage and overtime compensated at premium rates', 'pay at least the legal minimum wage or industry benchmark wage', 'legal minimum wage and working toward paying a living wage'], de: ['Mindestlohn', 'existenzsichernde Löhne', 'werden alle Beschäftigten mindestens nach Mindestlohn bezahlt', 'angemessene Vergütung', 'faire Löhne', 'gesetzlicher Mindestlohn eingehalten'] },
        refs: ['VSME B10 ¶42', 'GRI 202-1'], vsme: ['EmployeesReceivePayEqualOrAboveMinimumWageDeterminedByNationalLawOrCollectiveAgreement'],
        needs: ['livingWageCompliant'], never: ['employeeCount'],
    }),
    v({
        id: 'vsme.b10.payGap', topic: 'social', answerType: 'percent', unit: '%',
        intent: { en: 'Gender pay gap', de: 'Entgeltgefälle zwischen Frauen und Männern' },
        variants: { en: ['gender pay gap', 'pay gap between female and male employees', 'equal pay', 'pay equity'], de: ['Entgeltlücke', 'Gender Pay Gap', 'Entgeltgefälle', 'Lohngleichheit', 'gleiche Bezahlung'] },
        refs: ['VSME B10 ¶42', 'GRI 405-2'], vsme: ['PercentageGapInPayBetweenFemaleAndMaleEmployees'], needs: [], never: ['femalePercent', 'womenInLeadershipPercent'],
    }),
    v({
        id: 'vsme.b10.collectiveBargaining', topic: 'social', answerType: 'percent', unit: '%',
        intent: { en: 'Employees covered by collective bargaining agreements', de: 'Tarifbindung der Beschäftigten' },
        variants: { en: ['collective bargaining', 'collective agreements', 'percentage of employees covered by collective bargaining', 'union membership', 'works council', 'freedom of association'], de: ['Tarifbindung', 'Tarifvertrag', 'Anteil der Beschäftigten mit Tarifvertrag', 'Betriebsrat', 'Vereinigungsfreiheit', 'Gewerkschaft'] },
        refs: ['VSME B10 ¶42', 'GRI 2-30'], vsme: ['PercentageOfEmployeesCoveredByCollectiveBargainingAgreements'], needs: ['collectiveBargainingPercent'],
    }),
    v({
        id: 'vsme.b10.trainingHours', topic: 'social', answerType: 'number', unit: 'hours/employee',
        intent: { en: 'Average training hours per employee (by gender)', de: 'Durchschnittliche Schulungsstunden je Beschäftigtem (nach Geschlecht)' },
        variants: { en: ['training hours per employee', 'average training hours', 'hours of training', 'training and development', 'employee training programmes', 'how many training hours'], de: ['Schulungsstunden je Mitarbeitendem', 'durchschnittliche Weiterbildungsstunden', 'Trainingsstunden', 'Aus- und Weiterbildung', 'Schulungsprogramme'] },
        refs: ['VSME B10 ¶42', 'GRI 404-1'], vsme: ['AverageNumberOfAnnualTrainingHoursPerMaleEmployee', 'AverageNumberOfAnnualTrainingHoursPerFemaleEmployee'],
        needs: ['trainingHoursPerEmployee'], needsDocument: { en: 'training records', de: 'Schulungsnachweise' },
    }),
    // ------------------------------------------------------------------ B11 · anti-corruption
    v({
        id: 'vsme.b11.convictions', topic: 'governance', answerType: 'number',
        intent: { en: 'Convictions and fines for corruption or bribery', de: 'Verurteilungen und Geldstrafen wegen Korruption oder Bestechung' },
        variants: { en: ['convictions for corruption', 'fines for bribery', 'incidents of corruption', 'bribery or corruption identified', 'anti-corruption violations', 'corruption cases'], de: ['Verurteilungen wegen Korruption', 'Geldstrafen wegen Bestechung', 'Korruptionsfälle', 'Verstöße gegen Antikorruptionsvorschriften', 'Bestechungsfälle'] },
        refs: ['VSME B11 ¶43', 'GRI 205-3'], vsme: ['TotalNumberOfConvictionsForTheViolationOfAntiCorruptionAndAntiBriberyLaws', 'TotalAmountOfFinesForTheViolationOfAnticorruptionAndAntibriberyLaws'],
        needs: ['noSignificantFines'],
    }),
    // ------------------------------------------------------------------ C1 · strategy, business model
    v({
        id: 'vsme.c1.products', topic: 'general', answerType: 'text',
        intent: { en: 'Main products and services', de: 'Wesentliche Produkte und Dienstleistungen' },
        variants: { en: ['main products and services', 'principal products', 'what do you produce', 'products or services offered', 'business model', 'description of business activities', 'main products or services primary markets and customer segments', 'products components materials and services supplied', 'business model including principal products services markets served'], de: ['wesentliche Produkte und Dienstleistungen', 'was stellen Sie her', 'Geschäftsmodell', 'Produkte und Leistungen', 'Geschäftstätigkeit', 'gelieferte Produkte Komponenten und Leistungen'] },
        refs: ['VSME C1 ¶44', 'GRI 2-6'], vsme: ['DescriptionOfSignificantGroupsOfProductsAndOrServicesOffered'], needs: ['productsServices'],
    }),
    v({
        id: 'vsme.c1.markets', topic: 'general', answerType: 'text',
        intent: { en: 'Main markets served and customer types', de: 'Bedeutende Märkte und Kundengruppen' },
        variants: { en: ['markets served', 'target market', 'main markets', 'customer types', 'geographic markets', 'B2B or B2C'], de: ['bediente Märkte', 'Zielmarkt', 'Hauptmärkte', 'Kundengruppen', 'Absatzmärkte'] },
        refs: ['VSME C1 ¶44', 'GRI 2-6'], vsme: ['DescriptionOfSignificantMarketsTheUndertakingOperatesIn'], needs: ['mainMarkets', 'customerTypes'],
    }),
    v({
        id: 'vsme.c1.businessRelationships', topic: 'general', answerType: 'text',
        intent: { en: 'Main business relationships (key suppliers, customers, channels)', de: 'Wesentliche Geschäftsbeziehungen (Lieferanten, Kunden, Vertriebskanäle)' },
        variants: { en: ['key suppliers', 'main business relationships', 'supply chain structure', 'distribution channels', 'main customers', 'number of suppliers'], de: ['wesentliche Geschäftsbeziehungen', 'Hauptlieferanten', 'Lieferkettenstruktur', 'Vertriebskanäle', 'Anzahl der Lieferanten'] },
        refs: ['VSME C1 ¶44', 'GRI 2-6'], vsme: ['DescriptionOfMainBusinessRelationships'], needs: [],
    }),
    v({
        id: 'vsme.c1.strategy', topic: 'governance', answerType: 'text',
        intent: { en: 'Sustainability strategy and its link to the business', de: 'Nachhaltigkeitsstrategie und ihre Verbindung zum Geschäft' },
        variants: { en: ['sustainability strategy', 'ESG strategy', 'how does sustainability influence your strategy', 'key elements of strategy related to sustainability', 'how does climate change influence your business strategy'], de: ['Nachhaltigkeitsstrategie', 'ESG-Strategie', 'wie beeinflusst Nachhaltigkeit Ihre Strategie', 'Kernelemente der Strategie'] },
        refs: ['VSME C1 ¶44'], vsme: ['DescriptionOfKeyElementsOfStrategyThatRelatesToOrAffectsSustainabilityIssues'], needs: ['sustainabilityGoal'],
    }),
    // ------------------------------------------------------------------ C2 · policies detail
    v({
        id: 'vsme.c2.accountability', topic: 'governance', answerType: 'text',
        intent: { en: 'Most senior level accountable for sustainability policies', de: 'Höchste verantwortliche Ebene für Nachhaltigkeitsrichtlinien' },
        variants: { en: ['who is responsible for sustainability', 'senior management responsibility for ESG', 'management person responsible for sustainability', 'highest management level with responsibility for climate', 'accountable for implementation of policies', 'ESG governance structure', 'board oversight of sustainability', 'senior management representation for environmental social ethics or human rights', 'executive accountable for human-rights and environmental due diligence', 'highest governance body reviewing sustainability performance', 'executive oversight incentives and capital allocation supporting climate targets', 'senior management demonstrate commitment to social and environmental responsibility', 'board oversight of climate-related issues', 'management reporting on risk preventive measures corrective actions and grievances', 'corporate governance structure esg oversight'], de: ['wer ist für Nachhaltigkeit verantwortlich', 'Verantwortung der Geschäftsleitung für ESG', 'Nachhaltigkeitsbeauftragter', 'höchste Führungsebene mit Verantwortung', 'ESG-Governance', 'Verantwortung der Geschäftsführung für Nachhaltigkeit', 'Leitungsorgan Nachhaltigkeit Überprüfung'] },
        refs: ['VSME C2 ¶45', 'GRI 2-13', 'SAQ5 1', 'CDP SME'], vsme: ['MostSeniorLevelAccountableForImplementationOfPolicies'], needs: [],
    }),
    v({
        id: 'vsme.c2.policyDescription', topic: 'governance', answerType: 'text',
        intent: { en: 'Description of practices, policies and future initiatives', de: 'Beschreibung von Verfahrensweisen, Richtlinien und künftigen Initiativen' },
        variants: { en: ['describe your sustainability policies', 'describe your approach', 'overall approach to sustainability', 'sustainability management approach', 'future initiatives', 'continuous improvement processes to enhance environmental and social performance'], de: ['beschreiben Sie Ihre Nachhaltigkeitsrichtlinien', 'beschreiben Sie Ihren Ansatz', 'Nachhaltigkeitsmanagement', 'künftige Initiativen', 'kontinuierliche Verbesserung der Nachhaltigkeitsleistung'] },
        refs: ['VSME C2 ¶45'], vsme: ['DescriptionOfPracticesPoliciesAndOrFutureInitiatives'], needs: ['policies'],
    }),
    // ------------------------------------------------------------------ C3 · GHG targets and transition
    v({
        id: 'vsme.c3.ghgTargets', topic: 'environment', answerType: 'yesno',
        intent: { en: 'GHG reduction targets (base year, target year, value)', de: 'Ziele zur Verringerung der Treibhausgasemissionen (Basisjahr, Zieljahr, Wert)' },
        variants: { en: ['GHG reduction targets', 'emission reduction target', 'do you set greenhouse gas reduction targets', 'carbon reduction target', 'net zero target', 'climate targets', 'target year and base year', 'policy or commitment to reduce greenhouse gas emissions targets and timeline', 'targets for reducing greenhouse gas emissions and timelines', 'climate targets or a decarbonization plan', 'science-based emissions reduction targets and decarbonization roadmap', 'active emissions-reduction targets base years target years scopes covered and progress', 'approved near-term emissions targets scopes base year target year and reduction pathway', 'net-zero commitment gross reductions neutralization and offsets', 'progress against each active climate target'], de: ['THG-Reduktionsziele', 'Emissionsminderungsziel', 'haben Sie Klimaziele', 'Netto-Null-Ziel', 'CO2-Reduktionsziel', 'Basisjahr und Zieljahr', 'Klimaziele und Dekarbonisierungsplan', 'Fortschritt bei den Klimazielen'] },
        refs: ['VSME C3 ¶46', 'GRI 305-5', 'CDP SME', 'SAQ5 15'], vsme: ['GreenhouseGasEmissionReductionTargetBaseYear', 'GreenhouseGasEmissionReductionTargetYear'],
        needs: ['sustainabilityGoal'], never: ['scope1Tco2e', 'scope2Tco2e'],
    }),
    v({
        id: 'vsme.c3.transitionPlan', topic: 'environment', answerType: 'text',
        intent: { en: 'Climate transition plan and main reduction actions', de: 'Klima-Übergangsplan und wesentliche Reduktionsmaßnahmen' },
        variants: { en: ['transition plan', 'decarbonisation roadmap', 'climate action plan', 'actions to reduce emissions', 'emission reduction measures', 'how will you achieve your targets', 'measures implemented to reduce greenhouse gas emissions across operations and product lifecycle', 'transition plan to a low-carbon economy'], de: ['Übergangsplan', 'Dekarbonisierungsfahrplan', 'Klimaschutzmaßnahmen', 'Maßnahmen zur Emissionsminderung', 'wie erreichen Sie Ihre Ziele', 'Maßnahmen zur Senkung der Treibhausgasemissionen'] },
        refs: ['VSME C3 ¶47'], vsme: ['DescriptionOfATransitionPlanForClimateChangeMitigationIncludingAnExplanationOfHowItIsContributingToReduceGhgEmissions', 'DisclosureOfListOfMainActionsTheEntitySeeksInOrderToAchieveItsTargets'],
        needs: ['energySavingsKwh', 'transportReductionMeasures'],
    }),
    // ------------------------------------------------------------------ C4 · climate risks
    v({
        id: 'vsme.c4.climateRisks', topic: 'environment', answerType: 'text',
        intent: { en: 'Climate-related risks, hazards and adaptation', de: 'Klimabedingte Risiken, Gefahren und Anpassung' },
        variants: { en: ['climate-related risks', 'climate risk assessment', 'physical and transition risks', 'climate hazards', 'climate change adaptation', 'how could climate change affect your business', 'scenario analysis 1.5c 2c', 'climate-related risks with substantive financial impact', 'climate-related opportunities'], de: ['klimabedingte Risiken', 'Klimarisikoanalyse', 'physische und transitorische Risiken', 'Anpassung an den Klimawandel', 'wie könnte der Klimawandel Ihr Geschäft beeinflussen', 'Szenarioanalyse'] },
        refs: ['VSME C4 ¶48', 'CDP SME'], vsme: ['DescriptionOfClimateRelatedHazardsAndClimateRelatedTransitionEvents', 'DisclosureOfWhetherItHasUndertakenClimateChangeAdaptationActionsForAnyClimateRelatedHazardsAndTransitionEvents', 'PotentialAdverseEffectsOfClimateRisksThatMayAffectItsFinancialPerformanceOrBusinessOperationsInTheShortMediumOrLongTermIndicatingWhetherItAssessesTheRisksToBeHighMediumOrLow'],
        needs: [],
    }),
    // ------------------------------------------------------------------ C5 · additional workforce
    v({
        id: 'vsme.c5.nonEmployees', topic: 'social', answerType: 'number',
        intent: { en: 'Non-employee workers: self-employed and agency temps', de: 'Nicht angestellte Arbeitskräfte: Selbstständige und Zeitarbeitskräfte' },
        variants: { en: ['agency workers', 'temporary agency workers', 'contract workers', 'self-employed contractors', 'non-employee workers', 'are agency and contract workers treated the same as permanent employees'], de: ['Zeitarbeitskräfte', 'Leiharbeit', 'Fremdpersonal', 'Selbstständige', 'freie Mitarbeiter', 'Gleichbehandlung von Zeitarbeitskräften'] },
        refs: ['VSME C5 ¶49', 'GRI 2-8'], vsme: ['TotalNumberOfSelfEmployedWorkersWithoutPersonnelThatAreWorkingExclusivelyForTheUndertaking', 'TotalNumberOfTemporaryWorkersProvidedByUndertakingsPrimarilyEngagedInEmploymentActivities'],
        needs: [], never: ['employeeCount', 'femalePercent', 'collectiveBargainingPercent'],
    }),
    v({
        id: 'vsme.c5.womenInManagement', topic: 'social', answerType: 'percent', unit: '%',
        intent: { en: 'Women in management positions', de: 'Frauenanteil in Führungspositionen' },
        variants: { en: ['women in leadership', 'women in management', 'female-to-male ratio at management level', 'percentage of women in senior positions', 'gender diversity in management'], de: ['Frauenanteil in Führungspositionen', 'Frauen in Führung', 'Führungskräfte nach Geschlecht', 'Verhältnis Frauen zu Männern auf Führungsebene'] },
        refs: ['VSME C5 ¶49', 'GRI 405-1'], vsme: ['FemaleToMaleRatioAtManagementLevelForTheReportingPeriod'],
        needs: ['womenInLeadershipPercent'], never: ['femalePercent'],
    }),
    // ------------------------------------------------------------------ C6 · human rights policies
    v({
        id: 'vsme.c6.humanRightsPolicy', topic: 'social', answerType: 'yesno',
        intent: { en: 'Code of conduct or human rights policy for the own workforce, and what it covers', de: 'Verhaltenskodex oder Menschenrechtsrichtlinie für die eigene Belegschaft und deren Inhalte' },
        variants: { en: ['human rights policy', 'formal policy covering working conditions and human rights', 'policy on labour rights', 'child labour forced labour discrimination policy', 'human rights commitment', 'which areas are covered by your human rights policy', 'policies addressing child labor forced labor and freedom of association', 'policies on human rights child labor and forced labor', 'comply with ilo core labor standards and fair working conditions', 'labor and human rights policy approved by executive management', 'human-rights and responsible-sourcing policy approval and review dates', 'formal human rights policy covering forced labor child labor and freedom of association'], de: ['Menschenrechtsrichtlinie', 'Richtlinie zu Arbeitsbedingungen und Menschenrechten', 'Grundsatzerklärung Menschenrechte', 'Kinderarbeit Zwangsarbeit Diskriminierung', 'welche Bereiche deckt Ihre Menschenrechtsrichtlinie ab', 'Richtlinien zu Kinderarbeit Zwangsarbeit und Vereinigungsfreiheit'] },
        refs: ['VSME C6 ¶50', 'GRI 2-23', 'SAQ5 5', 'SAQ5 5a'], vsme: ['UndertakingHasACodeOfConductOrHumanRightsPolicyForItsOwnWorkforce', 'TypeOfContentCoveredByTheCodeOfConductOrHumanRightsPolicyForItsOwnWorkforce', 'SpecificationOfOtherTypesOfContentCoveredByTheCodeOfConductOrHumanRightsPolicy'],
        needs: ['humanRightsPolicyStatus', 'codeOfConductStatus', 'policies'], never: ['employeeCount', 'country'], needsDocument: { en: 'the human rights policy or code of conduct', de: 'die Menschenrechtsrichtlinie oder den Verhaltenskodex' },
    }),
    v({
        id: 'vsme.c6.complaints', topic: 'social', answerType: 'yesno',
        intent: { en: 'Complaint / grievance mechanism for the own workforce', de: 'Beschwerdemechanismus für die eigene Belegschaft' },
        variants: { en: ['grievance mechanism', 'complaints procedure', 'whistleblowing channel', 'whistleblower hotline', 'complaint handling mechanism', 'can employees raise concerns', 'speak-up channel', 'confidential grievance or whistleblowing mechanism available to all workers and external stakeholders', 'grievance mechanism or whistleblowing channel available to all employees', 'worker grievance channels non-retaliation safeguards cases received and resolution tracking', 'confidential reporting channels investigation governance and protection from retaliation', 'grievance channels available to employees supplier workers and external stakeholders', 'how do employees report concerns', 'whistleblower or grievance mechanism for reporting compliance violations'], de: ['Beschwerdemechanismus', 'Beschwerdeverfahren', 'Hinweisgebersystem', 'Whistleblowing-Kanal', 'Hinweisgeberkanal', 'können Beschäftigte Bedenken melden', 'vertraulicher Beschwerdemechanismus für alle Beschäftigten'] },
        refs: ['VSME C6 ¶50', 'GRI 2-26', 'SAQ5 4'], vsme: ['UndertakingHasAComplaintHandlingMechanismForItsOwnWorkforce'],
        needs: ['grievanceMechanismExists', 'grievancesReported', 'policies'], never: ['employeeCount'],
    }),
    // ------------------------------------------------------------------ C7 · human rights incidents
    v({
        id: 'vsme.c7.incidents', topic: 'social', answerType: 'yesno',
        intent: { en: 'Confirmed human rights incidents (own workforce, value chain) and actions taken', de: 'Bestätigte Menschenrechtsvorfälle (eigene Belegschaft, Wertschöpfungskette) und Maßnahmen' },
        variants: { en: ['human rights incidents', 'confirmed incidents', 'human rights violations', 'incidents of discrimination', 'child labour or forced labour incidents', 'grievances reported', 'number of complaints received'], de: ['Menschenrechtsvorfälle', 'bestätigte Vorfälle', 'Menschenrechtsverletzungen', 'Diskriminierungsfälle', 'gemeldete Beschwerden', 'Anzahl der Beschwerden'] },
        refs: ['VSME C7 ¶51', 'GRI 406-1'], vsme: ['UndertakingHasConfirmedHumanRightsIncidentsInItsOwnWorkforce', 'UndertakingIsAwareOfAnyConfirmedIncidentsInvolvingWorkersInTheValueChainAffectedCommunitiesConsumersAndEndUsers', 'DescriptionOfActionsTakeToAddressTheConfirmedIncidents'],
        needs: ['grievancesReported'],
    }),
    // ------------------------------------------------------------------ C8 · controversial revenues
    v({
        id: 'vsme.c8.controversialRevenue', topic: 'governance', answerType: 'money', unit: 'EUR',
        intent: { en: 'Revenue from controversial sectors (weapons, fossil fuels, tobacco, chemicals)', de: 'Umsatzerlöse aus umstrittenen Sektoren (Waffen, fossile Brennstoffe, Tabak, Chemikalien)' },
        variants: { en: ['revenue from controversial weapons', 'fossil fuel revenue', 'revenue from coal oil or gas', 'tobacco revenue', 'excluded from Paris-aligned benchmarks', 'controversial activities', 'sensitive sectors'], de: ['Umsatz aus umstrittenen Waffen', 'Umsatz aus fossilen Brennstoffen', 'Kohle Öl Gas Umsatz', 'Tabak', 'kontroverse Geschäftsfelder', 'sensible Sektoren'] },
        refs: ['VSME C8 ¶52', 'SFDR PAI 14'], vsme: ['RevenueDerivedFromControversialWeaponsAntiPersonnelMinesClusterMunitionsChemicalWeaponsAndBiologicalWeapons', 'TotalRevenuesDerivedFromFossilFuelCoalOilAndGasSector', 'RevenueDerivedFromCultivationAndProductionOfTobacco', 'RevenueDerivedFromChemicalProduction', 'UndertakingsAreExcludedFromAnyEuReferenceBenchmarksThatAreAlignedWithTheParisAgreement'],
        needs: ['industry'],
    }),
    // ------------------------------------------------------------------ C9 · governance body
    v({
        id: 'vsme.c9.boardDiversity', topic: 'governance', answerType: 'percent', unit: '%',
        intent: { en: 'Gender diversity of the governance body / board', de: 'Geschlechtervielfalt im Leitungsorgan' },
        variants: { en: ['board diversity', 'gender diversity ratio in governance body', 'women on the board', 'composition of the board', 'management board gender'], de: ['Geschlechtervielfalt im Leitungsorgan', 'Frauen im Vorstand', 'Zusammensetzung der Geschäftsführung', 'Diversität im Aufsichtsrat'] },
        refs: ['VSME C9 ¶53', 'GRI 405-1'], vsme: ['GenderDiversityRatioInGovernanceBody'], needs: [], never: ['femalePercent', 'womenInLeadershipPercent'],
    }),
];
//# sourceMappingURL=vsme.js.map
const SUPPORTED = new Set(['en', 'de', 'pl', 'fr', 'es', 'it', 'nl']);

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pl', label: 'Polski' },
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'es', label: 'Espa\u00f1ol' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
];

function norm(lang) {
  const base = String(lang || 'en').toLowerCase().split('-')[0];
  return SUPPORTED.has(base) ? base : 'en';
}

function pick(lang, values) {
  return values[lang] || values.en;
}

const RULES = [
  {
    regex: /Our total electricity consumption was ([\d.,\s]+) kWh during the reporting period\./g,
    replace: (lang, kwh) => pick(lang, {
      de: `Unser gesamter Stromverbrauch betrug im Berichtszeitraum ${kwh} kWh.`,
      pl: `Nasze ca\u0142kowite zu\u017cycie energii elektrycznej w okresie sprawozdawczym wynios\u0142o ${kwh} kWh.`,
      fr: `Notre consommation totale d'\u00e9lectricit\u00e9 sur la p\u00e9riode de reporting s'est \u00e9lev\u00e9e \u00e0 ${kwh} kWh.`,
      es: `Nuestro consumo total de electricidad durante el per\u00edodo de reporte fue de ${kwh} kWh.`,
      it: `Il nostro consumo totale di elettricit\u00e0 nel periodo di rendicontazione \u00e8 stato di ${kwh} kWh.`,
      nl: `Ons totale elektriciteitsverbruik bedroeg in de verslagperiode ${kwh} kWh.`,
    }),
  },
  {
    regex: /Our total electricity consumption was ([\d.,\s]+) kWh during (.+?)\./g,
    replace: (lang, kwh, period) => pick(lang, {
      de: `Unser gesamter Stromverbrauch betrug ${kwh} kWh im ${period}.`,
      pl: `Nasze ca\u0142kowite zu\u017cycie energii elektrycznej wynios\u0142o ${kwh} kWh w okresie ${period}.`,
      fr: `Notre consommation totale d'\u00e9lectricit\u00e9 s'est \u00e9lev\u00e9e \u00e0 ${kwh} kWh pendant ${period}.`,
      es: `Nuestro consumo total de electricidad fue de ${kwh} kWh durante ${period}.`,
      it: `Il nostro consumo totale di elettricit\u00e0 \u00e8 stato di ${kwh} kWh durante ${period}.`,
      nl: `Ons totale elektriciteitsverbruik bedroeg ${kwh} kWh gedurende ${period}.`,
    }),
  },
  {
    regex: /Of this, ([\d.,\s]+)% \(([\d.,\s]+) kWh\) was sourced from renewable energy\./g,
    replace: (lang, pct, kwh) => pick(lang, {
      de: `Davon stammten ${pct}% (${kwh} kWh) aus erneuerbaren Energiequellen.`,
      pl: `Z tego ${pct}% (${kwh} kWh) pochodzi\u0142o z energii odnawialnej.`,
      fr: `Sur ce total, ${pct}% (${kwh} kWh) provenaient d'\u00e9nergie renouvelable.`,
      es: `De ese total, el ${pct}% (${kwh} kWh) proced\u00eda de energ\u00eda renovable.`,
      it: `Di questo totale, il ${pct}% (${kwh} kWh) proveniva da energia rinnovabile.`,
      nl: `Daarvan was ${pct}% (${kwh} kWh) afkomstig uit hernieuwbare energie.`,
    }),
  },
  {
    regex: /Renewable electricity accounted for ([\d.,\s]+)% of consumption\./g,
    replace: (lang, pct) => pick(lang, {
      de: `Erneuerbarer Strom machte ${pct}% des Verbrauchs aus.`,
      pl: `Energia elektryczna ze źródeł odnawialnych stanowiła ${pct}% zużycia.`,
      fr: `L'électricité renouvelable représentait ${pct}% de la consommation.`,
      es: `La electricidad renovable representó el ${pct}% del consumo.`,
      it: `L'elettricità rinnovabile ha rappresentato il ${pct}% del consumo.`,
      nl: `Hernieuwbare elektriciteit was goed voor ${pct}% van het verbruik.`,
    }),
  },
  {
    regex: /([\d.,\s]+)% of our electricity for (?:the reporting period|(.+?)) was sourced from renewable energy\./g,
    replace: (lang, pct, period) => pick(lang, {
      de: `${pct}% unseres Stromverbrauchs ${period ? `im ${period}` : 'im Berichtszeitraum'} stammten aus erneuerbaren Energiequellen.`,
      pl: `${pct}% naszej energii elektrycznej ${period ? `w okresie ${period}` : 'w okresie sprawozdawczym'} pochodzi\u0142o z energii odnawialnej.`,
      fr: `${pct}% de notre \u00e9lectricit\u00e9 ${period ? `pour ${period}` : 'sur la p\u00e9riode de reporting'} provenaient d'\u00e9nergie renouvelable.`,
      es: `El ${pct}% de nuestra electricidad ${period ? `durante ${period}` : 'durante el per\u00edodo de reporte'} proced\u00eda de energ\u00eda renovable.`,
      it: `Il ${pct}% della nostra elettricit\u00e0 ${period ? `durante ${period}` : 'nel periodo di rendicontazione'} proveniva da energia rinnovabile.`,
      nl: `${pct}% van onze elektriciteit ${period ? `in ${period}` : 'in de verslagperiode'} was afkomstig uit hernieuwbare energie.`,
    }),
  },
  {
    regex: /Our greenhouse gas \(GHG\) emissions for (?:the reporting period|(.+?)) are as follows:/g,
    replace: (lang, period) => pick(lang, {
      de: `Unsere Treibhausgasemissionen (THG) ${period ? `f\u00fcr ${period}` : 'f\u00fcr den Berichtszeitraum'} sind wie folgt:`,
      pl: `Nasze emisje gaz\u00f3w cieplarnianych (GHG) ${period ? `za ${period}` : 'za okres sprawozdawczy'} przedstawiaj\u0105 si\u0119 nast\u0119puj\u0105co:`,
      fr: `Nos \u00e9missions de gaz \u00e0 effet de serre (GES) ${period ? `pour ${period}` : 'pour la p\u00e9riode de reporting'} sont les suivantes :`,
      es: `Nuestras emisiones de gases de efecto invernadero (GEI) ${period ? `para ${period}` : 'para el per\u00edodo de reporte'} son las siguientes:`,
      it: `Le nostre emissioni di gas a effetto serra (GHG) ${period ? `per ${period}` : 'per il periodo di rendicontazione'} sono le seguenti:`,
      nl: `Onze broeikasgasemissies (GHG) ${period ? `voor ${period}` : 'voor de verslagperiode'} zijn als volgt:`,
    }),
  },
  {
    regex: /Scope 1 \(direct\) emissions: ([\d.,\s]+) tCO2e, covering stationary combustion, mobile sources, and any fugitive emissions\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope-1-Emissionen (direkt): ${value} tCO2e, einschlie\u00dflich station\u00e4rer Verbrennung, mobiler Quellen und etwaiger diffuser Emissionen.`,
      pl: `Emisje Scope 1 (bezpo\u015brednie): ${value} tCO2e, obejmuj\u0105ce spalanie stacjonarne, \u017ar\u00f3d\u0142a mobilne oraz ewentualne emisje ulotne.`,
      fr: `\u00c9missions de scope 1 (directes) : ${value} tCO2e, couvrant la combustion fixe, les sources mobiles et toute \u00e9mission fugitive.`,
      es: `Emisiones de alcance 1 (directas): ${value} tCO2e, que cubren combusti\u00f3n estacionaria, fuentes m\u00f3viles y cualquier emisi\u00f3n fugitiva.`,
      it: `Emissioni Scope 1 (dirette): ${value} tCO2e, comprensive di combustione stazionaria, fonti mobili ed eventuali emissioni fuggitive.`,
      nl: `Scope 1-emissies (direct): ${value} tCO2e, inclusief stationaire verbranding, mobiele bronnen en eventuele diffuse emissies.`,
    }),
  },
  {
    regex: /Scope 2 \(indirect, location-based\) emissions: ([\d.,\s]+) tCO2e from purchased electricity\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope-2-Emissionen (indirekt, standortbasiert): ${value} tCO2e aus eingekauftem Strom.`,
      pl: `Emisje Scope 2 (po\u015brednie, location-based): ${value} tCO2e z zakupionej energii elektrycznej.`,
      fr: `\u00c9missions de scope 2 (indirectes, bas\u00e9es sur la localisation) : ${value} tCO2e provenant de l'\u00e9lectricit\u00e9 achet\u00e9e.`,
      es: `Emisiones de alcance 2 (indirectas, basadas en ubicaci\u00f3n): ${value} tCO2e procedentes de electricidad adquirida.`,
      it: `Emissioni Scope 2 (indirette, location-based): ${value} tCO2e da elettricit\u00e0 acquistata.`,
      nl: `Scope 2-emissies (indirect, locatiegebaseerd): ${value} tCO2e uit ingekochte elektriciteit.`,
    }),
  },
  {
    regex: /Scope 2 \(market-based\) emissions: ([\d.,\s]+) tCO2e, reflecting our renewable energy procurement(?: strategy)?\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope-2-Emissionen (marktbasiert): ${value} tCO2e und spiegeln unsere Beschaffung erneuerbarer Energie wider.`,
      pl: `Emisje Scope 2 (market-based): ${value} tCO2e, odzwierciedlaj\u0105ce nasz\u0105 strategi\u0119 zakupu energii odnawialnej.`,
      fr: `\u00c9missions de scope 2 (market-based) : ${value} tCO2e, refl\u00e9tant notre approvisionnement en \u00e9nergie renouvelable.`,
      es: `Emisiones de alcance 2 (market-based): ${value} tCO2e, que reflejan nuestra estrategia de compra de energ\u00eda renovable.`,
      it: `Emissioni Scope 2 (market-based): ${value} tCO2e, che riflettono il nostro approvvigionamento di energia rinnovabile.`,
      nl: `Scope 2-emissies (market-based): ${value} tCO2e, in lijn met onze inkoop van hernieuwbare energie.`,
    }),
  },
  {
    regex: /Our Scope 2 \(indirect\) greenhouse gas emissions from purchased electricity for (?:the reporting period|(.+?)):/g,
    replace: (lang, period) => pick(lang, {
      de: `Unsere Scope-2-Treibhausgasemissionen (indirekt) aus eingekauftem Strom ${period ? `f\u00fcr ${period}` : 'f\u00fcr den Berichtszeitraum'}:`,
      pl: `Nasze emisje gaz\u00f3w cieplarnianych Scope 2 (po\u015brednie) z zakupionej energii elektrycznej ${period ? `za ${period}` : 'za okres sprawozdawczy'}:`,
      fr: `Nos \u00e9missions de gaz \u00e0 effet de serre de scope 2 (indirectes) li\u00e9es \u00e0 l'\u00e9lectricit\u00e9 achet\u00e9e ${period ? `pour ${period}` : 'pour la p\u00e9riode de reporting'} :`,
      es: `Nuestras emisiones de GEI de alcance 2 (indirectas) por electricidad adquirida ${period ? `para ${period}` : 'para el per\u00edodo de reporte'}:`,
      it: `Le nostre emissioni di gas serra Scope 2 (indirette) da elettricit\u00e0 acquistata ${period ? `per ${period}` : 'per il periodo di rendicontazione'}:`,
      nl: `Onze scope 2-broeikasgasemissies (indirect) uit ingekochte elektriciteit ${period ? `voor ${period}` : 'voor de verslagperiode'}:`,
    }),
  },
  {
    regex: /Location-based: ([\d.,\s]+) tCO2e\./g,
    replace: (lang, value) => pick(lang, {
      de: `Standortbasiert: ${value} tCO2e.`,
      pl: `Location-based: ${value} tCO2e.`,
      fr: `Selon l'approche bas\u00e9e sur la localisation : ${value} tCO2e.`,
      es: `Basado en ubicaci\u00f3n: ${value} tCO2e.`,
      it: `Location-based: ${value} tCO2e.`,
      nl: `Locatiegebaseerd: ${value} tCO2e.`,
    }),
  },
  {
    regex: /These emissions result from ([\d.,\s]+) kWh of purchased electricity\./g,
    replace: (lang, value) => pick(lang, {
      de: `Diese Emissionen resultieren aus ${value} kWh eingekauftem Strom.`,
      pl: `Emisje te wynikaj\u0105 z ${value} kWh zakupionej energii elektrycznej.`,
      fr: `Ces \u00e9missions r\u00e9sultent de ${value} kWh d'\u00e9lectricit\u00e9 achet\u00e9e.`,
      es: `Estas emisiones resultan de ${value} kWh de electricidad adquirida.`,
      it: `Queste emissioni derivano da ${value} kWh di elettricit\u00e0 acquistata.`,
      nl: `Deze emissies zijn het gevolg van ${value} kWh ingekochte elektriciteit.`,
    }),
  },
  {
    regex: /Note: Scope 2 figures are calculated using country-level grid emission factors applied to our electricity consumption data\./g,
    replace: (lang) => pick(lang, {
      de: `Hinweis: Die Scope-2-Werte werden mithilfe l\u00e4nderspezifischer Netz-Emissionsfaktoren berechnet, die auf unsere Stromverbrauchsdaten angewendet werden.`,
      pl: `Uwaga: warto\u015bci Scope 2 s\u0105 obliczane z wykorzystaniem krajowych wska\u017anik\u00f3w emisyjno\u015bci sieci zastosowanych do naszych danych o zu\u017cyciu energii elektrycznej.`,
      fr: `Remarque : les valeurs de scope 2 sont calcul\u00e9es \u00e0 l'aide de facteurs d'\u00e9mission du r\u00e9seau au niveau national appliqu\u00e9s \u00e0 nos donn\u00e9es de consommation d'\u00e9lectricit\u00e9.`,
      es: `Nota: las cifras de alcance 2 se calculan mediante factores de emisi\u00f3n de red a nivel pa\u00eds aplicados a nuestros datos de consumo el\u00e9ctrico.`,
      it: `Nota: i valori Scope 2 sono calcolati utilizzando fattori di emissione della rete a livello nazionale applicati ai nostri dati di consumo elettrico.`,
      nl: `Opmerking: de scope 2-cijfers worden berekend met landspecifieke netemissiefactoren die zijn toegepast op onze elektriciteitsverbruiksgegevens.`,
    }),
  },
  {
    regex: /Note: Some figures are estimates derived from activity data \(fuel consumption, electricity use\) and standard emission factors\./g,
    replace: (lang) => pick(lang, {
      de: `Hinweis: Einige Werte sind Sch\u00e4tzungen auf Basis von Aktivit\u00e4tsdaten (Kraftstoffverbrauch, Stromverbrauch) und Standard-Emissionsfaktoren.`,
      pl: `Uwaga: cz\u0119\u015b\u0107 warto\u015bci to szacunki oparte na danych o aktywno\u015bci (zu\u017cycie paliwa, zu\u017cycie energii elektrycznej) oraz standardowych wsp\u00f3\u0142czynnikach emisji.`,
      fr: `Remarque : certaines valeurs sont des estimations d\u00e9riv\u00e9es de donn\u00e9es d'activit\u00e9 (consommation de carburant, consommation d'\u00e9lectricit\u00e9) et de facteurs d'\u00e9mission standard.`,
      es: `Nota: algunas cifras son estimaciones derivadas de datos de actividad (consumo de combustible, uso de electricidad) y factores de emisi\u00f3n est\u00e1ndar.`,
      it: `Nota: alcuni valori sono stime derivate da dati di attivit\u00e0 (consumo di carburante, uso di elettricit\u00e0) e fattori di emissione standard.`,
      nl: `Opmerking: sommige cijfers zijn schattingen op basis van activiteitsdata (brandstofverbruik, elektriciteitsverbruik) en standaardemissiefactoren.`,
    }),
  },
  {
    regex: /We are working to improve the granularity of our GHG inventory\./g,
    replace: (lang) => pick(lang, {
      de: `Wir arbeiten daran, die Granularität unseres THG-Inventars zu verbessern.`,
      pl: `Pracujemy nad poprawą szczegółowości naszego inwentarza emisji GHG.`,
      fr: `Nous travaillons à améliorer le niveau de détail de notre inventaire des GES.`,
      es: `Estamos trabajando para mejorar la granularidad de nuestro inventario de GEI.`,
      it: `Stiamo lavorando per migliorare il livello di dettaglio del nostro inventario dei gas serra.`,
      nl: `Wij werken eraan de detaillering van onze broeikasgasinventaris te verbeteren.`,
    }),
  },
  {
    regex: /Total Scope 1 \+ Scope 2 \(location-based\): ([\d.,\s]+) tCO2e\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope 1 + Scope 2 insgesamt (standortbasiert): ${value} tCO2e.`,
      pl: `\u0141\u0105cznie Scope 1 + Scope 2 (location-based): ${value} tCO2e.`,
      fr: `Total scope 1 + scope 2 (bas\u00e9 sur la localisation) : ${value} tCO2e.`,
      es: `Total alcance 1 + alcance 2 (basado en ubicaci\u00f3n): ${value} tCO2e.`,
      it: `Totale Scope 1 + Scope 2 (location-based): ${value} tCO2e.`,
      nl: `Totaal scope 1 + scope 2 (locatiegebaseerd): ${value} tCO2e.`,
    }),
  },
  {
    regex: /Yes, we measure Scope 3 emissions\. Our Scope 3 \(value chain\) emissions(?: for (.+?)| for the reporting period)? total ([\d.,\s]+) tCO2e\./g,
    replace: (lang, period, value) => pick(lang, {
      de: `Ja, wir erfassen Scope-3-Emissionen. Unsere Scope-3-Emissionen (Wertsch\u00f6pfungskette)${period ? ` f\u00fcr ${period}` : ' f\u00fcr den Berichtszeitraum'} betragen insgesamt ${value} tCO2e.`,
      pl: `Tak, mierzymy emisje Scope 3. Nasze emisje Scope 3 (\u0142a\u0144cuch warto\u015bci)${period ? ` za ${period}` : ' za okres sprawozdawczy'} wynosz\u0105 \u0142\u0105cznie ${value} tCO2e.`,
      fr: `Oui, nous mesurons les \u00e9missions de scope 3. Nos \u00e9missions de scope 3 (cha\u00eene de valeur)${period ? ` pour ${period}` : ' pour la p\u00e9riode de reporting'} totalisent ${value} tCO2e.`,
      es: `S\u00ed, medimos las emisiones de alcance 3. Nuestras emisiones de alcance 3 (cadena de valor)${period ? ` para ${period}` : ' para el per\u00edodo de reporte'} ascienden a ${value} tCO2e.`,
      it: `S\u00ec, misuriamo le emissioni Scope 3. Le nostre emissioni Scope 3 (catena del valore)${period ? ` per ${period}` : ' per il periodo di rendicontazione'} ammontano a ${value} tCO2e.`,
      nl: `Ja, wij meten scope 3-emissies. Onze scope 3-emissies (waardeketen)${period ? ` voor ${period}` : ' voor de verslagperiode'} bedragen in totaal ${value} tCO2e.`,
    }),
  },
  {
    regex: /Scope 3 emissions have not been measured or reported\./g,
    replace: (lang) => pick(lang, {
      de: `Scope-3-Emissionen wurden bisher weder gemessen noch berichtet.`,
      pl: `Emisje Scope 3 nie by\u0142y dotychczas mierzone ani raportowane.`,
      fr: `Les \u00e9missions de scope 3 n'ont pas encore \u00e9t\u00e9 mesur\u00e9es ni publi\u00e9es.`,
      es: `Las emisiones de alcance 3 no se han medido ni reportado hasta la fecha.`,
      it: `Le emissioni Scope 3 non sono ancora state misurate n\u00e9 rendicontate.`,
      nl: `Scope 3-emissies zijn nog niet gemeten of gerapporteerd.`,
    }),
  },
  {
    regex: /Business travel: ([\d.,\s]+) km\./g,
    replace: (lang, value) => pick(lang, {
      de: `Gesch\u00e4ftsreisen: ${value} km.`,
      pl: `Podr\u00f3\u017ce s\u0142u\u017cbowe: ${value} km.`,
      fr: `D\u00e9placements professionnels : ${value} km.`,
      es: `Viajes de negocios: ${value} km.`,
      it: `Viaggi di lavoro: ${value} km.`,
      nl: `Zakelijke reizen: ${value} km.`,
    }),
  },
  {
    regex: /Employee commuting: ([\d.,\s]+) km\./g,
    replace: (lang, value) => pick(lang, {
      de: `Pendelverkehr der Besch\u00e4ftigten: ${value} km.`,
      pl: `Dojazdy pracownik\u00f3w: ${value} km.`,
      fr: `Trajets domicile-travail des salari\u00e9s : ${value} km.`,
      es: `Desplazamientos de empleados: ${value} km.`,
      it: `Spostamenti casa-lavoro dei dipendenti: ${value} km.`,
      nl: `Woon-werkverkeer van medewerkers: ${value} km.`,
    }),
  },  {
    regex: /As of (.+?), our organization employs ([\d.,\s]+) full-time equivalent \(FTE\) employees(?: across ([\d.,\s]+) operational sites)?(?:, headquartered in (.+?))?\./g,
    replace: (lang, period, fte, sites, country) => {
      const sitePart = sites ? pick(lang, {
        de: ` an ${sites} Standorten`,
        pl: ` w ${sites} lokalizacjach operacyjnych`,
        fr: ` sur ${sites} sites op\u00e9rationnels`,
        es: ` en ${sites} centros operativos`,
        it: ` in ${sites} siti operativi`,
        nl: ` verspreid over ${sites} operationele locaties`,
      }) : '';
      const countryPart = country ? pick(lang, {
        de: ` mit Hauptsitz in ${country}`,
        pl: ` z siedzib\u0105 g\u0142\u00f3wn\u0105 w ${country}`,
        fr: ` avec un si\u00e8ge social situ\u00e9 en ${country}`,
        es: ` con sede central en ${country}`,
        it: ` con sede in ${country}`,
        nl: ` met hoofdkantoor in ${country}`,
      }) : '';
      return pick(lang, {
        de: `Zum Stand ${period} besch\u00e4ftigt unser Unternehmen ${fte} Vollzeit\u00e4quivalente (FTE)${sitePart}${countryPart}.`,
        pl: `Na dzie\u0144 ${period} nasza organizacja zatrudnia\u0142a ${fte} pracownik\u00f3w w przeliczeniu na pe\u0142ne etaty (FTE)${sitePart}${countryPart}.`,
        fr: `Au ${period}, notre organisation employait ${fte} \u00e9quivalents temps plein (FTE)${sitePart}${countryPart}.`,
        es: `A fecha de ${period}, nuestra organizaci\u00f3n empleaba ${fte} empleados equivalentes a tiempo completo (FTE)${sitePart}${countryPart}.`,
        it: `Alla data del ${period}, la nostra organizzazione impiegava ${fte} dipendenti equivalenti a tempo pieno (FTE)${sitePart}${countryPart}.`,
        nl: `Per ${period} had onze organisatie ${fte} fulltime-equivalenten (FTE) in dienst${sitePart}${countryPart}.`,
      });
    },
  },
  {
    regex: /Our workforce of ([\d.,\s]+) FTE employees comprises ([\d.,\s]+)% female and ([\d.,\s]+)% male employees\./g,
    replace: (lang, fte, female, male) => pick(lang, {
      de: `Unsere Belegschaft von ${fte} FTE besteht zu ${female}% aus Frauen und zu ${male}% aus M\u00e4nnern.`,
      pl: `Nasza kadra licz\u0105ca ${fte} FTE sk\u0142ada si\u0119 w ${female}% z kobiet i w ${male}% z m\u0119\u017cczyzn.`,
      fr: `Notre effectif de ${fte} FTE se compose de ${female}% de femmes et de ${male}% d'hommes.`,
      es: `Nuestra plantilla de ${fte} empleados FTE est\u00e1 compuesta por un ${female}% de mujeres y un ${male}% de hombres.`,
      it: `La nostra forza lavoro di ${fte} FTE \u00e8 composta per il ${female}% da donne e per il ${male}% da uomini.`,
      nl: `Ons personeelsbestand van ${fte} FTE bestaat uit ${female}% vrouwen en ${male}% mannen.`,
    }),
  },
  {
    regex: /Currently, ([\d.,\s]+)% of our workforce is covered by collective bargaining agreements(?:, representing approximately ([\d.,\s]+) of our ([\d.,\s]+) employees)?\./g,
    replace: (lang, pct, covered, total) => {
      const suffix = covered && total ? pick(lang, {
        de: `, das entspricht rund ${covered} von ${total} Besch\u00e4ftigten`,
        pl: `, co odpowiada oko\u0142o ${covered} z ${total} pracownik\u00f3w`,
        fr: `, soit environ ${covered} de nos ${total} salari\u00e9s`,
        es: `, lo que representa aproximadamente ${covered} de nuestros ${total} empleados`,
        it: `, pari a circa ${covered} dei nostri ${total} dipendenti`,
        nl: `, wat neerkomt op ongeveer ${covered} van onze ${total} medewerkers`,
      }) : '';
      return pick(lang, {
        de: `Derzeit sind ${pct}% unserer Belegschaft von Tarifvertr\u00e4gen erfasst${suffix}.`,
        pl: `Obecnie ${pct}% naszej kadry jest obj\u0119te uk\u0142adami zbiorowymi${suffix}.`,
        fr: `Actuellement, ${pct}% de notre effectif est couvert par des conventions collectives${suffix}.`,
        es: `Actualmente, el ${pct}% de nuestra plantilla est\u00e1 cubierto por convenios colectivos${suffix}.`,
        it: `Attualmente, il ${pct}% della nostra forza lavoro \u00e8 coperto da contratti collettivi${suffix}.`,
        nl: `Momenteel valt ${pct}% van ons personeelsbestand onder collectieve arbeidsovereenkomsten${suffix}.`,
      });
    },
  },
  {
    regex: /Yes, all employees(?: in (.+?))? are compensated at or above the applicable living wage(?: [\u2014-] not merely the legal minimum wage)?\./g,
    replace: (lang, country) => pick(lang, {
      de: `Ja, alle Besch\u00e4ftigten${country ? ` in ${country}` : ''} werden mindestens in H\u00f6he des jeweils geltenden Living Wage verg\u00fctet, nicht lediglich in H\u00f6he des gesetzlichen Mindestlohns.`,
      pl: `Tak, wszyscy pracownicy${country ? ` w ${country}` : ''} otrzymuj\u0105 wynagrodzenie na poziomie co najmniej obowi\u0105zuj\u0105cej p\u0142acy wystarczaj\u0105cej na utrzymanie, a nie jedynie ustawowego minimum.`,
      fr: `Oui, l'ensemble des salari\u00e9s${country ? ` en ${country}` : ''} sont r\u00e9mun\u00e9r\u00e9s au niveau du salaire vital applicable ou au-dessus, et non au seul niveau du minimum l\u00e9gal.`,
      es: `S\u00ed, todos los empleados${country ? ` en ${country}` : ''} reciben una remuneraci\u00f3n igual o superior al salario digno aplicable, no solo al salario m\u00ednimo legal.`,
      it: `S\u00ec, tutti i dipendenti${country ? ` in ${country}` : ''} ricevono una retribuzione pari o superiore al living wage applicabile, e non soltanto al minimo legale.`,
      nl: `Ja, alle medewerkers${country ? ` in ${country}` : ''} ontvangen een vergoeding op of boven het toepasselijke leefbaar loon, en niet slechts het wettelijk minimumloon.`,
    }),
  },
  {
    regex: /Women currently represent ([\d.,\s]+)% of our total workforce(?: of ([\d.,\s]+) employees)?\./g,
    replace: (lang, pct, total) => pick(lang, {
      de: `Frauen machen derzeit ${pct}% unserer Gesamtbelegschaft${total ? ` von ${total} Besch\u00e4ftigten` : ''} aus.`,
      pl: `Kobiety stanowi\u0105 obecnie ${pct}% naszej ca\u0142kowitej kadry${total ? ` licz\u0105cej ${total} pracownik\u00f3w` : ''}.`,
      fr: `Les femmes repr\u00e9sentent actuellement ${pct}% de notre effectif total${total ? ` de ${total} salari\u00e9s` : ''}.`,
      es: `Las mujeres representan actualmente el ${pct}% de nuestra plantilla total${total ? ` de ${total} empleados` : ''}.`,
      it: `Le donne rappresentano attualmente il ${pct}% della nostra forza lavoro complessiva${total ? ` di ${total} dipendenti` : ''}.`,
      nl: `Vrouwen vertegenwoordigen momenteel ${pct}% van ons totale personeelsbestand${total ? ` van ${total} medewerkers` : ''}.`,
    }),
  },
  {
    regex: /([\d.,\s]+)% of management and leadership positions are held by women\./g,
    replace: (lang, pct) => pick(lang, {
      de: `${pct}% der Management- und F\u00fchrungspositionen werden von Frauen besetzt.`,
      pl: `${pct}% stanowisk kierowniczych i mened\u017cerskich zajmuj\u0105 kobiety.`,
      fr: `${pct}% des postes de management et de direction sont occup\u00e9s par des femmes.`,
      es: `El ${pct}% de los puestos directivos y de liderazgo est\u00e1n ocupados por mujeres.`,
      it: `Il ${pct}% delle posizioni di management e leadership \u00e8 ricoperto da donne.`,
      nl: `${pct}% van de management- en leiderschapsfuncties wordt bekleed door vrouwen.`,
    }),
  },
  {
    regex: /([0-9][\d.,\s]*) new employees joined and approximately ([\d.,\s]+) employees departed during (?:the reporting period|(.+?))\./g,
    replace: (lang, hires, departures, period) => pick(lang, {
      de: `${hires} neue Besch\u00e4ftigte sind ${period ? `im ${period}` : 'im Berichtszeitraum'} eingetreten und etwa ${departures} Besch\u00e4ftigte ausgeschieden.`,
      pl: `${hires} nowych pracownik\u00f3w do\u0142\u0105czy\u0142o, a oko\u0142o ${departures} pracownik\u00f3w odesz\u0142o ${period ? `w okresie ${period}` : 'w okresie sprawozdawczym'}.`,
      fr: `${hires} nouveaux salari\u00e9s ont rejoint l'entreprise et environ ${departures} salari\u00e9s l'ont quitt\u00e9e ${period ? `pendant ${period}` : 'sur la p\u00e9riode de reporting'}.`,
      es: `${hires} nuevos empleados se incorporaron y aproximadamente ${departures} empleados salieron ${period ? `durante ${period}` : 'durante el per\u00edodo de reporte'}.`,
      it: `${hires} nuovi dipendenti sono entrati e circa ${departures} dipendenti hanno lasciato l'azienda ${period ? `durante ${period}` : 'nel periodo di rendicontazione'}.`,
      nl: `${hires} nieuwe medewerkers zijn ${period ? `gedurende ${period}` : 'in de verslagperiode'} gestart en ongeveer ${departures} medewerkers zijn vertrokken.`,
    }),
  },
  {
    regex: /Our employee turnover rate during (?:the reporting period|(.+?)) was ([\d.,\s]+)%\./g,
    replace: (lang, period, rate) => pick(lang, {
      de: `Unsere Mitarbeiterfluktuationsquote betrug ${period ? `im ${period}` : 'im Berichtszeitraum'} ${rate}%.`,
      pl: `Wska\u017anik rotacji pracownik\u00f3w wyni\u00f3s\u0142 ${period ? `w okresie ${period}` : 'w okresie sprawozdawczym'} ${rate}%.`,
      fr: `Notre taux de rotation du personnel \u00e9tait de ${rate}% ${period ? `pendant ${period}` : 'sur la p\u00e9riode de reporting'}.`,
      es: `Nuestra tasa de rotaci\u00f3n de personal fue del ${rate}% ${period ? `durante ${period}` : 'durante el per\u00edodo de reporte'}.`,
      it: `Il nostro tasso di turnover del personale \u00e8 stato del ${rate}% ${period ? `durante ${period}` : 'nel periodo di rendicontazione'}.`,
      nl: `Ons personeelsverloop bedroeg ${rate}% ${period ? `gedurende ${period}` : 'in de verslagperiode'}.`,
    }),
  },
  {
    regex: /Our occupational health and safety performance during (?:the reporting period|(.+?)):/g,
    replace: (lang, period) => pick(lang, {
      de: `Unsere Leistung im Bereich Arbeitsschutz ${period ? `im ${period}` : 'im Berichtszeitraum'}:`,
      pl: `Nasze wyniki w obszarze BHP ${period ? `w okresie ${period}` : 'w okresie sprawozdawczym'}:`,
      fr: `Notre performance en mati\u00e8re de sant\u00e9 et s\u00e9curit\u00e9 au travail ${period ? `pendant ${period}` : 'sur la p\u00e9riode de reporting'} :`,
      es: `Nuestro desempe\u00f1o en salud y seguridad laboral ${period ? `durante ${period}` : 'durante el per\u00edodo de reporte'}:`,
      it: `Le nostre prestazioni in materia di salute e sicurezza sul lavoro ${period ? `durante ${period}` : 'nel periodo di rendicontazione'}:`,
      nl: `Onze prestaties op het gebied van arbeidsgezondheid en veiligheid ${period ? `gedurende ${period}` : 'in de verslagperiode'}:`,
    }),
  },
  {
    regex: /Total Recordable Incident Rate \(TRIR\): ([\d.,\s]+)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Total Recordable Incident Rate (TRIR): ${value}.`,
      pl: `Total Recordable Incident Rate (TRIR): ${value}.`,
      fr: `Taux total d'incidents enregistrables (TRIR) : ${value}.`,
      es: `Tasa total de incidentes registrables (TRIR): ${value}.`,
      it: `Total Recordable Incident Rate (TRIR): ${value}.`,
      nl: `Total Recordable Incident Rate (TRIR): ${value}.`,
    }),
  },
  {
    regex: /Lost time incidents: ([\d.,\s]+)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Lost time incidents: ${value}.`,
      pl: `Lost time incidents: ${value}.`,
      fr: `Incidents avec arr\u00eat de travail : ${value}.`,
      es: `Incidentes con baja laboral: ${value}.`,
      it: `Lost time incidents: ${value}.`,
      nl: `Verzuimongevallen: ${value}.`,
    }),
  },
  {
    regex: /Fatalities: ([\d.,\s]+)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Fatalities: ${value}.`,
      pl: `Fatalities: ${value}.`,
      fr: `D\u00e9c\u00e8s : ${value}.`,
      es: `Fallecimientos: ${value}.`,
      it: `Fatalities: ${value}.`,
      nl: `Dodelijke ongevallen: ${value}.`,
    }),
  },
  {
    regex: /Lost Time Injury Rate \(LTIR\): ([\d.,\s]+)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Lost Time Injury Rate (LTIR): ${value}.`,
      pl: `Lost Time Injury Rate (LTIR): ${value}.`,
      fr: `Taux de fréquence des accidents avec arrêt (LTIR) : ${value}.`,
      es: `Tasa de lesiones con baja laboral (LTIR): ${value}.`,
      it: `Lost Time Injury Rate (LTIR): ${value}.`,
      nl: `Lost Time Injury Rate (LTIR): ${value}.`,
    }),
  },
  {
    regex: /Total hours worked: ([\d.,\s]+)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Gesamtzahl der geleisteten Arbeitsstunden: ${value}.`,
      pl: `Łączna liczba przepracowanych godzin: ${value}.`,
      fr: `Nombre total d'heures travaillées : ${value}.`,
      es: `Total de horas trabajadas: ${value}.`,
      it: `Totale ore lavorate: ${value}.`,
      nl: `Totaal aantal gewerkte uren: ${value}.`,
    }),
  },
  {
    regex: /While we recorded zero fatalities, we continue to investigate all incidents to prevent recurrence and strengthen our safety culture\./g,
    replace: (lang) => pick(lang, {
      de: `Obwohl wir keine tödlichen Unfälle verzeichnet haben, untersuchen wir weiterhin alle Vorfälle, um Wiederholungen zu vermeiden und unsere Sicherheitskultur zu stärken.`,
      pl: `Mimo że nie odnotowaliśmy żadnych ofiar śmiertelnych, nadal badamy wszystkie incydenty, aby zapobiegać ich powtórzeniu i wzmacniać naszą kulturę bezpieczeństwa.`,
      fr: `Bien que nous n'ayons enregistré aucun décès, nous continuons d'enquêter sur tous les incidents afin d'éviter toute récurrence et de renforcer notre culture de sécurité.`,
      es: `Aunque no registramos fatalidades, seguimos investigando todos los incidentes para evitar su repetición y reforzar nuestra cultura de seguridad.`,
      it: `Pur non avendo registrato decessi, continuiamo a indagare su tutti gli incidenti per prevenirne il ripetersi e rafforzare la nostra cultura della sicurezza.`,
      nl: `Hoewel we geen dodelijke ongevallen hebben geregistreerd, blijven we alle incidenten onderzoeken om herhaling te voorkomen en onze veiligheidscultuur te versterken.`,
    }),
  },
  {
    regex: /Employees completed an average of ([\d.,\s]+) training hours per employee during (?:the reporting period|(.+?))\./g,
    replace: (lang, hours, period) => pick(lang, {
      de: `Die Besch\u00e4ftigten absolvierten durchschnittlich ${hours} Schulungsstunden pro Mitarbeiter ${period ? `im ${period}` : 'im Berichtszeitraum'}.`,
      pl: `Pracownicy uko\u0144czyli \u015brednio ${hours} godzin szkoleniowych na pracownika ${period ? `w okresie ${period}` : 'w okresie sprawozdawczym'}.`,
      fr: `Les salari\u00e9s ont suivi en moyenne ${hours} heures de formation par employ\u00e9 ${period ? `pendant ${period}` : 'sur la p\u00e9riode de reporting'}.`,
      es: `Los empleados completaron un promedio de ${hours} horas de formaci\u00f3n por empleado ${period ? `durante ${period}` : 'durante el per\u00edodo de reporte'}.`,
      it: `I dipendenti hanno completato in media ${hours} ore di formazione per dipendente ${period ? `durante ${period}` : 'nel periodo di rendicontazione'}.`,
      nl: `Medewerkers volgden gemiddeld ${hours} opleidingsuren per medewerker ${period ? `gedurende ${period}` : 'in de verslagperiode'}.`,
    }),
  },
  {
    regex: /This is based on ([\d.,\s]+) total training hours across ([\d.,\s]+) employees\./g,
    replace: (lang, totalHours, employees) => pick(lang, {
      de: `Dies basiert auf insgesamt ${totalHours} Schulungsstunden \u00fcber ${employees} Besch\u00e4ftigte hinweg.`,
      pl: `Wynik ten opiera si\u0119 na \u0142\u0105cznej liczbie ${totalHours} godzin szkoleniowych dla ${employees} pracownik\u00f3w.`,
      fr: `Ce r\u00e9sultat est bas\u00e9 sur un total de ${totalHours} heures de formation pour ${employees} salari\u00e9s.`,
      es: `Esto se basa en un total de ${totalHours} horas de formaci\u00f3n para ${employees} empleados.`,
      it: `Questo dato si basa su un totale di ${totalHours} ore di formazione distribuite su ${employees} dipendenti.`,
      nl: `Dit is gebaseerd op in totaal ${totalHours} opleidingsuren voor ${employees} medewerkers.`,
    }),
  },
  {
    regex: /Our employees completed ([\d.,\s]+) total training hours during (?:the reporting period|(.+?))\./g,
    replace: (lang, totalHours, period) => pick(lang, {
      de: `Unsere Besch\u00e4ftigten absolvierten insgesamt ${totalHours} Schulungsstunden ${period ? `im ${period}` : 'im Berichtszeitraum'}.`,
      pl: `Nasi pracownicy uko\u0144czyli \u0142\u0105cznie ${totalHours} godzin szkoleniowych ${period ? `w okresie ${period}` : 'w okresie sprawozdawczym'}.`,
      fr: `Nos salari\u00e9s ont suivi au total ${totalHours} heures de formation ${period ? `pendant ${period}` : 'sur la p\u00e9riode de reporting'}.`,
      es: `Nuestros empleados completaron un total de ${totalHours} horas de formaci\u00f3n ${period ? `durante ${period}` : 'durante el per\u00edodo de reporte'}.`,
      it: `I nostri dipendenti hanno completato un totale di ${totalHours} ore di formazione ${period ? `durante ${period}` : 'nel periodo di rendicontazione'}.`,
      nl: `Onze medewerkers voltooiden in totaal ${totalHours} opleidingsuren ${period ? `gedurende ${period}` : 'in de verslagperiode'}.`,
    }),
  },  {
    regex: /Our total waste generated during (?:the reporting period|(.+?)) was ([\d.,\s]+) kg \(([\d.,\s]+) tonnes\)\./g,
    replace: (lang, period, kg, tonnes) => pick(lang, {
      de: `Unser gesamtes Abfallaufkommen betrug ${period ? `im ${period}` : 'im Berichtszeitraum'} ${kg} kg (${tonnes} Tonnen).`,
      pl: `Nasza ca\u0142kowita ilo\u015b\u0107 wytworzonych odpad\u00f3w wynios\u0142a ${period ? `w okresie ${period}` : 'w okresie sprawozdawczym'} ${kg} kg (${tonnes} ton).`,
      fr: `Notre volume total de d\u00e9chets g\u00e9n\u00e9r\u00e9s s'est \u00e9lev\u00e9 \u00e0 ${kg} kg (${tonnes} tonnes) ${period ? `pendant ${period}` : 'sur la p\u00e9riode de reporting'}.`,
      es: `Nuestro total de residuos generados fue de ${kg} kg (${tonnes} toneladas) ${period ? `durante ${period}` : 'durante el per\u00edodo de reporte'}.`,
      it: `Il totale dei rifiuti generati \u00e8 stato pari a ${kg} kg (${tonnes} tonnellate) ${period ? `durante ${period}` : 'nel periodo di rendicontazione'}.`,
      nl: `Onze totale afvalproductie bedroeg ${kg} kg (${tonnes} ton) ${period ? `gedurende ${period}` : 'in de verslagperiode'}.`,
    }),
  },
  {
    regex: /We achieved a waste diversion rate of ([\d.,\s]+)%\./g,
    replace: (lang, value) => pick(lang, {
      de: `Wir erreichten eine Abfallverwertungsquote von ${value}%.`,
      pl: `Osi\u0105gn\u0119li\u015bmy poziom przekierowania odpad\u00f3w na poziomie ${value}%.`,
      fr: `Nous avons atteint un taux de valorisation des d\u00e9chets de ${value}%.`,
      es: `Alcanzamos una tasa de desv\u00edo de residuos del ${value}%.`,
      it: `Abbiamo raggiunto un tasso di recupero dei rifiuti del ${value}%.`,
      nl: `Wij realiseerden een afvalafleidingspercentage van ${value}%.`,
    }),
  },
  {
    regex: /Our waste diversion \(recycling\) rate during (?:the reporting period|(.+?)) was ([\d.,\s]+)%\./g,
    replace: (lang, period, value) => pick(lang, {
      de: `Unsere Abfallverwertungsquote (Recyclingquote) betrug ${period ? `im ${period}` : 'im Berichtszeitraum'} ${value}%.`,
      pl: `Nasz poziom przekierowania odpad\u00f3w (recyklingu) wyni\u00f3s\u0142 ${period ? `w okresie ${period}` : 'w okresie sprawozdawczym'} ${value}%.`,
      fr: `Notre taux de valorisation des d\u00e9chets (recyclage) \u00e9tait de ${value}% ${period ? `pendant ${period}` : 'sur la p\u00e9riode de reporting'}.`,
      es: `Nuestra tasa de desv\u00edo de residuos (reciclaje) fue del ${value}% ${period ? `durante ${period}` : 'durante el per\u00edodo de reporte'}.`,
      it: `Il nostro tasso di recupero dei rifiuti (riciclo) \u00e8 stato del ${value}% ${period ? `durante ${period}` : 'nel periodo di rendicontazione'}.`,
      nl: `Ons afvalafleidingspercentage (recycling) bedroeg ${value}% ${period ? `gedurende ${period}` : 'in de verslagperiode'}.`,
    }),
  },
  {
    regex: /Of ([\d.,\s]+) kg total waste, ([\d.,\s]+) kg was recycled or recovered rather than sent to landfill\./g,
    replace: (lang, total, recycled) => pick(lang, {
      de: `Von insgesamt ${total} kg Abfall wurden ${recycled} kg recycelt oder verwertet, statt deponiert zu werden.`,
      pl: `Z \u0142\u0105cznej ilo\u015bci ${total} kg odpad\u00f3w, ${recycled} kg poddano recyklingowi lub odzyskowi zamiast sk\u0142adowania.`,
      fr: `Sur un total de ${total} kg de d\u00e9chets, ${recycled} kg ont \u00e9t\u00e9 recycl\u00e9s ou valoris\u00e9s au lieu d'\u00eatre mis en d\u00e9charge.`,
      es: `De un total de ${total} kg de residuos, ${recycled} kg se reciclaron o recuperaron en lugar de enviarse a vertedero.`,
      it: `Su ${total} kg di rifiuti totali, ${recycled} kg sono stati riciclati o recuperati anzich\u00e9 inviati in discarica.`,
      nl: `Van de in totaal ${total} kg afval werd ${recycled} kg gerecycled of teruggewonnen in plaats van gestort.`,
    }),
  },
  {
    regex: /We generated ([\d.,\s]+) kg of hazardous waste during (?:the reporting period|(.+?))\./g,
    replace: (lang, haz, period) => pick(lang, {
      de: `Wir erzeugten ${period ? `im ${period}` : 'im Berichtszeitraum'} ${haz} kg gef\u00e4hrlichen Abfall.`,
      pl: `Wytworzyli\u015bmy ${period ? `w okresie ${period}` : 'w okresie sprawozdawczym'} ${haz} kg odpad\u00f3w niebezpiecznych.`,
      fr: `Nous avons g\u00e9n\u00e9r\u00e9 ${haz} kg de d\u00e9chets dangereux ${period ? `pendant ${period}` : 'sur la p\u00e9riode de reporting'}.`,
      es: `Generamos ${haz} kg de residuos peligrosos ${period ? `durante ${period}` : 'durante el per\u00edodo de reporte'}.`,
      it: `Abbiamo generato ${haz} kg di rifiuti pericolosi ${period ? `durante ${period}` : 'nel periodo di rendicontazione'}.`,
      nl: `Wij genereerden ${haz} kg gevaarlijk afval ${period ? `gedurende ${period}` : 'in de verslagperiode'}.`,
    }),
  },
  {
    regex: /This represents ([\d.,\s]+)% of our total waste of ([\d.,\s]+) kg\./g,
    replace: (lang, pct, total) => pick(lang, {
      de: `Dies entspricht ${pct}% unseres gesamten Abfallaufkommens von ${total} kg.`,
      pl: `Stanowi to ${pct}% naszych ca\u0142kowitych odpad\u00f3w wynosz\u0105cych ${total} kg.`,
      fr: `Cela repr\u00e9sente ${pct}% de notre volume total de d\u00e9chets de ${total} kg.`,
      es: `Esto representa el ${pct}% de nuestro total de residuos de ${total} kg.`,
      it: `Ci\u00f2 rappresenta il ${pct}% del nostro totale di rifiuti pari a ${total} kg.`,
      nl: `Dit vertegenwoordigt ${pct}% van ons totale afval van ${total} kg.`,
    }),
  },
  {
    regex: /We did not generate any hazardous waste during the reporting period\. Our total waste of ([\d.,\s]+) kg consists entirely of non-hazardous materials\./g,
    replace: (lang, total) => pick(lang, {
      de: `Wir haben im Berichtszeitraum keinen gef\u00e4hrlichen Abfall erzeugt. Unser gesamter Abfall von ${total} kg besteht ausschlie\u00dflich aus nicht gef\u00e4hrlichen Materialien.`,
      pl: `W okresie sprawozdawczym nie wytworzyli\u015bmy \u017cadnych odpad\u00f3w niebezpiecznych. Ca\u0142kowita ilo\u015b\u0107 odpad\u00f3w wynosz\u0105ca ${total} kg sk\u0142ada si\u0119 wy\u0142\u0105cznie z materia\u0142\u00f3w innych ni\u017c niebezpieczne.`,
      fr: `Nous n'avons g\u00e9n\u00e9r\u00e9 aucun d\u00e9chet dangereux sur la p\u00e9riode de reporting. Notre volume total de d\u00e9chets de ${total} kg se compose uniquement de mati\u00e8res non dangereuses.`,
      es: `No generamos residuos peligrosos durante el per\u00edodo de reporte. Nuestro total de residuos de ${total} kg consiste \u00edntegramente en materiales no peligrosos.`,
      it: `Non abbiamo generato rifiuti pericolosi nel periodo di rendicontazione. Il nostro totale di ${total} kg di rifiuti \u00e8 composto interamente da materiali non pericolosi.`,
      nl: `Wij hebben in de verslagperiode geen gevaarlijk afval gegenereerd. Ons totale afval van ${total} kg bestaat volledig uit niet-gevaarlijke materialen.`,
    }),
  },
  {
    regex: /Our total water withdrawal during (?:the reporting period|(.+?)) was ([\d.,\s]+) m(?:\u00c2\u00b3|\u00b3)\./g,
    replace: (lang, period, value) => pick(lang, {
      de: `Unsere gesamte Wasserentnahme betrug ${period ? `im ${period}` : 'im Berichtszeitraum'} ${value} m\u00b3.`,
      pl: `Nasze ca\u0142kowite pobory wody wynios\u0142y ${period ? `w okresie ${period}` : 'w okresie sprawozdawczym'} ${value} m\u00b3.`,
      fr: `Notre pr\u00e9l\u00e8vement total d'eau s'est \u00e9lev\u00e9 \u00e0 ${value} m\u00b3 ${period ? `pendant ${period}` : 'sur la p\u00e9riode de reporting'}.`,
      es: `Nuestra captaci\u00f3n total de agua fue de ${value} m\u00b3 ${period ? `durante ${period}` : 'durante el per\u00edodo de reporte'}.`,
      it: `Il nostro prelievo idrico totale \u00e8 stato di ${value} m\u00b3 ${period ? `durante ${period}` : 'nel periodo di rendicontazione'}.`,
      nl: `Onze totale wateronttrekking bedroeg ${value} m\u00b3 ${period ? `gedurende ${period}` : 'in de verslagperiode'}.`,
    }),
  },
  {
    regex: /This equates to approximately ([\d.,\s]+) m(?:\u00c2\u00b3|\u00b3) per employee\./g,
    replace: (lang, value) => pick(lang, {
      de: `Das entspricht ungef\u00e4hr ${value} m\u00b3 pro Besch\u00e4ftigtem.`,
      pl: `Odpowiada to oko\u0142o ${value} m\u00b3 na pracownika.`,
      fr: `Cela correspond \u00e0 environ ${value} m\u00b3 par salari\u00e9.`,
      es: `Esto equivale aproximadamente a ${value} m\u00b3 por empleado.`,
      it: `Ci\u00f2 equivale a circa ${value} m\u00b3 per dipendente.`,
      nl: `Dit komt neer op ongeveer ${value} m\u00b3 per medewerker.`,
    }),
  },
  {
    regex: /Total water withdrawal was ([\d.,\s]+) m(?:\u00c2\u00b3|\u00b3) during the reporting period\./g,
    replace: (lang, value) => pick(lang, {
      de: `Die gesamte Wasserentnahme betrug im Berichtszeitraum ${value} m\u00b3.`,
      pl: `Ca\u0142kowite pobory wody w okresie sprawozdawczym wynios\u0142y ${value} m\u00b3.`,
      fr: `Le pr\u00e9l\u00e8vement total d'eau sur la p\u00e9riode de reporting s'est \u00e9lev\u00e9 \u00e0 ${value} m\u00b3.`,
      es: `La captaci\u00f3n total de agua durante el per\u00edodo de reporte fue de ${value} m\u00b3.`,
      it: `Il prelievo idrico totale nel periodo di rendicontazione \u00e8 stato di ${value} m\u00b3.`,
      nl: `De totale wateronttrekking bedroeg in de verslagperiode ${value} m\u00b3.`,
    }),
  },
  {
    regex: /The legal name of the company is (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Der rechtliche Name des Unternehmens lautet ${value}.`,
      pl: `Prawna nazwa sp\u00f3\u0142ki to ${value}.`,
      fr: `La d\u00e9nomination l\u00e9gale de l'entreprise est ${value}.`,
      es: `La denominaci\u00f3n legal de la empresa es ${value}.`,
      it: `La denominazione legale dell'azienda \u00e8 ${value}.`,
      nl: `De wettelijke naam van het bedrijf is ${value}.`,
    }),
  },
  {
    regex: /The legal name of our organization is (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Der rechtliche Name unserer Organisation lautet ${value}.`,
      pl: `Prawna nazwa naszej organizacji to ${value}.`,
      fr: `La dénomination légale de notre organisation est ${value}.`,
      es: `La denominación legal de nuestra organización es ${value}.`,
      it: `La denominazione legale della nostra organizzazione è ${value}.`,
      nl: `De wettelijke naam van onze organisatie is ${value}.`,
    }),
  },
  {
    regex: /The company is incorporated in (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Das Unternehmen ist in ${value} eingetragen.`,
      pl: `Sp\u00f3\u0142ka jest zarejestrowana w ${value}.`,
      fr: `L'entreprise est constitu\u00e9e en ${value}.`,
      es: `La empresa est\u00e1 constituida en ${value}.`,
      it: `L'azienda \u00e8 costituita in ${value}.`,
      nl: `Het bedrijf is opgericht in ${value}.`,
    }),
  },
  {
    regex: /Our registered address is (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Unsere eingetragene Anschrift lautet ${value}.`,
      pl: `Nasz adres rejestrowy to ${value}.`,
      fr: `Notre adresse enregistr\u00e9e est ${value}.`,
      es: `Nuestra direcci\u00f3n registrada es ${value}.`,
      it: `Il nostro indirizzo registrato \u00e8 ${value}.`,
      nl: `Ons geregistreerde adres is ${value}.`,
    }),
  },
  {
    regex: /Registered address: (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Eingetragene Anschrift: ${value}.`,
      pl: `Adres rejestrowy: ${value}.`,
      fr: `Adresse enregistrée : ${value}.`,
      es: `Dirección registrada: ${value}.`,
      it: `Indirizzo registrato: ${value}.`,
      nl: `Geregistreerd adres: ${value}.`,
    }),
  },
  {
    regex: /Ownership structure: (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Eigentümerstruktur: ${value}.`,
      pl: `Struktura własnościowa: ${value}.`,
      fr: `Structure de propriété : ${value}.`,
      es: `Estructura de propiedad: ${value}.`,
      it: `Struttura proprietaria: ${value}.`,
      nl: `Eigendomsstructuur: ${value}.`,
    }),
  },
  {
    regex: /Revenue band: (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Umsatzband: ${value}.`,
      pl: `Przedział przychodów: ${value}.`,
      fr: `Tranche de chiffre d'affaires : ${value}.`,
      es: `Tramo de ingresos: ${value}.`,
      it: `Fascia di fatturato: ${value}.`,
      nl: `Omzetbandbreedte: ${value}.`,
    }),
  },
  {
    regex: /This data covers the reporting period (.+?)\./g,
    replace: (lang, period) => pick(lang, {
      de: `Diese Daten beziehen sich auf den Berichtszeitraum ${period}.`,
      pl: `Dane te dotyczą okresu sprawozdawczego ${period}.`,
      fr: `Ces données couvrent la période de reporting ${period}.`,
      es: `Estos datos cubren el período de reporte ${period}.`,
      it: `Questi dati coprono il periodo di rendicontazione ${period}.`,
      nl: `Deze gegevens hebben betrekking op de verslagperiode ${period}.`,
    }),
  },
  {
    regex: /We provide (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Wir bieten ${value} an.`,
      pl: `Oferujemy ${value}.`,
      fr: `Nous proposons ${value}.`,
      es: `Ofrecemos ${value}.`,
      it: `Forniamo ${value}.`,
      nl: `Wij leveren ${value}.`,
    }),
  },
  {
    regex: /We serve (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Wir bedienen ${value}.`,
      pl: `Obs\u0142ugujemy ${value}.`,
      fr: `Nous servons ${value}.`,
      es: `Atendemos a ${value}.`,
      it: `Serviamo ${value}.`,
      nl: `Wij bedienen ${value}.`,
    }),
  },
  {
    regex: /Our annual revenue is ([\d.,\s]+(?: million| billion)?(?: [A-Z]{3})?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Unser Jahresumsatz betr\u00e4gt ${value}.`,
      pl: `Nasze roczne przychody wynosz\u0105 ${value}.`,
      fr: `Notre chiffre d'affaires annuel s'\u00e9l\u00e8ve \u00e0 ${value}.`,
      es: `Nuestros ingresos anuales ascienden a ${value}.`,
      it: `Il nostro fatturato annuo ammonta a ${value}.`,
      nl: `Onze jaaromzet bedraagt ${value}.`,
    }),
  },
  {
    regex: /We operate in (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Wir sind in ${value} t\u00e4tig.`,
      pl: `Dzia\u0142amy w ${value}.`,
      fr: `Nous op\u00e9rons dans ${value}.`,
      es: `Operamos en ${value}.`,
      it: `Operiamo in ${value}.`,
      nl: `Wij zijn actief in ${value}.`,
    }),
  },
  {
    regex: /Our customer base includes (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Zu unserem Kundenstamm z\u00e4hlen ${value}.`,
      pl: `Nasza baza klient\u00f3w obejmuje ${value}.`,
      fr: `Notre client\u00e8le comprend ${value}.`,
      es: `Nuestra base de clientes incluye ${value}.`,
      it: `La nostra base clienti comprende ${value}.`,
      nl: `Onze klantenbasis omvat ${value}.`,
    }),
  },
  {
    regex: /This information is not currently tracked or reported\./g,
    replace: (lang) => pick(lang, {
      de: `Diese Information wird derzeit nicht erfasst oder berichtet.`,
      pl: `Ta informacja nie jest obecnie \u015bledzona ani raportowana.`,
      fr: `Cette information n'est actuellement ni suivie ni publi\u00e9e.`,
      es: `Esta informaci\u00f3n no se registra ni se reporta actualmente.`,
      it: `Questa informazione non \u00e8 attualmente tracciata n\u00e9 rendicontata.`,
      nl: `Deze informatie wordt momenteel niet bijgehouden of gerapporteerd.`,
    }),
  },
  {
    regex: /This data is not currently tracked\. We do not have sufficient information to answer this disclosure\./g,
    replace: (lang) => pick(lang, {
      de: `Diese Daten werden derzeit nicht erfasst. Wir verfügen nicht über ausreichende Informationen, um diese Offenlegung zu beantworten.`,
      pl: `Te dane nie są obecnie śledzone. Nie posiadamy wystarczających informacji, aby odpowiedzieć na to ujawnienie.`,
      fr: `Ces données ne sont pas actuellement suivies. Nous ne disposons pas d'informations suffisantes pour répondre à cette divulgation.`,
      es: `Estos datos no se registran actualmente. No contamos con información suficiente para responder a esta divulgación.`,
      it: `Questi dati non sono attualmente tracciati. Non disponiamo di informazioni sufficienti per rispondere a questa disclosure.`,
      nl: `Deze gegevens worden momenteel niet bijgehouden. We beschikken niet over voldoende informatie om deze disclosure te beantwoorden.`,
    }),
  },
  {
    regex: /This disclosure is partially tracked\. Available data includes (.+?)\./g,
    replace: (lang, details) => pick(lang, {
      de: `Diese Offenlegung wird teilweise erfasst. Verfügbare Daten umfassen ${details}.`,
      pl: `To ujawnienie jest częściowo śledzone. Dostępne dane obejmują ${details}.`,
      fr: `Cette divulgation est partiellement suivie. Les données disponibles comprennent ${details}.`,
      es: `Esta divulgación se rastrea parcialmente. Los datos disponibles incluyen ${details}.`,
      it: `Questa disclosure è tracciata solo parzialmente. I dati disponibili includono ${details}.`,
      nl: `Deze disclosure wordt gedeeltelijk bijgehouden. Beschikbare gegevens omvatten ${details}.`,
    }),
  },
  {
    regex: /This disclosure is partially tracked\./g,
    replace: (lang) => pick(lang, {
      de: `Diese Offenlegung wird teilweise erfasst.`,
      pl: `To ujawnienie jest częściowo śledzone.`,
      fr: `Cette divulgation est partiellement suivie.`,
      es: `Esta divulgación se rastrea parcialmente.`,
      it: `Questa disclosure è tracciata solo parzialmente.`,
      nl: `Deze disclosure wordt gedeeltelijk bijgehouden.`,
    }),
  },
  {
    regex: /\n\nData gaps: (.+?)\./g,
    replace: (lang, gaps) => pick(lang, {
      de: `\n\nDatenlücken: ${gaps}.`,
      pl: `\n\nLuki w danych: ${gaps}.`,
      fr: `\n\nLacunes dans les données : ${gaps}.`,
      es: `\n\nVacíos de datos: ${gaps}.`,
      it: `\n\nLacune nei dati: ${gaps}.`,
      nl: `\n\nDatagaten: ${gaps}.`,
    }),
  },
  {
    regex: /A formal Code of Ethics and Anti-Corruption Policy has not yet been established\./g,
    replace: (lang) => pick(lang, {
      de: `Eine formelle Ethik- und Antikorruptionsrichtlinie wurde bislang noch nicht eingeführt.`,
      pl: `Formalny kodeks etyki i polityka antykorupcyjna nie zostały jeszcze ustanowione.`,
      fr: `Un code d'éthique formel et une politique anticorruption n'ont pas encore été mis en place.`,
      es: `Aún no se ha establecido un Código de Ética y una Política Anticorrupción formales.`,
      it: `Un Codice Etico formale e una Politica Anticorruzione non sono ancora stati definiti.`,
      nl: `Een formele gedragscode en anticorruptiebeleid zijn nog niet vastgesteld.`,
    }),
  },
];

const TERM_MAP = {
  de: { 'renewable energy': 'erneuerbare Energie', 'human rights': 'Menschenrechte', 'supply chain': 'Lieferkette' },
  pl: { 'renewable energy': 'energia odnawialna', 'human rights': 'prawa cz\u0142owieka', 'supply chain': '\u0142a\u0144cuch dostaw' },
  fr: { 'renewable energy': '\u00e9nergie renouvelable', 'human rights': 'droits humains', 'supply chain': 'cha\u00eene d\'approvisionnement' },
  es: { 'renewable energy': 'energ\u00eda renovable', 'human rights': 'derechos humanos', 'supply chain': 'cadena de suministro' },
  it: { 'renewable energy': 'energia rinnovabile', 'human rights': 'diritti umani', 'supply chain': 'catena di fornitura' },
  nl: { 'renewable energy': 'hernieuwbare energie', 'human rights': 'mensenrechten', 'supply chain': 'toeleveringsketen' },
};

function replaceTerms(text, lang) {
  const terms = TERM_MAP[lang];
  if (!terms) return text;
  let result = text;
  for (const [src, dst] of Object.entries(terms)) {
    result = result.replace(new RegExp(src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), dst);
  }
  return result;
}

export function translateAnswer(answer, targetLang) {
  const lang = norm(targetLang);
  if (!answer || lang === 'en') return answer;
  let result = String(answer);
  for (const rule of RULES) {
    result = result.replace(rule.regex, (...args) => rule.replace(lang, ...args.slice(1, -2)));
  }
  return replaceTerms(result, lang);
}

export function localizeAnswerDrafts(answerDrafts, targetLang) {
  const lang = norm(targetLang);
  if (lang === 'en') return answerDrafts;
  return answerDrafts.map((draft) => ({
    ...draft,
    answer: translateAnswer(draft.answer, lang),
    verifiedAnswer: draft.verifiedAnswer ? translateAnswer(draft.verifiedAnswer, lang) : draft.verifiedAnswer,
    draftAnswer: draft.draftAnswer ? translateAnswer(draft.draftAnswer, lang) : draft.draftAnswer,
  }));
}

export function getExportStrings(targetLang) {
  const lang = norm(targetLang);
  return {
    lang,
    htmlTitle: pick(lang, { de: 'Fragebogenantworten', pl: 'Odpowiedzi do kwestionariusza', fr: 'R\u00e9ponses au questionnaire', es: 'Respuestas al cuestionario', it: 'Risposte al questionario', nl: 'Vragenlijstantwoorden', en: 'Questionnaire Responses' }),
    framework: pick(lang, { de: 'Rahmenwerk', pl: 'Standard', fr: 'R\u00e9f\u00e9rentiel', es: 'Marco', it: 'Framework', nl: 'Raamwerk', en: 'Framework' }),
    reportingPeriod: pick(lang, { de: 'Berichtszeitraum', pl: 'Okres sprawozdawczy', fr: 'P\u00e9riode de reporting', es: 'Per\u00edodo de reporte', it: 'Periodo di rendicontazione', nl: 'Verslagperiode', en: 'Reporting period' }),
    generated: pick(lang, { de: 'Erstellt', pl: 'Wygenerowano', fr: 'G\u00e9n\u00e9r\u00e9', es: 'Generado', it: 'Generato', nl: 'Gegenereerd', en: 'Generated' }),
    question: pick(lang, { de: 'Frage', pl: 'Pytanie', fr: 'Question', es: 'Pregunta', it: 'Domanda', nl: 'Vraag', en: 'Question' }),
    status: pick(lang, { de: 'Status', pl: 'Status', fr: 'Statut', es: 'Estado', it: 'Stato', nl: 'Status', en: 'Status' }),
    coverage: pick(lang, { de: 'Abdeckung', pl: 'Pokrycie', fr: 'Couverture', es: 'Cobertura', it: 'Copertura', nl: 'Dekking', en: 'Coverage' }),
    answer: pick(lang, { de: 'Antwort', pl: 'Odpowied\u017a', fr: 'R\u00e9ponse', es: 'Respuesta', it: 'Risposta', nl: 'Antwoord', en: 'Answer' }),
    suggestedDraft: pick(lang, { de: 'Vorgeschlagener Entwurf', pl: 'Sugerowany szkic', fr: 'Projet sugg\u00e9r\u00e9', es: 'Borrador sugerido', it: 'Bozza suggerita', nl: 'Voorgestelde concepttekst', en: 'Suggested Draft' }),
    supported: pick(lang, { de: 'Belegt', pl: 'Potwierdzone danymi', fr: '\u00c9tay\u00e9', es: 'Respaldado', it: 'Supportato', nl: 'Onderbouwd', en: 'Supported' }),
    draft: pick(lang, { de: 'Entwurf', pl: 'Szkic', fr: 'Brouillon', es: 'Borrador', it: 'Bozza', nl: 'Concept', en: 'Draft' }),
    dataBacked: pick(lang, { de: 'Datenbasiert', pl: 'Oparte na danych', fr: 'Appuy\u00e9 par des donn\u00e9es', es: 'Respaldado por datos', it: 'Supportato dai dati', nl: 'Op gegevens gebaseerd', en: 'Data backed' }),
    partiallyBacked: pick(lang, { de: 'Teilweise datenbasiert', pl: 'Cz\u0119\u015bciowo oparte na danych', fr: 'Partiellement \u00e9tay\u00e9 par des donn\u00e9es', es: 'Parcialmente respaldado por datos', it: 'Parzialmente supportato dai dati', nl: 'Gedeeltelijk op gegevens gebaseerd', en: 'Partially backed by tracked data' }),
    notBacked: pick(lang, { de: 'Nicht durch erfasste Daten belegt', pl: 'Nieoparte na zebranych danych', fr: 'Non \u00e9tay\u00e9 par les donn\u00e9es suivies', es: 'No respaldado por datos registrados', it: 'Non supportato dai dati tracciati', nl: 'Niet onderbouwd met bijgehouden gegevens', en: 'Not backed by tracked data' }),
    note: pick(lang, { de: 'Entw\u00fcrfe und vorgeschlagene Texte m\u00fcssen vor externer Weitergabe manuell gepr\u00fcft werden.', pl: 'Wpisy robocze i sugerowane wersje wymagaj\u0105 r\u0119cznego przegl\u0105du przed wys\u0142aniem na zewn\u0105trz.', fr: 'Les entr\u00e9es en brouillon et les textes sugg\u00e9r\u00e9s doivent \u00eatre v\u00e9rifi\u00e9s manuellement avant tout envoi externe.', es: 'Las entradas en borrador y el texto sugerido requieren revisi\u00f3n manual antes de cualquier env\u00edo externo.', it: 'Le voci in bozza e i testi suggeriti richiedono una revisione manuale prima di qualsiasi invio esterno.', nl: 'Conceptvermeldingen en voorgestelde tekst moeten handmatig worden gecontroleerd voordat ze extern worden verzonden.', en: 'Draft entries and suggested draft text require manual review before external submission.' }),
  };
}

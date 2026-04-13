const SUPPORTED = new Set(['en', 'de', 'pl', 'fr', 'es', 'it', 'nl']);

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pl', label: 'Polski' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
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
      de: `Unser Stromverbrauch betrug im Berichtszeitraum ${kwh} kWh.`,
      pl: `Nasze całkowite zużycie energii elektrycznej w okresie sprawozdawczym wyniosło ${kwh} kWh.`,
      fr: `Notre consommation totale d'électricité sur la période de reporting s'est élevée à ${kwh} kWh.`,
      es: `Nuestro consumo total de electricidad durante el período de reporte fue de ${kwh} kWh.`,
      it: `Il nostro consumo totale di elettricità nel periodo di rendicontazione è stato di ${kwh} kWh.`,
      nl: `Ons totale elektriciteitsverbruik bedroeg in de verslagperiode ${kwh} kWh.`,
    }),
  },
  {
    regex: /Our total electricity consumption was ([\d.,\s]+) kWh during (.+?)\./g,
    replace: (lang, kwh, period) => pick(lang, {
      de: `Unser Stromverbrauch betrug ${kwh} kWh im ${period}.`,
      pl: `Nasze całkowite zużycie energii elektrycznej wyniosło ${kwh} kWh w okresie ${period}.`,
      fr: `Notre consommation totale d'électricité s'est élevée à ${kwh} kWh pendant ${period}.`,
      es: `Nuestro consumo total de electricidad fue de ${kwh} kWh durante ${period}.`,
      it: `Il nostro consumo totale di elettricità è stato di ${kwh} kWh durante ${period}.`,
      nl: `Ons totale elektriciteitsverbruik bedroeg ${kwh} kWh gedurende ${period}.`,
    }),
  },
  {
    regex: /Of this, ([\d.,\s]+)% \(([\d.,\s]+) kWh\) was sourced from renewable energy\./g,
    replace: (lang, pct, kwh) => pick(lang, {
      de: `Davon stammten ${pct}% (${kwh} kWh) aus erneuerbaren Energiequellen.`,
      pl: `Z tego ${pct}% (${kwh} kWh) pochodziło z energii odnawialnej.`,
      fr: `Sur ce total, ${pct}% (${kwh} kWh) provenaient d'énergie renouvelable.`,
      es: `De ese total, el ${pct}% (${kwh} kWh) procedía de energía renovable.`,
      it: `Di questo totale, il ${pct}% (${kwh} kWh) proveniva da energia rinnovabile.`,
      nl: `Daarvan was ${pct}% (${kwh} kWh) afkomstig uit hernieuwbare energie.`,
    }),
  },
  {
    regex: /([\d.,\s]+)% of our electricity for the reporting period was sourced from renewable energy\./g,
    replace: (lang, pct) => pick(lang, {
      de: `${pct}% unseres Stromverbrauchs im Berichtszeitraum stammten aus erneuerbaren Energiequellen.`,
      pl: `${pct}% naszej energii elektrycznej w okresie sprawozdawczym pochodziło z energii odnawialnej.`,
      fr: `${pct}% de notre électricité sur la période de reporting provenaient d'énergie renouvelable.`,
      es: `El ${pct}% de nuestra electricidad durante el período de reporte procedía de energía renovable.`,
      it: `Il ${pct}% della nostra elettricità nel periodo di rendicontazione proveniva da energia rinnovabile.`,
      nl: `${pct}% van onze elektriciteit in de verslagperiode was afkomstig uit hernieuwbare energie.`,
    }),
  },
  {
    regex: /Our greenhouse gas \(GHG\) emissions for the reporting period are as follows:/g,
    replace: (lang) => pick(lang, {
      de: 'Unsere Treibhausgasemissionen (THG) für den Berichtszeitraum sind wie folgt:',
      pl: 'Nasze emisje gazów cieplarnianych (GHG) za okres sprawozdawczy przedstawiają się następująco:',
      fr: 'Nos émissions de gaz à effet de serre (GES) sur la période de reporting sont les suivantes :',
      es: 'Nuestras emisiones de gases de efecto invernadero (GEI) para el período de reporte son las siguientes:',
      it: 'Le nostre emissioni di gas a effetto serra (GHG) per il periodo di rendicontazione sono le seguenti:',
      nl: 'Onze broeikasgasemissies (GHG) voor de verslagperiode zijn als volgt:',
    }),
  },
  {
    regex: /Scope 1 \(direct\) emissions: ([\d.,\s]+) tCO2e, covering stationary combustion, mobile sources, and any fugitive emissions\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope-1-Emissionen (direkt): ${value} tCO2e, einschließlich stationärer Verbrennung, mobiler Quellen und etwaiger flüchtiger Emissionen.`,
      pl: `Emisje Scope 1 (bezpośrednie): ${value} tCO2e, obejmujące spalanie stacjonarne, źródła mobilne oraz ewentualne emisje ulotne.`,
      fr: `Émissions de scope 1 (directes) : ${value} tCO2e, couvrant la combustion fixe, les sources mobiles et toute émission fugitive.`,
      es: `Emisiones de alcance 1 (directas): ${value} tCO2e, que cubren combustión estacionaria, fuentes móviles y cualquier emisión fugitiva.`,
      it: `Emissioni Scope 1 (dirette): ${value} tCO2e, comprendenti combustione stazionaria, fonti mobili ed eventuali emissioni fuggitive.`,
      nl: `Scope 1-emissies (direct): ${value} tCO2e, inclusief stationaire verbranding, mobiele bronnen en eventuele diffuse emissies.`,
    }),
  },
  {
    regex: /Scope 2 \(indirect, location-based\) emissions: ([\d.,\s]+) tCO2e from purchased electricity\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope-2-Emissionen (indirekt, standortbasiert): ${value} tCO2e aus eingekauftem Strom.`,
      pl: `Emisje Scope 2 (pośrednie, location-based): ${value} tCO2e z zakupionej energii elektrycznej.`,
      fr: `Émissions de scope 2 (indirectes, basées sur la localisation) : ${value} tCO2e provenant de l'électricité achetée.`,
      es: `Emisiones de alcance 2 (indirectas, basadas en ubicación): ${value} tCO2e procedentes de electricidad adquirida.`,
      it: `Emissioni Scope 2 (indirette, location-based): ${value} tCO2e da elettricità acquistata.`,
      nl: `Scope 2-emissies (indirect, locatiegebaseerd): ${value} tCO2e uit ingekochte elektriciteit.`,
    }),
  },
  {
    regex: /Scope 2 \(market-based\) emissions: ([\d.,\s]+) tCO2e, reflecting our renewable energy procurement(?: strategy)?\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope-2-Emissionen (marktbasiert): ${value} tCO2e und spiegeln unsere Beschaffung erneuerbarer Energie wider.`,
      pl: `Emisje Scope 2 (market-based): ${value} tCO2e, odzwierciedlające naszą strategię zakupu energii odnawialnej.`,
      fr: `Émissions de scope 2 (market-based) : ${value} tCO2e, reflétant notre approvisionnement en énergie renouvelable.`,
      es: `Emisiones de alcance 2 (market-based): ${value} tCO2e, que reflejan nuestra estrategia de compra de energía renovable.`,
      it: `Emissioni Scope 2 (market-based): ${value} tCO2e, che riflettono il nostro approvvigionamento di energia rinnovabile.`,
      nl: `Scope 2-emissies (market-based): ${value} tCO2e, in lijn met onze inkoop van hernieuwbare energie.`,
    }),
  },
  {
    regex: /Total Scope 1 \+ Scope 2 \(location-based\): ([\d.,\s]+) tCO2e\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope 1 + Scope 2 insgesamt (standortbasiert): ${value} tCO2e.`,
      pl: `Łącznie Scope 1 + Scope 2 (location-based): ${value} tCO2e.`,
      fr: `Total scope 1 + scope 2 (base localisation) : ${value} tCO2e.`,
      es: `Total alcance 1 + alcance 2 (basado en ubicación): ${value} tCO2e.`,
      it: `Totale Scope 1 + Scope 2 (location-based): ${value} tCO2e.`,
      nl: `Totaal scope 1 + scope 2 (locatiegebaseerd): ${value} tCO2e.`,
    }),
  },
  {
    regex: /Yes, we measure Scope 3 emissions\. Our Scope 3 \(value chain\) emissions(?: for (.+?)| for the reporting period)? total ([\d.,\s]+) tCO2e\./g,
    replace: (lang, period, value) => pick(lang, {
      de: `Ja, wir erfassen Scope-3-Emissionen. Unsere Scope-3-Emissionen (Wertschöpfungskette)${period ? ` für ${period}` : ' für den Berichtszeitraum'} betragen insgesamt ${value} tCO2e.`,
      pl: `Tak, mierzymy emisje Scope 3. Nasze emisje Scope 3 (łańcuch wartości)${period ? ` za ${period}` : ' za okres sprawozdawczy'} wynoszą łącznie ${value} tCO2e.`,
      fr: `Oui, nous mesurons les émissions de scope 3. Nos émissions de scope 3 (chaîne de valeur)${period ? ` pour ${period}` : ' sur la période de reporting'} totalisent ${value} tCO2e.`,
      es: `Sí, medimos las emisiones de alcance 3. Nuestras emisiones de alcance 3 (cadena de valor)${period ? ` para ${period}` : ' durante el período de reporte'} ascienden a ${value} tCO2e.`,
      it: `Sì, misuriamo le emissioni Scope 3. Le nostre emissioni Scope 3 (catena del valore)${period ? ` per ${period}` : ' per il periodo di rendicontazione'} ammontano a ${value} tCO2e.`,
      nl: `Ja, wij meten scope 3-emissies. Onze scope 3-emissies (waardeketen)${period ? ` voor ${period}` : ' voor de verslagperiode'} bedragen in totaal ${value} tCO2e.`,
    }),
  },
  {
    regex: /Scope 3 emissions have not been measured or reported\./g,
    replace: (lang) => pick(lang, {
      de: 'Scope-3-Emissionen wurden bisher weder gemessen noch berichtet.',
      pl: 'Emisje Scope 3 nie były dotychczas mierzone ani raportowane.',
      fr: `Les émissions de scope 3 n'ont pas encore été mesurées ni publiées.`,
      es: 'Las emisiones de alcance 3 no se han medido ni reportado hasta la fecha.',
      it: 'Le emissioni Scope 3 non sono ancora state misurate né rendicontate.',
      nl: 'Scope 3-emissies zijn nog niet gemeten of gerapporteerd.',
    }),
  },
  {
    regex: /Business travel: ([\d.,\s]+) km\./g,
    replace: (lang, value) => pick(lang, {
      de: `Geschäftsreisen: ${value} km.`,
      pl: `Podróże służbowe: ${value} km.`,
      fr: `Déplacements professionnels : ${value} km.`,
      es: `Viajes de negocios: ${value} km.`,
      it: `Viaggi di lavoro: ${value} km.`,
      nl: `Zakelijke reizen: ${value} km.`,
    }),
  },
  {
    regex: /Employee commuting: ([\d.,\s]+) km\./g,
    replace: (lang, value) => pick(lang, {
      de: `Pendelverkehr der Beschäftigten: ${value} km.`,
      pl: `Dojazdy pracowników: ${value} km.`,
      fr: `Trajets domicile-travail des salariés : ${value} km.`,
      es: `Desplazamientos de empleados: ${value} km.`,
      it: `Spostamenti casa-lavoro dei dipendenti: ${value} km.`,
      nl: `Woon-werkverkeer van medewerkers: ${value} km.`,
    }),
  },
  {
    regex: /As of (.+?), our organization employs ([\d.,\s]+) full-time equivalent \(FTE\) employees(?: across ([\d.,\s]+) operational sites)?(?:, headquartered in (.+?))?\./g,
    replace: (lang, period, fte, sites, country) => {
      const sitePart = sites ? pick(lang, {
        de: ` an ${sites} Standorten`,
        pl: ` w ${sites} lokalizacjach operacyjnych`,
        fr: ` sur ${sites} sites opérationnels`,
        es: ` en ${sites} centros operativos`,
        it: ` in ${sites} siti operativi`,
        nl: ` verspreid over ${sites} operationele locaties`,
      }) : '';
      const countryPart = country ? pick(lang, {
        de: ` mit Hauptsitz in ${country}`,
        pl: ` z siedzibą główną w ${country}`,
        fr: ` avec un siège social situé en ${country}`,
        es: ` con sede central en ${country}`,
        it: ` con sede in ${country}`,
        nl: ` met hoofdkantoor in ${country}`,
      }) : '';
      return pick(lang, {
        de: `Zum Stand ${period} beschäftigt unser Unternehmen ${fte} Vollzeitäquivalente (FTE)${sitePart}${countryPart}.`,
        pl: `Na dzień ${period} nasza organizacja zatrudniała ${fte} pracowników w przeliczeniu na pełne etaty (FTE)${sitePart}${countryPart}.`,
        fr: `Au ${period}, notre organisation employait ${fte} équivalents temps plein (FTE)${sitePart}${countryPart}.`,
        es: `A fecha de ${period}, nuestra organización empleaba ${fte} empleados equivalentes a tiempo completo (FTE)${sitePart}${countryPart}.`,
        it: `Alla data del ${period}, la nostra organizzazione impiegava ${fte} dipendenti equivalenti a tempo pieno (FTE)${sitePart}${countryPart}.`,
        nl: `Per ${period} had onze organisatie ${fte} fulltime-equivalenten (FTE) in dienst${sitePart}${countryPart}.`,
      });
    },
  },
  {
    regex: /Our workforce of ([\d.,\s]+) FTE employees comprises ([\d.,\s]+)% female and ([\d.,\s]+)% male employees\./g,
    replace: (lang, fte, female, male) => pick(lang, {
      de: `Unsere Belegschaft von ${fte} FTE besteht zu ${female}% aus Frauen und zu ${male}% aus Männern.`,
      pl: `Nasza kadra licząca ${fte} FTE składa się w ${female}% z kobiet i w ${male}% z mężczyzn.`,
      fr: `Notre effectif de ${fte} FTE se compose de ${female}% de femmes et de ${male}% d'hommes.`,
      es: `Nuestra plantilla de ${fte} empleados FTE está compuesta por un ${female}% de mujeres y un ${male}% de hombres.`,
      it: `La nostra forza lavoro di ${fte} FTE è composta per il ${female}% da donne e per il ${male}% da uomini.`,
      nl: `Ons personeelsbestand van ${fte} FTE bestaat uit ${female}% vrouwen en ${male}% mannen.`,
    }),
  },
  {
    regex: /Our total waste generated was ([\d.,\s]+) kg \(([\d.,\s]+) tonnes\)\./g,
    replace: (lang, kg, tonnes) => pick(lang, {
      de: `Unser gesamtes Abfallaufkommen betrug ${kg} kg (${tonnes} Tonnen).`,
      pl: `Nasza całkowita ilość wytworzonych odpadów wyniosła ${kg} kg (${tonnes} ton).`,
      fr: `Notre volume total de déchets générés s'est élevé à ${kg} kg (${tonnes} tonnes).`,
      es: `Nuestro total de residuos generados fue de ${kg} kg (${tonnes} toneladas).`,
      it: `Il totale dei rifiuti generati è stato pari a ${kg} kg (${tonnes} tonnellate).`,
      nl: `Onze totale afvalproductie bedroeg ${kg} kg (${tonnes} ton).`,
    }),
  },
  {
    regex: /We achieved a waste diversion rate of ([\d.,\s]+)%\./g,
    replace: (lang, value) => pick(lang, {
      de: `Wir erreichten eine Abfallverwertungsquote von ${value}%.`,
      pl: `Osiągnęliśmy poziom przekierowania odpadów na poziomie ${value}%.`,
      fr: `Nous avons atteint un taux de valorisation des déchets de ${value}%.`,
      es: `Alcanzamos una tasa de desvío de residuos del ${value}%.`,
      it: `Abbiamo raggiunto un tasso di recupero dei rifiuti del ${value}%.`,
      nl: `Wij realiseerden een afvalafleidingspercentage van ${value}%.`,
    }),
  },
  {
    regex: /Our total water withdrawal was ([\d.,\s]+) m³\./g,
    replace: (lang, value) => pick(lang, {
      de: `Unsere gesamte Wasserentnahme betrug ${value} m³.`,
      pl: `Nasze całkowite pobory wody wyniosły ${value} m³.`,
      fr: `Notre prélèvement total d'eau s'est élevé à ${value} m³.`,
      es: `Nuestra captación total de agua fue de ${value} m³.`,
      it: `Il nostro prelievo idrico totale è stato di ${value} m³.`,
      nl: `Onze totale wateronttrekking bedroeg ${value} m³.`,
    }),
  },
  {
    regex: /This information is not currently tracked or reported\./g,
    replace: (lang) => pick(lang, {
      de: 'Diese Information wird derzeit nicht systematisch erfasst oder berichtet.',
      pl: 'Ta informacja nie jest obecnie śledzona ani raportowana.',
      fr: `Cette information n'est actuellement ni suivie ni publiée.`,
      es: 'Esta información no se registra ni se reporta actualmente.',
      it: 'Questa informazione non è attualmente monitorata né rendicontata.',
      nl: 'Deze informatie wordt momenteel niet bijgehouden of gerapporteerd.',
    }),
  },
];

const TERM_MAP = {
  de: { 'renewable energy': 'erneuerbare Energie', 'human rights': 'Menschenrechte', 'supply chain': 'Lieferkette' },
  pl: { 'renewable energy': 'energia odnawialna', 'human rights': 'prawa człowieka', 'supply chain': 'łańcuch dostaw' },
  fr: { 'renewable energy': 'énergie renouvelable', 'human rights': 'droits humains', 'supply chain': "chaîne d'approvisionnement" },
  es: { 'renewable energy': 'energía renovable', 'human rights': 'derechos humanos', 'supply chain': 'cadena de suministro' },
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
    htmlTitle: pick(lang, {
      de: 'Fragebogenantworten',
      pl: 'Odpowiedzi do kwestionariusza',
      fr: 'Réponses au questionnaire',
      es: 'Respuestas al cuestionario',
      it: 'Risposte al questionario',
      nl: 'Vragenlijstantwoorden',
      en: 'Questionnaire Responses',
    }),
    framework: pick(lang, { de: 'Rahmenwerk', pl: 'Standard', fr: 'Référentiel', es: 'Marco', it: 'Framework', nl: 'Raamwerk', en: 'Framework' }),
    reportingPeriod: pick(lang, { de: 'Berichtszeitraum', pl: 'Okres sprawozdawczy', fr: 'Période de reporting', es: 'Período de reporte', it: 'Periodo di rendicontazione', nl: 'Verslagperiode', en: 'Reporting period' }),
    generated: pick(lang, { de: 'Erstellt', pl: 'Wygenerowano', fr: 'Généré', es: 'Generado', it: 'Generato', nl: 'Gegenereerd', en: 'Generated' }),
    question: pick(lang, { de: 'Frage', pl: 'Pytanie', fr: 'Question', es: 'Pregunta', it: 'Domanda', nl: 'Vraag', en: 'Question' }),
    status: pick(lang, { de: 'Status', pl: 'Status', fr: 'Statut', es: 'Estado', it: 'Stato', nl: 'Status', en: 'Status' }),
    coverage: pick(lang, { de: 'Abdeckung', pl: 'Pokrycie', fr: 'Couverture', es: 'Cobertura', it: 'Copertura', nl: 'Dekking', en: 'Coverage' }),
    answer: pick(lang, { de: 'Antwort', pl: 'Odpowiedź', fr: 'Réponse', es: 'Respuesta', it: 'Risposta', nl: 'Antwoord', en: 'Answer' }),
    suggestedDraft: pick(lang, { de: 'Vorgeschlagener Entwurf', pl: 'Sugerowany szkic', fr: 'Projet suggéré', es: 'Borrador sugerido', it: 'Bozza suggerita', nl: 'Voorgestelde concepttekst', en: 'Suggested Draft' }),
    supported: pick(lang, { de: 'Belegt', pl: 'Potwierdzone danymi', fr: 'Étaye', es: 'Respaldado', it: 'Supportato', nl: 'Onderbouwd', en: 'Supported' }),
    draft: pick(lang, { de: 'Entwurf', pl: 'Szkic', fr: 'Brouillon', es: 'Borrador', it: 'Bozza', nl: 'Concept', en: 'Draft' }),
    dataBacked: pick(lang, { de: 'Datenbasiert', pl: 'Oparte na danych', fr: 'Appuyé par des données', es: 'Respaldado por datos', it: 'Supportato dai dati', nl: 'Op gegevens gebaseerd', en: 'Data backed' }),
    partiallyBacked: pick(lang, { de: 'Teilweise datenbasiert', pl: 'Częściowo oparte na danych', fr: 'Partiellement étayé par des données', es: 'Parcialmente respaldado por datos', it: 'Parzialmente supportato dai dati', nl: 'Gedeeltelijk op gegevens gebaseerd', en: 'Partially backed by tracked data' }),
    notBacked: pick(lang, { de: 'Nicht durch erfasste Daten belegt', pl: 'Nieoparte na zebranych danych', fr: 'Non étayé par les données suivies', es: 'No respaldado por datos registrados', it: 'Non supportato dai dati tracciati', nl: 'Niet onderbouwd met bijgehouden gegevens', en: 'Not backed by tracked data' }),
    note: pick(lang, {
      de: 'Entwürfe und vorgeschlagene Texte müssen vor externer Weitergabe manuell geprüft werden.',
      pl: 'Wpisy robocze i sugerowane wersje wymagają ręcznego przeglądu przed wysłaniem na zewnątrz.',
      fr: 'Les entrées en brouillon et les textes suggérés doivent être vérifiés manuellement avant tout envoi externe.',
      es: 'Las entradas en borrador y el texto sugerido requieren revisión manual antes de cualquier envío externo.',
      it: 'Le voci in bozza e i testi suggeriti richiedono una revisione manuale prima di qualsiasi invio esterno.',
      nl: 'Conceptvermeldingen en voorgestelde tekst moeten handmatig worden gecontroleerd voordat ze extern worden verzonden.',
      en: 'Draft entries and suggested draft text require manual review before external submission.',
    }),
  };
}

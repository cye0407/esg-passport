const SUPPORTED = new Set(['en', 'de']);

// The answer languages Passport writes, and the only ones the RULES below carry.
//
// en and de come out of response-ready NATIVELY - the engine writes German, it
// does not translate English. pl/fr/es/it/nl were only ever these regexes applied
// to English output, and measuring them across all 11 built-in templates (285
// answers, 529 sentences) they rewrote about a quarter and left the rest English -
// including "We do not have this data on record for this question", the line a
// supplier most needs understood, untranslated 28 times. A supplier who picked
// Francais and exported was handing their customer a half-English document.
//
// So they are gone rather than hidden (git history has them). A language comes
// back when its answers are written, not patched.
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
];

// Is this language offered in the picker? A workspace saved before the picker was
// trimmed can still carry 'fr' in settings.language, and a Select whose value is not
// in its list renders blank.
export function isOfferedAnswerLanguage(lang) {
  return LANGUAGES.some((l) => l.code === lang);
}

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
    }),
  },
  {
    regex: /Our total electricity consumption was ([\d.,\s]+) kWh during (.+?)\./g,
    replace: (lang, kwh, period) => pick(lang, {
      de: `Unser gesamter Stromverbrauch betrug ${kwh} kWh im ${period}.`,
    }),
  },
  {
    regex: /Of this, ([\d.,\s]+)% \(([\d.,\s]+) kWh\) was sourced from renewable energy\./g,
    replace: (lang, pct, kwh) => pick(lang, {
      de: `Davon stammten ${pct}% (${kwh} kWh) aus erneuerbaren Energiequellen.`,
    }),
  },
  {
    regex: /Of this, ([\d.,\s]+)% \(approximately ([\d.,\s]+) kWh\) was sourced from renewable energy\./g,
    replace: (lang, pct, kwh) => pick(lang, {
      de: `Davon stammten ${pct}% (rund ${kwh} kWh) aus erneuerbaren Energiequellen.`,
    }),
  },
  {
    regex: /Renewable electricity accounted for ([\d.,\s]+)% of consumption\./g,
    replace: (lang, pct) => pick(lang, {
      de: `Erneuerbarer Strom machte ${pct}% des Verbrauchs aus.`,
    }),
  },
  {
    regex: /([\d.,\s]+)% of our electricity for (?:the reporting period|(.+?)) was sourced from renewable energy\./g,
    replace: (lang, pct, period) => pick(lang, {
      de: `${pct}% unseres Stromverbrauchs ${period ? `im ${period}` : 'im Berichtszeitraum'} stammten aus erneuerbaren Energiequellen.`,
    }),
  },
  {
    regex: /Our greenhouse gas \(GHG\) emissions for (?:the reporting period|(.+?)) are as follows:/g,
    replace: (lang, period) => pick(lang, {
      de: `Unsere Treibhausgasemissionen (THG) ${period ? `f\u00fcr ${period}` : 'f\u00fcr den Berichtszeitraum'} sind wie folgt:`,
    }),
  },
  {
    regex: /Scope 1 \(direct\) emissions: ([\d.,\s]+) tCO2e, covering stationary combustion, mobile sources, and any fugitive emissions\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope-1-Emissionen (direkt): ${value} tCO2e, einschlie\u00dflich station\u00e4rer Verbrennung, mobiler Quellen und etwaiger diffuser Emissionen.`,
    }),
  },
  {
    regex: /Scope 2 \(indirect, location-based\) emissions: ([\d.,\s]+) tCO2e from purchased electricity\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope-2-Emissionen (indirekt, standortbasiert): ${value} tCO2e aus eingekauftem Strom.`,
    }),
  },
  {
    regex: /Scope 2 \(market-based\) emissions: ([\d.,\s]+) tCO2e, reflecting our renewable energy procurement(?: strategy)?\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope-2-Emissionen (marktbasiert): ${value} tCO2e und spiegeln unsere Beschaffung erneuerbarer Energie wider.`,
    }),
  },
  {
    regex: /Our Scope 2 \(indirect\) greenhouse gas emissions from purchased electricity for (?:the reporting period|(.+?)):/g,
    replace: (lang, period) => pick(lang, {
      de: `Unsere Scope-2-Treibhausgasemissionen (indirekt) aus eingekauftem Strom ${period ? `f\u00fcr ${period}` : 'f\u00fcr den Berichtszeitraum'}:`,
    }),
  },
  {
    regex: /Location-based: ([\d.,\s]+) tCO2e\./g,
    replace: (lang, value) => pick(lang, {
      de: `Standortbasiert: ${value} tCO2e.`,
    }),
  },
  {
    regex: /These emissions result from ([\d.,\s]+) kWh of purchased electricity\./g,
    replace: (lang, value) => pick(lang, {
      de: `Diese Emissionen resultieren aus ${value} kWh eingekauftem Strom.`,
    }),
  },
  {
    regex: /Note: Scope 2 figures are calculated using country-level grid emission factors applied to our electricity consumption data\./g,
    replace: (lang) => pick(lang, {
      de: `Hinweis: Die Scope-2-Werte werden mithilfe l\u00e4nderspezifischer Netz-Emissionsfaktoren berechnet, die auf unsere Stromverbrauchsdaten angewendet werden.`,
    }),
  },
  {
    regex: /Note: Some figures are estimates derived from activity data \(fuel consumption, electricity use\) and standard emission factors\./g,
    replace: (lang) => pick(lang, {
      de: `Hinweis: Einige Werte sind Sch\u00e4tzungen auf Basis von Aktivit\u00e4tsdaten (Kraftstoffverbrauch, Stromverbrauch) und Standard-Emissionsfaktoren.`,
    }),
  },
  {
    regex: /We are working to improve the granularity of our GHG inventory\./g,
    replace: (lang) => pick(lang, {
      de: `Wir arbeiten daran, die Granularität unseres THG-Inventars zu verbessern.`,
    }),
  },
  {
    regex: /We continue to prioritize the transition to renewable electricity across our operations\./g,
    replace: (lang) => pick(lang, {
      de: `Wir priorisieren weiterhin den Umstieg auf erneuerbaren Strom in unserem gesamten Betrieb.`,
    }),
  },
  {
    regex: /Out of ([\d.,\s]+) kWh total consumption, approximately ([\d.,\s]+) kWh was renewable\./g,
    replace: (lang, total, renewable) => pick(lang, {
      de: `Von insgesamt ${total} kWh Verbrauch waren rund ${renewable} kWh erneuerbar.`,
    }),
  },
  {
    regex: /We are on track to further increase renewable procurement across our operations\./g,
    replace: (lang) => pick(lang, {
      de: `Wir sind auf Kurs, die Beschaffung erneuerbarer Energie in unserem gesamten Betrieb weiter zu erh\u00f6hen.`,
    }),
  },
  {
    regex: /Total Scope 1 \+ Scope 2 \(location-based\): ([\d.,\s]+) tCO2e\./g,
    replace: (lang, value) => pick(lang, {
      de: `Scope 1 + Scope 2 insgesamt (standortbasiert): ${value} tCO2e.`,
    }),
  },
  {
    regex: /Fuel consumption is a key input for our Scope 1 emissions calculation\./g,
    replace: (lang) => pick(lang, {
      de: `Der Kraftstoffverbrauch ist eine wesentliche Grundlage f\u00fcr die Berechnung unserer Scope-1-Emissionen.`,
    }),
  },
  {
    regex: /We are evaluating opportunities to reduce fossil fuel dependency through electrification and energy efficiency measures\./g,
    replace: (lang) => pick(lang, {
      de: `Wir pr\u00fcfen M\u00f6glichkeiten, die Abh\u00e4ngigkeit von fossilen Brennstoffen durch Elektrifizierung und Energieeffizienzma\u00dfnahmen zu verringern.`,
    }),
  },
  {
    regex: /Yes, we measure Scope 3 emissions\. Our Scope 3 \(value chain\) emissions(?: for (.+?)| for the reporting period)? total ([\d.,\s]+) tCO2e\./g,
    replace: (lang, period, value) => pick(lang, {
      de: `Ja, wir erfassen Scope-3-Emissionen. Unsere Scope-3-Emissionen (Wertsch\u00f6pfungskette)${period ? ` f\u00fcr ${period}` : ' f\u00fcr den Berichtszeitraum'} betragen insgesamt ${value} tCO2e.`,
    }),
  },
  {
    regex: /Scope 3 emissions have not been measured or reported\./g,
    replace: (lang) => pick(lang, {
      de: `Scope-3-Emissionen wurden bisher weder gemessen noch berichtet.`,
    }),
  },
  {
    regex: /Business travel: ([\d.,\s]+) km\./g,
    replace: (lang, value) => pick(lang, {
      de: `Gesch\u00e4ftsreisen: ${value} km.`,
    }),
  },
  {
    regex: /Employee commuting: ([\d.,\s]+) km\./g,
    replace: (lang, value) => pick(lang, {
      de: `Pendelverkehr der Besch\u00e4ftigten: ${value} km.`,
    }),
  },  {
    regex: /As of (.+?), our organization employs ([\d.,\s]+) full-time equivalent \(FTE\) employees(?: across ([\d.,\s]+) operational sites)?(?:, headquartered in (.+?))?\./g,
    replace: (lang, period, fte, sites, country) => {
      const sitePart = sites ? pick(lang, {
        de: ` an ${sites} Standorten`,
      }) : '';
      const countryPart = country ? pick(lang, {
        de: ` mit Hauptsitz in ${country}`,
      }) : '';
      return pick(lang, {
        de: `Zum Stand ${period} besch\u00e4ftigt unser Unternehmen ${fte} Vollzeit\u00e4quivalente (FTE)${sitePart}${countryPart}.`,
      });
    },
  },
  {
    regex: /Our workforce of ([\d.,\s]+) FTE employees comprises ([\d.,\s]+)% female and ([\d.,\s]+)% male employees\./g,
    replace: (lang, fte, female, male) => pick(lang, {
      de: `Unsere Belegschaft von ${fte} FTE besteht zu ${female}% aus Frauen und zu ${male}% aus M\u00e4nnern.`,
    }),
  },
  {
    regex: /Currently, ([\d.,\s]+)% of our workforce is covered by collective bargaining agreements(?:, representing approximately ([\d.,\s]+) of our ([\d.,\s]+) employees)?\./g,
    replace: (lang, pct, covered, total) => {
      const suffix = covered && total ? pick(lang, {
        de: `, das entspricht rund ${covered} von ${total} Besch\u00e4ftigten`,
      }) : '';
      return pick(lang, {
        de: `Derzeit sind ${pct}% unserer Belegschaft von Tarifvertr\u00e4gen erfasst${suffix}.`,
      });
    },
  },
  {
    regex: /This covers approximately ([\d.,\s]+) of our ([\d.,\s]+) employees\./g,
    replace: (lang, covered, total) => pick(lang, {
      de: `Dies entspricht rund ${covered} von ${total} Besch\u00e4ftigten.`,
    }),
  },
  {
    regex: /We respect freedom of association and the right to collective bargaining in all our operations\./g,
    replace: (lang) => pick(lang, {
      de: `Wir achten in all unseren Betrieben die Vereinigungsfreiheit und das Recht auf Kollektivverhandlungen.`,
    }),
  },
  {
    regex: /Yes, we respect employees' right to freedom of association and collective bargaining in all our operations\./g,
    replace: (lang) => pick(lang, {
      de: `Ja, wir achten in all unseren Betrieben das Recht der Besch\u00e4ftigten auf Vereinigungsfreiheit und Kollektivverhandlungen.`,
    }),
  },
  {
    regex: /Employees are free to join, form, or refrain from joining trade unions or works councils without fear of intimidation, retaliation, or discrimination\./g,
    replace: (lang) => pick(lang, {
      de: `Besch\u00e4ftigte k\u00f6nnen Gewerkschaften oder Betriebsr\u00e4ten frei beitreten, diese gr\u00fcnden oder darauf verzichten, ohne Einsch\u00fcchterung, Vergeltung oder Diskriminierung bef\u00fcrchten zu m\u00fcssen.`,
    }),
  },
  {
    regex: /These rights are addressed within the framework of applicable labor law in (.+?)\./g,
    replace: (lang, country) => pick(lang, {
      de: `Diese Rechte werden im Rahmen des geltenden Arbeitsrechts in ${country} verankert.`,
    }),
  },
  {
    regex: /Yes, all employees(?: in (.+?))? are compensated at or above the applicable living wage(?: [\u2014-] not merely the legal minimum wage)?\./g,
    replace: (lang, country) => pick(lang, {
      de: `Ja, alle Besch\u00e4ftigten${country ? ` in ${country}` : ''} werden mindestens in H\u00f6he des jeweils geltenden Living Wage verg\u00fctet, nicht lediglich in H\u00f6he des gesetzlichen Mindestlohns.`,
    }),
  },
  {
    regex: /Women currently represent ([\d.,\s]+)% of our total workforce(?: of ([\d.,\s]+) employees)?\./g,
    replace: (lang, pct, total) => pick(lang, {
      de: `Frauen machen derzeit ${pct}% unserer Gesamtbelegschaft${total ? ` von ${total} Besch\u00e4ftigten` : ''} aus.`,
    }),
  },
  {
    regex: /([\d.,\s]+)% of management and leadership positions are held by women\./g,
    replace: (lang, pct) => pick(lang, {
      de: `${pct}% der Management- und F\u00fchrungspositionen werden von Frauen besetzt.`,
    }),
  },
  {
    regex: /([0-9][\d.,\s]*) new employees joined and approximately ([\d.,\s]+) employees departed during (?:the reporting period|(.+?))\./g,
    replace: (lang, hires, departures, period) => pick(lang, {
      de: `${hires} neue Besch\u00e4ftigte sind ${period ? `im ${period}` : 'im Berichtszeitraum'} eingetreten und etwa ${departures} Besch\u00e4ftigte ausgeschieden.`,
    }),
  },
  {
    regex: /As of the end of the reporting period, our workforce comprises ([\d.,\s]+) FTE employees\./g,
    replace: (lang, fte) => pick(lang, {
      de: `Zum Ende des Berichtszeitraums umfasste unsere Belegschaft ${fte} FTE.`,
    }),
  },
  {
    regex: /\(turnover rate: ([\d.,\s]+)%\)\./g,
    replace: (lang, rate) => pick(lang, {
      de: `(Fluktuationsquote: ${rate}%).`,
    }),
  },
  {
    regex: /Our employee turnover rate during (?:the reporting period|(.+?)) was ([\d.,\s]+)%\./g,
    replace: (lang, period, rate) => pick(lang, {
      de: `Unsere Mitarbeiterfluktuationsquote betrug ${period ? `im ${period}` : 'im Berichtszeitraum'} ${rate}%.`,
    }),
  },
  {
    regex: /Our occupational health and safety performance during (?:the reporting period|(.+?)):/g,
    replace: (lang, period) => pick(lang, {
      de: `Unsere Leistung im Bereich Arbeitsschutz ${period ? `im ${period}` : 'im Berichtszeitraum'}:`,
    }),
  },
  {
    regex: /Total Recordable Incident Rate \(TRIR\): ([\d.,\s]+)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Meldepflichtige Unfallquote (TRIR): ${value}.`,
    }),
  },
  {
    regex: /Lost time incidents: ([\d.,\s]+)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Unfälle mit Ausfallzeit: ${value}.`,
    }),
  },
  {
    regex: /Fatalities: ([\d.,\s]+)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Todesfälle: ${value}.`,
    }),
  },
  {
    regex: /Lost Time Injury Rate \(LTIR\): ([\d.,\s]+)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Unfallquote mit Ausfallzeit (LTIR): ${value}.`,
    }),
  },
  {
    regex: /Total hours worked: ([\d.,\s]+)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Gesamtzahl der geleisteten Arbeitsstunden: ${value}.`,
    }),
  },
  {
    regex: /While we recorded zero fatalities, we continue to investigate all incidents to prevent recurrence and strengthen our safety culture\./g,
    replace: (lang) => pick(lang, {
      de: `Obwohl wir keine tödlichen Unfälle verzeichnet haben, untersuchen wir weiterhin alle Vorfälle, um Wiederholungen zu vermeiden und unsere Sicherheitskultur zu stärken.`,
    }),
  },
  {
    regex: /Employees completed an average of ([\d.,\s]+) training hours per employee during (?:the reporting period|(.+?))\./g,
    replace: (lang, hours, period) => pick(lang, {
      de: `Die Besch\u00e4ftigten absolvierten durchschnittlich ${hours} Schulungsstunden pro Mitarbeiter ${period ? `im ${period}` : 'im Berichtszeitraum'}.`,
    }),
  },
  {
    regex: /This is based on ([\d.,\s]+) total training hours across ([\d.,\s]+) employees\./g,
    replace: (lang, totalHours, employees) => pick(lang, {
      de: `Dies basiert auf insgesamt ${totalHours} Schulungsstunden \u00fcber ${employees} Besch\u00e4ftigte hinweg.`,
    }),
  },
  {
    regex: /Our employees completed ([\d.,\s]+) total training hours during (?:the reporting period|(.+?))\./g,
    replace: (lang, totalHours, period) => pick(lang, {
      de: `Unsere Besch\u00e4ftigten absolvierten insgesamt ${totalHours} Schulungsstunden ${period ? `im ${period}` : 'im Berichtszeitraum'}.`,
    }),
  },  {
    regex: /Our total waste generated during (?:the reporting period|(.+?)) was ([\d.,\s]+) kg \(([\d.,\s]+) tonnes\)\./g,
    replace: (lang, period, kg, tonnes) => pick(lang, {
      de: `Unser gesamtes Abfallaufkommen betrug ${period ? `im ${period}` : 'im Berichtszeitraum'} ${kg} kg (${tonnes} Tonnen).`,
    }),
  },
  {
    regex: /We achieved a waste diversion rate of ([\d.,\s]+)%\./g,
    replace: (lang, value) => pick(lang, {
      de: `Wir erreichten eine Abfallverwertungsquote von ${value}%.`,
    }),
  },
  {
    regex: /Our waste diversion \(recycling\) rate during (?:the reporting period|(.+?)) was ([\d.,\s]+)%\./g,
    replace: (lang, period, value) => pick(lang, {
      de: `Unsere Abfallverwertungsquote (Recyclingquote) betrug ${period ? `im ${period}` : 'im Berichtszeitraum'} ${value}%.`,
    }),
  },
  {
    regex: /Of ([\d.,\s]+) kg total waste, ([\d.,\s]+) kg was recycled or recovered rather than sent to landfill\./g,
    replace: (lang, total, recycled) => pick(lang, {
      de: `Von insgesamt ${total} kg Abfall wurden ${recycled} kg recycelt oder verwertet, statt deponiert zu werden.`,
    }),
  },
  {
    regex: /We generated ([\d.,\s]+) kg of hazardous waste during (?:the reporting period|(.+?))\./g,
    replace: (lang, haz, period) => pick(lang, {
      de: `Wir erzeugten ${period ? `im ${period}` : 'im Berichtszeitraum'} ${haz} kg gef\u00e4hrlichen Abfall.`,
    }),
  },
  {
    regex: /This represents ([\d.,\s]+)% of our total waste of ([\d.,\s]+) kg\./g,
    replace: (lang, pct, total) => pick(lang, {
      de: `Dies entspricht ${pct}% unseres gesamten Abfallaufkommens von ${total} kg.`,
    }),
  },
  {
    regex: /We did not generate any hazardous waste during the reporting period\. Our total waste of ([\d.,\s]+) kg consists entirely of non-hazardous materials\./g,
    replace: (lang, total) => pick(lang, {
      de: `Wir haben im Berichtszeitraum keinen gef\u00e4hrlichen Abfall erzeugt. Unser gesamter Abfall von ${total} kg besteht ausschlie\u00dflich aus nicht gef\u00e4hrlichen Materialien.`,
    }),
  },
  {
    regex: /Our total water withdrawal during (?:the reporting period|(.+?)) was ([\d.,\s]+) m(?:\u00c2\u00b3|\u00b3)\./g,
    replace: (lang, period, value) => pick(lang, {
      de: `Unsere gesamte Wasserentnahme betrug ${period ? `im ${period}` : 'im Berichtszeitraum'} ${value} m\u00b3.`,
    }),
  },
  {
    regex: /This equates to approximately ([\d.,\s]+) m(?:\u00c2\u00b3|\u00b3) per employee\./g,
    replace: (lang, value) => pick(lang, {
      de: `Das entspricht ungef\u00e4hr ${value} m\u00b3 pro Besch\u00e4ftigtem.`,
    }),
  },
  {
    regex: /Total water withdrawal was ([\d.,\s]+) m(?:\u00c2\u00b3|\u00b3) during the reporting period\./g,
    replace: (lang, value) => pick(lang, {
      de: `Die gesamte Wasserentnahme betrug im Berichtszeitraum ${value} m\u00b3.`,
    }),
  },
  {
    regex: /The legal name of the company is (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Der rechtliche Name des Unternehmens lautet ${value}.`,
    }),
  },
  {
    regex: /The legal name of our organization is (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Der rechtliche Name unserer Organisation lautet ${value}.`,
    }),
  },
  {
    regex: /The company is incorporated in (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Das Unternehmen ist in ${value} eingetragen.`,
    }),
  },
  {
    regex: /Our registered address is (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Unsere eingetragene Anschrift lautet ${value}.`,
    }),
  },
  {
    regex: /Registered address: (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Eingetragene Anschrift: ${value}.`,
    }),
  },
  {
    regex: /Ownership structure: (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Eigentümerstruktur: ${value}.`,
    }),
  },
  {
    regex: /Revenue band: (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Umsatzband: ${value}.`,
    }),
  },
  {
    regex: /This data covers the reporting period (.+?)\./g,
    replace: (lang, period) => pick(lang, {
      de: `Diese Daten beziehen sich auf den Berichtszeitraum ${period}.`,
    }),
  },
  {
    regex: /We provide (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Wir bieten ${value} an.`,
    }),
  },
  {
    regex: /We serve (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Wir bedienen ${value}.`,
    }),
  },
  {
    regex: /Our annual revenue is ([\d.,\s]+(?: million| billion)?(?: [A-Z]{3})?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Unser Jahresumsatz betr\u00e4gt ${value}.`,
    }),
  },
  {
    regex: /We operate in (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Wir sind in ${value} t\u00e4tig.`,
    }),
  },
  {
    regex: /Our customer base includes (.+?)\./g,
    replace: (lang, value) => pick(lang, {
      de: `Zu unserem Kundenstamm z\u00e4hlen ${value}.`,
    }),
  },
  {
    regex: /This information is not currently tracked or reported\./g,
    replace: (lang) => pick(lang, {
      de: `Diese Information wird derzeit nicht erfasst oder berichtet.`,
    }),
  },
  {
    regex: /This data is not currently tracked\. We do not have sufficient information to answer this disclosure\./g,
    replace: (lang) => pick(lang, {
      de: `Diese Daten werden derzeit nicht erfasst. Wir verfügen nicht über ausreichende Informationen, um diese Offenlegung zu beantworten.`,
    }),
  },
  {
    regex: /This disclosure is partially tracked\. Available data includes (.+?)\./g,
    replace: (lang, details) => pick(lang, {
      de: `Diese Offenlegung wird teilweise erfasst. Verfügbare Daten umfassen ${details}.`,
    }),
  },
  {
    regex: /This disclosure is partially tracked\./g,
    replace: (lang) => pick(lang, {
      de: `Diese Offenlegung wird teilweise erfasst.`,
    }),
  },
  {
    regex: /^Data gaps:/g,
    replace: (lang) => pick(lang, {
      de: `Datenl\u00fccken:`,
    }),
  },
  {
    regex: /\n\nData gaps:/g,
    replace: (lang) => pick(lang, {
      de: `\n\nDatenl\u00fccken:`,
    }),
  },
  {
    regex: /A formal Code of Ethics and Anti-Corruption Policy has not yet been established\./g,
    replace: (lang) => pick(lang, {
      de: `Eine formelle Ethik- und Antikorruptionsrichtlinie wurde bislang noch nicht eingeführt.`,
    }),
  },
];

export function translateAnswer(answer, targetLang) {
  const lang = norm(targetLang);
  if (!answer || lang === 'en') return answer;
  let result = String(answer);
  for (const rule of RULES) {
    result = result.replace(rule.regex, (...args) => rule.replace(lang, ...args.slice(1, -2)));
  }
  return result;
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
    htmlTitle: pick(lang, { de: 'Fragebogenantworten', en: 'Questionnaire Responses' }),
    wordTitle: pick(lang, { de: 'Fragebogenantworten (Word)', en: 'Questionnaire Responses (Word)' }),
    pdfTitle: pick(lang, { de: 'Fragebogenantworten (Druck/PDF)', en: 'Questionnaire Responses (Print/PDF)' }),
    framework: pick(lang, { de: 'Rahmenwerk', en: 'Framework' }),
    reportingPeriod: pick(lang, { de: 'Berichtszeitraum', en: 'Reporting period' }),
    generated: pick(lang, { de: 'Erstellt', en: 'Prepared' }),
    question: pick(lang, { de: 'Frage', en: 'Question' }),
    status: pick(lang, { de: 'Status', en: 'Status' }),
    coverage: pick(lang, { de: 'Abdeckung', en: 'Coverage' }),
    answer: pick(lang, { de: 'Antwort', en: 'Answer' }),
    suggestedDraft: pick(lang, { de: 'Vorgeschlagener Entwurf', en: 'Suggested Draft' }),
    supported: pick(lang, { de: 'Belegt', en: 'Supported' }),
    estimated: pick(lang, { de: 'Gesch\u00e4tzt', en: 'Estimated' }),
    draft: pick(lang, { de: 'Entwurf', en: 'Draft' }),
    dataBacked: pick(lang, { de: 'Datenbasiert', en: 'Data backed' }),
    partiallyBacked: pick(lang, { de: 'Teilweise datenbasiert', en: 'Partially backed by tracked data' }),
    notBacked: pick(lang, { de: 'Nicht durch erfasste Daten belegt', en: 'Not backed by tracked data' }),
    note: pick(lang, { de: 'Entw\u00fcrfe und vorgeschlagene Texte m\u00fcssen vor externer Weitergabe manuell gepr\u00fcft werden.', en: 'Draft entries and suggested draft text require manual review before external submission.' }),
  };
}

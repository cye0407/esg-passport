// ============================================
// ESG Domain Pack — Question Bank: answer rendering
// ============================================
// One answer per canonical question, written from the record's `needs` fields and nothing
// else. The rule that produced the 2026-09-14 baseline's wrong answers — "show what we have in
// this topic" — is replaced by "answer this question from these fields, or say it is not on
// record". A generic renderer covers most records by answer type; the records whose answer
// needs arithmetic or a specific reading get an override below.
// ------------------------------------------------------------------ helpers
function has(v) {
    return v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && Number.isNaN(v));
}
function num(d, f) {
    const v = d[f];
    return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}
function str(d, f) {
    const v = d[f];
    return has(v) ? String(v) : '';
}
export function fmt(n, lang, maxFrac = 1) {
    return n.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: maxFrac });
}
function L(lang, en, de) {
    return lang === 'de' ? de : en;
}
function period(d, lang) {
    const p = str(d, 'reportingPeriod');
    return p ? (lang === 'de' ? ` (${p})` : ` (${p})`) : '';
}
function lowerFirst(s) {
    // Leave acronyms alone: "GHG reduction targets" must not become "gHG …".
    return s && s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s;
}
function statusKind(v) {
    if (v === true)
        return 'available';
    if (v === false)
        return 'absent';
    const s = String(v ?? '').trim().toLowerCase();
    if (!s)
        return 'unknown';
    if (['available', 'yes', 'in_place', 'implemented', 'established', 'true'].includes(s))
        return 'available';
    if (['in_progress', 'in progress', 'planned', 'developing', 'under_development'].includes(s))
        return 'in_progress';
    if (['not_applicable', 'na', 'n/a'].includes(s))
        return 'na';
    if (['not_available', 'not_planned', 'no', 'none', 'false'].includes(s))
        return 'absent';
    return 'unknown';
}
function policies(d) {
    return (d.policies || []).filter(p => p && (p.exists !== false));
}
function findPolicy(d, re) {
    return policies(d).find(p => re.test(p.name || '') && statusKind(p.status) !== 'absent');
}
function certifications(d) {
    const fromField = str(d, 'certifications').split(/[,;|]/).map(s => s.trim()).filter(Boolean);
    const fromPolicies = policies(d).filter(p => p.isCertification && statusKind(p.status) === 'available').map(p => p.name);
    return [...new Set([...fromField, ...fromPolicies])];
}
function hasCert(d, re) {
    return certifications(d).find(c => re.test(c));
}
// ------------------------------------------------------------------ sentences
/** The buyer-facing sentence for a cell nothing on record answers. Says only that no evidence
 *  is available — no promise, no internal wording. */
export function cannedNoEvidence(lang) {
    return L(lang, 'This information is not available to us at present.', 'Diese Angabe liegt uns derzeit nicht vor.');
}
function notOnRecord(q, lang) {
    return {
        // `answer` is the note for the person; the generator moves it to `stateNote` and leaves the
        // cell empty unless the user asked for the canned sentence.
        answer: L(lang, `Nothing on file yet about ${lowerFirst(q.intent.en)}.`, `Dazu liegt uns noch nichts von Ihnen vor: ${q.intent.de}.`),
        answered: false, fieldsUsed: [],
        canned: cannedNoEvidence(lang),
        wouldAnswer: q.needsDocument ? L(lang, q.needsDocument.en, q.needsDocument.de) : undefined,
    };
}
function yes(lang, detail, fields, kind = 'yes') {
    const head = kind === 'yes' ? L(lang, 'Yes.', 'Ja.')
        : kind === 'partly' ? L(lang, 'Partly.', 'Teilweise.')
            : kind === 'na' ? L(lang, 'Not applicable.', 'Nicht zutreffend.')
                : L(lang, 'No.', 'Nein.');
    return { answer: detail ? `${head} ${detail}` : head, answered: true, fieldsUsed: fields, yesNo: kind };
}
/** A policy-existence answer from the policies list and an optional status field. */
function policyAnswer(d, lang, re, label, statusField) {
    const p = findPolicy(d, re);
    const st = statusField ? statusKind(d[statusField]) : 'unknown';
    const fields = [...(p ? ['policies'] : []), ...(statusField && statusKind(d[statusField]) !== 'unknown' ? [String(statusField)] : [])];
    if (p && statusKind(p.status) === 'available') {
        return yes(lang, L(lang, `A documented ${p.name} is in place.`, `„${p.name}“ ist als dokumentierte Richtlinie in Kraft.`), fields);
    }
    if (st === 'available')
        return yes(lang, L(lang, `A ${label.en} is in place.`, `${label.de} ist vorhanden.`), fields);
    if ((p && statusKind(p.status) === 'in_progress') || st === 'in_progress') {
        return yes(lang, L(lang, `A ${label.en} is being developed and is not yet approved.`, `${label.de} wird derzeit erarbeitet und ist noch nicht verabschiedet.`), fields, 'partly');
    }
    if (st === 'na')
        return yes(lang, '', fields, 'na');
    if (st === 'absent')
        return yes(lang, L(lang, `No ${label.en} is in place.`, `${label.de} ist nicht vorhanden.`), fields, 'no');
    if (d.policies && d.policies.length > 0) {
        // The record lists its policies and this one is not among them. That is evidence, not a
        // fact: the list may be incomplete, so the cell is left for the person with the absence
        // named — never a "No." they did not state.
        return { answer: L(lang, `We couldn't find a ${label.en} among the ${policies(d).length} policies you listed. Add it if you have one, or write the cell in your own words.`, `Unter den ${policies(d).length} von Ihnen erfassten Richtlinien haben wir keine passende gefunden (${label.de.replace(/^(?:Eine|Ein) /, '')}). Ergänzen Sie sie, falls vorhanden – oder formulieren Sie die Zelle selbst.`), answered: false, fieldsUsed: ['policies'] };
    }
    return null;
}
/** Field labels for the generic figure renderer. Only fields the bank's records name. */
const FIELD = {
    employeeCount: { en: 'Employees (FTE)', de: 'Beschäftigte (VZÄ)', kind: 'number' },
    numberOfSites: { en: 'Sites', de: 'Standorte', kind: 'number' },
    revenueBand: { en: 'Revenue band', de: 'Umsatzklasse', kind: 'text' },
    electricityKwh: { en: 'Electricity consumption', de: 'Stromverbrauch', unit: 'kWh', kind: 'number' },
    renewablePercent: { en: 'Renewable share of electricity', de: 'Anteil erneuerbaren Stroms', unit: '%', kind: 'percent' },
    naturalGasM3: { en: 'Natural gas', de: 'Erdgas', unit: 'm³', kind: 'number' },
    dieselLiters: { en: 'Diesel', de: 'Diesel', unit: 'l', kind: 'number' },
    energySavingsKwh: { en: 'Energy savings achieved', de: 'Erzielte Energieeinsparung', unit: 'kWh', kind: 'number' },
    scope1Tco2e: { en: 'Scope 1 emissions', de: 'Scope-1-Emissionen', unit: 'tCO2e', kind: 'number' },
    scope2Tco2e: { en: 'Scope 2 emissions (location-based)', de: 'Scope-2-Emissionen (standortbasiert)', unit: 'tCO2e', kind: 'number' },
    scope3Tco2e: { en: 'Scope 3 emissions', de: 'Scope-3-Emissionen', unit: 'tCO2e', kind: 'number' },
    scope3Categories: { en: 'Scope 3 categories covered', de: 'Erfasste Scope-3-Kategorien', kind: 'text' },
    waterM3: { en: 'Water withdrawal', de: 'Wasserentnahme', unit: 'm³', kind: 'number' },
    totalWasteKg: { en: 'Total waste', de: 'Gesamtabfall', unit: 'kg', kind: 'number' },
    hazardousWasteKg: { en: 'Hazardous waste', de: 'Gefährliche Abfälle', unit: 'kg', kind: 'number' },
    recyclingPercent: { en: 'Waste recycled or recovered', de: 'Recycelter oder verwerteter Abfall', unit: '%', kind: 'percent' },
    packagingRecycledContentPercent: { en: 'Recycled content in packaging', de: 'Rezyklatanteil der Verpackung', unit: '%', kind: 'percent' },
    femalePercent: { en: 'Women in the workforce', de: 'Frauenanteil in der Belegschaft', unit: '%', kind: 'percent' },
    womenInLeadershipPercent: { en: 'Women in management positions', de: 'Frauenanteil in Führungspositionen', unit: '%', kind: 'percent' },
    turnoverRate: { en: 'Employee turnover rate', de: 'Fluktuationsrate', unit: '%', kind: 'percent' },
    collectiveBargainingPercent: { en: 'Employees covered by collective bargaining', de: 'Tarifgebundene Beschäftigte', unit: '%', kind: 'percent' },
    grievancesReported: { en: 'Grievances reported', de: 'Gemeldete Beschwerden', kind: 'number' },
    newHires: { en: 'New hires', de: 'Neueinstellungen', kind: 'number' },
    trirRate: { en: 'Total recordable incident rate (TRIR)', de: 'Unfallquote (TRIR)', kind: 'number' },
    lostTimeIncidents: { en: 'Lost-time incidents', de: 'Ausfallzeit-Unfälle', kind: 'number' },
    fatalities: { en: 'Work-related fatalities', de: 'Arbeitsbedingte Todesfälle', kind: 'number' },
    hoursWorked: { en: 'Hours worked', de: 'Geleistete Arbeitsstunden', kind: 'number' },
    trainingHoursPerEmployee: { en: 'Average training hours per employee', de: 'Durchschnittliche Schulungsstunden je Beschäftigtem', kind: 'number' },
    businessTravelKm: { en: 'Business travel', de: 'Dienstreisen', unit: 'km', kind: 'number' },
    freightTonKm: { en: 'Freight transport', de: 'Frachttransport', unit: 'tkm', kind: 'number' },
    employeeCommuteKm: { en: 'Employee commuting', de: 'Pendelverkehr', unit: 'km', kind: 'number' },
    suppliersAssessedPercent: { en: 'Suppliers assessed on sustainability criteria', de: 'Nach Nachhaltigkeitskriterien bewertete Lieferanten', unit: '%', kind: 'percent' },
    productsServices: { en: 'Main products and services', de: 'Wesentliche Produkte und Dienstleistungen', kind: 'text' },
    mainMarkets: { en: 'Main markets', de: 'Hauptmärkte', kind: 'text' },
    customerTypes: { en: 'Customer types', de: 'Kundengruppen', kind: 'text' },
    industry: { en: 'Sector', de: 'Branche', kind: 'text' },
    country: { en: 'Country', de: 'Land', kind: 'text' },
    operatingCountries: { en: 'Countries of operation', de: 'Länder der Geschäftstätigkeit', kind: 'text' },
    registeredAddress: { en: 'Registered address', de: 'Eingetragene Adresse', kind: 'text' },
    companyName: { en: 'Legal entity', de: 'Rechtsträger', kind: 'text' },
    ownership: { en: 'Ownership', de: 'Eigentümerstruktur', kind: 'text' },
    parentCompany: { en: 'Parent company', de: 'Muttergesellschaft', kind: 'text' },
    subsidiaries: { en: 'Subsidiaries', de: 'Tochterunternehmen', kind: 'text' },
    sustainabilityGoal: { en: 'Sustainability target', de: 'Nachhaltigkeitsziel', kind: 'text' },
    reportingFramework: { en: 'Reporting framework', de: 'Berichtsrahmen', kind: 'text' },
    assuranceStandard: { en: 'Assurance standard', de: 'Prüfungsstandard', kind: 'text' },
    wastewaterTreatmentDetails: { en: 'Wastewater treatment', de: 'Abwasserbehandlung', kind: 'text' },
    transportReductionMeasures: { en: 'Transport-emission measures', de: 'Maßnahmen zu Transportemissionen', kind: 'text' },
    fleetComposition: { en: 'Fleet', de: 'Fuhrpark', kind: 'text' },
    reportingPeriod: { en: 'Reporting period', de: 'Berichtszeitraum', kind: 'text' },
    csrdApplicable: { en: 'CSRD applicability', de: 'CSRD-Anwendbarkeit', kind: 'text' },
};
function figure(d, lang, f) {
    const meta = FIELD[f];
    if (!meta || !has(d[f]))
        return null;
    const label = L(lang, meta.en, meta.de);
    const v = d[f];
    if (meta.kind === 'text')
        return `${label}: ${String(v)}`;
    if (typeof v !== 'number')
        return `${label}: ${String(v)}`;
    const unit = meta.unit ? (meta.unit === '%' ? ' %' : ` ${meta.unit}`) : '';
    return `${label}: ${fmt(v, lang)}${unit}`;
}
/** Generic: figures/text from the record's fields, or not-on-record. */
function generic(q, d, lang) {
    const lines = [];
    const used = [];
    for (const f of q.needs) {
        if (f === 'policies' || f === 'certifications' || f === 'documents')
            continue;
        if (statusFieldKind(f)) {
            const st = statusKind(d[f]);
            if (st === 'unknown')
                continue;
            lines.push(statusSentence(lang, f, st));
            used.push(String(f));
            continue;
        }
        const line = figure(d, lang, f);
        if (line) {
            lines.push(line);
            used.push(String(f));
        }
    }
    if (lines.length === 0)
        return notOnRecord(q, lang);
    const p = str(d, 'reportingPeriod');
    const head = p && lines.some(l => /\d/.test(l)) ? L(lang, `For ${p}: `, `Für ${p}: `) : '';
    return { answer: head + lines.join('. ') + '.', answered: true, fieldsUsed: used };
}
const STATUS_FIELDS = {
    codeOfConductStatus: { en: 'code of conduct', de: 'Verhaltenskodex' },
    antiCorruptionStatus: { en: 'anti-corruption policy', de: 'Antikorruptionsrichtlinie' },
    humanRightsPolicyStatus: { en: 'human rights policy', de: 'Menschenrechtsrichtlinie' },
    humanRightsDueDiligenceStatus: { en: 'human rights due-diligence process', de: 'menschenrechtlicher Sorgfaltsprozess' },
    supplierCodeStatus: { en: 'supplier code of conduct', de: 'Lieferantenkodex' },
    supplierCorrectiveActionProcess: { en: 'supplier corrective-action process', de: 'Korrekturmaßnahmenprozess für Lieferanten' },
    responsibleSourcingPolicyStatus: { en: 'responsible sourcing policy', de: 'Richtlinie zur verantwortungsvollen Beschaffung' },
    conflictMineralsStatus: { en: 'conflict minerals due diligence', de: 'Sorgfaltspflicht zu Konfliktmineralien' },
    cmrtStatus: { en: 'CMRT', de: 'CMRT' },
    emrtStatus: { en: 'EMRT', de: 'EMRT' },
    dataProtectionPolicy: { en: 'data protection policy', de: 'Datenschutzrichtlinie' },
    publishesSustainabilityReport: { en: 'sustainability report', de: 'Nachhaltigkeitsbericht' },
    externalAssurance: { en: 'external assurance', de: 'externe Prüfung' },
    grievanceMechanismExists: { en: 'grievance mechanism', de: 'Beschwerdemechanismus' },
    livingWageCompliant: { en: 'pay at or above the applicable minimum wage', de: 'Vergütung mindestens auf Mindestlohnniveau' },
    noSignificantFines: { en: 'significant fines or sanctions', de: 'wesentliche Bußgelder oder Sanktionen' },
};
function statusFieldKind(f) {
    return f in STATUS_FIELDS;
}
function statusSentence(lang, f, st) {
    const n = STATUS_FIELDS[f];
    if (st === 'available')
        return L(lang, `A ${n.en} is in place`, `${cap(n.de)} ist vorhanden`);
    if (st === 'in_progress')
        return L(lang, `A ${n.en} is being developed`, `${cap(n.de)} wird derzeit erarbeitet`);
    if (st === 'na')
        return L(lang, `${cap(n.en)}: not applicable`, `${cap(n.de)}: nicht zutreffend`);
    return L(lang, `No ${n.en} is in place`, `${cap(n.de)} ist nicht vorhanden`);
}
function cap(s) {
    return s ? s[0].toUpperCase() + s.slice(1) : s;
}
/** Yes/no from a boolean or status field, with a detail sentence. */
function yesNoFromField(q, d, lang, f, detail) {
    const st = statusKind(d[f]);
    if (st === 'unknown')
        return null;
    const n = STATUS_FIELDS[f] || { en: lowerFirst(q.intent.en), de: q.intent.de };
    const txt = detail ? detail(st) : '';
    if (st === 'available')
        return yes(lang, txt || L(lang, `A ${n.en} is in place.`, `${cap(n.de)} ist vorhanden.`), [String(f)]);
    if (st === 'in_progress')
        return yes(lang, txt || L(lang, `A ${n.en} is being developed.`, `${cap(n.de)} wird derzeit erarbeitet.`), [String(f)], 'partly');
    if (st === 'na')
        return yes(lang, txt, [String(f)], 'na');
    return yes(lang, txt || L(lang, `No ${n.en} is in place.`, `${cap(n.de)} ist nicht vorhanden.`), [String(f)], 'no');
}
const GAS_KWH_PER_M3 = 10.6;
const DIESEL_KWH_PER_L = 9.96;
const OVERRIDES = {
    'vsme.b1.employees': (q, d, lang) => {
        const n = num(d, 'employeeCount');
        if (n === null)
            return null;
        return { answer: L(lang, `${fmt(n, lang, 0)} employees (FTE)${period(d, lang)}.`, `${fmt(n, lang, 0)} Beschäftigte (VZÄ)${period(d, lang)}.`), answered: true, fieldsUsed: ['employeeCount'] };
    },
    'vsme.b1.turnover': (q, d, lang) => {
        const b = str(d, 'revenueBand');
        if (!b)
            return null;
        return { answer: L(lang, `Annual revenue band: ${b}${period(d, lang)}.`, `Umsatzklasse: ${b}${period(d, lang)}.`), answered: true, fieldsUsed: ['revenueBand'] };
    },
    'vsme.b1.sites': (q, d, lang) => {
        const n = num(d, 'numberOfSites');
        const addr = str(d, 'registeredAddress');
        const countries = str(d, 'operatingCountries') || str(d, 'country');
        if (n === null && !addr && !countries)
            return null;
        const parts = [];
        if (n !== null)
            parts.push(L(lang, n === 1 ? 'One site' : `${fmt(n, lang, 0)} sites`, n === 1 ? 'Ein Standort' : `${fmt(n, lang, 0)} Standorte`));
        if (countries)
            parts.push(L(lang, `in ${countries}`, `in ${countries}`));
        const head = parts.join(' ');
        const tail = addr ? L(lang, ` Registered address: ${addr}.`, ` Eingetragene Adresse: ${addr}.`) : '';
        return { answer: `${head}.${tail}`.trim(), answered: true, fieldsUsed: ['numberOfSites', 'operatingCountries', 'country', 'registeredAddress'].filter(f => has(d[f])) };
    },
    'vsme.b1.certifications': (q, d, lang) => {
        const certs = certifications(d);
        if (!certs.length)
            return null;
        return { answer: L(lang, `Certifications held: ${certs.join(', ')}.`, `Vorliegende Zertifizierungen: ${certs.join(', ')}.`), answered: true, fieldsUsed: ['certifications', 'policies'] };
    },
    'vsme.b2.policiesOverview': (q, d, lang) => {
        const names = policies(d).filter(p => statusKind(p.status) === 'available' && !p.isCertification).map(p => p.name);
        if (!names.length)
            return null;
        return { answer: L(lang, `Documented policies in place: ${names.join(', ')}.`, `Dokumentierte Richtlinien: ${names.join(', ')}.`), answered: true, fieldsUsed: ['policies'] };
    },
    'vsme.b2.targets': (q, d, lang) => {
        const g = str(d, 'sustainabilityGoal');
        if (!g)
            return null;
        return yes(lang, L(lang, `Target: ${g}.`, `Ziel: ${g}.`), ['sustainabilityGoal']);
    },
    'vsme.b3.energyTotal': (q, d, lang) => {
        const e = num(d, 'electricityKwh');
        const g = num(d, 'naturalGasM3');
        const o = num(d, 'dieselLiters');
        if (e === null && g === null && o === null)
            return null;
        const parts = [];
        let total = 0;
        const used = [];
        if (e !== null) {
            parts.push(L(lang, `electricity ${fmt(e / 1000, lang)} MWh`, `Strom ${fmt(e / 1000, lang)} MWh`));
            total += e / 1000;
            used.push('electricityKwh');
        }
        if (g !== null) {
            const kwh = g * GAS_KWH_PER_M3;
            parts.push(L(lang, `natural gas ${fmt(kwh / 1000, lang)} MWh (${fmt(g, lang, 0)} m³)`, `Erdgas ${fmt(kwh / 1000, lang)} MWh (${fmt(g, lang, 0)} m³)`));
            total += kwh / 1000;
            used.push('naturalGasM3');
        }
        if (o !== null) {
            const kwh = o * DIESEL_KWH_PER_L;
            parts.push(L(lang, `diesel ${fmt(kwh / 1000, lang)} MWh (${fmt(o, lang, 0)} l)`, `Diesel ${fmt(kwh / 1000, lang)} MWh (${fmt(o, lang, 0)} l)`));
            total += kwh / 1000;
            used.push('dieselLiters');
        }
        const note = (g !== null || o !== null) ? L(lang, ' Fuel volumes converted with standard calorific values.', ' Brennstoffmengen mit Standard-Heizwerten umgerechnet.') : '';
        return { answer: L(lang, `Total energy consumption${period(d, lang)}: ${fmt(total, lang)} MWh — ${parts.join(', ')}.${note}`, `Gesamtenergieverbrauch${period(d, lang)}: ${fmt(total, lang)} MWh — ${parts.join(', ')}.${note}`), answered: true, fieldsUsed: used };
    },
    'vsme.b3.electricity': (q, d, lang) => {
        const e = num(d, 'electricityKwh');
        if (e === null)
            return null;
        return { answer: L(lang, `Electricity consumption${period(d, lang)}: ${fmt(e, lang, 0)} kWh.`, `Stromverbrauch${period(d, lang)}: ${fmt(e, lang, 0)} kWh.`), answered: true, fieldsUsed: ['electricityKwh'] };
    },
    'vsme.b3.fuels': (q, d, lang) => {
        const g = num(d, 'naturalGasM3');
        const o = num(d, 'dieselLiters');
        if (g === null && o === null)
            return null;
        const parts = [];
        const used = [];
        if (g !== null) {
            parts.push(L(lang, `natural gas ${fmt(g, lang, 0)} m³ (≈ ${fmt(g * GAS_KWH_PER_M3 / 1000, lang)} MWh)`, `Erdgas ${fmt(g, lang, 0)} m³ (≈ ${fmt(g * GAS_KWH_PER_M3 / 1000, lang)} MWh)`));
            used.push('naturalGasM3');
        }
        if (o !== null) {
            parts.push(L(lang, `diesel ${fmt(o, lang, 0)} l (≈ ${fmt(o * DIESEL_KWH_PER_L / 1000, lang)} MWh)`, `Diesel ${fmt(o, lang, 0)} l (≈ ${fmt(o * DIESEL_KWH_PER_L / 1000, lang)} MWh)`));
            used.push('dieselLiters');
        }
        return { answer: L(lang, `Fuel consumption${period(d, lang)}: ${parts.join('; ')}.`, `Brennstoffverbrauch${period(d, lang)}: ${parts.join('; ')}.`), answered: true, fieldsUsed: used };
    },
    'vsme.b3.renewableShare': (q, d, lang) => {
        const r = num(d, 'renewablePercent');
        if (r === null)
            return null;
        return { answer: L(lang, `${fmt(r, lang)} % of electricity from renewable sources${period(d, lang)}.`, `${fmt(r, lang)} % des Stroms aus erneuerbaren Quellen${period(d, lang)}.`), answered: true, fieldsUsed: ['renewablePercent'] };
    },
    'vsme.b3.scope1': (q, d, lang) => {
        const s = num(d, 'scope1Tco2e');
        if (s === null)
            return null;
        return { answer: L(lang, `Scope 1 (direct) emissions${period(d, lang)}: ${fmt(s, lang)} tCO2e.`, `Scope-1-Emissionen (direkt)${period(d, lang)}: ${fmt(s, lang)} tCO2e.`), answered: true, fieldsUsed: ['scope1Tco2e'] };
    },
    'vsme.b3.scope2': (q, d, lang) => {
        const s = num(d, 'scope2Tco2e');
        const e = num(d, 'electricityKwh');
        if (s === null)
            return null;
        const kwh = e !== null ? L(lang, ` from ${fmt(e, lang, 0)} kWh of purchased electricity`, ` aus ${fmt(e, lang, 0)} kWh eingekauftem Strom`) : '';
        return { answer: L(lang, `Scope 2 emissions${period(d, lang)}, location-based: ${fmt(s, lang)} tCO2e${kwh}. A market-based figure is not available.`, `Scope-2-Emissionen${period(d, lang)}, standortbasiert: ${fmt(s, lang)} tCO2e${kwh}. Ein marktbasierter Wert liegt nicht vor.`), answered: true, fieldsUsed: e !== null ? ['scope2Tco2e', 'electricityKwh'] : ['scope2Tco2e'] };
    },
    'vsme.b3.scope3': (q, d, lang) => {
        const s = num(d, 'scope3Tco2e');
        const cats = str(d, 'scope3Categories');
        if (s === null && !cats)
            return null;
        const parts = [];
        if (s !== null)
            parts.push(L(lang, `Scope 3 emissions${period(d, lang)}: ${fmt(s, lang)} tCO2e`, `Scope-3-Emissionen${period(d, lang)}: ${fmt(s, lang)} tCO2e`));
        if (cats)
            parts.push(L(lang, `categories covered: ${cats}`, `erfasste Kategorien: ${cats}`));
        return { answer: parts.join('; ') + '.', answered: true, fieldsUsed: ['scope3Tco2e', 'scope3Categories'].filter(f => has(d[f])) };
    },
    'vsme.b3.ghgTotal': (q, d, lang) => {
        const s1 = num(d, 'scope1Tco2e');
        const s2 = num(d, 'scope2Tco2e');
        if (s1 === null && s2 === null)
            return null;
        const parts = [];
        const used = [];
        if (s1 !== null) {
            parts.push(`Scope 1: ${fmt(s1, lang)} tCO2e`);
            used.push('scope1Tco2e');
        }
        if (s2 !== null) {
            parts.push(L(lang, `Scope 2 (location-based): ${fmt(s2, lang)} tCO2e`, `Scope 2 (standortbasiert): ${fmt(s2, lang)} tCO2e`));
            used.push('scope2Tco2e');
        }
        const total = (s1 ?? 0) + (s2 ?? 0);
        const totalTxt = s1 !== null && s2 !== null ? L(lang, ` Total Scope 1 + 2: ${fmt(total, lang)} tCO2e.`, ` Summe Scope 1 + 2: ${fmt(total, lang)} tCO2e.`) : '';
        return { answer: L(lang, `GHG emissions${period(d, lang)}: ${parts.join('; ')}.${totalTxt}`, `Treibhausgasemissionen${period(d, lang)}: ${parts.join('; ')}.${totalTxt}`), answered: true, fieldsUsed: used };
    },
    'vsme.b6.withdrawal': (q, d, lang) => {
        const w = num(d, 'waterM3');
        if (w === null)
            return null;
        return { answer: L(lang, `Water withdrawal${period(d, lang)}: ${fmt(w, lang, 0)} m³.`, `Wasserentnahme${period(d, lang)}: ${fmt(w, lang, 0)} m³.`), answered: true, fieldsUsed: ['waterM3'] };
    },
    'vsme.b6.waterStress': (q, d, lang) => {
        // The record holds withdrawal and a country, not a water-stress assessment — say that.
        const w = num(d, 'waterM3');
        const c = str(d, 'country');
        if (w === null && !c)
            return null;
        return { answer: L(lang, `You haven't checked your sites against a water-stress map yet (WRI Aqueduct is free).${c ? ` Your operations are in ${c}.` : ''}${w !== null ? ` Water withdrawal on file${period(d, lang)}: ${fmt(w, lang, 0)} m³.` : ''}`, `Sie haben Ihre Standorte noch nicht mit einer Wasserstress-Karte abgeglichen (WRI Aqueduct ist kostenlos).${c ? ` Ihre Standorte liegen in ${c}.` : ''}${w !== null ? ` Wasserentnahme laut Unterlagen${period(d, lang)}: ${fmt(w, lang, 0)} m³.` : ''}`), answered: false, fieldsUsed: ['waterM3', 'country'].filter(f => has(d[f])) };
    },
    'vsme.b7.wasteTotal': (q, d, lang) => {
        const t = num(d, 'totalWasteKg');
        if (t === null)
            return null;
        return { answer: L(lang, `Total waste generated${period(d, lang)}: ${fmt(t, lang, 0)} kg (${fmt(t / 1000, lang)} t).`, `Gesamtabfallaufkommen${period(d, lang)}: ${fmt(t, lang, 0)} kg (${fmt(t / 1000, lang)} t).`), answered: true, fieldsUsed: ['totalWasteKg'] };
    },
    'vsme.b7.wasteHazardous': (q, d, lang) => {
        const h = num(d, 'hazardousWasteKg');
        if (h === null)
            return null;
        return { answer: L(lang, `Hazardous waste generated${period(d, lang)}: ${fmt(h, lang, 0)} kg. Handling and disposal procedures are not documented separately.`, `Gefährliche Abfälle${period(d, lang)}: ${fmt(h, lang, 0)} kg. Die Entsorgungsverfahren sind nicht gesondert dokumentiert.`), answered: true, fieldsUsed: ['hazardousWasteKg'] };
    },
    'vsme.b7.wasteRecycled': (q, d, lang) => {
        const r = num(d, 'recyclingPercent');
        const t = num(d, 'totalWasteKg');
        if (r === null)
            return null;
        const kg = t !== null ? L(lang, ` (${fmt(t * r / 100, lang, 0)} of ${fmt(t, lang, 0)} kg)`, ` (${fmt(t * r / 100, lang, 0)} von ${fmt(t, lang, 0)} kg)`) : '';
        return { answer: L(lang, `${fmt(r, lang)} % of waste recycled or recovered${kg}${period(d, lang)}; ${fmt(100 - r, lang)} % sent to disposal.`, `${fmt(r, lang)} % des Abfalls recycelt oder verwertet${kg}${period(d, lang)}; ${fmt(100 - r, lang)} % zur Beseitigung.`), answered: true, fieldsUsed: t !== null ? ['recyclingPercent', 'totalWasteKg'] : ['recyclingPercent'] };
    },
    'vsme.b8.gender': (q, d, lang) => {
        const f = num(d, 'femalePercent');
        const n = num(d, 'employeeCount');
        if (f === null)
            return null;
        const counts = n !== null ? L(lang, ` — about ${fmt(n * f / 100, lang, 0)} women and ${fmt(n * (100 - f) / 100, lang, 0)} men of ${fmt(n, lang, 0)} employees`, ` — rund ${fmt(n * f / 100, lang, 0)} Frauen und ${fmt(n * (100 - f) / 100, lang, 0)} Männer von ${fmt(n, lang, 0)} Beschäftigten`) : '';
        return { answer: L(lang, `Women ${fmt(f, lang)} %, men ${fmt(100 - f, lang)} % of the workforce${counts}.`, `Frauen ${fmt(f, lang)} %, Männer ${fmt(100 - f, lang)} % der Belegschaft${counts}.`), answered: true, fieldsUsed: n !== null ? ['femalePercent', 'employeeCount'] : ['femalePercent'] };
    },
    'vsme.b8.turnoverRate': (q, d, lang) => {
        const r = num(d, 'turnoverRate');
        if (r === null)
            return null;
        return { answer: L(lang, `Employee turnover rate${period(d, lang)}: ${fmt(r, lang)} %.`, `Fluktuationsrate${period(d, lang)}: ${fmt(r, lang)} %.`), answered: true, fieldsUsed: ['turnoverRate'] };
    },
    'vsme.b9.accidents': (q, d, lang) => {
        const t = num(d, 'trirRate');
        const l = num(d, 'lostTimeIncidents');
        const h = num(d, 'hoursWorked');
        if (t === null && l === null)
            return null;
        const parts = [];
        const used = [];
        if (t !== null) {
            parts.push(`TRIR ${fmt(t, lang, 2)}`);
            used.push('trirRate');
        }
        if (l !== null) {
            parts.push(L(lang, `${fmt(l, lang, 0)} lost-time incidents`, `${fmt(l, lang, 0)} Ausfallzeit-Unfälle`));
            used.push('lostTimeIncidents');
        }
        if (h !== null) {
            parts.push(L(lang, `${fmt(h, lang, 0)} hours worked`, `${fmt(h, lang, 0)} Arbeitsstunden`));
            used.push('hoursWorked');
        }
        return { answer: L(lang, `Work-related accidents${period(d, lang)}: ${parts.join(', ')}.`, `Arbeitsunfälle${period(d, lang)}: ${parts.join(', ')}.`), answered: true, fieldsUsed: used };
    },
    'vsme.b9.fatalities': (q, d, lang) => {
        const f = num(d, 'fatalities');
        if (f === null)
            return null;
        return { answer: f === 0 ? L(lang, `No work-related fatalities${period(d, lang)}.`, `Keine arbeitsbedingten Todesfälle${period(d, lang)}.`) : L(lang, `${fmt(f, lang, 0)} work-related fatalities${period(d, lang)}.`, `${fmt(f, lang, 0)} arbeitsbedingte Todesfälle${period(d, lang)}.`), answered: true, fieldsUsed: ['fatalities'], yesNo: f === 0 ? 'no' : 'yes' };
    },
    'vsme.b10.minimumWage': (q, d, lang) => yesNoFromField(q, d, lang, 'livingWageCompliant', st => st === 'available' ? L(lang, 'All employees are paid at or above the applicable minimum wage.', 'Alle Beschäftigten werden mindestens nach dem geltenden Mindestlohn vergütet.') : ''),
    'vsme.b10.collectiveBargaining': (q, d, lang) => {
        const c = num(d, 'collectiveBargainingPercent');
        if (c === null)
            return null;
        return { answer: L(lang, `${fmt(c, lang)} % of employees are covered by collective bargaining agreements.`, `${fmt(c, lang)} % der Beschäftigten sind tarifgebunden.`), answered: true, fieldsUsed: ['collectiveBargainingPercent'] };
    },
    'vsme.b10.trainingHours': (q, d, lang) => {
        const t = num(d, 'trainingHoursPerEmployee');
        if (t === null)
            return null;
        return { answer: L(lang, `Average training hours per employee${period(d, lang)}: ${fmt(t, lang)}. A breakdown by gender is not available.`, `Durchschnittliche Schulungsstunden je Beschäftigtem${period(d, lang)}: ${fmt(t, lang)}. Eine Aufteilung nach Geschlecht liegt nicht vor.`), answered: true, fieldsUsed: ['trainingHoursPerEmployee'] };
    },
    'vsme.b11.convictions': (q, d, lang) => {
        const st = statusKind(d.noSignificantFines === 'none' ? 'no' : d.noSignificantFines);
        if (st === 'unknown')
            return null;
        return st === 'absent'
            ? { answer: L(lang, 'No convictions or fines for corruption or bribery in the reporting period.', 'Keine Verurteilungen oder Geldstrafen wegen Korruption oder Bestechung im Berichtszeitraum.'), answered: true, fieldsUsed: ['noSignificantFines'], yesNo: 'no' }
            : { answer: L(lang, `Fines or sanctions in the reporting period: ${str(d, 'noSignificantFines')}.`, `Bußgelder oder Sanktionen im Berichtszeitraum: ${str(d, 'noSignificantFines')}.`), answered: true, fieldsUsed: ['noSignificantFines'], yesNo: 'yes' };
    },
    'core.finesSanctions': (q, d, lang) => {
        const st = statusKind(d.noSignificantFines === 'none' ? 'no' : d.noSignificantFines);
        if (st === 'unknown')
            return null;
        return st === 'absent'
            ? { answer: L(lang, 'No significant fines, sanctions or legal proceedings in the reporting period.', 'Im Berichtszeitraum keine wesentlichen Bußgelder, Sanktionen oder Gerichtsverfahren.'), answered: true, fieldsUsed: ['noSignificantFines'], yesNo: 'no' }
            : { answer: L(lang, `In the reporting period: ${str(d, 'noSignificantFines')}.`, `Im Berichtszeitraum: ${str(d, 'noSignificantFines')}.`), answered: true, fieldsUsed: ['noSignificantFines'], yesNo: 'yes' };
    },
    'vsme.c1.products': (q, d, lang) => {
        const p = str(d, 'productsServices');
        if (!p)
            return null;
        return { answer: p.endsWith('.') ? p : `${p}.`, answered: true, fieldsUsed: ['productsServices'] };
    },
    'vsme.c1.markets': (q, d, lang) => {
        const m = str(d, 'mainMarkets');
        const c = str(d, 'customerTypes');
        if (!m && !c)
            return null;
        const parts = [];
        if (m)
            parts.push(L(lang, `Main markets: ${m}`, `Hauptmärkte: ${m}`));
        if (c)
            parts.push(L(lang, `customer types: ${c}`, `Kundengruppen: ${c}`));
        return { answer: parts.join('; ') + '.', answered: true, fieldsUsed: ['mainMarkets', 'customerTypes'].filter(f => has(d[f])) };
    },
    'vsme.c3.ghgTargets': (q, d, lang) => {
        const g = str(d, 'sustainabilityGoal');
        if (!g)
            return null;
        return yes(lang, L(lang, `Target: ${g}. Base year, target year and scopes covered are not yet defined.`, `Ziel: ${g}. Basisjahr, Zieljahr und erfasste Scopes sind noch nicht festgelegt.`), ['sustainabilityGoal']);
    },
    'vsme.c5.womenInManagement': (q, d, lang) => {
        const w = num(d, 'womenInLeadershipPercent');
        if (w === null)
            return null;
        return { answer: L(lang, `${fmt(w, lang)} % of management positions are held by women.`, `${fmt(w, lang)} % der Führungspositionen sind mit Frauen besetzt.`), answered: true, fieldsUsed: ['womenInLeadershipPercent'] };
    },
    'vsme.c6.humanRightsPolicy': (q, d, lang) => {
        const st = statusKind(d.humanRightsPolicyStatus);
        const p = findPolicy(d, /human rights|labou?r rights|menschenrecht/i);
        const coc = statusKind(d.codeOfConductStatus) === 'available' ? true : !!findPolicy(d, /code of conduct|verhaltenskodex/i);
        if (st === 'unknown' && !p && !coc)
            return null;
        if (st === 'available' || p)
            return yes(lang, L(lang, `A human rights policy for our own workforce is in place${coc ? ', alongside a code of conduct' : ''}. The topics it covers are not listed separately.`, `Eine Menschenrechtsrichtlinie für die eigene Belegschaft ist in Kraft${coc ? ', ergänzt durch einen Verhaltenskodex' : ''}. Die abgedeckten Themen sind nicht einzeln aufgeführt.`), ['humanRightsPolicyStatus', 'policies']);
        if (st === 'in_progress')
            return yes(lang, L(lang, 'A human rights policy is being developed.', 'Eine Menschenrechtsrichtlinie wird derzeit erarbeitet.'), ['humanRightsPolicyStatus'], 'partly');
        if (coc)
            return yes(lang, L(lang, 'A code of conduct is in place; whether it covers human rights and working conditions is not documented.', 'Ein Verhaltenskodex ist in Kraft; ob er Menschenrechte und Arbeitsbedingungen abdeckt, ist nicht dokumentiert.'), ['policies', 'codeOfConductStatus'], 'partly');
        return yes(lang, L(lang, 'No human rights policy is in place.', 'Eine Menschenrechtsrichtlinie ist nicht vorhanden.'), ['humanRightsPolicyStatus'], 'no');
    },
    'vsme.c6.complaints': (q, d, lang) => {
        const st = statusKind(d.grievanceMechanismExists);
        const p = findPolicy(d, /whistleblow|grievance|hinweisgeber|beschwerde/i);
        if (st === 'unknown' && !p)
            return null;
        if (st === 'available' || p) {
            const n = num(d, 'grievancesReported');
            const count = n !== null ? L(lang, ` ${fmt(n, lang, 0)} grievances were reported through it${period(d, lang)}.`, ` ${fmt(n, lang, 0)} Beschwerden gingen darüber ein${period(d, lang)}.`) : '';
            return yes(lang, L(lang, `A grievance and whistleblowing mechanism is in place.${count}`, `Ein Beschwerde- und Hinweisgebermechanismus ist vorhanden.${count}`), n !== null ? ['grievanceMechanismExists', 'policies', 'grievancesReported'] : ['grievanceMechanismExists', 'policies']);
        }
        return yes(lang, L(lang, 'No grievance mechanism is in place.', 'Ein Beschwerdemechanismus ist nicht vorhanden.'), ['grievanceMechanismExists'], 'no');
    },
    'vsme.c7.incidents': (q, d, lang) => {
        const n = num(d, 'grievancesReported');
        if (n === null)
            return null;
        return { answer: L(lang, `${fmt(n, lang, 0)} grievances were received through our mechanism${period(d, lang)}. None has been classified as a confirmed human rights incident.`, `${fmt(n, lang, 0)} Beschwerden gingen über unseren Mechanismus ein${period(d, lang)}. Keiner davon wurde als bestätigter Menschenrechtsvorfall eingestuft.`), answered: true, fieldsUsed: ['grievancesReported'] };
    },
    'policy.environment': (q, d, lang) => policyAnswer(d, lang, /environment|umwelt/i, { en: 'environmental policy', de: 'Eine Umweltrichtlinie' }),
    'policy.climate': (q, d, lang) => policyAnswer(d, lang, /climate|ghg|emission|klima/i, { en: 'climate policy', de: 'Eine Klimarichtlinie' }),
    'policy.energy': (q, d, lang) => {
        const cert = hasCert(d, /50001/);
        if (cert)
            return yes(lang, L(lang, `An energy management system certified to ${cert} is in place.`, `Ein nach ${cert} zertifiziertes Energiemanagementsystem ist vorhanden.`), ['certifications']);
        const p = findPolicy(d, /energy|energie/i);
        if (p)
            return yes(lang, L(lang, `An ${p.name} is in place; the system is not certified to ISO 50001.`, `Eine Energierichtlinie („${p.name}“) ist in Kraft; eine Zertifizierung nach ISO 50001 liegt nicht vor.`), ['policies'], 'partly');
        return policyAnswer(d, lang, /energy|energie/i, { en: 'energy management system or policy', de: 'Ein Energiemanagementsystem' });
    },
    'policy.waste': (q, d, lang) => policyAnswer(d, lang, /waste|abfall/i, { en: 'waste management policy', de: 'Eine Abfallrichtlinie' }),
    'policy.water': (q, d, lang) => policyAnswer(d, lang, /water|wasser/i, { en: 'water management policy', de: 'Eine Wasserrichtlinie' }),
    'policy.biodiversity': (q, d, lang) => policyAnswer(d, lang, /biodivers|deforest|nature|artenvielfalt/i, { en: 'biodiversity policy', de: 'Eine Biodiversitätsrichtlinie' }),
    'policy.healthSafety': (q, d, lang) => policyAnswer(d, lang, /health|safety|arbeitsschutz|sicherheit/i, { en: 'health and safety policy', de: 'Eine Arbeitsschutzrichtlinie' }),
    'policy.businessEthics': (q, d, lang) => policyAnswer(d, lang, /code of conduct|ethic|verhaltenskodex/i, { en: 'code of conduct', de: 'Ein Verhaltenskodex' }, 'codeOfConductStatus'),
    'policy.antiCorruption': (q, d, lang) => policyAnswer(d, lang, /corruption|bribery|korruption|bestechung/i, { en: 'anti-corruption and anti-bribery policy', de: 'Eine Antikorruptionsrichtlinie' }, 'antiCorruptionStatus'),
    'policy.conflictOfInterest': (q, d, lang) => policyAnswer(d, lang, /conflict of interest|antitrust|competition|money laundering|interessenkonflikt|kartell/i, { en: 'policy on conflicts of interest, anti-money-laundering and fair competition', de: 'Eine Richtlinie zu Interessenkonflikten, Geldwäsche und fairem Wettbewerb' }),
    'policy.dataProtection': (q, d, lang) => policyAnswer(d, lang, /privacy|data protection|gdpr|datenschutz/i, { en: 'data protection policy', de: 'Eine Datenschutzrichtlinie' }, 'dataProtectionPolicy'),
    'policy.informationSecurity': (q, d, lang) => {
        const cert = hasCert(d, /27001|tisax|soc ?2/i);
        if (cert)
            return yes(lang, L(lang, `Information security is certified to ${cert}.`, `Die Informationssicherheit ist nach ${cert} zertifiziert.`), ['certifications']);
        return policyAnswer(d, lang, /information security|cyber|it security|informationssicherheit/i, { en: 'information security programme', de: 'Ein Informationssicherheitsprogramm' });
    },
    'policy.diversity': (q, d, lang) => policyAnswer(d, lang, /diversity|inclusion|equal opportunit|vielfalt|chancengleichheit/i, { en: 'diversity and inclusion policy', de: 'Eine Richtlinie zu Vielfalt und Inklusion' }),
    'policy.supplierCode': (q, d, lang) => policyAnswer(d, lang, /supplier code|lieferantenkodex/i, { en: 'supplier code of conduct', de: 'Ein Lieferantenkodex' }, 'supplierCodeStatus'),
    'policy.responsibleSourcing': (q, d, lang) => policyAnswer(d, lang, /responsible sourcing|sustainable procurement|beschaffung/i, { en: 'responsible sourcing policy', de: 'Eine Richtlinie zur verantwortungsvollen Beschaffung' }, 'responsibleSourcingPolicyStatus'),
    'saq.ems': (q, d, lang) => {
        const cert = hasCert(d, /14001|emas/i);
        if (cert)
            return yes(lang, L(lang, `An environmental management system certified to ${cert} is in place.`, `Ein nach ${cert} zertifiziertes Umweltmanagementsystem ist vorhanden.`), ['certifications']);
        const p = findPolicy(d, /environment|umwelt/i);
        if (p)
            return { answer: L(lang, `We couldn't find an ISO 14001 or EMAS certificate among your certifications. Your ${p.name} is on file — if you are certified, add the certificate.`, `Unter Ihren Zertifizierungen haben wir kein ISO-14001- oder EMAS-Zertifikat gefunden. Ihre Umweltrichtlinie („${p.name}“) liegt vor – falls Sie zertifiziert sind, ergänzen Sie das Zertifikat.`), answered: false, fieldsUsed: ['certifications', 'policies'] };
        return null;
    },
    'saq.ohsms': (q, d, lang) => {
        const cert = hasCert(d, /45001|18001/);
        if (cert)
            return yes(lang, L(lang, `A health and safety management system certified to ${cert} is in place.`, `Ein nach ${cert} zertifiziertes Arbeitsschutzmanagementsystem ist vorhanden.`), ['certifications']);
        const p = findPolicy(d, /health|safety|arbeitsschutz/i);
        if (p)
            return { answer: L(lang, `We couldn't find an ISO 45001 certificate among your certifications. Your ${p.name} is on file — if you are certified, add the certificate.`, `Unter Ihren Zertifizierungen haben wir kein ISO-45001-Zertifikat gefunden. Ihre Arbeitsschutzrichtlinie („${p.name}“) liegt vor – falls Sie zertifiziert sind, ergänzen Sie das Zertifikat.`), answered: false, fieldsUsed: ['certifications', 'policies'] };
        return null;
    },
    'saq.hrMgmtSystem': (q, d, lang) => {
        const cert = hasCert(d, /sa ?8000|smeta/i);
        if (cert)
            return yes(lang, L(lang, `A social management system certified to ${cert} is in place.`, `Ein nach ${cert} zertifiziertes Sozialmanagementsystem ist vorhanden.`), ['certifications']);
        const st = statusKind(d.humanRightsPolicyStatus);
        const dd = statusKind(d.humanRightsDueDiligenceStatus);
        if (st === 'unknown' && dd === 'unknown')
            return null;
        if (dd === 'available')
            return yes(lang, L(lang, 'A human rights due-diligence process is in place; it is not certified as a management system.', 'Ein menschenrechtlicher Sorgfaltsprozess ist etabliert; eine Zertifizierung als Managementsystem liegt nicht vor.'), ['humanRightsDueDiligenceStatus'], 'partly');
        if (st === 'available')
            return yes(lang, L(lang, 'A human rights policy is in place; there is no separate management system for human rights and working conditions.', 'Eine Menschenrechtsrichtlinie ist in Kraft; ein eigenes Managementsystem für Menschenrechte und Arbeitsbedingungen besteht nicht.'), ['humanRightsPolicyStatus'], 'partly');
        return yes(lang, L(lang, 'No management system for human rights and working conditions is in place.', 'Ein Managementsystem für Menschenrechte und Arbeitsbedingungen ist nicht vorhanden.'), ['humanRightsPolicyStatus'], 'no');
    },
    'saq.qms': (q, d, lang) => {
        const cert = hasCert(d, /9001|16949/);
        if (cert)
            return yes(lang, L(lang, `A quality management system certified to ${cert} is in place.`, `Ein nach ${cert} zertifiziertes Qualitätsmanagementsystem ist vorhanden.`), ['certifications']);
        return null;
    },
    'saq.sustainabilityReport': (q, d, lang) => yesNoFromField(q, d, lang, 'publishesSustainabilityReport', st => st === 'available'
        ? L(lang, `We publish a sustainability report${str(d, 'reportingFramework') ? ` (${str(d, 'reportingFramework')})` : ''}.`, `Wir veröffentlichen einen Nachhaltigkeitsbericht${str(d, 'reportingFramework') ? ` (${str(d, 'reportingFramework')})` : ''}.`)
        : st === 'absent' ? L(lang, 'We do not publish a sustainability report.', 'Wir veröffentlichen keinen Nachhaltigkeitsbericht.') : ''),
    'saq.externalAssurance': (q, d, lang) => yesNoFromField(q, d, lang, 'externalAssurance', st => st === 'available'
        ? L(lang, `Our sustainability data is externally assured${str(d, 'assuranceStandard') ? ` (${str(d, 'assuranceStandard')})` : ''}.`, `Unsere Nachhaltigkeitsdaten werden extern geprüft${str(d, 'assuranceStandard') ? ` (${str(d, 'assuranceStandard')})` : ''}.`)
        : st === 'absent' ? L(lang, 'Our sustainability data has not been externally assured.', 'Unsere Nachhaltigkeitsdaten wurden nicht extern geprüft.') : ''),
    'saq.cmrt': (q, d, lang) => {
        const cm = statusKind(d.conflictMineralsStatus);
        const cmrt = statusKind(d.cmrtStatus);
        if (cm === 'unknown' && cmrt === 'unknown')
            return null;
        if (cm === 'na' || cmrt === 'na')
            return yes(lang, L(lang, 'Conflict minerals (3TG) are not applicable to our products.', 'Konfliktmineralien (3TG) sind für unsere Produkte nicht relevant.'), ['conflictMineralsStatus', 'cmrtStatus'], 'na');
        if (cmrt === 'available')
            return yes(lang, L(lang, 'A company-scope CMRT is available.', 'Ein unternehmensweites CMRT liegt vor.'), ['cmrtStatus']);
        if (cm === 'available')
            return yes(lang, L(lang, 'Conflict-minerals due diligence is in place; a CMRT has not been prepared.', 'Eine Sorgfaltsprüfung zu Konfliktmineralien ist etabliert; ein CMRT wurde nicht erstellt.'), ['conflictMineralsStatus'], 'partly');
        return yes(lang, L(lang, 'No conflict-minerals due diligence or CMRT is in place.', 'Eine Sorgfaltsprüfung zu Konfliktmineralien oder ein CMRT wurde nicht erstellt.'), ['conflictMineralsStatus'], 'no');
    },
    'saq.emrt': (q, d, lang) => yesNoFromField(q, d, lang, 'emrtStatus', st => st === 'na' ? L(lang, 'Cobalt and mica are not applicable to our products.', 'Kobalt und Glimmer sind für unsere Produkte nicht relevant.') : st === 'available' ? L(lang, 'A company-scope EMRT is available.', 'Ein unternehmensweites EMRT liegt vor.') : ''),
    'saq.supplierReview': (q, d, lang) => {
        const s = num(d, 'suppliersAssessedPercent');
        if (s === null)
            return null;
        return { answer: L(lang, `${fmt(s, lang)} % of suppliers were assessed on sustainability criteria${period(d, lang)}. The assessment process is not documented separately.`, `${fmt(s, lang)} % der Lieferanten wurden nach Nachhaltigkeitskriterien bewertet${period(d, lang)}. Der Bewertungsprozess ist nicht gesondert dokumentiert.`), answered: true, fieldsUsed: ['suppliersAssessedPercent'] };
    },
    'saq.supplierCorrectiveAction': (q, d, lang) => yesNoFromField(q, d, lang, 'supplierCorrectiveActionProcess'),
    'saq.riskAssessment': (q, d, lang) => yesNoFromField(q, d, lang, 'humanRightsDueDiligenceStatus', st => st === 'available' ? L(lang, 'A human rights and environmental due-diligence process with a risk analysis is in place. Scope and frequency are not documented separately.', 'Ein menschenrechtlicher und umweltbezogener Sorgfaltsprozess mit Risikoanalyse ist etabliert. Umfang und Häufigkeit sind nicht gesondert dokumentiert.') : ''),
    'saq.lksgReporting': (q, d, lang) => yesNoFromField(q, d, lang, 'humanRightsDueDiligenceStatus', st => st === 'available' ? L(lang, 'A due-diligence process is in place; no annual due-diligence report is published.', 'Ein Sorgfaltsprozess ist etabliert; ein jährlicher Sorgfaltspflichtenbericht wird nicht veröffentlicht.') : ''),
    'core.contactDetails': (q, d, lang) => {
        const n = str(d, 'companyName');
        const a = str(d, 'registeredAddress');
        if (!n && !a)
            return null;
        return { answer: [n, a].filter(Boolean).join(', ') + '.', answered: true, fieldsUsed: ['companyName', 'registeredAddress'].filter(f => has(d[f])) };
    },
    'core.transport': (q, d, lang) => {
        const f = str(d, 'fleetComposition');
        const m = str(d, 'transportReductionMeasures');
        const bt = num(d, 'businessTravelKm');
        const fr = num(d, 'freightTonKm');
        if (!f && !m && bt === null && fr === null)
            return null;
        const parts = [];
        if (f)
            parts.push(L(lang, `Fleet: ${f}`, `Fuhrpark: ${f}`));
        if (bt !== null)
            parts.push(L(lang, `business travel ${fmt(bt, lang, 0)} km`, `Dienstreisen ${fmt(bt, lang, 0)} km`));
        if (fr !== null)
            parts.push(L(lang, `freight ${fmt(fr, lang, 0)} tkm`, `Fracht ${fmt(fr, lang, 0)} tkm`));
        if (m)
            parts.push(L(lang, `measures: ${m}`, `Maßnahmen: ${m}`));
        return { answer: parts.join('; ') + '.', answered: true, fieldsUsed: ['fleetComposition', 'transportReductionMeasures', 'businessTravelKm', 'freightTonKm'].filter(x => has(d[x])) };
    },
    'core.csrdApplicability': (q, d, lang) => {
        const c = str(d, 'csrdApplicable');
        if (!c)
            return null;
        return { answer: L(lang, `CSRD applicability: ${c}.`, `CSRD-Anwendbarkeit: ${c}.`), answered: true, fieldsUsed: ['csrdApplicable'] };
    },
    'core.ghgBoundary': (q, d, lang) => {
        const n = num(d, 'numberOfSites');
        const name = str(d, 'companyName');
        if (n === null && !name)
            return null;
        const subs = str(d, 'subsidiaries');
        const subsTxt = subs ? L(lang, ` Subsidiaries included: ${subs}.`, ` Einbezogene Tochterunternehmen: ${subs}.`) : '';
        return { answer: L(lang, `The inventory covers ${name || 'the legal entity'}${n !== null ? ` and its ${n === 1 ? 'single site' : `${fmt(n, lang, 0)} sites`}` : ''} under the operational control approach.${subsTxt}`, `Das Inventar umfasst ${name || 'den Rechtsträger'}${n !== null ? ` mit ${n === 1 ? 'einem Standort' : `${fmt(n, lang, 0)} Standorten`}` : ''} nach dem Ansatz der operativen Kontrolle.${subsTxt}`), answered: true, fieldsUsed: ['companyName', 'numberOfSites', 'subsidiaries'].filter(f => has(d[f])) };
    },
    'vsme.b8.byCountry': (q, d, lang) => {
        const n = num(d, 'employeeCount');
        const c = str(d, 'operatingCountries') || str(d, 'country');
        if (n === null || !c)
            return null;
        return { answer: L(lang, `${fmt(n, lang, 0)} employees (FTE), all under employment contracts in ${c}. Temporary and agency workers are not reported separately.`, `${fmt(n, lang, 0)} Beschäftigte (VZÄ), alle mit Arbeitsvertrag in ${c}. Zeitarbeitskräfte werden nicht gesondert ausgewiesen.`), answered: true, fieldsUsed: ['employeeCount', 'operatingCountries', 'country'].filter(f => has(d[f])) };
    },
    'core.dueDiligenceRegimes': (q, d, lang) => {
        const n = num(d, 'employeeCount');
        const c = str(d, 'country');
        if (n === null)
            return null;
        const de = /germany|deutschland/i.test(c);
        const below = n < 1000;
        const lksg = de
            ? (below ? L(lang, `With ${fmt(n, lang, 0)} employees we are below the LkSG threshold of 1,000 employees and not an obligated company ourselves; LkSG requirements reach us through our customers.`, `Mit ${fmt(n, lang, 0)} Beschäftigten liegen wir unter der LkSG-Schwelle von 1.000 Beschäftigten und sind selbst kein verpflichtetes Unternehmen; LkSG-Anforderungen erreichen uns über unsere Kunden.`)
                : L(lang, `With ${fmt(n, lang, 0)} employees in Germany we are within the LkSG's scope.`, `Mit ${fmt(n, lang, 0)} Beschäftigten in Deutschland fallen wir in den Anwendungsbereich des LkSG.`))
            : L(lang, `With ${fmt(n, lang, 0)} employees${c ? ` in ${c}` : ''} we are not an obligated company under the German LkSG.`, `Mit ${fmt(n, lang, 0)} Beschäftigten${c ? ` in ${c}` : ''} sind wir kein verpflichtetes Unternehmen nach dem deutschen LkSG.`);
        const csddd = L(lang, ' We are below the CSDDD thresholds (1,000 employees and EUR 450 m turnover).', ' Die CSDDD-Schwellen (1.000 Beschäftigte und 450 Mio. EUR Umsatz) unterschreiten wir.');
        return { answer: lksg + (below ? csddd : ''), answered: true, fieldsUsed: ['employeeCount', 'country'].filter(f => has(d[f])) };
    },
    'saq.supplierCommunication': (q, d, lang) => {
        const st = statusKind(d.supplierCodeStatus);
        const p = findPolicy(d, /supplier code|lieferantenkodex/i);
        if (st !== 'available' && !p)
            return null;
        return yes(lang, L(lang, 'A supplier code of conduct is in place; how it is communicated and enforced (contract clauses, training, portal) is not documented separately.', 'Ein Lieferantenkodex ist in Kraft; wie er kommuniziert und durchgesetzt wird (Vertragsklauseln, Schulung, Portal), ist nicht gesondert dokumentiert.'), ['supplierCodeStatus', 'policies'], 'partly');
    },
    'saq.sourcingMgmtSystem': (q, d, lang) => {
        const st = statusKind(d.responsibleSourcingPolicyStatus);
        if (st === 'unknown')
            return null;
        if (st === 'available')
            return yes(lang, L(lang, 'A responsible sourcing policy is in place; supply chain mapping and traceability depth are not documented.', 'Eine Richtlinie zur verantwortungsvollen Beschaffung ist in Kraft; Lieferkettenkartierung und Rückverfolgbarkeitstiefe sind nicht dokumentiert.'), ['responsibleSourcingPolicyStatus'], 'partly');
        if (st === 'in_progress')
            return yes(lang, L(lang, 'A responsible sourcing policy is being developed; supply chain mapping has not been undertaken.', 'Eine Richtlinie zur verantwortungsvollen Beschaffung wird erarbeitet; eine Lieferkettenkartierung wurde nicht durchgeführt.'), ['responsibleSourcingPolicyStatus'], 'partly');
        return yes(lang, L(lang, 'No responsible-sourcing management system or supply chain mapping is in place.', 'Ein Managementsystem für verantwortungsvolle Beschaffung oder eine Lieferkettenkartierung wurde nicht durchgeführt.'), ['responsibleSourcingPolicyStatus'], 'no');
    },
    'core.reportingPeriod': (q, d, lang) => {
        const p = str(d, 'reportingPeriod');
        if (!p)
            return null;
        return { answer: L(lang, `Reporting period: ${p}.`, `Berichtszeitraum: ${p}.`), answered: true, fieldsUsed: ['reportingPeriod'] };
    },
    'core.ghgMethodology': (q, d, lang) => {
        const s1 = num(d, 'scope1Tco2e');
        const s2 = num(d, 'scope2Tco2e');
        if (s1 === null && s2 === null)
            return null;
        return { answer: L(lang, `Emissions are calculated following the GHG Protocol Corporate Standard: Scope 1 from fuel quantities with standard emission factors, Scope 2 location-based with the national grid factor${str(d, 'country') ? ` for ${str(d, 'country')}` : ''}.`, `Die Emissionen werden nach dem GHG Protocol Corporate Standard berechnet: Scope 1 aus Brennstoffmengen mit Standard-Emissionsfaktoren, Scope 2 standortbasiert mit dem nationalen Netzfaktor${str(d, 'country') ? ` für ${str(d, 'country')}` : ''}.`), answered: true, fieldsUsed: ['scope1Tco2e', 'scope2Tco2e', 'country'].filter(f => has(d[f])) };
    },
    'core.scope1Mobile': (q, d, lang) => {
        const o = num(d, 'dieselLiters');
        const f = str(d, 'fleetComposition');
        if (o === null && !f)
            return null;
        return { answer: L(lang, `${o !== null ? `Diesel consumption ${fmt(o, lang, 0)} l${period(d, lang)}` : ''}${o !== null && f ? '; ' : ''}${f ? `fleet: ${f}` : ''}. Mobile-combustion emissions are not reported separately from total Scope 1.`, `${o !== null ? `Dieselverbrauch ${fmt(o, lang, 0)} l${period(d, lang)}` : ''}${o !== null && f ? '; ' : ''}${f ? `Fuhrpark: ${f}` : ''}. Emissionen aus mobiler Verbrennung werden nicht getrennt von Scope 1 gesamt ausgewiesen.`), answered: true, fieldsUsed: ['dieselLiters', 'fleetComposition'].filter(x => has(d[x])) };
    },
    'core.scope2Instruments': (q, d, lang) => {
        const r = num(d, 'renewablePercent');
        if (r === null)
            return null;
        return { answer: L(lang, `${fmt(r, lang)} % of electricity is contracted as renewable; the instrument type (guarantees of origin, supplier tariff) and residual-mix treatment are not documented separately.`, `${fmt(r, lang)} % des Stroms sind als erneuerbar vertraglich vereinbart; Art des Nachweises (Herkunftsnachweise, Tarif) und Residualmix-Behandlung sind nicht gesondert dokumentiert.`), answered: true, fieldsUsed: ['renewablePercent'] };
    },
    'core.giftsHospitality': (q, d, lang) => {
        const r = policyAnswer(d, lang, /corruption|bribery|gift|korruption/i, { en: 'anti-corruption policy covering gifts and hospitality', de: 'Eine Antikorruptionsrichtlinie mit Regeln zu Geschenken und Einladungen' }, 'antiCorruptionStatus');
        if (!r || r.yesNo !== 'yes')
            return r;
        return { ...r, yesNo: 'partly', answer: r.answer.replace(/^Yes\./, 'Partly.').replace(/^Ja\./, 'Teilweise.') + L(lang, ' Its specific rules on gifts, hospitality, facilitation payments and third-party due diligence are not documented separately.', ' Die konkreten Regeln zu Geschenken, Einladungen, Beschleunigungszahlungen und Prüfung Dritter sind nicht gesondert dokumentiert.') };
    },
    'core.complianceManagement': (q, d, lang) => {
        const st = statusKind(d.noSignificantFines === 'none' ? 'no' : d.noSignificantFines);
        const coc = findPolicy(d, /code of conduct|compliance|verhaltenskodex/i);
        if (st === 'unknown' && !coc)
            return null;
        const detail = [coc ? L(lang, `A ${coc.name} is in place.`, `Ein Verhaltenskodex („${coc.name}“) ist in Kraft.`) : '', st === 'absent' ? L(lang, 'No significant fines or sanctions in the reporting period.', 'Keine wesentlichen Bußgelder oder Sanktionen im Berichtszeitraum.') : ''].filter(Boolean).join(' ');
        return yes(lang, detail + L(lang, ' There is no separate formal compliance management system.', ' Ein eigenes formales Compliance-Management-System besteht nicht.'), ['policies', 'noSignificantFines'].filter(f => has(d[f])), coc ? 'partly' : 'no');
    },
    'core.childLabour': (q, d, lang) => yesNoFromField(q, d, lang, 'humanRightsPolicyStatus', st => st === 'available' ? L(lang, 'Our human rights policy prohibits child labour; age-verification procedures are not documented separately.', 'Unsere Menschenrechtsrichtlinie verbietet Kinderarbeit; Verfahren zur Altersprüfung sind nicht gesondert dokumentiert.') : st === 'absent' ? L(lang, 'No human rights policy addressing child labour is in place.', 'Eine Menschenrechtsrichtlinie zu Kinderarbeit ist nicht vorhanden.') : ''),
    'core.forcedLabour': (q, d, lang) => yesNoFromField(q, d, lang, 'humanRightsPolicyStatus', st => st === 'available' ? L(lang, 'Our human rights policy prohibits forced, bonded and compulsory labour; specific controls (recruitment fees, document retention) are not documented separately.', 'Unsere Menschenrechtsrichtlinie verbietet Zwangs-, Schuld- und Pflichtarbeit; konkrete Kontrollen (Anwerbegebühren, Dokumenteneinbehalt) sind nicht gesondert dokumentiert.') : st === 'absent' ? L(lang, 'No human rights policy addressing forced labour is in place.', 'Eine Menschenrechtsrichtlinie zu Zwangsarbeit ist nicht vorhanden.') : ''),
    'core.supplyChainEnvironment': (q, d, lang) => yesNoFromField(q, d, lang, 'supplierCodeStatus', st => st === 'available' ? L(lang, 'Environmental requirements are placed on suppliers through our supplier code of conduct; specific controls at supplier level are not documented separately.', 'Umweltanforderungen werden über unseren Lieferantenkodex an Lieferanten gestellt; konkrete Kontrollen auf Lieferantenebene sind nicht gesondert dokumentiert.') : ''),
};
// ------------------------------------------------------------------ entry
/** Render the answer for a canonical question from the company record. */
export function renderBankAnswer(q, data, lang = 'en') {
    const override = OVERRIDES[q.id];
    if (override) {
        const r = override(q, data, lang);
        if (r)
            return r;
        return notOnRecord(q, lang);
    }
    if (q.answerType === 'yesno') {
        // A yes/no with a status field answers from it; with only figures, the generic path applies.
        for (const f of q.needs) {
            if (statusFieldKind(f)) {
                const r = yesNoFromField(q, data, lang, f);
                if (r)
                    return r;
            }
        }
        if (q.needs.includes('policies')) {
            const r = policyAnswer(data, lang, new RegExp(q.intent.en.split(/[ /(]/)[0], 'i'), { en: lowerFirst(q.intent.en), de: q.intent.de });
            if (r)
                return r;
        }
    }
    return generic(q, data, lang);
}
//# sourceMappingURL=render.js.map
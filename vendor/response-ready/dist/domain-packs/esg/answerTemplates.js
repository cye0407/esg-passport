// ============================================
// ESG Domain Pack — Answer Templates
// ============================================
// 70 rich answer templates for ESG data domains.
import { has, num, str, fmt, deCountry, deCountries } from '../../src/engine/answerGenerator';
import { GAS_M3_TO_KWH } from './emissionFactors';
// De-duplicate certification strings that refer to the same underlying standard. Profile
// certs ("ISO 14001 (Environment)") and uploaded-document certs ("ISO 14001:2015 Certificate")
// name the same standard as different strings, so a plain string-set leaves near-duplicates.
// Normalize each entry to a standard key — the ISO number, or a cleaned stem for non-ISO
// standards — and keep the first occurrence (profile wording is listed first and reads best).
function certStandardKey(cert) {
    const lower = cert.toLowerCase();
    const iso = lower.match(/iso(?:\/iec)?\s*(\d{4,5})/);
    if (iso)
        return `iso${iso[1]}`;
    return lower
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\b(19|20)\d{2}\b/g, ' ')
        .replace(/\b(certificate|certification|certified|standard|zertifikat|zertifizierung|zertifiziert)\b/g, ' ')
        .replace(/[^a-z0-9]+/g, '');
}
function dedupeCerts(certs) {
    const seen = new Set();
    const out = [];
    for (const c of certs) {
        const key = certStandardKey(c) || c.toLowerCase();
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(c);
    }
    return out;
}
function statusKind(v) {
    const s = (v || '').trim().toLowerCase();
    if (!s)
        return 'unknown';
    if (s === 'available' || s === 'yes' || s === 'in_place' || s === 'implemented' || s === 'established')
        return 'available';
    if (s === 'in_progress' || s === 'in progress' || s === 'planned' || s === 'developing' || s === 'under_development')
        return 'in_progress';
    if (s === 'not_applicable' || s === 'na' || s === 'n/a')
        return 'na';
    if (s === 'not_available' || s === 'not_planned' || s === 'no' || s === 'none')
        return 'absent';
    return 'unknown';
}
export const ESG_ANSWER_TEMPLATES = [
    // ===================================================================
    // ENERGY & ELECTRICITY
    // ===================================================================
    // KPI: Total electricity consumption
    {
        domains: ['energy_electricity'],
        topics: ['energy_consumption'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'totalElectricity'))
                return null;
            const de = lang === 'de';
            const kwh = num(dm, 'totalElectricity');
            const renPct = num(dm, 'renewablePercent');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            let answer = de
                ? `Unser gesamter Stromverbrauch betrug ${fmt(kwh, lang)} kWh${periodStr}.`
                : `Our total electricity consumption was ${fmt(kwh)} kWh${periodStr}.`;
            if (renPct > 0) {
                const renKwh = kwh * renPct / 100;
                answer += de
                    ? ` Davon stammten ${fmt(renPct, lang)}% (rund ${fmt(renKwh, lang)} kWh) aus erneuerbaren Energiequellen.`
                    : ` Of this, ${fmt(renPct)}% (approximately ${fmt(renKwh)} kWh) was sourced from renewable energy.`;
            }
            return answer;
        },
    },
    // KPI: Renewable energy percentage (distinct from total consumption)
    {
        domains: ['energy_electricity'],
        topics: ['renewable_share', 'renewable_energy'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'renewablePercent'))
                return null;
            const de = lang === 'de';
            const renPct = num(dm, 'renewablePercent');
            const kwh = num(dm, 'totalElectricity');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` for ${period}` : ' for the reporting period');
            let answer = de
                ? `${fmt(renPct, lang)}% unseres Stromverbrauchs${periodStr} stammten aus erneuerbaren Energiequellen.`
                : `${fmt(renPct)}% of our electricity${periodStr} was sourced from renewable energy.`;
            if (kwh > 0)
                answer += de
                    ? ` Von insgesamt ${fmt(kwh, lang)} kWh Verbrauch waren rund ${fmt(kwh * renPct / 100, lang)} kWh erneuerbar.`
                    : ` Out of ${fmt(kwh)} kWh total consumption, approximately ${fmt(kwh * renPct / 100)} kWh was renewable.`;
            return answer;
        },
    },
    // MEASURE: Energy efficiency (not consumption KPI)
    {
        domains: ['energy_electricity'],
        topics: ['energy_efficiency'],
        questionTypes: ['MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const kwh = num(dm, 'totalElectricity');
            const renPct = num(dm, 'renewablePercent');
            const period = str(dm, 'reportingPeriod');
            const parts = [];
            if (kwh > 0) {
                parts.push(de
                    ? `Als Stromverbrauch sind ${fmt(kwh, lang)} kWh${period ? ` (${period})` : ''}${renPct > 0 ? `, davon ${fmt(renPct, lang)}% aus erneuerbaren Quellen` : ''} hinterlegt.`
                    : `Our recorded electricity consumption is ${fmt(kwh)} kWh${period ? ` (${period})` : ''}${renPct > 0 ? `, with ${fmt(renPct)}% from renewable sources` : ''}.`);
                parts.push(de
                    ? 'Für diese Frage haben wir keine konkreten Energieeffizienzmaßnahmen hinterlegt.'
                    : 'We do not have specific energy-efficiency measures on record for this question.');
                return { answer: parts.join(' '), drafted: true };
            }
            return { answer: de
                    ? 'Für diese Frage haben wir weder Angaben zum Energieverbrauch noch dokumentierte Energieeffizienzmaßnahmen hinterlegt.'
                    : 'We do not have energy-consumption figures or documented energy-efficiency measures on record for this question.', drafted: true };
        },
    },
    // Fallback: energy consumption (any question type)
    {
        domains: ['energy_electricity'],
        topics: ['energy_consumption'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'totalElectricity'))
                return null;
            const de = lang === 'de';
            const kwh = num(dm, 'totalElectricity');
            const renPct = num(dm, 'renewablePercent');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            let answer = de
                ? `Unser gesamter Stromverbrauch betrug ${fmt(kwh, lang)} kWh${periodStr}.`
                : `Our total electricity consumption was ${fmt(kwh)} kWh${periodStr}.`;
            if (renPct > 0)
                answer += de
                    ? ` ${fmt(renPct, lang)}% stammten aus erneuerbaren Energiequellen.`
                    : ` ${fmt(renPct)}% was sourced from renewable energy.`;
            return answer;
        },
    },
    // ===================================================================
    // GHG EMISSIONS
    // ===================================================================
    // Full GHG overview (Scope 1 + 2) — fires for a GENERAL GHG question or one that names
    // BOTH scopes. Declaring scope_1 AND scope_2 gives it the highest primary-topic overlap
    // when both scopes are present, so it wins the combined question; a question naming only
    // one scope has higher specificity on the scope-1/scope-2-specific templates below.
    {
        domains: ['emissions'],
        topics: ['ghg_emissions', 'scope_1', 'scope_2'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const s1 = num(dm, 'scope1Estimate');
            const s2 = num(dm, 'scope2Location');
            const s2m = num(dm, 'scope2Market');
            if (s1 === 0 && s2 === 0 && !dm.has('scope1Estimate') && !dm.has('scope2Location'))
                return null;
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` for ${period}` : ' for the reporting period');
            const parts = [];
            parts.push(de
                ? `Unsere Treibhausgasemissionen (THG)${periodStr} stellen sich wie folgt dar:`
                : `Our greenhouse gas (GHG) emissions${periodStr} are as follows:`);
            if (dm.has('scope1Estimate'))
                parts.push(de
                    ? `Scope-1-Emissionen (direkt): ${fmt(s1, lang)} tCO2e.`
                    : `Scope 1 (direct) emissions: ${fmt(s1)} tCO2e.`);
            if (dm.has('scope2Location')) {
                parts.push(de
                    ? `Scope-2-Emissionen (indirekt, standortbasiert): ${fmt(s2, lang)} tCO2e aus eingekauftem Strom.`
                    : `Scope 2 (indirect, location-based) emissions: ${fmt(s2)} tCO2e from purchased electricity.`);
                if (dm.has('scope2Market'))
                    parts.push(de
                        ? `Scope-2-Emissionen (marktbasiert): ${fmt(s2m, lang)} tCO2e.`
                        : `Scope 2 (market-based) emissions: ${fmt(s2m)} tCO2e.`);
            }
            else {
                parts.push(de
                    ? 'Für diese Frage haben wir keine Scope-2-Emissionen hinterlegt.'
                    : 'We do not have Scope 2 emissions on record for this question.');
            }
            const s1Point = dm.get('scope1Estimate');
            const s2Point = dm.get('scope2Location');
            const isEstimate = (s1Point?.confidence === 'medium') || (s2Point?.confidence === 'medium') ||
                (s1Point?.label?.toLowerCase().includes('auto-calculated')) || (s2Point?.label?.toLowerCase().includes('auto-calculated'));
            if (isEstimate) {
                parts.push(de
                    ? 'Hinweis: Einige Werte sind Schätzungen auf Basis von Aktivitätsdaten (Kraftstoff- und Stromverbrauch) und Standard-Emissionsfaktoren.'
                    : 'Note: Some figures are estimates derived from activity data (fuel consumption, electricity use) and standard emission factors.');
            }
            const total = s1 + s2;
            if (dm.has('scope1Estimate') && dm.has('scope2Location'))
                parts.push(de
                    ? `Summe Scope 1 + Scope 2 (standortbasiert): ${fmt(total, lang)} tCO2e.`
                    : `Total Scope 1 + Scope 2 (location-based): ${fmt(total)} tCO2e.`);
            return parts.join(' ');
        },
    },
    // Scope 1 specific (focused on direct emissions — must NOT dump the full Scope 1+2 block)
    {
        domains: ['emissions'],
        topics: ['scope_1', 'ghg_emissions'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const s1 = num(dm, 'scope1Estimate');
            const s2 = num(dm, 'scope2Location');
            if (!s1 && !dm.has('scope1Estimate'))
                return null;
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` for ${period}` : ' for the reporting period');
            const parts = [];
            parts.push(de
                ? `Unsere direkten Scope-1-Treibhausgasemissionen${periodStr} betragen ${fmt(s1, lang)} tCO2e.`
                : `Our Scope 1 (direct) greenhouse gas emissions${periodStr} are ${fmt(s1)} tCO2e.`);
            const isEstimate = dm.get('scope1Estimate')?.confidence === 'medium' ||
                dm.get('scope1Estimate')?.label?.toLowerCase().includes('auto-calculated');
            if (isEstimate)
                parts.push(de
                    ? 'Hinweis: Dieser Wert ist eine Schätzung auf Basis von Aktivitätsdaten (Kraftstoffverbrauch) und Standard-Emissionsfaktoren.'
                    : 'Note: This figure is an estimate derived from activity data (fuel consumption) and standard emission factors.');
            if (s2)
                parts.push(de
                    ? `Zur Einordnung: Unsere Scope-1- und Scope-2-Emissionen (standortbasiert) betragen zusammen ${fmt(s1 + s2, lang)} tCO2e.`
                    : `For context, our combined Scope 1 and Scope 2 (location-based) emissions total ${fmt(s1 + s2)} tCO2e.`);
            return parts.join(' ');
        },
    },
    // Scope 2 specific
    {
        domains: ['emissions'],
        topics: ['scope_2', 'ghg_emissions'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const s2 = num(dm, 'scope2Location');
            const s2m = num(dm, 'scope2Market');
            if (!s2 && !s2m && !dm.has('scope2Location'))
                return null;
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` for ${period}` : ' for the reporting period');
            const kwh = num(dm, 'totalElectricity');
            const parts = [];
            parts.push(de
                ? `Unsere Scope-2-Treibhausgasemissionen (indirekt) aus eingekauftem Strom${periodStr}:`
                : `Our Scope 2 (indirect) greenhouse gas emissions from purchased electricity${periodStr}:`);
            if (s2)
                parts.push(de ? `Standortbasiert: ${fmt(s2, lang)} tCO2e.` : `Location-based: ${fmt(s2)} tCO2e.`);
            if (s2m)
                parts.push(de ? `Marktbasiert: ${fmt(s2m, lang)} tCO2e.` : `Market-based: ${fmt(s2m)} tCO2e.`);
            if (kwh)
                parts.push(de
                    ? `Diese Emissionen resultieren aus ${fmt(kwh, lang)} kWh eingekauftem Strom.`
                    : `These emissions result from ${fmt(kwh)} kWh of purchased electricity.`);
            const isEstimate = dm.get('scope2Location')?.confidence === 'medium';
            if (isEstimate)
                parts.push(de
                    ? 'Hinweis: Scope-2-Werte werden anhand länderspezifischer Netz-Emissionsfaktoren berechnet, die auf unsere Stromverbrauchsdaten angewendet werden.'
                    : 'Note: Scope 2 figures are calculated using country-level grid emission factors applied to our electricity consumption data.');
            return parts.join(' ');
        },
    },
    // Scope 3 specific (Q11 — must answer "do you measure Scope 3" honestly)
    {
        domains: ['emissions', 'transport'],
        topics: ['scope_3', 'ghg_emissions'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const s3 = num(dm, 'scope3Total');
            const cats = str(dm, 'scope3Categories');
            const travel = num(dm, 'businessTravel');
            const commute = num(dm, 'employeeCommute');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` for ${period}` : ' for the reporting period');
            const parts = [];
            if (s3) {
                parts.push(de
                    ? `Ja, wir erfassen Scope-3-Emissionen. Unsere Scope-3-Emissionen (Wertschöpfungskette)${periodStr} belaufen sich auf insgesamt ${fmt(s3, lang)} tCO2e.`
                    : `Yes, we measure Scope 3 emissions. Our Scope 3 (value chain) emissions${periodStr} total ${fmt(s3)} tCO2e.`);
                if (cats)
                    parts.push(de ? `Derzeit berichtete Kategorien: ${cats}.` : `Categories currently reported: ${cats}.`);
            }
            else {
                parts.push(de
                    ? 'Für diese Frage haben wir weder quantifizierte Scope-3-Emissionen noch eine Aufschlüsselung nach Kategorien hinterlegt.'
                    : 'We do not have quantified Scope 3 emissions or a category breakdown on record for this question.');
            }
            if (travel)
                parts.push(de ? `Geschäftsreisen: ${fmt(travel, lang)} km.` : `Business travel: ${fmt(travel)} km.`);
            if (commute)
                parts.push(de ? `Arbeitswege der Mitarbeitenden: ${fmt(commute, lang)} km.` : `Employee commuting: ${fmt(commute)} km.`);
            return { answer: parts.join(' '), drafted: !s3 };
        },
    },
    // ===================================================================
    // WORKFORCE
    // ===================================================================
    // KPI: Employee count
    {
        domains: ['workforce'],
        topics: ['employee_count'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'totalFte'))
                return null;
            const de = lang === 'de';
            const fte = num(dm, 'totalFte');
            const period = str(dm, 'reportingPeriod');
            const country = str(dm, 'headquartersCountry');
            const sites = num(dm, 'numberOfSites');
            let answer = de
                ? `Zum Stand ${period || 'Ende des Berichtszeitraums'} beschäftigt unser Unternehmen ${fmt(fte, lang)} Vollzeitäquivalente (VZÄ)`
                : `As of ${period || 'the end of the reporting period'}, our organization employs ${fmt(fte)} full-time equivalent (FTE) employees`;
            if (sites > 1)
                answer += de ? ` an ${sites} Standorten` : ` across ${sites} operational sites`;
            if (country)
                answer += de ? ` mit Hauptsitz in ${deCountry(country, lang)}` : `, headquartered in ${deCountry(country, lang)}`;
            answer += '.';
            return answer;
        },
    },
    // KPI: Gender diversity breakdown
    {
        domains: ['workforce'],
        topics: ['diversity'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'totalFte', 'femalePercent'))
                return null;
            const de = lang === 'de';
            const fte = num(dm, 'totalFte');
            const fem = num(dm, 'femalePercent');
            const answer = de
                ? `Unsere Belegschaft umfasst ${fmt(fte, lang)} VZÄ; der Frauenanteil beträgt ${fmt(fem, lang)}%.`
                : `Our workforce comprises ${fmt(fte)} FTE employees; women account for ${fmt(fem)}%.`;
            return answer;
        },
    },
    // POLICY: Human rights (Q38 — must cover forced labor, child labor, freedom of association, scope, communication)
    {
        domains: ['workforce'],
        topics: ['human_rights'],
        questionTypes: ['POLICY'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const policies = str(dm, 'socialPoliciesApproved');
            const humanRightsPolicies = policies
                .split(',')
                .map((policy) => policy.trim())
                .filter((policy) => /human rights|modern slavery|forced labor|forced labour|child labor|child labour|sa8000/i.test(policy));
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (humanRightsPolicies.length > 0) {
                parts.push(de
                    ? `Folgende Menschenrechtsrichtlinie ist hinterlegt: ${humanRightsPolicies.join(', ')}.`
                    : `The following human-rights policy is on record: ${humanRightsPolicies.join(', ')}.`);
                parts.push(de
                    ? 'Für diese Frage haben wir weder ihren Geltungsbereich noch Angaben zu Kommunikation oder Sorgfaltsprozess hinterlegt.'
                    : 'Its scope, communication and due-diligence process are not on record for this question.');
            }
            else {
                parts.push(de
                    ? 'Für diese Frage haben wir weder eine eigenständige Menschenrechtsrichtlinie noch dokumentierte Nachweise eines Prozesses zur menschenrechtlichen Sorgfalt hinterlegt.'
                    : 'We do not have a standalone human-rights policy or documented evidence of a human-rights due-diligence process on record for this question.');
            }
            if (humanRightsPolicies.length > 0 && (fte || country))
                parts.push(de
                    ? 'Für diese Frage haben wir den Geltungsbereich innerhalb der Belegschaft nicht hinterlegt.'
                    : 'We do not have its workforce coverage on record for this question.');
            const answer = parts.join(' ');
            return policies ? answer : { answer, drafted: true };
        },
    },
    // POLICY: DEI policy (Q28 — must NOT route to H&S or certifications)
    {
        domains: ['workforce'],
        topics: ['dei_policy', 'diversity'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const fte = num(dm, 'totalFte');
            const fem = num(dm, 'femalePercent');
            const leaderPct = num(dm, 'womenInLeadershipPercent');
            const parts = [];
            const hasMetrics = fem > 0 || leaderPct > 0;
            if (hasMetrics) {
                parts.push(de ? 'Wir erfassen die folgenden Daten zur Vielfalt der Belegschaft:' : 'We track the following workforce diversity data:');
                if (fem > 0)
                    parts.push(de
                        ? `Frauen machen ${fmt(fem, lang)}% unserer Gesamtbelegschaft${fte > 0 ? ` von ${fmt(fte, lang)} Mitarbeitenden` : ''} aus.`
                        : `Women represent ${fmt(fem)}% of our total workforce${fte > 0 ? ` of ${fmt(fte)} employees` : ''}.`);
                if (leaderPct > 0)
                    parts.push(de
                        ? `${fmt(leaderPct, lang)}% der Management- und Führungspositionen werden von Frauen besetzt.`
                        : `${fmt(leaderPct)}% of management and leadership positions are held by women.`);
                parts.push(de
                    ? 'Für diese Frage haben wir weder eine eigenständige DEI-Richtlinie noch messbare Ziele hinterlegt.'
                    : 'We do not have a standalone DEI policy or measurable targets on record for this question.');
            }
            else {
                parts.push(de
                    ? 'Für diese Frage haben wir weder eine eigenständige DEI-Richtlinie noch messbare Diversitätsziele oder einen Berichtsprozess hinterlegt.'
                    : 'We do not have a standalone DEI policy, measurable diversity targets or a reporting process on record for this question.');
            }
            return { answer: parts.join(' '), drafted: !hasMetrics };
        },
    },
    // MEASURE: Freedom of association (Q41 — must address union rights, not wages)
    {
        domains: ['workforce'],
        topics: ['freedom_of_association', 'collective_bargaining'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const cbaPct = num(dm, 'collectiveBargainingPercent');
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (cbaPct > 0) {
                parts.push(de
                    ? `${fmt(cbaPct, lang)}% unserer Belegschaft sind von Tarifverträgen erfasst${fte > 0 ? `, das entspricht rund ${fmt(Math.round(fte * cbaPct / 100), lang)} von ${fmt(fte, lang)} Mitarbeitenden` : ''}.`
                    : `${fmt(cbaPct)}% of our workforce is covered by collective bargaining agreements${fte > 0 ? `, representing approximately ${fmt(Math.round(fte * cbaPct / 100))} of our ${fmt(fte)} employees` : ''}.`);
                if (country)
                    parts.push(de
                        ? `Vereinigungsfreiheit und Tarifverhandlungen werden im Rahmen des geltenden Arbeitsrechts in ${deCountry(country, lang)} ausgeübt.`
                        : `Freedom of association and collective bargaining are exercised within the framework of applicable labour law in ${deCountry(country, lang)}.`);
                return parts.join(' ');
            }
            parts.push(de
                ? 'Für diese Frage haben wir keinen dokumentierten Ansatz zur Vereinigungsfreiheit oder zu Tarifverhandlungen hinterlegt.'
                : 'We do not have a documented approach to freedom of association or collective bargaining on record for this question.');
            if (country)
                parts.push(de
                    ? `Unsere Betriebe unterliegen dem geltenden Arbeitsrecht in ${deCountry(country, lang)}.`
                    : `Our operations are subject to applicable labour law in ${deCountry(country, lang)}.`);
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // MEASURE: Working conditions (Q42 — hours, overtime, rest, leave)
    {
        domains: ['workforce'],
        topics: ['working_conditions'],
        questionTypes: ['MEASURE', 'POLICY'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const cbaPct = num(dm, 'collectiveBargainingPercent');
            const parts = [];
            if (fte > 0 || country || cbaPct > 0)
                parts.push(de
                    ? `Für diese Frage sind folgende Angaben zur Belegschaft hinterlegt:${fte > 0 ? ` ${fmt(fte, lang)} VZÄ.` : ''}${country ? ` Land des Hauptsitzes: ${deCountry(country, lang)}.` : ''}`
                    : `The following workforce details are on record for this question:${fte > 0 ? ` ${fmt(fte)} FTE employees.` : ''}${country ? ` Headquarters country: ${deCountry(country, lang)}.` : ''}`);
            if (cbaPct > 0)
                parts.push(de
                    ? `${fmt(cbaPct, lang)}% unserer Belegschaft sind von Tarifverträgen erfasst${fte > 0 ? ` (rund ${fmt(Math.round(fte * cbaPct / 100), lang)} von ${fmt(fte, lang)} VZÄ)` : ''}.`
                    : `${fmt(cbaPct)}% of our workforce is covered by collective bargaining agreements${fte > 0 ? ` (approximately ${fmt(Math.round(fte * cbaPct / 100))} of ${fmt(fte)} FTE employees)` : ''}.`);
            parts.push(de
                ? 'Für diese Frage haben wir keine Angaben zu Arbeitszeit, Überstunden, Ruhezeiten oder Urlaub hinterlegt.'
                : 'We do not have details of working-hour, overtime, rest-period or leave practices on record for this question.');
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // KPI: Hires and departures (Q29)
    {
        domains: ['workforce'],
        topics: ['hires_departures', 'employee_count'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const fte = num(dm, 'totalFte');
            const turnover = num(dm, 'turnoverRate');
            const hires = num(dm, 'newHires');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            if (fte > 0 && (turnover > 0 || hires > 0)) {
                const departures = turnover > 0 ? Math.round(fte * turnover / 100) : 0;
                const parts = [];
                parts.push(de
                    ? `Zum Ende ${period || 'des Berichtszeitraums'} umfasste unsere Belegschaft ${fmt(fte, lang)} VZÄ.`
                    : `As of the end of ${period || 'the reporting period'}, our workforce comprises ${fmt(fte)} FTE employees.`);
                if (hires > 0 && departures > 0) {
                    parts.push(de
                        ? `${fmt(hires, lang)} neue Beschäftigte sind${periodStr} eingetreten und etwa ${departures} ausgeschieden (Fluktuationsquote: ${fmt(turnover, lang)}%).`
                        : `${fmt(hires)} new employees joined and approximately ${departures} departed${periodStr} (turnover rate: ${fmt(turnover)}%).`);
                }
                else if (hires > 0) {
                    parts.push(de
                        ? `${fmt(hires, lang)} neue Beschäftigte sind${periodStr} eingetreten.`
                        : `${fmt(hires)} new employees joined${periodStr}.`);
                }
                else if (departures > 0) {
                    parts.push(de
                        ? `Unsere Fluktuationsquote${periodStr} betrug ${fmt(turnover, lang)}%, was rund ${departures} Abgängen entspricht. Für diese Frage haben wir keine Zahlen zu Neueinstellungen hinterlegt.`
                        : `Our employee turnover rate${periodStr} was ${fmt(turnover)}%, corresponding to approximately ${departures} departures. We do not have new-hire figures on record for this question.`);
                }
                return parts.join(' ');
            }
            return null;
        },
    },
    // MEASURE: Fair wages and living wage (Q27 — must distinguish living wage from minimum wage)
    {
        domains: ['workforce'],
        topics: ['labor_practices'],
        questionTypes: ['MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const lwCompliant = str(dm, 'livingWageCompliant');
            const parts = [];
            if (lwCompliant === 'Yes') {
                parts.push(de
                    ? `Ja, alle Beschäftigten${country ? ` in ${deCountry(country, lang)}` : ''} werden mindestens in Höhe des jeweils geltenden existenzsichernden Lohns vergütet, nicht lediglich in Höhe des gesetzlichen Mindestlohns.`
                    : `Yes, all employees${country ? ` in ${deCountry(country, lang)}` : ''} are compensated at or above the applicable living wage — not merely the legal minimum wage.`);
            }
            else if (lwCompliant === 'Not applicable') {
                parts.push(de
                    ? `Ein Abgleich mit existenzsichernden Löhnen ist für ${str(dm, 'legalEntityName') || 'unsere Organisation'} als nicht zutreffend gekennzeichnet.`
                    : `Living-wage benchmarking is marked as not applicable to ${str(dm, 'legalEntityName') || 'our organization'}.`);
            }
            else {
                parts.push(de
                    ? 'Für diese Frage haben wir keinen Abgleich der Vergütung mit dem gesetzlichen Mindestlohn oder mit Referenzwerten für existenzsichernde Löhne hinterlegt.'
                    : 'We do not have a comparison of compensation against minimum-wage or living-wage benchmarks on record for this question.');
            }
            if (fte > 0 && lwCompliant === 'Yes')
                parts.push(de ? `Dies gilt für alle ${fmt(fte, lang)} VZÄ.` : `This applies to all ${fmt(fte)} FTE employees.`);
            else if (fte > 0)
                parts.push(de ? `Als Belegschaftsgröße sind ${fmt(fte, lang)} VZÄ hinterlegt.` : `The workforce count on record is ${fmt(fte)} FTE.`);
            return { answer: parts.join(' '), drafted: lwCompliant !== 'Yes' && lwCompliant !== 'Not applicable' };
        },
    },
    // KPI: Employee turnover rate
    {
        domains: ['workforce'],
        topics: ['turnover', 'labor_practices'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'turnoverRate'))
                return null;
            const de = lang === 'de';
            const rate = num(dm, 'turnoverRate');
            const fte = num(dm, 'totalFte');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            let answer = de
                ? `Unsere Mitarbeiterfluktuationsquote${periodStr} betrug ${fmt(rate, lang)}%.`
                : `Our employee turnover rate${periodStr} was ${fmt(rate)}%.`;
            if (fte > 0)
                answer += de
                    ? ` Dies basiert auf unserer Belegschaft von ${fmt(fte, lang)} VZÄ.`
                    : ` This is based on our workforce of ${fmt(fte)} FTE employees.`;
            return answer;
        },
    },
    // KPI: Collective bargaining coverage
    {
        domains: ['workforce'],
        topics: ['collective_bargaining', 'labor_practices'],
        questionTypes: ['KPI', 'POLICY'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'collectiveBargainingPercent'))
                return null;
            const de = lang === 'de';
            const pct = num(dm, 'collectiveBargainingPercent');
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (pct > 0) {
                parts.push(de
                    ? `${fmt(pct, lang)}% unserer Belegschaft sind von Tarifverträgen erfasst.`
                    : `${fmt(pct)}% of our workforce is covered by collective bargaining agreements.`);
                if (fte > 0)
                    parts.push(de
                        ? `Dies entspricht rund ${fmt(Math.round(fte * pct / 100), lang)} von ${fmt(fte, lang)} Mitarbeitenden.`
                        : `This covers approximately ${fmt(Math.round(fte * pct / 100))} of our ${fmt(fte)} employees.`);
                return parts.join(' ');
            }
            parts.push(de
                ? 'Unsere Belegschaft ist derzeit nicht von Tarifverträgen erfasst.'
                : 'Our workforce is not currently covered by collective bargaining agreements.');
            if (country)
                parts.push(de
                    ? `Die Arbeitsbedingungen in ${deCountry(country, lang)} werden durch Arbeitsverträge und das geltende Arbeitsrecht geregelt.`
                    : `Working conditions in ${deCountry(country, lang)} are governed by employment contracts and applicable labour law.`);
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // KPI: Women in leadership / leadership diversity
    {
        domains: ['workforce'],
        topics: ['diversity', 'leadership_diversity'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'womenInLeadershipPercent'))
                return null;
            const de = lang === 'de';
            const leaderPct = num(dm, 'womenInLeadershipPercent');
            const femPct = num(dm, 'femalePercent');
            const fte = num(dm, 'totalFte');
            const parts = [];
            parts.push(de
                ? `Frauen stellen ${fmt(leaderPct, lang)}% unserer Führungs- und Managementpositionen.`
                : `Women represent ${fmt(leaderPct)}% of our leadership and management positions.`);
            if (femPct > 0)
                parts.push(de
                    ? `Dies steht einem Frauenanteil von ${fmt(femPct, lang)}% in unserer Gesamtbelegschaft von ${fte > 0 ? fmt(fte, lang) + ' Mitarbeitenden' : 'allen Mitarbeitenden'} gegenüber.`
                    : `This compares to ${fmt(femPct)}% female representation across our total workforce of ${fte > 0 ? fmt(fte) + ' employees' : 'all employees'}.`);
            return parts.join(' ');
        },
    },
    // M16 (KPI phrasing) — absenteeism / sick leave / parental leave / engagement collide with
    // the labor_practices topic. A KPI-gated template captures them (winning the labor_practices
    // tie by array order) without stealing turnover/CBA (higher topic overlap) or wage MEASURE
    // questions. Placed before living-wage-compliance so it wins the pure labor_practices KPI tie.
    {
        domains: ['workforce'],
        topics: ['labor_practices'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => ({
            answer: lang === 'de'
                ? 'Für diese Frage haben wir keine standardisierten Sozialkennzahlen wie Fehlzeiten, Elternzeit, geschlechtsspezifisches Lohngefälle oder Mitarbeiterzufriedenheit hinterlegt.'
                : 'We do not have standardized social metrics such as absenteeism, parental leave, gender pay gap or employee satisfaction on record for this question.',
            drafted: true,
        }),
    },
    // MEASURE: Living wage compliance
    {
        domains: ['workforce'],
        topics: ['labor_practices'],
        questionTypes: ['MEASURE', 'KPI'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'livingWageCompliant'))
                return null;
            const de = lang === 'de';
            const compliant = str(dm, 'livingWageCompliant');
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (compliant === 'Yes') {
                parts.push(de
                    ? `Ja, alle Beschäftigten${country ? ` in ${deCountry(country, lang)}` : ''} werden mindestens in Höhe des jeweils geltenden existenzsichernden Lohns vergütet.`
                    : `Yes, all employees${country ? ` in ${deCountry(country, lang)}` : ''} are compensated at or above the applicable living wage.`);
            }
            else if (compliant === 'Not applicable') {
                parts.push(de
                    ? 'Ein Abgleich mit existenzsichernden Löhnen ist für unsere Organisation als nicht zutreffend gekennzeichnet.'
                    : 'Living-wage benchmarking is marked as not applicable to our organization.');
            }
            else if (compliant === 'No') {
                parts.push(de
                    ? 'Die Einhaltung existenzsichernder Löhne ist mit „Nein“ hinterlegt. Für diese Frage haben wir weder Angaben zum Referenzwert noch zum Geltungsbereich innerhalb der Belegschaft hinterlegt.'
                    : 'The record marks living-wage compliance as No. We do not have benchmark or workforce-coverage details on record for this question.');
            }
            else {
                parts.push(de
                    ? 'Für diese Frage haben wir keinen formellen Abgleich der Vergütung mit den geltenden Mindestlohn- oder existenzsichernden Lohn-Benchmarks hinterlegt.'
                    : 'We do not have a formal comparison of compensation against applicable minimum-wage or living-wage benchmarks on record for this question.');
            }
            if (fte > 0 && compliant === 'Yes')
                parts.push(de ? `Dies gilt für alle ${fmt(fte, lang)} VZÄ.` : `This applies to all ${fmt(fte)} FTE employees.`);
            return { answer: parts.join(' '), drafted: compliant !== 'Yes' && compliant !== 'Not applicable' };
        },
    },
    // Grievance mechanism (Q40 — multi-part: mechanism existence + count)
    {
        domains: ['workforce'],
        topics: ['grievance', 'ethics'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'grievanceMechanismExists'))
                return null;
            const de = lang === 'de';
            const exists = str(dm, 'grievanceMechanismExists');
            const count = num(dm, 'grievancesReported');
            const period = str(dm, 'reportingPeriod');
            const parts = [];
            if (exists === 'Yes') {
                parts.push(de
                    ? 'Ja, ein formeller Beschwerdemechanismus ist als vorhanden hinterlegt. Für diese Frage haben wir keine Angaben zum berechtigten Personenkreis hinterlegt.'
                    : 'Yes, a formal grievance mechanism is recorded as being in place. We do not have details of its eligible users on record for this question.');
                if (has(dm, 'grievancesReported')) {
                    parts.push(de
                        ? `${period ? `Im Zeitraum ${period} ` : ''}${count === 1 ? (period ? 'wurde eine Beschwerde' : 'Es wurde eine Beschwerde') : (period ? `wurden ${count} Beschwerden` : `Es wurden ${count} Beschwerden`)} über diesen Mechanismus gemeldet.`
                        : `${period ? `During ${period}, ` : ''}${count} grievance${count !== 1 ? 's were' : ' was'} reported through this mechanism.`);
                }
                return parts.join(' ');
            }
            return { answer: de
                    ? 'Ein formeller Beschwerdemechanismus wurde bislang nicht eingeführt, und wir erfassen dies für diese Frage nicht gesondert.'
                    : 'A formal grievance mechanism has not yet been established, and we do not separately track this for this question.', drafted: true };
        },
    },
    // ===================================================================
    // HEALTH & SAFETY
    // ===================================================================
    // Fatalities (Q32 — only fires when 'fatalities' is a primary topic)
    {
        domains: ['health_safety'],
        topics: ['fatalities'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const fat = num(dm, 'fatalities');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            if (has(dm, 'fatalities')) {
                if (fat === 0) {
                    return de
                        ? `Es wurden${periodStr} keine arbeitsbedingten Todesfälle verzeichnet.`
                        : `Zero work-related fatalities were recorded${periodStr}.`;
                }
                return de
                    ? `${fat} arbeitsbedingte${fat === 1 ? 'r Todesfall ereignete sich' : ' Todesfälle ereigneten sich'}${periodStr}.`
                    : `${fat} work-related fatalit${fat === 1 ? 'y' : 'ies'} occurred${periodStr}.`;
            }
            return null;
        },
    },
    // KPI: H&S incident rates
    {
        domains: ['health_safety'],
        topics: ['health_safety_kpi', 'health_safety'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const trir = num(dm, 'trir');
            const lti = num(dm, 'lostTimeIncidents');
            const fat = num(dm, 'fatalities');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            const hasAnyData = has(dm, 'trir') || has(dm, 'lostTimeIncidents') || has(dm, 'fatalities');
            if (hasAnyData) {
                const parts = [];
                parts.push(de ? `Unsere Leistung im Bereich Arbeitssicherheit${periodStr}:` : `Our occupational health and safety performance${periodStr}:`);
                if (has(dm, 'trir'))
                    parts.push(`Total Recordable Incident Rate (TRIR): ${fmt(trir, lang)}.`);
                if (has(dm, 'lostTimeIncidents')) {
                    parts.push(de ? `Ausfallzeit-Unfälle: ${lti}.` : `Lost time incidents: ${lti}.`);
                    // Calculate LTIR if we have hours worked
                    const hoursWorked = num(dm, 'totalHoursWorked');
                    if (hoursWorked > 0) {
                        const ltir = Math.round((lti / hoursWorked) * 200000 * 100) / 100;
                        parts.push(`Lost Time Injury Rate (LTIR): ${fmt(ltir, lang)}.`);
                    }
                }
                if (has(dm, 'fatalities'))
                    parts.push(de ? `Todesfälle: ${fat}.` : `Fatalities: ${fat}.`);
                // Show underlying data when available
                const hoursWorked = num(dm, 'totalHoursWorked');
                if (hoursWorked > 0)
                    parts.push(de
                        ? `Gesamtzahl der geleisteten Arbeitsstunden: ${fmt(hoursWorked, lang)}.`
                        : `Total hours worked: ${fmt(hoursWorked)}.`);
                // Both figures must have been ENTERED as zero. num() returns 0 for an absent field, so
                // testing the values alone let a supplier who supplied only a TRIR claim a clean safety
                // record — zero lost-time incidents and zero fatalities — that they never stated.
                if (has(dm, 'fatalities') && has(dm, 'lostTimeIncidents') && fat === 0 && lti === 0) {
                    parts.push(de
                        ? 'Wir haben keine Ausfallzeit-Unfälle und keine Todesfälle verzeichnet.'
                        : 'We recorded zero lost time incidents and zero fatalities.');
                }
                return parts.join(' ');
            }
            // No H&S metrics entered — honest gap, no fabricated safety process or "no incidents" claim.
            return {
                answer: de
                    ? 'Für diese Frage haben wir weder TRIR- oder LTIR-Kennzahlen noch Daten zu geleisteten Arbeitsstunden hinterlegt.'
                    : 'We do not have TRIR, LTIR or hours-worked data on record for this question.',
                drafted: true,
            };
        },
    },
    // MEASURE/POLICY: H&S management system (describe your OHS system)
    {
        domains: ['health_safety'],
        topics: ['health_safety_management', 'health_safety'],
        questionTypes: ['MEASURE', 'POLICY'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const trir = num(dm, 'trir');
            const lti = num(dm, 'lostTimeIncidents');
            const certs = str(dm, 'certificationsHeld');
            const has45001 = !!certs && certs.toLowerCase().includes('45001');
            const hasData = has(dm, 'trir') || has(dm, 'lostTimeIncidents');
            const parts = [];
            if (has45001)
                parts.push(de
                    ? 'Unser Arbeitssicherheits-Managementsystem ist nach ISO 45001 zertifiziert.'
                    : 'Our occupational health and safety management system is certified to ISO 45001.');
            // List only the metrics actually supplied. Naming both always meant a supplier who entered
            // one of them reported a zero for the other that they never gave.
            if (hasData) {
                const metrics = [];
                if (has(dm, 'trir'))
                    metrics.push(`TRIR ${fmt(trir, lang)}`);
                if (has(dm, 'lostTimeIncidents'))
                    metrics.push(de ? `Ausfallzeit-Unfälle ${lti}` : `lost time incidents ${lti}`);
                parts.push(de
                    ? `Erfasste Arbeitssicherheitsleistung: ${metrics.join(', ')}.`
                    : `Recorded H&S performance: ${metrics.join(', ')}.`);
            }
            if (!has45001 && !hasData) {
                return { answer: de
                        ? 'Für diese Frage haben wir keinen Ansatz zum Management von Sicherheit und Gesundheit bei der Arbeit hinterlegt.'
                        : 'We do not have an occupational health and safety management approach on record for this question.', drafted: true };
            }
            if (!has45001)
                parts.push(de
                    ? 'Die Struktur unseres Arbeitssicherheits-Managementsystems haben wir über die oben genannten Daten hinaus nicht gesondert dokumentiert.'
                    : 'We have not separately documented the structure of our health and safety management system beyond the data above.');
            return { answer: parts.join(' '), drafted: !has45001 };
        },
    },
    // ===================================================================
    // WASTE (fine-grained)
    // ===================================================================
    // KPI: Healthcare waste streams
    {
        domains: ['waste'],
        topics: ['healthcare_waste', 'hazardous_waste', 'waste_management'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const medical = num(dm, 'medicalWasteKg');
            const pharma = num(dm, 'pharmaceuticalWasteKg');
            if (!has(dm, 'medicalWasteKg') && !has(dm, 'pharmaceuticalWasteKg'))
                return null;
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            const parts = [];
            parts.push(de ? `Erfasste Abfallströme im Gesundheitswesen${periodStr}:` : `Healthcare waste streams recorded${periodStr}:`);
            if (has(dm, 'medicalWasteKg'))
                parts.push(de ? `Medizinischer Abfall: ${fmt(medical, lang)} kg.` : `Medical waste: ${fmt(medical)} kg.`);
            if (has(dm, 'pharmaceuticalWasteKg'))
                parts.push(de ? `Pharmazeutischer Abfall: ${fmt(pharma, lang)} kg.` : `Pharmaceutical waste: ${fmt(pharma)} kg.`);
            return parts.join(' ');
        },
    },
    // KPI: Mining waste and tailings
    {
        domains: ['waste'],
        topics: ['mining_metrics', 'waste_management'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const tailings = num(dm, 'tailingsGeneratedTonnes');
            if (!has(dm, 'tailingsGeneratedTonnes'))
                return null;
            const ore = num(dm, 'oreProcessedTonnes');
            const waterReused = num(dm, 'waterReusedPercent');
            const rehab = num(dm, 'rehabilitatedLandHectares');
            const parts = [];
            parts.push(de
                ? `Im Berichtszeitraum fielen ${fmt(tailings, lang)} Tonnen Aufbereitungsrückstände an.`
                : `Tailings generated during the reporting period were ${fmt(tailings)} tonnes.`);
            if (ore > 0)
                parts.push(de
                    ? `Dies bezieht sich auf ${fmt(ore, lang)} Tonnen verarbeitetes Erz/Material.`
                    : `This relates to ${fmt(ore)} tonnes of ore/material processed.`);
            if (waterReused > 0)
                parts.push(de
                    ? `${fmt(waterReused, lang)}% des Prozesswassers wurden wiederverwendet.`
                    : `${fmt(waterReused)}% of process water was reused.`);
            if (rehab > 0)
                parts.push(de
                    ? `${fmt(rehab, lang)} Hektar Land wurden renaturiert.`
                    : `${fmt(rehab)} hectares of land were rehabilitated.`);
            return parts.join(' ');
        },
    },
    // KPI: Total waste
    {
        domains: ['waste'],
        topics: ['waste_total', 'waste_management'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'totalWaste'))
                return null;
            const de = lang === 'de';
            const waste = num(dm, 'totalWaste');
            const div = num(dm, 'diversionRate');
            const haz = num(dm, 'hazardousWaste');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            let answer = de
                ? `Unser gesamtes Abfallaufkommen${periodStr} betrug ${fmt(waste, lang)} kg (${fmt(waste / 1000, lang)} Tonnen).`
                : `Our total waste generated${periodStr} was ${fmt(waste)} kg (${fmt(waste / 1000)} tonnes).`;
            if (div > 0)
                answer += de ? ` Wir erreichten eine Abfallverwertungsquote von ${fmt(div, lang)}%.` : ` We achieved a waste diversion rate of ${fmt(div)}%.`;
            if (haz > 0)
                answer += de ? ` Davon wurden ${fmt(haz, lang)} kg als gefährlicher Abfall eingestuft.` : ` Of this, ${fmt(haz)} kg was classified as hazardous waste.`;
            return answer;
        },
    },
    // KPI: Recycling / diversion rate
    {
        domains: ['waste'],
        topics: ['recycling'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'diversionRate'))
                return null;
            const de = lang === 'de';
            const waste = num(dm, 'totalWaste');
            const div = num(dm, 'diversionRate');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            let answer = de
                ? `Unsere Abfallverwertungsquote (Recyclingquote)${periodStr} betrug ${fmt(div, lang)}%.`
                : `Our waste diversion (recycling) rate${periodStr} was ${fmt(div)}%.`;
            if (waste > 0)
                answer += de
                    ? ` Von insgesamt ${fmt(waste, lang)} kg Abfall wurden ${fmt(waste * div / 100, lang)} kg recycelt oder verwertet, statt deponiert zu werden.`
                    : ` Of ${fmt(waste)} kg total waste, ${fmt(waste * div / 100)} kg was recycled or recovered rather than sent to landfill.`;
            return answer;
        },
    },
    // KPI: Hazardous waste
    {
        domains: ['waste'],
        topics: ['hazardous_waste'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const haz = num(dm, 'hazardousWaste');
            const waste = num(dm, 'totalWaste');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            if (haz > 0) {
                let answer = de
                    ? `Wir erzeugten${periodStr} ${fmt(haz, lang)} kg gefährlichen Abfall.`
                    : `We generated ${fmt(haz)} kg of hazardous waste${periodStr}.`;
                if (waste > 0)
                    answer += de
                        ? ` Dies entspricht ${fmt(haz / waste * 100, lang)}% unseres gesamten Abfallaufkommens von ${fmt(waste, lang)} kg.`
                        : ` This represents ${fmt(haz / waste * 100)}% of our total waste of ${fmt(waste)} kg.`;
                return answer;
            }
            // num() returns 0 for an absent field, so "no hazardous waste" and "the user recorded zero"
            // are indistinguishable unless has() is asked. Without this, a supplier who entered only a
            // total was told they generate no hazardous waste and that every kilo of it is non-hazardous
            // — a fabricated environmental claim sent to their customer.
            if (has(dm, 'hazardousWaste')) {
                return de
                    ? `Wir haben${periodStr} keinen gefährlichen Abfall erzeugt. Unser gesamter Abfall von ${fmt(waste, lang)} kg besteht ausschließlich aus nicht gefährlichen Materialien.`
                    : `We did not generate any hazardous waste${periodStr}. Our total waste of ${fmt(waste)} kg consists entirely of non-hazardous materials.`;
            }
            if (has(dm, 'totalWaste')) {
                return { answer: de
                        ? `Unser gesamtes Abfallaufkommen${periodStr} betrug ${fmt(waste, lang)} kg. Für diese Frage haben wir keine Aufschlüsselung nach gefährlichem Abfall hinterlegt.`
                        : `Our total waste${periodStr} was ${fmt(waste)} kg. We do not have a hazardous-waste breakdown on record for this question.`, drafted: true };
            }
            return null;
        },
    },
    // MEASURE: Hazardous-waste disposal process (a "how do you ensure proper disposal?"
    // question is about the PROCESS, not tonnages — lead with the disposal approach and cite
    // the hazardous quantity only as supporting context).
    {
        domains: ['waste'],
        topics: ['hazardous_waste', 'waste_management'],
        questionTypes: ['MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const haz = num(dm, 'hazardousWaste');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            // Segregation, licensed carriers and retained consignment notes are things a supplier
            // either does or does not do. Nothing in the data map says which, so they cannot be
            // asserted — report the figure if there is one, and say what is missing.
            // has(), not haz > 0: a recorded zero IS a figure, and denying it tells a supplier who
            // entered 0 kg that we hold no figures for them.
            if (has(dm, 'hazardousWaste')) {
                return { answer: de
                        ? `Als gefährlicher Abfall wurden${periodStr} ${fmt(haz, lang)} kg erfasst. Für diese Frage haben wir keine Beschreibung des Entsorgungswegs hinterlegt.`
                        : `We recorded ${fmt(haz)} kg of hazardous waste${periodStr}. We do not have a description of its handling process on record for this question.`, drafted: true };
            }
            return { answer: de
                    ? 'Für diese Frage haben wir weder Mengen zu gefährlichen Abfällen noch einen dokumentierten Entsorgungsprozess hinterlegt.'
                    : 'We do not have hazardous waste figures or a documented handling process on record for this question.', drafted: true };
        },
    },
    // MEASURE: Circular economy initiatives
    {
        domains: ['waste'],
        topics: ['circular_economy'],
        questionTypes: ['MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const waste = num(dm, 'totalWaste');
            const div = num(dm, 'diversionRate');
            if (waste > 0 && div > 0) {
                return {
                    answer: de
                        ? `Erfasst sind ${fmt(waste, lang)} kg Gesamtabfall und eine Verwertungsquote von ${fmt(div, lang)}%. Für diese Frage haben wir keine konkreten Kreislaufwirtschaftsinitiativen hinterlegt.`
                        : `We recorded ${fmt(waste)} kg of total waste and a ${fmt(div)}% diversion rate. We do not have specific circular-economy initiatives on record for this question.`,
                    drafted: true,
                };
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keine dokumentierten Kreislaufwirtschaftsinitiativen hinterlegt.'
                    : 'We do not have documented circular-economy initiatives on record for this question.', drafted: true };
        },
    },
    // Fallback: general waste (any type not matched above)
    {
        domains: ['waste'],
        topics: ['waste_management'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'totalWaste'))
                return null;
            const de = lang === 'de';
            const waste = num(dm, 'totalWaste');
            const div = num(dm, 'diversionRate');
            const haz = num(dm, 'hazardousWaste');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            let answer = de
                ? `Unser gesamtes Abfallaufkommen${periodStr} betrug ${fmt(waste, lang)} kg (${fmt(waste / 1000, lang)} Tonnen).`
                : `Our total waste generated${periodStr} was ${fmt(waste)} kg (${fmt(waste / 1000)} tonnes).`;
            if (div > 0)
                answer += de
                    ? ` Wir erreichten eine Abfallverwertungsquote von ${fmt(div, lang)}%, das heißt ${fmt(waste * div / 100, lang)} kg wurden recycelt oder verwertet, statt deponiert zu werden.`
                    : ` We achieved a waste diversion rate of ${fmt(div)}%, meaning ${fmt(waste * div / 100)} kg was recycled or recovered rather than sent to landfill.`;
            if (haz > 0)
                answer += de
                    ? ` Davon wurden ${fmt(haz, lang)} kg als gefährlicher Abfall eingestuft.`
                    : ` Of this total, ${fmt(haz)} kg was classified as hazardous waste.`;
            return answer;
        },
    },
    // ===================================================================
    // WATER
    // ===================================================================
    // Sector water metrics
    {
        domains: ['energy_water', 'effluents'],
        topics: ['water_usage', 'sector_metrics', 'wastewater'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const irrigation = num(dm, 'irrigationWaterM3');
            const discharge = num(dm, 'waterDischargeM3');
            const reused = num(dm, 'waterReusedPercent');
            if (!has(dm, 'irrigationWaterM3') && !has(dm, 'waterDischargeM3') && !has(dm, 'waterReusedPercent'))
                return null;
            const parts = [];
            if (has(dm, 'irrigationWaterM3'))
                parts.push(de
                    ? `Der Bewässerungswasserverbrauch betrug im Berichtszeitraum ${fmt(irrigation, lang)} m3.`
                    : `Irrigation water use was ${fmt(irrigation)} m3 during the reporting period.`);
            if (has(dm, 'waterDischargeM3'))
                parts.push(de
                    ? `Die erfasste Wassereinleitung betrug ${fmt(discharge, lang)} m3.`
                    : `Recorded water discharge was ${fmt(discharge)} m3.`);
            if (has(dm, 'waterReusedPercent'))
                parts.push(de
                    ? `${fmt(reused, lang)}% des Wassers wurden im betreffenden Prozess wiederverwendet.`
                    : `${fmt(reused)}% of water was reused in the relevant process.`);
            return parts.join(' ');
        },
    },
    // KPI: Water withdrawal
    {
        domains: ['energy_water'],
        topics: ['water_usage'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'waterWithdrawal'))
                return null;
            const de = lang === 'de';
            const water = num(dm, 'waterWithdrawal');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` f\u00FCr den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            const fte = num(dm, 'totalFte');
            const munPct = num(dm, 'waterSourceMunicipalPercent');
            let answer = de
                ? `Unsere gesamte Wasserentnahme${periodStr} betrug ${fmt(water, lang)} m\u00B3.`
                : `Our total water withdrawal${periodStr} was ${fmt(water)} m\u00B3.`;
            if (munPct > 0) {
                answer += de
                    ? ` ${fmt(munPct, lang)}% stammten aus der kommunalen bzw. \u00F6ffentlichen Versorgung, die \u00FCbrigen ${fmt(100 - munPct, lang)}% aus anderen Quellen.`
                    : ` ${fmt(munPct)}% was sourced from municipal/public supply, with the remaining ${fmt(100 - munPct)}% from other sources.`;
            }
            if (fte > 0)
                answer += de
                    ? ` Das entspricht ungef\u00E4hr ${fmt(water / fte, lang)} m\u00B3 pro Besch\u00E4ftigtem.`
                    : ` This equates to approximately ${fmt(water / fte)} m\u00B3 per employee.`;
            return answer;
        },
    },
    // POLICY/MEASURE: Wastewater / discharge. Reads the H3 wastewaterTreatmentDetails
    // where present; honest gap otherwise.
    {
        domains: ['effluents', 'energy_water'],
        topics: ['wastewater'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const water = num(dm, 'waterWithdrawal');
            const treatment = str(dm, 'wastewaterTreatmentDetails');
            const parts = [];
            if (treatment) {
                parts.push(de
                    ? `Unsere Abwasserbehandlung erfolgt wie folgt: ${treatment}.`
                    : `Our wastewater is treated as follows: ${treatment}.`);
            }
            else {
                parts.push(de
                    ? 'F\u00FCr diese Frage haben wir weder Abwassermengen noch Angaben zu Behandlung oder \u00DCberwachung hinterlegt.'
                    : 'We do not have wastewater-discharge volumes, treatment details or monitoring practices on record for this question.');
            }
            if (water)
                parts.push(de
                    ? `Unsere gesamte Wasserentnahme betr\u00E4gt ${fmt(water, lang)} m\u00B3 pro Jahr.`
                    : `Our total water withdrawal is ${fmt(water)} m\u00B3 per year.`);
            return { answer: parts.join(' '), drafted: !treatment };
        },
    },
    // POLICY/MEASURE: Water stress
    {
        domains: ['energy_water'],
        topics: ['water_stress'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const water = num(dm, 'waterWithdrawal');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (country)
                parts.push(de ? `Als Land des Hauptsitzes ist ${deCountry(country, lang)} hinterlegt.` : `Our headquarters country is ${deCountry(country, lang)}.`);
            parts.push(de
                ? 'F\u00FCr diese Frage haben wir keine Bewertung der Exposition gegen\u00FCber Regionen mit Wasserstress hinterlegt.'
                : 'We do not have an assessment of exposure to water-stressed regions on record for this question.');
            if (water)
                parts.push(de
                    ? `Unsere gesamte Wasserentnahme betr\u00E4gt ${fmt(water, lang)} m\u00B3 pro Jahr.`
                    : `Our total water withdrawal is ${fmt(water)} m\u00B3 per year.`);
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // ===================================================================
    // COMPANY PROFILE
    // ===================================================================
    {
        domains: ['company'],
        topics: ['company_profile'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'legalEntityName'))
                return null;
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const ind = str(dm, 'industryDescription');
            const country = str(dm, 'headquartersCountry');
            const period = str(dm, 'reportingPeriod');
            const ownership = str(dm, 'ownershipStructure');
            const rev = str(dm, 'revenueBand');
            const fte = num(dm, 'totalFte');
            let answer = de
                ? `Der rechtliche Name unserer Organisation lautet ${name}.`
                : `The legal name of our organization is ${name}.`;
            const addr = str(dm, 'registeredAddress');
            if (country)
                answer += de ? ` Der Hauptsitz befindet sich in ${deCountry(country, lang)}.` : ` Its headquarters country is ${deCountry(country, lang)}.`;
            if (addr)
                answer += de ? ` Eingetragene Anschrift: ${addr}.` : ` Registered address: ${addr}.`;
            if (ind && ind.toLowerCase() !== 'other')
                answer += de ? ` Wir sind im Sektor ${ind} tätig.` : ` We operate in the ${ind} sector.`;
            if (fte > 0)
                answer += de ? ` Wir beschäftigen ${fmt(fte, lang)} Personen.` : ` We employ ${fmt(fte)} people.`;
            if (ownership)
                answer += de ? ` Eigentümerstruktur: ${ownership}.` : ` Ownership structure: ${ownership}.`;
            if (rev)
                answer += de ? ` Umsatzband: ${rev}.` : ` Revenue band: ${rev}.`;
            if (period)
                answer += de ? ` Diese Daten beziehen sich auf den Berichtszeitraum ${period}.` : ` This data covers the reporting period ${period}.`;
            return answer;
        },
    },
    // KPI: Sites / facilities
    {
        domains: ['site', 'company'],
        topics: ['facilities', 'company_profile'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const sites = num(dm, 'numberOfSites');
            const country = str(dm, 'headquartersCountry');
            const operatingCountries = str(dm, 'operatingCountries');
            const fte = num(dm, 'totalFte');
            if (!sites && !name)
                return null;
            const orgDe = name || 'Unsere Organisation';
            const parts = [];
            if (sites > 1) {
                parts.push(de
                    ? `${orgDe} betreibt ${sites} Standorte${operatingCountries ? ` in ${deCountries(operatingCountries, lang)}` : ''}${country ? ` mit Hauptsitz in ${deCountry(country, lang)}` : ''}.`
                    : `${name || 'Our organization'} operates ${sites} facilities${operatingCountries ? ` across ${operatingCountries}` : ''}${country ? `, with headquarters in ${deCountry(country, lang)}` : ''}.`);
            }
            else if (sites === 1) {
                parts.push(de
                    ? `${orgDe} betreibt einen einzigen Standort${country ? ` in ${deCountry(country, lang)}` : ''}.`
                    : `${name || 'Our organization'} operates from a single site${country ? ` in ${deCountry(country, lang)}` : ''}.`);
            }
            else {
                parts.push(de
                    ? (country
                        ? `${orgDe} hat seinen Hauptsitz in ${deCountry(country, lang)}. Für diese Frage haben wir keine Standortanzahl hinterlegt.`
                        : `Für ${name || 'unsere Organisation'} haben wir weder eine Standortanzahl noch Angaben zum Hauptsitz hinterlegt.`)
                    : (country
                        ? `${name || 'Our organization'} has its headquarters in ${deCountry(country, lang)}. We do not have a site count on record for this question.`
                        : `We do not have site-count or headquarters details on record for ${name || 'our organization'}.`));
            }
            if (fte > 0)
                parts.push(de
                    ? `Die Gesamtbelegschaft an allen Standorten beträgt ${fmt(fte, lang)} VZÄ.`
                    : `The total workforce across all sites is ${fmt(fte)} FTE employees.`);
            return parts.join(' ');
        },
    },
    // Group structure / subsidiary (Q5)
    {
        domains: ['company'],
        topics: ['group_structure', 'company_profile'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const parent = str(dm, 'parentCompany');
            const subs = str(dm, 'subsidiaries');
            const ownership = str(dm, 'ownershipStructure');
            const orgDe = name || 'unsere Organisation';
            const parts = [];
            if (parent) {
                parts.push(de ? `Ja, ${orgDe} ist eine Tochtergesellschaft von ${parent}.` : `Yes, ${name || 'our organization'} is a subsidiary of ${parent}.`);
            }
            else {
                // No parent on file is not the same as having no parent.
                if (ownership)
                    parts.push(de ? `Hinterlegte Eigentümerstruktur: ${ownership}.` : `Ownership structure on record: ${ownership}.`);
                parts.push(de
                    ? 'Für diese Frage haben wir keine Angaben zur Muttergesellschaft oder Konzernzugehörigkeit hinterlegt.'
                    : 'We do not have parent-company or group-structure details on record for this question.');
            }
            if (subs)
                parts.push(de ? `Wir verfügen über die folgenden Tochtergesellschaften: ${subs}.` : `We have the following subsidiary operations: ${subs}.`);
            return parts.join(' ');
        },
    },
    // Products and services
    {
        domains: ['products'],
        topics: ['production_metrics', 'facility_metrics'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const units = num(dm, 'unitsProduced');
            const hours = num(dm, 'productionHours');
            const material = num(dm, 'materialInputTonnes');
            const ore = num(dm, 'oreProcessedTonnes');
            const stores = num(dm, 'storeCount');
            const storeArea = num(dm, 'storeAreaM2');
            const warehouse = num(dm, 'warehouseSpaceM2');
            const deliveries = num(dm, 'deliveriesCount');
            const office = num(dm, 'officeSpaceM2');
            if (!has(dm, 'unitsProduced') &&
                !has(dm, 'productionHours') &&
                !has(dm, 'materialInputTonnes') &&
                !has(dm, 'oreProcessedTonnes') &&
                !has(dm, 'storeCount') &&
                !has(dm, 'storeAreaM2') &&
                !has(dm, 'warehouseSpaceM2') &&
                !has(dm, 'deliveriesCount') &&
                !has(dm, 'officeSpaceM2'))
                return null;
            const parts = [];
            parts.push(de ? 'Betriebliche Aktivitätskennzahlen für den Berichtszeitraum:' : 'Operational activity metrics for the reporting period are as follows:');
            if (has(dm, 'unitsProduced'))
                parts.push(de ? `Produzierte Einheiten: ${fmt(units, lang)}.` : `Units produced: ${fmt(units)}.`);
            if (has(dm, 'productionHours'))
                parts.push(de ? `Produktionsstunden: ${fmt(hours, lang)} Stunden.` : `Production hours: ${fmt(hours)} hours.`);
            if (has(dm, 'materialInputTonnes'))
                parts.push(de ? `Materialeinsatz: ${fmt(material, lang)} Tonnen.` : `Material input: ${fmt(material)} tonnes.`);
            if (has(dm, 'oreProcessedTonnes'))
                parts.push(de ? `Verarbeitetes Erz/Material: ${fmt(ore, lang)} Tonnen.` : `Ore/material processed: ${fmt(ore)} tonnes.`);
            if (has(dm, 'storeCount'))
                parts.push(de ? `Filialen: ${fmt(stores, lang)}.` : `Stores: ${fmt(stores)}.`);
            if (has(dm, 'storeAreaM2'))
                parts.push(de ? `Verkaufsfläche: ${fmt(storeArea, lang)} m2.` : `Store area: ${fmt(storeArea)} m2.`);
            if (has(dm, 'warehouseSpaceM2'))
                parts.push(de ? `Lagerfläche: ${fmt(warehouse, lang)} m2.` : `Warehouse space: ${fmt(warehouse)} m2.`);
            if (has(dm, 'deliveriesCount'))
                parts.push(de ? `Durchgeführte Lieferungen: ${fmt(deliveries, lang)}.` : `Deliveries made: ${fmt(deliveries)}.`);
            if (has(dm, 'officeSpaceM2'))
                parts.push(de ? `Bürofläche: ${fmt(office, lang)} m2.` : `Office space: ${fmt(office)} m2.`);
            return parts.join(' ');
        },
    },
    // Products and services
    {
        domains: ['products', 'company'],
        topics: ['products_services', 'company_profile'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const ind = str(dm, 'industryDescription');
            const country = str(dm, 'headquartersCountry');
            const fte = num(dm, 'totalFte');
            const rev = str(dm, 'revenueBand');
            const products = str(dm, 'productsServices');
            const markets = str(dm, 'mainMarkets');
            const customers = str(dm, 'customerTypes');
            const operatingCountries = str(dm, 'operatingCountries');
            if (!name && !products)
                return null;
            const parts = [];
            if (name) {
                parts.push(de
                    ? `${name} ist ${ind && ind.toLowerCase() !== 'other' ? `ein Unternehmen der Branche ${ind}` : 'eine Organisation'}${country ? ` mit Sitz in ${deCountry(country, lang)}` : ''}.`
                    : `${name} is ${ind && ind.toLowerCase() !== 'other' ? `a ${ind} company` : 'an organization'}${country ? ` based in ${deCountry(country, lang)}` : ''}.`);
            }
            if (products) {
                parts.push(de ? `Unsere wichtigsten Produkte und Dienstleistungen: ${products}` : `Our main products and services: ${products}`);
            }
            if (markets) {
                parts.push(de ? `Wir bedienen vorrangig ${deCountries(markets, lang)}.` : `We primarily serve ${markets}.`);
            }
            else if (operatingCountries) {
                parts.push(de ? `Wir sind in ${deCountries(operatingCountries, lang)} tätig.` : `We operate in ${operatingCountries}.`);
            }
            if (customers) {
                parts.push(de ? `Unser Kundenstamm besteht aus ${customers}.` : `Our customer base is ${customers}.`);
            }
            if (fte)
                parts.push(de ? `Wir beschäftigen ${fmt(fte, lang)} Personen.` : `We employ ${fmt(fte)} people.`);
            if (rev)
                parts.push(de ? `Umsatzband: ${rev}.` : `Revenue band: ${rev}.`);
            if (!products && !markets) {
                parts.push(de
                    ? 'Eine Beschreibung unserer Produkte, Dienstleistungen und bedienten Märkte wurde für diese Frage nicht bereitgestellt.'
                    : 'A description of our products, services, and served markets has not been provided for this question.');
            }
            return parts.join(' ');
        },
    },
    // Revenue band
    {
        domains: ['financial_context', 'company'],
        topics: ['revenue'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const rev = str(dm, 'revenueBand');
            if (!rev)
                return null;
            const name = str(dm, 'legalEntityName');
            const period = str(dm, 'reportingPeriod');
            return de
                ? `${name ? `${name}s jährliches Umsatzband` : 'Unser jährliches Umsatzband'} beträgt ${rev}${period ? ` (${period})` : ''}.`
                : `${name ? name + "'s" : 'Our'} annual revenue band is ${rev}${period ? ` (${period})` : ''}.`;
        },
    },
    // ===================================================================
    // CERTIFICATIONS & COMPLIANCE
    // ===================================================================
    // External assurance (Q52 — MUST come before general certs to win on array order)
    {
        domains: ['regulatory'],
        topics: ['external_assurance'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const assured = str(dm, 'externalAssurance');
            const standard = str(dm, 'assuranceStandard');
            const certs = str(dm, 'certificationsHeld');
            const validCerts = str(dm, 'validCertificates');
            const parts = [];
            if (assured === 'Yes') {
                parts.push(de
                    ? `Ja, die ESG-Daten von ${name || 'unserer Organisation'} wurden extern geprüft.`
                    : `Yes, ${name || 'our organization'}'s ESG data has been externally assured.`);
                if (standard)
                    parts.push(de ? `Die Prüfung erfolgte nach ${standard}.` : `Assurance was conducted to ${standard}.`);
            }
            else if (assured === 'No') {
                parts.push(de
                    ? `Die ESG-Daten von ${name || 'unserer Organisation'} wurden bislang nicht nach Standards wie ISAE 3000 oder AA1000 extern geprüft.`
                    : `${name || 'Our organization'}'s ESG data has not yet been externally assured under standards such as ISAE 3000 or AA1000.`);
                if (certs || validCerts) {
                    // De-duplicate so profile certs and uploaded-document certs for the same standard
                    // (e.g. "ISO 14001 (Environment)" + "ISO 14001:2015 Certificate") list once.
                    const certList = dedupeCerts([certs, validCerts].filter(Boolean).join(',').split(',').map(c => c.trim()).filter(Boolean)).join(', ');
                    parts.push(de
                        ? `Unsere Managementsysteme werden zu Zertifizierungszwecken extern auditiert (${certList}), diese Zertifizierungsaudits sind jedoch von einer ESG-Datenprüfung zu unterscheiden.`
                        : `Our management systems are externally audited for certification purposes (${certList}), but these certification audits are distinct from ESG data assurance.`);
                }
            }
            else if (assured === 'Not applicable') {
                parts.push(de
                    ? `Eine externe Prüfung der ESG-Daten ist für ${name || 'unsere Organisation'} als nicht zutreffend gekennzeichnet.`
                    : `External assurance of ESG data is marked as not applicable to ${name || 'our organization'}.`);
            }
            else {
                return { answer: de
                        ? `Der Status einer externen Prüfung der ESG-Daten wurde nicht erfasst. Managementsystem-Zertifizierungen werden möglicherweise gesondert auditiert.`
                        : `External assurance status for ESG data has not been recorded. Management system certifications may be audited separately.`, drafted: true };
            }
            return parts.join(' ');
        },
    },
    // General certifications (Q50 — must list ALL certs, ideally with validity dates)
    {
        domains: ['regulatory'],
        topics: ['certifications'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const certs = str(dm, 'certificationsHeld');
            const validCerts = str(dm, 'validCertificates');
            if (certs || validCerts) {
                const allCerts = [certs, validCerts].filter(Boolean).join(',').split(',').map(c => c.trim()).filter(Boolean);
                const uniqueCerts = dedupeCerts(allCerts);
                const parts = [];
                parts.push(de
                    ? `Für diese Frage ist folgende Zertifizierung unserer Organisation hinterlegt: ${uniqueCerts.join('; ')}.`
                    : `Our organization holds the following certification recorded for this question: ${uniqueCerts.join('; ')}.`);
                parts.push(de
                    ? 'Zertifikatsnummern und Gültigkeitsdaten sind nicht hinterlegt.'
                    : 'We do not have certificate numbers or validity dates on record.');
                return parts.join(' ');
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keine Umwelt- oder Qualitätsmanagement-Zertifizierungen durch Dritte hinterlegt.'
                    : 'We do not have third-party environmental or quality management certifications on record for this question.', drafted: true };
        },
    },
    // ISO 45001 specific (H&S certification)
    {
        domains: ['regulatory'],
        topics: ['health_safety_management'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const certs = str(dm, 'certificationsHeld');
            const validCerts = str(dm, 'validCertificates');
            const allCerts = [certs, validCerts].filter(Boolean).join(', ').toLowerCase();
            if (allCerts.includes('45001')) {
                return de
                    ? 'Ja, unsere Organisation ist nach ISO 45001 für ihr Arbeitssicherheits-Managementsystem zertifiziert.'
                    : 'Yes, our organization holds ISO 45001 certification for our occupational health and safety management system.';
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keine ISO-45001- oder gleichwertige Arbeitssicherheitszertifizierung hinterlegt.'
                    : 'We do not have ISO 45001 or an equivalent health and safety certification on record for this question.', drafted: true };
        },
    },
    // ===================================================================
    // TRAINING
    // ===================================================================
    {
        domains: ['training', 'workforce'],
        topics: ['training'],
        generate: (dm, fw, lang) => {
            if (!has(dm, 'trainingHoursPerEmployee'))
                return null;
            const de = lang === 'de';
            const perEmp = num(dm, 'trainingHoursPerEmployee');
            const total = num(dm, 'totalTrainingHours');
            const fte = num(dm, 'totalFte');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` für den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            let answer = de
                ? `Wir haben${periodStr} durchschnittlich ${fmt(perEmp, lang)} Weiterbildungsstunden pro Mitarbeitendem durchgeführt.`
                : `${periodStr.charAt(0).toUpperCase() + periodStr.slice(1)}, we delivered an average of ${fmt(perEmp)} training hours per employee.`;
            if (total > 0 && fte > 0)
                answer += de
                    ? ` Dies entspricht insgesamt ${fmt(total, lang)} Weiterbildungsstunden über unsere ${fmt(fte, lang)} Mitarbeitenden hinweg.`
                    : ` This represents a total of ${fmt(total)} hours of training across our ${fmt(fte)} employees.`;
            return answer;
        },
    },
    // ===================================================================
    // SUSTAINABILITY GOALS / TARGETS
    // ===================================================================
    // POLICY: Documented policies — lists the company's approved policies, e.g. for
    // "Do you have a documented environmental policy?" (DE: "Umweltrichtlinie"). Governance,
    // ethics, human-rights, DEI and supplier-code questions route to their own specific
    // templates and never reach this generic one.
    {
        domains: ['goals'],
        topics: ['policies'],
        questionTypes: ['POLICY'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const list = str(dm, 'approvedPolicies').split(',').map((p) => p.trim()).filter(Boolean);
            if (list.length > 0) {
                return de
                    ? `Ja, wir verfügen über die folgenden dokumentierten Richtlinien: ${list.join(', ')}.`
                    : `Yes, we maintain the following documented policies: ${list.join(', ')}.`;
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keine dokumentierte Richtlinie hinterlegt.'
                    : 'We do not have a documented policy on record for this question.', drafted: true };
        },
    },
    {
        domains: ['goals'],
        topics: ['targets', 'strategy', 'climate_targets'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const goal = str(dm, 'primaryGoal');
            if (goal) {
                return de ? `Unser erklärtes Nachhaltigkeitsziel lautet: ${goal}.` : `Our stated sustainability goal is: ${goal}.`;
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keine dokumentierten Nachhaltigkeitsziele oder -vorgaben hinterlegt.'
                    : 'We do not have documented sustainability goals or targets on record for this question.', drafted: true };
        },
    },
    // POLICY: Climate targets / SBTi / net-zero
    {
        domains: ['goals', 'emissions'],
        topics: ['climate_targets', 'ghg_emissions'],
        questionTypes: ['POLICY'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const goal = str(dm, 'primaryGoal');
            const s1 = num(dm, 'scope1Estimate');
            const s2 = num(dm, 'scope2Location');
            const total = s1 + s2;
            const parts = [];
            if (goal && (goal.toLowerCase().includes('net zero') || goal.toLowerCase().includes('sbti') || goal.toLowerCase().includes('carbon'))) {
                parts.push(de ? `Ja, unsere Organisation hat das folgende Klimaziel gesetzt: ${goal}.` : `Yes, our organization has set the following climate target: ${goal}.`);
                if (dm.has('scope1Estimate') && dm.has('scope2Location'))
                    parts.push(de
                        ? `Unsere aktuellen Scope-1- und Scope-2-Emissionen betragen insgesamt ${fmt(total, lang)} tCO2e.`
                        : `Our current Scope 1 + Scope 2 emissions total ${fmt(total)} tCO2e.`);
                return parts.join(' ');
            }
            parts.push(de
                ? 'Für diese Frage haben wir kein wissenschaftsbasiertes Ziel (SBTi), keine Netto-Null-Verpflichtung und keinen Dekarbonisierungsfahrplan hinterlegt.'
                : 'We do not have a science-based target (SBTi), a net-zero commitment or a decarbonisation roadmap on record for this question.');
            if (dm.has('scope1Estimate'))
                parts.push(de
                    ? `Als Scope-1-Emissionen sind ${fmt(s1, lang)} tCO2e erfasst.`
                    : `Recorded Scope 1 emissions are ${fmt(s1)} tCO2e.`);
            if (dm.has('scope2Location'))
                parts.push(de
                    ? `Als standortbasierte Scope-2-Emissionen sind ${fmt(s2, lang)} tCO2e erfasst.`
                    : `Recorded location-based Scope 2 emissions are ${fmt(s2)} tCO2e.`);
            else if (dm.has('scope1Estimate'))
                parts.push(de
                    ? 'Scope-2-Emissionen sind nicht hinterlegt.'
                    : 'Scope 2 emissions are not on record.');
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // Ethics / code of conduct / anti-corruption + governance ethics (conflict of interest,
    // AML, lobbying, tax transparency). Reads antiCorruptionStatus / codeOfConductStatus
    // (H3 governance fields) where present; honest gap otherwise. topics ['ethics','policies']
    // so it wins the anti-corruption/ethics questions over the generic policy/ethics templates.
    {
        domains: ['goals'],
        topics: ['ethics', 'policies'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const ac = statusKind(str(dm, 'antiCorruptionStatus'));
            const coc = statusKind(str(dm, 'codeOfConductStatus'));
            const policies = str(dm, 'governancePoliciesApproved');
            const inPlace = [];
            if (coc === 'available')
                inPlace.push(de ? 'einen Verhaltenskodex' : 'a Code of Conduct');
            if (ac === 'available')
                inPlace.push(de ? 'eine Antikorruptionsrichtlinie' : 'an Anti-Corruption Policy');
            const developing = [];
            if (coc === 'in_progress')
                developing.push(de ? 'einen Verhaltenskodex' : 'a Code of Conduct');
            if (ac === 'in_progress')
                developing.push(de ? 'eine Antikorruptionsrichtlinie' : 'an Anti-Corruption Policy');
            const parts = [];
            if (inPlace.length > 0) {
                parts.push(de
                    ? `Ja, wir unterhalten ${inPlace.join(' und ')}${policies ? ` (${policies})` : ''}.`
                    : `Yes, we maintain ${inPlace.join(' and ')}${policies ? ` (${policies})` : ''}.`);
            }
            else if (policies) {
                parts.push(de
                    ? `Unsere ethischen Standards sind in den folgenden Richtlinien formalisiert: ${policies}.`
                    : `Our ethical standards are formalized in the following policies: ${policies}.`);
            }
            else if (developing.length > 0) {
                parts.push(de
                    ? `${developing.join(' und ')} befindet sich derzeit im Aufbau.`
                    : `${developing.join(' and ')} is currently under development.`);
            }
            else {
                parts.push(de
                    ? 'Für diese Frage haben wir weder einen Ethikkodex noch eine Antikorruptionsrichtlinie hinterlegt.'
                    : 'We do not have a Code of Ethics or an Anti-Corruption Policy on record for this question.');
            }
            parts.push(de
                ? 'Für diese Frage haben wir keine Angaben zu Kontrollen für Interessenkonflikte, Geldwäscheprävention, Lobbyarbeit oder Steuertransparenz hinterlegt.'
                : 'We do not have control details for conflict of interest, anti-money-laundering, lobbying or tax transparency on record for this question.');
            return { answer: parts.join(' '), drafted: inPlace.length === 0 && !policies };
        },
    },
    // POLICY: Corporate governance / board oversight of ESG + (double) materiality assessment
    // (H7). Materiality and board-oversight questions route identically to goals/[governance,
    // strategy], so a single honest answer covers both — describing whether an ESG governance
    // structure and a (double) materiality assessment have been documented.
    {
        domains: ['goals', 'regulatory'],
        topics: ['governance', 'strategy'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const policies = str(dm, 'governancePoliciesApproved');
            const certs = str(dm, 'certificationsHeld');
            const parts = [];
            if (policies)
                parts.push(de
                    ? `Unser Governance-Rahmen wird durch die folgenden Richtlinien gestützt: ${policies}.`
                    : `Our governance framework is supported by the following policies: ${policies}.`);
            if (certs)
                parts.push(de
                    ? `Wir verfügen über die folgenden Managementsystem-Zertifizierungen: ${certs}.`
                    : `We hold the following management-system certifications: ${certs}.`);
            parts.push(de
                ? 'Für diese Frage haben wir weder eine ESG-Governance-Struktur mit Verantwortlichkeiten und Berichtswegen noch eine Wesentlichkeitsanalyse hinterlegt.'
                : 'We do not have an ESG governance structure, accountability and reporting lines, or a materiality assessment on record for this question.');
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // POLICY: Fines, sanctions, legal proceedings (Q45)
    {
        domains: ['goals', 'regulatory'],
        topics: ['fines_sanctions'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const status = str(dm, 'noSignificantFines');
            if (status === 'none') {
                return de
                    ? 'Für diese Frage sind keine wesentlichen Bußgelder, Sanktionen oder Gerichtsverfahren hinterlegt.'
                    : 'No significant fines, sanctions or legal proceedings are recorded for this question.';
            }
            if (status === 'yes') {
                return de
                    ? 'Relevante Bußgelder, Sanktionen oder Gerichtsverfahren sind als offengelegt hinterlegt. Für diese Frage haben wir keine Einzelheiten dazu hinterlegt.'
                    : 'Relevant fines, sanctions or legal proceedings are recorded as having been disclosed. We do not have their details on record for this question.';
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keinen Status zu Bußgeldern, Sanktionen oder Gerichtsverfahren hinterlegt.'
                    : 'We do not have fines, sanctions or legal-proceedings status on record for this question.', drafted: true };
        },
    },
    // POLICY: Data protection / GDPR (Q46)
    {
        domains: ['goals', 'regulatory'],
        topics: ['data_protection'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const hasPolicy = str(dm, 'dataProtectionPolicy');
            const parts = [];
            if (hasPolicy === 'Yes') {
                parts.push(de
                    ? 'Ja, eine Datenschutzrichtlinie ist als vorhanden hinterlegt.'
                    : 'Yes, a data protection and privacy policy is recorded as being in place.');
                parts.push(de
                    ? 'Für diese Frage haben wir weder Angaben zu ihrer rechtlichen Ausrichtung noch zu den konkreten Schutzmaßnahmen hinterlegt.'
                    : 'We do not have its legal alignment or specific safeguards on record for this question.');
                return parts.join(' ');
            }
            if (hasPolicy === 'No') {
                return { answer: de
                        ? `Nein, laut den hinterlegten Angaben verfügt ${name || 'unsere Organisation'} derzeit über keine formelle Datenschutzrichtlinie.`
                        : `No, the record states that ${name || 'our organization'} does not currently have a formal data protection and privacy policy.`, drafted: true };
            }
            if (hasPolicy === 'Not applicable') {
                return { answer: de
                        ? `Eine Datenschutzrichtlinie ist für ${name || 'unsere Organisation'} als nicht zutreffend gekennzeichnet.`
                        : `A data protection and privacy policy is marked as not applicable to ${name || 'our organization'}.` };
            }
            return { answer: de
                    ? 'Für diese Frage haben wir den Status einer Datenschutzrichtlinie nicht hinterlegt.'
                    : 'We do not have the status of a data protection and privacy policy on record for this question.', drafted: true };
        },
    },
    // POLICY: ESG-linked executive compensation (Q48)
    {
        domains: ['goals'],
        topics: ['esg_compensation'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            return {
                answer: de
                    ? 'Für diese Frage haben wir keine Angaben zu ESG-gebundenen Vergütungs- oder Anreizstrukturen für Führungskräfte hinterlegt.'
                    : 'We do not have details of ESG-linked executive compensation or incentive structures on record for this question.',
                drafted: true,
            };
        },
    },
    // POLICY: CSRD applicability and timeline (Q53)
    {
        domains: ['regulatory'],
        topics: ['csrd'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const fte = num(dm, 'totalFte');
            const rev = str(dm, 'revenueBand');
            const csrd = str(dm, 'csrdApplicable');
            const buildDetails = () => de
                ? [fte > 0 ? `${fmt(fte, lang)} Mitarbeitende` : null, rev ? `Umsatzband ${rev}` : null].filter(Boolean).join(', ')
                : [fte > 0 ? `${fmt(fte)} employees` : null, rev ? `revenue band ${rev}` : null].filter(Boolean).join(', ');
            const parts = [];
            if (csrd === 'yes') {
                parts.push(de
                    ? `Ja, ${name || 'unsere Organisation'} unterliegt den CSRD-Berichtspflichten.`
                    : `Yes, ${name || 'our organization'} is subject to CSRD reporting obligations.`);
            }
            else if (csrd === 'no') {
                parts.push(de
                    ? `${name || 'Unsere Organisation'} ist als derzeit nicht CSRD-berichtspflichtig hinterlegt.`
                    : `${name || 'Our organization'} is recorded as not currently subject to CSRD reporting obligations.`);
                if (fte > 0 || rev) {
                    const details = buildDetails();
                    parts.push(de ? `Aktuelles Profil: ${details}.` : `Current profile: ${details}.`);
                }
            }
            else if (csrd === 'assessing') {
                parts.push(de
                    ? `Laut den hinterlegten Angaben prüft ${name || 'unsere Organisation'} derzeit, ob sie der CSRD-Berichtspflicht unterliegt.`
                    : `${name || 'Our organization'} is recorded as currently assessing its applicability under CSRD.`);
                if (fte > 0 || rev) {
                    const details = buildDetails();
                    parts.push(de
                        ? `Hinterlegtes Unternehmensprofil: ${details}.`
                        : `Company profile on record: ${details}.`);
                }
            }
            else {
                // No csrdApplicable data — return null to let other templates try
                // (e.g., the reporting template for Q51 "do you publish a report")
                return null;
            }
            return parts.join(' ');
        },
    },
    // MEASURE: Incident investigation process (Q34)
    {
        domains: ['health_safety'],
        topics: ['incident_investigation'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const trir = num(dm, 'trir');
            const lti = num(dm, 'lostTimeIncidents');
            const certs = str(dm, 'certificationsHeld');
            const parts = [];
            if (certs && certs.toLowerCase().includes('45001')) {
                parts.push(de
                    ? 'Das Vorfallmanagement erfolgt innerhalb unseres nach ISO 45001 zertifizierten Arbeitssicherheits-Managementsystems.'
                    : 'Incident management is conducted within our ISO 45001-certified occupational health and safety management system.');
            }
            // TRIR was printed unconditionally, so supplying only lost-time incidents reported a TRIR of
            // zero the supplier never gave. Name only what was entered.
            if (has(dm, 'trir') || has(dm, 'lostTimeIncidents')) {
                const metrics = [];
                if (has(dm, 'trir'))
                    metrics.push(`TRIR ${fmt(trir, lang)}`);
                if (has(dm, 'lostTimeIncidents'))
                    metrics.push(de ? `Ausfallzeit-Unfälle: ${lti}` : `lost time incidents: ${lti}`);
                parts.push(de
                    ? `Erfasste Sicherheitsleistung: ${metrics.join(', ')}.`
                    : `Recorded safety performance: ${metrics.join(', ')}.`);
            }
            parts.push(de
                ? 'Für diese Frage haben wir keinen Prozess für Vorfalluntersuchungen und Korrekturmaßnahmen hinterlegt.'
                : 'We do not have an incident-investigation and corrective-action process on record for this question.');
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // ===================================================================
    // FUEL
    // ===================================================================
    {
        domains: ['energy_fuel'],
        topics: ['energy_consumption', 'scope_1'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const gas = num(dm, 'fuel_natural_gas');
            const diesel = num(dm, 'fuel_diesel');
            const period = str(dm, 'reportingPeriod');
            const periodStr = de
                ? (period ? ` f\u00FCr den Zeitraum ${period}` : ' im Berichtszeitraum')
                : (period ? ` during ${period}` : ' during the reporting period');
            if (gas || diesel) {
                const parts = [de ? `Unser Kraftstoffverbrauch${periodStr}:` : `Our fuel consumption${periodStr}:`];
                if (gas) {
                    // Report gas in the unit the data is tracked in (m\u00B3 here), and \u2014 because gas
                    // questionnaires often ask for kWh \u2014 also give an approximate kWh equivalent using a
                    // standard calorific value, rather than answering a kWh question in m\u00B3 alone.
                    const gasUnitRaw = dm.get('fuel_natural_gas')?.unit || 'm3';
                    const gasUnit = gasUnitRaw === 'm3' ? 'm\u00B3' : gasUnitRaw;
                    let gasLine = de ? `Erdgas: ${fmt(gas, lang)} ${gasUnit}` : `Natural gas: ${fmt(gas)} ${gasUnit}`;
                    if (gasUnitRaw === 'm3') {
                        const gasKwh = gas * GAS_M3_TO_KWH;
                        gasLine += de
                            ? ` (entspricht rund ${fmt(gasKwh, lang)} kWh, umgerechnet mit einem Standard-Brennwert von ${fmt(GAS_M3_TO_KWH, lang)} kWh/m\u00B3)`
                            : ` (approximately ${fmt(gasKwh)} kWh, converted using a standard calorific value of ${fmt(GAS_M3_TO_KWH)} kWh/m\u00B3)`;
                    }
                    parts.push(gasLine + '.');
                }
                if (diesel)
                    parts.push(de ? `Diesel: ${fmt(diesel, lang)} Liter.` : `Diesel: ${fmt(diesel)} litres.`);
                return parts.join(' ');
            }
            return { answer: de
                    ? 'F\u00FCr diese Frage haben wir keine nach Kraftstoffart aufgeschl\u00FCsselten Verbrauchsdaten hinterlegt.'
                    : 'We do not have fuel-consumption figures by fuel type on record for this question.', drafted: true };
        },
    },
    // ===================================================================
    // TRANSPORT
    // ===================================================================
    // Fleet composition
    {
        domains: ['transport'],
        topics: ['fleet'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const diesel = num(dm, 'fuel_diesel');
            const km = num(dm, 'totalKmDriven');
            const fleetSize = num(dm, 'fleetSize');
            const vehicleAge = num(dm, 'avgVehicleAge');
            const altFuel = num(dm, 'altFuelPercent');
            const composition = str(dm, 'fleetComposition');
            const parts = [];
            if (composition || has(dm, 'totalKmDriven') || has(dm, 'fleetSize') || has(dm, 'avgVehicleAge') || has(dm, 'altFuelPercent')) {
                parts.push(de ? 'Für den Berichtszeitraum erfasste Fuhrpark-Aktivität:' : 'Fleet activity recorded for the reporting period:');
                if (composition)
                    parts.push(de ? `Fuhrparkzusammensetzung: ${composition}.` : `Fleet composition: ${composition}.`);
                if (has(dm, 'fleetSize'))
                    parts.push(de ? `Fuhrparkgröße: ${fmt(fleetSize, lang)} Fahrzeuge.` : `Fleet size: ${fmt(fleetSize)} vehicles.`);
                if (has(dm, 'totalKmDriven'))
                    parts.push(de ? `Zurückgelegte Gesamtstrecke: ${fmt(km, lang)} km.` : `Total distance driven: ${fmt(km)} km.`);
                if (has(dm, 'avgVehicleAge'))
                    parts.push(de ? `Durchschnittliches Fahrzeugalter: ${fmt(vehicleAge, lang)} Jahre.` : `Average vehicle age: ${fmt(vehicleAge)} years.`);
                if (has(dm, 'altFuelPercent'))
                    parts.push(de ? `Fahrzeuge mit alternativen Antrieben: ${fmt(altFuel, lang)}% des Fuhrparks.` : `Alternative-fuel vehicles: ${fmt(altFuel)}% of the fleet.`);
                if (diesel)
                    parts.push(de ? `Dieselverbrauch: ${fmt(diesel, lang)} Liter.` : `Diesel consumption: ${fmt(diesel)} litres.`);
                return { answer: parts.join(' '), drafted: !composition && !has(dm, 'fleetSize') && !has(dm, 'totalKmDriven') };
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keine Angaben zur Fuhrparkzusammensetzung oder fuhrparkbezogene Daten hinterlegt.'
                    : 'We do not have fleet-composition or fleet-related data on record for this question.', drafted: true };
        },
    },
    // Transport / logistics environmental impact (catches questions that don't match fleet/business_travel).
    // Reads the H3 transportReductionMeasures where present; honest gap otherwise.
    {
        domains: ['transport'],
        topics: ['transport', 'logistics'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const measures = str(dm, 'transportReductionMeasures');
            if (measures) {
                return { answer: de
                        ? `Zur Verringerung der Umweltauswirkungen von Transport und Logistik setzen wir die folgenden Maßnahmen um: ${measures}.`
                        : `To reduce the environmental impact of transportation and logistics, we implement the following measures: ${measures}.` };
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keine Bewertung der Umweltauswirkungen von Transport und Logistik hinterlegt.'
                    : 'We do not have an assessment of the environmental impact of transportation and logistics on record for this question.',
                drafted: true };
        },
    },
    // Business travel / commuting (Scope 3)
    {
        domains: ['transport'],
        topics: ['business_travel', 'scope_3'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const travel = num(dm, 'businessTravel');
            const commute = num(dm, 'employeeCommute');
            const s3 = num(dm, 'scope3Total');
            const wfh = num(dm, 'wfhPercent');
            const parts = [];
            if (s3)
                parts.push(de ? `Unsere Scope-3-Emissionen betragen insgesamt ${fmt(s3, lang)} tCO2e.` : `Our Scope 3 emissions total ${fmt(s3)} tCO2e.`);
            if (travel)
                parts.push(de ? `Geschäftsreisen: ${fmt(travel, lang)} km.` : `Business travel: ${fmt(travel)} km.`);
            if (commute)
                parts.push(de ? `Arbeitswege der Mitarbeitenden: ${fmt(commute, lang)} km.` : `Employee commuting: ${fmt(commute)} km.`);
            if (has(dm, 'wfhPercent'))
                parts.push(de ? `Anteil Homeoffice: ${fmt(wfh, lang)}%.` : `Remote work coverage: ${fmt(wfh)}%.`);
            if (parts.length === 0) {
                return { answer: de
                        ? 'Für diese Frage haben wir keine Scope-3-Daten zu Geschäftsreisen oder Arbeitswegen der Mitarbeitenden hinterlegt.'
                        : 'We do not have Scope 3 figures for business travel or employee commuting on record for this question.', drafted: true };
            }
            return { answer: parts.join(' '), drafted: !s3 };
        },
    },
    // ===================================================================
    // MATERIALS & SUPPLY CHAIN
    // ===================================================================
    // Raw materials
    {
        domains: ['materials'],
        topics: ['agriculture_inputs'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const land = num(dm, 'landUseHectares');
            const fertilizer = num(dm, 'fertilizerKg');
            const pesticide = num(dm, 'pesticideKg');
            const irrigation = num(dm, 'irrigationWaterM3');
            const seasonal = num(dm, 'seasonalWorkers');
            if (!has(dm, 'landUseHectares') && !has(dm, 'fertilizerKg') && !has(dm, 'pesticideKg') && !has(dm, 'irrigationWaterM3') && !has(dm, 'seasonalWorkers'))
                return null;
            const parts = [];
            parts.push(de ? 'Für den Berichtszeitraum erfasste landwirtschaftliche Betriebsmittel:' : 'Agriculture-related operational inputs recorded for the reporting period:');
            if (has(dm, 'landUseHectares'))
                parts.push(de ? `Flächennutzung: ${fmt(land, lang)} Hektar.` : `Land use: ${fmt(land)} hectares.`);
            if (has(dm, 'fertilizerKg'))
                parts.push(de ? `Düngemitteleinsatz: ${fmt(fertilizer, lang)} kg.` : `Fertilizer use: ${fmt(fertilizer)} kg.`);
            if (has(dm, 'pesticideKg'))
                parts.push(de ? `Pestizideinsatz: ${fmt(pesticide, lang)} kg.` : `Pesticide use: ${fmt(pesticide)} kg.`);
            if (has(dm, 'irrigationWaterM3'))
                parts.push(de ? `Bewässerungswasser: ${fmt(irrigation, lang)} m3.` : `Irrigation water: ${fmt(irrigation)} m3.`);
            if (has(dm, 'seasonalWorkers'))
                parts.push(de ? `Saisonarbeitskräfte: ${fmt(seasonal, lang)}.` : `Seasonal workers: ${fmt(seasonal)}.`);
            return parts.join(' ');
        },
    },
    {
        domains: ['materials'],
        topics: ['mining_metrics'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const ore = num(dm, 'oreProcessedTonnes');
            const tailings = num(dm, 'tailingsGeneratedTonnes');
            const reused = num(dm, 'waterReusedPercent');
            const rehab = num(dm, 'rehabilitatedLandHectares');
            if (!has(dm, 'oreProcessedTonnes') && !has(dm, 'tailingsGeneratedTonnes') && !has(dm, 'waterReusedPercent') && !has(dm, 'rehabilitatedLandHectares'))
                return null;
            const parts = [];
            parts.push(de ? 'Für den Berichtszeitraum erfasste Bergbau- und Materialaktivität:' : 'Mining and materials activity recorded for the reporting period:');
            if (has(dm, 'oreProcessedTonnes'))
                parts.push(de ? `Verarbeitetes Erz/Material: ${fmt(ore, lang)} Tonnen.` : `Ore/material processed: ${fmt(ore)} tonnes.`);
            if (has(dm, 'tailingsGeneratedTonnes'))
                parts.push(de ? `Angefallene Aufbereitungsrückstände: ${fmt(tailings, lang)} Tonnen.` : `Tailings generated: ${fmt(tailings)} tonnes.`);
            if (has(dm, 'waterReusedPercent'))
                parts.push(de ? `Wiederverwendetes Wasser: ${fmt(reused, lang)}%.` : `Water reused: ${fmt(reused)}%.`);
            if (has(dm, 'rehabilitatedLandHectares'))
                parts.push(de ? `Renaturierte Fläche: ${fmt(rehab, lang)} Hektar.` : `Land rehabilitated: ${fmt(rehab)} hectares.`);
            return parts.join(' ');
        },
    },
    {
        domains: ['materials'],
        topics: ['construction_materials'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const concrete = num(dm, 'concreteTonnes');
            const steel = num(dm, 'steelTonnes');
            const equipment = num(dm, 'equipmentHours');
            if (!has(dm, 'concreteTonnes') && !has(dm, 'steelTonnes') && !has(dm, 'equipmentHours'))
                return null;
            const parts = [];
            parts.push(de ? 'Für den Berichtszeitraum erfasste Aktivität zu Baumaterialien und Geräten:' : 'Construction material and equipment activity recorded for the reporting period:');
            if (has(dm, 'concreteTonnes'))
                parts.push(de ? `Beton: ${fmt(concrete, lang)} Tonnen.` : `Concrete: ${fmt(concrete)} tonnes.`);
            if (has(dm, 'steelTonnes'))
                parts.push(de ? `Stahl: ${fmt(steel, lang)} Tonnen.` : `Steel: ${fmt(steel)} tonnes.`);
            if (has(dm, 'equipmentHours'))
                parts.push(de ? `Gerätebetrieb: ${fmt(equipment, lang)} Stunden.` : `Equipment operation: ${fmt(equipment)} hours.`);
            return parts.join(' ');
        },
    },
    // Raw materials
    {
        domains: ['materials'],
        topics: ['raw_materials'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const material = num(dm, 'materialInputTonnes');
            if (has(dm, 'materialInputTonnes')) {
                return de
                    ? `${name || 'Unsere Organisation'} verzeichnete für den Berichtszeitraum einen Materialeinsatz von ${fmt(material, lang)} Tonnen.`
                    : `${name || 'Our organization'} recorded material input of ${fmt(material)} tonnes for the reporting period.`;
            }
            return { answer: de
                    ? 'Für diese Frage haben wir weder den Rohstoffverbrauch nach Art noch den Anteil recycelter oder sekundärer Materialien hinterlegt.'
                    : 'We do not have raw-material consumption by type or the recycled or secondary-material share on record for this question.', drafted: true };
        },
    },
    // Supplier code of conduct
    {
        domains: ['buyer_requirements', 'materials'],
        topics: ['supplier_code', 'ethics'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            // supplierPoliciesApproved only contains an actual Supplier Code of Conduct
            // (narrowed in dataModel). State existence only — do not fabricate the code's
            // coverage or any monitoring controls the user did not provide.
            const hasSupplierCode = /supplier code/i.test(str(dm, 'supplierPoliciesApproved'));
            if (hasSupplierCode) {
                return de
                    ? `Ja, ${name || 'unsere Organisation'} unterhält einen Lieferanten-Verhaltenskodex.`
                    : `Yes, ${name || 'our organization'} maintains a Supplier Code of Conduct.`;
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keinen Lieferanten-Verhaltenskodex hinterlegt.'
                    : 'We do not have a Supplier Code of Conduct on record for this question.', drafted: true };
        },
    },
    // Supply chain ESG monitoring
    {
        domains: ['buyer_requirements'],
        topics: ['supply_chain_monitoring'],
        questionTypes: ['MEASURE'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            // State only the user-provided supplier-assessment figure, if any. Do not
            // fabricate monitoring measures (audits, visits, selection criteria).
            const assessed = str(dm, 'suppliersAssessedPercent');
            if (assessed) {
                return {
                    answer: de
                        ? `${assessed}% unserer Lieferanten wurden anhand von ESG-Kriterien bewertet. Für diese Frage haben wir die Überwachungsmethode nicht hinterlegt.`
                        : `${assessed}% of our suppliers have been assessed on ESG criteria. We do not have the monitoring method on record for this question.`,
                    drafted: true,
                };
            }
            return {
                answer: de
                    ? 'Für diese Frage haben wir kein Programm zur ESG-Überwachung oder -Bewertung von Lieferanten hinterlegt.'
                    : 'We do not have a supplier ESG monitoring or assessment programme on record for this question.',
                drafted: true,
            };
        },
    },
    // M13 — Supply-chain / human-rights due diligence (LkSG, CSDDD, EUDR). The extra
    // human_rights topic makes it beat the generic supply-chain-monitoring template for
    // due-diligence questions. Reads H3 humanRightsDueDiligenceStatus / supplierCodeStatus.
    {
        domains: ['buyer_requirements'],
        topics: ['supply_chain_monitoring', 'human_rights'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const hrdd = statusKind(str(dm, 'humanRightsDueDiligenceStatus'));
            const code = statusKind(str(dm, 'supplierCodeStatus'));
            const hasCode = code === 'available' || /supplier code/i.test(str(dm, 'supplierPoliciesApproved'));
            const assessed = str(dm, 'suppliersAssessedPercent');
            const parts = [];
            if (hrdd === 'available') {
                parts.push(de
                    ? 'Ja, ein Prozess zur menschenrechtlichen Sorgfaltspflicht in der Lieferkette ist als vorhanden hinterlegt. Angaben zur Ausrichtung am LkSG oder an der CSDDD sind für diese Frage nicht hinterlegt.'
                    : 'Yes, a supply-chain human-rights due-diligence process is recorded as being in place. Its alignment with the LkSG or CSDDD is not on record for this question.');
            }
            else if (hrdd === 'in_progress') {
                parts.push(de
                    ? 'Ein Prozess zur menschenrechtlichen Sorgfaltspflicht in der Lieferkette ist als im Aufbau befindlich hinterlegt. Angaben zur Ausrichtung am LkSG oder an der CSDDD sind für diese Frage nicht hinterlegt.'
                    : 'A supply-chain human-rights due-diligence process is recorded as being in progress. Its alignment with the LkSG or CSDDD is not on record for this question.');
            }
            else if (hrdd === 'na') {
                parts.push(de
                    ? `Eine menschenrechtliche Sorgfaltspflicht in der Lieferkette ist für ${name || 'unsere Organisation'} als nicht zutreffend gekennzeichnet.`
                    : `Supply-chain human-rights due diligence is marked as not applicable to ${name || 'our organization'}.`);
            }
            else {
                parts.push(de
                    ? 'Für diese Frage haben wir keinen formellen Prozess zur menschenrechtlichen Sorgfaltspflicht in der Lieferkette hinterlegt.'
                    : 'We do not have a formal supply-chain human-rights due-diligence process on record for this question.');
            }
            if (hasCode)
                parts.push(de
                    ? 'Ein Lieferanten-Verhaltenskodex ist als vorhanden hinterlegt.'
                    : 'A Supplier Code of Conduct is recorded as being in place.');
            if (assessed)
                parts.push(de
                    ? `${assessed}% unserer Lieferanten wurden anhand von ESG-Kriterien bewertet.`
                    : `${assessed}% of our suppliers have been assessed on ESG criteria.`);
            return { answer: parts.join(' '), drafted: hrdd !== 'available' };
        },
    },
    // Conflict minerals (3TG). State only the honest gap — do NOT assert materiality
    // ("not material / we don't source products containing them"), which is a heuristic
    // inference the user never provided.
    {
        domains: ['materials'],
        topics: ['conflict_minerals'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const dd = statusKind(str(dm, 'conflictMineralsStatus'));
            const cmrt = statusKind(str(dm, 'cmrtStatus'));
            const emrt = statusKind(str(dm, 'emrtStatus'));
            const decls = [];
            if (cmrt === 'available')
                decls.push('CMRT');
            if (emrt === 'available')
                decls.push('EMRT');
            if (dd === 'available') {
                const parts = [];
                parts.push(de
                    ? `Ja, ${name || 'unsere Organisation'} führt eine Sorgfaltspflicht zu Konfliktmineralien (3TG: Zinn, Tantal, Wolfram, Gold) durch.`
                    : `Yes, ${name || 'our organization'} conducts conflict-minerals (3TG: tin, tantalum, tungsten, gold) due diligence.`);
                if (decls.length > 0)
                    parts.push(de
                        ? `Vorliegende Erklärungen: ${decls.join(' und ')}.`
                        : `Declarations on file: ${decls.join(' and ')}.`);
                return { answer: parts.join(' ') };
            }
            if (dd === 'in_progress') {
                return { answer: de
                        ? `${name || 'Unsere Organisation'} befindet sich derzeit im Aufbau einer Sorgfaltspflicht zu Konfliktmineralien (3TG: Zinn, Tantal, Wolfram, Gold), einschließlich Identifizierung von Schmelzen/Raffinerien und CMRT/EMRT-Erklärungen.`
                        : `${name || 'Our organization'} is currently developing conflict-minerals (3TG: tin, tantalum, tungsten, gold) due diligence, including smelter/refiner identification and CMRT/EMRT declarations.`, drafted: true };
            }
            if (dd === 'na') {
                return { answer: de
                        ? `Die Sorgfaltspflicht zu Konfliktmineralien (3TG) ist für ${name || 'unsere Organisation'} als nicht zutreffend gekennzeichnet.`
                        : `Conflict-minerals (3TG) due diligence is marked as not applicable to ${name || 'our organization'}.` };
            }
            return {
                answer: de
                    ? 'Für diese Frage haben wir keine Angaben zu einem Sorgfaltsprozess für Konfliktmineralien hinterlegt.'
                    : 'We do not have details of a conflict-minerals due-diligence process on record for this question.',
                drafted: true,
            };
        },
    },
    // Forced & child labor (measure- or policy-phrased). Narrow topic from the high-weight
    // keyword rule. Surfaces the company's own labour/ethics policies if present, otherwise
    // an honest gap — never asserts a due-diligence programme the user did not provide.
    {
        domains: ['workforce'],
        topics: ['forced_child_labor'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const labourPolicies = str(dm, 'socialPoliciesApproved')
                .split(',')
                .map((p) => p.trim())
                .filter((p) => /human rights|modern slavery|forced lab|child lab|code of conduct|supplier code|sa8000|ethics/i.test(p));
            const country = str(dm, 'headquartersCountry');
            const fte = num(dm, 'totalFte');
            const parts = [];
            if (labourPolicies.length > 0) {
                parts.push(de
                    ? `Folgende möglicherweise einschlägige Richtlinie ist hinterlegt: ${labourPolicies.join(', ')}.`
                    : `The following potentially relevant policy is on record: ${labourPolicies.join(', ')}.`);
                parts.push(de
                    ? 'Für diese Frage haben wir ihre Regelungen zu Kinder- oder Zwangsarbeit nicht hinterlegt.'
                    : 'We do not have its provisions on child labour or forced labour on record for this question.');
            }
            else {
                parts.push(de
                    ? 'Für diese Frage haben wir weder eine eigenständige Richtlinie noch einen Sorgfaltspflichtprozess zu Kinder- und Zwangsarbeit hinterlegt.'
                    : 'We do not have a standalone policy or due-diligence process addressing child labour and forced labour on record for this question.');
            }
            if (country)
                parts.push(de
                    ? `Als Land des Hauptsitzes ist ${deCountry(country, lang)} hinterlegt.`
                    : `The headquarters country on record is ${deCountry(country, lang)}.`);
            if (fte)
                parts.push(de ? `Als Belegschaftsgröße sind ${fmt(fte, lang)} VZÄ hinterlegt.` : `The workforce count on record is ${fmt(fte)} FTE.`);
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // Chemical / restricted-substance management (ZDHC MRSL, REACH SVHC, PFAS, chemical inventory).
    // Honest gap only — no heuristic materiality claim about whether the user uses chemicals.
    {
        domains: ['regulatory', 'materials'],
        topics: ['chemical_management'],
        generate: (dm, fw, lang) => ({
            answer: lang === 'de'
                ? 'Für diese Frage haben wir weder Angaben zur Konformität mit Vorgaben für beschränkte Stoffe noch ein Chemikalieninventar hinterlegt.'
                : 'We do not have restricted-substance conformance details or a chemical inventory on record for this question.',
            drafted: true,
        }),
    },
    // Trade compliance: sanctions screening / export controls. Honest gap unless tracked.
    {
        domains: ['goals'],
        topics: ['trade_compliance'],
        generate: (dm, fw, lang) => ({
            answer: lang === 'de'
                ? 'Für diese Frage haben wir keine Angaben zu einem Programm für Sanktionslistenprüfungen oder Exportkontrollen hinterlegt.'
                : 'We do not have details of a sanctions-screening or export-control compliance programme on record for this question.',
            drafted: true,
        }),
    },
    // Sustainable fibres / materials sourcing & animal-derived materials. Honest gap only —
    // no heuristic materiality claim about whether the user makes/sells physical products.
    {
        domains: ['materials'],
        topics: ['sustainable_materials'],
        generate: (dm, fw, lang) => ({
            answer: lang === 'de'
                ? 'Für diese Frage haben wir weder Angaben zur Materialzusammensetzung der Produkte noch Zertifizierungen für nachhaltige Materialien hinterlegt.'
                : 'We do not have product material-composition data or sustainable-material certifications on record for this question.',
            drafted: true,
        }),
    },
    // Product eco-labels / Environmental Product Declarations. Relevance-aware honesty.
    {
        domains: ['regulatory'],
        topics: ['ecolabels'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const certs = str(dm, 'certificationsHeld');
            if (certs && /ecolabel|blue angel|nordic swan|epd|environmental product declaration/i.test(certs)) {
                return { answer: de
                        ? `Unsere Produkte tragen die folgenden anerkannten Umweltkennzeichen/-erklärungen: ${certs}.`
                        : `Our products carry the following recognised environmental labels/declarations: ${certs}.` };
            }
            return {
                answer: de
                    ? 'Für diese Frage haben wir keine Umweltzeichen oder Umweltproduktdeklarationen für unsere Produkte hinterlegt.'
                    : 'We do not have product eco-labels or Environmental Product Declarations on record for this question.',
                drafted: true,
            };
        },
    },
    // Packaging materials (Q20 — must address packaging types, recyclability, recycled content)
    {
        domains: ['packaging', 'waste'],
        topics: ['packaging'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const div = num(dm, 'diversionRate');
            const packagingWaste = num(dm, 'packagingWasteKg');
            const recycledContent = num(dm, 'packagingRecycledContentPercent');
            const hasRecycled = has(dm, 'packagingRecycledContentPercent');
            const parts = [];
            if (hasRecycled)
                parts.push(de
                    ? `Der Rezyklatanteil unserer Verpackungen beträgt ${fmt(recycledContent, lang)}%.`
                    : `The recycled content of our packaging is ${fmt(recycledContent)}%.`);
            if (has(dm, 'packagingWasteKg'))
                parts.push(de
                    ? `Der für den Berichtszeitraum erfasste Verpackungsabfall betrug ${fmt(packagingWaste, lang)} kg.`
                    : `Recorded packaging waste for the reporting period was ${fmt(packagingWaste)} kg.`);
            if (div > 0)
                parts.push(de
                    ? `Unsere Gesamtverwertungsquote für Abfälle beträgt ${fmt(div, lang)}%.`
                    : `Our overall waste diversion rate is ${fmt(div)}%.`);
            if (!hasRecycled)
                parts.push(de
                    ? 'Für diese Frage haben wir keine verpackungsspezifischen Angaben zu Materialien, Recyclingfähigkeit oder Rezyklatanteil hinterlegt.'
                    : 'We do not have packaging-specific materials, recyclability or recycled-content details on record for this question.');
            return { answer: parts.join(' '), drafted: !hasRecycled };
        },
    },
    // Supplier ESG assessment percentage (Q55)
    {
        domains: ['buyer_requirements', 'materials'],
        topics: ['supply_chain_monitoring', 'supplier_code'],
        questionTypes: ['KPI'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const pct = num(dm, 'suppliersAssessedPercent');
            // State only the provided figure; do not fabricate what assessments cover or
            // an in-progress programme the user never described.
            if (dm.has('suppliersAssessedPercent')) {
                return de
                    ? `${fmt(pct, lang)}% unserer Lieferanten wurden anhand von ESG-Kriterien bewertet.`
                    : `${fmt(pct)}% of our suppliers have been assessed on ESG criteria.`;
            }
            return {
                answer: de
                    ? 'Für diese Frage haben wir den Anteil der anhand von ESG-Kriterien bewerteten Lieferanten nicht hinterlegt.'
                    : 'We do not have the percentage of suppliers assessed against ESG criteria on record for this question.',
                drafted: true,
            };
        },
    },
    // Supplier non-compliance handling (Q58). Reads the H3 supplierCorrectiveActionProcess
    // where present; honest gap otherwise (never fabricates an escalation process).
    {
        domains: ['buyer_requirements'],
        topics: ['supply_chain_monitoring', 'supplier_code'],
        questionTypes: ['MEASURE', 'POLICY'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const cap = statusKind(str(dm, 'supplierCorrectiveActionProcess'));
            if (cap === 'available') {
                return { answer: de
                        ? 'Ja, ein Prozess für Korrekturmaßnahmen bei ESG-Verstößen von Lieferanten ist als vorhanden hinterlegt. Für diese Frage haben wir keine Angaben zu Eskalations- oder Beendigungsschritten hinterlegt.'
                        : 'Yes, a supplier corrective-action process for ESG non-compliance is recorded as being in place. We do not have its escalation or termination steps on record for this question.' };
            }
            if (cap === 'in_progress') {
                return { answer: de
                        ? 'Ein Prozess für Korrekturmaßnahmen bei ESG-Verstößen von Lieferanten ist als im Aufbau befindlich hinterlegt. Für diese Frage haben wir keine Angaben zu Eskalations- oder Beendigungsschritten hinterlegt.'
                        : 'A supplier corrective-action process for ESG non-compliance is recorded as being in progress. We do not have its escalation or termination steps on record for this question.', drafted: true };
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keinen Prozess für Korrekturmaßnahmen bei ESG-Verstößen von Lieferanten hinterlegt.'
                    : 'We do not have a supplier corrective-action process for ESG non-compliance on record for this question.',
                drafted: true };
        },
    },
    // External ESG rating / assessment schemes (E): DJSI, Sedex/SMETA, IntegrityNext, NQC,
    // Achilles, CDP, EcoVadis, supplier assurance. Reports the schemes the company actually
    // holds (from certifications / valid certificates), otherwise an honest "not completed".
    // EN and DE land here identically, so no divergence and no raw-status matrix leak.
    {
        domains: ['buyer_requirements'],
        topics: ['external_ratings'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const certs = `${str(dm, 'certificationsHeld')} ${str(dm, 'validCertificates')}`;
            const held = [];
            if (/ecovadis/i.test(certs))
                held.push('EcoVadis');
            if (/\bcdp\b/i.test(certs))
                held.push('CDP');
            if (/sedex|smeta/i.test(certs))
                held.push('Sedex/SMETA');
            if (held.length > 0) {
                return { answer: de
                        ? `Folgende externe ESG-Bewertung ist hinterlegt: ${held.join(', ')}. Für die übrigen genannten Systeme haben wir keine Ergebnisse hinterlegt.`
                        : `The following external ESG rating or assessment is on record: ${held.join(', ')}. We do not have results for the other named schemes on record for this question.` };
            }
            return { answer: de
                    ? 'Für diese Frage haben wir keine Ergebnisse zu den genannten externen ESG-Ratings oder -Bewertungen hinterlegt.'
                    : 'We do not have results for the named external ESG ratings or assessments on record for this question.',
                drafted: true };
        },
    },
    // ===================================================================
    // SUSTAINABILITY STRATEGY (fine-grained)
    // ===================================================================
    // EU Taxonomy alignment / assessment (D). Own topic so it beats the generic
    // transparency/compliance route (which wrongly returned the sustainability-report answer).
    {
        domains: ['regulatory'],
        topics: ['eu_taxonomy'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            return { answer: de
                    ? 'Für diese Frage haben wir keine EU-Taxonomie-Bewertung von Umsatz, CapEx oder OpEx hinterlegt.'
                    : 'We do not have an EU Taxonomy assessment of revenue, CapEx or OpEx on record for this question.',
                drafted: true };
        },
    },
    // Sustainability reporting (Q51)
    {
        domains: ['regulatory', 'goals'],
        topics: ['transparency'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const publishes = str(dm, 'publishesSustainabilityReport');
            const framework = str(dm, 'reportingFramework');
            const parts = [];
            if (publishes === 'Yes') {
                parts.push(de ? `Ja, ${name || 'unsere Organisation'} veröffentlicht einen Nachhaltigkeitsbericht.` : `Yes, ${name || 'our organization'} publishes a sustainability report.`);
                if (framework)
                    parts.push(de ? `Der Bericht folgt dem Rahmenwerk ${framework}.` : `The report follows the ${framework} framework.`);
            }
            else if (publishes === 'No') {
                return { answer: de
                        ? `Nein, ${name || 'unsere Organisation'} veröffentlicht derzeit keinen eigenständigen Nachhaltigkeits- oder ESG-Bericht.`
                        : `No, ${name || 'our organization'} does not currently publish a standalone sustainability or ESG report.`, drafted: true };
            }
            else {
                return { answer: de
                        ? 'Für diese Frage haben wir nicht hinterlegt, ob ein eigenständiger Nachhaltigkeitsbericht veröffentlicht wird.'
                        : 'We do not have the publication status of a standalone sustainability report on record for this question.', drafted: true };
            }
            return parts.join(' ');
        },
    },
    // ESG risk management — honest gap; do not fabricate a risk-management process.
    {
        domains: ['swot', 'goals'],
        topics: ['risk_management', 'strategy'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            return {
                answer: de
                    ? 'Für diese Frage haben wir keinen formellen ESG-Risikomanagementprozess hinterlegt.'
                    : 'We do not have a formal ESG risk-management process on record for this question.',
                drafted: true,
            };
        },
    },
    // ===================================================================
    // COVERAGE ADDITIONS (new ESG topic areas — honest drafted answers)
    // ===================================================================
    // M15 — Biodiversity / nature / deforestation / land-use change (ESRS E4 / CDP Forests / EUDR).
    {
        domains: ['goals'],
        topics: ['biodiversity', 'strategy'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            return {
                answer: de
                    ? 'Für diese Frage haben wir keine formelle Strategie zu Biodiversität, Naturschutz oder Entwaldung hinterlegt.'
                    : 'We do not have a formal biodiversity, nature or deforestation strategy on record for this question.',
                drafted: true,
            };
        },
    },
    // M16 — HR / social metrics (ESRS S1 / EcoVadis): gender pay gap, absenteeism, parental
    // leave, engagement. topics ['diversity','labor_practices'] so it wins the gender-pay-gap
    // question over the wage templates without stealing pure-wage or diversity-KPI questions.
    {
        domains: ['workforce'],
        topics: ['diversity', 'labor_practices'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const fem = num(dm, 'femalePercent');
            const leaderPct = num(dm, 'womenInLeadershipPercent');
            const parts = [];
            if (fem > 0) {
                parts.push(de
                    ? `Frauen machen ${fmt(fem, lang)}% unserer Belegschaft aus${leaderPct > 0 ? ` und ${fmt(leaderPct, lang)}% der Führungspositionen` : ''}.`
                    : `Women make up ${fmt(fem)}% of our workforce${leaderPct > 0 ? ` and ${fmt(leaderPct)}% of leadership positions` : ''}.`);
            }
            else if (leaderPct > 0) {
                parts.push(de
                    ? `Frauen besetzen ${fmt(leaderPct, lang)}% der Führungspositionen.`
                    : `Women hold ${fmt(leaderPct)}% of leadership positions.`);
            }
            parts.push(de
                ? 'Für diese Frage haben wir weder Kennzahlen zum geschlechtsspezifischen Lohngefälle noch zu Fehlzeiten, Elternzeit oder Mitarbeiterzufriedenheit hinterlegt.'
                : 'We do not have gender pay gap, absenteeism, parental leave or employee satisfaction metrics on record for this question.');
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // M19 — Cybersecurity / information security / data breach. Shares the data_protection
    // topic with the GDPR template; leverages dataProtectionPolicy / ISO 27001 where sensible.
    {
        domains: ['goals', 'regulatory'],
        topics: ['data_protection'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const hasPolicy = str(dm, 'dataProtectionPolicy');
            const certs = str(dm, 'certificationsHeld');
            const validCerts = str(dm, 'validCertificates');
            const has27001 = /27001/.test(`${certs} ${validCerts}`);
            const parts = [];
            if (has27001)
                parts.push(de
                    ? 'Unser Informationssicherheits-Managementsystem ist nach ISO/IEC 27001 zertifiziert.'
                    : 'Our information security management system is certified to ISO/IEC 27001.');
            if (hasPolicy === 'Yes')
                parts.push(de
                    ? 'Eine Datenschutzrichtlinie ist als vorhanden hinterlegt.'
                    : 'A data protection policy is recorded as being in place.');
            parts.push(de
                ? 'Für diese Frage haben wir kein gesondertes Programm zur Cyber- oder Informationssicherheit hinterlegt.'
                : 'We do not have a dedicated cybersecurity or information-security programme on record for this question.');
            return { answer: parts.join(' '), drafted: !has27001 };
        },
    },
    // M21 — Air / other pollution + environmental incidents (ESRS E2). Kept on the effluents
    // domain / pollution topic so NOx/SOx are not read as carbon (GHG) emissions.
    {
        domains: ['effluents'],
        topics: ['pollution'],
        generate: (dm, fw, lang) => ({
            answer: lang === 'de'
                ? 'Für diese Frage haben wir weder Daten zu Luftschadstoffen noch Angaben zu Umweltvorfällen hinterlegt.'
                : 'We do not have air pollutant data or environmental incident information on record for this question.',
            drafted: true,
        }),
    },
    // M22 — Community engagement / local community investment (GRI 413 / EcoVadis).
    {
        domains: ['goals'],
        topics: ['strategy', 'company_profile'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            return {
                answer: de
                    ? 'Für diese Frage haben wir kein Programm für gesellschaftliches Engagement, lokale Gemeinwesenarbeit oder soziale Investitionen hinterlegt.'
                    : 'We do not have a community-engagement or social-investment programme on record for this question.',
                drafted: true,
            };
        },
    },
    // Sustainability in procurement / responsible sourcing. Reads the H3
    // responsibleSourcingPolicyStatus where present; honest gap otherwise.
    {
        domains: ['goals', 'materials', 'buyer_requirements'],
        topics: ['strategy', 'supplier_management'],
        generate: (dm, fw, lang) => {
            const de = lang === 'de';
            const name = str(dm, 'legalEntityName');
            const rs = statusKind(str(dm, 'responsibleSourcingPolicyStatus'));
            if (rs === 'available') {
                return { answer: de
                        ? 'Ja, eine Richtlinie für verantwortungsvolle Beschaffung ist als vorhanden hinterlegt. Für diese Frage haben wir nicht hinterlegt, wie sie Nachhaltigkeitsaspekte in Beschaffungsentscheidungen behandelt.'
                        : 'Yes, a responsible-sourcing policy is recorded as being in place. Its treatment of sustainability in procurement decisions is not on record for this question.' };
            }
            if (rs === 'in_progress') {
                return { answer: de
                        ? 'Eine Richtlinie für verantwortungsvolle Beschaffung ist als im Aufbau befindlich hinterlegt. Für diese Frage haben wir nicht hinterlegt, wie sie Nachhaltigkeitsaspekte in Beschaffungsentscheidungen behandeln soll.'
                        : 'A responsible-sourcing policy is recorded as being in progress. Its intended treatment of sustainability in procurement decisions is not on record for this question.', drafted: true };
            }
            if (rs === 'na') {
                return { answer: de
                        ? `Eine Richtlinie für verantwortungsvolle Beschaffung ist für ${name || 'unsere Organisation'} als nicht zutreffend gekennzeichnet.`
                        : `A responsible-sourcing policy is marked as not applicable to ${name || 'our organization'}.` };
            }
            return {
                answer: de
                    ? 'Für diese Frage haben wir keine Angaben dazu hinterlegt, wie Nachhaltigkeitsaspekte in Beschaffungsentscheidungen einbezogen werden.'
                    : 'We do not have details of how sustainability considerations are integrated into procurement decisions on record for this question.',
                drafted: true,
            };
        },
    },
];
//# sourceMappingURL=answerTemplates.js.map
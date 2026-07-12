// ============================================
// ESG Domain Pack — Answer Templates
// ============================================
// 70 rich answer templates for ESG data domains.
import { has, num, str, fmt } from '../../src/engine/answerGenerator';
export const ESG_ANSWER_TEMPLATES = [
    // ===================================================================
    // ENERGY & ELECTRICITY
    // ===================================================================
    // KPI: Total electricity consumption
    {
        domains: ['energy_electricity'],
        topics: ['energy_consumption'],
        questionTypes: ['KPI'],
        generate: (dm, fw) => {
            if (!has(dm, 'totalElectricity'))
                return null;
            const kwh = num(dm, 'totalElectricity');
            const renPct = num(dm, 'renewablePercent');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            let answer = `Our total electricity consumption was ${fmt(kwh)} kWh${periodStr}.`;
            if (renPct > 0) {
                const renKwh = kwh * renPct / 100;
                answer += ` Of this, ${fmt(renPct)}% (approximately ${fmt(renKwh)} kWh) was sourced from renewable energy.`;
            }
            return answer;
        },
    },
    // KPI: Renewable energy percentage (distinct from total consumption)
    {
        domains: ['energy_electricity'],
        topics: ['renewable_share', 'renewable_energy'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            if (!has(dm, 'renewablePercent'))
                return null;
            const renPct = num(dm, 'renewablePercent');
            const kwh = num(dm, 'totalElectricity');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` for ${period}` : ' for the reporting period';
            let answer = `${fmt(renPct)}% of our electricity${periodStr} was sourced from renewable energy.`;
            if (kwh > 0)
                answer += ` Out of ${fmt(kwh)} kWh total consumption, approximately ${fmt(kwh * renPct / 100)} kWh was renewable.`;
            return answer;
        },
    },
    // MEASURE: Energy efficiency (not consumption KPI)
    {
        domains: ['energy_electricity'],
        topics: ['energy_efficiency'],
        questionTypes: ['MEASURE'],
        generate: (dm) => {
            const kwh = num(dm, 'totalElectricity');
            const renPct = num(dm, 'renewablePercent');
            const period = str(dm, 'reportingPeriod');
            const parts = [];
            if (kwh > 0) {
                parts.push(`Our electricity consumption is ${fmt(kwh)} kWh${period ? ` (${period})` : ''}${renPct > 0 ? `, with ${fmt(renPct)}% from renewable sources` : ''}.`);
                parts.push('We have not separately documented specific energy-efficiency measures for this question.');
                return { answer: parts.join(' '), drafted: true };
            }
            return { answer: 'We do not currently track energy consumption or documented energy-efficiency measures for this question.', drafted: true };
        },
    },
    // Fallback: energy consumption (any question type)
    {
        domains: ['energy_electricity'],
        topics: ['energy_consumption'],
        generate: (dm) => {
            if (!has(dm, 'totalElectricity'))
                return null;
            const kwh = num(dm, 'totalElectricity');
            const renPct = num(dm, 'renewablePercent');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            let answer = `Our total electricity consumption was ${fmt(kwh)} kWh${periodStr}.`;
            if (renPct > 0)
                answer += ` ${fmt(renPct)}% was sourced from renewable energy.`;
            return answer;
        },
    },
    // ===================================================================
    // GHG EMISSIONS
    // ===================================================================
    // Full GHG overview (Scope 1 + 2)
    {
        domains: ['emissions'],
        topics: ['ghg_emissions', 'scope_1'],
        generate: (dm) => {
            const s1 = num(dm, 'scope1Estimate');
            const s2 = num(dm, 'scope2Location');
            const s2m = num(dm, 'scope2Market');
            if (s1 === 0 && s2 === 0 && !dm.has('scope1Estimate') && !dm.has('scope2Location'))
                return null;
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` for ${period}` : ' for the reporting period';
            const parts = [];
            parts.push(`Our greenhouse gas (GHG) emissions${periodStr} are as follows:`);
            if (dm.has('scope1Estimate'))
                parts.push(`Scope 1 (direct) emissions: ${fmt(s1)} tCO2e, covering stationary combustion, mobile sources, and any fugitive emissions.`);
            if (s2) {
                parts.push(`Scope 2 (indirect, location-based) emissions: ${fmt(s2)} tCO2e from purchased electricity.`);
                if (s2m)
                    parts.push(`Scope 2 (market-based) emissions: ${fmt(s2m)} tCO2e, reflecting our renewable energy procurement.`);
            }
            const s1Point = dm.get('scope1Estimate');
            const s2Point = dm.get('scope2Location');
            const isEstimate = (s1Point?.confidence === 'medium') || (s2Point?.confidence === 'medium') ||
                (s1Point?.label?.toLowerCase().includes('auto-calculated')) || (s2Point?.label?.toLowerCase().includes('auto-calculated'));
            if (isEstimate) {
                parts.push('Note: Some figures are estimates derived from activity data (fuel consumption, electricity use) and standard emission factors.');
            }
            const total = s1 + s2;
            if (total > 0)
                parts.push(`Total Scope 1 + Scope 2 (location-based): ${fmt(total)} tCO2e.`);
            return parts.join(' ');
        },
    },
    // Scope 2 specific
    {
        domains: ['emissions'],
        topics: ['scope_2', 'ghg_emissions'],
        generate: (dm) => {
            const s2 = num(dm, 'scope2Location');
            const s2m = num(dm, 'scope2Market');
            if (!s2 && !s2m && !dm.has('scope2Location'))
                return null;
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` for ${period}` : ' for the reporting period';
            const kwh = num(dm, 'totalElectricity');
            const parts = [];
            parts.push(`Our Scope 2 (indirect) greenhouse gas emissions from purchased electricity${periodStr}:`);
            if (s2)
                parts.push(`Location-based: ${fmt(s2)} tCO2e.`);
            if (s2m)
                parts.push(`Market-based: ${fmt(s2m)} tCO2e.`);
            if (kwh)
                parts.push(`These emissions result from ${fmt(kwh)} kWh of purchased electricity.`);
            const isEstimate = dm.get('scope2Location')?.confidence === 'medium';
            if (isEstimate)
                parts.push('Note: Scope 2 figures are calculated using country-level grid emission factors applied to our electricity consumption data.');
            return parts.join(' ');
        },
    },
    // Scope 3 specific (Q11 — must answer "do you measure Scope 3" honestly)
    {
        domains: ['emissions', 'transport'],
        topics: ['scope_3', 'ghg_emissions'],
        generate: (dm) => {
            const s3 = num(dm, 'scope3Total');
            const cats = str(dm, 'scope3Categories');
            const travel = num(dm, 'businessTravel');
            const commute = num(dm, 'employeeCommute');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` for ${period}` : ' for the reporting period';
            const parts = [];
            if (s3) {
                parts.push(`Yes, we measure Scope 3 emissions. Our Scope 3 (value chain) emissions${periodStr} total ${fmt(s3)} tCO2e.`);
                if (cats)
                    parts.push(`Categories currently reported: ${cats}.`);
            }
            else {
                parts.push('Scope 3 emissions are not yet quantified, and we do not currently track Scope 3 categories for this question.');
            }
            if (travel)
                parts.push(`Business travel: ${fmt(travel)} km.`);
            if (commute)
                parts.push(`Employee commuting: ${fmt(commute)} km.`);
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
        generate: (dm) => {
            if (!has(dm, 'totalFte'))
                return null;
            const fte = num(dm, 'totalFte');
            const period = str(dm, 'reportingPeriod');
            const country = str(dm, 'headquartersCountry');
            const sites = num(dm, 'numberOfSites');
            let answer = `As of ${period || 'the end of the reporting period'}, our organization employs ${fmt(fte)} full-time equivalent (FTE) employees`;
            if (sites > 1)
                answer += ` across ${sites} operational sites`;
            if (country)
                answer += `, headquartered in ${country}`;
            answer += '.';
            return answer;
        },
    },
    // KPI: Gender diversity breakdown
    {
        domains: ['workforce'],
        topics: ['diversity'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            if (!has(dm, 'totalFte', 'femalePercent'))
                return null;
            const fte = num(dm, 'totalFte');
            const fem = num(dm, 'femalePercent');
            const male = 100 - fem;
            const answer = `Our workforce of ${fmt(fte)} FTE employees comprises ${fmt(fem)}% female and ${fmt(male)}% male employees.`;
            return answer;
        },
    },
    // POLICY: Human rights (Q38 — must cover forced labor, child labor, freedom of association, scope, communication)
    {
        domains: ['workforce'],
        topics: ['human_rights'],
        questionTypes: ['POLICY'],
        generate: (dm) => {
            const policies = str(dm, 'socialPoliciesApproved');
            const humanRightsPolicies = policies
                .split(',')
                .map((policy) => policy.trim())
                .filter((policy) => /human rights|modern slavery|forced labor|forced labour|child labor|child labour|sa8000/i.test(policy));
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (humanRightsPolicies.length > 0) {
                parts.push(`Yes, our human rights commitments are formalized in the following policies: ${humanRightsPolicies.join(', ')}.`);
                parts.push('We have not separately documented the scope, communication, or due-diligence process behind these policies for this question.');
            }
            else {
                parts.push('A formal, standalone Human Rights Policy has not yet been established.');
                parts.push('We do not currently have documented evidence of a human rights due-diligence process covering forced labor, child labor, modern slavery, freedom of association, and value-chain risk assessment.');
            }
            if (humanRightsPolicies.length > 0 && fte)
                parts.push(`These commitments apply to all ${fmt(fte)} employees${country ? ` across our operations in ${country}` : ''}.`);
            const answer = parts.join(' ');
            return policies ? answer : { answer, drafted: true };
        },
    },
    // POLICY: DEI policy (Q28 — must NOT route to H&S or certifications)
    {
        domains: ['workforce'],
        topics: ['dei_policy', 'diversity'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const fte = num(dm, 'totalFte');
            const fem = num(dm, 'femalePercent');
            const leaderPct = num(dm, 'womenInLeadershipPercent');
            const parts = [];
            const hasMetrics = fem > 0 || leaderPct > 0;
            if (hasMetrics) {
                parts.push('We track the following workforce diversity data:');
                if (fem > 0)
                    parts.push(`Women represent ${fmt(fem)}% of our total workforce${fte > 0 ? ` of ${fmt(fte)} employees` : ''}.`);
                if (leaderPct > 0)
                    parts.push(`${fmt(leaderPct)}% of management and leadership positions are held by women.`);
                parts.push('A standalone DEI policy with documented commitments and measurable targets has not yet been formalized.');
            }
            else {
                parts.push('We do not yet have a standalone DEI policy. Formalized commitments, measurable diversity targets, and reporting processes have not been established.');
            }
            return { answer: parts.join(' '), drafted: !hasMetrics };
        },
    },
    // MEASURE: Freedom of association (Q41 — must address union rights, not wages)
    {
        domains: ['workforce'],
        topics: ['freedom_of_association', 'collective_bargaining'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const cbaPct = num(dm, 'collectiveBargainingPercent');
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (cbaPct > 0) {
                parts.push(`${fmt(cbaPct)}% of our workforce is covered by collective bargaining agreements${fte > 0 ? `, representing approximately ${fmt(Math.round(fte * cbaPct / 100))} of our ${fmt(fte)} employees` : ''}.`);
                if (country)
                    parts.push(`Freedom of association and collective bargaining are exercised within the framework of applicable labour law in ${country}.`);
                return parts.join(' ');
            }
            parts.push('We have not separately documented our approach to freedom of association and collective bargaining for this question.');
            if (country)
                parts.push(`Our operations are subject to applicable labour law in ${country}.`);
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // MEASURE: Working conditions (Q42 — hours, overtime, rest, leave)
    {
        domains: ['workforce'],
        topics: ['working_conditions'],
        questionTypes: ['MEASURE', 'POLICY'],
        generate: (dm) => {
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const cbaPct = num(dm, 'collectiveBargainingPercent');
            const parts = [];
            parts.push(`Working conditions at our facilities${country ? ` in ${country}` : ''} are governed by employment contracts and applicable labour law.`);
            if (cbaPct > 0)
                parts.push(`${fmt(cbaPct)}% of our workforce is covered by collective bargaining agreements${fte > 0 ? ` (approximately ${fmt(Math.round(fte * cbaPct / 100))} of ${fmt(fte)} FTE employees)` : ''}.`);
            parts.push('Specific working-hour, overtime, rest-period, and leave practices have not been separately documented for this question.');
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // KPI: Hires and departures (Q29)
    {
        domains: ['workforce'],
        topics: ['hires_departures', 'employee_count'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            const fte = num(dm, 'totalFte');
            const turnover = num(dm, 'turnoverRate');
            const hires = num(dm, 'newHires');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            if (fte > 0 && (turnover > 0 || hires > 0)) {
                const departures = turnover > 0 ? Math.round(fte * turnover / 100) : 0;
                const parts = [];
                parts.push(`As of the end of ${period || 'the reporting period'}, our workforce comprises ${fmt(fte)} FTE employees.`);
                if (hires > 0 && departures > 0) {
                    parts.push(`${fmt(hires)} new employees joined and approximately ${departures} departed${periodStr} (turnover rate: ${fmt(turnover)}%).`);
                }
                else if (hires > 0) {
                    parts.push(`${fmt(hires)} new employees joined${periodStr}.`);
                }
                else if (departures > 0) {
                    parts.push(`Our employee turnover rate${periodStr} was ${fmt(turnover)}%, corresponding to approximately ${departures} departures. New hire figures are being consolidated for future reporting.`);
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
        generate: (dm) => {
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const lwCompliant = str(dm, 'livingWageCompliant');
            const parts = [];
            if (lwCompliant === 'Yes') {
                parts.push(`Yes, all employees${country ? ` in ${country}` : ''} are compensated at or above the applicable living wage — not merely the legal minimum wage.`);
            }
            else {
                parts.push('We have not formally verified compensation against applicable minimum-wage or living-wage benchmarks for this question.');
            }
            if (fte > 0)
                parts.push(`This applies to all ${fmt(fte)} FTE employees.`);
            return { answer: parts.join(' '), drafted: lwCompliant !== 'Yes' };
        },
    },
    // KPI: Employee turnover rate
    {
        domains: ['workforce'],
        topics: ['turnover', 'labor_practices'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            if (!has(dm, 'turnoverRate'))
                return null;
            const rate = num(dm, 'turnoverRate');
            const fte = num(dm, 'totalFte');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            let answer = `Our employee turnover rate${periodStr} was ${fmt(rate)}%.`;
            if (fte > 0)
                answer += ` This is based on our workforce of ${fmt(fte)} FTE employees.`;
            return answer;
        },
    },
    // KPI: Collective bargaining coverage
    {
        domains: ['workforce'],
        topics: ['collective_bargaining', 'labor_practices'],
        questionTypes: ['KPI', 'POLICY'],
        generate: (dm) => {
            if (!has(dm, 'collectiveBargainingPercent'))
                return null;
            const pct = num(dm, 'collectiveBargainingPercent');
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (pct > 0) {
                parts.push(`${fmt(pct)}% of our workforce is covered by collective bargaining agreements.`);
                if (fte > 0)
                    parts.push(`This covers approximately ${fmt(Math.round(fte * pct / 100))} of our ${fmt(fte)} employees.`);
                return parts.join(' ');
            }
            parts.push('Our workforce is not currently covered by collective bargaining agreements.');
            if (country)
                parts.push(`Working conditions in ${country} are governed by employment contracts and applicable labour law.`);
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // KPI: Women in leadership / leadership diversity
    {
        domains: ['workforce'],
        topics: ['diversity', 'leadership_diversity'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            if (!has(dm, 'womenInLeadershipPercent'))
                return null;
            const leaderPct = num(dm, 'womenInLeadershipPercent');
            const femPct = num(dm, 'femalePercent');
            const fte = num(dm, 'totalFte');
            const parts = [];
            parts.push(`Women represent ${fmt(leaderPct)}% of our leadership and management positions.`);
            if (femPct > 0)
                parts.push(`This compares to ${fmt(femPct)}% female representation across our total workforce of ${fte > 0 ? fmt(fte) + ' employees' : 'all employees'}.`);
            return parts.join(' ');
        },
    },
    // MEASURE: Living wage compliance
    {
        domains: ['workforce'],
        topics: ['labor_practices'],
        questionTypes: ['MEASURE', 'KPI'],
        generate: (dm) => {
            if (!has(dm, 'livingWageCompliant'))
                return null;
            const compliant = str(dm, 'livingWageCompliant');
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (compliant === 'Yes') {
                parts.push(`Yes, all employees${country ? ` in ${country}` : ''} are compensated at or above the applicable living wage.`);
            }
            else {
                parts.push('We have not formally verified compensation against applicable minimum-wage or living-wage benchmarks for this question.');
            }
            if (fte > 0)
                parts.push(`This applies to all ${fmt(fte)} FTE employees.`);
            return { answer: parts.join(' '), drafted: compliant !== 'Yes' };
        },
    },
    // Grievance mechanism (Q40 — multi-part: mechanism existence + count)
    {
        domains: ['workforce'],
        topics: ['grievance', 'ethics'],
        generate: (dm) => {
            if (!has(dm, 'grievanceMechanismExists'))
                return null;
            const exists = str(dm, 'grievanceMechanismExists');
            const count = num(dm, 'grievancesReported');
            const period = str(dm, 'reportingPeriod');
            const parts = [];
            if (exists === 'Yes') {
                parts.push('Yes, we maintain a formal grievance mechanism available to all employees and external stakeholders.');
                if (has(dm, 'grievancesReported')) {
                    parts.push(`${period ? `During ${period}, ` : ''}${count} grievance${count !== 1 ? 's were' : ' was'} reported through this mechanism.`);
                }
                return parts.join(' ');
            }
            return { answer: 'A formal grievance mechanism has not yet been established, and we do not separately track this for this question.', drafted: true };
        },
    },
    // ===================================================================
    // HEALTH & SAFETY
    // ===================================================================
    // Fatalities (Q32 — only fires when 'fatalities' is a primary topic)
    {
        domains: ['health_safety'],
        topics: ['fatalities'],
        generate: (dm) => {
            const fat = num(dm, 'fatalities');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            if (has(dm, 'fatalities')) {
                if (fat === 0) {
                    return `Zero work-related fatalities were recorded${periodStr}.`;
                }
                return `${fat} work-related fatalit${fat === 1 ? 'y' : 'ies'} occurred${periodStr}.`;
            }
            return null;
        },
    },
    // KPI: H&S incident rates
    {
        domains: ['health_safety'],
        topics: ['health_safety_kpi', 'health_safety'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            const trir = num(dm, 'trir');
            const lti = num(dm, 'lostTimeIncidents');
            const fat = num(dm, 'fatalities');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            const hasAnyData = has(dm, 'trir') || has(dm, 'lostTimeIncidents') || has(dm, 'fatalities');
            if (hasAnyData) {
                const parts = [];
                parts.push(`Our occupational health and safety performance${periodStr}:`);
                if (has(dm, 'trir'))
                    parts.push(`Total Recordable Incident Rate (TRIR): ${trir}.`);
                if (has(dm, 'lostTimeIncidents')) {
                    parts.push(`Lost time incidents: ${lti}.`);
                    // Calculate LTIR if we have hours worked
                    const hoursWorked = num(dm, 'totalHoursWorked');
                    if (hoursWorked > 0) {
                        const ltir = Math.round((lti / hoursWorked) * 200000 * 100) / 100;
                        parts.push(`Lost Time Injury Rate (LTIR): ${ltir}.`);
                    }
                }
                if (has(dm, 'fatalities'))
                    parts.push(`Fatalities: ${fat}.`);
                // Show underlying data when available
                const hoursWorked = num(dm, 'totalHoursWorked');
                if (hoursWorked > 0)
                    parts.push(`Total hours worked: ${fmt(hoursWorked)}.`);
                if (fat === 0 && lti === 0) {
                    parts.push('We recorded zero lost time incidents and zero fatalities.');
                }
                return parts.join(' ');
            }
            // No H&S metrics entered — honest gap, no fabricated safety process or "no incidents" claim.
            return {
                answer: 'We do not currently track standardized occupational health and safety incident-rate metrics (TRIR, LTIR) or the underlying hours-worked data for this question.',
                drafted: true,
            };
        },
    },
    // MEASURE/POLICY: H&S management system (describe your OHS system)
    {
        domains: ['health_safety'],
        topics: ['health_safety_management', 'health_safety'],
        questionTypes: ['MEASURE', 'POLICY'],
        generate: (dm) => {
            const trir = num(dm, 'trir');
            const lti = num(dm, 'lostTimeIncidents');
            const certs = str(dm, 'certificationsHeld');
            const has45001 = !!certs && certs.toLowerCase().includes('45001');
            const hasData = has(dm, 'trir') || has(dm, 'lostTimeIncidents');
            const parts = [];
            if (has45001)
                parts.push('Our occupational health and safety management system is certified to ISO 45001.');
            if (hasData)
                parts.push(`Recorded H&S performance: TRIR ${trir}, lost time incidents ${lti}.`);
            if (!has45001 && !hasData) {
                return { answer: 'We have not separately documented our occupational health and safety management approach for this question.', drafted: true };
            }
            if (!has45001)
                parts.push('We have not separately documented the structure of our health and safety management system beyond the data above.');
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
        generate: (dm) => {
            const medical = num(dm, 'medicalWasteKg');
            const pharma = num(dm, 'pharmaceuticalWasteKg');
            if (!has(dm, 'medicalWasteKg') && !has(dm, 'pharmaceuticalWasteKg'))
                return null;
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            const parts = [];
            parts.push(`Healthcare waste streams recorded${periodStr}:`);
            if (has(dm, 'medicalWasteKg'))
                parts.push(`Medical waste: ${fmt(medical)} kg.`);
            if (has(dm, 'pharmaceuticalWasteKg'))
                parts.push(`Pharmaceutical waste: ${fmt(pharma)} kg.`);
            return parts.join(' ');
        },
    },
    // KPI: Mining waste and tailings
    {
        domains: ['waste'],
        topics: ['mining_metrics', 'waste_management'],
        generate: (dm) => {
            const tailings = num(dm, 'tailingsGeneratedTonnes');
            if (!has(dm, 'tailingsGeneratedTonnes'))
                return null;
            const ore = num(dm, 'oreProcessedTonnes');
            const waterReused = num(dm, 'waterReusedPercent');
            const rehab = num(dm, 'rehabilitatedLandHectares');
            const parts = [];
            parts.push(`Tailings generated during the reporting period were ${fmt(tailings)} tonnes.`);
            if (ore > 0)
                parts.push(`This relates to ${fmt(ore)} tonnes of ore/material processed.`);
            if (waterReused > 0)
                parts.push(`${fmt(waterReused)}% of process water was reused.`);
            if (rehab > 0)
                parts.push(`${fmt(rehab)} hectares of land were rehabilitated.`);
            return parts.join(' ');
        },
    },
    // KPI: Total waste
    {
        domains: ['waste'],
        topics: ['waste_total', 'waste_management'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            if (!has(dm, 'totalWaste'))
                return null;
            const waste = num(dm, 'totalWaste');
            const div = num(dm, 'diversionRate');
            const haz = num(dm, 'hazardousWaste');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            let answer = `Our total waste generated${periodStr} was ${fmt(waste)} kg (${fmt(waste / 1000)} tonnes).`;
            if (div > 0)
                answer += ` We achieved a waste diversion rate of ${fmt(div)}%.`;
            if (haz > 0)
                answer += ` Of this, ${fmt(haz)} kg was classified as hazardous waste.`;
            return answer;
        },
    },
    // KPI: Recycling / diversion rate
    {
        domains: ['waste'],
        topics: ['recycling'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            if (!has(dm, 'diversionRate'))
                return null;
            const waste = num(dm, 'totalWaste');
            const div = num(dm, 'diversionRate');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            let answer = `Our waste diversion (recycling) rate${periodStr} was ${fmt(div)}%.`;
            if (waste > 0)
                answer += ` Of ${fmt(waste)} kg total waste, ${fmt(waste * div / 100)} kg was recycled or recovered rather than sent to landfill.`;
            return answer;
        },
    },
    // KPI: Hazardous waste
    {
        domains: ['waste'],
        topics: ['hazardous_waste'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            const haz = num(dm, 'hazardousWaste');
            const waste = num(dm, 'totalWaste');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            if (haz > 0) {
                let answer = `We generated ${fmt(haz)} kg of hazardous waste${periodStr}.`;
                if (waste > 0)
                    answer += ` This represents ${fmt(haz / waste * 100)}% of our total waste of ${fmt(waste)} kg.`;
                return answer;
            }
            if (has(dm, 'totalWaste')) {
                return `We did not generate any hazardous waste${periodStr}. Our total waste of ${fmt(waste)} kg consists entirely of non-hazardous materials.`;
            }
            return null;
        },
    },
    // MEASURE: Circular economy initiatives
    {
        domains: ['waste'],
        topics: ['circular_economy'],
        questionTypes: ['MEASURE'],
        generate: (dm) => {
            const waste = num(dm, 'totalWaste');
            const div = num(dm, 'diversionRate');
            if (waste > 0 && div > 0) {
                return {
                    answer: `We achieve a ${fmt(div)}% waste diversion rate from ${fmt(waste)} kg total waste. Specific circular-economy initiatives have not been separately documented for this question.`,
                    drafted: true,
                };
            }
            return { answer: 'We have not documented circular-economy initiatives, and do not track this for this question.', drafted: true };
        },
    },
    // Fallback: general waste (any type not matched above)
    {
        domains: ['waste'],
        topics: ['waste_management'],
        generate: (dm) => {
            if (!has(dm, 'totalWaste'))
                return null;
            const waste = num(dm, 'totalWaste');
            const div = num(dm, 'diversionRate');
            const haz = num(dm, 'hazardousWaste');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            let answer = `Our total waste generated${periodStr} was ${fmt(waste)} kg (${fmt(waste / 1000)} tonnes).`;
            if (div > 0)
                answer += ` We achieved a waste diversion rate of ${fmt(div)}%, meaning ${fmt(waste * div / 100)} kg was recycled or recovered rather than sent to landfill.`;
            if (haz > 0)
                answer += ` Of this total, ${fmt(haz)} kg was classified as hazardous waste.`;
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
        generate: (dm) => {
            const irrigation = num(dm, 'irrigationWaterM3');
            const discharge = num(dm, 'waterDischargeM3');
            const reused = num(dm, 'waterReusedPercent');
            if (!has(dm, 'irrigationWaterM3') && !has(dm, 'waterDischargeM3') && !has(dm, 'waterReusedPercent'))
                return null;
            const parts = [];
            if (has(dm, 'irrigationWaterM3'))
                parts.push(`Irrigation water use was ${fmt(irrigation)} m3 during the reporting period.`);
            if (has(dm, 'waterDischargeM3'))
                parts.push(`Recorded water discharge was ${fmt(discharge)} m3.`);
            if (has(dm, 'waterReusedPercent'))
                parts.push(`${fmt(reused)}% of water was reused in the relevant process.`);
            return parts.join(' ');
        },
    },
    // KPI: Water withdrawal
    {
        domains: ['energy_water'],
        topics: ['water_usage'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            if (!has(dm, 'waterWithdrawal'))
                return null;
            const water = num(dm, 'waterWithdrawal');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            const fte = num(dm, 'totalFte');
            const munPct = num(dm, 'waterSourceMunicipalPercent');
            let answer = `Our total water withdrawal${periodStr} was ${fmt(water)} m\u00B3.`;
            if (munPct > 0) {
                answer += ` ${fmt(munPct)}% was sourced from municipal/public supply${munPct >= 90 ? '. We do not currently withdraw water directly from groundwater or surface water sources.' : ', with the remainder from other sources.'}`;
            }
            if (fte > 0)
                answer += ` This equates to approximately ${fmt(water / fte)} m\u00B3 per employee.`;
            return answer;
        },
    },
    // POLICY/MEASURE: Wastewater / discharge
    {
        domains: ['effluents', 'energy_water'],
        topics: ['wastewater'],
        generate: (dm) => {
            const water = num(dm, 'waterWithdrawal');
            const parts = [];
            parts.push('We have not separately documented our wastewater discharge volumes, treatment, or monitoring practices for this question.');
            if (water)
                parts.push(`Our total water withdrawal is ${fmt(water)} m\u00B3 per year.`);
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // POLICY/MEASURE: Water stress
    {
        domains: ['energy_water'],
        topics: ['water_stress'],
        generate: (dm) => {
            const water = num(dm, 'waterWithdrawal');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (country)
                parts.push(`Our operations are based in ${country}.`);
            parts.push('We have not assessed or documented our exposure to water-stressed regions (e.g. via the WRI Aqueduct tool) for this question.');
            if (water)
                parts.push(`Our total water withdrawal is ${fmt(water)} m\u00B3 per year.`);
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // ===================================================================
    // COMPANY PROFILE
    // ===================================================================
    {
        domains: ['company'],
        topics: ['company_profile'],
        generate: (dm) => {
            if (!has(dm, 'legalEntityName'))
                return null;
            const name = str(dm, 'legalEntityName');
            const ind = str(dm, 'industryDescription');
            const country = str(dm, 'headquartersCountry');
            const period = str(dm, 'reportingPeriod');
            const ownership = str(dm, 'ownershipStructure');
            const rev = str(dm, 'revenueBand');
            const fte = num(dm, 'totalFte');
            let answer = `The legal name of our organization is ${name}.`;
            const addr = str(dm, 'registeredAddress');
            if (country && addr)
                answer += ` The company is incorporated in ${country}. Registered address: ${addr}.`;
            else if (country)
                answer += ` The company is incorporated in ${country}.`;
            if (ind && ind.toLowerCase() !== 'other')
                answer += ` We operate in the ${ind} sector.`;
            if (fte > 0)
                answer += ` We employ ${fmt(fte)} people.`;
            if (ownership)
                answer += ` Ownership structure: ${ownership}.`;
            if (rev)
                answer += ` Revenue band: ${rev}.`;
            if (period)
                answer += ` This data covers the reporting period ${period}.`;
            return answer;
        },
    },
    // KPI: Sites / facilities
    {
        domains: ['site', 'company'],
        topics: ['facilities', 'company_profile'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const sites = num(dm, 'numberOfSites');
            const country = str(dm, 'headquartersCountry');
            const operatingCountries = str(dm, 'operatingCountries');
            const fte = num(dm, 'totalFte');
            if (!sites && !name)
                return null;
            const parts = [];
            if (sites > 1) {
                parts.push(`${name || 'Our organization'} operates ${sites} facilities${operatingCountries ? ` across ${operatingCountries}` : ''}${country ? `, with headquarters in ${country}` : ''}.`);
            }
            else if (sites === 1) {
                parts.push(`${name || 'Our organization'} operates from a single site${country ? ` in ${country}` : ''}.`);
            }
            else {
                parts.push(`${name || 'Our organization'} is headquartered${country ? ` in ${country}` : ''}.`);
            }
            if (fte > 0)
                parts.push(`The total workforce across all sites is ${fmt(fte)} FTE employees.`);
            return parts.join(' ');
        },
    },
    // Group structure / subsidiary (Q5)
    {
        domains: ['company'],
        topics: ['group_structure', 'company_profile'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const parent = str(dm, 'parentCompany');
            const subs = str(dm, 'subsidiaries');
            const ownership = str(dm, 'ownershipStructure');
            const parts = [];
            if (parent) {
                parts.push(`Yes, ${name || 'our organization'} is a subsidiary of ${parent}.`);
            }
            else {
                parts.push(`No, ${name || 'our organization'} is not a subsidiary of a larger group.`);
                if (ownership)
                    parts.push(`The company operates as an independent ${ownership.toLowerCase()} business.`);
            }
            if (subs)
                parts.push(`We have the following subsidiary operations: ${subs}.`);
            return parts.join(' ');
        },
    },
    // Products and services
    {
        domains: ['products'],
        topics: ['production_metrics', 'facility_metrics'],
        generate: (dm) => {
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
            parts.push('Operational activity metrics for the reporting period are as follows:');
            if (has(dm, 'unitsProduced'))
                parts.push(`Units produced: ${fmt(units)}.`);
            if (has(dm, 'productionHours'))
                parts.push(`Production hours: ${fmt(hours)} hours.`);
            if (has(dm, 'materialInputTonnes'))
                parts.push(`Material input: ${fmt(material)} tonnes.`);
            if (has(dm, 'oreProcessedTonnes'))
                parts.push(`Ore/material processed: ${fmt(ore)} tonnes.`);
            if (has(dm, 'storeCount'))
                parts.push(`Stores: ${fmt(stores)}.`);
            if (has(dm, 'storeAreaM2'))
                parts.push(`Store area: ${fmt(storeArea)} m2.`);
            if (has(dm, 'warehouseSpaceM2'))
                parts.push(`Warehouse space: ${fmt(warehouse)} m2.`);
            if (has(dm, 'deliveriesCount'))
                parts.push(`Deliveries made: ${fmt(deliveries)}.`);
            if (has(dm, 'officeSpaceM2'))
                parts.push(`Office space: ${fmt(office)} m2.`);
            return parts.join(' ');
        },
    },
    // Products and services
    {
        domains: ['products', 'company'],
        topics: ['products_services', 'company_profile'],
        generate: (dm) => {
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
                parts.push(`${name} is ${ind && ind.toLowerCase() !== 'other' ? `a ${ind} company` : 'an organization'}${country ? ` based in ${country}` : ''}.`);
            }
            if (products) {
                parts.push(`Our main products and services: ${products}`);
            }
            if (markets) {
                parts.push(`We primarily serve ${markets}.`);
            }
            else if (operatingCountries) {
                parts.push(`We operate in ${operatingCountries}.`);
            }
            if (customers) {
                parts.push(`Our customer base is ${customers}.`);
            }
            if (fte)
                parts.push(`We employ ${fmt(fte)} people.`);
            if (rev)
                parts.push(`Revenue band: ${rev}.`);
            if (!products && !markets) {
                parts.push('A description of our products, services, and served markets has not been provided for this question.');
            }
            return parts.join(' ');
        },
    },
    // Revenue band
    {
        domains: ['financial_context', 'company'],
        topics: ['revenue'],
        generate: (dm) => {
            const rev = str(dm, 'revenueBand');
            if (!rev)
                return null;
            const name = str(dm, 'legalEntityName');
            const period = str(dm, 'reportingPeriod');
            return `${name ? name + "'s" : 'Our'} annual revenue band is ${rev}${period ? ` (${period})` : ''}.`;
        },
    },
    // ===================================================================
    // CERTIFICATIONS & COMPLIANCE
    // ===================================================================
    // External assurance (Q52 — MUST come before general certs to win on array order)
    {
        domains: ['regulatory'],
        topics: ['external_assurance'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const assured = str(dm, 'externalAssurance');
            const standard = str(dm, 'assuranceStandard');
            const certs = str(dm, 'certificationsHeld');
            const validCerts = str(dm, 'validCertificates');
            const parts = [];
            if (assured === 'Yes') {
                parts.push(`Yes, ${name || 'our organization'}'s ESG data has been externally assured.`);
                if (standard)
                    parts.push(`Assurance was conducted to ${standard}.`);
            }
            else if (assured === 'No') {
                parts.push(`${name || 'Our organization'}'s ESG data has not yet been externally assured under standards such as ISAE 3000 or AA1000.`);
                if (certs || validCerts) {
                    parts.push(`Our management systems are externally audited for certification purposes (${[certs, validCerts].filter(Boolean).join(', ')}), but these certification audits are distinct from ESG data assurance.`);
                }
            }
            else {
                return { answer: `External assurance status for ESG data has not been recorded. Management system certifications may be audited separately.`, drafted: true };
            }
            return parts.join(' ');
        },
    },
    // General certifications (Q50 — must list ALL certs, ideally with validity dates)
    {
        domains: ['regulatory'],
        topics: ['certifications'],
        generate: (dm) => {
            const certs = str(dm, 'certificationsHeld');
            const validCerts = str(dm, 'validCertificates');
            if (certs || validCerts) {
                const allCerts = [certs, validCerts].filter(Boolean);
                const uniqueCerts = [...new Set(allCerts.join(', ').split(', ').map(c => c.trim()).filter(Boolean))];
                const parts = [];
                parts.push(`Our organization holds the following certifications: ${uniqueCerts.join('; ')}.`);
                parts.push('Certificate numbers and validity dates are available on request.');
                return parts.join(' ');
            }
            return { answer: 'Our organization does not currently hold third-party environmental or quality management certifications.', drafted: true };
        },
    },
    // ISO 45001 specific (H&S certification)
    {
        domains: ['regulatory'],
        topics: ['health_safety_management'],
        generate: (dm) => {
            const certs = str(dm, 'certificationsHeld');
            const validCerts = str(dm, 'validCertificates');
            const allCerts = [certs, validCerts].filter(Boolean).join(', ').toLowerCase();
            if (allCerts.includes('45001')) {
                return 'Yes, our organization holds ISO 45001 certification for our occupational health and safety management system.';
            }
            return { answer: 'Our organization does not currently hold ISO 45001 or equivalent health and safety certification.', drafted: true };
        },
    },
    // ===================================================================
    // TRAINING
    // ===================================================================
    {
        domains: ['training', 'workforce'],
        topics: ['training'],
        generate: (dm) => {
            if (!has(dm, 'trainingHoursPerEmployee'))
                return null;
            const perEmp = num(dm, 'trainingHoursPerEmployee');
            const total = num(dm, 'totalTrainingHours');
            const fte = num(dm, 'totalFte');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            let answer = `${periodStr.charAt(0).toUpperCase() + periodStr.slice(1)}, we delivered an average of ${fmt(perEmp)} training hours per employee.`;
            if (total > 0 && fte > 0)
                answer += ` This represents a total of ${fmt(total)} hours of training across our ${fmt(fte)} employees.`;
            return answer;
        },
    },
    // ===================================================================
    // SUSTAINABILITY GOALS / TARGETS
    // ===================================================================
    {
        domains: ['goals'],
        topics: ['targets', 'strategy', 'climate_targets'],
        generate: (dm) => {
            const goal = str(dm, 'primaryGoal');
            if (goal) {
                return `Our stated sustainability goal is: ${goal}.`;
            }
            return { answer: 'We have not formalized documented sustainability goals or targets for this question.', drafted: true };
        },
    },
    // POLICY: Climate targets / SBTi / net-zero
    {
        domains: ['goals', 'emissions'],
        topics: ['climate_targets', 'ghg_emissions'],
        questionTypes: ['POLICY'],
        generate: (dm) => {
            const goal = str(dm, 'primaryGoal');
            const s1 = num(dm, 'scope1Estimate');
            const s2 = num(dm, 'scope2Location');
            const total = s1 + s2;
            const parts = [];
            if (goal && (goal.toLowerCase().includes('net zero') || goal.toLowerCase().includes('sbti') || goal.toLowerCase().includes('carbon'))) {
                parts.push(`Yes, our organization has set the following climate target: ${goal}.`);
                if (total > 0)
                    parts.push(`Our current Scope 1 + Scope 2 emissions total ${fmt(total)} tCO2e.`);
                return parts.join(' ');
            }
            parts.push('We have not set a formal science-based target (SBTi) or net-zero commitment, and do not track a documented decarbonization roadmap for this question.');
            if (total > 0)
                parts.push(`Our current Scope 1 + Scope 2 emissions total ${fmt(total)} tCO2e.`);
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // Ethics / code of conduct
    {
        domains: ['goals'],
        topics: ['ethics'],
        questionTypes: ['POLICY'],
        generate: (dm) => {
            const policies = str(dm, 'governancePoliciesApproved');
            const parts = [];
            if (policies) {
                parts.push(`Our ethical standards are formalized in the following policies: ${policies}.`);
                return parts.join(' ');
            }
            parts.push('A formal Code of Ethics and Anti-Corruption Policy has not yet been established.');
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // POLICY: Corporate governance / board oversight of ESG
    {
        domains: ['goals', 'regulatory'],
        topics: ['governance', 'strategy'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const policies = str(dm, 'governancePoliciesApproved');
            const certs = str(dm, 'certificationsHeld');
            const parts = [];
            if (policies)
                parts.push(`Our governance framework is supported by the following policies: ${policies}.`);
            if (certs)
                parts.push(`We hold the following management-system certifications: ${certs}.`);
            parts.push('A formalized ESG governance structure with explicit accountability and reporting lines, and the supporting oversight process, has not been separately documented for this question.');
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // POLICY: Fines, sanctions, legal proceedings (Q45)
    {
        domains: ['goals', 'regulatory'],
        topics: ['fines_sanctions'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const status = str(dm, 'noSignificantFines');
            if (status === 'none') {
                return `To the best of our knowledge, ${name || 'our organization'} has not been subject to any significant environmental, social, or governance-related fines, sanctions, or legal proceedings in the past three years.`;
            }
            if (status === 'yes') {
                return `${name || 'Our organization'} has disclosed relevant fines, sanctions, or legal proceedings. Details are available in our compliance records and can be provided upon request.`;
            }
            return { answer: `${name || 'Our organization'} has not recorded its fines, sanctions, or legal-proceedings status for this question.`, drafted: true };
        },
    },
    // POLICY: Data protection / GDPR (Q46)
    {
        domains: ['goals', 'regulatory'],
        topics: ['data_protection'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const country = str(dm, 'headquartersCountry');
            const hasPolicy = str(dm, 'dataProtectionPolicy');
            const isEU = country && ['Germany', 'France', 'Poland', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Sweden', 'Czech Republic', 'Denmark', 'Finland', 'Portugal', 'Ireland', 'Greece', 'Romania', 'Hungary', 'Croatia', 'Slovakia', 'Slovenia', 'Bulgaria', 'Lithuania', 'Latvia', 'Estonia', 'Luxembourg', 'EU Average'].includes(country);
            const parts = [];
            if (hasPolicy === 'Yes') {
                parts.push(`Yes, ${name || 'our organization'} has a data protection and privacy policy${isEU ? ' aligned with the EU General Data Protection Regulation (GDPR)' : ' in accordance with applicable data protection legislation'}.`);
                parts.push('We have not separately documented the specific safeguards behind this policy for this question.');
                return parts.join(' ');
            }
            if (hasPolicy === 'No') {
                return { answer: `${name || 'Our organization'} does not currently have a formal data protection and privacy policy${isEU ? ' aligned with GDPR' : ''}, and does not track this for this question.`, drafted: true };
            }
            return { answer: `${name || 'Our organization'} has not recorded whether a data protection and privacy policy is in place for this question.`, drafted: true };
        },
    },
    // POLICY: ESG-linked executive compensation (Q48)
    {
        domains: ['goals'],
        topics: ['esg_compensation'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            return {
                answer: `${name || 'Our organization'} does not currently operate formal ESG-linked executive compensation or incentive structures, and does not track this for this question.`,
                drafted: true,
            };
        },
    },
    // POLICY: CSRD applicability and timeline (Q53)
    {
        domains: ['regulatory'],
        topics: ['csrd'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const fte = num(dm, 'totalFte');
            const rev = str(dm, 'revenueBand');
            const csrd = str(dm, 'csrdApplicable');
            const parts = [];
            if (csrd === 'yes') {
                parts.push(`Yes, ${name || 'our organization'} is subject to CSRD reporting obligations.`);
            }
            else if (csrd === 'no') {
                parts.push(`${name || 'Our organization'} is not currently subject to CSRD reporting obligations based on current size and legal structure.`);
                if (fte > 0 || rev) {
                    const details = [fte > 0 ? `${fmt(fte)} employees` : null, rev ? `revenue band ${rev}` : null].filter(Boolean).join(', ');
                    parts.push(`Current profile: ${details}.`);
                }
            }
            else if (csrd === 'assessing') {
                parts.push(`${name || 'Our organization'} is currently assessing its applicability under CSRD based on entity size, legal structure, and group-reporting context.`);
                if (fte > 0 || rev) {
                    const details = [fte > 0 ? `${fmt(fte)} employees` : null, rev ? `revenue band ${rev}` : null].filter(Boolean).join(', ');
                    parts.push(`Based on our current profile (${details}), applicability is being determined.`);
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
        generate: (dm) => {
            const trir = num(dm, 'trir');
            const lti = num(dm, 'lostTimeIncidents');
            const certs = str(dm, 'certificationsHeld');
            const parts = [];
            if (certs && certs.toLowerCase().includes('45001')) {
                parts.push('Incident management is conducted within our ISO 45001-certified occupational health and safety management system.');
            }
            if (has(dm, 'trir') || has(dm, 'lostTimeIncidents')) {
                parts.push(`Recorded safety performance: TRIR ${trir}${has(dm, 'lostTimeIncidents') ? `, lost time incidents: ${lti}` : ''}.`);
            }
            parts.push('We have not separately documented our incident investigation and corrective-action process for this question.');
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // ===================================================================
    // FUEL
    // ===================================================================
    {
        domains: ['energy_fuel'],
        topics: ['energy_consumption', 'scope_1'],
        generate: (dm) => {
            const gas = num(dm, 'fuel_natural_gas');
            const diesel = num(dm, 'fuel_diesel');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            if (gas || diesel) {
                const parts = [`Our fuel consumption${periodStr}:`];
                if (gas)
                    parts.push(`Natural gas: ${fmt(gas)} m\u00B3.`);
                if (diesel)
                    parts.push(`Diesel: ${fmt(diesel)} litres.`);
                return parts.join(' ');
            }
            return { answer: 'We do not currently track fuel consumption by type for this question.', drafted: true };
        },
    },
    // ===================================================================
    // TRANSPORT
    // ===================================================================
    // Fleet composition
    {
        domains: ['transport'],
        topics: ['fleet'],
        generate: (dm) => {
            const diesel = num(dm, 'fuel_diesel');
            const km = num(dm, 'totalKmDriven');
            const fleetSize = num(dm, 'fleetSize');
            const vehicleAge = num(dm, 'avgVehicleAge');
            const altFuel = num(dm, 'altFuelPercent');
            const parts = [];
            if (has(dm, 'totalKmDriven') || has(dm, 'fleetSize') || has(dm, 'avgVehicleAge') || has(dm, 'altFuelPercent')) {
                parts.push('Fleet activity recorded for the reporting period:');
                if (has(dm, 'fleetSize'))
                    parts.push(`Fleet size: ${fmt(fleetSize)} vehicles.`);
                if (has(dm, 'totalKmDriven'))
                    parts.push(`Total distance driven: ${fmt(km)} km.`);
                if (has(dm, 'avgVehicleAge'))
                    parts.push(`Average vehicle age: ${fmt(vehicleAge)} years.`);
                if (has(dm, 'altFuelPercent'))
                    parts.push(`Alternative-fuel vehicles: ${fmt(altFuel)}% of the fleet.`);
                if (diesel)
                    parts.push(`Diesel consumption: ${fmt(diesel)} litres.`);
                return parts.join(' ');
            }
            return { answer: 'We have not separately documented our fleet composition or fleet-related data for this question.', drafted: true };
        },
    },
    // Transport / logistics environmental impact (catches questions that don't match fleet/business_travel)
    {
        domains: ['transport'],
        topics: ['transport', 'logistics'],
        generate: () => ({
            answer: 'We have not separately documented the environmental impact of our transportation and logistics, and do not track this for this question.',
            drafted: true,
        }),
    },
    // Business travel / commuting (Scope 3)
    {
        domains: ['transport'],
        topics: ['business_travel', 'scope_3'],
        generate: (dm) => {
            const travel = num(dm, 'businessTravel');
            const commute = num(dm, 'employeeCommute');
            const s3 = num(dm, 'scope3Total');
            const wfh = num(dm, 'wfhPercent');
            const parts = [];
            if (s3)
                parts.push(`Our Scope 3 emissions total ${fmt(s3)} tCO2e.`);
            if (travel)
                parts.push(`Business travel: ${fmt(travel)} km.`);
            if (commute)
                parts.push(`Employee commuting: ${fmt(commute)} km.`);
            if (has(dm, 'wfhPercent'))
                parts.push(`Remote work coverage: ${fmt(wfh)}%.`);
            if (parts.length === 0) {
                return { answer: 'We do not currently track Scope 3 emissions from business travel or employee commuting for this question.', drafted: true };
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
        generate: (dm) => {
            const land = num(dm, 'landUseHectares');
            const fertilizer = num(dm, 'fertilizerKg');
            const pesticide = num(dm, 'pesticideKg');
            const irrigation = num(dm, 'irrigationWaterM3');
            const seasonal = num(dm, 'seasonalWorkers');
            if (!has(dm, 'landUseHectares') && !has(dm, 'fertilizerKg') && !has(dm, 'pesticideKg') && !has(dm, 'irrigationWaterM3') && !has(dm, 'seasonalWorkers'))
                return null;
            const parts = [];
            parts.push('Agriculture-related operational inputs recorded for the reporting period:');
            if (has(dm, 'landUseHectares'))
                parts.push(`Land use: ${fmt(land)} hectares.`);
            if (has(dm, 'fertilizerKg'))
                parts.push(`Fertilizer use: ${fmt(fertilizer)} kg.`);
            if (has(dm, 'pesticideKg'))
                parts.push(`Pesticide use: ${fmt(pesticide)} kg.`);
            if (has(dm, 'irrigationWaterM3'))
                parts.push(`Irrigation water: ${fmt(irrigation)} m3.`);
            if (has(dm, 'seasonalWorkers'))
                parts.push(`Seasonal workers: ${fmt(seasonal)}.`);
            return parts.join(' ');
        },
    },
    {
        domains: ['materials'],
        topics: ['mining_metrics'],
        generate: (dm) => {
            const ore = num(dm, 'oreProcessedTonnes');
            const tailings = num(dm, 'tailingsGeneratedTonnes');
            const reused = num(dm, 'waterReusedPercent');
            const rehab = num(dm, 'rehabilitatedLandHectares');
            if (!has(dm, 'oreProcessedTonnes') && !has(dm, 'tailingsGeneratedTonnes') && !has(dm, 'waterReusedPercent') && !has(dm, 'rehabilitatedLandHectares'))
                return null;
            const parts = [];
            parts.push('Mining and materials activity recorded for the reporting period:');
            if (has(dm, 'oreProcessedTonnes'))
                parts.push(`Ore/material processed: ${fmt(ore)} tonnes.`);
            if (has(dm, 'tailingsGeneratedTonnes'))
                parts.push(`Tailings generated: ${fmt(tailings)} tonnes.`);
            if (has(dm, 'waterReusedPercent'))
                parts.push(`Water reused: ${fmt(reused)}%.`);
            if (has(dm, 'rehabilitatedLandHectares'))
                parts.push(`Land rehabilitated: ${fmt(rehab)} hectares.`);
            return parts.join(' ');
        },
    },
    {
        domains: ['materials'],
        topics: ['construction_materials'],
        generate: (dm) => {
            const concrete = num(dm, 'concreteTonnes');
            const steel = num(dm, 'steelTonnes');
            const equipment = num(dm, 'equipmentHours');
            if (!has(dm, 'concreteTonnes') && !has(dm, 'steelTonnes') && !has(dm, 'equipmentHours'))
                return null;
            const parts = [];
            parts.push('Construction material and equipment activity recorded for the reporting period:');
            if (has(dm, 'concreteTonnes'))
                parts.push(`Concrete: ${fmt(concrete)} tonnes.`);
            if (has(dm, 'steelTonnes'))
                parts.push(`Steel: ${fmt(steel)} tonnes.`);
            if (has(dm, 'equipmentHours'))
                parts.push(`Equipment operation: ${fmt(equipment)} hours.`);
            return parts.join(' ');
        },
    },
    // Raw materials
    {
        domains: ['materials'],
        topics: ['raw_materials'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const material = num(dm, 'materialInputTonnes');
            if (has(dm, 'materialInputTonnes')) {
                return `${name || 'Our organization'} recorded material input of ${fmt(material)} tonnes for the reporting period.`;
            }
            return { answer: `${name || 'Our organization'} has not documented its raw-material consumption by type or the share sourced from recycled or secondary materials for this question.`, drafted: true };
        },
    },
    // Supplier code of conduct
    {
        domains: ['buyer_requirements', 'materials'],
        topics: ['supplier_code', 'ethics'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            // supplierPoliciesApproved only contains an actual Supplier Code of Conduct
            // (narrowed in dataModel). State existence only — do not fabricate the code's
            // coverage or any monitoring controls the user did not provide.
            const hasSupplierCode = /supplier code/i.test(str(dm, 'supplierPoliciesApproved'));
            if (hasSupplierCode) {
                return `Yes, ${name || 'our organization'} maintains a Supplier Code of Conduct.`;
            }
            return { answer: 'A formal Supplier Code of Conduct has not yet been established.', drafted: true };
        },
    },
    // Supply chain ESG monitoring
    {
        domains: ['buyer_requirements'],
        topics: ['supply_chain_monitoring'],
        questionTypes: ['MEASURE'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            // State only the user-provided supplier-assessment figure, if any. Do not
            // fabricate monitoring measures (audits, visits, selection criteria).
            const assessed = str(dm, 'suppliersAssessedPercent');
            if (assessed) {
                return {
                    answer: `${assessed}% of our suppliers have been assessed on ESG criteria. We have not separately documented the structured supplier ESG monitoring measures behind this figure for this question.`,
                    drafted: true,
                };
            }
            return {
                answer: `${name || 'Our organization'} has not established a documented supplier ESG monitoring or assessment programme, and does not currently track this for this question.`,
                drafted: true,
            };
        },
    },
    // Conflict minerals (3TG). State only the honest gap — do NOT assert materiality
    // ("not material / we don't source products containing them"), which is a heuristic
    // inference the user never provided.
    {
        domains: ['materials'],
        topics: ['conflict_minerals'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            return {
                answer: `${name || 'Our organization'} does not currently conduct or track conflict-minerals (3TG: tin, tantalum, tungsten, gold) due diligence — including smelter/refiner identification, country-of-origin determination, or CMRT/EMRT declarations — for this question.`,
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
        generate: (dm) => {
            const labourPolicies = str(dm, 'socialPoliciesApproved')
                .split(',')
                .map((p) => p.trim())
                .filter((p) => /human rights|modern slavery|forced lab|child lab|code of conduct|supplier code|sa8000|ethics/i.test(p));
            const country = str(dm, 'headquartersCountry');
            const fte = num(dm, 'totalFte');
            const parts = [];
            if (labourPolicies.length > 0) {
                parts.push(`Our prohibition of child labour and of forced, bonded, or compulsory labour is addressed within the following policies: ${labourPolicies.join(', ')}.`);
                parts.push('We do not currently maintain separate documented due-diligence records (such as age verification or supplier labour audits) specific to this question.');
            }
            else {
                parts.push('We have not established a standalone policy or documented due-diligence process specifically prohibiting child labour and forced, bonded, or compulsory labour.');
            }
            if (country)
                parts.push(`As an employer based in ${country}, our employment practices are subject to applicable national labour law.`);
            if (fte)
                parts.push(`This applies to our ${fmt(fte)} employees.`);
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // Chemical / restricted-substance management (ZDHC MRSL, REACH SVHC, PFAS, chemical inventory).
    // Honest gap only — no heuristic materiality claim about whether the user uses chemicals.
    {
        domains: ['regulatory', 'materials'],
        topics: ['chemical_management'],
        generate: () => ({
            answer: 'We do not currently track conformance to chemical restricted-substance frameworks (such as ZDHC MRSL or REACH SVHC) or maintain a documented chemical inventory for this question.',
            drafted: true,
        }),
    },
    // Trade compliance: sanctions screening / export controls. Honest gap unless tracked.
    {
        domains: ['goals'],
        topics: ['trade_compliance'],
        generate: () => ({
            answer: 'We do not currently operate a documented sanctions-screening or export-control compliance programme, and do not track this as a separate control for this question.',
            drafted: true,
        }),
    },
    // Sustainable fibres / materials sourcing & animal-derived materials. Honest gap only —
    // no heuristic materiality claim about whether the user makes/sells physical products.
    {
        domains: ['materials'],
        topics: ['sustainable_materials'],
        generate: () => ({
            answer: 'We have not documented the fibre/material composition of our products or obtained recognised sustainable-material certifications (such as GOTS, GRS, RDS, or FSC) for this question.',
            drafted: true,
        }),
    },
    // Product eco-labels / Environmental Product Declarations. Relevance-aware honesty.
    {
        domains: ['regulatory'],
        topics: ['ecolabels'],
        generate: (dm) => {
            const certs = str(dm, 'certificationsHeld');
            if (certs && /ecolabel|blue angel|nordic swan|epd|environmental product declaration/i.test(certs)) {
                return { answer: `Our products carry the following recognised environmental labels/declarations: ${certs}.` };
            }
            return {
                answer: 'Our products do not currently carry recognised eco-labels (such as the EU Ecolabel, Blue Angel, or Nordic Swan) or published Environmental Product Declarations, and we do not track this for this question.',
                drafted: true,
            };
        },
    },
    // Packaging materials (Q20 — must address packaging types, recyclability, recycled content)
    {
        domains: ['packaging', 'waste'],
        topics: ['packaging'],
        generate: (dm) => {
            const div = num(dm, 'diversionRate');
            const packagingWaste = num(dm, 'packagingWasteKg');
            const parts = [];
            if (has(dm, 'packagingWasteKg'))
                parts.push(`Recorded packaging waste for the reporting period was ${fmt(packagingWaste)} kg.`);
            if (div > 0)
                parts.push(`Our overall waste diversion rate is ${fmt(div)}%, which includes packaging waste streams.`);
            parts.push('We have not separately documented our packaging materials, their recyclability, or recycled content for this question.');
            return { answer: parts.join(' '), drafted: true };
        },
    },
    // Supplier ESG assessment percentage (Q55)
    {
        domains: ['buyer_requirements', 'materials'],
        topics: ['supply_chain_monitoring', 'supplier_code'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            const pct = num(dm, 'suppliersAssessedPercent');
            // State only the provided figure; do not fabricate what assessments cover or
            // an in-progress programme the user never described.
            if (dm.has('suppliersAssessedPercent')) {
                return `${fmt(pct)}% of our suppliers have been assessed on ESG criteria.`;
            }
            return {
                answer: 'We do not currently track the percentage of suppliers assessed on ESG criteria.',
                drafted: true,
            };
        },
    },
    // Supplier non-compliance handling (Q58)
    {
        domains: ['buyer_requirements'],
        topics: ['supply_chain_monitoring', 'supplier_code'],
        questionTypes: ['MEASURE', 'POLICY'],
        generate: () => ({
            // Do not fabricate an escalation/corrective-action/termination process the
            // user never provided.
            answer: 'We have not documented a formal process for handling supplier ESG non-compliance (corrective action, escalation, or termination), and do not track this for this question.',
            drafted: true,
        }),
    },
    // ===================================================================
    // SUSTAINABILITY STRATEGY (fine-grained)
    // ===================================================================
    // Sustainability reporting (Q51)
    {
        domains: ['regulatory', 'goals'],
        topics: ['transparency'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const publishes = str(dm, 'publishesSustainabilityReport');
            const framework = str(dm, 'reportingFramework');
            const parts = [];
            if (publishes === 'Yes') {
                parts.push(`Yes, ${name || 'our organization'} publishes a sustainability report.`);
                if (framework)
                    parts.push(`The report follows the ${framework} framework.`);
            }
            else if (publishes === 'No') {
                return { answer: `No, ${name || 'our organization'} does not currently publish a standalone sustainability or ESG report.`, drafted: true };
            }
            else {
                return { answer: `${name || 'Our organization'} has not recorded whether it publishes a standalone sustainability report for this question.`, drafted: true };
            }
            return parts.join(' ');
        },
    },
    // ESG risk management — honest gap; do not fabricate a risk-management process.
    {
        domains: ['swot', 'goals'],
        topics: ['risk_management', 'strategy'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            return {
                answer: `${name || 'Our organization'} has not documented a formal ESG risk-management process (risk identification, assessment, and management-review integration), and does not track this for this question.`,
                drafted: true,
            };
        },
    },
    // Sustainability in procurement — honest gap; do not fabricate procurement practices.
    {
        domains: ['goals', 'materials', 'buyer_requirements'],
        topics: ['strategy', 'supplier_management'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            return {
                answer: `${name || 'Our organization'} has not documented how sustainability considerations are integrated into procurement decisions, and does not track this for this question.`,
                drafted: true,
            };
        },
    },
];
//# sourceMappingURL=answerTemplates.js.map
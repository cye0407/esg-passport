// ============================================
// ESG Domain Pack — Answer Templates
// ============================================
// 12 rich answer templates for ESG data domains.
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
            const mwh = kwh / 1000;
            const renPct = num(dm, 'renewablePercent');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            let answer = `Our total electricity consumption was ${fmt(kwh)} kWh (${fmt(mwh)} MWh)${periodStr}.`;
            if (renPct > 0) {
                const renKwh = kwh * renPct / 100;
                answer += ` Of this, ${fmt(renPct)}% (approximately ${fmt(renKwh)} kWh) was sourced from renewable energy.`;
                answer += renPct >= 50
                    ? ' Renewable electricity accounts for the majority of our purchased power.'
                    : ' Renewable electricity currently represents a minority share of our purchased power.';
            }
            else {
                answer += ' Currently, 0% of our electricity is sourced from renewable energy.';
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
            if (kwh > 0 && renPct > 0)
                answer += ` Out of ${fmt(kwh)} kWh total consumption, approximately ${fmt(kwh * renPct / 100)} kWh was renewable.`;
            if (renPct === 0)
                answer += ' No renewable electricity was sourced during this period.';
            else if (renPct === 100)
                answer += ' All purchased electricity was sourced from renewable energy.';
            else if (renPct >= 50)
                answer += ' Renewable electricity is the majority share of our purchased power.';
            else
                answer += ' Renewable electricity currently represents a minority share of our purchased power.';
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
            parts.push('Our energy efficiency programme focuses on reducing overall consumption and increasing the share of renewable sources.');
            if (kwh > 0)
                parts.push(`Our current electricity consumption is ${fmt(kwh)} kWh${period ? ` (${period})` : ''}, with ${renPct > 0 ? fmt(renPct) + '% from renewable sources' : 'renewable procurement under evaluation'}.`);
            parts.push('Key efficiency measures include regular energy audits, equipment maintenance schedules, LED lighting upgrades, and monitoring of consumption patterns to identify reduction opportunities.');
            return parts.join(' ');
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
            const mwh = kwh / 1000;
            const renPct = num(dm, 'renewablePercent');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            let answer = `Our total electricity consumption was ${fmt(kwh)} kWh (${fmt(mwh)} MWh)${periodStr}.`;
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
                parts.push(`Market-based: ${fmt(s2m)} tCO2e, reflecting our renewable energy procurement strategy.`);
            else if (s2)
                parts.push('A separate market-based Scope 2 figure has not been recorded in tracked data.');
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
                parts.push('Scope 3 emissions have not been measured or reported.');
            }
            if (travel)
                parts.push(`Business travel: ${fmt(travel)} km.`);
            if (commute)
                parts.push(`Employee commuting: ${fmt(commute)} km.`);
            return parts.join(' ');
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
            let answer = `Our workforce of ${fmt(fte)} FTE employees comprises ${fmt(fem)}% female and ${fmt(male)}% male employees.`;
            if (fem >= 40 && fem <= 60) {
                answer += ' We maintain a relatively balanced gender distribution across our organization.';
            }
            else if (fem < 30) {
                answer += ' We recognize the need to improve gender diversity and are implementing initiatives to attract and retain a more diverse workforce.';
            }
            return answer;
        },
    },
    // POLICY: Human rights (Q38 — must cover forced labor, child labor, freedom of association, scope, communication)
    {
        domains: ['workforce'],
        topics: ['human_rights'],
        questionTypes: ['POLICY'],
        generate: (dm) => {
            const status = str(dm, 'humanRightsPolicyStatus');
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            if (status === 'implemented') {
                parts.push('Yes, we maintain a formal human rights policy.');
                parts.push('The policy covers core human rights topics including forced labor, child labor, non-discrimination, and freedom of association and collective bargaining.');
                parts.push('It applies across our operations and relevant business relationships and is communicated through onboarding, management procedures, and periodic policy review.');
            }
            else if (status === 'not_applicable') {
                parts.push('A standalone human rights policy is recorded as not applicable to the current business model. We nonetheless expect compliance with applicable labor law and respect for fundamental worker rights.');
            }
            else if (status === 'in_progress') {
                parts.push('A formal human rights policy is currently under development.');
                parts.push('In the meantime, we expect compliance with applicable labor law and respect for core worker rights including freedom of association.');
            }
            else {
                parts.push('We are committed to respecting human rights across our operations and value chain.');
                parts.push('We prohibit forced labor, child labor, and any form of compulsory work. We respect employees\' right to freedom of association.');
                parts.push('A formal, standalone Human Rights Policy has not yet been established.');
            }
            if (fte)
                parts.push(`These commitments apply to all ${fmt(fte)} employees${country ? ` across our operations in ${country}` : ''}.`);
            return parts.join(' ');
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
                parts.push('We are committed to diversity, equity, and inclusion across our organization.');
                parts.push('We track workforce composition and leadership diversity as part of our ongoing DEI efforts.');
                if (fem > 0)
                    parts.push(`Women currently represent ${fmt(fem)}% of our total workforce${fte > 0 ? ` of ${fmt(fte)} employees` : ''}.`);
                if (leaderPct > 0)
                    parts.push(`${fmt(leaderPct)}% of management and leadership positions are held by women.`);
                parts.push('We apply non-discrimination principles in recruitment, promotion, and employment practices, and are working to formalize these commitments into a standalone DEI policy.');
            }
            else {
                parts.push('We are committed to non-discrimination and equal opportunity in all employment practices.');
                parts.push('We do not yet have a standalone DEI policy. Formalized commitments, measurable diversity targets, and reporting processes have not been established.');
            }
            return parts.join(' ');
        },
    },
    // MEASURE: Freedom of association (Q41 — must address union rights, not wages)
    {
        domains: ['workforce'],
        topics: ['freedom_of_association', 'collective_bargaining'],
        questionTypes: ['MEASURE'],
        generate: (dm) => {
            const cbaPct = num(dm, 'collectiveBargainingPercent');
            const fte = num(dm, 'totalFte');
            const country = str(dm, 'headquartersCountry');
            const parts = [];
            parts.push('Yes, we respect employees\' right to freedom of association and collective bargaining in all our operations.');
            parts.push('Employees are free to join, form, or refrain from joining trade unions or works councils without fear of intimidation, retaliation, or discrimination.');
            if (cbaPct > 0) {
                parts.push(`Currently, ${fmt(cbaPct)}% of our workforce is covered by collective bargaining agreements${fte > 0 ? `, representing approximately ${fmt(Math.round(fte * cbaPct / 100))} of our ${fmt(fte)} employees` : ''}.`);
            }
            if (country)
                parts.push(`These rights are addressed within the framework of applicable labor law in ${country}.`);
            return parts.join(' ');
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
            parts.push(`Working conditions at our facilities${country ? ` in ${country}` : ''} are governed by employment contracts and applicable labor legislation.`);
            parts.push('Standard working hours do not exceed the legal maximum and are defined in individual employment contracts.');
            parts.push('Overtime is voluntary, compensated in accordance with legal requirements, and subject to management approval.');
            parts.push('All employees are entitled to legally mandated rest periods, daily and weekly rest, annual paid leave, public holidays, and parental leave provisions.');
            if (cbaPct > 0)
                parts.push(`${fmt(cbaPct)}% of our workforce is covered by collective bargaining agreements, which provide additional working condition protections.`);
            if (fte > 0)
                parts.push(`These conditions apply to all ${fmt(fte)} FTE employees.`);
            return parts.join(' ');
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
                parts.push('We benchmark compensation against recognized living wage standards and review pay levels annually to ensure continued compliance.');
            }
            else {
                parts.push('We are committed to fair compensation. Alignment with applicable minimum wage legislation has not been formally verified.');
                parts.push('We are evaluating alignment with recognized living wage benchmarks (as distinct from legal minimum wage) and plan to formalize our approach in the next reporting period.');
            }
            if (fte > 0)
                parts.push(`This applies to all ${fmt(fte)} FTE employees.`);
            return parts.join(' ');
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
            if (rate <= 10)
                answer += ' This low turnover rate reflects our focus on employee engagement, development, and competitive working conditions.';
            else if (rate <= 20)
                answer += ' We monitor turnover trends and invest in retention measures including career development, training, and employee wellbeing programmes.';
            else
                answer += ' We are actively addressing turnover through enhanced onboarding, employee engagement surveys, and retention initiatives.';
            return answer;
        },
    },
    // KPI: Collective bargaining coverage
    {
        domains: ['workforce'],
        topics: ['collective_bargaining', 'labor_practices'],
        questionTypes: ['KPI'],
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
                parts.push('We respect freedom of association and the right to collective bargaining in all our operations.');
            }
            else {
                parts.push('Our workforce is not currently covered by collective bargaining agreements.');
                if (country)
                    parts.push(`Working conditions in ${country} are governed by employment contracts that meet or exceed local legal requirements.`);
                parts.push('We respect freedom of association and employees are free to join or form trade unions.');
            }
            return parts.join(' ');
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
            if (leaderPct >= 40)
                parts.push('We maintain a strong commitment to gender-balanced leadership and continue to support career development pathways for underrepresented groups.');
            else if (leaderPct >= 25)
                parts.push('We are actively working to improve gender diversity at leadership level through mentoring, succession planning, and inclusive recruitment practices.');
            else
                parts.push('We recognize the need to improve diversity at leadership level and are implementing targeted initiatives including mentoring programmes and inclusive recruitment practices.');
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
                parts.push('We benchmark compensation against living wage standards and review pay levels annually to ensure continued compliance.');
            }
            else if (compliant === 'Not applicable') {
                parts.push('Living wage benchmarking is recorded as not applicable to this business model or workforce setup.');
            }
            else {
                parts.push('We are committed to fair compensation. Alignment with applicable minimum wage legislation has not been formally verified.');
                parts.push('We are evaluating alignment with living wage benchmarks and plan to formalize our approach in the next reporting period.');
            }
            if (fte > 0)
                parts.push(`This applies to all ${fmt(fte)} FTE employees.`);
            return parts.join(' ');
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
                parts.push('Channels include direct reporting to management, a designated escalation route, and follow-up procedures to ensure issues are addressed promptly and without retaliation.');
                if (has(dm, 'grievancesReported')) {
                    parts.push(`${period ? `During ${period}, ` : ''}${count} grievance${count !== 1 ? 's were' : ' was'} reported through these channels.`);
                }
            }
            else if (exists === 'Not applicable') {
                parts.push('A formal grievance mechanism is recorded as not applicable to the current business model or stakeholder setup.');
            }
            else {
                parts.push('A formal grievance mechanism has not yet been established.');
                parts.push('Currently, issues can be raised through direct communication with management.');
            }
            return parts.join(' ');
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
                    return `No, there were no work-related fatalities${periodStr}.`;
                }
                return `${fat} work-related fatalit${fat === 1 ? 'y' : 'ies'} occurred${periodStr}. A full investigation was conducted, corrective actions were implemented, and findings were shared across all sites to prevent recurrence.`;
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
                    parts.push('We are pleased to report zero lost time incidents and zero fatalities. Our health and safety management system focuses on proactive hazard identification and continuous improvement.');
                }
                else if (fat === 0) {
                    parts.push('While we recorded zero fatalities, we continue to investigate all incidents to prevent recurrence and strengthen our safety culture.');
                }
                return parts.join(' ');
            }
            // Fallback when no H&S metrics have been entered — industry-conditioned framing
            const ind = str(dm, 'industryDescription').toLowerCase();
            const isLowRisk = !ind || ind.includes('software') || ind.includes('technology') || ind.includes('professional') || ind.includes('services') || ind.includes('consult') || ind.includes('financial');
            const parts = [];
            if (isLowRisk) {
                parts.push('Our organization operates in a low-risk office environment with no high-hazard activities.');
                parts.push('We maintain workplace safety standards consistent with applicable regulations and have not recorded any significant occupational health and safety incidents.');
                parts.push('Standardized incident rate metrics (TRIR, LTIR) and the underlying hours-worked tracking are being implemented as part of the next reporting cycle to enable formal benchmarking.');
            }
            else {
                parts.push('We track workplace incidents through our internal safety management process and apply corrective actions following any reportable events.');
                parts.push('Standardized rate metrics (TRIR, LTIR) require systematic hours-worked tracking, which is not yet in place.');
                parts.push('In the interim, incident counts are reviewed monthly by management and any serious events are investigated to identify root causes and prevent recurrence.');
            }
            return parts.join(' ');
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
            const parts = [];
            parts.push('Our occupational health and safety management system is designed around hazard identification, risk assessment, and continuous improvement.');
            parts.push('Key elements include regular workplace inspections, incident investigation and root cause analysis, safety training for all employees, and emergency preparedness procedures.');
            if (certs && certs.toLowerCase().includes('45001')) {
                parts.push(`Our system is certified to ISO 45001, maintained through regular external audits.`);
            }
            if (has(dm, 'trir') || has(dm, 'lostTimeIncidents')) {
                parts.push(`Current performance: TRIR ${trir}, lost time incidents ${lti}.`);
            }
            return parts.join(' ');
        },
    },
    // ===================================================================
    // WASTE (fine-grained)
    // ===================================================================
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
            if (div >= 75)
                answer += ' This reflects our commitment to circular economy principles.';
            else
                answer += ' We continue to implement waste segregation and recycling initiatives to improve our diversion rate.';
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
                answer += ' All hazardous waste is segregated, stored, and disposed of through licensed contractors in accordance with applicable regulations.';
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
            const parts = [];
            parts.push('Our circular economy initiatives focus on reducing waste generation at source, maximizing material recovery, and designing out waste where possible.');
            parts.push('Current measures include waste segregation across all operational areas, partnerships with recycling contractors, and evaluation of take-back schemes for key material streams.');
            if (waste > 0 && div > 0) {
                parts.push(`We currently achieve a ${fmt(div)}% waste diversion rate from ${fmt(waste)} kg total waste, and are targeting further improvement.`);
            }
            return parts.join(' ');
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
                answer += ` Of this total, ${fmt(haz)} kg was classified as hazardous waste, managed in accordance with applicable regulations.`;
            if (div >= 75)
                answer += ' Our high diversion rate reflects our commitment to circular economy principles and waste minimization.';
            else if (div > 0)
                answer += ' We continue to implement waste reduction initiatives to improve our diversion rate.';
            return answer;
        },
    },
    // ===================================================================
    // WATER
    // ===================================================================
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
            answer += ' We monitor water usage across our operations and seek to reduce consumption through efficiency measures.';
            return answer;
        },
    },
    // POLICY/MEASURE: Wastewater / discharge
    {
        domains: ['effluents', 'energy_water'],
        topics: ['wastewater'],
        generate: (dm) => {
            const ind = str(dm, 'industryDescription').toLowerCase();
            const water = num(dm, 'waterWithdrawal');
            const isLightWater = !ind || ind.includes('software') || ind.includes('technology') || ind.includes('professional') || ind.includes('services') || ind.includes('consult') || ind.includes('financial');
            const parts = [];
            if (isLightWater) {
                parts.push('Our wastewater discharge is limited to standard sanitary effluent from office facilities, which is discharged to municipal sewer systems and treated by the local utility in accordance with applicable regulations.');
                parts.push('We do not generate industrial process wastewater. Water-related environmental impacts are not material to our operations, though we monitor consumption as part of our broader environmental management approach.');
            }
            else {
                parts.push('Wastewater from our operations is managed in accordance with local environmental regulations and discharge permits where applicable.');
                parts.push('Sanitary wastewater is discharged to municipal treatment systems. Where our processes generate industrial wastewater, we apply appropriate pre-treatment before discharge and maintain records to support regulatory reporting.');
            }
            if (water)
                parts.push(`Our total water withdrawal is ${fmt(water)} m\u00B3 per year, providing a baseline for future discharge tracking.`);
            return parts.join(' ');
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
            parts.push('We assess water stress risks as part of our environmental management approach.');
            if (country)
                parts.push(`Our operations are based in ${country}.`);
            parts.push('We do not currently operate in regions classified as high water stress by the WRI Aqueduct tool, though we monitor this as part of our site-level risk assessments.');
            if (water)
                parts.push(`Our total water withdrawal is ${fmt(water)} m\u00B3 per year, primarily from municipal supply.`);
            return parts.join(' ');
        },
    },
    // POLICY/MEASURE: Water management policy / stewardship
    {
        domains: ['energy_water'],
        topics: ['water_policy'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const policies = str(dm, 'environmentalPoliciesApproved');
            const water = num(dm, 'waterWithdrawal');
            const relevantPolicies = policies
                .split(', ')
                .map((p) => p.trim())
                .filter(Boolean)
                .filter((p) => /water|environment/i.test(p));
            const parts = [];
            if (relevantPolicies.length > 0) {
                parts.push(`Our water stewardship approach is formalized in the following policies: ${[...new Set(relevantPolicies)].join(', ')}.`);
                if (water > 0)
                    parts.push(`We track water withdrawal and recorded ${fmt(water)} m\u00B3 during the reporting period.`);
                parts.push('Our approach focuses on monitoring water use, complying with local requirements, and identifying opportunities to reduce consumption.');
                return parts.join(' ');
            }
            parts.push('A standalone water management policy is not separately recorded in tracked data.');
            if (water > 0)
                parts.push(`We do monitor water withdrawal and recorded ${fmt(water)} m\u00B3 during the reporting period, which provides a baseline for future stewardship measures.`);
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
            if (fte > 0)
                answer += ` We employ ${fmt(fte)} people.`;
            if (ind && ind.toLowerCase() !== 'other')
                answer += ` We operate in the ${ind} sector.`;
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
                parts.push('Our products and services are detailed in our company registration documents and marketing materials. We serve customers across domestic and European markets.');
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
        questionTypes: ['KPI', 'POLICY', 'MEASURE'],
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
            else if (assured === 'Not applicable') {
                parts.push(`External assurance of ESG data is not applicable based on the current reporting setup recorded for ${name || 'our organization'}.`);
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
    // Environmental policy / EMS
    {
        domains: ['regulatory'],
        topics: ['environmental_policy'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const policies = str(dm, 'environmentalPoliciesApproved');
            const certs = [str(dm, 'validCertificates'), str(dm, 'certificationsHeld')]
                .filter(Boolean)
                .join(', ');
            const certText = certs.toLowerCase();
            const hasIso14001 = certText.includes('iso 14001') || certText.includes('emas');
            const relevantPolicies = policies
                .split(', ')
                .map((p) => p.trim())
                .filter(Boolean)
                .filter((p) => /environment|energy|waste|water|climate/i.test(p));
            const parts = [];
            if (relevantPolicies.length > 0 || hasIso14001) {
                if (relevantPolicies.length > 0) {
                    parts.push(`Our environmental management approach is formalized in the following policies: ${[...new Set(relevantPolicies)].join(', ')}.`);
                }
                else {
                    parts.push('Our environmental management approach is supported by a documented management system.');
                }
                if (hasIso14001) {
                    parts.push('This approach is supported by an externally verified environmental management certification (ISO 14001 / EMAS where applicable).');
                }
                else if (relevantPolicies.length > 0) {
                    parts.push('We do not currently record ISO 14001 or EMAS certification in tracked data; evidence available today is policy-based rather than third-party certified.');
                }
                parts.push('It covers environmental compliance, resource efficiency, and continual improvement across relevant operations.');
                return parts.join(' ');
            }
            return {
                answer: 'A formal environmental policy or environmental management system is not separately recorded in tracked data. Current tracked certifications do not indicate ISO 14001 or EMAS.',
                drafted: true,
            };
        },
    },
    // General certifications (Q50 — must list ALL certs, ideally with validity dates)
    {
        domains: ['regulatory'],
        topics: ['certifications'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            const certs = str(dm, 'certificationsHeld');
            const validCerts = str(dm, 'validCertificates');
            if (certs || validCerts) {
                const allCerts = [validCerts, certs].filter(Boolean);
                const uniqueCerts = [...new Set(allCerts.join(', ').split(', ').map(c => c.trim()).filter(Boolean))];
                const parts = [];
                parts.push(`Our organization holds the following certifications: ${uniqueCerts.join('; ')}.`);
                parts.push('These certifications are maintained through regular external surveillance audits and demonstrate our commitment to internationally recognized management standards.');
                parts.push('Certificate numbers and validity dates are available on request.');
                return parts.join(' ');
            }
            return 'Our organization does not currently hold third-party environmental or quality management certifications. We are evaluating ISO 14001 and ISO 9001 certification pathways as part of our continuous improvement strategy.';
        },
    },
    // ISO 45001 specific (H&S certification)
    {
        domains: ['regulatory'],
        topics: ['health_safety_management'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const certs = str(dm, 'certificationsHeld');
            const validCerts = str(dm, 'validCertificates');
            const allCerts = [certs, validCerts].filter(Boolean).join(', ').toLowerCase();
            if (allCerts.includes('45001')) {
                return 'Yes, our organization holds ISO 45001 certification for our occupational health and safety management system. The certification is maintained through regular external surveillance audits and covers all operational sites.';
            }
            return 'Our organization does not currently hold ISO 45001 or equivalent health and safety certification. Our health and safety management system is based on risk assessment principles and regulatory compliance. We are evaluating ISO 45001 certification as part of our continuous improvement strategy.';
        },
    },
    // ===================================================================
    // TRAINING
    // ===================================================================
    {
        domains: ['training'],
        topics: ['training_average'],
        generate: (dm) => {
            if (!has(dm, 'trainingHoursPerEmployee'))
                return null;
            const perEmp = num(dm, 'trainingHoursPerEmployee');
            const total = num(dm, 'totalTrainingHours');
            const fte = num(dm, 'totalFte');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            let answer = `The average training delivered per employee${periodStr} was ${fmt(perEmp)} hours.`;
            if (total > 0 && fte > 0)
                answer += ` This is based on ${fmt(total)} total training hours across a headcount of ${fmt(fte)} employees.`;
            return answer;
        },
    },
    {
        domains: ['training'],
        topics: ['training_total'],
        generate: (dm) => {
            if (!has(dm, 'totalTrainingHours'))
                return null;
            const total = num(dm, 'totalTrainingHours');
            const period = str(dm, 'reportingPeriod');
            const periodStr = period ? ` during ${period}` : ' during the reporting period';
            return `Our total training hours${periodStr} were ${fmt(total)} hours across the workforce.`;
        },
    },
    {
        domains: ['training'],
        topics: ['training_participation'],
        generate: () => null,
    },
    {
        domains: ['training'],
        topics: ['training_types'],
        generate: (dm) => {
            const perEmp = num(dm, 'trainingHoursPerEmployee');
            const parts = [];
            parts.push('We provide training across health and safety, technical skills, sustainability awareness, compliance, and role-specific capability development.');
            if (perEmp > 0)
                parts.push(`Average training provision during the reporting period was ${fmt(perEmp)} hours per employee.`);
            return parts.join(' ');
        },
    },
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
            answer += ' Training programmes cover areas including health and safety, technical skills, and sustainability awareness.';
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
                return `Our primary sustainability commitment is: ${goal}. We are integrating this target into our business strategy and operational planning, and we track progress against this goal as part of our regular management review process.`;
            }
            const period = str(dm, 'reportingPeriod');
            return `We are in the process of formalising our sustainability goals. Our immediate priorities include establishing baseline measurements for energy consumption, emissions, and waste, and setting reduction targets for the next reporting period${period ? ` (${parseInt(period) + 1})` : ''}.`;
        },
    },
    // POLICY: Climate targets / SBTi / net-zero
    {
        domains: ['goals', 'emissions'],
        topics: ['climate_targets'],
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
                    parts.push(`Current Scope 1 + Scope 2 emissions total ${fmt(total)} tCO2e.`);
                return parts.join(' ');
            }
            if (total > 0) {
                return {
                    answer: `A formal science-based target (SBTi-aligned) or decarbonization roadmap has not been recorded in tracked data. Current Scope 1 + Scope 2 emissions total ${fmt(total)} tCO2e.`,
                    drafted: true,
                };
            }
            return {
                answer: 'A formal science-based target (SBTi-aligned) or decarbonization roadmap has not been recorded in tracked data.',
                drafted: true,
            };
        },
    },
    // Ethics / code of conduct
    {
        domains: ['goals'],
        topics: ['ethics'],
        questionTypes: ['POLICY'],
        generate: (dm) => {
            const allPolicies = str(dm, 'approvedPolicies');
            const policies = str(dm, 'governancePoliciesApproved');
            const status = str(dm, 'codeOfConductStatus');
            const parts = [];
            const conductPolicies = [allPolicies, policies]
                .filter(Boolean)
                .join(', ')
                .split(', ')
                .map((p) => p.trim())
                .filter(Boolean)
                .filter((p) => /code of conduct|business ethics|anti-corruption|anti-bribery/i.test(p));
            const uniqueConductPolicies = [...new Set(conductPolicies)];
            if (uniqueConductPolicies.length > 0) {
                parts.push(`Our ethical standards are formalized in the following policies: ${uniqueConductPolicies.join(', ')}.`);
                parts.push('These policies cover anti-corruption, anti-bribery, conflicts of interest, and fair business practices, and apply to employees and relevant business partners.');
            }
            else if (status === 'in_progress') {
                parts.push('A formal Code of Conduct / Business Ethics policy is currently in progress.');
                parts.push('Until it is finalized, ethical expectations are addressed through other governance controls and management procedures already in place.');
            }
            else if (status === 'not_applicable') {
                parts.push('A standalone Code of Conduct / Business Ethics policy is recorded as not applicable to the current business model.');
            }
            else if (policies) {
                parts.push(`Our governance framework includes the following documented policies: ${policies}.`);
                parts.push('These governance controls support ethical business conduct, but a standalone Code of Conduct or Business Ethics policy is not separately recorded in tracked data.');
            }
            else {
                parts.push('We are committed to conducting business with integrity and transparency.');
                parts.push('A formal Code of Ethics and Anti-Corruption Policy has not yet been established.');
            }
            return parts.join(' ');
        },
    },
    {
        domains: ['goals'],
        topics: ['anti_corruption', 'ethics'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const allPolicies = str(dm, 'approvedPolicies');
            const policies = str(dm, 'governancePoliciesApproved');
            const status = str(dm, 'antiCorruptionStatus');
            const parts = [];
            const antiCorruptionPolicies = [allPolicies, policies]
                .filter(Boolean)
                .join(', ')
                .split(', ')
                .map((p) => p.trim())
                .filter(Boolean)
                .filter((p) => /anti-corruption|anti-bribery|code of conduct|business ethics/i.test(p));
            const uniquePolicies = [...new Set(antiCorruptionPolicies)];
            if (uniquePolicies.length > 0) {
                parts.push(`Our ethical standards are formalized in the following policies: ${uniquePolicies.join(', ')}.`);
                parts.push('These policies cover anti-corruption, anti-bribery, conflicts of interest, and fair business practices, and apply to employees and relevant business partners.');
            }
            else if (status === 'in_progress') {
                parts.push('A formal anti-corruption and anti-bribery policy is currently in progress.');
                parts.push('In the meantime, expectations on integrity, conflicts of interest, and fair dealing are addressed through existing governance controls.');
            }
            else if (status === 'not_applicable') {
                parts.push('A standalone anti-corruption and anti-bribery policy is recorded as not applicable to the current business model.');
            }
            else {
                parts.push('A formal anti-corruption and anti-bribery policy is not separately recorded in tracked data.');
            }
            return parts.join(' ');
        },
    },
    // POLICY: Corporate governance / board oversight of ESG
    {
        domains: ['goals', 'regulatory'],
        topics: ['governance', 'strategy'],
        questionTypes: ['POLICY', 'MEASURE'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const fte = num(dm, 'totalFte');
            const policies = str(dm, 'governancePoliciesApproved');
            const certs = str(dm, 'certificationsHeld');
            const parts = [];
            if (fte > 50) {
                parts.push(`${name ? name + "'s" : 'Our'} senior management has direct oversight of sustainability and ESG matters.`);
                parts.push('ESG performance is reviewed as part of our regular management review cycle, with key metrics reported to the management board at least quarterly.');
            }
            else {
                parts.push(`As a ${fte > 0 ? fmt(fte) + '-employee' : 'small'} organization, ESG oversight is exercised directly by the managing directors.`);
                parts.push('Sustainability topics are discussed as part of regular business reviews.');
            }
            if (policies)
                parts.push(`Our governance framework is supported by the following policies: ${policies}.`);
            if (certs)
                parts.push(`Our management system certifications (${certs}) provide additional structured oversight through regular external audits.`);
            parts.push('A formalized ESG governance structure with explicit accountability and reporting lines has not yet been established.');
            return parts.join(' ');
        },
    },
    // POLICY: Fines, sanctions, legal proceedings (Q45)
    {
        domains: ['goals', 'regulatory'],
        topics: ['fines_sanctions'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const status = str(dm, 'noSignificantFines');
            if (status === 'none' || status === 'yes') {
                return `To the best of our knowledge, ${name || 'our organization'} has not been subject to any significant environmental, social, or governance-related fines, sanctions, or legal proceedings in the past three years.`;
            }
            if (status === 'disclosed' || status === 'reported') {
                return `${name || 'Our organization'} has disclosed relevant fines, sanctions, or legal proceedings. Details are available in our compliance records and can be provided upon request.`;
            }
            return {
                answer: 'The status of significant ESG-related fines, sanctions, or legal proceedings has not been recorded in tracked data.',
                drafted: true,
            };
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
                parts.push(`Yes, ${name || 'our organization'} maintains data protection and privacy controls${isEU ? ' aligned with the EU General Data Protection Regulation (GDPR)' : ' in accordance with applicable data protection legislation'}.`);
                parts.push('Personal data of employees, customers, and business partners is protected through access controls, role-based permissions, contractual confidentiality obligations, and employee awareness training.');
                parts.push('We maintain procedures for data subject requests, breach notification, and secure handling of personal data.');
            }
            else if (hasPolicy === 'No') {
                parts.push(`${name || 'Our organization'} is developing a formal data protection and privacy policy${isEU ? ' aligned with GDPR requirements' : ''}.`);
                parts.push('Basic data protection measures are in place including access controls and confidentiality obligations, but a comprehensive documented framework is being established.');
            }
            else {
                return { answer: `${name || 'Our organization'} maintains data protection controls${isEU ? ' in accordance with GDPR' : ''}. Personal data is protected through access controls, confidentiality obligations, and employee awareness measures.`, drafted: true };
            }
            return parts.join(' ');
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
                answer: `${name || 'Our organization'} has not recorded whether ESG-linked executive compensation or incentive structures are in place.`,
                drafted: true,
            };
        },
    },
    {
        domains: ['workforce'],
        topics: ['human_rights_due_diligence', 'human_rights'],
        questionTypes: ['MEASURE', 'POLICY'],
        generate: () => {
            return 'Human rights due diligence in our own operations and supply chain has not been formally documented. A structured due diligence process has not been reported.';
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
                parts.push('We are building the internal data foundation to align reporting with European Sustainability Reporting Standards (ESRS), including data collection, gap analysis, and reporting infrastructure.');
            }
            else if (csrd === 'no') {
                parts.push(`${name || 'Our organization'} is not currently subject to CSRD reporting obligations based on current size and legal structure.`);
                if (fte > 0 || rev) {
                    const details = [fte > 0 ? `${fmt(fte)} employees` : null, rev ? `revenue band ${rev}` : null].filter(Boolean).join(', ');
                    parts.push(`Current profile: ${details}.`);
                }
                parts.push('We are nonetheless building ESG data capabilities in preparation for potential future applicability or voluntary adoption of ESRS-aligned reporting.');
            }
            else if (csrd === 'assessing') {
                parts.push(`${name || 'Our organization'} is currently assessing its applicability under CSRD based on entity size, legal structure, and group-reporting context.`);
                if (fte > 0 || rev) {
                    const details = [fte > 0 ? `${fmt(fte)} employees` : null, rev ? `revenue band ${rev}` : null].filter(Boolean).join(', ');
                    parts.push(`Based on our current profile (${details}), we are determining whether and when CSRD reporting obligations will apply.`);
                }
                parts.push('We are building the internal data foundation needed to support ESRS-aligned reporting.');
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
            parts.push('All workplace incidents, including near-misses, are subject to a structured investigation process.');
            parts.push('Our approach includes immediate incident reporting and scene preservation, root cause analysis using structured methods (e.g., 5-Why analysis), identification of corrective and preventive actions with assigned owners and deadlines, and follow-up verification to confirm effectiveness.');
            if (certs && certs.toLowerCase().includes('45001')) {
                parts.push('This process is embedded in our ISO 45001-certified occupational health and safety management system.');
            }
            parts.push('Investigation findings are shared with relevant teams to prevent recurrence and are reviewed as part of management review meetings.');
            if (has(dm, 'trir') || has(dm, 'lostTimeIncidents')) {
                parts.push(`Current safety performance: TRIR ${trir}${has(dm, 'lostTimeIncidents') ? `, lost time incidents: ${lti}` : ''}.`);
            }
            return parts.join(' ');
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
            const ind = str(dm, 'industryDescription').toLowerCase();
            const isLightFuel = !ind || ind.includes('software') || ind.includes('technology') || ind.includes('professional') || ind.includes('services') || ind.includes('consult') || ind.includes('financial');
            if (gas || diesel) {
                const parts = [`Our fuel consumption${periodStr}:`];
                if (gas)
                    parts.push(`Natural gas: ${fmt(gas)} m\u00B3.`);
                if (diesel)
                    parts.push(`Diesel: ${fmt(diesel)} litres.`);
                parts.push('Fuel consumption is a key input for our Scope 1 emissions calculation. We are evaluating opportunities to reduce fossil fuel dependency through electrification and energy efficiency measures.');
                return parts.join(' ');
            }
            // Fallback when no fuel data has been entered — industry-conditioned framing
            const parts = [];
            if (isLightFuel) {
                parts.push('Our organization is primarily office-based and direct fuel consumption is limited.');
                parts.push('Where applicable, fuel use is restricted to occasional vehicle travel and any heating systems in our facilities, which in most cases use natural gas or electric heating provided by the building owner.');
                parts.push('We do not currently break down fuel consumption by type as it is not material to our overall emissions profile, and we will introduce more granular tracking if our operational footprint changes.');
            }
            else {
                parts.push('We currently track fuel consumption at an aggregate level for Scope 1 emissions reporting.');
                parts.push('Primary fuel sources used in our operations include natural gas (for heating and process applications where applicable) and diesel (for any owned or operated vehicles and equipment).');
                parts.push('A formal breakdown by fuel type with reportable quantities is planned for the next reporting period as part of our ongoing improvements to GHG inventory granularity.');
            }
            return parts.join(' ');
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
            const fleetStatus = str(dm, 'fleetComposition').toLowerCase();
            const ind = str(dm, 'industryDescription').toLowerCase();
            const isFleetLight = !ind || ind.includes('software') || ind.includes('technology') || ind.includes('professional') || ind.includes('services') || ind.includes('consult') || ind.includes('financial');
            const parts = [];
            if (fleetStatus === 'not_applicable') {
                parts.push('A corporate fleet is not applicable to our current business model.');
                parts.push('We do not operate owned or leased operational vehicles, so direct fleet fuel use is not a reportable metric for this entity.');
            }
            else if (isFleetLight && !diesel) {
                parts.push('Our organization does not operate a corporate fleet.');
                parts.push('Employee business travel uses public transport or personal vehicles, with mileage reimbursed at standard rates. Where occasional vehicle use is required, we rely on rental services or third-party providers.');
                parts.push('We have no direct fleet-related emissions, though we monitor business travel as part of our broader Scope 3 evaluation.');
            }
            else {
                parts.push('We operate a small operational fleet to support our business activities, composed of company-owned and leased vehicles.');
                if (diesel) {
                    parts.push(`Current fuel consumption: ${fmt(diesel)} litres of diesel during the reporting period.`);
                }
                else {
                    parts.push('A detailed breakdown of vehicle types and fuel sources is maintained internally and is being formalised for external reporting in the next cycle.');
                }
                parts.push('We are evaluating the transition to electric or hybrid vehicles where commercially viable, as part of our fleet renewal strategy and our commitment to reducing direct emissions.');
            }
            return parts.join(' ');
        },
    },
    // Transport / logistics environmental impact (catches questions that don't match fleet/business_travel)
    {
        domains: ['transport'],
        topics: ['transport', 'logistics'],
        generate: (dm) => {
            const fleetStatus = str(dm, 'fleetComposition').toLowerCase();
            const ind = str(dm, 'industryDescription').toLowerCase();
            const isLightLogistics = !ind || ind.includes('software') || ind.includes('technology') || ind.includes('professional') || ind.includes('services') || ind.includes('consult') || ind.includes('financial');
            const parts = [];
            if (fleetStatus === 'not_applicable') {
                parts.push('Transport and logistics are not applicable as a material operational activity for this business model.');
                parts.push('Physical goods movement is handled only on an exceptional basis through third-party providers where needed.');
            }
            else if (isLightLogistics) {
                parts.push('Transportation and logistics are not material to our environmental footprint, as our operations are primarily digital or service-based with limited physical goods movement.');
                parts.push('Where shipping is required, we use third-party carriers and consolidate shipments where practical to minimise emissions.');
                parts.push('Employee business travel is governed by a policy that prioritises video conferencing and lower-emission travel modes.');
            }
            else {
                parts.push('We manage the environmental impact of transportation and logistics through carrier selection, route optimisation, and shipment consolidation where feasible.');
                parts.push('Where we engage third-party logistics providers, we factor environmental performance into procurement decisions and prefer carriers with documented emissions reduction programmes.');
            }
            return parts.join(' ');
        },
    },
    // Business travel / commuting (Scope 3)
    {
        domains: ['transport'],
        topics: ['business_travel', 'scope_3'],
        generate: (dm) => {
            const travel = num(dm, 'businessTravel');
            const commute = num(dm, 'employeeCommute');
            const s3 = num(dm, 'scope3Total');
            const fte = num(dm, 'totalFte');
            const parts = [];
            if (s3)
                parts.push(`Our Scope 3 emissions total ${fmt(s3)} tCO2e.`);
            if (travel)
                parts.push(`Business travel: ${fmt(travel)} km.`);
            if (commute)
                parts.push(`Employee commuting: ${fmt(commute)} km.`);
            if (!s3 && !travel && !commute) {
                parts.push('Transport-related Scope 3 emissions have not been measured or reported.');
                if (fte)
                    parts.push(`Transport-related data including business travel and commuting is not systematically tracked across our ${fmt(fte)} employees.`);
            }
            return parts.join(' ');
        },
    },
    // Transport emissions disclosure with missing data
    {
        domains: ['transport'],
        topics: ['scope_3', 'business_travel'],
        questionTypes: ['KPI', 'MEASURE'],
        generate: (dm) => {
            const travel = num(dm, 'businessTravel');
            const commute = num(dm, 'employeeCommute');
            const s3 = num(dm, 'scope3Total');
            if (s3 || travel || commute)
                return null;
            const fte = num(dm, 'totalFte');
            const parts = [];
            parts.push('Transport-related Scope 3 emissions have not been measured or reported.');
            parts.push('Fleet composition, business travel volume, and employee commuting data are not currently tracked in a reportable format.');
            if (fte)
                parts.push(`This applies across our workforce of ${fmt(fte)} employees.`);
            return parts.join(' ');
        },
    },
    // Transport reduction measures with missing data
    {
        domains: ['transport'],
        topics: ['transport_reduction', 'transport'],
        questionTypes: ['MEASURE', 'POLICY'],
        generate: (dm) => {
            const trackedMeasures = str(dm, 'transportReductionMeasures');
            const fleetStatus = str(dm, 'fleetComposition').toLowerCase();
            if (trackedMeasures)
                return trackedMeasures;
            if (fleetStatus === 'not_applicable') {
                return { answer: 'Transport-emissions reduction measures are not applicable because the business does not operate a reportable corporate fleet or transport-heavy logistics footprint.', supportedNegative: true };
            }
            return { answer: 'Specific transport-emissions reduction measures have not been formally documented. Fleet electrification, route optimization, modal shift, and remote-work impacts are not currently tracked in a reportable format.', supportedNegative: true };
        },
    },
    // ===================================================================
    // MATERIALS & SUPPLY CHAIN
    // ===================================================================
    // Raw materials
    {
        domains: ['materials'],
        topics: ['raw_materials'],
        questionTypes: ['MEASURE', 'KPI'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const ind = str(dm, 'industryDescription');
            const parts = [];
            parts.push(`${name || 'Our organization'} uses a range of materials in ${ind ? `our ${ind.toLowerCase()} operations` : 'our operations'}.`);
            parts.push('We are in the process of quantifying our raw material consumption by type and tracking the percentage sourced from recycled or secondary sources.');
            parts.push('Our procurement approach prioritises suppliers who can provide materials with verified recycled content and environmental certifications.');
            return parts.join(' ');
        },
    },
    // Supplier code of conduct
    {
        domains: ['buyer_requirements', 'materials'],
        topics: ['supplier_code', 'ethics'],
        questionTypes: ['POLICY'],
        generate: (dm) => {
            const policies = str(dm, 'supplierPoliciesApproved');
            const status = str(dm, 'supplierCodeStatus');
            const name = str(dm, 'legalEntityName');
            const parts = [];
            if ((policies && policies.toLowerCase().includes('supplier')) || status === 'implemented') {
                parts.push(`Yes, ${name || 'our organization'} has a Supplier Code of Conduct${policies ? ` covering: ${policies}` : ''}.`);
                parts.push('The code applies to all direct suppliers and covers environmental standards, labor practices, health and safety, ethics, and anti-corruption.');
            }
            else if (status === 'in_progress') {
                parts.push(`${name || 'Our organization'} is developing a formal Supplier Code of Conduct.`);
                parts.push('In the meantime, supplier expectations are communicated through qualification processes, onboarding materials, and commercial terms where relevant.');
            }
            else if (status === 'not_applicable') {
                parts.push(`${name || 'Our organization'} has recorded a standalone Supplier Code of Conduct as not applicable to the current supplier model.`);
            }
            else {
                parts.push(`${name || 'Our organization'} is committed to responsible sourcing and maintaining high standards throughout our supply chain.`);
                parts.push('A formal Supplier Code of Conduct has not yet been established.');
            }
            parts.push('Supplier compliance is monitored through qualification processes, periodic reviews, and incoming quality inspections.');
            return parts.join(' ');
        },
    },
    // Supply chain ESG monitoring
    {
        domains: ['buyer_requirements'],
        topics: ['supply_chain_monitoring'],
        questionTypes: ['MEASURE'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const parts = [];
            parts.push(`${name || 'Our organization'} monitors ESG performance within our supply chain through supplier qualification processes, periodic assessments, and ongoing engagement.`);
            parts.push('Current measures include ESG criteria in supplier selection, periodic supplier visits, and preference for locally sourced materials where feasible.');
            parts.push('A structured supplier ESG assessment programme with documented scoring criteria has not yet been established.');
            return parts.join(' ');
        },
    },
    // Conflict minerals
    {
        domains: ['materials'],
        topics: ['conflict_minerals'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const policyStatus = str(dm, 'responsibleSourcingPolicyStatus').toLowerCase();
            const dueDiligenceStatus = str(dm, 'conflictMineralsStatus').toLowerCase();
            const cmrtStatus = str(dm, 'cmrtStatus').toLowerCase();
            const emrtStatus = str(dm, 'emrtStatus').toLowerCase();
            const parts = [];
            if (dueDiligenceStatus === 'not_applicable') {
                parts.push(`${name || 'Our organization'} has recorded conflict minerals due diligence as not applicable to the current business and material risk profile.`);
            }
            if (policyStatus === 'not_applicable') {
                parts.push(`${name || 'Our organization'} has recorded a standalone responsible sourcing policy as not applicable to the current business model.`);
            }
            if (policyStatus === 'implemented')
                parts.push(`${name || 'Our organization'} has a documented responsible sourcing policy.`);
            else if (policyStatus === 'in_progress')
                parts.push(`${name || 'Our organization'} is developing a documented responsible sourcing policy.`);
            if (dueDiligenceStatus === 'implemented')
                parts.push('Conflict minerals due diligence is documented in tracked data.');
            else if (dueDiligenceStatus === 'in_progress')
                parts.push('Conflict minerals due diligence is currently under development.');
            if (cmrtStatus && cmrtStatus !== 'not_applicable')
                parts.push(`CMRT status: ${cmrtStatus}.`);
            if (emrtStatus && emrtStatus !== 'not_applicable')
                parts.push(`EMRT status: ${emrtStatus}.`);
            if (parts.length > 0)
                return parts.join(' ');
            return {
                answer: `${name || 'Our organization'} has not recorded a responsible sourcing policy or conflict minerals due diligence status in tracked data.`,
                drafted: true,
            };
        },
    },
    // Packaging materials (Q20 — must address packaging types, recyclability, recycled content)
    {
        domains: ['packaging', 'waste'],
        topics: ['packaging'],
        generate: (dm) => {
            const ind = str(dm, 'industryDescription').toLowerCase();
            const waste = num(dm, 'totalWaste');
            const div = num(dm, 'diversionRate');
            const parts = [];
            if (ind.includes('manufactur') || ind.includes('automotive') || ind.includes('engineer') || ind.includes('industrial')) {
                parts.push('Our primary packaging materials include corrugated cardboard, wooden pallets, PE protective film, and reusable metal or plastic transport containers for selected customer shipments.');
                parts.push('The majority of our packaging by weight is recyclable. We use reusable transport packaging where customer logistics arrangements permit.');
                parts.push('We are working to increase the share of recycled-content cardboard and reduce single-use plastic packaging. A precise percentage breakdown is currently being consolidated.');
            }
            else {
                parts.push('Our packaging materials consist primarily of cardboard, paper, and plastic protective packaging.');
                parts.push('We are working to increase the recyclability and recycled content of our packaging materials.');
            }
            if (div > 0)
                parts.push(`Our overall waste diversion rate is ${fmt(div)}%, which includes packaging waste streams.`);
            return parts.join(' ');
        },
    },
    // Supplier ESG assessment percentage (Q55)
    {
        domains: ['buyer_requirements', 'materials'],
        topics: ['supplier_non_compliance', 'supply_chain_monitoring', 'supplier_code'],
        questionTypes: ['KPI'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            if (has(dm, 'suppliersAssessedPercent')) {
                const pct = num(dm, 'suppliersAssessedPercent');
                return `${fmt(pct)}% of our critical Tier 1 suppliers have been assessed on ESG criteria in the past 12 months.`;
            }
            return { answer: `${name || 'Our organization'} does not currently report a quantified ESG assessment rate for critical Tier 1 suppliers.`, drafted: true };
        },
    },
    // Supplier non-compliance handling (Q58)
    {
        domains: ['buyer_requirements'],
        topics: ['supplier_non_compliance', 'supply_chain_monitoring', 'supplier_code'],
        questionTypes: ['MEASURE', 'POLICY'],
        generate: (dm) => {
            const parts = [];
            parts.push('When ESG non-compliance is identified at a supplier, our approach follows an escalation process:');
            parts.push('First, we engage with the supplier to understand the root cause and agree on a corrective action plan with defined timelines.');
            parts.push('If the supplier fails to implement agreed corrective actions, we escalate to senior management review and consider suspending new orders until compliance is restored.');
            parts.push('In cases of severe or repeated non-compliance, we reserve the right to terminate the supplier relationship.');
            return parts.join(' ');
        },
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
            else if (publishes === 'Not applicable') {
                parts.push(`A standalone sustainability or ESG report is recorded as not applicable for ${name || 'our organization'} at the current stage of reporting.`);
            }
            else if (publishes === 'No') {
                parts.push(`No, ${name || 'our organization'} does not currently publish a standalone sustainability or ESG report.`);
            }
            else {
                return { answer: `${name || 'Our organization'} has not recorded whether it publishes a sustainability or ESG report.`, drafted: true };
            }
            return parts.join(' ');
        },
    },
    // ESG risk management
    {
        domains: ['swot', 'goals'],
        topics: ['risk_management', 'strategy'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const parts = [];
            parts.push(`${name || 'Our organization'} identifies and manages material ESG risks through a combination of regulatory monitoring, stakeholder engagement, and operational risk assessment.`);
            parts.push('Key risk areas reviewed include climate-related risks (physical and transitional), supply chain disruption, regulatory compliance (including CSRD), and workforce-related risks.');
            parts.push('ESG risks are integrated into our management review process and inform our sustainability strategy and target-setting.');
            return parts.join(' ');
        },
    },
    // Sustainability in procurement
    {
        domains: ['goals', 'materials', 'buyer_requirements'],
        topics: ['strategy', 'supplier_management'],
        generate: (dm) => {
            const name = str(dm, 'legalEntityName');
            const parts = [];
            parts.push(`${name || 'Our organization'} integrates sustainability considerations into procurement decisions through several mechanisms.`);
            parts.push('These include preference for suppliers with environmental certifications, evaluation of packaging and transport efficiency, and consideration of product lifecycle impacts.');
            return parts.join(' ');
        },
    },
];
//# sourceMappingURL=answerTemplates.js.map
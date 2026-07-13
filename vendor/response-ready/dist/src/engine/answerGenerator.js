// ============================================
// ResponseReady — Answer Generator (Domain-Agnostic)
// ============================================
// Orchestrates the 3-phase answer generation pipeline.
// All domain-specific templates, maturity logic, and industry
// context are injected from the DomainPack.
// ============================================
// Data Map Helpers (exported for pack use)
// ============================================
export function val(dataMap, field) {
    const p = dataMap.get(field);
    return p?.value ?? null;
}
export function has(dataMap, ...fields) {
    return fields.every(f => {
        const v = val(dataMap, f);
        return v !== null && v !== undefined && v !== '';
    });
}
export function num(dataMap, field) {
    const v = val(dataMap, field);
    return typeof v === 'number' ? v : 0;
}
export function str(dataMap, field) {
    const v = val(dataMap, field);
    return v !== null && v !== undefined ? String(v) : '';
}
export function fmt(n, lang) {
    return n.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 1 });
}
/**
 * Pick a string by language. `de` falls back to `en` when omitted.
 * Used by answer templates and the generator to keep data-extraction logic
 * single-sourced while localizing only the surface strings.
 */
export function L(lang, en, de) {
    return lang === 'de' && de ? de : en;
}
// Common country names EN→DE, for localizing country values echoed into German
// answer text. Unknown values pass through unchanged (user may already enter German).
const COUNTRY_DE = {
    germany: 'Deutschland', austria: 'Österreich', switzerland: 'Schweiz',
    france: 'Frankreich', italy: 'Italien', spain: 'Spanien',
    netherlands: 'Niederlande', belgium: 'Belgien', poland: 'Polen',
    'czech republic': 'Tschechien', czechia: 'Tschechien', sweden: 'Schweden',
    denmark: 'Dänemark', finland: 'Finnland', norway: 'Norwegen',
    portugal: 'Portugal', ireland: 'Irland', greece: 'Griechenland',
    romania: 'Rumänien', hungary: 'Ungarn', croatia: 'Kroatien',
    slovakia: 'Slowakei', slovenia: 'Slowenien', bulgaria: 'Bulgarien',
    lithuania: 'Litauen', latvia: 'Lettland', estonia: 'Estland',
    luxembourg: 'Luxemburg', 'united kingdom': 'Vereinigtes Königreich',
    'united states': 'Vereinigte Staaten', usa: 'USA',
};
/** Localize a country name for German output; passthrough for `en` or unknown values. */
export function deCountry(country, lang) {
    if (lang !== 'de' || !country)
        return country;
    return COUNTRY_DE[country.trim().toLowerCase()] || country;
}
/** Localize a comma-separated list of country names (e.g. "Germany, Poland"). */
export function deCountries(list, lang) {
    if (lang !== 'de' || !list)
        return list;
    return list.split(',').map((c) => deCountry(c.trim(), lang)).join(', ');
}
// Generator-level boilerplate strings (not template-specific). Keyed by language.
const GEN_STRINGS = {
    insufficient: {
        en: 'This data is not currently tracked. We do not have sufficient information to answer this disclosure.',
        de: 'Diese Daten werden derzeit nicht erfasst. Uns liegen nicht genügend Informationen vor, um diese Angabe zu beantworten.',
    },
    unknownInput: {
        en: 'Unknown — input required.',
        de: 'Unbekannt – Eingabe erforderlich.',
    },
    estimateAssumption: {
        en: 'Some values are estimates based on activity data and standard conversion factors.',
        de: 'Einige Werte sind Schätzungen auf Basis von Aktivitätsdaten und Standard-Umrechnungsfaktoren.',
    },
    dataGapsPrefix: {
        en: '\n\nData gaps: ',
        de: '\n\nDatenlücken: ',
    },
};
function gs(key, lang) {
    return lang === 'de' ? GEN_STRINGS[key].de : GEN_STRINGS[key].en;
}
export function buildDataMap(context) {
    const map = new Map();
    [...context.company, ...context.operational, ...context.calculated].forEach(point => {
        map.set(point.field, point);
    });
    return map;
}
// ============================================
// Defensive Rewriting (inline, single-answer)
// ============================================
function applyRewriteRules(text, rules) {
    let result = text;
    for (const rule of rules) {
        const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'gi') : rule.pattern;
        result = result.replace(pattern, rule.replacement);
    }
    // Clean up artifacts
    result = result.replace(/\s{2,}/g, ' ').trim();
    result = result.replace(/^\s*[,;]\s*/gm, '');
    result = result.replace(/\.\s*\./g, '.');
    // Capitalize first character
    if (result.length > 0 && result[0] !== result[0].toUpperCase()) {
        result = result[0].toUpperCase() + result.slice(1);
    }
    return result;
}
// ============================================
// Template Matching
// ============================================
function findMatchingTemplate(matchResult, templates, questionType) {
    if (!matchResult.primaryDomain)
        return null;
    const primaryTopics = matchResult.primaryTopics || matchResult.topics;
    const candidates = templates.filter(t => {
        const domainMatch = t.domains.includes(matchResult.primaryDomain) ||
            matchResult.secondaryDomains.some(d => t.domains.includes(d));
        if (!domainMatch)
            return false;
        // Must overlap with at least one topic (prefer primary topics)
        if (!t.topics.some(topic => matchResult.topics.includes(topic)))
            return false;
        // If template declares questionTypes, must match the classified type
        if (t.questionTypes && questionType && !t.questionTypes.includes(questionType))
            return false;
        return true;
    });
    return candidates.sort((a, b) => {
        // 1. Prefer templates matching the primary domain
        const aPrimary = a.domains.includes(matchResult.primaryDomain) ? 1 : 0;
        const bPrimary = b.domains.includes(matchResult.primaryDomain) ? 1 : 0;
        if (bPrimary !== aPrimary)
            return bPrimary - aPrimary;
        // 2. Prefer more specific topic match FIRST (before type match).
        // A template matching ['fatalities'] (100%) should beat ['incident_investigation',
        // 'health_safety_management'] (50%) regardless of questionType.
        const aPrimaryOverlap = a.topics.filter(t => primaryTopics.includes(t)).length;
        const bPrimaryOverlap = b.topics.filter(t => primaryTopics.includes(t)).length;
        const aSpecificity = a.topics.length > 0 ? aPrimaryOverlap / a.topics.length : 0;
        const bSpecificity = b.topics.length > 0 ? bPrimaryOverlap / b.topics.length : 0;
        if (Math.abs(bSpecificity - aSpecificity) > 0.01)
            return bSpecificity - aSpecificity;
        // 3. Then primary topic overlap count
        if (bPrimaryOverlap !== aPrimaryOverlap)
            return bPrimaryOverlap - aPrimaryOverlap;
        // 4. Then questionType match as tiebreaker
        const aTypeMatch = (a.questionTypes && questionType && a.questionTypes.includes(questionType)) ? 1 : 0;
        const bTypeMatch = (b.questionTypes && questionType && b.questionTypes.includes(questionType)) ? 1 : 0;
        if (bTypeMatch !== aTypeMatch)
            return bTypeMatch - aTypeMatch;
        // 5. Then total topic overlap
        const aOverlap = a.topics.filter(t => matchResult.topics.includes(t)).length;
        const bOverlap = b.topics.filter(t => matchResult.topics.includes(t)).length;
        if (bOverlap !== aOverlap)
            return bOverlap - aOverlap;
        // 6. Final tiebreaker: prefer the template whose topics the question scored
        // highest on (sum of matched keyword-rule weights). Resolves cases where two
        // same-domain templates are otherwise equal (e.g. a 'chemical_management'
        // question that also weakly hits 'certifications') without relying on array order.
        const scores = matchResult.topicScores || {};
        const topicScore = (t) => t.topics.reduce((sum, topic) => sum + (scores[topic] || 0), 0);
        return topicScore(b) - topicScore(a);
    })[0] || null;
}
// ============================================
// Confidence Determination
// ============================================
function determineConfidence(context, matchResult) {
    // Only count operational/calculated points from the primary domain as evidence.
    // Company profile points (name, industry, country) must NOT inflate confidence
    // for unrelated questions — that's how a DEI question gets "medium" confidence
    // from the fact that a company name exists.
    const primaryDomain = matchResult.primaryDomain;
    const domainPoints = [...context.operational, ...context.calculated].filter(p => p.domain === primaryDomain || matchResult.secondaryDomains.includes(p.domain));
    if (domainPoints.length === 0)
        return 'none';
    const hasHighConfidence = domainPoints.some(p => p.confidence === 'high');
    const hasMediumConfidence = domainPoints.some(p => p.confidence === 'medium');
    const hasDataGaps = context.metadata.dataGaps.length > 0;
    if (matchResult.confidence === 'high' && hasHighConfidence && !hasDataGaps)
        return 'high';
    if (matchResult.confidence !== 'none' && (hasHighConfidence || hasMediumConfidence))
        return 'medium';
    if (domainPoints.length > 0)
        return 'low';
    return 'none';
}
// ============================================
// Framework Notes
// ============================================
function getFrameworkNote(framework, frameworkNotes) {
    if (!framework || !frameworkNotes)
        return '';
    return frameworkNotes[framework] || '';
}
export function createAnswerGenerator(deps) {
    const { templates, frameworkNotes, fieldToMetricKey = {}, scrubRules = [], topicRequirements = {}, maturityResolver, matrixGenerator, informalPracticeHandler, industryContextProvider, } = deps;
    /**
     * Check which required fields are missing for the matched topics.
     * Returns gap descriptions for display.
     */
    function checkRequiredGaps(matchResult, dataMap, lang) {
        const gaps = [];
        const seen = new Set();
        const topics = matchResult.topics || [];
        for (const topic of topics) {
            const req = topicRequirements[topic];
            if (!req)
                continue;
            for (const field of req.requiredFields) {
                if (seen.has(field))
                    continue;
                seen.add(field);
                const point = dataMap.get(field);
                if (!point || point.value === null || point.value === undefined || point.value === '') {
                    const desc = (lang === 'de' && req.gapDescriptionsDe?.[field]) || req.gapDescriptions[field];
                    if (desc)
                        gaps.push(desc);
                }
            }
        }
        return gaps;
    }
    function generateSimpleAnswer(context, matchResult, framework, profile, questionType, lang) {
        const dataMap = buildDataMap(context);
        const allPoints = [...context.company, ...context.operational, ...context.calculated];
        // hasData for maturity/matrix purposes must check only operational/calculated
        // points in the primary domain. Company profile (name, industry, country) must
        // NOT count — otherwise every question gets hasData=true and the matrix
        // generates confident policy/measure answers from nothing.
        const primaryDomain = matchResult.primaryDomain;
        const hasData = [...context.operational, ...context.calculated].some(p => p.domain === primaryDomain && p.value !== null && p.value !== undefined && p.value !== '');
        // Phase 1: Try rich data templates FIRST (highest quality — data-driven answers)
        const template = findMatchingTemplate(matchResult, templates, questionType);
        if (template) {
            const result = template.generate(dataMap, framework, lang);
            if (result) {
                const isObj = typeof result === 'object' && result !== null;
                let answer = isObj ? result.answer : result;
                // A template is "drafted" if it explicitly says so, OR if the answer
                // was generated without any operational/calculated data points for the
                // primary domain (meaning the template used generic language, not real metrics).
                const explicitDrafted = isObj ? !!result.drafted : false;
                const hasDomainData = [...context.operational, ...context.calculated].some(p => p.domain === primaryDomain && p.value !== null && p.value !== undefined && p.value !== '');
                const drafted = explicitDrafted || !hasDomainData;
                answer += getFrameworkNote(framework, frameworkNotes);
                const primaryPoint = allPoints[0];
                return {
                    answer,
                    drafted,
                    dataValue: primaryPoint ? `${primaryPoint.value}${primaryPoint.unit ? ' ' + primaryPoint.unit : ''}` : undefined,
                    dataSource: primaryPoint?.source,
                };
            }
        }
        // Phase 2: Try matrix generator (QuestionType x Maturity) as fallback
        // Only use the matrix when there's actual data or informal practices to back it up.
        // Without data, the matrix generates plausible-sounding but fabricated answers — skip to Phase 5 (honest "no data") instead.
        if (profile && questionType && maturityResolver && matrixGenerator) {
            const maturityBand = maturityResolver.resolve(profile, matchResult, hasData);
            // Only use matrix when there's actual domain-relevant data or real informal practices.
            // hasData already scoped to primary domain operational/calculated points.
            const shouldUseMatrix = hasData || maturityBand === 'informal';
            if (shouldUseMatrix) {
                const matrixAnswer = matrixGenerator.generate(questionType, maturityBand, matchResult, dataMap, context, profile, framework, lang);
                if (matrixAnswer) {
                    const primaryPoint = allPoints[0];
                    // Matrix answers from 'none' or 'informal' bands are always drafted —
                    // they generate plausible language without data backing.
                    const matrixDrafted = maturityBand === 'none' || maturityBand === 'informal';
                    return {
                        answer: matrixAnswer,
                        drafted: matrixDrafted,
                        dataValue: primaryPoint ? `${primaryPoint.value}${primaryPoint.unit ? ' ' + primaryPoint.unit : ''}` : undefined,
                        dataSource: primaryPoint?.source,
                        usedPractice: matrixDrafted,
                    };
                }
            }
        }
        // Phase 3: Try informal practice handler
        if (profile && informalPracticeHandler) {
            const relevant = informalPracticeHandler.findRelevant(profile, matchResult);
            if (relevant.length > 0) {
                const answer = informalPracticeHandler.generateAnswer('', // company name — pack should resolve from profile
                relevant, matchResult, '', // industry — pack should resolve from profile
                framework, lang);
                return { answer, usedPractice: true };
            }
        }
        // Phase 4 (REMOVED): Previously dumped raw data points from the matched domain
        // into a sentence. This was the primary source of wrong-domain answers (e.g.,
        // showing company FTE when asked about grievance mechanisms). Removed in Phase 3
        // refactor — if no template or matrix matches, we go straight to honest
        // insufficiency rather than stitching unrelated data into an answer.
        // Phase 5: Honest insufficiency — no data or no matching template
        return {
            answer: gs('insufficient', lang),
            drafted: true,
            insufficientData: true,
        };
    }
    function generateAnswerDraft(question, matchResult, dataContext, config, profile, classification) {
        const framework = question.framework;
        const questionType = classification?.questionType;
        const lang = config.language ?? 'en';
        const { answer, dataValue, dataSource, usedPractice, drafted, insufficientData } = generateSimpleAnswer(dataContext, matchResult, framework, profile, questionType, lang);
        // Force 'none' confidence when the answer is an honest insufficiency fallback
        const answerConfidence = insufficientData ? 'none'
            : drafted ? 'medium'
                : determineConfidence(dataContext, matchResult);
        const limitations = [...dataContext.metadata.dataGaps];
        const assumptions = [];
        const hasEstimates = dataContext.calculated.some(p => p.label.toLowerCase().includes('estimate') ||
            p.label.toLowerCase().includes('auto-calculated') ||
            p.confidence === 'low' ||
            p.confidence === 'medium');
        if (hasEstimates) {
            assumptions.push(gs('estimateAssumption', lang));
        }
        let confidenceSource;
        if (insufficientData) {
            confidenceSource = 'unknown';
        }
        else if (drafted) {
            confidenceSource = 'drafted';
        }
        else if (answerConfidence === 'none') {
            confidenceSource = 'unknown';
        }
        else if (hasEstimates || answerConfidence === 'low') {
            confidenceSource = 'estimated';
        }
        else {
            confidenceSource = 'provided';
        }
        // Collect metric keys used
        const allPoints = [...dataContext.company, ...dataContext.operational, ...dataContext.calculated];
        const metricKeysUsed = [...new Set(allPoints.map(p => fieldToMetricKey[p.field]).filter((k) => !!k))];
        // Merge CSV metric keys
        if (matchResult.csvMetricKeys) {
            for (const k of matchResult.csvMetricKeys) {
                if (!metricKeysUsed.includes(k))
                    metricKeysUsed.push(k);
            }
        }
        // Upgrade confidence if informal practice filled the gap
        if (usedPractice && confidenceSource === 'unknown') {
            confidenceSource = 'estimated';
        }
        // Post-generation: check topic requirements for missing required fields
        const dataMap = buildDataMap(dataContext);
        const requiredGaps = checkRequiredGaps(matchResult, dataMap, lang);
        // Merge requirement gaps into limitations
        for (const gap of requiredGaps) {
            if (!limitations.includes(gap))
                limitations.push(gap);
        }
        // If required fields are missing, cap confidence — answer is incomplete
        let finalConfidence = answerConfidence;
        let finalConfidenceSource = confidenceSource;
        if (requiredGaps.length > 0 && confidenceSource === 'provided') {
            finalConfidence = 'medium';
            finalConfidenceSource = 'estimated';
        }
        // Apply defensive rewriting or mark as unknown
        let finalAnswer = answer;
        const promptForMissing = matchResult.csvPromptIfMissing || undefined;
        if (finalConfidenceSource === 'unknown' && !usedPractice && !insufficientData) {
            const promptSuffix = promptForMissing ? ` ${promptForMissing}` : '';
            finalAnswer = `${gs('unknownInput', lang)}${promptSuffix}`;
        }
        else if (scrubRules.length > 0) {
            finalAnswer = applyRewriteRules(finalAnswer, scrubRules);
        }
        // Append explicit gap declarations to drafted or incomplete answers
        if ((drafted || requiredGaps.length > 0) && !finalAnswer.toLowerCase().includes('unknown')) {
            const gapText = requiredGaps.length > 0
                ? gs('dataGapsPrefix', lang) + requiredGaps.join('; ') + '.'
                : '';
            if (gapText)
                finalAnswer += gapText;
        }
        return {
            questionId: question.id,
            questionText: question.text,
            category: question.category,
            questionType,
            matchResult,
            dataContext,
            answer: finalAnswer,
            dataValue,
            dataPeriod: dataContext.metadata.reportingPeriod,
            dataSource,
            answerConfidence: finalConfidence,
            confidenceSource: finalConfidenceSource,
            methodology: undefined,
            assumptions: assumptions.length > 0 ? assumptions : undefined,
            limitations: limitations.length > 0 ? limitations : undefined,
            evidence: '',
            metricKeysUsed,
            promptForMissing,
            needsReview: finalConfidence !== 'high' || !!drafted,
            isEstimate: hasEstimates,
            isDrafted: !!drafted,
            hasDataGaps: limitations.length > 0,
        };
    }
    function generateAnswerDrafts(questions, matchResults, dataContexts, config, profile, classifications) {
        return questions.map((q, i) => generateAnswerDraft(q, matchResults[i], dataContexts[i], config, profile, classifications?.[i]));
    }
    return { generateAnswerDraft, generateAnswerDrafts };
}
//# sourceMappingURL=answerGenerator.js.map
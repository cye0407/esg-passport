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
export function fmt(n) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
}
export function buildDataMap(context) {
    const map = new Map();
    [...context.company, ...context.operational, ...context.calculated].forEach(point => {
        map.set(point.field, point);
    });
    return map;
}
function isCompanyEvidenceDomain(domain) {
    return !!domain && ['company', 'products', 'site', 'financial_context', 'external_context'].includes(domain);
}
function getRelevantEvidencePoints(context, matchResult) {
    const primaryDomain = matchResult.primaryDomain;
    const secondaryDomains = matchResult.secondaryDomains || [];
    const domainMatch = (p) => p.domain === primaryDomain || secondaryDomains.includes(p.domain);
    const operationalPoints = [...context.operational, ...context.calculated].filter(domainMatch);
    if (isCompanyEvidenceDomain(primaryDomain)) {
        return [...context.company.filter(domainMatch), ...operationalPoints];
    }
    return operationalPoints;
}
function hasStructuredSupport(points, questionType) {
    if (questionType === 'KPI')
        return points.length > 0;
    return points.some((p) => {
        const text = `${p.field} ${p.label}`.toLowerCase();
        return (typeof p.value === 'string' ||
            /policy|cert|assurance|framework|goal|target|status|mechanism|code|governance|report|evidence|document|practice|address|product|market|customer|ownership/.test(text));
    });
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
function applyQuestionVariation(answer, question, matchResult) {
    const text = question.text.toLowerCase();
    if (matchResult.primaryDomain === 'emissions' && /\bmethodology\b/.test(text) && /\bscope 1\b/.test(text)) {
        return 'Scope 1 emissions are calculated from tracked fuel consumption and standard emission factors for stationary combustion and mobile fuel use. Where direct meter-based emissions data is not available, the figure is estimated from activity data using standard conversion factors.';
    }
    if (matchResult.primaryDomain === 'emissions' && /\bmethodology\b/.test(text) && /\bscope 2\b/.test(text)) {
        return 'Scope 2 emissions are calculated from purchased electricity consumption and applicable grid emission factors. Location-based figures use country-level grid factors. A separate market-based Scope 2 figure is only reported when supplier-specific renewable procurement data is available.';
    }
    if (matchResult.primaryDomain === 'emissions' && /\bmarket-based\b/.test(text) && /\bscope 2\b/.test(text)) {
        if (/not been recorded/i.test(answer)) {
            return 'A separate market-based Scope 2 emissions figure has not been recorded in tracked data. Current reported Scope 2 emissions are location-based only.';
        }
    }
    if (matchResult.primaryDomain === 'energy_electricity' && /\bhow much electricity\b/.test(text)) {
        return answer.replace(/^Our total electricity consumption was/i, 'During the reporting period, our electricity use totaled');
    }
    if (matchResult.primaryDomain === 'emissions' && /\bdirect ghg emissions\b/.test(text)) {
        return answer.replace(/^Our Scope 1 \(direct\) greenhouse gas emissions/i, 'Direct Scope 1 greenhouse gas emissions');
    }
    return answer;
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
        // 4. Prefer the narrower template when overlap is equal.
        if (a.topics.length !== b.topics.length)
            return a.topics.length - b.topics.length;
        // 5. Then questionType match as tiebreaker
        const aTypeMatch = (a.questionTypes && questionType && a.questionTypes.includes(questionType)) ? 1 : 0;
        const bTypeMatch = (b.questionTypes && questionType && b.questionTypes.includes(questionType)) ? 1 : 0;
        if (bTypeMatch !== aTypeMatch)
            return bTypeMatch - aTypeMatch;
        // 6. Then total topic overlap
        const aOverlap = a.topics.filter(t => matchResult.topics.includes(t)).length;
        const bOverlap = b.topics.filter(t => matchResult.topics.includes(t)).length;
        return bOverlap - aOverlap;
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
    const domainPoints = getRelevantEvidencePoints(context, matchResult);
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
    function checkRequiredGaps(matchResult, dataMap) {
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
                    const desc = req.gapDescriptions[field];
                    if (desc)
                        gaps.push(desc);
                }
            }
        }
        return gaps;
    }
    function generateSimpleAnswer(context, matchResult, framework, profile, questionType) {
        const dataMap = buildDataMap(context);
        const allPoints = [...context.company, ...context.operational, ...context.calculated];
        // hasData for maturity/matrix purposes must check only operational/calculated
        // points in the primary domain. Company profile (name, industry, country) must
        // NOT count — otherwise every question gets hasData=true and the matrix
        // generates confident policy/measure answers from nothing.
        const relevantPoints = getRelevantEvidencePoints(context, matchResult)
            .filter(p => p.value !== null && p.value !== undefined && p.value !== '');
        const hasData = relevantPoints.length > 0;
        // Phase 1: Try rich data templates FIRST (highest quality — data-driven answers)
        const template = findMatchingTemplate(matchResult, templates, questionType);
        if (template) {
            const result = template.generate(dataMap, framework);
            if (result) {
                const isObj = typeof result === 'object' && result !== null;
                let answer = isObj ? result.answer : result;
                // A template is "drafted" if it explicitly says so, OR if the answer
                // was generated without any operational/calculated data points for the
                // primary domain (meaning the template used generic language, not real metrics).
                const explicitDrafted = isObj ? !!result.drafted : false;
                const hasDomainData = relevantPoints.length > 0;
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
            const shouldUseMatrix = questionType === 'KPI'
                ? (hasData || maturityBand === 'informal')
                : (maturityBand === 'informal' || (hasData && hasStructuredSupport(relevantPoints, questionType)));
            if (shouldUseMatrix) {
                const matrixAnswer = matrixGenerator.generate(questionType, maturityBand, matchResult, dataMap, context, profile, framework);
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
                framework);
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
            answer: 'This data is not currently tracked. We do not have sufficient information to answer this disclosure.',
            drafted: true,
            insufficientData: true,
        };
    }
    function generateAnswerDraft(question, matchResult, dataContext, _config, profile, classification) {
        const framework = question.framework;
        const questionType = classification?.questionType;
        const { answer, dataValue, dataSource, usedPractice, drafted, insufficientData } = generateSimpleAnswer(dataContext, matchResult, framework, profile, questionType);
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
            assumptions.push('Some values are estimates based on activity data and standard conversion factors.');
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
        const requiredGaps = checkRequiredGaps(matchResult, dataMap);
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
            finalAnswer = `Unknown — input required.${promptSuffix}`;
        }
        else if (scrubRules.length > 0) {
            finalAnswer = applyRewriteRules(finalAnswer, scrubRules);
        }
        // Append explicit gap declarations to drafted or incomplete answers
        if ((drafted || requiredGaps.length > 0) && !finalAnswer.toLowerCase().includes('unknown')) {
            const gapText = requiredGaps.length > 0
                ? '\n\nData gaps: ' + requiredGaps.join('; ') + '.'
                : '';
            if (gapText)
                finalAnswer += gapText;
        }
        finalAnswer = applyQuestionVariation(finalAnswer, question, matchResult);
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
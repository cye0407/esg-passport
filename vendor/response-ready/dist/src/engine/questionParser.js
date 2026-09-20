// ============================================
// ResponseReady — Question Parser (Domain-Agnostic)
// ============================================
// Parses questionnaire files (Excel, CSV, PDF, DOCX) into ParsedQuestion[].
// No domain-specific logic — works for any questionnaire type.
import * as XLSX from 'xlsx';
import { v4 as uuid } from 'uuid';
import { MAX_PDF_PAGES, MAX_QUESTIONS, MAX_ROWS_PER_SHEET, MAX_SHEETS, MAX_TOTAL_ROWS, capText, checkFileSize, checkSignature, readSignature, } from './parseLimits';
// ============================================
// Column Detection
// ============================================
const COLUMN_PATTERNS = {
    questionText: [
        'question', 'questions', 'query', 'text', 'description',
        'indicator', 'metric', 'requirement', 'disclosure',
        'question text', 'question_text', 'questiontext',
        'ask', 'item', 'criteria', 'criterion',
        // German buyer workbooks. Without these the mapping fell through to the
        // longest-text-column fallback, which found "Frage" by luck rather than by name.
        'frage', 'fragen', 'fragestellung', 'anforderung', 'anforderungen',
        'kriterium', 'kriterien', 'beschreibung', 'angabe', 'abfrage', 'pruefpunkt', 'prüfpunkt'
    ],
    category: [
        'category', 'topic', 'theme', 'section', 'pillar',
        'area', 'domain', 'group', 'type', 'classification'
    ],
    subcategory: [
        'subcategory', 'sub-category', 'sub_category', 'subtopic',
        'sub-topic', 'sub_topic', 'subsection', 'sub-section'
    ],
    referenceId: [
        'id', 'ref', 'reference', 'code', 'number', 'ref_id',
        'question_id', 'indicator_id', 'disclosure_id',
        'gri', 'esrs', 'sasb', 'cdp'
    ],
    required: [
        'required', 'mandatory', 'optional', 'must', 'shall'
    ]
};
const FRAMEWORK_PATTERNS = {
    // --- ESG / Sustainability Reporting ---
    CSRD: [/csrd/i, /esrs/i, /e1\./i, /s1\./i, /g1\./i],
    GRI: [/gri\s?\d{3}/i, /gri-/i],
    CDP: [/cdp/i, /c\d+\.\d+/i],
    EcoVadis: [/ecovadis/i, /ev-/i],
    SASB: [/sasb/i],
    TCFD: [/tcfd/i],
    UN_SDG: [/sdg/i, /un sdg/i],
    // --- Certifications / Ecolabels ---
    'GLOBALG.A.P.': [/globalg\.?a\.?p/i, /\bggn\b/i, /\bifa\b.*(?:checklist|control|audit|standard)/i, /\bgrasp\b/i, /control\s*point.*(?:cb|af|fv|cc)\b/i, /plant\s*protection\s*product/i, /\bpre-?harvest\s*interval\b/i, /\bmrl\b.*(?:test|result|limit|compliance)/i],
    'B_CORP': [/\bb[\s-]?corp\b/i, /\bb[\s-]?impact/i, /\bbia\b.*(?:score|assessment|question)/i, /\bb[\s-]?lab\b/i],
    'ISO_14001': [/iso\s*14001/i, /\bems\b.*(?:audit|management|review)/i, /clause\s*[4-9]\.\d/i, /environmental\s*management\s*system/i],
    'ORGANIC_EU': [/\borganic\b.*(?:certif|regulation|audit|inspection|standard)/i, /\beu\s*organic\b/i, /regulation.*2018\/848/i, /\busda\s*organic\b/i],
    'RAINFOREST_ALLIANCE': [/rainforest\s*alliance/i, /\butz\b/i, /\bra[\s-]cert/i],
    'FAIRTRADE': [/\bfairtrade\b/i, /\bfair\s*trade\b.*(?:certif|standard|audit|premium)/i, /\bflo\b.*(?:standard|certif)/i],
};
/**
 * Which row holds the column headers.
 *
 * The parser used to assume row one, and buyer workbooks routinely open with a title and
 * an instruction before the table starts:
 *
 *   Supplier Sustainability Questionnaire 2026
 *   Complete all mandatory fields
 *   (blank)
 *   ID | Question | Response
 *
 * With row one as the header, the "columns" are the title and two empty cells, the
 * mapping falls through to its last resort (the first column), and every question row is
 * read as empty. Measured on exactly that shape: 0 questions out of 3.
 *
 * So look for the first row within `limit` whose cells actually name questionnaire
 * columns — at least two non-empty cells, one of which matches a known question header.
 * Nothing found means the old behaviour: row one, unchanged.
 */
function findHeaderRow(rows, limit = 30) {
    const scanned = Math.min(rows.length, limit);
    // The first row that names a question column is not always the header: corporate
    // assessment workbooks put a stats row above the table — "Questions | 48 | Responses | 0 |
    // Complete | 0" — which names one and is nothing but labels and counters. Among the rows
    // that name a question column, take the one that looks most like a header: the most short
    // text cells, counters and sentences counting against it. Ties keep the earlier row.
    let best = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < scanned; i++) {
        const cells = (rows[i] || []).map(c => String(c ?? '').trim());
        const filled = cells.filter(Boolean);
        if (filled.length < 2)
            continue;
        const lower = filled.map(c => c.toLowerCase());
        const namesQuestionColumn = lower.some(cell => COLUMN_PATTERNS.questionText.some(p => cell === p || cell.includes(p)));
        if (!namesQuestionColumn)
            continue;
        const labels = filled.filter(c => !/^[\d.,\s%-]+$/.test(c) && c.length <= 40).length;
        const counters = filled.filter(c => /^[\d.,\s%-]+$/.test(c)).length;
        const sentences = filled.filter(c => c.length > 40).length;
        const score = labels - counters - sentences;
        if (score > bestScore) {
            bestScore = score;
            best = i;
        }
    }
    return best >= 0 ? best : 0;
}
function detectColumnMapping(headers, sampleRows) {
    const mapping = { questionText: '' };
    const normalizedHeaders = headers.map(h => h?.toLowerCase().trim() || '');
    // A header that IS the pattern beats one that merely contains it, and a column already
    // claimed by another field is not offered again. Corporate assessment workbooks head their
    // columns "Question ID | Theme | Criterion | Question | … | Unit": first-substring-match in
    // column order took "Question ID" as the question column, so the id column was the question,
    // the real "Question" column went unread, and the drafts were written for the Unit cells
    // ("Policy status", "tCO2e and method") — three of three real buyer forms parsed that way.
    // Pattern order is priority: "Question" beats "Criterion" even when Criterion is the earlier
    // column, because 'question' is listed first.
    const taken = new Set();
    const firstFree = (test, patterns) => {
        for (const p of patterns) {
            const i = normalizedHeaders.findIndex((h, idx) => !taken.has(idx) && test(h, p));
            if (i >= 0)
                return i;
        }
        return -1;
    };
    for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
        let found = firstFree((h, p) => h === p, patterns);
        if (found < 0)
            found = firstFree((h, p) => h.includes(p), patterns);
        if (found < 0)
            continue;
        taken.add(found);
        mapping[field] = headers[found];
        if (field === 'questionText')
            mapping.questionTextFromHeader = true;
    }
    // The fallback below and the last-resort first column are GUESSES; only a header match
    // above earns the benefit of the doubt for its cells. Recorded rather than inferred,
    // because "did a human label this column?" is the whole basis for lowering the bar.
    if (!mapping.questionText)
        mapping.questionTextFromHeader = false;
    if (!mapping.questionText && headers.length > 0 && sampleRows && sampleRows.length > 0) {
        let bestCol = '';
        let bestScore = 0;
        for (const header of headers) {
            const values = sampleRows.map(r => String(r[header] || '')).filter(v => v.length > 0);
            if (values.length === 0)
                continue;
            const avgLen = values.reduce((sum, v) => sum + v.length, 0) / values.length;
            const questionMarkRate = values.filter(v => v.includes('?')).length / values.length;
            const actionWordRate = values.filter(v => INTERROGATIVE_START.test(v) || IMPERATIVE_START.test(v)).length / values.length;
            const lengthFactor = avgLen > 300 ? avgLen * 0.1 : avgLen * 0.3;
            const score = lengthFactor + (questionMarkRate * 300) + (actionWordRate * 200);
            if (score > bestScore) {
                bestScore = score;
                bestCol = header;
            }
        }
        if (bestCol && bestScore > 40) {
            mapping.questionText = bestCol;
        }
    }
    if (!mapping.questionText && headers.length > 0) {
        mapping.questionText = headers[0];
    }
    return mapping;
}
/**
 * Identity for de-duplication.
 *
 * Keying on text alone collapsed rows that a buyer deliberately repeated: three
 * site-specific rows with refs E1.1 / E1.2 / E1.3 and identical wording became one
 * question, so the supplier answered once and the returned form was missing two required
 * answers. That is the only failure in this parser that is silently WRONG rather than
 * visibly thin, which is what makes it the worst one.
 *
 * A reference id, a sheet or a category is what distinguishes a repeat that matters from
 * an echo that does not. Where a document offers none of them, text is still the key —
 * a sentence repeated in prose with nothing to tell the copies apart is an echo (a
 * contents entry, a running header), and merging those is the behaviour we want.
 */
function questionIdentity(q) {
    const text = q.text.toLowerCase().trim().replace(/\s+/g, ' ');
    const marks = [q.referenceId, q.category, q.subcategory]
        .map(v => (v || '').toLowerCase().trim())
        .filter(Boolean);
    return marks.length > 0 ? `${marks.join('|')}::${text}` : text;
}
function detectFramework(questions) {
    const allText = questions.map(q => `${q.text} ${q.category || ''} ${q.referenceId || ''}`).join(' ');
    for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
        if (patterns.some(p => p.test(allText)))
            return framework;
    }
    return undefined;
}
function parseRequired(value) {
    if (value === undefined || value === null || value === '')
        return undefined;
    const s = String(value).toLowerCase().trim();
    if (['yes', 'y', 'true', '1', 'required', 'mandatory'].includes(s))
        return true;
    if (['no', 'n', 'false', '0', 'optional'].includes(s))
        return false;
    return undefined;
}
// ============================================
// Question Detection Heuristics
// ============================================
const STRUCTURED_NUMBERING = /^\(\d+(?:\.\d+)+\)\s+/;
// A contents line: dot leader, then usually a page number. "(1.1) In which language …..... 8"
const TOC_LINE = /\.{4,}\s*\d*\s*$/;
// The head of a contents entry — "(2.1)" or "C3." — used to tell a fresh entry from the
// continuation of a wrapped one.
const TOC_ENTRY_START = /^(?:\(\d+(?:\.\d+)*\)|[A-Z]\d+\.)\s/;
const SKIP_PATTERNS = [
    /^(copyright|confidential|disclaimer|version\s*[\d\.]|page\s*\d|©)/i,
    /^\d+$/,
    /^[\d\.\-\/\s,\(\)%]+$/,
    /^(yes|no|true|false|x|n\/a)$/i,
    /^(guidance|note[s:\s]|instructions?[\s:]|tip[\s:]|example[\s:]|please note|see also|refer to|for more|this question|you should|if you|the purpose|this section|in this|further guidance|additional info)/i,
    /^(select from|select one|select all that|choose one|choose from|click|enter a|type your|dropdown|response option|please select|upload your|attach your|free text|open.?ended)/i,
    // Anchored to the whole cell, not used as a prefix. These are spreadsheet labels — a
    // "Total" row, an "N/A" cell — and matching them as prefixes threw away any line that
    // merely began with one of the words. That is how a CDP question lost its tail: the
    // wrapped continuation "total base year emissions covered by each target, and describe
    // the methodology used to set them." was read as a totals row and dropped, leaving the
    // question truncated at "…the percentage of".
    /^(total|subtotal|n\/a|none|not applicable|other \(specify\)|grand total|all of the above|not yet|no change|same as|see above)\s*[:\-]?\s*[\d.,%€$£\s]*$/i,
    /^(column|row|field|header|label|unit|format|data type|response type|answer type|scoring|weight|points)/i,
    /^[☐☑✓✗✘●○■□▪▫►▶]\s/,
];
const INTERROGATIVE_START = /^(what|how|does|do|is|are|has|have|which|who|where|when|why|can|will|would|should|could|may|might|shall)\b/i;
const IMPERATIVE_START = /^(describe|explain|provide|list|report|disclose|specify|identify|outline|quantify|assess|evaluate|discuss|summarize|summarise|state|indicate|confirm|detail)\b/i;
// A leading "Please " (optionally with a comma/colon) is a politeness prefix, not part of the
// verb: "Please state your total headcount" is as much a questionnaire item as "State your
// total headcount". Stripped before the verb tests so "Please state/provide/indicate/…" prompts
// aren't dropped as non-questions.
const PLEASE_PREFIX = /^please[,:]?\s+/i;
// German questionnaires reached the parser only through ENDS_WITH_QUESTION: "Wie hoch war
// Ihr Stromverbrauch?" parsed, "Beschreiben Sie Ihre Umweltmanagementsysteme." did not,
// and neither did "Bitte geben Sie Ihren Gesamtstromverbrauch an." Measured before this:
// 4 of 8 German shapes recovered, and 2 of 4 rows in a German "Frage" column.
//
// The Sie-imperative is matched by SHAPE rather than by a verb list — a verb in -en
// followed by "Sie" is the German polite imperative, and the literal " Sie" is what keeps
// this from firing on English prose.
const GERMAN_BITTE_PREFIX = /^bitte[,:]?\s+/i;
const GERMAN_SIE_IMPERATIVE = /^[\p{L}]+en\s+Sie/u;
const GERMAN_INTERROGATIVE_START = /^(wie|was|welche[rsnm]?|wann|wo|warum|weshalb|wer|wessen|wieviel|haben|hat|habt|ist|sind|gibt|verf[üu]g(?:en|t)|besteht|bestehen|k[öo]nnen|kann|werden|wird|wurde|wurden|liegt|liegen|existiert|existieren|f[üu]hr(?:en|t)|nutz(?:en|t)|setz(?:en|t)|erfolgt|betr[äa]gt|besitzen|besitzt|planen|plant)/i;
const REFERENCE_ID = /^(C\d+[\.\-]\d|E\d[\.\-]|S\d[\.\-]|G\d[\.\-]|GRI\s*\d{3}|ESRS\s*[ESGO]\d|SASB|Q\d{1,3}[\.\-])/i;
const ENDS_WITH_QUESTION = /\?\s*[)"\u201D]?\s*$/;
// A source citation, not an instruction: "Report 2024, p. 44\u2026", "See 2023 Annual Report".
// The imperative verb is immediately followed by a year, with no object ("Report your 2024
// emissions" keeps its object and is a real question).
const CITATION_START = /^(report|see|source)\s+(?:19|20)\d{2}\b/i;
function wordCount(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}
/**
 * A questionnaire item is followed by the evidence it wants, and that guidance is prose in
 * the same text flow: "Document guidelines Your document should include evidence that…".
 * Absorbed into the question it makes the text unmatchable and unreadable; standing alone
 * it becomes a question that was never asked.
 */
const GUIDANCE_MARKER = /\b(?:document guidelines|documents guidelines|the document\(s\)? should|the documents? should|your document\(s\)? should|your documents? should)\b/i;
/**
 * "List of agreements made to improve workers' conditions", "Report, CSR/Sustainability
 * Report or any other implementation evidence." — these name the EVIDENCE, and they were
 * read as questions because "list" and "report" are also imperative verbs. The giveaway is
 * what follows the word: "List of…" and "Report," are noun phrases, while "List the sites"
 * and "Report on the following KPIs" are instructions.
 */
const EVIDENCE_NOUN_PHRASE = /^(?:list|report|copy|copies|record|records|certificate|certificates|policy|policies|document|documents|evidence)\s*(?:,|of\b)/i;
/**
 * Cut a question free of the evidence guidance printed after it.
 *
 * Two cuts, in order. At an explicit guidance marker, always. Then at the question mark,
 * but only when what trails it is long enough to be a guidance block rather than a short
 * qualifier — "Do you X? If yes, describe Y." keeps its second half, which is part of what
 * is being asked; four sentences about acceptable file formats and publication dates is
 * not.
 */
const TRAILING_GUIDANCE_MIN = 120;
export function trimGuidance(text) {
    let out = text;
    const marker = out.search(GUIDANCE_MARKER);
    if (marker > 0)
        out = out.slice(0, marker).trim();
    const lastMark = out.lastIndexOf('?');
    if (lastMark > 0 && out.length - lastMark - 1 >= TRAILING_GUIDANCE_MIN) {
        out = out.slice(0, lastMark + 1).trim();
    }
    return out.replace(/\s+/g, ' ').trim();
}
function looksLikeQuestion(raw) {
    // Judge the QUESTION, not the question plus four sentences about acceptable file
    // formats. Trimming first matters for the length cap below: a real item that carries
    // its evidence guidance on the same line runs past 300 characters and was dropped
    // whole, question and all.
    const text = trimGuidance(raw);
    // 300 dropped real questions: a CDP or EcoVadis prompt that asks for governance,
    // process, remediation and monitoring in one item runs past 380 characters even after
    // its guidance is trimmed, and it was rejected question and all. A questionnaire item
    // long enough to fail 700 is a guidance paragraph, and SKIP_PATTERNS is what catches
    // those - not an arbitrary width.
    if (text.length > 700)
        return false;
    if (/^[a-z]/.test(text))
        return false;
    if (CITATION_START.test(text))
        return false;
    if (SKIP_PATTERNS.some(p => p.test(text)))
        return false;
    // Evidence the questionnaire asks you to attach, not something it asks you.
    if (EVIDENCE_NOUN_PHRASE.test(text))
        return false;
    // A single-word line ending in "?" ("impacts?", "targets?", "year?") is a wrapped-question
    // tail, not a standalone question \u2014 unless it opens with an interrogative ("Why?"). Two-word
    // checklist questions ("ISO 14001?", "Scope 1?") are real, so only single words are dropped.
    if (ENDS_WITH_QUESTION.test(text)) {
        if (wordCount(text) < 2 && !INTERROGATIVE_START.test(text))
            return false;
        return true;
    }
    if (text.length < 10)
        return false;
    // SKIP_PATTERNS above already caught instruction prefixes like "please select"; a remaining
    // "Please …" is a politely-phrased question, so test the verb without the prefix.
    const probe = text.replace(PLEASE_PREFIX, '').replace(GERMAN_BITTE_PREFIX, '');
    if (INTERROGATIVE_START.test(probe))
        return true;
    if (IMPERATIVE_START.test(probe))
        return true;
    if (GERMAN_INTERROGATIVE_START.test(probe))
        return true;
    if (GERMAN_SIE_IMPERATIVE.test(probe))
        return true;
    if (REFERENCE_ID.test(text))
        return true;
    return false;
}
function countChar(text, char) {
    return text.split(char).length - 1;
}
// A question head that wraps ends on a connector ("…and/or", "…vulnerable to the", "…reporting
// year,"), never on terminal punctuation. That is the signal used to pull its tail back on.
const CONTINUATION_MARKER = /(?:\b(?:and|or|the|a|an|of|to|for|in|on|at|by|with|from|your|our|its|their|any|all|each|other|that|which|as)|,|\/|-|–)\s*$/i;
/** A line that is only an answer option — the line after a question, never part of it. */
const ANSWER_TOKEN = /^(?:yes|no|n\/?a|not applicable|true|false|ja|nein|oui|non)[.\s]*$/i;
/**
 * A head ending mid-sentence on an ordinary word: lowercase ("…in place to manage") or
 * title-case, which is where a wrap lands on a proper noun ("…the International Material",
 * "…CSR/Sustainability Requirements"). ALL-CAPS is excluded so a section heading
 * ("C. BUSINESS ETHICS") is never read as an unfinished question.
 */
const WRAPS_ON_WORD = /\b(?:[a-zà-ÿ]{2,}|[A-ZÀ-Þ][a-zà-ÿ]{2,})\s*$/;
/** A wrap landing on an acronym: "…a social audit or ESG", "…reported under the GRI". */
const WRAPS_ON_ACRONYM = /\b[A-ZÀ-Þ]{2,6}\s*$/;
/** No lowercase anywhere — a section heading ("C. BUSINESS ETHICS"), not a wrapped question. */
const ALL_CAPS_LINE = /^[^a-zà-ÿ]*$/;
/** "9. Requested evidence checklist" — a numbered heading, which opens a section, never a tail. */
const NUMBERED_HEADING = /^\d{1,2}[.)]\s+\S/;
const HEADING_MINOR_WORD = /^(?:and|or|of|for|the|in|on|to|a|an|&)$/i;
/**
 * A short line of capitalised words with no sentence punctuation — "Governance and Ethics".
 * A wrapped tail runs mid-sentence and reads as prose, so it fails at least one of these.
 */
function looksLikeSectionHeading(text) {
    if (text.length > 60 || /[?.!,;:]\s*$/.test(text))
        return false;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 5)
        return false;
    return words.every(w => HEADING_MINOR_WORD.test(w) || /^[A-Z0-9][\w&/-]*$/.test(w));
}
/**
 * Whether a question head is still unfinished and should pull in the line below.
 *
 * Terminal punctuation ends it. Otherwise a head qualifies either by closing on a connector
 * (CONTINUATION_MARKER — "…policy in") or by closing mid-sentence on a lowercase content word
 * ("…in place to manage"). The connector list alone missed the second shape, which is how a
 * question wrapping across three lines lost its tail and reached the matcher truncated.
 */
function headIsIncomplete(text) {
    if (/[?.!]\s*$/.test(text))
        return false;
    if (CONTINUATION_MARKER.test(text) || WRAPS_ON_WORD.test(text))
        return true;
    // A trailing acronym is a wrap only when the line has lowercase elsewhere, so an all-caps
    // section heading is never read as an unfinished question.
    return WRAPS_ON_ACRONYM.test(text) && !ALL_CAPS_LINE.test(text);
}
// Whether a line can be the continuation (tail) of a wrapped question above it — i.e. it is not
// itself the start of a new item. Rejects new numbered entries, contents lines, form scaffolding
// ([Fixed row], ☑ options, "Select from"), boilerplate, and pure values/numbers.
function isContinuationTail(line) {
    const t = line.trim();
    // Length only rules out something absurd. The cap was 60, then 90, and each number was
    // set from the width of whichever document was in front of us: the Drive Sustainability
    // SAQ wraps at 63, so 60 rejected the very lines it existed to reabsorb. A wide-layout
    // questionnaire (CDP wraps past 100) then hit the 90 for the same reason, and every
    // question whose tail ran long stayed truncated at its connector — "…with the potential
    // to have a", "…the progress made against them during the".
    //
    // The head test is what carries the decision: absorbWrappedTail only asks this while
    // headIsIncomplete() says the line above ends mid-sentence, and the rejections below
    // throw out numbering, contents lines, headings, answer options and anything that opens
    // a new item. A line long enough to fail this is not a wrap at all; 200 is a page width,
    // not a document width.
    if (t.length === 0 || t.length > 200)
        return false;
    // A bare answer option is the line after a question, never part of it. Cheap to test and it
    // is the one thing a looser head test could otherwise swallow.
    if (ANSWER_TOKEN.test(t))
        return false;
    if (STRUCTURED_NUMBERING.test(t) || TOC_ENTRY_START.test(t) || TOC_LINE.test(t))
        return false;
    if (/^[[(☑☐✓✗✘●○■□▪▫►▶]/.test(t))
        return false;
    if (/^(select from|select all|select one|add row|fixed row|row\s*\d)/i.test(t))
        return false;
    if (SKIP_PATTERNS.some(p => p.test(t)))
        return false;
    if (/^[\d.,%€$£\s()–-]+$/.test(t))
        return false;
    // A line that opens something new is never the tail of the line above it. Without these three
    // an unpunctuated question absorbed the next question, and a section heading disappeared into
    // the question before it, taking the following question with it.
    if (NUMBERED_HEADING.test(t))
        return false;
    // Only a line that OPENS a question disqualifies itself as a tail. Testing looksLikeQuestion
    // instead is too broad: it accepts any two-word line ending in "?", which is the exact shape of
    // a capitalised wrapped tail ("Data System (IMDS)?"), and refusing those reintroduced the
    // truncation this whole change set exists to remove.
    // Case carries the signal: a new question is capitalised, a wrapped tail continues mid-sentence
    // in lowercase. Without that condition "which includes a commitment to legal compliance," is read
    // as an interrogative opening rather than the relative clause it is.
    const probe = t.replace(PLEASE_PREFIX, '');
    const opensNewItem = INTERROGATIVE_START.test(probe) || IMPERATIVE_START.test(probe) || REFERENCE_ID.test(t);
    if (opensNewItem && /^[A-ZÀ-Þ]/.test(t))
        return false;
    if (looksLikeSectionHeading(t))
        return false;
    return true;
}
// PDF/DOCX text arrives one visual line at a time, so a question that wraps is split across
// lines: the head keeps a truncated text and the tail ("impacts?") is left as an orphan. Pull
// the tail(s) back onto the head — but only while the head is still incomplete (ends on a
// connector) and the next line is a real continuation, so complete questions and scaffolding are
// never absorbed. Consumes the lines it merges, so it can only lower the question count.
function absorbWrappedTail(lines, headIdx, headText) {
    let text = headText;
    let j = headIdx;
    let absorbed = 0;
    // Eight, not five: a CDP-style question runs to three or four wrapped lines before its
    // sub-clauses, and the loop stops as soon as the head reads as finished anyway. The cap
    // is a runaway guard, not a length policy.
    while (absorbed < 8 && headIsIncomplete(text) && j + 1 < lines.length) {
        const cand = lines[j + 1].trim();
        if (!isContinuationTail(cand))
            break;
        text = `${text} ${cand}`.replace(/\s+/g, ' ').trim();
        j++;
        absorbed++;
    }
    return { text, endIdx: j };
}
// A trailing run of answer options — "[ ] Yes [ ] No", "☐ All ☐ Most ☐ None" — optionally
// carrying the next item's reference, which a wrapped form row drags along ("… [ ] N/A HR-04").
// Each option label is capped so a real clause after the options ("[ ] No. If no, identify
// excluded sites and the reason.") cannot be consumed.
// A run of answer options — "[ ] Yes [ ] No", "☐ All ☐ Most ☐ None". Only empty checkboxes and
// checkbox glyphs count: "●" and "○" are bullets, and "Describe governance responsibilities:
// ● Board oversight" is asking about the bullet, not offering it as an answer.
//
// A label is one or two short words. A word ending in a full stop closes the label, so the
// clause after the options survives: in "[ ] Yes [ ] No. If no, explain." the run ends at "No."
// and "If no, explain." is part of the question.
//
// Matched anywhere, not just at the end — a form question carries its options mid-line.
const OPTION_RUN = /(?:(?:\[\s*\]|☐|☑|✓)\s*(?:[A-Za-z][\w/]{0,11}\.|[A-Za-z][\w/]{0,11}(?:\s+[A-Za-z][\w/]{0,11})?)?\s*)+/g;
/**
 * Drop answer scaffolding from a question. Form questionnaires put the options on the same
 * visual line as the question, so without this the matcher scores "Yes No N/A" as part of the
 * question and the UI shows the checkbox labels back to the user.
 */
function stripAnswerScaffolding(text) {
    const stripped = text
        .replace(OPTION_RUN, ' ')
        .replace(/\s+([?.!,;:])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    return stripped.length >= 15 ? stripped : text;
}
function normalizeExtractedQuestionText(text) {
    return text
        .replace(/\s+([?.!,;:])/g, '$1')
        .replace(/\b([A-Za-z])\s-\s([A-Za-z])\b/g, '$1-$2')
        .replace(/\b(Scope)\s-\s([123])\b/gi, '$1-$2')
        .replace(/\s+/g, ' ')
        .trim();
}
function isTableSeparator(line) {
    return /^\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line.trim());
}
function isQuestionTableHeader(cells) {
    return cells.some(c => c.toLowerCase() === 'question')
        && cells.some(c => /^id$/i.test(c) || /target|stress/i.test(c));
}
function extractQuestionFromTableLine(line) {
    if (!line.trim().startsWith('|') || isTableSeparator(line))
        return null;
    const cells = line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(c => normalizeExtractedQuestionText(c));
    if (cells.length < 2 || isQuestionTableHeader(cells))
        return null;
    if (cells.length >= 3 && cells[0].length <= 30 && cells[1].length >= 10) {
        return { text: cells[1], referenceId: cells[0] };
    }
    const questionIndex = cells.findIndex((cell, idx) => idx > 0 && (looksLikeQuestion(cell) || INTERROGATIVE_START.test(cell) || IMPERATIVE_START.test(cell)));
    if (questionIndex < 0)
        return null;
    const referenceId = cells[0] && cells[0].length <= 30 ? cells[0] : undefined;
    return { text: cells[questionIndex], referenceId };
}
// A questionnaire reference opening a table row: "PRO-01", "ENV-P01", "LAB-COV01", "C2.1", "Q12".
// Real assessments prefix by domain AND question type, so a single letter segment is not enough —
// requiring only PREFIX-NN matched 14 of the 83 references in the EcoVadis-style fixture.
//
// A letter segment is required, which is also what keeps an ordinary section number out: "1.2
// Environmental management systems" is a heading, not a question, and must not acquire a
// reference id. Long serials like a document number ("NCP-SSA-2026-118") fail the digit bound.
const ROW_REFERENCE = /^[A-Z]{1,6}(?:[-–][A-Z]{0,4})?[-–]?\d{1,3}(?:\.\d{1,2})*$/;
/**
 * A table row whose columns arrive as runs of whitespace rather than pipes:
 *
 *   PRO-01   Confirm the registered legal entity, company number …   Free text / see evidence
 *
 * PDF and DOCX questionnaires are built this way — EcoVadis-style assessments, SAQ forms and
 * buyer due-diligence questionnaires all use Ref / Question / Response / Evidence columns. Without
 * this the whole row is discarded: it opens on a reference token, so neither the interrogative nor
 * the imperative test ever sees the question sitting behind it.
 *
 * The reference column is itself the evidence that a question follows, so the bar for the question
 * cell is lower than in prose — a bare noun phrase ("Primary industrial activity and material
 * product groups supplied to Northstar.") is a real item here. Response-type columns are excluded
 * by the shared skip patterns, which already cover "free text", "select from" and similar.
 */
function extractQuestionFromSpacedRow(line) {
    if (line.trim().startsWith('|'))
        return null;
    const cells = line.split(/\s{3,}/).map(c => normalizeExtractedQuestionText(c)).filter(Boolean);
    if (cells.length < 2)
        return null;
    const [reference, ...rest] = cells;
    if (!ROW_REFERENCE.test(reference))
        return null;
    const candidates = rest.filter(cell => cell.length >= 10 && !ANSWER_TOKEN.test(cell) && !SKIP_PATTERNS.some(p => p.test(cell)));
    if (candidates.length === 0)
        return null;
    // The column beside the reference is the question; everything right of it is the response type
    // and the evidence note. Preferring the longest cell instead picked the evidence column, which
    // is routinely the longest thing on the row.
    const text = candidates[0];
    if (!looksLikeQuestion(text) && text.length < 25)
        return null;
    return { text, referenceId: reference };
}
function mergeSplitTableRows(lines) {
    const merged = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (!line.trim().startsWith('|') || isTableSeparator(line)) {
            merged.push(line);
            continue;
        }
        while (countChar(line, '|') < 3
            && i + 1 < lines.length
            && !lines[i + 1].trim().startsWith('|')
            && !/^#{1,6}\s/.test(lines[i + 1].trim())) {
            line += ' ' + lines[++i];
        }
        merged.push(line);
    }
    return merged;
}
// A question numbered in its own table column arrives with the marker stranded on a line
// of its own:
//
//   12.
//   What was your total water consumption in cubic
//   metres during the reporting year?
//
// Every wrap heuristic below keys off the HEAD line, and a bare "12." is neither
// interrogative nor imperative, so the head was discarded and the tail lines read as
// prose — measured at 1 question recovered out of 44 (see parseRecall.test.ts). The same
// questionnaire with the marker left attached to the first line scored 44 of 44, so the
// wrap machinery was never the problem: the orphan was.
//
// Reattaching is done before anything else looks at the lines, and a reference code
// rejoins with column spacing so extractQuestionFromSpacedRow still lifts its id out.
const ORPHAN_ENUMERATOR = /^\(?\d{1,3}(?:\.\d{1,2})*[.)]?$/;
function isOrphanMarker(line) {
    const t = line.trim();
    if (!t || t.length > 12)
        return false;
    return ORPHAN_ENUMERATOR.test(t) || ROW_REFERENCE.test(t);
}
function mergeOrphanMarkers(lines) {
    const merged = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const next = lines[i + 1];
        if (isOrphanMarker(line)
            && next
            && !isOrphanMarker(next)
            && !next.trim().startsWith('|')
            && !isTableSeparator(next)
            && !TOC_LINE.test(next)) {
            // Three spaces for a reference code, one for a plain enumerator: the spaced-row
            // extractor reads columns, the numbered-question branch reads a sentence.
            const joiner = ROW_REFERENCE.test(line.trim()) ? '   ' : ' ';
            merged.push(`${line.trim()}${joiner}${next.trim()}`);
            i++;
            continue;
        }
        merged.push(line);
    }
    return merged;
}
// ============================================
// Text-to-Questions (shared by PDF + DOCX)
// ============================================
/**
 * Exported for tests. The PDF and DOCX paths both funnel through here, and the wrap
 * heuristics below it are the whole reason a question arrives complete or truncated —
 * testing them through a generated PDF would test pdf.js, not this.
 */
export function questionsFromText(text, fileName) {
    const lines = mergeSplitTableRows(mergeOrphanMarkers(text.split('\n').map(l => l.trim()).filter(l => l.length > 0)));
    const questions = [];
    let currentCategory;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (TOC_LINE.test(line))
            continue;
        // A line carrying a URL is document body (a citation or footnote), never a question — in
        // any format, so this is checked before the numbered-question branch that skips looksLikeQuestion.
        if (/https?:\/\//.test(line))
            continue;
        // A contents entry that wraps carries its dot leader only on the LAST line, so the head
        // line escapes TOC_LINE and reads exactly like a question — that is how a table of contents
        // gets imported as a duplicate of every question in the document. Treat this line as such a
        // head only if it breaks mid-sentence AND the next line is a dot leader that does not open
        // an entry of its own; a complete question that merely happens to sit above a contents line
        // ends in punctuation and stays.
        const next = lines[i + 1];
        if (!/[.?!]$/.test(line) && next && TOC_LINE.test(next) && !TOC_ENTRY_START.test(next))
            continue;
        const tableQuestion = extractQuestionFromTableLine(line);
        if (tableQuestion) {
            questions.push({
                id: uuid(),
                rowIndex: i + 1,
                text: trimGuidance(stripAnswerScaffolding(tableQuestion.text)),
                category: currentCategory,
                referenceId: tableQuestion.referenceId,
                rawRow: { text: line },
            });
            continue;
        }
        // A PDF/DOCX table row wraps across lines, unlike a markdown row, so its tail is reabsorbed.
        const spacedQuestion = extractQuestionFromSpacedRow(line);
        if (spacedQuestion) {
            const merged = absorbWrappedTail(lines, i, spacedQuestion.text);
            questions.push({
                id: uuid(),
                rowIndex: i + 1,
                text: trimGuidance(stripAnswerScaffolding(merged.text)),
                category: currentCategory,
                referenceId: spacedQuestion.referenceId,
                rawRow: { text: line },
            });
            i = merged.endIdx;
            continue;
        }
        // A short unpunctuated line is usually a section heading — but "usually" was doing a
        // lot of work here. At under 50 characters without a question mark, this branch also
        // swallowed every short prompt that does not end in "?":
        //
        //   Beschreiben Sie Ihre Umweltmanagementsysteme.   (45 chars)
        //   Wie hoch war Ihr Stromverbrauch im Berichtsjahr (47 chars)
        //
        // German questionnaires are full of both, so German items reached the parser only
        // when they happened to carry a question mark, and the verb tests below were never
        // consulted. Asking whether the line reads as a question first costs one call and
        // leaves real headings ("Environment", "Energy and emissions") exactly where they were.
        if (line.length < 50
            && !line.includes('?')
            && !line.match(/^\d+[\.\)]/)
            && !STRUCTURED_NUMBERING.test(line)
            && !looksLikeQuestion(line)) {
            currentCategory = line.replace(/[:.]$/, '').trim();
            continue;
        }
        const hasStructuredId = STRUCTURED_NUMBERING.test(line);
        const cleaned = line
            .replace(/^\(\d+(?:\.\d+)*\)\s*/, '')
            .replace(/^(?:Q?\d+[\.\)\:]?\s*)/i, '')
            .trim();
        if (!cleaned)
            continue;
        if (hasStructuredId && cleaned.length >= 10) {
            const isQuestion = ENDS_WITH_QUESTION.test(cleaned)
                || INTERROGATIVE_START.test(cleaned)
                || IMPERATIVE_START.test(cleaned)
                || cleaned.length > 80;
            if (!isQuestion)
                continue;
            const merged = absorbWrappedTail(lines, i, cleaned);
            questions.push({ id: uuid(), rowIndex: i + 1, text: trimGuidance(stripAnswerScaffolding(merged.text)), category: currentCategory, rawRow: { text: line } });
            i = merged.endIdx;
            continue;
        }
        if (!looksLikeQuestion(cleaned))
            continue;
        const merged = absorbWrappedTail(lines, i, cleaned);
        questions.push({ id: uuid(), rowIndex: i + 1, text: trimGuidance(stripAnswerScaffolding(merged.text)), category: currentCategory, rawRow: { text: line } });
        i = merged.endIdx;
    }
    const seen = new Set();
    const deduped = [];
    for (const q of questions) {
        const key = questionIdentity(q);
        if (!seen.has(key)) {
            seen.add(key);
            deduped.push(q);
        }
    }
    const detectedFramework = detectFramework(deduped);
    if (detectedFramework)
        deduped.forEach(q => { q.framework = detectedFramework; });
    return {
        success: deduped.length > 0,
        questions: deduped,
        errors: deduped.length === 0 ? ['No questions could be extracted from the document. Make sure the file contains questionnaire items.'] : [],
        metadata: { fileName, totalRows: lines.length, parsedRows: deduped.length, detectedFramework, columnMapping: { questionText: 'text' } },
    };
}
// ============================================
// PDF Parsing
// ============================================
// Bounds live in parseLimits.ts; see the header there for why an uploaded
// questionnaire is the least trusted input this engine takes.
async function parsePdfFile(file) {
    try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const arrayBuffer = await file.arrayBuffer();
        const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
        // pdf.js reads the worker URL only from GlobalWorkerOptions; workerSrc/disableWorker passed
        // in the getDocument() init object are silently dropped, leaving workerSrc empty and failing
        // the load. Under Node pdf.js disables the worker and resolves its own path, so only the
        // browser needs this. Worker build must match the main build imported above (legacy).
        if (isBrowser) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
        }
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const textParts = [];
        const pageLimit = Math.min(pdf.numPages, MAX_PDF_PAGES);
        const pageNotices = [];
        if (pdf.numPages > MAX_PDF_PAGES) {
            pageNotices.push(`This PDF has ${pdf.numPages} pages; only the first ${MAX_PDF_PAGES} were read. Questions after that point are not included.`);
        }
        for (let pageNum = 1; pageNum <= pageLimit; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const items = content.items
                .filter((item) => 'str' in item && 'transform' in item)
                .map((item) => item);
            if (items.length === 0)
                continue;
            const lines = [];
            let currentLine = items[0].str;
            let lastY = items[0].transform[5];
            for (let j = 1; j < items.length; j++) {
                const item = items[j];
                const y = item.transform[5];
                if (Math.abs(y - lastY) > 3) {
                    lines.push(currentLine.trim());
                    currentLine = item.str;
                }
                else {
                    currentLine += ' ' + item.str;
                }
                lastY = y;
            }
            if (currentLine.trim())
                lines.push(currentLine.trim());
            textParts.push(lines.filter(l => l.length > 0).join('\n'));
        }
        const { text, warning } = capText(textParts.join('\n'));
        const parsed = questionsFromText(text, file.name);
        const notices = [...pageNotices, ...(warning ? [warning] : [])];
        return notices.length > 0 ? { ...parsed, errors: [...parsed.errors, ...notices] } : parsed;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error parsing PDF';
        return {
            success: false, questions: [], errors: [`Failed to parse PDF: ${message}`],
            metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
        };
    }
}
// ============================================
// DOCX Parsing
// ============================================
async function parseDocxFile(file) {
    try {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        // mammoth's browser build reads { arrayBuffer }; its Node build reads { buffer } and rejects
        // the other with "Could not find file in options". Try the browser shape first, then fall back,
        // so the DOCX path works in the app and in Node consumers of the engine alike.
        let result;
        try {
            result = await mammoth.extractRawText({ arrayBuffer });
        }
        catch (browserShapeError) {
            if (typeof Buffer === 'undefined')
                throw browserShapeError;
            result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
        }
        const { text, warning } = capText(result.value);
        const parsed = questionsFromText(text, file.name);
        return warning ? { ...parsed, errors: [...parsed.errors, warning] } : parsed;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error parsing Word document';
        return {
            success: false, questions: [], errors: [`Failed to parse Word document: ${message}`],
            metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
        };
    }
}
const EMPTY_CELL = { text: '', formula: false, empty: true };
function colLetter(index) {
    let n = index + 1;
    let s = '';
    while (n > 0) {
        n--;
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26);
    }
    return s;
}
function readGrid(sheet, name) {
    const ref = sheet['!ref'];
    if (!ref)
        return { name, rows: [], cols: 0, merges: [] };
    const range = XLSX.utils.decode_range(ref);
    const cols = range.e.c + 1;
    const rows = [];
    for (let r = 0; r <= range.e.r; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
            if (!cell) {
                row.push(EMPTY_CELL);
                continue;
            }
            // An empty cell that carries a fill comes back as a stub (t: 'z', no value). The
            // fill is the whole point — it is how a form says "answer here" — so read the style
            // before deciding the cell is empty.
            const style = cell.s;
            const fill = style?.fgColor?.rgb ? style.fgColor.rgb.toUpperCase().replace(/^(00|FF)(?=[0-9A-F]{6}$)/, '') : undefined;
            const hasValue = cell.v !== undefined && cell.v !== null;
            const text = hasValue ? String(cell.w ?? cell.v ?? '').trim() : '';
            row.push({ text, fill, formula: !!cell.f, empty: text === '' });
        }
        rows.push(row);
    }
    const merges = (sheet['!merges'] || []).map(m => [m.s.r, m.s.c, m.e.r, m.e.c]);
    return { name, rows, cols, merges };
}
/** Width in columns of the merge starting at (r, c), or 1. */
function mergeWidthAt(grid, r, c) {
    const m = grid.merges.find(([r0, c0]) => r0 === r && c0 === c);
    return m ? m[3] - m[1] + 1 : 1;
}
function isWideBand(grid, r, c) {
    const width = mergeWidthAt(grid, r, c);
    return width > 1 && width >= Math.ceil(grid.cols / 2);
}
// ---- header-mode row objects, keyed the way sheet_to_json keys them, so the mapping
// dialog in the app (which shows `availableColumns` and sends a mapping back) sees the
// same names it always did: blank headers are __EMPTY, __EMPTY_1…, repeats get _1, _2.
function headerKeys(cells) {
    const keys = [];
    const seen = new Map();
    let empties = 0;
    for (const cell of cells) {
        let key = cell.text;
        if (!key) {
            key = empties === 0 ? '__EMPTY' : `__EMPTY_${empties}`;
            empties++;
        }
        const n = seen.get(key) ?? 0;
        seen.set(key, n + 1);
        keys.push(n === 0 ? key : `${key}_${n}`);
    }
    return keys;
}
function rowsUnderHeader(grid, headerIdx) {
    const keys = headerKeys(grid.rows[headerIdx] || []);
    const rows = [];
    for (let r = headerIdx + 1; r < grid.rows.length; r++) {
        const cells = grid.rows[r];
        if (!cells.some(c => !c.empty))
            continue;
        const values = {};
        keys.forEach((k, i) => { values[k] = cells[i]?.text ?? ''; });
        rows.push({ row: r + 1, values, cells });
    }
    return { keys, rows };
}
// ---- the answer cell
const ANSWER_HEADER_PATTERNS = [
    'answer', 'answers', 'response', 'responses', 'reply', 'your answer', 'supplier response',
    'supplier answer', 'vendor response', 'antwort', 'antworten', 'ihre antwort', 'rückmeldung',
    'eingabe', 'réponse', 'respuesta',
];
const WEAK_ANSWER_HEADER_PATTERNS = ['comment', 'comments', 'kommentar', 'bemerkung', 'remarks', 'input'];
// A column ABOUT answers is not the answer column: "Answer options", "Response type",
// "Answer format" describe the box, they are not it.
const NOT_AN_ANSWER_COLUMN = /(option|options|type|format|guidance|scale|weight|score|points|max|maximum|required)/;
function detectAnswerColumn(keys, questionKey) {
    const norm = keys.map(k => k.toLowerCase().trim());
    const qi = keys.indexOf(questionKey);
    const candidates = norm.map((n, i) => ({ n, i })).filter(({ n, i }) => i !== qi && !n.startsWith('__empty') && !NOT_AN_ANSWER_COLUMN.test(n));
    // Exact names first ("Your answer" beats "Answer options" even when the latter comes
    // first), then a header that merely opens with one.
    const exact = (patterns) => candidates.find(({ n }) => patterns.includes(n));
    const prefix = (patterns) => candidates.find(({ n }) => patterns.some(p => n.startsWith(p + ' ') || n.startsWith(p + '/') || n.startsWith(p + ':') || n.startsWith(p + ' (')));
    const hit = exact(ANSWER_HEADER_PATTERNS) ?? prefix(ANSWER_HEADER_PATTERNS) ?? exact(WEAK_ANSWER_HEADER_PATTERNS) ?? prefix(WEAK_ANSWER_HEADER_PATTERNS);
    return hit ? keys[hit.i] : undefined;
}
/**
 * The fill a form uses to say "write here". Counted over non-formula cells that sit to
 * the right of a row's first text cell and carry a fill that cell does not — empty or
 * already written in, because a completed form keeps its boxes. Fills that also colour
 * the header row are a column's decoration, not a box. Needs to recur — one coloured
 * cell is decoration, three are a convention.
 */
function detectAnswerFill(grid, headerIdx = -1) {
    const headerFills = new Set((headerIdx >= 0 ? grid.rows[headerIdx] || [] : []).map(c => c.fill).filter(Boolean));
    const counts = new Map();
    for (let r = 0; r < grid.rows.length; r++) {
        if (r === headerIdx)
            continue;
        const cells = grid.rows[r];
        const firstText = cells.findIndex(c => !c.empty && !c.formula);
        if (firstText < 0)
            continue;
        for (let c = firstText + 1; c < cells.length; c++) {
            const cell = cells[c];
            if (cell.formula || !cell.fill || headerFills.has(cell.fill))
                continue;
            if (cell.fill === cells[firstText].fill)
                continue;
            counts.set(cell.fill, (counts.get(cell.fill) ?? 0) + 1);
        }
    }
    let best;
    let bestN = 0;
    for (const [fill, n] of counts)
        if (n > bestN) {
            best = fill;
            bestN = n;
        }
    return bestN >= 3 ? best : undefined;
}
function answerCellByStyle(cells, fromCol, fill) {
    for (let c = fromCol + 1; c < cells.length; c++) {
        if (cells[c].fill === fill && !cells[c].formula)
            return c;
    }
    return -1;
}
function answerCellAdjacentEmpty(cells, fromCol, cols) {
    for (let c = fromCol + 1; c < cols; c++) {
        const cell = cells[c] ?? EMPTY_CELL;
        if (cell.empty && !cell.formula)
            return c;
    }
    return -1;
}
function existingAnswerOf(cell) {
    if (!cell || cell.empty || cell.formula)
        return undefined;
    const n = Number(cell.text.replace(',', '.'));
    return cell.text !== '' && !Number.isNaN(n) && /^-?\d+(?:[.,]\d+)?$/.test(cell.text) ? n : cell.text;
}
// ---- table mode
function parseTableRows(grid, keys, rows, columnMapping, sheetLabel, answerFill) {
    const questions = [];
    const qCol = keys.indexOf(columnMapping.questionText);
    const aCol = columnMapping.answerColumn ? keys.indexOf(columnMapping.answerColumn) : -1;
    const catCol = columnMapping.category ? keys.indexOf(columnMapping.category) : -1;
    let carriedCategory;
    // When the sheet marks its answer boxes with a fill and most item rows carry one, the
    // box is what makes a row an item — the same rule a form uses. It is what separates
    // "A target is measurable when…" (guidance, no box) from "3.5 Number of work-related
    // fatalities" (item, box) when both sit in a column labelled "Item". Only applied when
    // the convention is consistent: a sheet that shades a handful of rows is decorating.
    const hasBox = (cells) => qCol >= 0 && !!answerFill && answerCellByStyle(cells, qCol, answerFill) >= 0;
    let requireBox = false;
    if (answerFill && qCol >= 0) {
        const textRows = rows.filter(r => String(r.values[columnMapping.questionText] || '').trim() && !isWideBand(grid, r.row - 1, qCol));
        const boxed = textRows.filter(r => hasBox(r.cells)).length;
        requireBox = textRows.length > 0 && boxed / textRows.length >= 0.5;
    }
    for (let i = 0; i < rows.length; i++) {
        const { row, values, cells } = rows[i];
        const questionText = String(values[columnMapping.questionText] || '').trim();
        // A merged category cell only carries its text on its first row; the rows beneath it
        // belong to the same category (fixture 07). Track it before the row is judged.
        if (catCol >= 0) {
            const cat = String(values[columnMapping.category] || '').trim();
            if (cat)
                carriedCategory = cat;
        }
        if (!questionText)
            continue;
        // A section band merged across the table is a heading, not an item, whatever column
        // its text happens to start in.
        if (qCol >= 0 && isWideBand(grid, row - 1, qCol)) {
            carriedCategory = questionText;
            continue;
        }
        if (requireBox && !hasBox(cells))
            continue;
        // A column the buyer LABELLED "Question" (or "Frage", or "Anforderung") has already
        // told us what its cells are, so the shape test that free text needs is the wrong
        // question to ask of them. It cost real rows: "Gesamtabfallmenge im Berichtsjahr
        // (kg)" and "Total electricity consumption in kWh:" are questionnaire items in a
        // question column and nothing else, but neither is interrogative or imperative, so
        // both were dropped — 2 of 4 rows lost from a German workbook.
        //
        // The bar is not removed, only lowered to what a cell must clear to be an item at
        // all: not an answer, not a spreadsheet label, not a bare number. Where the column
        // was GUESSED (the longest-text fallback), the full test still applies, because then
        // nothing has vouched for the column.
        if (columnMapping.questionTextFromHeader) {
            if (questionText.length < 6)
                continue;
            if (trimGuidance(questionText).length > 700)
                continue;
            // Case is the one signal that survives translation: a buyer's note sitting in the
            // question column ("this is just a note about the above question") opens lowercase,
            // while a field label does not — "Gesamtabfallmenge im Berichtsjahr (kg)" and
            // "Total electricity consumption in kWh:" are both capitalised.
            if (/^[a-z]/.test(questionText))
                continue;
            if (ANSWER_TOKEN.test(questionText))
                continue;
            if (SKIP_PATTERNS.some(p => p.test(questionText)))
                continue;
        }
        else if (!looksLikeQuestion(questionText)) {
            continue;
        }
        const question = { id: uuid(), rowIndex: i + 2, text: questionText, rawRow: values };
        if (catCol >= 0)
            question.category = carriedCategory;
        if (!question.category && sheetLabel)
            question.category = sheetLabel;
        if (columnMapping.subcategory)
            question.subcategory = String(values[columnMapping.subcategory] || '').trim() || undefined;
        if (columnMapping.referenceId)
            question.referenceId = String(values[columnMapping.referenceId] || '').trim() || undefined;
        if (columnMapping.required)
            question.required = parseRequired(values[columnMapping.required]);
        question.location = { sheet: grid.name, row, questionCol: qCol >= 0 ? colLetter(qCol) : undefined };
        let a = -1;
        if (aCol >= 0) {
            a = aCol;
            question.answerCellSource = 'header';
        }
        else if (answerFill && qCol >= 0) {
            a = answerCellByStyle(cells, qCol, answerFill);
            if (a >= 0)
                question.answerCellSource = 'style';
        }
        if (a >= 0) {
            question.location.answerCell = `${colLetter(a)}${row}`;
            question.existingAnswer = existingAnswerOf(cells[a]);
        }
        questions.push(question);
    }
    return questions;
}
// ---- form mode
const LABEL_ENDING = /:\s*$/;
const NUMBERING_CELL = /^(?:\(?\d{1,3}(?:\.\d{1,3})*[.)]?|[A-Z]{1,4}[-.]?\d{1,3}(?:\.\d{1,3})*)$/;
const OPTION_ROW = /^(?:[-–•·]|\[\s*\]|☐|☑|✓|\(\s*\))\s*/;
const LOWERCASE_START = /^[a-zà-ÿ]/;
/**
 * Read a sheet that has no header row. A question is a text cell with an empty shaded
 * answer cell to its right; a section band is a wide merge; a number in a cell to the
 * left is the reference id; a row that opens lowercase is the rest of the row above.
 *
 * Only used when the sheet carries a style signal — without one, "empty cell to the
 * right" is true of every instruction line ever written.
 */
function parseFormRows(grid, answerFill, sheetLabel) {
    const questions = [];
    let category;
    let pending = null;
    let ordinal = 0;
    // `row` is where the question starts; `answerRow` is where its box is — the same row
    // except for a question wrapped over two rows whose box sits on the second (01, Q8).
    const emit = (text, row, qCol, referenceId, aCol, answerRow, cells) => {
        ordinal++;
        const q = {
            id: uuid(), rowIndex: ordinal + 1, text, rawRow: Object.fromEntries(cells.map((c, i) => [colLetter(i), c.text])),
            category: category ?? sheetLabel, referenceId,
            location: { sheet: grid.name, row, questionCol: colLetter(qCol), answerCell: `${colLetter(aCol)}${answerRow}` },
            answerCellSource: 'style',
            existingAnswer: existingAnswerOf(cells[aCol]),
        };
        questions.push(q);
    };
    for (let r = 0; r < grid.rows.length; r++) {
        const cells = grid.rows[r];
        const firstText = cells.findIndex(c => !c.empty && !c.formula && !/^[\d.,\s%]+$/.test(c.text));
        if (firstText < 0) {
            pending = null;
            continue;
        }
        const text = cells[firstText].text;
        if (isWideBand(grid, r, firstText)) {
            // Banner, section band, instructions block, signature line. Short upper-case-ish
            // bands name the section; the rest is ignored.
            if (wordCount(text) <= 8 && !ENDS_WITH_QUESTION.test(text))
                category = text.replace(/^(section|abschnitt|teil|part)\s+[A-Z0-9]+\s*[-–:.]\s*/i, '').trim() || category;
            pending = null;
            continue;
        }
        const aCol = answerCellByStyle(cells, firstText, answerFill);
        const continuation = LOWERCASE_START.test(text) && pending && pending.row === r;
        if (continuation && pending) {
            pending.text = `${pending.text} ${text}`;
            if (aCol >= 0) {
                emit(pending.text, pending.row, pending.qCol, pending.referenceId, aCol, r + 1, cells);
                pending = null;
            }
            else
                pending.row = r + 1;
            continue;
        }
        pending = null;
        if (OPTION_ROW.test(text) || /^\s/.test(cells[firstText].text))
            continue;
        if (LABEL_ENDING.test(text) && wordCount(text) < 6)
            continue;
        if (wordCount(text) < 3 && !ENDS_WITH_QUESTION.test(text))
            continue;
        if (SKIP_PATTERNS.some(p => p.test(text)))
            continue;
        if (trimGuidance(text).length > 700)
            continue;
        let referenceId;
        for (let c = firstText - 1; c >= 0; c--) {
            const left = cells[c].text;
            if (left && NUMBERING_CELL.test(left)) {
                referenceId = left.replace(/[.)]$/, '');
                break;
            }
        }
        if (aCol >= 0)
            emit(text, r + 1, firstText, referenceId, aCol, r + 1, cells);
        else
            pending = { text, row: r + 1, qCol: firstText, referenceId };
    }
    return questions;
}
// ---- sheets
const SKIP_SHEET_PATTERN = /^(intro|guidance|instruction|definition|dropdown|option|admin|validation|response.?status|summary|about|help|read\s?me|cover|glossary|reference|changelog|version|menu|list|lookup|data.?valid|mapping|config|translation|language|scoring|hinweis|anleitung|erl[äa]uterung)/i;
function shouldSkipSheet(name) {
    return SKIP_SHEET_PATTERN.test(name.trim());
}
// Read a spreadsheet/CSV file into a workbook, decoding CSV text explicitly. A CSV carries no
// encoding metadata, so SheetJS guesses a legacy codepage and mangles UTF-8 umlauts
// ("beschäftigen" → "beschÃ¤ftigen"). Strip a UTF-8 BOM and decode as UTF-8, falling back to
// Windows-1252 for legacy exports whose bytes aren't valid UTF-8 (German Excel's default "CSV"
// on a German-locale machine). Binary formats (xlsx/xls) store their own encoding, so they are
// read as bytes unchanged — with cell styles, because a form says "answer here" with a fill.
async function readWorkbook(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (getFileExtension(file.name) !== 'csv') {
        return XLSX.read(bytes, { type: 'array', cellStyles: true });
    }
    const body = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes;
    let text;
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(body);
    }
    catch {
        text = new TextDecoder('windows-1252').decode(body);
    }
    return XLSX.read(text, { type: 'string' });
}
function parseSheet(grid, sheetLabel, rowCap, errors) {
    if (grid.rows.length === 0)
        return null;
    const valueGrid = grid.rows.map(r => r.map(c => c.text));
    const headerIdx = findHeaderRow(valueGrid);
    // findHeaderRow answers 0 both for "the header is row one" and "there is no header";
    // only a row that actually names a question column counts as a header here.
    const headerNamed = headerIdx > 0 || ((valueGrid[0] || []).filter(Boolean).length >= 2 && (valueGrid[0] || []).some(cell => COLUMN_PATTERNS.questionText.some(p => { const c = String(cell).toLowerCase().trim(); return c === p || c.includes(p); })));
    const answerFill = detectAnswerFill(grid, headerNamed ? headerIdx : -1);
    // FORM: nothing names a column, but the sheet has a "write here" fill. Row one is not
    // a header, it is the first row of the form.
    if (!headerNamed && answerFill) {
        const questions = parseFormRows(grid, answerFill, sheetLabel);
        if (questions.length > 0) {
            const rowsRead = Math.min(grid.rows.filter(r => r.some(c => !c.empty)).length, rowCap);
            return { questions, rowsRead, keys: headerKeys(grid.rows[0] || []), mapping: { questionText: '', questionTextFromHeader: false }, mode: 'form' };
        }
    }
    // TABLE: the header row (found or assumed to be row one) names the columns.
    const { keys, rows } = rowsUnderHeader(grid, headerIdx);
    const data = rows.slice(0, rowCap);
    if (rows.length > data.length) {
        errors.push(`Sheet "${grid.name}" has ${rows.length.toLocaleString('en-GB')} rows; only the first ${data.length.toLocaleString('en-GB')} were read.`);
    }
    if (data.length === 0)
        return null;
    const mapping = detectColumnMapping(keys, data.slice(0, 10).map(r => r.values));
    if (!mapping.questionText)
        return { questions: [], rowsRead: data.length, keys, mapping, mode: 'table' };
    mapping.answerColumn = detectAnswerColumn(keys, mapping.questionText);
    const questions = parseTableRows(grid, keys, data, mapping, sheetLabel, answerFill);
    return { questions, rowsRead: data.length, keys, mapping, mode: 'table' };
}
/** Collapse repeats to one question per identity, keeping every location. */
function dedupeKeepingLocations(all) {
    const byKey = new Map();
    const out = [];
    for (const q of all) {
        const key = questionIdentity(q);
        const first = byKey.get(key);
        if (!first) {
            byKey.set(key, q);
            out.push(q);
            continue;
        }
        if (q.location)
            (first.locations ??= []).push(q.location);
    }
    return out;
}
async function parseSpreadsheetFile(file) {
    const errors = [];
    try {
        const workbook = await readWorkbook(file);
        if (workbook.SheetNames.length === 0) {
            return { success: false, questions: [], errors: ['No sheets found in file'], metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } } };
        }
        const allQuestions = [];
        let primaryMapping = { questionText: '' };
        let totalRows = 0;
        let availableColumns = [];
        // A workbook is attacker-shaped input, so the caps bite per sheet, before anything
        // is materialised. Anything trimmed is reported, never dropped silently.
        const sheetNames = workbook.SheetNames.slice(0, MAX_SHEETS);
        if (workbook.SheetNames.length > MAX_SHEETS) {
            errors.push(`This workbook has ${workbook.SheetNames.length} sheets; only the first ${MAX_SHEETS} were read.`);
        }
        for (const sheetName of sheetNames) {
            if (sheetNames.length > 1 && shouldSkipSheet(sheetName))
                continue;
            if (totalRows >= MAX_TOTAL_ROWS) {
                errors.push(`Stopped after ${MAX_TOTAL_ROWS.toLocaleString('en-GB')} rows. Later sheets were not read.`);
                break;
            }
            const grid = readGrid(workbook.Sheets[sheetName], sheetName);
            const useSheetLabel = workbook.SheetNames.length > 1 ? sheetName : undefined;
            const outcome = parseSheet(grid, useSheetLabel, Math.min(MAX_ROWS_PER_SHEET, MAX_TOTAL_ROWS - totalRows), errors);
            if (!outcome)
                continue;
            if (availableColumns.length === 0)
                availableColumns = outcome.keys;
            if (!primaryMapping.questionText && outcome.mapping.questionText)
                primaryMapping = outcome.mapping;
            totalRows += outcome.rowsRead;
            allQuestions.push(...outcome.questions);
        }
        const dedupedQuestions = dedupeKeepingLocations(allQuestions);
        let autoDetectionConfidence = 'high';
        if (dedupedQuestions.length === 0) {
            autoDetectionConfidence = 'low';
        }
        else if (totalRows > 0 && dedupedQuestions.length / totalRows < 0.5) {
            autoDetectionConfidence = 'medium';
        }
        if (dedupedQuestions.length > 100) {
            errors.push(`Extracted ${dedupedQuestions.length} questions — this seems high. Review the results and consider using manual column mapping if needed.`);
            autoDetectionConfidence = 'low';
        }
        // Past this it is not a questionnaire, and every one of these becomes an answer
        // to generate and a card to render. The old code only warned at 100 and then
        // handed the whole list on regardless.
        if (dedupedQuestions.length > MAX_QUESTIONS) {
            errors.push(`Stopped at ${MAX_QUESTIONS.toLocaleString('en-GB')} questions. If this really is one questionnaire, split it and upload the parts separately.`);
            dedupedQuestions.length = MAX_QUESTIONS;
        }
        if (dedupedQuestions.length === 0 && totalRows > 0) {
            return {
                success: false, questions: [], errors: ['Could not identify question column. Try renaming the header to "Question" or use manual column mapping.'],
                metadata: { fileName: file.name, totalRows, parsedRows: 0, columnMapping: primaryMapping, availableColumns, autoDetectionConfidence },
            };
        }
        const detectedFramework = detectFramework(dedupedQuestions);
        if (detectedFramework)
            dedupedQuestions.forEach(q => { q.framework = detectedFramework; });
        return {
            success: dedupedQuestions.length > 0, questions: dedupedQuestions, errors,
            metadata: {
                fileName: file.name, totalRows, parsedRows: dedupedQuestions.length,
                detectedFramework, columnMapping: primaryMapping,
                availableColumns, autoDetectionConfidence,
                sheetsProcessed: workbook.SheetNames.length,
            },
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error parsing file';
        return { success: false, questions: [], errors: [message], metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } } };
    }
}
// ============================================
// Re-parse with Manual Mapping
// ============================================
/**
 * The user has named the columns. Row one is the header, as it always was for this
 * path; the mapping keys are the same sheet_to_json-style names the app showed them.
 * A named question column is trusted the way a labelled one is (`questionTextFromHeader`
 * is set unless the caller says otherwise), and the answer cell is still looked up by
 * header or by fill.
 */
export async function reprocessWithMapping(file, manualMapping) {
    try {
        const workbook = await readWorkbook(file);
        const allQuestions = [];
        let totalRows = 0;
        const mapping = { questionTextFromHeader: true, ...manualMapping };
        for (const sheetName of workbook.SheetNames) {
            const grid = readGrid(workbook.Sheets[sheetName], sheetName);
            if (grid.rows.length === 0)
                continue;
            const { keys, rows } = rowsUnderHeader(grid, 0);
            if (rows.length === 0 || !keys.includes(mapping.questionText))
                continue;
            totalRows += rows.length;
            const useSheetLabel = workbook.SheetNames.length > 1 ? sheetName : undefined;
            const sheetMapping = { ...mapping, answerColumn: mapping.answerColumn ?? detectAnswerColumn(keys, mapping.questionText) };
            allQuestions.push(...parseTableRows(grid, keys, rows, sheetMapping, useSheetLabel, detectAnswerFill(grid)));
        }
        const detectedFramework = detectFramework(allQuestions);
        if (detectedFramework)
            allQuestions.forEach(q => { q.framework = detectedFramework; });
        return {
            success: allQuestions.length > 0, questions: allQuestions,
            errors: allQuestions.length === 0 ? ['No questions found with the selected column mapping.'] : [],
            metadata: { fileName: file.name, totalRows, parsedRows: allQuestions.length, detectedFramework, columnMapping: mapping },
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, questions: [], errors: [message], metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: manualMapping } };
    }
}
// ============================================
// Main Entry Point
// ============================================
function getFileExtension(name) {
    return name.split('.').pop()?.toLowerCase() || '';
}
function rejected(fileName, message) {
    return {
        success: false, questions: [], errors: [message],
        metadata: { fileName, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
    };
}
export async function parseQuestionFile(file) {
    const ext = getFileExtension(file.name);
    // Size and shape are checked before any parser touches the bytes. The extension
    // is the only thing the caller has vouched for, and it is chosen by whoever sent
    // the questionnaire.
    const tooBig = checkFileSize(file);
    if (tooBig)
        return rejected(file.name, tooBig);
    const mismatch = checkSignature(ext, await readSignature(file));
    if (mismatch)
        return rejected(file.name, mismatch);
    switch (ext) {
        case 'pdf':
            return parsePdfFile(file);
        case 'docx':
            return parseDocxFile(file);
        case 'doc':
            return {
                success: false, questions: [],
                errors: ['Legacy .doc format is not supported. Please save the file as .docx and try again.'],
                metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
            };
        case 'xlsx':
        case 'xls':
        case 'csv':
            return parseSpreadsheetFile(file);
        default:
            return {
                success: false, questions: [],
                errors: [`Unsupported file format: .${ext}. Please upload an Excel (.xlsx), CSV, PDF, or Word (.docx) file.`],
                metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
            };
    }
}
export function parseQuestionsFromText(text) {
    return text.split('\n').filter(line => line.trim().length > 0).map((line, index) => ({
        id: uuid(), rowIndex: index + 1, text: line.trim(), rawRow: { text: line }
    }));
}
//# sourceMappingURL=questionParser.js.map
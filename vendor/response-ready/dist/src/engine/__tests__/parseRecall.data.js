// Ground truth for parser recall: one questionnaire, eight layouts.
//
// The parser had 59 unit tests and every one fed it a hand-written line or two. Nothing
// measured what fraction of a WHOLE questionnaire it recovers, which is the number every
// figure on the coverage report is a fraction of: "21 of 36 answered" is arithmetic on
// sand if the 36 should have been 50.
//
// So: one realistic 44-question supplier assessment, written in the register buyers
// actually use (EcoVadis / CDP / Sedex / RBA phrasing), and eight renderings of it that
// mirror how the file arrives — a clean list, a numbered list, PDF text with wrapped
// rows, a contents page in front, guidance paragraphs between questions, running
// headers and footers, an answer column with scaffolding, and a section-headed layout.
//
// Every variant contains the SAME 44 questions, so recall is measurable per layout and
// a regression names the layout that broke.
//
// What this is not: real buyer files. It measures robustness to layout, not fidelity to
// an unseen questionnaire. The honest corpus needs actual buyer PDFs, which only a
// supplier can supply — until then this is the floor, not the ceiling.
export const SAQ_QUESTIONS = [
    // Environment — energy and emissions
    'What was your total electricity consumption during the last reporting year in kWh?',
    'What proportion of your electricity was purchased from renewable sources?',
    'Do you measure your Scope 1 greenhouse gas emissions?',
    'What were your Scope 2 greenhouse gas emissions in tonnes of CO2 equivalent?',
    'Have you set a greenhouse gas emissions reduction target?',
    'Does your company report emissions data to CDP or a comparable disclosure programme?',
    'What was your total natural gas consumption in kWh during the reporting period?',
    'Do you track fuel consumption for company-owned or leased vehicles?',
    // Environment — water and waste
    'What was your total water consumption in cubic metres during the reporting year?',
    'Do you operate in any location classified as water-stressed?',
    'What was your total waste generated in kilogrammes during the reporting year?',
    'How much of your total waste was diverted from landfill through recycling or recovery?',
    'What quantity of hazardous waste did your operations generate?',
    'Do you have a documented waste management procedure?',
    // Environment — management systems
    'Is your environmental management system certified to ISO 14001?',
    'Do you have a written environmental policy endorsed by senior management?',
    'Does your company conduct environmental risk assessments of its own operations?',
    'Have you been subject to any environmental fines or sanctions in the last three years?',
    // Labour and human rights
    'How many people did you employ at the end of the reporting period, expressed in full-time equivalents?',
    'What proportion of your workforce is female?',
    'What proportion of management positions are held by women?',
    'What was your voluntary employee turnover rate during the reporting period?',
    'How many hours of training did you provide to employees in total?',
    'Do you have a written policy prohibiting child labour and forced labour?',
    'Do you have a documented human rights due diligence process?',
    'Do you provide a confidential grievance mechanism accessible to all workers?',
    'Are all workers free to join a trade union or workers representative body?',
    'Do you pay all workers at or above the applicable legal minimum wage?',
    // Health and safety
    'How many recordable work-related injuries occurred during the reporting period?',
    'How many lost-time incidents did you record during the reporting period?',
    'How many work-related fatalities occurred in the reporting period?',
    'What was your total number of hours worked during the reporting period?',
    'Is your occupational health and safety management system certified to ISO 45001?',
    'Do you provide personal protective equipment to all workers at no cost to them?',
    'Do you conduct documented workplace health and safety risk assessments?',
    // Ethics and governance
    'Do you have a written anti-corruption and anti-bribery policy?',
    'Have you provided anti-corruption training to employees in exposed functions?',
    'Do you have a whistleblowing channel that permits anonymous reporting?',
    'Has your company been convicted of any anti-competitive practice in the last five years?',
    'Do you have a data protection policy that meets the requirements of the GDPR?',
    // Supply chain
    'How many direct suppliers do you work with in total?',
    'What percentage of your suppliers have signed your supplier code of conduct?',
    'What percentage of your suppliers have been assessed on environmental and social criteria?',
    'Do you monitor your supply chain for human rights risks?',
];
const SECTIONS = [
    { title: 'Section 1 — Environment', upto: 18 },
    { title: 'Section 2 — Labour and Human Rights', upto: 28 },
    { title: 'Section 3 — Health and Safety', upto: 35 },
    { title: 'Section 4 — Ethics and Governance', upto: 40 },
    { title: 'Section 5 — Sustainable Procurement', upto: 44 },
];
const sectionFor = (index) => SECTIONS.find(s => index < s.upto)?.title ?? SECTIONS[SECTIONS.length - 1].title;
/** Break a line at roughly `width`, the way PDF text extraction wraps a table cell. */
function wrap(text, width) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        if (current && (current + ' ' + word).length > width) {
            lines.push(current);
            current = word;
        }
        else {
            current = current ? `${current} ${word}` : word;
        }
    }
    if (current)
        lines.push(current);
    return lines;
}
const GUIDANCE = [
    'Please provide figures for the most recent completed financial year. Where data is estimated, indicate the basis of estimation in the comment field.',
    'If this question is not applicable to your operations, select N/A and explain why in the free-text box below.',
    'Supporting evidence may be requested during verification. Retain source documents for at least three years.',
];
export const VARIANTS = [
    {
        name: 'plain list',
        fileName: 'supplier-assessment.pdf',
        render: () => SAQ_QUESTIONS.join('\n'),
    },
    {
        name: 'numbered list',
        fileName: 'supplier-assessment-numbered.pdf',
        render: () => SAQ_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join('\n'),
    },
    {
        name: 'reference-coded rows',
        fileName: 'ecovadis-saq-2026.pdf',
        render: () => SAQ_QUESTIONS
            .map((q, i) => `ENV-${String(i + 1).padStart(3, '0')}    ${q}`)
            .join('\n'),
    },
    {
        name: 'section headings',
        fileName: 'sedex-smeta-saq.docx',
        render: () => {
            const out = ['Supplier Self-Assessment Questionnaire 2026', ''];
            let lastSection = '';
            SAQ_QUESTIONS.forEach((q, i) => {
                const section = sectionFor(i);
                if (section !== lastSection) {
                    out.push('', section, '');
                    lastSection = section;
                }
                out.push(`${i + 1}. ${q}`);
            });
            return out.join('\n');
        },
    },
    {
        // PDF extraction of a "No. | Question | Answer" table puts the number in its own
        // column, so it lands on a line of its own with the question wrapped beneath it.
        name: 'wrapped rows, number on its own line',
        fileName: 'cdp-supply-chain-2026.pdf',
        hard: true,
        render: () => SAQ_QUESTIONS
            .map((q, i) => [`${i + 1}.`, ...wrap(q, 46)].join('\n'))
            .join('\n'),
    },
    {
        // The same wrapping, but the number stayed with the first line — what a flowed
        // (non-table) numbered list usually extracts to. Kept separate from the variant above
        // so a failure names which of the two shapes broke.
        name: 'wrapped rows, number attached',
        fileName: 'ecovadis-saq-flowed.pdf',
        hard: true,
        render: () => SAQ_QUESTIONS
            .map((q, i) => {
            const [head, ...rest] = wrap(q, 46);
            return [`${i + 1}. ${head}`, ...rest].join('\n');
        })
            .join('\n'),
    },
    {
        // A contents page repeats every question with a dot leader. Imported naively, the
        // document parses at double length and every count downstream doubles with it.
        name: 'contents page in front',
        fileName: 'buyer-questionnaire-with-toc.pdf',
        hard: true,
        render: () => {
            const toc = ['Table of Contents', ''];
            SAQ_QUESTIONS.forEach((q, i) => {
                const lines = wrap(q, 52);
                lines.forEach((line, li) => {
                    toc.push(li === lines.length - 1 ? `${line} ${'.'.repeat(8)} ${i + 3}` : line);
                });
            });
            return [...toc, '', 'Questionnaire', '', ...SAQ_QUESTIONS.map((q, i) => `${i + 1}. ${q}`)].join('\n');
        },
    },
    {
        name: 'guidance between questions',
        fileName: 'rba-saq-with-guidance.docx',
        hard: true,
        render: () => SAQ_QUESTIONS
            .map((q, i) => `${i + 1}. ${q}\n${GUIDANCE[i % GUIDANCE.length]}`)
            .join('\n'),
    },
    {
        // Running headers, footers, page numbers and an answer column with scaffolding —
        // everything a real export carries around the questions.
        name: 'headers, footers and answer scaffolding',
        fileName: 'integritynext-export.pdf',
        hard: true,
        render: () => {
            const out = [];
            SAQ_QUESTIONS.forEach((q, i) => {
                if (i % 8 === 0) {
                    out.push('Supplier ESG Assessment 2026 — Confidential');
                    out.push(`Page ${Math.floor(i / 8) + 1} of 6`);
                }
                out.push(`${i + 1}. ${q}    Answer: ______________`);
                if (i % 8 === 7)
                    out.push('© 2026 Buyer Group. All rights reserved.');
            });
            return out.join('\n');
        },
    },
];
/** Normalised for comparison: case, punctuation and whitespace are not recall. */
export function normalise(text) {
    return text
        .toLowerCase()
        .replace(/[.,;:!?()"'‘’“”]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=parseRecall.data.js.map
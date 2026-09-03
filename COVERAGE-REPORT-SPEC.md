# Coverage report — specification

Draft for review. Nothing built yet.

## Why

Measured over Sep 2025 – Sep 2026: 3,666 site visitors, 189 `/passport` views,
29 onboarding starts, 5 completions, **2 paywall hits, 1 checkout opened**.

Nobody has ever seen Passport work on their own questionnaire. `free` cannot
upload one (`canUploadQuestionnaire: false`) or read their documents
(`canExtractDocuments: false`), so `skipToSample()` sends them to `/demo` and
they evaluate the product on someone else's numbers.

The coverage report is the first action: **their questionnaire, their documents,
their gap — before any payment.**

## The entitlement change (the crux)

Free must be allowed to *analyse* without being allowed to *finish*.

| Capability | free (now) | free (proposed) | questionnaire-pass | pro |
|---|---|---|---|---|
| `canUploadQuestionnaire` | false | **true** | true | true |
| `canExtractDocuments` | false | **true** | true | true |
| `canAnalyseCoverage` | — | **true** (new) | true | true |
| `canGenerateAnswers` | false | **false** | true | true |
| `canExportResponses` | false | false | true | true |
| `maxQuestionnaires` | 0 | **1 (analysis only)** | 1 | null |

The paid line moves from *"can you look at your own data"* to *"can you finish
and take the answers away."* Nobody buys a response tool to read a coverage
report.

## Pipeline

Already built:

| Step | Where |
|---|---|
| Parse questionnaire → questions | `response-ready/src/engine/questionParser.ts` |
| Classify questions | `questionClassifier.ts` (`createClassifier`, per-question confidence) |
| Match questions → data needs | `keywordMatcher.ts`, `libraryMatcher.ts` |
| Read PDF/TXT/CSV → text | `web-helpers/pdfReader.js` |
| Text → fields | `vendor/esg-extract` — 5 document types, EN/DE/FR detection |
| Field → store location | `src/lib/extractFieldMap.js` — 20 fields, 6 sections |
| Assemble available data | `dataRetrieval.ts` (`addIfPresent`, `emptyDataContext`) |

To build: **the join.** `dataRetrieval` records what is present and never emits
"this question needed something absent." Coverage is that inverse, aggregated.

## The coverage model

Every parsed question lands in exactly one bucket.

**1. Substantiated from your documents.**
Question maps to a field present in the extracted set. Show the value, unit,
confidence, and `source.page` — provenance is the point, not the count.

**2. Needs a document you haven't added.**
Question maps to an extractable field that wasn't found. Name the document that
would supply it — "your waste manifest would answer 6 of these." This is the
most motivating item on the page: a concrete next step that visibly raises
bucket 1.

**3. Only you can answer this.**
Policy, governance, narrative, judgement — nothing extraction will ever find in
a bill. Split into *needs a policy document* and *needs a written answer*.

Bucket 3 depends on classifier output types; pin the real type names during
implementation rather than inventing a taxonomy here.

### Measured, 2026-09-03 — `testing/tough-esg-questionnaires-2026-07-13.xlsx`

91 questions parsed from 96 rows. Matched with the ESG pack:

- confidence: **47 high, 21 medium, 23 low, 0 unmatched**
- domains: buyer_requirements 31, goals 13, workforce 11, emissions 8,
  regulatory 8, effluents 4, materials 4, products 4, waste 3,
  financial_context 2, swot 2, site 1

Expected bucket split on a questionnaire of this shape: roughly **20
substantiable / 30 needing a document or policy / 40 answerable only by the
user**. Bucket 1 lands at 15–25%, and the report must not dress that up. The
value is *knowing*; bucket 2 is where the momentum lives.

### The join is a mapping table, not an engine

`matchQuestion` returns `suggestedDataPoints` as **human labels** — "Electricity
consumption (kWh)", "Total FTE", "Training hours per employee", "Lost time
incidents". `extractFieldMap.js` keys on **field IDs** — `electricityKwh`,
`totalEmployees`, `trainingHours`, `lostTimeIncidents`.

String overlap is zero; semantic overlap is about 11 of the 46 labels the pack
emits. So the missing piece is a label → field-ID table of roughly a dozen
entries, most likely alongside `ESG_FIELD_TO_METRIC_KEY` in the ESG pack.

Write it as data with a unit test per row, not as fuzzy matching. A wrong row
puts a value against the wrong question, which is worse than no coverage at all.

## What free shows vs. questionnaire-pass

**Free:**
- full bucket counts across the whole questionnaire
- every bucket-2 item named, with the document that would resolve it
- **three** bucket-1 answers shown complete, with value, unit and page reference
- the remaining bucket-1 answers counted but not rendered

**questionnaire-pass (€99):** all answers for one questionnaire, plus export.

**pro (€499):** unlimited questionnaires and reuse of the record across them.

Free proves capability and reveals scope. Paid does volume, reuse and export.

## Honesty rules

Inherited from `extractFieldMap.js` ("no fake-door checkboxes") and the existing
extraction behaviour. They are not negotiable:

- Never invent a value. An unsupported answer stays unresolved.
- Never show a field that cannot be stored.
- Low confidence arrives unchecked, never silently accepted.
- Scanned PDFs say so — `isUnreadablePdfText` → `bill.scannedPdf`.
- Coverage counts describe *what the documents support*, never a readiness
  score, a pass likelihood, or a predicted buyer outcome.

## Parser test — 2026-09-03

Two real questionnaires through `parseQuestionFile`.

**Drive Sustainability SAQ (20pp PDF): 22 questions, correctly extracted.**
"Does your company publish a CSR/Sustainability Report?", "Does your company
have a Code of Conduct in place?" — real questions, cleanly pulled. The PDF path
works.

Three defects:

- **Partial recall.** The SAQ carries roughly 40–60 questions; 22 were found.
- **Truncation.** "Does this site have a management system in place to manage"
  and "Does your company have a written health & safety policy in" both stop
  mid-sentence — line-wrap merging drops the tail. Also degrades matching.
- **Category noise.** `C. BUSINESS ETHICS` and `D. ENVIRONMENT` are right, but
  so are `'3'`, `'body'` and `'Yes Please upload relevant document'`. The
  `line.length < 50` heuristic reads short body lines as headers.

**EcoVadis PDF: 2 questions, both wrong.** Not a parser fault — that document is
a *guide about* the questionnaire. Its own text: "use this editable spreadsheet
to work on your questionnaire offline." The working artefact is the spreadsheet.

### Consequence: confirm the question list before analysing

A wrong denominator is the worst failure available to a coverage report. Finding
22 of 50 questions and reporting "18 of 22 substantiated" makes every number on
the screen false, and confidently so.

So the flow gains a step: **show the extracted questions and let the user
confirm or correct them** before any coverage is computed. It converts a silent
failure into a visible one, and it is the only way the honesty rules above can
hold.

### Consequence: spreadsheet first

`parseSpreadsheetFile` (xlsx/xls/csv, with `ColumnMapping`) gives a known row
count and reliable question text. It is also the artefact EcoVadis hands
suppliers. PDF stays supported but reviewed, never trusted silently.

## Risks

1. **Partial recall on PDFs** — see above. Mitigated by the confirmation step,
   not solved by it.
2. **A low coverage number may read as failure.** Framing has to make bucket 2
   the call to action rather than the disappointment.
3. **Free extraction raises support burden** — more users hitting unreadable
   documents, with no paid relationship.

## Build order

1. Fix question truncation in `questionsFromText` line-wrap merging.
2. Verify `parseSpreadsheetFile` against a real EcoVadis offline spreadsheet.
3. Add `canAnalyseCoverage`; open upload and extraction to free.
4. Build the question-confirmation step.
5. Build the join and the coverage aggregate (pure function, unit-tested).
6. Build the report screen — provenance first, bucket 2 prominent.
7. Replace the onboarding welcome + profile screens with upload-first.
8. Then, and only then, the site copy: acute hero, comparison table,
   €99 primary, €499 secondary on `/` and `/passport`.

Step 8 last: a job-shaped CTA pointing at a company-profile form is a fake door.

Category detection is unreliable; either fix it or keep categories out of the
report rather than showing `'body'` as a section heading.

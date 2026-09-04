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

| Capability | free (now) | free (proposed) | questionnaire-pass €99 | pro €499 |
|---|---|---|---|---|
| `canUploadQuestionnaire` | false | **true** | true | true |
| `canExtractDocuments` | false | **true** | true | true |
| `canAnalyseCoverage` | — | **true** (new) | true | true |
| `canGenerateAnswers` | false | **false** | true | true |
| `canExportResponses` | false | false | true | true |
| `canBuildPolicies` | — | **false** (new) | **false** | **true** |
| `maxQuestionnaires` | 0 | **1 (analysis only)** | 1 | null |

The paid line moves from *"can you look at your own data"* to *"can you finish
and take the answers away."* Nobody buys a response tool to read a coverage
report.

`canBuildPolicies` is new and load-bearing. `PolicyBuilder.jsx:160` currently
gates on `isPaid`, and `isPaid = hasActiveLicense()` is true for **any** tier —
so a €99 licence would silently unlock the €499 feature. The check must move to
the capability before the €99 tier is sold.

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

**Coverage means "what Passport can draft", not "what extraction found."**
Extraction is one source of several, and the smallest. Measuring only extraction
understates the product by more than half and makes the headline number look
like a failure when it isn't.

Every parsed question resolves to the best available draft source:

**1. Drafted from your documents.**
Question maps to a field present in the extracted set. Show value, unit,
confidence and `source.page` — provenance is the point, not the count.

**2. Drafted from a guided policy.**
`matchBuilderId(text)` maps the question to one of nine builders — Code of
Conduct, Anti-Corruption & Anti-Bribery, Whistleblowing, Data Privacy, Supplier
Code of Conduct, Health & Safety, Equal Opportunity, Environmental, Training &
Development. The user answers the mad-libs prompts and gets a real policy
document, so the questionnaire answer becomes true rather than merely written.

**3. Drafted from your answers and practices.**
`answerTemplates`, `matrixGenerator` (QuestionType × Maturity) and
`informalPracticeHandler` — the "we do this but haven't written it down" path.
Not yet measured; measure before the report ships.

**4. Needs a document you haven't added.**
Maps to an extractable field that wasn't found. Name the document that would
supply it — "your waste manifest would answer 6 of these." The most motivating
item on the page: a concrete step that visibly moves questions into bucket 1.

**5. Only you can decide this.**
Targets, commitments, judgement. Honest residue, and it should stay visible.

### Measured, 91-question questionnaire

| Source | Questions | Note |
|---|---|---|
| Extraction (numeric fields) | ~20 | from domain overlap with the 20 extractable fields |
| Policy builder (`matchBuilderId`) | 15 | measured directly; overlap with extraction ≈ 0 |
| Templates / maturity / informal | ? | **unmeasured — do this next** |

~35 of 91 before templates are counted. The earlier "15–25%" figure counted
extraction alone and was the wrong denominator for the product.

`matchBuilderId` looks conservative: Code of Conduct and Supplier Code of
Conduct scored zero on a questionnaire with 31 `buyer_requirements` items.
Worth widening its rules before trusting the bucket-2 count.

### The right way to measure this

Run the assembled engine (`createResponseEngine(pack)`) over the parsed
questions against a representative company data set and count how many produce a
non-empty draft. That is the real number, and it is the number the page should
quote. Everything above is component-level estimation.

### Measured, 2026-09-03 — `testing/tough-esg-questionnaires-2026-07-13.xlsx`

91 questions parsed from 96 rows. Matched with the ESG pack:

- confidence: **47 high, 21 medium, 23 low, 0 unmatched**
- domains: buyer_requirements 31, goals 13, workforce 11, emissions 8,
  regulatory 8, effluents 4, materials 4, products 4, waste 3,
  financial_context 2, swot 2, site 1

Extraction alone reaches ~20 of these. Adding the policy builder's measured 15
takes it to ~35 before templates and the maturity matrix are counted — see
"The coverage model" above for why extraction alone is the wrong denominator.

The residue that no source can serve — targets, commitments, judgement — stays
visible in the report rather than being padded out. The value is *knowing*, and
bucket 4 ("add this document and 6 more answers appear") is where the momentum
lives.

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

## The offer: diagnose first, then let them choose

The two tiers split on a real difference — drafting answers from documents you
already hold, versus creating governance documents you will own and reuse. That
is what justifies €499; "unlimited questionnaires" never did.

**Do not ask "do you already have your own policies?" at the buy button.** It is
exactly the question the buyer cannot answer — small suppliers routinely believe
they hold policies and discover theirs do not cover what is asked. A fork before
the diagnosis makes them guess, and the wrong guess is the expensive one: they
buy €99, find fifteen gaps, and feel sold to.

The coverage report already answers it. Let it, then present both options with
the buyer's own numbers inside:

> **Your questionnaire: 91 questions.**
> 20 we can draft from the documents you uploaded.
> **15 need policies you don't have yet.**
> 40 need your input.
>
> **Complete this questionnaire — €99** · drafts everything from what you have
> **ESG Passport — €499** · plus builds those 15 policies, yours to keep

The €499 case then argues itself, quantified, in the buyer's own situation — and
it cannot be copied, because it needs their documents.

**The €99 credits in full against the €499 (decided).** The binding constraint
is that almost nobody buys at all, so removing the fear of choosing wrong is
worth more than the extra €99 from the few who upgrade. The €99 CTA should say
so: *upgrade any time, we credit what you paid.* Needs a LemonSqueezy mechanism
— discount code or manual credit — decided before the tier goes live.

Note `policy_builder_locked_click` fires today and appears **zero** times in the
year's events. Nobody has ever reached that lock, so there is no demand evidence
either way. The coverage report will produce it for the first time.

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

1. ~~Fix question truncation in `questionsFromText`~~ — done, `fix/wrapped-question-truncation`.
2. Measure the real number: run `createResponseEngine(pack)` over the 91 parsed
   questions against representative company data, count non-empty drafts. Every
   figure in this spec is component-level estimation until this exists.
3. Widen `matchBuilderId` — Code of Conduct and Supplier Code of Conduct score
   zero on a questionnaire with 31 `buyer_requirements` items.
4. Add `canBuildPolicies`; move `PolicyBuilder`'s `isPaid` check onto it.
5. Add `canAnalyseCoverage`; open upload and extraction to free.
6. Build the question-confirmation step (PDF path only; spreadsheets already
   report `totalRows` vs `parsedRows`).
7. Build the source resolution and the coverage aggregate (pure function,
   unit-tested per row of the mapping table).
8. Build the report screen — provenance first, the two offers with real numbers.
9. Replace the onboarding welcome + profile screens with upload-first.
10. Then, and only then, the site copy: acute hero, comparison table,
    €99 primary, €499 secondary on `/` and `/passport`.

Step 10 last: a job-shaped CTA pointing at a company-profile form is a fake door.

Not on this path, decided separately: OCR. `esg-extract/web/ocrReader.ts`
(Tesseract, eng+deu+fra) exists but is not vendored into Passport — only
`esg-extract/src/` is — and it takes an image file, so scanned PDFs would also
need page→canvas rasterisation, which exists nowhere. If wired, force
OCR-derived fields to `low` confidence so `BillDrop` leaves them unticked: OCR
misreads digits, and on a bill the digits are the answer.

Category detection is unreliable; either fix it or keep categories out of the
report rather than showing `'body'` as a section heading.

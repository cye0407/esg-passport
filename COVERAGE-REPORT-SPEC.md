# Coverage report — specification

**BUILT, 2026-09-07** (branch `feat/coverage-report`). This file is kept as the record
of what was decided and why, not as a to-do list. Where the build diverged from the
spec, the spec is annotated inline. What is still open is at the bottom.

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

## What the report says

Three groups. The wording below is what the user reads — keep it in these words,
not in engine terms.

> **Your questionnaire: 81 questions**
>
> **8 answered from your documents**
> We found these in the bills and records you uploaded. Each one shows the
> number and the page it came from.
>
> **61 written for you to check**
> We've written these from what you've told us about your business. Read them
> before you send — they're a starting point, not a finished answer.
>
> **12 we can't answer**
> These need something only you have.

Behind those three lines: the first is `answerConfidence: 'high'`, the second
`'medium'`, the third `'none'`.

### Measured end to end, 2026-09-04

`createResponseEngine(esgDomainPack)` over three real questionnaires, at three
levels of user input.

| | A · 17 q | B · 81 q | C · 51 q |
|---|---|---|---|
| Gets some answer | 100% | 100% | 100% |
| Answered or written (high + medium) | 13 | 69 | 44 |
| **Answered from their own documents (high)** | **0** | **8** | **5** |

How it moves as the user adds data, fixture B: **65 → 67 → 69** written, and
**0 → 8** answered from documents.

**This is the finding that shapes the page.** Someone who uploads nothing at all
already gets 65 of 81 written, because the templates carry most of it. Adding
their bills and policies moves that to 69. So "we filled in 85% of your
questionnaire" is true and misleading at once — it measures the template
library, not their documents, and a supplier who forwards 69 unchecked answers
to a buyer has not been well served.

What their documents actually buy is the first group going from 0 to 8: answers
with their own numbers and a page reference. Small, true, and the only part no
one else can do. Say that, and don't inflate it with the rest.

### Sources behind the second group

- `answerTemplates`, `matrixGenerator` (question type × maturity) and
  `informalPracticeHandler` — the bulk of it.
- the nine guided policy builders, reachable via `matchBuilderId(text)`: Code of
  Conduct, Anti-Corruption & Anti-Bribery, Whistleblowing, Data Privacy,
  Supplier Code of Conduct, Health & Safety, Equal Opportunity, Environmental,
  Training & Development. These matter more than their share suggests: the user
  ends up holding a real policy document, so the answer becomes true rather than
  just written. Measured at 15/91 on the earlier fixture, 19/81 on B.

`matchBuilderId` is conservative — Code of Conduct and Supplier Code of Conduct
score zero on a questionnaire with 31 `buyer_requirements` items. Widen it.

### Also worth showing

Which document would move questions into the first group — "your waste manifest
would answer 6 of these." A concrete next step the user can act on today, and
the strongest reason to come back.

### Measured, 2026-09-03 — `testing/tough-esg-questionnaires-2026-07-13.xlsx`

91 questions parsed from 96 rows. Matched with the ESG pack:

- confidence: **47 high, 21 medium, 23 low, 0 unmatched**
- domains: buyer_requirements 31, goals 13, workforce 11, emissions 8,
  regulatory 8, effluents 4, materials 4, products 4, waste 3,
  financial_context 2, swot 2, site 1

Component-level estimate, kept for the domain breakdown only: extraction alone
reaches ~20 of these, the policy builder a further 15. Superseded by the
end-to-end measurement above, which is the number to quote.

Questions nothing can answer — targets, commitments, judgement calls — stay
visible rather than being padded out. The value is *knowing*, and "add this
document and 6 more answers appear" is what makes someone act.

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
- all three counts across the whole questionnaire
- every missing document named, with how many answers it would unlock
- **three** answers from their documents shown in full, with the value, the unit
  and the page it came from
- the rest counted, not shown

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
2. **A low count may read as failure.** The missing-document prompt has to be
   the thing people act on, not the thing that disappoints them.
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

## What was built, and where it diverged (2026-09-07)

Build order items 3–9 are done; item 10 (site copy) is done in the `esgforsuppliers`
repo on `feat/ninety-nine-ladder`.

Three divergences worth recording:

1. **It is a view, not a second pipeline.** `runPipeline` already produces per-draft
   `answerConfidence`, `confidenceSource`, `dataValue`/`dataUnit` and
   `matchResult.suggestedDataPoints`. `summarizeCoverage` aggregates those. No separate
   coverage engine was needed, which is most of why this was a day rather than a week.

2. **"Answered from your documents" became "answered from your records", and provenance
   had to be built first.** Extraction wrote the value and threw the filename away, so a
   figure read out of an uploaded bill was indistinguishable from one someone typed. The
   document name is now recorded in `settings.dataSources` on apply, and the report names
   it only when it is actually known. The spec's "the page it came from" is not shipped —
   we record the document, not the page.

3. **Low confidence counts as unanswered.** The spec's three groups are high / medium /
   none. The engine also emits `low`, and it emits text for it. Presenting that as an
   answer is how a supplier signs something untrue, so `low` is reported in the third
   group. The groups partition; a test asserts they sum to the question count.

### Still open

- **Partial recall on PDFs is not fixed.** The confirmation step makes it visible; the
  parser still finds 22 of roughly 50 questions in the Drive Sustainability SAQ.
- **The end-to-end €99 purchase has never been run.** See
  `testing/QUESTIONNAIRE-PASS-MANUAL-TEST.md`, and the two Lemon Squeezy confirmations in
  the `esgforsuppliers` go-live checklist.
- **Category headings are still out**, deliberately — detection reads `'body'` and `'3'`
  as section headers.

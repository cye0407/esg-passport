# Design — original-workbook editing and previous-answer reuse

**Date:** 2026-09-13. Task 3 of the bounded side-business reset. Builds on
`RESET-AUDIT-2026-09-11.md` (what exists) and `testing/benchmark/` (what the product does
today). Covers Phases 2, 3 and 4 of the reset; Phase 5 (journey) only where it constrains
the data shapes.

Everything measured here was measured against the 12-fixture benchmark. Nothing has been
implemented; the spike code lives outside the repo.

## 0. The one decision the spike settles: how to write into the buyer's file

Two candidates, both run on fixtures 01 (real form, alternating shaded answer cells, three
data validations, merges), 03 (dropdowns, hidden scoring sheet with formulas over the
answer cells, frozen pane) and 07 (header on row 10, hidden formula column over the answer
cells, vertical merges). Every answer cell filled; output re-read with ExcelJS and SheetJS;
zip parts compared byte-for-byte with the original; then opened in desktop Excel
(Office16, `xlNormalLoad`, no repair allowed) and the answers + a recalculated formula
read back.

| | A. ExcelJS load → set → save | B. Patch only the target `<c>` elements in the sheet XML |
|---|---|---|
| Answers landed | 21/21 · 29/29 · 21/21 | 21/21 · 29/29 · 21/21 |
| Formulas, validations, merges, hidden sheet, hidden column, frozen panes | all preserved | all preserved |
| Opens in desktop Excel without repair | yes ×3 | yes ×3 |
| Buyer formulas recalculate on open | yes | yes (`fullCalcOnLoad` set) |
| Zip parts rewritten, fixture 01 | **10** (both sheets, styles, docProps, rels, content types, + new sharedStrings) | **1** (the target sheet) |
| Zip parts rewritten, 03 / 07 | 4 / 2 | 2 / 2 (sheet + `workbook.xml` calcPr) |
| Charts, pivots, slicers, drawings, macros | dropped or degraded (not in the fixture set; known ExcelJS limits) | untouched by construction |
| Can honestly say "your file, unchanged except the answer cells" | no — "mostly your file" | yes |
| Failure mode | silent loss of a part | our bug corrupts XML → Excel repair prompt (loud) |

**Decision: B is the writer; A is the validator.** B is the only approach whose claim
matches the product promise, its failure mode is visible rather than silent, and on the
three fixtures it was no harder to get right. A stays in the test suite: every B output is
reloaded through ExcelJS and SheetJS and its parts diffed against the original.

Two lessons from the spike that shape the implementation:
- Attribute order is not stable across producers (`Target` before `Id` in the
  rels of the real form; the reverse in ExcelJS output). Never regex the XML in
  production. The browser has `DOMParser`/`XMLSerializer`; use them. JSZip is already in
  `node_modules` as an ExcelJS dependency — add it as an explicit dependency, no new
  library class.
- `calcPr fullCalcOnLoad="1"` must be set whenever the workbook contains any formula,
  otherwise buyer-side cells show stale cached values (`OPEN` instead of `RECEIVED`) until
  the user presses F9. Only touch `workbook.xml` when a formula exists.

## 1. Parser: carry the location, keep every location

`ParsedQuestion` (`response-ready/src/types/engine.ts:18`) gains:

```ts
location: { sheet: string; row: number; questionCol: string };   // absolute sheet row, column letter
answerCell?: string;           // e.g. "D13"; undefined when nothing could be identified
answerCellSource?: 'header' | 'style' | 'validation' | 'adjacent-empty' | 'user';
existingAnswer?: string | number | null;   // non-empty content already in answerCell
locations?: Array<{ sheet: string; row: number; answerCell?: string }>;  // when identical text occurs more than once
```

`rowIndex` stays for compatibility but is deprecated; it is header-relative and has misled
every consumer that treated it as a sheet row.

**De-duplication** (`questionParser.ts:1007–1012`) keeps one analysis question per
identity but appends every further occurrence to `locations`. Write-back writes the same
answer to every location; the review screen shows the question once with "appears 3×".

**Header-row detection** (`findHeaderRow`) is the root cause of two of the six form
failures and the headerless-sheet loss in 05. Replace the single "find the header" step
with a **form scan**:

1. Read the sheet as a cell grid with styles (`cellStyles: true`) and data validations.
2. Candidate question cells = non-empty text cells with ≥ 3 words or ending in `?`/`:`,
   not in a merged range wider than half the used columns (banners, section bands,
   instructions), not italic-only rows when another row style dominates.
3. Candidate answer cells = for each candidate question row, the cells to its right that
   are (a) empty or (b) carry a fill / border / validation that the question cell does not.
4. **If a header row exists** (a row whose cells match the header vocabulary — Question,
   Frage, Item, Requirement, Answer, Antwort, Response, Supplier response, Your answer,
   Comments) use it exactly as today. 03, 04, 06, 07 and half of 05 are headered.
5. **Otherwise** (01, the headerless sheets in 05) treat every candidate question row as a
   question — no shape test — provided the row has a candidate answer cell. This is what
   turns "Registered legal entity name" and "Recruitment fees are never charged to workers"
   into questions: not their grammar, the empty shaded cell beside them.
6. Wrapped questions: a text cell in the question column whose row has no answer
   candidate and whose previous row is a question → append to the previous question (01
   row 29). Existing `reassembleWrapped` logic in the PDF path is the model.

Section bands (merged, filled, upper-case) become `category`; numbering in column A or
inside the text (`1.1`, `ENV2.3`) becomes `referenceId` and is stripped from `text` only
for matching, never for display.

**Expected effect on the benchmark** (to be confirmed by running it, not assumed): 01 from
0 → 21 auto; 05 from 16 → 21; 07 from 6 wrong → 21; 04's numeric item 3.5 found; false
positives on 03's theme bands removed. Target for Gate 1's input side: ≥ 95% of expected
questions found automatically across the seven questionnaires, 0 false positives.

## 2. Answer-cell detection

Precedence, per sheet, then per row:

| Order | Signal | Fixtures where it decides |
|---|---|---|
| 1 | Header vocabulary in the header row ("Your answer", "Supplier response", "Antwort", "Answer") | 03, 06, 07, 05 (2 sheets) |
| 2 | **Style signal**: the fill (or border set) that appears on empty cells to the right of question cells and on nothing else in the sheet — computed once per sheet, applied per row, so a form that alternates C/D (01) resolves row by row | 01, 04, and as confirmation on all generated forms |
| 3 | Data validation on a cell to the right of the question | 04, 06 (03 also) — but never alone: 01 has validations on the wrong cells |
| 4 | First empty cell to the right of the question column, within the used range | 05 headerless sheets |
| 5 | User picks the column in the mapping dialog (`respond.columnMapping` gains an "Answers go in" select, pre-filled from 1–4) | fallback |

`answerCellSource` is recorded so the review screen can say "we will write your answers
into the yellow boxes" versus "into column F — check this is right". When the sources
disagree (validation says C18, style says D18 on fixture 01), style wins and the
disagreement is logged content-free (`answer_cell_conflict` event, counts only).

**Pre-filled cells** (05: "N/A — not required for service suppliers", "see attached")
populate `existingAnswer`. The writer never overwrites them; the review screen shows them
as "already answered by your customer" with an explicit "replace" control.

## 3. The writer

In-browser, no server. Input: the original `File` bytes (kept in memory from upload —
never re-requested), the list of `{sheet, cell, value, existingAnswer}` to write, and the
user's overwrite decisions.

```
open zip (JSZip)
resolve sheet name → part path via workbook.xml + workbook.xml.rels (DOM, attribute-order-safe)
parse sheet XML with DOMParser
for each target:
  find <row r=N> (create in order if absent); find <c r=REF> (create in column order if absent)
  if <c> has <f>            → refuse, report "formula cell"        (never silently)
  if <c> non-empty and !overwrite → skip, report "kept existing"
  keep the cell's s= style index; drop t=, <v>, <is>
  string  → t="inlineStr"><is><t xml:space="preserve">…</t></is>
  number  → <v>…</v>
  boolean/date → write as string; dates as ISO text (a real date needs the number format, out of scope)
serialize with XMLSerializer; replace the part
if any <f> exists anywhere in the workbook → set <calcPr fullCalcOnLoad="1"> in workbook.xml
generate zip (DEFLATE), same part order, same names
```

Inline strings are chosen over shared strings deliberately: they avoid rewriting
`sharedStrings.xml` (which A does) and Excel reads them natively. Rich text in the
question cells is unaffected because those cells are never touched.

**Not written by the writer:** row `spans` and the sheet `<dimension>` are left as-is —
Excel treats them as hints; the spike confirmed no repair prompt with stale spans.
Shared formulas (`t="shared"`) are irrelevant unless the target cell carries one, in which
case it is a formula cell and refused.

**Provenance — never in the buyer's file (decided 2026-09-13).** Fixtures 03 and 07 both
carry buyer instructions of the form "do not change the structure", and a Sources sheet
would name the user's other customers' forms and the documents they hold — exactly the
leak the product exists to prevent. So the output is the file with **only** the answer
cells changed, always. Provenance lives in the response pack and in a separate one-click
download beside the completed file: **"Download my answer sources"**, a CSV of
question → answer → source (file/row or document) → date, for the user's own audit trail
or for whoever reviews before sending. No optional Sources sheet; no cell comments (they
need a VML drawing part and a comments part per sheet — the riskiest edit in the format).

**File name:** `<original name> - completed <date>.xlsx`, never the original name, so the
user always still has the file the buyer sent.

## 4. Validator and Gate 1

`scripts/gate1-roundtrip.mjs` (to be written), over every non-twin fixture:

1. Write all `expected[].answerCell` targets with sample values via the writer.
2. Reload with ExcelJS: every target holds its value; formula count, validation count,
   merge count, hidden-sheet count, hidden-column count, frozen-pane state all equal the
   original's.
3. Reload with SheetJS: same value check (a second, independent reader).
4. Parts diff: only the target sheet part(s) and, when formulas exist, `workbook.xml`
   may differ. Any other part changed, added or removed = fail.
5. Pre-filled cells (05) untouched; formula cells refused and reported.

Then the manual half, on Cat's machine: `scripts/gate1-excel-check.ps1` opens each output
in desktop Excel via COM with `CorruptLoad = xlNormalLoad`, reads the answer cells back,
reads one buyer formula, and prints OPENED/FAILED per file. The spike version of this
script ran clean on six files; it becomes part of the gate, not a one-off.

**Gate 1 passes** when ≥ 90% of fixtures pass all of 1–5 and the Excel check. The only
known unmeasured class is workbooks with charts/pivots/drawings — B leaves those parts
untouched by construction, but a fixture should be added by saving one from Excel by
hand before the gate is declared.

## 5. Previous-answer reuse

### Input: a completed questionnaire is just a questionnaire with answers

The same parser, same answer-cell detection, run on the prior file. Each row yields a
`PriorAnswer`:

```ts
{ id, question: string, answer: string | number, sourceFile: string, sourceSheet: string,
  sourceRow: number, referenceId?: string, category?: string,
  sourceDate?: string /* from file name, a "Return by"/"Stand" cell, or user-entered */,
  approved: boolean /* true when imported from a pack, false when freshly read from a file until the user confirms the batch */ }
```

Fixture twins (01, 03, 04, 05, 07 `-completed-2025`) are the test input.

### Matching: five tiers, first hit wins, every hit carries its source

| Tier | Source | Mechanism | Result label |
|---|---|---|---|
| 1 | Approved previous answer | (a) exact normalised text match, or `referenceId` + category match → score 1.0; (b) `findLibraryMatches` term overlap ≥ `DEFAULT_MIN_SCORE`, **and** category/section agreement when the question is < 8 words | *Recovered from your <file>, <date>* |
| 2 | Company fact in the pack | today's `dataRetrieval` over the pack's facts | *From your company record* |
| 3 | Evidence extracted from a document | today's `extractFieldMap` values with `dataSources` provenance | *Proven by <document>* |
| 4 | Suggested wording | today's `answerTemplates` / `matrixGenerator` | *Suggested wording — review required* |
| 5 | Nothing | — | *Needs information from you* |

`AnswerDraft` gains `source: 'previous' | 'record' | 'document' | 'suggested' | 'none'`,
`sourceRef` (file + row, or document name), `sourceDate`, `matchScore`, `staleness`.
`answerConfidence` maps: previous-exact and document → `high`; previous-fuzzy and record →
`high` only if `staleness` is clear, else `medium`; suggested → `medium`; none → `none`.
The coverage groups (`summarizeCoverage`) gain **`recovered`** as a first group so the
results header reads *81 found · 38 recovered · 9 proven · 17 suggested · 17 need you*,
and the existing partition test is extended to five groups.

### Staleness: similarity is not truth

Any previous answer is flagged `staleness: 'check-figures'` when it contains a four-digit
year, a number with a unit (`kWh`, `t`, `%`, `m³`, `MWh`, `FTE`), a date, or a
certificate-expiry pattern; `staleness: 'check-period'` when the new questionnaire's
reporting year (from its text or the user's entry) differs from `sourceDate`'s year. A
flagged answer is never shown as `high`; it is pre-filled but marked, and the accept
control says "Confirm this is still true for <year>".

### Review controls

Per row: **Accept** (writes, records the decision in the pack as approved), **Edit**
(opens inline; edited text becomes the approved answer with `source: 'previous'`
retained and `edited: true`), **Reject** (row falls through to tier 2–5; rejection is
recorded so the same prior answer is not offered again for that question text). Batch:
"Accept all recovered answers without flags". `responseProject.applyReviewDecision` is
the model; `Respond.jsx`'s `editingAnswerId` path is reused for Edit.

### Gate 2 measurement — `scripts/gate2-reuse.mjs`

- **Same-form pairs** (twin as prior, original as new): expect ≥ 95% recovered with 0
  incorrect. This is the floor; if it fails the matcher is broken, not the concept.
- **Cross-form pairs** (twin of 03 as prior for 01, 04, 05, 06, 07; twin of 07 as prior
  for 01, 03…): this is the number the brief asks for. **Gate:** ≥ 50% usefully
  pre-filled, < 5% materially incorrect (a match whose prior answer does not answer the
  new question — judged by a hand-labelled pairing table in
  `testing/benchmark/reuse-pairs.json`, 5 pairs × ~20 questions, written before tuning).
- Every recovered draft has a non-empty `sourceRef`. Every `high` has `staleness` clear.
- "Meaningfully less copying": with the writer in place, copying is zero for accepted
  rows; the measure becomes *rows still needing the user* before vs after prior import.

**Gate 2 is two gates (decided 2026-09-13).**
- **Ship gate — same-form:** ≥ 95% recovered, 0 incorrect. This is the annual case —
  the same buyer sends the same or slightly revised form next year — and the most common
  repeat event a supplier has. If it passes, the €99 ships on that promise: *last year's
  answers, pre-filled, flagged where the figures may have changed.*
- **Headline gate — cross-form:** ≥ 50% usefully pre-filled, < 5% incorrect. This
  decides whether cross-form reuse goes on the landing page, not whether the product
  ships. Below the bar it is shown in-product as a modest, sourced bonus ("9 more
  recovered from your other questionnaires") and is not claimed in marketing. If it sits
  around 10–20% after honest tuning, the brief's instruction stands for the claim: stop,
  don't widen.

Site copy follows the two results: *"Got the same questionnaire again? We pre-fill it
from last year's file. Got a different one? We recover what we can and tell you what it
was based on."*

### Measured, 2026-09-13 — `scripts/gate2-reuse.mjs` on response-ready PR #9

| | result | bar | |
|---|---|---|---|
| **Ship gate** — same-form, 5 pairs | 113/115 recovered correctly, 0 incorrect (the 2 are boxes that were empty on the twin) | ≥ 95% / 0 | **PASS** |
| **Headline gate** — cross-form, 5 pairs, 110 questions | 9 usefully pre-filled (8%), 0 incorrect, 0 traps hit | ≥ 50% / < 5% | **FAIL** |

Two things to hold apart. The labelled ceiling on this fixture set is **26%** — only 29
of the 110 cross-form questions have any legitimate prior, because the fixtures were
built to be *different* forms; no matcher reaches 50% here. Of those 29 the matcher
recovers 9 with no false claim. Every remaining miss is a synonym pair ("measure GHG
emissions" / "calculate carbon footprint", "whistleblowing channel" / "confidential
channel for reporting violations") that term matching cannot see. Widening (a synonym
table, or re-using the ESG pack's topic classification as an agreement signal) is
possible and was deliberately not done: the instruction is stop, don't widen.

**Consequence:** the €99 ships on the annual-renewal promise; cross-form recovery is
shown in-product as a sourced bonus and is not claimed on the site. Revisit only if real
buyer forms show a higher ceiling than the generated set.

## 6. Response pack format v1

`<company>.responsepack.json` — the portable record. JSON, documented here, versioned.

```json
{
  "format": "esg-passport-response-pack",
  "version": 1,
  "createdAt": "2026-09-13T10:00:00Z",
  "company": { "name": "…", "country": "DE", "reportingPeriods": ["2025"] },
  "facts": [ { "key": "electricityKwh", "value": 2363000, "unit": "kWh", "period": "2025", "source": { "type": "document", "name": "Stadtwerke_2025.pdf" }, "approvedAt": "…" } ],
  "answers": [ { "question": "…", "normalizedKey": "…", "answer": "…", "referenceId": "ENV2.2", "category": "Environment", "source": { "file": "buyer-2025.xlsx", "sheet": "Questionnaire", "row": 7 }, "sourceDate": "2025-09-30", "approvedAt": "…", "edited": false } ],
  "rejected": [ { "normalizedKey": "…", "priorAnswerHash": "…", "rejectedAt": "…" } ],
  "policies": [ { "id": "code-of-conduct", "status": "available", "adoptedOn": "2025-03-15", "reviewDue": "2026-03-15", "file": "CoC_v3.pdf" } ],
  "certificates": [ { "name": "ISO 14001", "issuedOn": "2024-06-01", "expiresOn": "2027-06-01" } ],
  "passClaims": [ "qfp-v1-21-…" ],
  "documents": [ { "name": "Stadtwerke_2025.pdf", "sha256": "…", "extractedFields": ["electricityKwh"] } ]
}
```

Rules:
- **No raw document bytes.** `documents[]` holds name, hash and which fields came from
  it. An "include copies of my documents" option can add a `documents/` folder inside a
  zip variant later; not v1.
- **`passClaims` travels** so a second machine recognises the paid questionnaire (Gate 3).
  The licence key does not travel; it is re-entered — LemonSqueezy allows deactivate/
  activate and the UI already has both.
- **Encryption optional, off by default (decided 2026-09-13)**: WebCrypto AES-GCM,
  PBKDF2 from a passphrase, file extension `.responsepack.enc`. The pack holds what the
  user has already decided to send buyers — approved answers, facts, certificate dates —
  never bills or payroll, so its sensitivity is "internal document", and an always-on
  passphrase would turn a forgotten word into a lost company record with nobody able to
  recover it. The save dialog offers it as: *"Protect with a passphrase — if you lose it,
  nobody can open this file, including us."* A passphrase strength check applies. No key
  escrow anywhere.
- **The unencrypted pack starts with a `_readme` field** stating what it contains and
  that it holds no raw documents, so anyone opening it in a text editor sees the boundary
  before the data.
- **Secrets never included** — `backup.js`'s `redactSecretsForBackup` is reused verbatim.
- **Import merges**, never replaces: facts by key+period (newer `approvedAt` wins),
  answers by `normalizedKey` (newer wins, both kept in history), rejected union,
  passClaims union.
- `masterAnswers`, `requests`, `savedResults`, the monthly data grid and `settings` are
  **not** in the pack. What the app needs from them is derived at import.

Gate 3: on a second browser profile with no localStorage, open the app, import the pack,
re-enter the licence key, upload the same questionnaire → it is recognised as the paid
one, recovered answers appear, download works. Scripted as a manual checklist; the
fingerprint check is unit-tested.

## 7. Journey constraints this design imposes

- The upload step must retain the original `File` bytes in memory for the session and in
  the pack-save prompt ("your original file is not stored; keep it").
- The mapping/confirm screen shows question column **and** answer column, with the
  answer-cell source stated in plain words.
- The results header is the five-group line; the download button is "Download the
  completed original file"; the second button is "Save your response pack".
- Nothing here requires the Data, Policies, Requests, Report or Documents pages.

## 8. Build order and size

| Step | Where | Size | Unblocks |
|---|---|---|---|
| 1. `location`/`answerCell`/`locations` on `ParsedQuestion`; form scan; answer-cell detection; dedup keeps locations | `response-ready` parser | 3–4 days | everything |
| 2. Re-run benchmark; fix until ≥ 95% found, 0 false positives | benchmark | ½ day | Gate 1 input side |
| 3. Writer (JSZip + DOM), refusal rules, calcPr | `response-ready/src/engine/workbookWriter.ts` | 2 days | Phase 2 |
| 4. `gate1-roundtrip.mjs` + `gate1-excel-check.ps1`; add one chart/pivot fixture saved from Excel | scripts | 1 day | **Gate 1** |
| 5. Mapping dialog: answer column select; download button; file naming | `esg-passport` Respond | 1–2 days | Phase 2 shippable |
| 6. `PriorAnswer` import; tier-1 matcher with exact + refId + guarded overlap; `source`/`staleness` on drafts; `recovered` group | engine + `coverage.js` | 3 days | Phase 3 |
| 7. `reuse-pairs.json` hand labels; `gate2-reuse.mjs` | benchmark | 1 day | **Gate 2** |
| 8. Accept/edit/reject + batch accept; decisions into pack | Respond | 2 days | Phase 3 shippable |
| 9. Pack v1 save/load/merge, optional encryption, passClaims | `src/lib/responsePack.js` (from `backup.js`) | 2 days | **Gate 3** |

Roughly four working weeks part-time, matching the plan's Phases 2–4 time-boxes. Steps 1–4
are engine-only and land via one `response-ready` PR + re-vendor; nothing in the app
changes until step 5.

## 9. Decisions taken (Cat, 2026-09-13)

1. **Provenance never enters the buyer's workbook.** Only the answer cells change. Sources
   are a separate CSV download and live in the response pack. (Section 3.)
2. **Pack encryption is optional, off by default**, offered with a plain lost-passphrase
   warning and a strength check; the unencrypted pack carries a `_readme` boundary
   statement. (Section 6.)
3. **Same-form reuse is the ship gate; cross-form reuse is the headline gate.** The €99
   ships on the annual-renewal promise if same-form clears ≥ 95% / 0 incorrect; cross-form
   only earns marketing copy at ≥ 50% / < 5%. (Section 5.)

No open decisions remain before implementation step 1.

# Reset audit — existing repos against the narrowed product

**Date:** 2026-09-11. **Scope:** task 1 of the bounded side-business reset (audit only; no
code changed). Grounded in `esg-passport@main` (+ `ui/evidence-workspace` working tree),
`response-ready@main`, `esgforsuppliers` `fix/sitewide-questionnaire-pass-ctas`.

The narrowed product: Excel in → reuse previous answers + verify against records →
original Excel out; €99; local; portable record; no account, no review, no portals.

Verdict per phase, then the findings behind each.

| Phase | Have | Missing | Blocker-class finding |
|---|---|---|---|
| 1 Benchmark | 1 real inbound xlsx (91 q) + 3 CSVs | 9–14 more, year-over-year pairs, layouts | The 11 "harness" xlsx files are the app's **own exports**, not questionnaires |
| 2 Excel round-trip | Both libraries already installed | Everything: no load-modify-save path, no cell addresses on questions | Parser **dedups** identical question text → 1:1 row mapping is already lost before write-back |
| 3 Previous answers | Term-overlap matcher + master-answer store | A "completed questionnaire" as an input type; provenance (file/date/staleness); accept/edit/reject UI | `findMasterAnswer` is topic-equality; no confidence, no source |
| 4 Portable record | `backup.js` export/import, secrets redacted | Stable documented format, version, approved/rejected answers, dates; import on a device with no licence | Blob includes nine data domains the record doesn't need |
| 5 Collapsed journey | Upload-first onboarding, confirm step, journey spine | Removal of 6 routes + the doc-ask interstitial | 2,868-line `Respond.jsx` owns the whole paid path |
| 6 Offer | €99 Pass live, fingerprint-enforced, credit rule decided | Nothing new; only copy | — |
| 7 Site | Ladder + comparison pages on unmerged branches | Before/after workbook; vocabulary swap | ~13 "200+ templates" claims still live |
| 8 Events | Allowlisted `track()`, no filenames/text | 3 new events, 2 renames | Already privacy-compliant |

---

## Phase 1 — the benchmark set does not exist yet

**Inbound questionnaire files actually in the repos:**

| File | Kind | Notes |
|---|---|---|
| `testing/tough-esg-questionnaires-2026-07-13.xlsx` | real inbound xlsx, 91 q from 96 rows | the only real one; single sheet |
| `media/demo-assets/musterwerk-buyer-questionnaire.csv` | demo buyer form | CSV, so no formatting to preserve |
| `phase0testing/manual-english-trickcases.csv`, `manual-german-questionnaire.csv` | parser trick cases | CSV |
| `strategy/questionnaire_responses.xlsx` | unknown | check before counting it |
| A (17 q), B (81 q), C (51 q) from the Sept measurement | **not checked in** | the spec's headline numbers cannot be re-run |
| Drive Sustainability SAQ PDF, EcoVadis PDF | **not checked in** | PDF anyway — out of scope |

`phase0testing/harness/latest/*.xlsx` (11 files: ecovadis, cdp, sedex…) are all 4 sheets /
23 rows / 8 merges — they are `generate-export-fixtures.mjs` output, i.e. **our export
audit**, not buyer questionnaires. Do not let them into the benchmark.

**So Phase 1 starts from one file.** Sources for the other 9–14: real questionnaires Cat
has received or seen (anonymised), the buyer forms behind the ~84 guides (EcoVadis
offline sheet, Drive Sustainability SAQ, IntegrityNext export, bank ESG forms, Amfori
BSCI SAQ, a retailer supplier form), and 3–4 hand-built "hostile" layouts (title banner +
merged header, two-column Q/A on multiple sheets, dropdown answer cells with validation,
instructions interleaved, formulas in score cells, hidden scoring sheet). Year-over-year
pairs: take four of the above and produce a "last year, completed" twin by filling the
answer column with plausible approved answers — that twin is also the Phase 3 input.

**Baseline recording:** the harness in `scripts/export-harness-utils.mjs` +
`audit-exports.mjs` already runs `createResponseEngine(esgDomainPack)` headlessly and
writes TSV (`baseline-before-gate.tsv`, `after-b3.tsv`). Extend it, don't replace it. Add
columns: questions detected / rows populated / missed (manual count) / proven-by-records /
suggested / needs-you / copying-required (yes until Phase 2) / minutes.

**Vocabulary swap (cheap, do now):** `i18n.js` has 218 `coverage.*` keys and 281 lines
mentioning coverage/spine/workspace. The rename is mechanical — the seven terms in the
brief map to key *values*, not key names, so it is a copy pass in one file (EN+DE), no
code. Note `spine.answers` "What you can answer" → "Your progress"; `coverage.title`
"Questionnaire summary" → keep; `evidence.home` "Workspace" → "Your saved response pack".

## Phase 2 — Excel-in/Excel-out: nothing exists, and the parser has thrown away what write-back needs

**Libraries:** `xlsx` 0.18.5 (SheetJS CE, parse) and `exceljs` 4.4.0 (write) are already
dependencies of both repos. No new dependency is required for either approach below.

**What the parser keeps per question** (`types/engine.ts:18`): `id, rowIndex, text,
category, subcategory, referenceId, rawRow`. What it does **not** keep: sheet name (only
used as a category label when >1 sheet, `questionParser.ts:1003`), the absolute row (rowIndex
is `i + 2` relative to the detected header row, `:903`), the question column letter, and
any notion of an **answer column**. Write-back needs `{sheet, row, answerCol}`.

**Dedup destroys the row map** (`questionParser.ts:1007–1012`, `questionIdentity` `:170`):
two rows with the same text + category collapse to one question. Common in real forms
("Please provide evidence" repeated under every section; "Comments" rows). After dedup
there is no way to write the answer back into both cells. Fix: keep one *analysis* question
with `locations: [{sheet,row}…]`, never drop a location.

**`raw: false`** (`:979–984`) reads formulas as their cached formatted values. Harmless
for parsing; it means the parser cannot tell a formula cell from a value cell, so the
mapping step must re-read the target column with `raw: true`/cell objects to refuse
writing over formulas.

**Two viable write-back designs** (Phase 2 technical-design input, decision pending):

| | A. ExcelJS load → set cells → write | B. Surgical zip/XML patch (JSZip + edit `sheetN.xml` / `sharedStrings.xml`) |
|---|---|---|
| Preserves | sheets, order, hidden state, merges, data validation, formulas (+cached), comments, column widths, styles, rich text | **everything** — only the touched `<c>` elements change |
| Loses | charts, drawings, pivot tables, slicers, some conditional-format edge cases, macros in `.xlsm` | nothing known; risk is *our* bug corrupting the XML |
| Effort | low (library does the work) | medium (shared-string vs inline-string, copy the neighbour cell's style index `s`, handle `t="s"`/`t="inlineStr"`, recalc flag) |
| Gate-1 odds on plain questionnaires | high | high |
| Gate-1 odds on forms with scoring charts/pivots | fails visibly | passes |
| Honesty of "your file back" | "mostly your file" | "your file" |

Recommendation for the design doc: **B as the writer, A as the validator** (load the
patched file with ExcelJS in a test to assert cell values landed and nothing else
changed). B is the only one that can honestly say "unchanged except the answer cells."
Either way `xlsx` stays for reading.

**Answer-column detection** does not exist; `detectColumnMapping` finds question /
category / reference / required columns only. Need: header match ("Answer", "Response",
"Antwort", "Supplier response", "Your answer", "Comments"), else first empty column right
of the question column, else user picks. The existing `respond.columnMapping` dialog
(`Respond.jsx:145–147`) is the right place to add it.

**Do-not-overwrite rule:** trivially implementable once cells are read as objects; also
surfaces "existing answers" as a Phase 3 source for free (see below).

## Phase 3 — previous-answer reuse: a matcher exists, the input type doesn't

**What exists:**
- `response-ready/src/engine/libraryMatcher.ts` — `findLibraryMatches()`: term-overlap
  scoring over `BusinessLibraryItem`s (stopword-stripped, `DEFAULT_MIN_SCORE = 8`, limit 5),
  honours `expiresOn`, links `EvidenceItem`s. Generic, unit-tested, usable as the
  step-1 matcher **with** the caveat in the brief: it scores similarity, not truth.
- `response-ready/src/product/libraryPromotion.ts`, `responseProject.ts` —
  `applyReviewDecision`, `promoteApprovedItems`: an approve/reject → library pipeline.
  Built for the playbook/RFP pack; the shape is exactly "approved previous answer".
- `esg-passport/src/lib/store.js:597–634` — `masterAnswers` store; `findMasterAnswer` is
  topic-equality or keyword-includes: **no score, no source, no date**. Fed by the
  "save to library" button in Respond. Nobody has ever populated it outside the demo seed.
- `Respond.jsx` **has no reuse path at all** — `grep masterAnswer|findLibraryMatches` →
  only a localStorage backup/restore around demo mode (`:741–759`).

**What is missing:**
- "Completed questionnaire" as an input: parse the file with the question column **and** a
  filled answer column → `{question, answer, sourceFile, sourceSheet, sourceRow, date?}`
  items. This is the same parser plus the answer-column detection from Phase 2, so Phase
  2 and 3 share one piece of work.
- Per-suggestion provenance fields on `AnswerDraft` (`source: 'previous' | 'record' |
  'document' | 'suggested' | 'none'`, `sourceRef`, `sourceDate`, `staleness`, `matchScore`).
  `answerConfidence`/`confidenceSource` exist; the source enum does not.
- Staleness: any previous answer containing a year, a figure with a unit, or a date gets
  `staleness: 'check-figures'` regardless of match score. Cheap regex; matches the brief's
  "never treat similarity as proof."
- Accept / edit / reject per row. Respond has edit (`editingAnswerId`) and N/A; it has no
  reject-and-remember. `responseProject.applyReviewDecision` is the model to reuse.
- The 5-tier source order in the brief maps onto existing code as: (1) previous-answer
  matcher → (2) `dataRetrieval` company facts → (3) `extractFieldMap` document values →
  (4) `answerTemplates`/`matrixGenerator` → (5) unanswered. (2)–(5) is today's pipeline;
  (1) is new and must run **first** and win ties.

**Gate 2 risk, stated now:** term-overlap will produce false positives on generic
questions ("Do you have a policy?" ×12). The <5% materially-incorrect bar needs the
matcher to require category/section agreement or a reference-id match when the question
text is short. Measure on the year-over-year pairs before tuning.

## Phase 4 — portable record: 70% built, wrong shape

**What exists:** `src/lib/backup.js` — `serializeBackup` / `mergeImportedBackup` /
`redactSecretsForBackup` (any key matching `api[-_]?key|secret|password|token|…` stripped,
import never clobbers the local key). Wired to Settings. This is the file.

**What the blob currently contains** (`store.js:20–50`): monthly/annual ESG records,
`policies`, `requests`, `documents`, `masterAnswers`, `savedResults`, `settings`. The
narrowed record needs: approved company facts, approved previous answers (+source refs +
dates), reporting periods, certificate/policy dates + expiry, corrections, rejected
answers. Of that, only `policies` (has `lastUpdated`, no expiry) and `masterAnswers`
(no source/date) exist; the rest is either the carbon-tracker grid (out of scope) or new.

**Decisions for the design doc:**
- Format: JSON, `{ format: 'response-pack', version: 1, … }`, documented in the repo.
  Extension `.responsepack.json` (or `.esgpack`); keep it JSON so "deletable by deleting
  the file" is also "readable by opening the file".
- Encryption: "preferably encrypted" — WebCrypto AES-GCM with a user passphrase is ~60
  lines and keeps it account-free. Trade-off: a forgotten passphrase is a lost record.
  Recommend **optional** encryption, off by default, one checkbox at save.
- Raw documents: never included by default (bills are big and are the confidential
  thing). Store `{fileName, hash, extractedFields}` only.
- **Gate 3 blocker to design around:** the licence. Import on a second machine restores
  the record, but the €99 pass is a LemonSqueezy licence key + a questionnaire
  *fingerprint* claim in localStorage (`questionnairePass.js`). Moving machines means
  re-entering the key **and** the claim must travel in the pack (it is a hash, not
  content) or the second machine sees a "second questionnaire blocked". Put the claim in
  the pack.

## Phase 5 — collapsing the journey: what to remove, what to keep

Routes today (`App.jsx:108–138`): `/onboarding`, `/`(Home), `/data`, `/evidence`,
`/policies`, `/documents`, `/report`, `/demo`, `/respond`, `/requests`, `/requests/:id`,
`/settings`, plus 8 legacy redirects.

| Keep on the paid path | Remove from the path (keep code or delete) |
|---|---|
| `/onboarding` (already upload-first, one screen) | `/` Home dashboard (345 lines) — the pack file replaces "workspace" |
| `/respond` = the job (upload → confirm → review → download) | `/data` (1,834 lines) — carbon-tracker grid; keep the store, drop the page |
| `/evidence` **inside** respond as an optional step, not a page | `/report` — standalone ESG report, excluded |
| `/settings` reduced to: licence, save/open pack, language | `/policies` + PolicyBuilder (847 + 1,606 lines) — "large policy-building workflows" excluded; keep the free template download reachable from a suggested answer, nothing more |
| | `/requests`, `/requests/:id` — buyer-request hub, excluded |
| | `/documents` — folded into the evidence step |
| | `/demo` — sample questionnaire; replace with the before/after workbook on the site |
| | The "Add evidence before we assess coverage" interstitial (`respond.evidenceStepTitle`) — show results, then offer evidence |
| | Readiness templates tab (`uploadTab === 'readiness'`), batch "export all templates", 6-language output switcher (keep EN+DE) |

`Respond.jsx` is 2,868 lines with 40+ `useState`s and owns upload, mapping, confirm,
generate, filters, edit, N/A, AI enhance (BYOK), export dialog, batch export, language
switch, pass claims, demo mode. The collapse is a split, not a rewrite: extract
`QuestionnaireIntake` (upload+map+confirm), `ReviewAnswers` (the list with
accept/edit/reject), `DownloadOriginal` (Phase 2). Leave generation where it is.

**Results header** the brief specifies ("81 found / 38 recovered / 9 supported / 17
suggested / 17 need you") maps to `summarizeCoverage` groups `fromRecords / partial /
written / unanswerable` plus one new group `recovered`. `coverage.js` already asserts
the groups partition the question count — extend the test.

## Phase 6 — offer: nothing to build

€99 Pass is live (LemonSqueezy variant recognised in prod, activation tested 2026-09-04),
one questionnaire enforced by fingerprint, €99-credits-against-€499 decided (mechanism
open). Actions: hide the €499 from the Pass result screen (`coverage.passportTitle` block)
until repeat usage exists; leave the SKU purchasable for anyone who finds it. The 3-pack
is a new LemonSqueezy variant + a `maxQuestionnaires`-style counter that the entitlements
comment says was removed for being unenforced — it would now be enforced via pass
claims, so it can come back honestly.

## Phase 7 — site: the branches already hold most of it

`esgforsuppliers` has `feat/ninety-nine-ladder`, `feat/passport-hero-honesty`,
`fix/copy-accuracy`, `fix/sitewide-questionnaire-pass-ctas` (current, unmerged) and
German comparison content. Missing: the before/after workbook screenshot (cannot exist
until Phase 2), the seven supporting points as a single block, and the vocabulary swap.
Still live and wrong: "200+ answer templates" (~13 places; defensible number is 70+).
Guide consolidation is the only traffic work — eleven EcoVadis guides → two.

## Phase 8 — events: compliant today, three additions

`track.js` is allowlist-only; every payload checked carries counts/extensions/outcomes,
never filenames or text (`respond_parse_completed` sends `questions: <count>`). Existing
events cover landing (`first_visit`), upload (`respond_upload_started`), parsed
(`respond_parse_completed`), result (`respond_answers_generated`), paywall
(`paywall_hit`), purchase (`license_activated`/`questionnaire_pass_claimed`). Add:
`previous_questionnaire_added`, `download_original_attempted`,
`second_questionnaire_processed` (the pass-blocked event already fires; the successful
second one does not). No renames needed.

Attribution caveat (unchanged): the app is proxied under `esgforsuppliers.com/app/*`, so
Passport events land in the esgfs Vercel project, not Passport's.

---

## What this audit changes in the plan

1. **Phase 1 is bigger than a week if the fixtures must be sourced.** Building the
   hostile layouts is a day; obtaining 6–8 real buyer forms is the unknown. Suggest 8 real
   + 4 hostile + 4 year-over-year twins = 16, and accept 10 if sourcing stalls.
2. **Phases 2 and 3 share one prerequisite:** questions must carry `{sheet, row, col}`
   and the parser must stop deduping locations. Do that first, in `response-ready`, and
   re-vendor. Everything else in both phases builds on it.
3. **The write-back approach is the one real technical decision** (A vs B above). Make it
   in the design doc with a 1-day spike on the 91-q file + one hostile fixture, not by
   argument.
4. **Phase 4 has a licence-portability problem** the brief didn't list; solve it in the
   pack format.
5. **Phase 5 is mostly deletion** — roughly 5,000 lines of pages leave the paid path.

## Next: task 2 and task 3

- **Task 2 (benchmark):** create `testing/benchmark/` with the 91-q file, the hostile
  layouts, and year-over-year twins; extend `scripts/audit-exports.mjs` into
  `scripts/benchmark.mjs` writing `testing/benchmark/baseline-<date>.tsv`. Needs Cat for:
  which real forms she can supply.
- **Task 3 (design):** `DESIGN-original-workbook-and-reuse.md` covering: `ParsedQuestion`
  location fields + de-dup change; answer-column detection; writer A vs B decision with
  spike results; `AnswerDraft.source` provenance; the 5-tier resolution order; staleness
  rule; pack format v1 incl. pass claim; Gate 1–3 test plans as runnable scripts.

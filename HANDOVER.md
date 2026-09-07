# Where this got to — 2026-09-07

Free journey redesign + the €99 ladder. Nothing is merged and nothing is deployed;
production still runs the old free tier that cannot open the reader's own file.

## Branches (all local, none pushed)

| Repo | Branch | State |
|---|---|---|
| `esg-passport` | `feat/coverage-report` | 20 commits ahead of `main`. 325 tests, build clean. |
| `esgforsuppliers` | `feat/ninety-nine-ladder` | 6 commits ahead of `master`. Build clean. |
| `response-ready` | `main` | **Pushed.** 698 tests, tsc clean. Vendored into the passport branch (`engineSha 2f5118d`). |

`esgforsuppliers` prod deploys from `master`, so **merging that branch is a release.**

To run it: `npm run dev` in `esg-passport`. A different origin from
`esgforsuppliers.com/app`, so you arrive as a FREE user, which is the path to test.

## Done and verified

- **Free may analyse, not finish.** `canUploadQuestionnaire` and `canGenerateAnswers`
  are separate flags; free brings its own questionnaire and its own documents.
- **Coverage report**, restructured after review: what we read (expandable) → what it is
  asking about, grouped E/S/G/company with the documents that answer each → add those
  documents, upload *or* type → five real answers in Respond's own badge styling →
  prices, each naming what it unlocks.
- **One spine** across dashboard, upload, evidence and report; finished steps carry their
  result ("36 questions"), not a tick.
- **One front door**; the duplicate dropzone is gone. Nav is two groups.
- **`/evidence`** — the page "add documents" lands on, instead of the Data page.
- **Question confirmation** for PDF and Word before anything is counted.
- **Parser**: wide-layout truncation fixed (the 90-char continuation cap, and "Total"
  matched as a prefix); EcoVadis evidence guidance no longer absorbed into questions or
  emitted as questions.
- **Figures**: rounded, and only shown when the answer actually states them.
- **Multi-bill extraction**: a queue, not a single slot; whole batch survives.
- **Extraction persists** — it used to sit unsaved in the form while the report went on
  asking for the bill you had just uploaded.
- **Site**: three rungs on all five ladder pages EN+DE, comparison table with a free
  column, guide prose corrected, `/passport` heroes lead with the free report.

## Open, in the order I would take them

1. **German questions get English answers.** `questionnaireLanguage.js` picks ONE language
   for a whole file by counting markers — deliberately, and the comment says why. A MIXED
   questionnaire (Cat's had EN and DE questions together) therefore answers everything in
   one language. Needs a per-question decision with a minimum-signal threshold falling
   back to the file's language, applied to matching AND generation. Biggest remaining
   correctness problem: a German supplier gets English answers to their own questionnaire.

2. **"Bitte Scope 2 nicht einschließen" is ignored.** The English "Scope 1 only? Do not
   include Scope 2" correctly matches `scope_1` alone; the German equivalent matches
   `scope_1` AND `scope_2` and returns the combined answer. German negation handling in
   the ESG rules.

3. **Undated bills still overwrite each other.** `handleBillExtracted` falls back to
   `${selectedYear}-${currentMonth}` when no period is detected, so several undated bills
   land on the same record and the last wins. Same-month same-field collisions are also
   silent, unlike the annual path which now names the clash. Fix shape: detect the
   collision (existing value + a different source document in `settings.dataSources`) and
   stage it for confirmation rather than writing over it.

4. **PDF partial recall.** The confirmation step makes it visible, not fixed — a Drive
   Sustainability SAQ yields 22 of roughly 50 questions.

5. **Two rows I could not reproduce** from Cat's Scope screenshot (Scope 2 showing the
   combined answer; Scope 3 showing the Scope 1 text). The engine gives the right answers
   for both with her data shape. Retest after a hard reload before chasing.

## Needs Cat, not code

- Whether to merge and deploy any of this. Site merge = production release.
- The topic mapping is a judgement call: `buyer_requirements` → governance,
  `transport` → environmental, company profile → its own "About your company" card
  rather than being filed under governance. Worth a look on a real questionnaire.
- The €99 card says "Every question we can draft, not just the first five". Deliberately
  not "all 36" — we cannot promise a count.
- The machine-written EN/DE wording in the answer-quality corpus went in without the
  line-by-line review the go-live doc asked for.
- A real second-questionnaire refusal has still never been tested (step 8 of
  `testing/QUESTIONNAIRE-PASS-MANUAL-TEST.md`).

## Design

Mockups the build follows: `design/*.dc.html` + `canvas.json`, published at
https://claude.ai/code/artifact/33245a4e-d4cb-4915-9a8b-f8510d40275b
The seeded canvas HTML is build output and gitignored; re-seed from the artboards.

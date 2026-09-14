# Answer-quality baseline — 2026-09-14

What the engine drafts, question by question, before the question bank exists. Produced by
`scripts/score-answers.mjs` against the full fixture record (`testing/fixtures/esg-for-suppliers.json`:
289 FTE, Scope 1/2, electricity + gas + diesel, 13 policies incl. Health & Safety / Environmental /
Energy Management / Supplier Code of Conduct, `humanRightsPolicyStatus: implemented`). Engine =
response-ready `9536f1b` (PR #13, unasked-figure fixes included).

Verdicts were filled by hand in the `verdict` column — the harness cannot see a wrong template:

| verdict | meaning |
|---|---|
| correct | the draft answers what the cell asks, with the record's facts |
| partial | right question; a sub-part, exclusion or record fact is missed |
| wrong | answers a different question, carries figures the cell did not ask for, or contradicts the record |
| unanswered | honest "not on record" — the right reply when the record holds nothing |
| no-match | no domain found at all |

## Drive Sustainability SAQ 5.0 — `answers-baseline-2026-09-14-saq5.tsv`

The public automotive supplier form (BMW, Bosch, VW, Volvo… via NQC), never seen by the rules.
Source: <https://www.drivesustainability.org/wp-content/uploads/2023/04/SAQ-5.0_readytouse_EN_Final.xlsx>
(`fixtures/08-drive-sustainability-saq-5.0.xlsx`). 61 questions: 2 headcount + 22 numbered + 37
conditional sub-questions (`fixtures/08-drive-sustainability-saq-5.0.questions.txt`).

**Parser:** `engine.parseFile` on the workbook finds **7 of 61** — the form is column-A numbered
questions with tick-box options in column C and guidance in column K, no answer column. The
answer baseline below therefore ran on the extracted question list (`--text`), bypassing the parser.
Both numbers are the baseline; they are two different layers.

**Answers (61):**

| correct | partial | wrong | unanswered | no-match |
|---:|---:|---:|---:|---:|
| 7 | 8 | **27** | 10 | 9 |

44 % wrong on a form whose questions the record can mostly answer. The pattern: SAQ 5.0 asks
*"Do you have a formal health and safety policy?"* — the record has one — and the draft gives
TRIR. It asks *"Do you organise training on the Code of Conduct?"* and gets training hours per
employee. It asks about an energy management system and gets kWh. Policy-existence yes/no
questions, the bulk of every SAQ, are answered by listing every policy or by the nearest KPI.
The `note` column names the record fact each wrong draft ignored.

## Built-in templates, every 6th question — `answers-baseline-2026-09-14-templates.tsv`

The app's own 11 templates (285 questions; rules were built against these, so this is the
best case). 48 scored:

| correct | partial | wrong | unanswered | no-match |
|---:|---:|---:|---:|---:|
| 26 | 0 | **17** | 2 | 3 |

Three verdicts changed from the pre-#13 scoring (Scope 1 "for context" and two data dumps),
noted in the `note` column. 237 rows remain unscored.

## Gate for the question bank (from the 2026-09-14 proposal)

On held-out forms: wrong ≤ 2 %, correct ≥ 60 % with a full record. Re-run:

```
node scripts/score-answers.mjs --text testing/benchmark/fixtures/08-drive-sustainability-saq-5.0.questions.txt --out testing/benchmark/out/saq5-answers.tsv
node scripts/score-answers.mjs --templates --out testing/benchmark/out/templates.tsv
```

then copy the earlier verdicts across by `ref`/`n` and re-judge only rows whose draft changed.

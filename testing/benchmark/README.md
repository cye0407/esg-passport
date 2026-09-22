# Questionnaire benchmark

The fixture set behind Phase 1 of the side-business reset (see `RESET-AUDIT-2026-09-11.md`).
Its job is to stop the rebuilt product from flattering itself: every gate in the plan is
measured against these files, and the baseline TSV records what the product did before
any of the reset work.

- `manifest.json` — one entry per workbook: where it came from, what it stresses, the
  hand-counted questions (with sheet row and the cell the answer belongs in), and the
  manual column mapping a user could pick when auto-detection fails.
- `fixtures/` — the workbooks. Real buyer forms are anonymised before they go in.
- `baseline-<date>.tsv` — output of `node scripts/benchmark.mjs`. Never edit by hand.
  Columns are explained at the top of the script. `minutes` (approximate completion
  time) is filled in by hand after a timed manual run.

## Rules for adding a fixture

1. Count the questions by hand first and write them into `expected` with their row and
   answer cell. Sub-rows of a tick list are not questions. A question wrapped across two
   rows is one question on its first row.
2. Say what the file stresses. If it stresses nothing the set doesn't already cover, it
   does not earn a place.
3. Year-over-year twins: the same workbook with the answer column filled by plausible
   approved answers. Name them `<id>-completed-<year>.xlsx`; they are the Phase 3 input.
4. Never put a real company's name, vendor number or figures in a fixture.

## Status, 2026-09-13 — 12 fixtures (7 questionnaires + 5 completed twins)

| # | Fixture | Origin | Stresses |
|---|---|---|---|
| 01 | retailer-supplier-form (+ twin) | hand-built form, Downloads | decoy sheet, banner, no header, answer cells by shading alternating C/D, wrapped question, option rows, statement questions, misplaced validation |
| 02 | clean-table-stress-96 | July matching stress set | 4 sheets, German, mixed language, honest-gap questions — the ceiling |
| 03 | platform-offline-sheet (+ twin) | generated | instructions sheet first, merged theme bands, dropdowns, hidden scoring sheet with formulas over answers, frozen panes |
| 04 | automotive-saq (+ twin) | generated | numbering inside the question cell, sub-questions, italic guidance rows, checkbox row |
| 05 | multisheet-qa-form (+ twin) | generated | questions on four sheets, two without a header row, buyer pre-filled answer cells, field-shaped questions |
| 06 | german-bank-form | generated | German, visible formula column beside answers, units column, total row and signature below |
| 07 | retailer-wide-layout (+ twin) | generated | header on row 10, vertically merged category cells, answer column not adjacent to questions, hidden formula column |

Fixtures 03–07 and all twins are produced by `scripts/generate-benchmark-fixtures.mjs`;
their `expected` lists are emitted by the generator, so the manifest cannot drift from the
files. No real buyer forms were available; these are built to the shapes those formats are
known to use, with original question text. Real anonymised forms should replace generated
ones as they become available — a generated fixture proves the parser handles a shape, not
that the shape is what buyers actually send.

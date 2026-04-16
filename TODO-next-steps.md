# ESG Passport Localization Follow-Up

## Change Log

Output localization now supports realistic translations for `it`, `pl`, `de`, `nl`, `fr`, and `es` across generated responses and exports.

Work completed in `esg-passport/src/lib/translations.js`:

- Added period-aware translation coverage for:
  - renewable share
  - waste
  - water
  - hires/departures
  - turnover
  - H&S headers
  - Scope 2 detail lines
- Restored proper diacritics and native-language spellings.
- Restored previously dropped rules for:
  - TRIR
  - lost time incidents
  - fatalities
  - training patterns
  - company profile patterns
  - `This information is not currently tracked or reported.`
- Added coverage for live engine boilerplate and template variants:
  - `The legal name of our organization is ...`
  - `Registered address: ...`
  - `Ownership structure: ...`
  - `Revenue band: ...`
  - `This data covers the reporting period ...`
  - `Renewable electricity accounted for ...`
  - `This disclosure is partially tracked ...`
  - `This data is not currently tracked. We do not have sufficient information to answer this disclosure.`
  - `Data gaps: ...`
  - `A formal Code of Ethics and Anti-Corruption Policy has not yet been established.`
  - `Lost Time Injury Rate (LTIR) ...`
  - `Total hours worked ...`
  - zero-fatalities follow-up note
  - GHG inventory improvement note

Export and response flow work already in place:

- Respond page language selection persists.
- Answer drafts are localized before export.
- Export labels/workbook strings are localized.

Validation completed:

- `npx eslint src/lib/translations.js src/lib/respondExport.js`
- `npm run build`

## Decisions To Make

### Not Urgent

- Decide how to support multilingual questionnaire intake.
- Decide whether intake support should start with Italian only or all supported output languages.
- Decide whether to handle non-English intake by:
  - pre-translating uploaded questions into English before matching
  - adding multilingual keyword rules directly
  - combining both approaches
- Decide whether English ESG acronyms and some H&S labels should remain untranslated by policy in certain languages.
- Decide whether company profile responses should stay sentence-based or move to a more structured format for cleaner multilingual rendering.

### Urgent

- Fix activation-key/license transfer flow so an existing key can be deactivated and re-activated on the live production site.
- Check whether the failure is caused by environment mismatch, stale activation state, or the production deactivate/validate API path.

## Known Limitation

Uploaded non-English questionnaires are not handled well yet.

Current state:

- the parser should still extract questions from uploaded files
- question matching is still English-first
- output language localization happens after matching/generation

Effect:

- an Italian questionnaire will usually parse
- many Italian questions will match with lower confidence unless they include universal ESG terms such as `Scope 1`, `Scope 2`, `kWh`, `tCO2e`, `ISO 14001`, `TRIR`
- results may skew toward generic, partial, or unmatched drafts

## Recommended Next Step Plan

1. Commit the current translation/export work as a clean checkpoint.
2. Add multilingual intake support as the next focused task, starting with Italian.
3. Review the matching pipeline in `response-ready` and choose the intake strategy:
   - translate uploaded questions to English before routing
   - add Italian keyword/domain rules
   - or implement both with translation fallback
4. Build a small fixture set of real non-English questionnaire prompts:
   - Italian first
   - then German/French/Spanish if useful
5. Add tests for multilingual intake and routing so future changes are verified end-to-end.
6. Re-test the full flow:
   - uploaded questionnaire
   - question matching confidence
   - generated answer/draft quality
   - localized export output

## Current Status

- Changes are saved locally in the repo files.
- This follow-up note is now saved locally.
- The changes have not been committed to git yet.

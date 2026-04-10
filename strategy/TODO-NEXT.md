# Next Session TODO

Last updated: 2026-04-09

## Highest priority — data model gaps

### 1. Split workAccidents into three fields
Currently the Data page has one bucket called "Work Accidents" that's used as
a stand-in for recordable incidents, lost-time incidents, AND fatalities.
These are three different metrics in standard safety reporting (TRIR, LTIR,
fatality count) and conflating them is wrong.

**Fix:** add three fields to the healthSafety section on the Data page:
- `recordableIncidents` (currently mislabeled as workAccidents)
- `lostTimeIncidents` (separate count)
- `fatalities` (separate count)

Also update:
- `dataBridge.js` to forward each separately (not all aliased to lostTimeIncidents)
- The H&S templates to read from the right field for each question
- Migration: existing `workAccidents` values should map to `recordableIncidents`
  to avoid breaking existing user data

### 2. Expand social metrics in the data model
The data model is environmental-heavy. Social side gaps that keep producing
"Unknown — input required" for common questionnaire questions:

- **Workforce turnover rate** — voluntary + involuntary, per period
- **Training completion rate** vs raw training hours
- **Collective bargaining coverage %** — percent of workforce covered by CBAs
- **Diversity beyond binary gender** — leadership diversity, age bands, disability
- **Living wage compliance** — yes/no + methodology
- **Worker grievance mechanism** — exists yes/no + cases reported

Don't build all of these tomorrow. Pick the ones that show up most in real
questionnaire test runs.

### 3. Confirm & test the dataModel/template fixes from today
- Run the EcoVadis sample with a fully populated Company Profile + at least one
  month of operational data
- Re-check the 9 questions that were failing — confirm each now produces an
  answer (not "Unknown — input required")
- Note any NEW gaps discovered, add to this TODO

## Medium priority — UX

### 4. Source-line + category merge with deep link (deferred from earlier)
On answer cards, merge "Based on: 45,000 kWh (2025-01)" + the category label
("Environmental") into one clickable element that jumps to the source row on
the Data page. Would let users verify and edit data in one click.

### 5. Per-answer "show in English" link
Once translations land (or even before), add a small "show in English" link
on each answer card so users can spot-check translated content against the
source. Builds trust during the early translation phase when grammatical
roughness may exist.

### 6. CSV importer multilingual column synonyms
The `buildColumnMap` in `csvImport.js` only matches English column headers
(`electricity`, `water`, `employee`, etc.). German users exporting their
DATEV/Lexware bookkeeping CSVs have headers like `Strom`, `Wasser`,
`Mitarbeiter`, `Unfälle`. Add multilingual aliases — pairs nicely with the
keywordRules.ts multilingual pass when translations land.

## Low priority — defer until signal

### 7. Just-in-time field prompts on answer cards
The "instead of asking for 20 profile fields upfront, ask for the specific
field a question needs in the moment it's needed" pattern. Bigger lift,
depends on the engine exposing per-question field requirements. Wait until
the Company Profile form has actual usage signal showing which fields users
skip.

### 8. Add latent missing-domain test
Now that the dataModel.ts switch must stay in sync with keywordRules.ts
domains, write a small unit test that grep both files and asserts every
domain referenced in keywordRules has a case in dataModel. Catches the
"silently broken" bug pattern that bit us today.

## Critical — do not forget before any commit

### 9. Revert the dev hardcode in LicenseContext.jsx
`src/components/LicenseContext.jsx` line 25 has `useState(true)` instead of
`useState(false)`, and the `checkLicense()` call in the mount effect is
commented out. Both are marked with `DEV:` comments. Revert before commit.

## Done today (for reference)
- Added 6 missing dataModel switch cases
- Added wastewater/effluents template
- Industry-conditioned fallbacks for fuel/H&S KPI/transport/fleet templates
- Added hoursWorked field to Data page (store + dataBridge + TRIR calc
  already supported it; just needed the UI input)
- Removed broken language switcher from Respond + UpgradeGate marketing line
- Split workAccidents into recordableIncidents / lostTimeIncidents / fatalities
  (with backward-compat alias on read so existing test data still loads)
- Added domain-coverage Vitest test (response-ready/src/__tests__/domainCoverage.test.ts)
  that asserts every keywordRules domain has a matching dataModel case
- Added multilingual CSV column synonyms (DE/PL/FR/ES/IT/NL) to buildColumnMap
- Source-line + category merge on answer cards: now a single clickable Link
  to /data?period=YYYY-MM. The Data page reads the period query param and
  jumps to the right year on load.

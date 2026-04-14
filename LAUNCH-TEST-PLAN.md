# ESG Passport Launch Test Plan

Last updated: 2026-04-14

## Purpose

This document is the launch-readiness test plan for ESG Passport. It defines:

- the required order of review
- hard gates before persona testing
- the canonical scenario pack all reviewers must use
- reviewer prompts
- launch decision rules
- a trackable checklist for sign-off

## Ground Rules

- Persona testing does not start until known round 2 engine issues are fixed.
- English source copy must be frozen before language review begins.
- Designer review runs first; ESG and language review follow after blocker/high wording fixes land.
- All reviewers use the same canonical scenario pack so findings are comparable.
- The product is a compiler, not an editor. If the user did not provide the fact, the product must not imply it.

## Reviewer Model

- All reviewer roles (Designer, ESG expert, Language expert, all personas) are run as AI agents using the prompts in this document against the frozen build.
- Each AI reviewer outputs a findings list following the output format in its prompt.
- Cat Yeldi performs the final human sign-off at each phase exit before the next phase starts, and is the sole decision-maker on severity classification and deferral.
- Tracking-table "Reviewer:" fields should read `AI ({model}) — signed off by Cat Yeldi YYYY-MM-DD`.

## Launch Target

- Target launch date: **2026-04-20 (Monday)**.
- 6 days from 2026-04-14. This is aggressive; day-by-day budget below.

| Day | Date | Work |
|---|---|---|
| 1 | Tue 2026-04-14 | Phase 0.1 (license revert), 0.2 (engine fixes: 6 questions + topic routing), 0.3 (EN freeze), 0.4 (scenario pack) |
| 2 | Wed 2026-04-15 | Phase 0.5 (baseline evidence pack) + Phase 1A Designer review + apply blocker/high wording fixes |
| 3 | Thu 2026-04-16 | Phase 1B ESG expert + 1C Language expert in parallel |
| 4 | Fri 2026-04-17 | Apply Phase 1 blocker fixes + Phase 2 personas P1–P6b in parallel |
| 5 | Sat 2026-04-18 | Apply Phase 3 blocker fixes + regression canaries P1 + P3 + P5 |
| 6 | Sun 2026-04-19 | Release hygiene: production license, remove test keys, tag release, final human sign-off |
| 7 | Mon 2026-04-20 | Deploy + launch |

If Phase 0.2 (engine fixes) isn't green by end of day 1, slip launch by one week rather than carry fabrication risk into persona testing. **Shipping a compiler that invents answers destroys trust faster than a one-week slip.**

## Verified Language Scope

Do not use a single generic "supported languages" claim. The product currently has split localization layers. Verified 2026-04-14 against source.

- Answer/output/export localization (source: `src/lib/translations.js:1` — `SUPPORTED = {en, de, pl, fr, es, it, nl}`):
  - EN
  - DE
  - PL
  - FR
  - ES
  - IT
  - NL
- UI localization (source: `src/lib/i18n.js:268` — `UI_LANGUAGES`):
  - EN
  - DE
  - FR
  - ES
  - PT

Implications:

- Answer/output review languages: DE, FR, ES, IT, PL, NL
- UI review languages: DE, FR, ES
- PT is currently UI-only and should not be treated as a full launch language without answer/export support

## Phase 0 - Pre-Flight Gates

Nothing downstream starts until this phase is green.

### 0.1 License gate realism

- [ ] Revert any `LicenseContext` dev hardcode
- [ ] Verify real activation/deactivation flow
- [ ] Verify no fake paid-state assumptions remain in test flows

Why this is a gate:
Any end-to-end test without the real license path is false signal.

### 0.2 Engine audit blockers

- [ ] Resolve round 2 engine audit findings
- [ ] Fix topic-union routing issues
- [ ] Fix shallow topic-requirement issues
- [ ] Fix overstated UI metrics or trust-damaging wording
- [ ] Add explicit `Not applicable` handling where the current profile/data model wrongly collapses "not relevant to this business" into "not in place" or "not tracked"
- [ ] Fix annual bill extraction handling so year-only documents are not silently written into January monthly data
- [ ] Fix the six explicitly flagged demo questions:
  - [ ] `cb-13` science-based targets / decarbonization roadmap
  - [ ] `cb-45` fines / sanctions / legal proceedings
  - [ ] `cb-48` ESG-linked executive compensation
  - [ ] `cb-51` sustainability / ESG reporting claim
  - [ ] `cb-55` percent of critical Tier 1 suppliers assessed/audited
  - [ ] `cb-57` responsible sourcing / conflict minerals due diligence
- [ ] Resolve the 10 high-risk topic families (source: `esg-passport/FeedbackRound2.pdf`, 22 pages, audit dated 2026-04-10):
  1. Legal entity / group structure
  2. Certifications
  3. External assurance
  4. CSRD applicability
  5. Sustainability reporting
  6. Fatalities / H&S performance
  7. Human rights policy
  8. Grievance mechanism
  9. Supplier code / supplier assessment / supplier non-compliance
  10. Transport Scope 3
- [ ] Fix known routing unions: fatalities↔incident investigation, certifications↔assurance, CSRD↔reporting, supplier code↔monitoring, human rights↔freedom of association, transport emissions↔reduction measures

Why this is a gate:
Expert and persona review is wasted if reviewers just rediscover known engine failures.

Example already identified:

- vehicle / fleet fields for service-based businesses should be able to be `Not applicable`, not merely absent or "not in place"
- annual utility/invoice documents currently risk being mapped into `YYYY-01`, which is not trustworthy for annual totals

### 0.3 English freeze

- [ ] Freeze English source copy for launch scope
- [ ] Freeze the 4 shipped templates:
  - [ ] EcoVadis
  - [ ] CDP
  - [ ] Basic Supplier
  - [ ] CSRD / VSME
- [ ] Freeze launch UI strings
- [ ] Freeze export labels and warning copy

Why this is a gate:
Language review cannot begin until English is frozen.

### 0.4 Canonical scenario pack freeze

All reviewers must use the same artifact set. Each scenario = template fixture + company-profile state + saved evidence pack (answers + export).

- [ ] S1 Hartmann EN baseline — profile: `demo-data.js` + `demo-data.csv` (loaded via demo loader), template: `src/data/questionnaire-templates.js#ecovadis` (line 8)
- [ ] S2 `basic_supplier` sparse — profile: minimal (company name + FTE only), template: `src/data/questionnaire-templates.js#basic_supplier` (line 105)
- [ ] S3 `ecovadis` mid-quality manufacturing — profile: Hartmann, template: `src/data/questionnaire-templates.js#ecovadis` (line 8)
- [ ] S4 `cdp_climate` strong climate / weak governance — profile: Hartmann with governance fields cleared, template: `src/data/questionnaire-templates.js#cdp_climate` (line 61)
- [ ] S5 `csrd_vsme` full profile — profile: Hartmann fully populated, template: `src/data/questionnaire-templates.js#csrd_vsme` (line 130)
- [ ] S6 `comprehensive_buyer` — profile: Hartmann fully populated, template: `src/data/questionnaire-templates.js#comprehensive_buyer` (line 371). **Must include all 6 flagged questions cb-13, cb-45, cb-48, cb-51, cb-55, cb-57.**
- [ ] S7 Real English uploaded questionnaire — file: (attach path before freeze)
- [ ] S8 Bill-extraction path: invoice upload → Data review → Respond → export — file: (attach invoice path before freeze)

Each scenario's evidence pack saved to `esg-passport/testing/baseline-2026-04-14/<scenario-id>/` with: screenshots, exported file, answer JSON, known accepted limitations note.

Optional if actively marketed at launch:

- [ ] One non-English uploaded questionnaire for output review

### 0.5 Baseline evidence pack

- [ ] Smoke-run Hartmann end to end in EN
- [ ] Save screenshots of key screens
- [ ] Save exported files
- [ ] Save answer/draft set
- [ ] Save known accepted limitations

## Phase 0 Exit Criteria

- [ ] No fabricated claims in baseline run
- [ ] No phantom topic routing in launch scope
- [ ] Real license gate active
- [ ] Frozen EN baseline artifacts ready
- [ ] Hartmann EN run passes end to end

## Phase 1 - Expert Review

## 1A - Designer / UX Review

Runs first and alone.

Dependencies:

- Phase 0 complete

Review scope:

- landing
- license activation
- onboarding
- company profile
- data entry
- CSV import
- questionnaire upload / sample flow
- results review
- export
- Settings

Prompt:

> You are a UX designer reviewing ESG Passport for a non-technical user: a 62-year-old office manager at a German Mittelstand factory who has been told to complete an ESG questionnaire and does not know ESG terminology. Walk through the frozen canonical scenario pack and the full product flow: landing -> license activation -> onboarding -> company profile -> data entry (manual and CSV import) -> questionnaire upload/sample -> results review -> export -> Settings. For every screen, answer: 1. Would this user know what to click next? 2. What word, icon, or layout would confuse them? 3. Where would they hesitate or give up? 4. Where does the product feel like software instead of a helper? Do not suggest aesthetic redesign. Focus on comprehension, next-step clarity, trust signals, and error recovery. Flag any wording that makes the product sound like it "generates answers" rather than "prepares drafts from your data." Output: ranked friction list with severity (`blocker`, `high`, `medium`, `low`) and one-line fix for each.

Tracking:

- Reviewer:
- Date:
- Build/reference:
- Findings linked:

Exit:

- [ ] Designer review completed
- [ ] Designer blockers fixed
- [ ] Designer highs fixed or explicitly deferred with owner

## 1B - ESG Expert Review

Runs after 1A blocker/high wording fixes land.

Dependencies:

- Phase 0 complete
- 1A blocker/high wording fixes applied
- round 2 engine blockers fixed

Prompt:

> You are an ESG consultant who writes real EcoVadis, CDP, and CSRD/VSME responses for SME suppliers. Review ESG Passport as a compiler, not an editor: it may only prepare draft answers from company-provided facts and must never invent commitments, roadmaps, policies, percentages, or assurance claims. Review: 1. the 4 shipped template packs 2. the Hartmann baseline outputs across the canonical scenario pack 3. confidence scoring and export warnings 4. source-note handling on the Data page 5. the round 2 high-risk review set: `cb-13`, `cb-45`, `cb-48`, `cb-51`, `cb-55`, `cb-57`, plus the 10 high-risk topic families from the round 2 audit. For each answer, verify that every sentence traces back to a field, document, or explicit policy state the user provided. Any unsupported claim is a blocker. Also identify topics where data requirements are too shallow to produce a defensible answer. Output: per-template sign-off or rewrite, compiler-not-editor violations, shallow-requirement topics, and missing buyer-question coverage.

Tracking:

- Reviewer:
- Date:
- Build/reference:
- Findings linked:

Exit:

- [ ] ESG expert review completed
- [ ] No open compiler-not-editor blocker in launch scope
- [ ] Shallow-requirement blockers fixed or explicitly removed from launch claims

## 1C - Language Expert Review

Runs in parallel with 1B, but only after EN is frozen and 1A wording fixes land.

Dependencies:

- English source frozen
- 1A blocker/high wording fixes applied

Prompt:

> You are a professional localization reviewer for a B2B compliance product. English is the source of truth. Review ESG Passport in two separate layers. Layer 1: answer/output/export localization. Review `DE`, `FR`, `ES`, `IT`, `PL`, and `NL` in generated answer text, export strings, warnings, confidence/export labels, and interpolation/placeholders. Layer 2: UI localization. Review `DE`, `FR`, and `ES` in navigation, onboarding, Data page labels, buttons, tooltips, error states, Settings, and surrounding UI chrome. Do not assume UI and output languages are identical. Flag inconsistencies between the two layers separately. Check for mistranslations, false friends, wrong register for a B2B compliance tool, technical terms that should remain standard ESG terminology, placeholder breakage, English leakage, truncation, layout breakage, and cases where the UI promises a language experience the answer/export layer does not fully support, or vice versa. Output: `Answer/output findings` by language, `UI findings` by language, `Cross-layer mismatches`, `Launch-ready languages`, and `Partial-only languages`.

Tracking:

- Reviewer:
- Date:
- Build/reference:
- Findings linked:

Exit:

- [ ] Language review completed
- [ ] DE launch-ready
- [ ] FR launch-ready or deliberately deferred
- [ ] ES launch-ready
- [ ] IT reviewed as output language
- [ ] PL reviewed as output language
- [ ] NL reviewed as output language
- [ ] PT explicitly marked UI-only or removed from launch-facing language claims

## Phase 1 Exit Criteria

- [ ] Designer blockers/highs fixed
- [ ] ESG blockers fixed
- [ ] Translation blockers fixed for launch scope
- [ ] No open compiler-not-editor violation in launch scope

## Phase 2 - Persona End-to-End Testing

Only starts after Phase 1 blocker/high findings are fixed.

Use the canonical scenario pack plus live interaction.

### Persona set

#### P1 - Hartmann

- Profile: German Mittelstand office manager
- Language: DE
- Stress flow: canonical Hartmann run
- Watch for: trust, clarity, send-readiness

#### P2 - Procurement / Sales Responder

- Profile: supplier-facing commercial user trying to respond quickly
- Language: EN
- Stress flow: Basic Supplier or EcoVadis
- Watch for: speed, embarrassment risk, export trust

#### P3 - CFO / Finance Skeptic

- Profile: numbers-first skeptic focused on defensibility and legal exposure
- Language: EN
- Stress flow: Comprehensive buyer or CDP-style outputs
- Watch for: unsupported percentages, governance overreach, invented claims

#### P4 - Spanish Small Business Operator

- Profile: first-time ESG responder with minimal data
- Language: ES
- Stress flow: Basic Supplier + low-confidence path
- Watch for: small-data survivability, Spanish output quality

#### P5 - Grandma Survivability Test

- Profile: barely-email user, weak software confidence
- Language: EN
- Stress flow: simplest path from activation to export
- Watch for: next-step clarity and drop-off points

#### P6a - Bill Extraction First (EN)

- Profile: user who starts from invoices rather than a spreadsheet
- Language: EN
- Stress flow: bill extraction -> Data -> Respond -> export
- Watch for: positioning promise actually working in-product

#### P6b - Bill Extraction First (DE)

- Profile: same as P6a, German-speaking user with German-language invoices
- Language: DE
- Stress flow: bill extraction -> Data -> Respond -> export
- Watch for: German invoice parsing accuracy, DE output quality on the extracted path

### Persona prompt template

> You are {persona}. You have never used ESG Passport before. Your customer sent you an ESG questionnaire and expects a response soon. The product is sold as a one-time license: €299 Pro (single user, full features) or €499 Pro+ (adds bill/document extraction). Starting from the landing page, go through the full flow: activate, onboard, enter or extract your data, upload/select the questionnaire, review the prepared draft, edit anything needed, export, and judge whether you would send it. Narrate: 1. what you expected 2. what happened 3. where you got stuck 4. what you did not trust 5. whether the exported file looks competent enough to send. Flag invented answers, embarrassing phrasing, translation problems, unclear next actions, and places where the product asks for knowledge you do not have. Rate whether you would pay €299 for Pro (and €499 for Pro+ if the extraction path is relevant to you) and why.

### Persona tracking table

| Persona | Reviewer | Build/reference | Completed | Findings linked | Pass/Fail |
|---|---|---|---|---|---|
| P1 Hartmann DE |  |  |  |  |  |
| P2 Procurement / Sales EN |  |  |  |  |  |
| P3 CFO / Finance Skeptic EN |  |  |  |  |  |
| P4 Spanish Small Business ES |  |  |  |  |  |
| P5 Grandma EN |  |  |  |  |  |
| P6a Bill Extraction EN |  |  |  |  |  |
| P6b Bill Extraction DE |  |  |  |  |  |

## Phase 3 - Fix Pass and Regression

### Triage

- [ ] Classify all persona findings:
  - blocker
  - high
  - medium
  - low

### Fix pass

- [ ] Fix all blockers
- [ ] Fix all highs
- [ ] Decide and document medium/low deferrals

### Regression canaries

Re-run the three highest-signal canaries:

- [ ] P1 Hartmann DE — demo polish + DE output
- [ ] P3 CFO / Finance Skeptic EN — regression on fabrication / compiler-not-editor
- [ ] P5 Grandma EN — next-step clarity + drop-off

### Release hygiene

- [ ] Verify production license behavior
- [ ] Remove test keys / test assumptions
- [ ] Confirm launch claims match actual capabilities
- [ ] Tag release
- [ ] Deploy

## Launch Decision Rule

Do not ship unless all of the following are true:

- [ ] No fabricated claims
- [ ] No wrong topic routing in launch scope
- [ ] No unsupported percentages or governance claims presented as fact
- [ ] Draft / low-confidence / data-backed distinctions are visible in the export, not just on-screen
- [ ] A low-confidence user can complete the flow without help
- [ ] DE is professionally usable
- [ ] ES is professionally usable
- [ ] Any other marketed language is reviewed and explicitly classified as full, output-only, or not launch-ready
- [ ] Bill extraction path works end to end at least once

## Language Classification Table

| Language | UI | Answer/output | Export | Launch classification | Notes |
|---|---|---|---|---|---|
| EN | Yes | Yes | Yes | Full |  |
| DE | Yes | Yes | Yes |  |  |
| FR | Yes | Yes | Yes |  |  |
| ES | Yes | Yes | Yes |  |  |
| IT | No full UI | Yes | Yes |  | Output-only unless expanded |
| PL | No full UI | Yes | Yes |  | Output-only unless expanded |
| NL | No full UI | Yes | Yes |  | Output-only unless expanded |
| PT | Yes | No confirmed answer layer | No confirmed export layer |  | UI-only unless expanded |

## Immediate Punch List

- [ ] Revert `LicenseContext` dev behavior
- [ ] Fix the six flagged questions
- [ ] Add the 10 high-risk topic families from the round 2 audit to this plan
- [ ] Freeze English strings for launch scope
- [ ] Run and save Hartmann EN evidence pack
- [ ] Run one bill-extraction baseline and save the evidence pack

## Notes

- Current top-level docs in the repo are not fully aligned with the actual localization code. Use this plan, not old summary docs, as the launch test reference until docs are reconciled.
- If launch scope changes, update this file first before scheduling reviewers.

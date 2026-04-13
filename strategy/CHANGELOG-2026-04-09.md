# ESG Passport — Changelog 2026-04-09

## Free-tier preview gate on /respond
- Removed page-level PaidRoute from /respond in App.jsx
- Free users see first 5 answers + upgrade card + blurred locked placeholders
- Inline upgrade card with "Maybe later — dashboard" and "Add more data" soft exits
- Locked for free users: Excel export, AI Enhance (batch + per-row), Edit, Mark N/A, Save to library, history persistence
- Post-payment unlock re-renders same results — no re-upload, no re-parse
- /report gated behind PaidRoute (was free before)
- /requests + /requests/:id remain gated (unchanged)

## Onboarding step 3 update
- "Upload a Questionnaire" tile unlocked, relabeled to "See it in action"

## Sample questionnaire button + data nudge
- "Try with sample" indigo callout on Respond upload screen (loads Basic 15q)
- Amber data nudge banner when Data store is empty
- Auto-resume: click "Enter data" → fill data → return to Respond → sample fires automatically via sessionStorage flag

## LemonSqueezy URL fix
- Updated from esgforsuppliers.lemonsqueezy.com → catyeldi.lemonsqueezy.com in Respond.jsx + UpgradeGate.jsx

## Language switcher removed
- Phrase-replacement translation was broken (changed 1-2 words, not usable)
- Removed from Respond results bar entirely
- UpgradeGate feature list updated to remove "Multi-language export" line
- Real multilingual support pending hand-translated template files (see TRANSLATION-DECISIONS.md)

## Company Profile collapsible section on Data page
- New CompanyProfileSection.jsx component at top of /data
- 18 fields: identity, industry/location, products/services, ownership, customers/markets, certifications, reporting period
- Progress bar, auto-collapse after save, confirm-before-collapse with unsaved changes, beforeunload guard
- All fields wired through dataBridge.js into the engine's CompanyData

## Engine wiring for new profile fields
- 8 new fields forwarded through dataBridge: yearFounded, productsServices, operatingCountries, ownership, parentCompany, subsidiaries, customerTypes, mainMarkets
- New 'products' domain case in dataModel.ts (fixed "Unknown" for products/services questions)
- products_services template upgraded to consume the new fields
- Form-cert chips merged into certifications string via Set dedup

## Missing dataModel switch cases (root cause of widespread "Unknown — input required")
- Added 6 cases: effluents, buyer_requirements, materials, swot, external_context, packaging
- Each surfaces basic company context so confidence escapes 'unknown' and template fallbacks ship

## New templates and fallbacks
- Wastewater/effluents template (industry-aware: office vs industrial)
- Transport/logistics template (new — none existed before)
- Industry-conditioned fallbacks for fuel, H&S KPI, fleet, transport templates
  (service/tech: "primarily office-based"; manufacturing: "tracked at aggregate, breakdown planned")

## hoursWorked field on Data page
- Added to healthSafety section of metric grid
- Store, dataBridge, TRIR calculation already supported it — only UI input was missing

## workAccidents split into three fields
- New fields: recordableIncidents, lostTimeIncidents, fatalities (with tooltips)
- Backward-compat: existing workAccidents data reads as recordableIncidents via alias
- dataBridge.js forwards each separately; TRIR uses recordableIncidents
- Store.js getAnnualTotals sums each independently

## Domain-coverage Vitest test
- response-ready/src/__tests__/domainCoverage.test.ts
- Asserts every domain in keywordRules.ts has a matching case in dataModel.ts
- Catches the silent "Unknown — input required" breakage pattern at test time

## Multilingual CSV column synonyms
- buildColumnMap in csvImport.js now matches headers in EN, DE, PL, FR, ES, IT, NL
- Covers all metric columns: electricity, gas, fuel, renewables, water, waste, recycled, hazardous, employees, gender, incidents, fatalities, hours worked, training

## Source-line + category deep link on answer cards
- Merged "Based on: 45,000 kWh (2025-01)" into the category line below the question
- Now a clickable Link to /data?period=YYYY-MM
- Data page reads the period query param on mount and jumps to the right year

## Demo data loader for screen recordings
- src/lib/demoData.js — Acme Industrial GmbH (47-FTE manufacturer, Munich)
- 6 months of realistic operational data with seasonal variation
- Fully populated Company Profile (18/18 fields, ISO 9001 + 14001)
- Triggered via URL: /#/?demo=load (seed) or /#/?demo=reset (wipe to fresh install)
- Strips query param after action so refresh doesn't re-trigger

## Files touched
### esg-passport
- src/App.jsx
- src/pages/Onboarding.jsx
- src/pages/Respond.jsx
- src/pages/Data.jsx
- src/components/CompanyProfileSection.jsx (new)
- src/components/UpgradeGate.jsx
- src/components/LicenseContext.jsx (DEV HARDCODE — REVERT BEFORE COMMIT)
- src/lib/dataBridge.js
- src/lib/csvImport.js
- src/lib/demoData.js (new)
- strategy/TRANSLATION-DECISIONS.md (new)
- strategy/TODO-NEXT.md (new)
- strategy/CHANGELOG-2026-04-09.md (this file)

### response-ready
- domain-packs/esg/dataModel.ts
- domain-packs/esg/answerTemplates.ts
- domain-packs/esg/TRANSLATION-SOURCE.md (new)
- src/__tests__/domainCoverage.test.ts (new)

## Response trust-model overhaul
- Introduced explicit `supported` vs `draft` answer states in the response engine and UI
- Added `verifiedAnswer`, `draftAnswer`, `supportLevel`, `dataCoverage`, `draftRisk`, and evidence-aware review behavior
- Tightened ESG answer templates so supported answers are closer to disclosure facts and less consultant-style
- Added support for negative disclosures such as "not measured" / "not tracked" without forcing all such answers into speculative prose
- Separated response status from confidence in the review UI so support state and confidence are not shown as the same visual signal
- Expanded export options from Excel-only to Excel, PDF print preview, Word-compatible `.doc`, and HTML

## Next steps
- Fix live `Q11` behavior if the UI still shows explicit negative Scope 3 disclosures as `Draft` after regeneration
- Revisit `Q1` question-fit if the legal-name/incorporation answer still includes extra identity context after hard refresh/regeneration
- Decide on one confidence-badge policy: either every answer gets a confidence badge, or none do
- Tighten remaining supported answers that may still overstate process maturity:
- wastewater / circularity / grievance / governance / supply-chain monitoring paths
- Confirm the latest export flow end-to-end in the browser for Excel, PDF, Word, and HTML
- Integrate extractor output and rerun the full pipeline against real extracted data before final polish

## 2026-04-13 pricing and messaging decision
- Position ESG Passport as one end-to-end workflow, not two separate products:
  get the data in, get the answers out
- Keep three tiers:
  Free, Pro `EUR299`, Pro+ `EUR499`
- Pro is the complete response workflow with manual data entry
- Pro+ is the same outcome with less manual extraction work from bills, invoices, manifests, and HR reports
- Do not frame `EUR499` as "the real product" and `EUR299` as crippled; both must complete the job
- Do not sell `Teams` yet while the product is local-first; use `Consultant` / multi-company wording instead
- Core positioning:
  focused supplier questionnaire response system, local-first, auditable, alternative to annual compliance SaaS
- Homepage header selected:
  "Your ESG answers are already in your invoices, records, and reports."

## 2026-04-13 site copy updates
- Updated `esgforsuppliers/src/lib/pricing.ts` to reflect:
  Free preview workflow, Pro `EUR299`, Pro+ `EUR499`, and `Consultant` naming
- Updated `esgforsuppliers/src/app/page.tsx` messaging to:
  present extraction + response as one workflow, shift pricing framing from "cheap tool" to "focused practical system", and reinforce the local-first trust model
- Rendering still needs a quick browser check; copy was updated but not visually verified in-app

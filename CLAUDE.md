# ESG Passport

## Project Overview
SaaS version of the ESG Response Generator. Provides ongoing ESG questionnaire response capability for suppliers, branded as "ESG for Suppliers." Subscription-based tool where suppliers maintain a living ESG passport they can update and reuse.

## Tech Stack
- Vite + React 19
- JavaScript (JSX)
- Tailwind CSS 3 + Radix UI components
- localStorage for persistence
- response-ready (local dependency) — domain-agnostic questionnaire engine + ESG domain pack

## Current State
- **License gate** — LemonSqueezy license key validation on app launch (src/lib/license.js + src/components/LicenseGate.jsx)
- Consumes response-ready package (file:../response-ready) for questionnaire engine
- Engine accessed via lazy singleton: `getEngine()` → `createResponseEngine(esgDomainPack)`
- Upload Questionnaire page (Excel/CSV/PDF/DOCX parsing, template selection, saved history)
- Results page (answer cards, confidence breakdown, Excel export, multi-language EN/DE/FR/ES)
- Data bridge connects Passport data to answer engine
- Navigation updated with "Respond" tab
- Customer requests link to questionnaire upload flow
- Pre-loaded questionnaire templates (EcoVadis 35q, CDP 25q, Basic 15q, CSRD/VSME 20q)
- Answer persistence (saved to localStorage, history tab on Upload page)
- Low-confidence data warnings (amber/red visual indicators)
- Bulk CSV data import with smart column detection + template download
- Monthly/Annual entry mode toggle on Data page
- Industry-adaptive data entry (hides irrelevant metrics based on company industry)
- Year-over-year comparison table with trend indicators
- Multi-language answer rendering (EN/DE/FR/ES phrase-based translation)
- Optional AI enhancement (bring your own Claude or OpenAI API key)
- License deactivation in Settings (for device transfer)
- Build passes successfully

## License System
- Gate wraps entire app in App.jsx via `<LicenseGate>`
- Validates keys via LemonSqueezy API: `POST /v1/licenses/validate`
- Stores validated key + instance_id in localStorage (`esg_passport_license`)
- Re-validates once per 7 days (background check on app launch)
- Deactivate via Settings → calls LemonSqueezy `/v1/licenses/deactivate`
- **To set up:** Create a license-key product in LemonSqueezy, price at €99/year

## Relationship to Other Projects
- Consumes response-ready (../response-ready) via file: dependency + Vite alias
- Part of the broader Ecosystems United / Five Stacks Framework ecosystem
- Stack 1 = baseline data; this app is the operational product

## Architecture
- src/components/LicenseGate.jsx — License key activation screen (wraps entire app)
- src/lib/license.js — LemonSqueezy license validation, storage, deactivation
- src/pages/ — React page components (Home, Data, Respond, Requests, RequestWorkspace, Settings, Onboarding)
- src/lib/store.js — localStorage CRUD layer
- src/lib/dataBridge.js — translates Passport store data to engine CompanyData format
- response-ready (external) — questionnaire engine + ESG domain pack (via Vite alias to ../response-ready source)
- src/lib/translations.js — multi-language phrase translation (DE/FR/ES)
- src/data/questionnaire-templates.js — pre-loaded EcoVadis/CDP/Basic/CSRD templates
- src/components/ — Layout, UI components (Radix-based)

## Git Conventions
- Use conventional commits: feat:, fix:, docs:, refactor:, chore:
- Commit after each meaningful change
- Feature branches for new work: feat/description

## Session Protocol
- At session start: read this file
- During work: commit every meaningful milestone
- At session end: update "Current State" above, commit, push

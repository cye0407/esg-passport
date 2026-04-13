# Session: 2026-04-13 — The Big One

## What happened

### 1. Response Engine Contest (Claude vs Codex vs Gemini)
- Ran a 3-way AI contest to improve ResponseReady engine accuracy
- Created 58 test cases across 7 rounds (fabrication, accuracy, duplicates, cross-domain, confidence, classification, edge cases)
- Claude scored 7.1/10, Codex 6.6/10, Gemini didn't really compete (forked Claude's branch, changed 1 line)
- **Key finding:** "Claude wins but fails product requirements. Claude's failure = legal risk. Codex's failure = data integrity risk."
- Both failure modes exposed that the engine allowed creative interpretation AND field overwrites

### 2. Compiler Not Editor
- Stripped all soft fabrication from templates (79 lines removed)
- Killed: "we are working to", "we plan to", "we are evaluating", "committed to", editorial commentary
- Added 100 no-fabrication guardrail tests (permanent safety net)
- Rule: if the company didn't provide data, the engine says nothing. Silence beats invention.
- Exception: if user explicitly marked a policy as "in_progress", engine can say "under development"

### 3. ESG Extract — New Product Built From Scratch
- Created `CY/esg-extract/` — document extraction tool
- **Extractors:** electricity, gas, water, waste, workforce, fleet fuel
- **Languages:** EN, DE, FR
- **Providers:** 20+ European energy providers auto-detected
- **Formats:** PDF (pdfjs-dist), text files, images (Tesseract.js OCR)
- **Output:** ESG Passport localStorage format + ResponseReady flat format
- 49 tests passing
- Fixed real-world PDF extraction (Stadtwerke, MainGas, Frankfurt Stadtentwässerung)
- Generated 64 monthly + 6 annual demo bills for testing

### 4. Extraction Integrated Into ESG Passport
- BillDrop component on Data page — drop zone for bills
- Multi-file support with sequential review queue
- Maps extracted fields directly to data grid
- Accept/reject per field, confidence badges
- "Apply N fields → Next" workflow for batch processing
- Fixed: confidence records and policies auto-seed when empty

### 5. Pricing & Positioning Overhaul
- **Old:** Free + €199 Pro (2 tiers)
- **New:** Free / €299 Pro / €499 Pro+ (3 tiers, all one-time)
- Pro = answer engine + export (manual data entry)
- Pro+ = extraction + answer engine + export (skip the spreadsheet)
- **Positioning shift:** "Customer sent a questionnaire?" → "Your ESG answers are already in your invoices"
- Data-first, not panic-first. Consequence ("you look like a risk") is secondary hook.

### 6. Homepage Rewritten
- New hero: "Your ESG answers are already in your invoices"
- New flow: drop documents → review → upload questionnaire → export
- "One invoice. Six data points. Zero typing."
- Updated FAQ for extraction, Pro vs Pro+ difference
- Not deployed — local only

### 7. Product Funnel Defined
- Stage 1: ESG Passport = reactive, lead gen ("survive the request")
- Stage 2: Five Stacks = proactive, revenue engine ("fix the system")
- Rule: NEVER mix Five Stacks messaging inside Passport UX
- Handoff trigger: "you're missing the same data across multiple questions"

## Files changed
- `response-ready/` — engine accuracy fixes, 355 tests total (contest/codex branch)
- `esg-extract/` — new repo, full extraction pipeline + web UI
- `esg-passport/` — BillDrop integration, store fixes, Vite alias for esg-extract
- `esgforsuppliers/` — homepage rewrite, pricing.ts updated

## What's NOT done yet
- [ ] Merge response-ready contest work to master
- [ ] Remaining engine fabrication (Q13, Q45, Q48, Q51, Q55, Q57 on demo questionnaire)
- [ ] UX/design polish on BillDrop and Data page
- [ ] Pro+ license gate in LemonSqueezy
- [ ] Deploy new homepage
- [ ] Screen recording for product demo
- [ ] ESG Passport /passport marketing page update

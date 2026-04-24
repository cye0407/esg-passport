# ESG Passport — Persona Test Report

Date: 2026-04-24
Scope: Free-user popup diagnosis + 6-persona end-to-end review
Method: Static code review. No app was run. Engine-internal findings come from a sub-agent's code read — treat as "this class of bug exists on these questions", not a line-exact diff plan. All `src/pages/*` and `src/components/*` findings were verified directly.

---

## Table of contents

1. Free-user activation popup
2. Launch-blocking trust issues (compiler-not-editor)
3. Per-persona findings
4. Cross-cutting UI i18n gap
5. What was verified vs inferred
6. Suggested order of operations

---

## 1. Free-user activation popup

### Diagnosis

- Modal lives in `src/components/ActivationCard.jsx`, rendered unconditionally inside `LicenseProvider` at `src/components/LicenseContext.jsx:81`.
- Before the fix: `if (dismissed && !justPurchased) return null;` — meaning it would render for any free user who had not dismissed it.
- Captures **nothing**. Email capture already runs in `src/pages/Onboarding.jsx:72-83` (`POST /api/register-lead`, fire-and-forget, step 2). Removing the popup loses zero emails.
- LemonSqueezy is wired only into paid paths (`UpgradeGate.jsx:71`, `ExtractorUpgradeCard.jsx:5`, `Respond.jsx:41`) plus license validation. **Free users do not touch LemonSqueezy today**, so dropping LemonSqueezy for the free version is not the lever — the popup is.
- Existing test `src/components/__tests__/ActivationCard.test.js:45` already asserts "does not block free users on a normal first visit". The code contradicted its own test.

### Decision

Gate the modal on post-purchase only — keep the welcome variant for `?welcome=pro` / `?welcome=pro-plus` URL params from LemonSqueezy redirect, remove for free users.

### Fix (already in working tree, uncommitted)

```diff
-  if (dismissed && !justPurchased) return null;
+  if (!justPurchased) return null;
+  if (dismissed) return null;
```

File: `src/components/ActivationCard.jsx:42-45`.

### Rejected alternatives

- **"Not ready to go Pro yet, close" copy** — still presents a paywall-flavoured modal at a moment when a free user has no context for it.
- **Remove LemonSqueezy for free version** — solves nothing; free users don't touch it.

---

## 2. Launch-blocking trust issues (compiler-not-editor)

These map directly to Phase 0.2 of `LAUNCH-TEST-PLAN.md`. Until closed, any CFO / ESG-consultant persona will fail the product.

| # | Finding | File | Fix |
|---|---|---|---|
| B1 | `answerGenerator` templates fire without checking the primary fact exists | `response-ready/src/engine/answerGenerator.ts:160-200` | Gate every template on `has(primaryField)`; return `confidence: none` if missing |
| B2 | cb-13 decarbonization roadmap generates text without `sustainabilityGoal` or structured climate policy | `src/lib/dataBridge.js:272` | Require one of the two before template fires |
| B3 | cb-45 fines/sanctions returns "no significant fines" when user never asserted it | `response-ready/src/__tests__/safetyGuardrails.test.ts:202-207` | Require explicit `noSignificantFines === true` |
| B4 | cb-48 ESG-linked executive compensation — no validation gate | `src/lib/dataBridge.js` | Add `esgLinkedCompensationExists` tri-state; check before templating |
| B5 | cb-55 `% of critical Tier 1 suppliers assessed` silently defaults to 0 when undefined | `src/lib/dataBridge.js:263` | Use `?? undefined`; never fabricate a percentage |
| B6 | CSRD applicability claimed without checking revenue + EU + >250 FTE | `src/lib/dataBridge.js:219` | Tri-state + 3-criterion gate |
| B7 | N/A handling collapses three states: "user said no" / "user didn't answer" / "not applicable" | `src/pages/Data.jsx:83,229`; `src/lib/store.js:18-24` | Extend `notApplicableFields` Boolean → `{ reason, markedAt }`; carry through to export |
| B8 | Excel export drops N/A justifications | `response-ready/src/engine/excelExporter.ts` | Write `[N/A: reason]` into the answer column |
| B9 | Bill extractor silently writes annual-only bills into January | `src/components/BillDrop.jsx:115,195` | If `period` matches `YYYY` only, prompt for month or downgrade confidence with annotation |
| B10 | `confidence: low` extracted fields are imported by default | `src/components/BillDrop.jsx:50` | Default accept only `high`; user opts in to `medium`; never auto-accept `low` |

---

## 3. Per-persona findings

Severity: **blocker** (persona can't complete / won't pay) · **high** (loss of trust) · **medium** (friction) · **low** (polish).

### P1 — Hartmann DE (62yo Mittelstand office manager)

| Sev | Finding | File | Fix |
|---|---|---|---|
| high | OSHA jargon "Recordable Incidents" / "Lost Time Incidents" untranslated on Data | `src/pages/Data.jsx:532-535` | Translate in `i18n.js` ("Meldepflichtige Zwischenfälle" / "Ausfallzeitverletzungen"); add tooltip |
| high | German answer templates mix formal "Unser" with passive voice | `src/lib/translations.js:26-48` | Standardize register; e.g. "Der Stromverbrauch unseres Unternehmens betrug…" |
| medium | BillDrop processing text ("Reading documents…") English-only regardless of locale | `src/components/BillDrop.jsx:151` | Pass `language` prop; localize status + results dialog |
| medium | Onboarding assumes ESG literacy ("industry sector") | `src/pages/Onboarding.jsx:156-198` | Add 1-line glossary on step 2 |

### P2 — Procurement / Sales Responder EN

| Sev | Finding | File | Fix |
|---|---|---|---|
| high | Draft-answer warning is inline italic, not a blocking signal | `src/pages/Respond.jsx:1165-1167` | Promote to amber/red box; require explicit acknowledgement |
| high | Export dialog doesn't require "I reviewed the drafts" confirmation | `src/pages/Respond.jsx:814-828` | Mandatory checkbox before export (especially on free tier) |
| medium | No bulk edit / bulk mark-N/A — one-at-a-time pencil icon only | `src/pages/Respond.jsx:1355-1362` | Bulk actions menu |
| medium | Confidence badges buried in small columns | `src/pages/Respond.jsx:1319-1338` | Larger badge, left edge of card, bolder colour for "Needs review" |

### P3 — CFO / Finance Skeptic EN

| Sev | Finding | File | Fix |
|---|---|---|---|
| high | "Supported" is ambiguous — is the number calculated or provided? | `src/pages/Respond.jsx:406-417` | Rename to "Data-backed"; show source field inline |
| high | Percentages ship with no sample-size / coverage qualifier | `src/pages/Respond.jsx:256-277` | Annotate with actual period range ("Based on Jan-Mar 2026, 3/12 months") |
| medium | No audit trail export — methodology, cutoff, template version missing | `src/pages/Respond.jsx:606-645` | "Export audit log" button; auto-include in Excel/Word |
| medium | "Data coverage: partial" is vague | `src/pages/Respond.jsx:436-443` | Replace with "8/12 months tracked" or actual range |
| — | Plus any of B1–B6 above — P3 will not pay if those remain | — | — |

### P4 — Spanish SMB Operator ES

| Sev | Finding | File | Fix |
|---|---|---|---|
| high | Settings page entirely hardcoded English | `src/pages/Settings.jsx:35-105` | Wrap in `t()`; add ES strings |
| medium | "scope" / "alcance" / "ámbito" inconsistency in answer output | `response-ready/src/engine/answerGenerator.ts:131-136`; `src/lib/translations.js:105-108` | Standardize on "alcance" everywhere |
| medium | Onboarding step 1 value props read as enterprise ("compliance documents") | `src/pages/Onboarding.jsx:89-94` | Lighter SMB-tone variant, or segment by FTE |
| low | Home "Getting Started Guide" assumes prior experience | `src/pages/Home.jsx:238-266` | 3-step micro-tutorial for first-time empty state |

### P5 — Grandma EN

| Sev | Finding | File | Fix |
|---|---|---|---|
| high | Onboarding step 2 demands 6 fields — abandonment risk | `src/pages/Onboarding.jsx:146-225` | Required: Company Name + Email + Country; rest optional |
| high | Data page shows 27 metrics at once on empty profile | `src/pages/Data.jsx:527-555` | First visit: 4 core metrics (electricity, employees, waste, accidents) + "Show all" |
| medium | "Response Ready %" circle shown before any data exists | `src/pages/Home.jsx:97-101,213` | Hide until first data record |
| low | No visible "saved" confirmation after first data entry | `src/pages/Data.jsx:509` | 2-second toast with checkmark |

### P6a — Bill Extraction First EN

| Sev | Finding | File | Fix |
|---|---|---|---|
| high | `confidence: low` extracted fields auto-accepted (see B10) | `src/components/BillDrop.jsx:50` | Default opt-in only on `high` |
| medium | No bill-type hint before extraction — gas bill gets checked for electricity | `src/components/BillDrop.jsx:124,186-213` | Optional type selector as hint, not lock |
| medium | Confidence labels ("medium") not explained | `src/components/BillDrop.jsx:234` | Tooltip with definition |
| medium | No next-step guidance after extract completes | `src/pages/Data.jsx:271-322` | Auto-scroll to extracted fields + green highlight + toast |

### P6b — Bill Extraction First DE

| Sev | Finding | File | Fix |
|---|---|---|---|
| high | Annual German invoice ("Jahresabrechnung 2025") silently lands in `2025-01` (see B9) | `src/components/BillDrop.jsx:115,195` | Detect `YYYY`-only period; prompt for month or downgrade confidence |
| medium | BillDrop UI chrome English-only during German invoice processing | `src/components/BillDrop.jsx:151,234` | Pass locale; translate status, confidence labels, errors |

---

## 4. Cross-cutting UI i18n gap

Neither DE nor ES is launch-ready against the `LAUNCH-TEST-PLAN.md` Language Classification Table. Mechanical to fix but substantial scope:

- `src/pages/Home.jsx` lines 127, 138, 166, 176, 241, 319, 364 — 15+ hardcoded English strings.
- `src/pages/Settings.jsx:35-105` — entirely English, no `t()` calls.
- `src/pages/Data.jsx:51-172` — MONTHS array hardcoded English.
- `src/pages/Respond.jsx:780-880` — export dialog titles / descriptions hardcoded.
- `src/lib/translations.js` answer rules cover 570+ phrases but have no automated coverage check — roughly 20% of "Note:" boilerplate (lines 167-176) is untranslated.

---

## 5. What was verified vs inferred

Verified directly (lines I read):

- `src/components/ActivationCard.jsx`, `src/components/LicenseContext.jsx`, `src/lib/license.js`
- `src/App.jsx`, `src/components/UpgradeGate.jsx`, `src/components/ExtractorUpgradeCard.jsx`
- `src/pages/Home.jsx`, `src/pages/Onboarding.jsx`
- `src/components/__tests__/ActivationCard.test.js`
- Git state of `src/components/ActivationCard.jsx` — fix is applied in working tree, uncommitted

Inferred from sub-agent reads (needs verification before implementation):

- All compiler-not-editor findings B1–B6
- All `response-ready/` engine references
- Exact line numbers inside `Data.jsx` (1608 lines), `Respond.jsx` (1987 lines), `BillDrop.jsx`, `translations.js`, `i18n.js`
- i18n coverage counts

Not done: running the app, building, visual inspection, actual localization spot-checks with native speakers.

---

## 6. Suggested order of operations

1. **Commit + deploy the ActivationCard fix.** Already in the working tree.
2. **Decide whether to re-open Phase 0.2** before any more persona testing. `LAUNCH-TEST-PLAN.md` rule: "Persona testing does not start until known round 2 engine issues are fixed." Items B1–B6 are exactly those Round-2 issues.
3. **Run UI i18n sweep in parallel** with engine work — Home + Settings + months. Mechanical, unlocks DE / ES launch classification.
4. **Bill extraction polish** (B9, B10) — small, high leverage for the €499 Pro+ story.
5. Only after 2–4: re-run persona P1, P3, P5 as regression canaries per the launch plan.

---

## Appendix — popup fix diff

```diff
--- a/src/components/ActivationCard.jsx
+++ b/src/components/ActivationCard.jsx
@@ -1,4 +1,4 @@
-import React, { useState, useEffect } from 'react';
+import React, { useState } from 'react';
 import { useLicense } from '@/components/LicenseContext';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
@@ -41,7 +41,8 @@ export default function ActivationCard() {
   // it self-dismisses.
   if (isChecking) return null;
   if (isPaid) return null;
-  if (dismissed && !justPurchased) return null;
+  if (!justPurchased) return null;
+  if (dismissed) return null;
```

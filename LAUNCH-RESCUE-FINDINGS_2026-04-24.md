# ESG Passport — Launch Rescue Findings

**Date:** 2026-04-24
**Scope:** 2-day launch rescue — blocker + high-severity findings only
**Method:** Static trace of current code paths across free, Pro, Pro+, returning, failed-activation, and deactivate journeys. No medium/low findings included.

---

## Finding 1

**Severity:** blocker
**Title:** UpgradeGate lists the wrong features when gating Report and Requests
**Journey:** Free new user (and returning free user)

**Steps to reproduce:**
1. As a free user, open Home (`/`).
2. Click the "Share ESG Passport" Quick Action, which routes to `/report`.
3. (Or) click the "Log Customer Request" Quick Action / "Requests" nav link.

**Expected:**
The upgrade prompt should describe what the user is unlocking (ESG Report PDF/HTML export, or Request Management).

**Actual:**
`/report` is wrapped in `<PaidRoute feature="ESG Report">` and `/requests` in `<PaidRoute feature="Request Management">`. Both render `UpgradeGate`, whose title is templated but whose feature bullet list is hardcoded to the Response Assistant:
- "Upload any questionnaire — Excel, CSV, PDF, or Word"
- "200+ answer templates matched to your questions automatically"
- "Pre-loaded templates for EcoVadis, CDP, and CSRD/VSME"
- "Editable answers with inline edit, mark N/A, and save to library"

So a user clicking "Share ESG Passport" sees a heading "Unlock ESG Report" followed by an irrelevant questionnaire-upload pitch. Same mismatch on Requests.

**Why this matters for launch:**
The two most prominent Home Quick Actions ("Share ESG Passport", "Log Customer Request") take free users straight into an upgrade wall whose copy describes a different feature. That reads as a broken product — we appear to be selling the wrong thing on the wrong page, and to anyone scanning the pitch it looks like the €299 charge is for a feature they didn't click.

**Recommended fix:**
In `src/components/UpgradeGate.jsx`, drive the bullet list from the `feature` prop (switch on `"ESG Report" | "Request Management" | default`), or accept a `features` array prop and pass the right bullets from each `<PaidRoute>` call site.

File refs: `src/App.jsx:99`, `src/App.jsx:101-102`, `src/components/UpgradeGate.jsx:37-42`.

---

## Finding 2

**Severity:** blocker
**Title:** Report page is paywalled while nav advertises it as free
**Journey:** Free new user, returning free user

**Steps to reproduce:**
1. As a free user, look at the top nav — "Report" has no lock icon (all other paid items do).
2. Click "Report".

**Expected:**
Either the nav shows a lock (matching Respond / Requests), or the page is actually free.

**Actual:**
In `src/components/Layout.jsx:27` the `Report` nav item has `paid: false` — no lock icon, visually identical to Dashboard and Data. But in `src/App.jsx:99` the `/report` route is wrapped in `<PaidRoute feature="ESG Report">`, so clicking it lands on the (wrongly-worded) upgrade wall.

**Why this matters for launch:**
The product name is "ESG Passport." The one page that literally produces that passport to send to customers is simultaneously advertised as free in the nav and paywalled on click. Free users, the lead-gen audience, hit a hard paywall at the exact moment they try the thing the homepage promised ("Your sustainability data, always ready"). Either the entitlement decision is wrong (Report should be free and this is silently stealing it) or the nav is lying — either way it's a launch-quality dissonance that needs to be resolved intentionally before go-live.

**Recommended fix:**
Decide the entitlement intentionally. If Report is a free feature (recommended — it's the "passport" itself), remove `<PaidRoute>` from `/report` in `src/App.jsx:99`. If it's paid, flip `paid: true` on the Report nav entry in `src/components/Layout.jsx:27` so the lock shows.

---

## Finding 3

**Severity:** blocker
**Title:** Post-purchase activation banner hardcodes "Pro" — Pro+ buyers get wrong confirmation
**Journey:** Failed / confusing activation path (specifically Pro+ post-purchase)

**Steps to reproduce:**
1. Purchase Pro+ (€499). LemonSqueezy webhook/thank-you redirect lands the buyer at `/app/?activate=<key>` (and optionally `?welcome=pro-plus`).
2. App auto-activates, then shows the green banner at the top.

**Expected:**
"Pro+ license activated — all features unlocked" (or similar tier-accurate confirmation).

**Actual:**
`AutoActivationBanner` in `src/components/LicenseContext.jsx:95-96` hardcodes:
> "Pro license activated — all features unlocked."

regardless of whether `activate()` returned tier `pro` or `pro-plus`. The context does compute the right tier (`setTier(getLicenseTier())` on line 39) but the banner never reads it.

**Why this matters for launch:**
A Pro+ customer who just paid €499 is told they activated "Pro." They will immediately wonder whether they got billed correctly, whether bill extraction is included, and whether to email support. This is the first post-purchase touchpoint — getting it wrong actively breaks trust and generates "did I get what I paid for?" support tickets at launch.

**Recommended fix:**
Plumb the tier into `autoActivation` state (`{ ok, error, tier }`) and in `AutoActivationBanner` render `"${tier === 'pro-plus' ? 'Pro+' : 'Pro'} license activated — all features unlocked."`. Same file, `src/components/LicenseContext.jsx:53` (capture tier) and `:95` (render it).

---

## Finding 4

**Severity:** high
**Title:** Offline fallback validates any 8+ character string as a real license
**Journey:** Failed activation / confusing activation path

**Steps to reproduce:**
1. Block network access to `esg-passport-seven.vercel.app` (firewall, offline, DNS failure).
2. Open Settings → License → paste `notarealkey` (11 chars, anything ≥8).
3. Click Activate.

**Expected:**
"Could not reach the license server. Please try again when online." (or similar) — or at least no fake activation.

**Actual:**
In `src/lib/license.js:126-132`, `validateLicenseKey` catches any thrown fetch error and returns `{ valid: true, instance_id: null }`. `storeLicense` writes a license record (no tier), `hasActiveLicense()` returns true, `getLicenseTier()` defaults to `'pro'`, and the user becomes Pro until the next online revalidation (up to 7 days).

**Why this matters for launch:**
Intentional behavior for the "downloaded zip" distribution, but the same code ships to esgforsuppliers.com. During any transient outage or corporate-network TLS block at launch, anyone can paste garbage and get Pro. Beyond the revenue leak, it's a credibility problem: the first thing a skeptical buyer does is test whether the activation is real. If "asdfasdf" works, the license layer looks fake.

**Recommended fix:**
Gate the silent offline fallback behind the same downloaded-zip marker you already use (`isLocalDev()` or an explicit `window.__DOWNLOADED_BUILD__` flag baked at build time for the zip). On the hosted domain, a fetch failure should return `{ valid: false, error: 'Could not reach license server — please try again.' }`. Same file, `src/lib/license.js:126-132`.

---

## Finding 5

**Severity:** high
**Title:** Lock icon on "Respond" nav contradicts the page actually being free-accessible
**Journey:** Free new user

**Steps to reproduce:**
1. As a free user, hover the "Respond" nav item — it shows a lock (`paid: true` in `Layout.jsx:28`).
2. Click it.

**Expected:**
Either a paywall appears immediately (matching the lock), or the nav shouldn't show the lock.

**Actual:**
`/respond` is **not** wrapped in `<PaidRoute>` in `src/App.jsx:100`. Free users enter the full upload/template flow, can select a template, generate answers, see the first 5 blurred-preview results, and hit the "Unlock all X answers — €299" card mid-list. Meanwhile an identically-locked-looking "Requests" link jumps straight to a full-page `UpgradeGate`. Two different behaviors for visually identical nav items.

**Why this matters for launch:**
Low-confidence users (P5 Grandma / P2 Procurement persona) will misread the lock icon and give up before discovering that Respond has a real preview. Higher-confidence users who click through then discover the preview is the *only* way to get a feel for the product — so the lock is actively working against the conversion funnel. It's also just inconsistent, which damages trust.

**Recommended fix:**
Match behavior to lock, not the other way around. Either: (a) remove the lock from Respond (`paid: false` in `src/components/Layout.jsx:28`) since the free preview is real, and maybe add a small "Preview" badge; or (b) wrap `/respond` in `<PaidRoute>` like the rest. Option (a) preserves the existing preview-based conversion funnel.

---

## Finding 6

**Severity:** high
**Title:** Free user has no way to know Respond has a working free preview
**Journey:** Free new user

**Steps to reproduce:**
1. Fresh free user finishes onboarding and lands on Home.
2. Scan the page for what to do next.

**Expected:**
Some indication that they can try the response assistant without paying.

**Actual:**
- Home Quick Action "Upload Questionnaire" points to `/respond`, but the nav shows a lock on it (see Finding 5).
- The UpgradeGate on `/report` and `/requests` advertises Respond features but never tells the user those features are available *right now* for preview on `/respond`.
- Onboarding step 3 says "See it in action → Upload a questionnaire or try a sample" which goes to `/respond`, but this is the only non-contradictory hint. A user who skipped that onboarding branch never learns about it.

**Why this matters for launch:**
The 5-question free preview on Respond is the main evaluation mechanism for prospects. If the nav signals the whole feature is locked, free users won't engage, and the single most valuable conversion path dies silently.

**Recommended fix:**
Add "Preview available" or "Try a sample free" badge next to the Respond nav item for free users, and/or surface a "Try the response assistant — free preview" CTA on Home above the Quick Actions when `isPaid === false`.

---

## Finding 7

**Severity:** high
**Title:** Onboarding value props promise paid-only capabilities without disclaimer
**Journey:** Free new user

**Steps to reproduce:**
1. Start a fresh session, complete Onboarding step 1.

**Expected:**
Value props accurately describe what the product does for a user in this state, or clearly mark paid features.

**Actual:**
`src/pages/Onboarding.jsx:89-94` lists to every user:
- "Upload questionnaires and get professional answers"
- "Export responses in multiple languages"

Both are Pro-gated in-product. Free users see the first 5 answers blurred and cannot export at all. No "with Pro" qualifier anywhere in Onboarding.

**Why this matters for launch:**
This is a bait-and-switch trust break — exactly the kind of thing the "Cat the Arbiter" copy voice is supposed to avoid. The user signs up based on the promise of export and multi-language, then discovers behind a paywall that neither works. P3 (CFO / skeptic) will immediately flag this as bad faith.

**Recommended fix:**
Either qualify ("Export responses in multiple languages — with Pro") or re-anchor the onboarding value props on the free capabilities (tracking, passport, policies, Report) with a single "And unlock Pro to respond to any questionnaire" line. Edit: `src/pages/Onboarding.jsx:89-94`.

---

## Finding 8

**Severity:** high
**Title:** Settings shows no tier after activation — Pro+ buyers cannot confirm tier
**Journey:** Returning user with stored license; Paid Pro+ user

**Steps to reproduce:**
1. Activate any license key (Pro or Pro+).
2. Open Settings → License section.

**Expected:**
"Pro+ license active since 2026-04-24 — document extraction included" (or similar tier-explicit confirmation).

**Actual:**
`src/pages/Settings.jsx:294-297` only renders "License active since {date}." with no mention of Pro vs Pro+. A Pro+ customer who just paid €499 has no on-screen confirmation that they actually got the Pro+ tier anywhere except the Data-page `ExtractorUpgradeCard` being replaced by `BillDrop`. If the Data page isn't open or the extractor hasn't loaded, they have no way to verify.

**Why this matters for launch:**
€499 is a real purchase. Every launch-day support ticket of the form "I bought Pro+, did I get it?" is preventable with one line of copy, and Settings is the obvious place users check.

**Recommended fix:**
Pull `tier` from `useLicense()` in Settings and render it: "ESG Passport {Pro | Pro+} — active since {date}." Optional: show whether document extraction is enabled. `src/pages/Settings.jsx:289-298`.

---

## Finding 9

**Severity:** high
**Title:** AI Enhancement is configurable in Settings but silently paid on use
**Journey:** Free new user, Paid Pro user

**Steps to reproduce:**
1. As a free user, open Settings → "AI Answer Enhancement" (no lock, no "Pro" label).
2. Switch to "Use my own API key", paste a real OpenAI/Claude key.
3. Go to `/respond`, generate answers, click "AI Enhance".

**Expected:**
Either: the Settings section is marked Pro-only, or the Respond page honors the user's configured key and enhances.

**Actual:**
Settings lets any user configure proxy or direct AI mode and paste a real API key without any gate or "Pro only" note (`src/pages/Settings.jsx:211-264`). On Respond, the button is hardcoded Pro: `onClick={isPaid ? handleEnhanceAll : () => window.open(CHECKOUT_URL, '_blank')}` (`src/pages/Respond.jsx:1039`). The free user's configured key is never used; clicking Enhance just opens checkout.

**Why this matters for launch:**
The user pastes a sensitive API key, thinks they enabled a feature, and then discovers it was theater. It's a privacy-adjacent confusion (users will wonder what happened to their key) and a transparent bait-and-switch. P3 persona will call this out.

**Recommended fix:**
In Settings, wrap the AI Enhancement CollapsibleSection content with an `isPaid` check. Free users see a short "AI enhancement is a Pro feature — included with your €299 license" blurb and the real inputs only render after activation. `src/pages/Settings.jsx:211-265`.

---

## Finding 10

**Severity:** high
**Title:** "Reset All Data" preserves the license silently — no mention in confirmation
**Journey:** Deactivate/reactivate; general Settings hygiene

**Steps to reproduce:**
1. As a Pro/Pro+ user, Settings → Danger Zone → Reset All Data → confirm both dialogs.

**Expected:**
The confirmation copy should say whether the license is preserved or also cleared.

**Actual:**
`src/pages/Settings.jsx:98-103` calls `resetData()` which only removes `esg_passport_data` (confirmed in `src/lib/store.js:86-87`). The license record in `esg_passport_license` is untouched, so the user remains Pro after reset. The confirmation prompts say "delete ALL data" / "Really delete everything?" — which is misleading in both directions: a user who wants a clean slate for a device transfer won't get one, and a user who's just reordering fixtures may fear they lost their paid license.

**Why this matters for launch:**
This is specifically dangerous in the distributed / multi-device workflow — demo resets, transfer between machines, QA test resets. It also produces a bad first-impression surprise for users who thought "Reset" meant everything.

**Recommended fix:**
Update the confirm text to "Reset all tracked data and company profile? Your license will remain active on this device — use Deactivate License if you want to transfer to another machine." `src/pages/Settings.jsx:98-103`.

---

## Finding 11

**Severity:** high
**Title:** Deactivation can strand users with a local license the server already revoked
**Journey:** Deactivate/reactivate

**Steps to reproduce:**
1. Pro user on Device A; Device A loses network.
2. From another device, deactivate the license via LemonSqueezy dashboard.
3. Device A comes back online and the user tries Settings → Deactivate License.

**Expected:**
Either deactivation succeeds, or the user is told they are already deactivated and the local record is cleared.

**Actual:**
In `src/lib/license.js:138-189`, if the server returns an error (e.g. "instance not found" because it was revoked elsewhere), the code returns `{ ok: false, error: ... }` and does **not** clear the local license record. The local `isPaid` stays true until the 7-day revalidation runs. The user sees a red error, cannot deactivate, cannot re-activate elsewhere without contacting support.

**Why this matters for launch:**
Single-device license transfer is a primary support scenario for one-time-purchase SaaS. The current failure mode produces "my license is stuck" support tickets and an unrecoverable UI until revalidation happens.

**Recommended fix:**
If the deactivation API call returns a "not_found"/"already_deactivated"/404 response, treat it as a success: `localStorage.removeItem(LICENSE_STORAGE_KEY)` and return `{ ok: true, alreadyDeactivated: true }`. Surface a neutral "This license was already deactivated — cleared locally." `src/lib/license.js:168-189`.

---

## Top 3 blockers

1. **UpgradeGate shows wrong features on Report/Requests** — the two most prominent Quick Actions point free users at an upgrade wall that describes the wrong product.
2. **Report is paywalled but nav marks it free** — breaks the "share your ESG Passport" core promise; need an intentional entitlement decision before launch.
3. **Post-purchase banner always says "Pro"** — Pro+ buyers get a €499 purchase confirmed with "Pro" tier wording at the first touchpoint.

## Top 3 highs

1. **Offline fallback accepts any 8+ char string as a license on the hosted domain** — should be gated to the downloaded-zip build only.
2. **Respond nav lock lies either way** — either remove the lock or gate the page; current state tanks both the free preview funnel and nav consistency.
3. **Onboarding promises paid-only capabilities without qualifier** — direct bait-and-switch trust break on first run.

## Retest after fixes land

- Re-run the **Free user end-to-end** journey once UpgradeGate copy is feature-aware — confirm Report/Requests gates now describe the right thing and that no other call site of UpgradeGate regresses.
- Re-run **Pro+ post-purchase** (simulate `?activate=<pro-plus-key>&welcome=pro-plus`) and verify banner, ActivationCard, and Settings all say "Pro+".
- Re-run **offline activation** after the downloaded-zip gate lands — confirm hosted domain rejects garbage keys and the zip still accepts them.
- Re-run **deactivate → activate on new device** after the deactivation-idempotency fix — specifically the "already revoked on server" path.
- Re-check the **Respond lock/preview decision** from both P2 (Procurement) and P5 (Grandma) personas after it's resolved — whichever direction is picked, the nav, Home CTAs, and Onboarding value props must agree.

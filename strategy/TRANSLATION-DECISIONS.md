# Translation & Localization Decisions

Last updated: 2026-04-09

## Context

The original language switcher in the Respond results bar used a phrase-replacement
approach (`translateAnswer` in `src/lib/translations.js`) that swapped a small
dictionary of English phrases for German/French/Spanish equivalents. In testing,
clicking DE/FR/ES changed only 1–2 words per answer, leaving most of the text
in English. This was rejected as a "feature in name only" — actively misleading
to buyers and damaging to trust.

A focus group (mixed European, including Polish speakers) named multilingual
support as a top requirement, so dropping the feature was not viable.

## Path NOT taken: LLM at runtime

LLM translation (Claude/GPT/etc.) at runtime was considered and rejected because
it breaks the product's central trust promise: "your data never leaves your
device." Sending generated answers — which contain the user's real operational
data, products, headcount, emissions, etc. — to a cloud API would contradict
the marketing page and undermine the strongest part of the product's positioning.

A user-toggleable "send to cloud for translation" option was discussed but
deferred. It may resurface later as an opt-in advanced feature, but is not
the default path.

## Path chosen: hand-translated template strings, fully local

The 39 templates in
`response-ready/domain-packs/esg/answerTemplates.ts` produce ~85 distinct
English sentences (~1,200–1,500 source words). These will be translated into:

- German (DE) — priority 1
- Polish (PL) — priority 1
- French (FR)
- Spanish (ES)
- Italian (IT)
- Dutch (NL)

Translation will be done by running LLM tools (Claude, ChatGPT, DeepL) over the
source document, comparing outputs, and proofreading. Quality bar is "good
enough that a competent compliance officer in the target language finds it
professional," not "literary perfection." Minor grammatical roughness is
acceptable for a €199 one-time-purchase product, especially with the
mitigation below.

## Mitigation: per-answer English fallback

Each answer in the results view will get a small "show in English" link. Users
who are unsure whether a translated sentence says what they think it says can
spot-check the original English without switching the entire view. This
converts the trust risk ("did the German really say what I think?") into a
confidence-builder.

## Source-of-truth document

`response-ready/domain-packs/esg/TRANSLATION-SOURCE.md` contains the canonical
English string set, grouped by template topic, with all `___` placeholders
preserved and explicit translator notes. This file is the spec. Translators
work from it.

## File structure for translations

Per-language Markdown files, not a single multi-language document:

```
response-ready/domain-packs/esg/translations/
  TRANSLATION-SOURCE.md   (English spec)
  de.md
  pl.md
  fr.md
  es.md
  it.md
  nl.md
```

Reasons: cleaner LLM output (one language at a time avoids attention dilution),
easier review by native speakers (no scrolling past other languages), easier
swap/redo of any single language, cleaner programmatic extraction on the code
side, cleaner version-control diffs.

## Translation prompt

A single-language version of the translation prompt is the unit of work.
Run it six times, once per target language. The prompt enforces:

- Preserve `___` placeholders exactly (positions may shift for natural word
  order, but never delete, rename, or split them)
- Do NOT translate technical terms: kWh, tCO2e, Scope 1/2/3, FTE, ISO 45001,
  ISO 14001, ISO 9001, m³, TRIR, 3TG, CDP, EcoVadis, CSRD, GRI, VSME
- Tone: formal-but-direct, voice of a competent compliance officer
- Restructure sentences for natural flow when needed (don't mirror English
  word order if the target language wants something different)
- Maintain the exact section headers and bullet ordering of the source
- Mark uncertain terminology with `[TRANSLATOR NOTE: ...]` rather than guessing

## Code-side scaffolding (deferred until first translation lands)

When at least one language file is ready, the code work is:

1. Refactor `answerTemplates.ts` so each template pulls strings from a
   per-language phrase map keyed by `lang` instead of inline literals.
   Control flow stays identical; only string source changes. ~half day.
2. Add a `lang` parameter to the engine config in `createResponseEngine`.
3. Wire the Respond page to pass the user's selected language through.
4. Add multilingual keyword aliases to `keywordRules.ts` so foreign-language
   questionnaires actually MATCH the right topics in the first place.
   Independent of template translation; can ship in parallel.
5. Replace the deleted (or about-to-be-deleted) results-bar language switcher
   with a top-level setting on Settings page + browser language auto-detect
   on first run. Per-screen toggle is the wrong abstraction; the whole app
   should feel native, not just the answer text.
6. Add the per-answer "show in English" link.

## Open questions to resolve when translations arrive

- Does Polish present any technical-term ambiguities the English source
  doesn't anticipate? (Polish ESG vocabulary is less standardized than DE/FR.)
- Should the Settings language selector control UI strings as well as answer
  language, or are those independent?
- How should the auto-detect handle a user whose browser is German but who
  uploads an English questionnaire? Default: respect browser language, give
  them a one-click switch on the results page if it's wrong.

## What is NOT changing

- The marketing page promise "your data never leaves your device" stays.
- The €199 one-time pricing stays.
- The local-first architecture stays. No cloud dependencies introduced for
  translation.
- The existing 39 English templates stay the source of truth — translations
  are derived from them, not parallel rewrites.

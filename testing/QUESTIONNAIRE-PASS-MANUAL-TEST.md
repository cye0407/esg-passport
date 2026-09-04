# Questionnaire Pass manual test plan

Before testing, configure `VITE_QUESTIONNAIRE_PASS_VARIANT_ID` with the real
Lemon Squeezy variant ID and activate a test license for that variant.

1. With no license, confirm Data/import remains available, `/demo` shows the
   sample preview, and a real questionnaire upload/export remains locked.
2. Activate a Questionnaire Pass. Confirm document extraction and the real
   questionnaire upload flow are available.
3. Select an unreadable or empty file. Confirm the parse error appears and no
   pass confirmation or claim is created.
4. Run a built-in sample. Confirm it generates without assigning the pass.
5. Upload a usable real questionnaire. Confirm the one-questionnaire message is
   shown before generation and cancel leaves the pass unused.
6. Confirm with “Use my pass for this questionnaire.” Review, edit, regenerate,
   export, reload the app, and reopen the saved result.
7. Rename and re-upload the same questionnaire. Confirm it remains allowed.
8. Delete its saved result, reload, and upload a materially different
   questionnaire. Confirm it remains blocked and the original questionnaire
   name is shown; if a saved original result exists, confirm the reopen button.
9. Follow the upgrade link and confirm it opens the existing full Passport
   checkout. Confirm no expiry/countdown copy is displayed.
10. Activate a known full Passport license and confirm unlimited distinct
    questionnaires, document extraction, saved results, and exports still work.

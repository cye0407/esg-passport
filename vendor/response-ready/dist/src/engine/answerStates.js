// ============================================
// ResponseReady — Answer states, in the words a person sees
// ============================================
// The engine's states are ids. These are the labels and one-line explanations the app shows as
// the tag on a cell, written for the person filling the form — not for the buyer, and not in the
// engine's vocabulary ("record", "evidence", "draft"). Hand-written in both languages.
const LABELS = {
    answered: {
        en: { label: 'Answered from your files', hint: 'Written from figures and documents you added. Check it reads right, then move on.' },
        de: { label: 'Aus Ihren Unterlagen beantwortet', hint: 'Aus Ihren Zahlen und Dokumenten geschrieben. Kurz gegenlesen, dann weiter.' },
    },
    partial: {
        en: { label: 'Partly answered', hint: 'We could answer part of this. The sentence says which part is missing.' },
        de: { label: 'Teilweise beantwortet', hint: 'Einen Teil konnten wir beantworten. Der Satz sagt, was noch fehlt.' },
    },
    'not-applicable': {
        en: { label: 'Doesn\'t apply to you', hint: 'Your files say this does not apply. The cell says so in one line.' },
        de: { label: 'Trifft auf Sie nicht zu', hint: 'Laut Ihren Unterlagen trifft das nicht zu. Die Zelle sagt das in einem Satz.' },
    },
    'no-evidence': {
        en: { label: 'Nothing on file yet', hint: 'We understood the question but have nothing of yours to answer it with. Add the document or figure, write it yourself, or insert the placeholder sentence.' },
        de: { label: 'Noch nichts hinterlegt', hint: 'Wir haben die Frage verstanden, aber nichts von Ihnen, womit wir sie beantworten könnten. Dokument oder Zahl ergänzen, selbst schreiben oder den Platzhaltersatz einsetzen.' },
    },
    'left-to-you': {
        en: { label: 'Yours to write', hint: 'A comment box or something only you can say. We left it alone.' },
        de: { label: 'Ihr Text', hint: 'Ein Kommentarfeld oder etwas, das nur Sie sagen können. Wir haben es freigelassen.' },
    },
};
export function answerStateLabel(state, lang = 'en') {
    return LABELS[state][lang === 'de' ? 'de' : 'en'];
}
/** The label of the "insert the placeholder sentence" action, so app and engine say the same thing. */
export function insertPlaceholderLabel(lang = 'en') {
    return lang === 'de' ? 'Platzhaltersatz einsetzen' : 'Insert placeholder sentence';
}
//# sourceMappingURL=answerStates.js.map
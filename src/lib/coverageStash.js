// The questionnaire a free reader is part-way through, kept while they go and fetch a
// document.
//
// A free coverage report is not saved — saveResults is gated on canExportResponses, and
// writing the full drafts to disk would put the paid artefact on the machine of someone
// who has not bought it. But the report's whole point is to send you off for a bill, and
// coming back to an empty upload screen looks like the work was thrown away.
//
// So the QUESTIONNAIRE is kept and the answers are not, and re-running is the point:
// they added a document, so the counts should move. Session-scoped, because this is a
// return-trip aid rather than a saved result.
//
// It also carries what the report asked for, so the evidence page can say which
// documents this questionnaire actually wants instead of being a blank uploader.
const KEY = 'respond_coverage_questionnaire';

/** @param {{parseResult: object, name: string, questionCount: number, missingDocuments: Array}} value */
export function writeCoverageStash(value) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Storage blocked or full. They can re-upload; never worth an error here.
  }
}

/** Reads WITHOUT clearing — the evidence page looks at this and must not consume it. */
export function readCoverageStash() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Reads and clears, for the one caller that resumes the questionnaire itself. */
export function takeCoverageStash() {
  const value = readCoverageStash();
  clearCoverageStash();
  return value;
}

export function clearCoverageStash() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

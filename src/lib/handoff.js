// In-memory hand-off between routes.
//
// The dashboard is where people arrive and it is where they are holding the thing they
// want to do something with — a questionnaire, or a bill. Making them find the right tab
// first is the friction; dropping it on the dashboard and letting the right page pick it
// up removes it.
//
// Deliberately NOT localStorage or sessionStorage: a File cannot be serialised, and the
// extracted fields are the user's own figures which have no business being written to
// disk twice. A reload loses the hand-off, which is correct — the file is still on their
// machine and the drop takes one second.
let pending = null;

/** @param {{kind: 'questionnaire', file: File} | {kind: 'extraction', fields: Array, period: string|null, fileName: string}} payload */
export function setHandoff(payload) {
  pending = payload;
}

/** Reads and clears. A hand-off is consumed once; a second page must not re-apply it. */
export function takeHandoff(kind) {
  if (!pending || pending.kind !== kind) return null;
  const payload = pending;
  pending = null;
  return payload;
}

export function clearHandoff() {
  pending = null;
}

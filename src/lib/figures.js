// Showing a figure next to an answer, without lying with it.
//
// Two defects this exists to close, both seen on one screen:
//
// 1. The engine hands back dataValue as a raw string built from a float —
//    "68.58000000000001 tCO2e" — while the answer prose beside it correctly says
//    68.6 tCO2e. Fifteen decimal places of binary floating point is not a measurement,
//    it is an artefact, and it makes a careful supplier distrust the whole page.
//
// 2. dataValue is attached to a draft whether or not the answer the engine chose
//    actually rests on it. A question about Scope 3 came back with "We do not have
//    quantified Scope 3 emissions on record" AND a 68.58 tCO2e figure underneath —
//    the Scope 1 number, contradicting the sentence above it.
//
// So: round it, and only ever show it when the answer itself states it.

/**
 * Round the numbers inside a figure string to something a person would write.
 *
 * Scaled by magnitude rather than fixed, so a tonnage keeps one decimal ("68.6") and a
 * rate keeps its precision ("0.043"). Anything that is not a long decimal is left
 * exactly as it is — this only trims artefacts, it never reformats a figure someone
 * typed themselves.
 */
export function formatFigure(value) {
  if (value == null) return null;
  return String(value).replace(/-?\d+\.\d{3,}/g, (match) => {
    const n = Number(match);
    if (!Number.isFinite(n)) return match;
    const magnitude = Math.abs(n);
    const places = magnitude >= 10 ? 1 : magnitude >= 1 ? 2 : 3;
    // toFixed then drop trailing zeros: 68.6, not 68.60.
    return String(Number(n.toFixed(places)));
  });
}

/** The figure and its unit as one string, or null when there is nothing to show. */
export function figureWithUnit(value, unit) {
  const figure = formatFigure(value);
  if (!figure) return null;
  return unit ? `${figure} ${unit}` : figure;
}

/**
 * Does the answer actually state this figure?
 *
 * The guard against defect 2. A number the answer does not mention has no business
 * sitting under it — either the engine picked a different template, or the answer says
 * the data is missing, and in both cases showing the number contradicts the words.
 *
 * Compared on digits alone, because the prose rounds ("68.6") and the value may not
 * ("68.58000000000001"), and the two are formatted independently.
 */
export function answerStatesFigure(answerText, value) {
  const figure = formatFigure(value);
  if (!figure || !answerText) return false;
  const numbers = figure.match(/-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return false;
  const answer = String(answerText);
  return numbers.every((number) => {
    if (answer.includes(number)) return true;
    // "68.6" in prose against a "68.58" value, or the other way round: allow the prose
    // to have rounded one place further than we did.
    const n = Number(number);
    if (!Number.isFinite(n)) return false;
    return [0, 1, 2].some(places => answer.includes(String(Number(n.toFixed(places)))));
  });
}

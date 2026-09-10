// Which of the dashboard's two doors is already open.
//
// The dashboard offers one gesture — hand us a file — in two flavours: the
// questionnaire your customer sent, or the bills you already have. A switcher only
// beats two competing cards if nobody has to touch it, so the selected tab is derived
// from what the workspace looks like, and only falls back to the last choice when
// nothing in the state argues for either door.
//
// The order matters more than the rules:
//   1. Nothing tracked at all → the questionnaire. Free exists so someone can read the
//      file on their desk against their own records; there is nothing to track against
//      yet, and the old dashboard's "enter your September data" told a first-time
//      visitor the job was a data-entry form.
//   2. A coverage report has named documents → bills. The report has just said which
//      document answers how many questions. That is the next move, and it is free at
//      every tier.
//   3. The current month is missing and nothing is in flight → bills. A bill closes the
//      month faster than typing does, and typing is one link below it.
//   4. Otherwise → whatever they used last.
export const HOME_TABS = Object.freeze({ questionnaire: 'questionnaire', bills: 'bills' });

const TAB_STORAGE_KEY = 'esg_passport_home_tab';

export function isHomeTab(value) {
  return value === HOME_TABS.questionnaire || value === HOME_TABS.bills;
}

/**
 * @param {{
 *   hasAnyData?: boolean,
 *   hasCurrentMonthData?: boolean,
 *   missingDocumentCount?: number,
 *   lastTab?: string|null,
 * }} state
 * @returns {'questionnaire'|'bills'}
 */
export function defaultHomeTab(state = {}) {
  const {
    hasAnyData = false,
    hasCurrentMonthData = false,
    missingDocumentCount = 0,
    lastTab = null,
  } = state;

  if (!hasAnyData) return HOME_TABS.questionnaire;
  if (missingDocumentCount > 0) return HOME_TABS.bills;
  if (!hasCurrentMonthData) return HOME_TABS.bills;
  return isHomeTab(lastTab) ? lastTab : HOME_TABS.questionnaire;
}

export function readLastHomeTab() {
  try {
    const value = localStorage.getItem(TAB_STORAGE_KEY);
    return isHomeTab(value) ? value : null;
  } catch {
    // Storage blocked. The rules above still pick a sensible door.
    return null;
  }
}

export function writeLastHomeTab(tab) {
  if (!isHomeTab(tab)) return;
  try {
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  } catch {
    // Remembering the choice is a convenience, never a requirement.
  }
}

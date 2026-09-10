import { describe, expect, it } from 'vitest';
import { defaultHomeTab, HOME_TABS, isHomeTab } from '../homeTab';

describe('defaultHomeTab', () => {
  // The bug this replaces: the dashboard's primary action ranked "enter your September
  // data" second and "upload a questionnaire" LAST, so someone who arrived holding an
  // EcoVadis request was told to type in their electricity first.
  it('opens on the questionnaire when nothing is tracked, whatever was used last', () => {
    expect(defaultHomeTab({ hasAnyData: false, lastTab: HOME_TABS.bills }))
      .toBe(HOME_TABS.questionnaire);
  });

  it('opens on bills once a coverage report has named documents', () => {
    expect(defaultHomeTab({
      hasAnyData: true,
      hasCurrentMonthData: true,
      missingDocumentCount: 3,
      lastTab: HOME_TABS.questionnaire,
    })).toBe(HOME_TABS.bills);
  });

  // Named documents beat an open month: the report has said which document answers how
  // many questions, which is more specific than "September is missing".
  it('prefers named documents over a missing month', () => {
    expect(defaultHomeTab({
      hasAnyData: true,
      hasCurrentMonthData: false,
      missingDocumentCount: 2,
    })).toBe(HOME_TABS.bills);
  });

  it('opens on bills when the current month is missing and nothing is in flight', () => {
    expect(defaultHomeTab({ hasAnyData: true, hasCurrentMonthData: false }))
      .toBe(HOME_TABS.bills);
  });

  it('falls back to the last tab used when the state argues for neither door', () => {
    const settled = { hasAnyData: true, hasCurrentMonthData: true, missingDocumentCount: 0 };
    expect(defaultHomeTab({ ...settled, lastTab: HOME_TABS.bills })).toBe(HOME_TABS.bills);
    expect(defaultHomeTab({ ...settled, lastTab: HOME_TABS.questionnaire }))
      .toBe(HOME_TABS.questionnaire);
  });

  it('ignores a stored value that is not a tab', () => {
    expect(defaultHomeTab({
      hasAnyData: true,
      hasCurrentMonthData: true,
      lastTab: 'data-entry',
    })).toBe(HOME_TABS.questionnaire);
  });

  it('never returns anything but a real tab, given no state at all', () => {
    expect(isHomeTab(defaultHomeTab())).toBe(true);
  });
});

const QUESTIONNAIRE_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv', '.pdf', '.docx']);
export const SKIP_COLUMN_VALUE = '__skip__';

export function mappingSelectValue(value) {
  return value || SKIP_COLUMN_VALUE;
}

export function mappingColumnValue(value) {
  return value === SKIP_COLUMN_VALUE ? '' : value;
}

export function questionnaireExtension(fileName = '') {
  const match = String(fileName).toLowerCase().match(/\.[^.]+$/);
  return match?.[0] || 'other';
}

export function requiresQuestionConfirmation(fileName = '') {
  return QUESTIONNAIRE_EXTENSIONS.has(questionnaireExtension(fileName));
}

/**
 * A deliberately conservative warning, not a rejection. `totalRows` means populated
 * spreadsheet rows or extracted document lines depending on the parser, so it cannot
 * support a precise recall estimate. It can still identify extreme shapes where showing
 * a polished coverage report without asking the user to look would be irresponsible.
 */
export function thinParseSummary(parseResult, fileName = parseResult?.metadata?.fileName || '') {
  const questions = Number(parseResult?.questions?.length || 0);
  const rows = Number(parseResult?.metadata?.totalRows || 0);
  const extension = questionnaireExtension(fileName);
  const tabular = extension === '.xlsx' || extension === '.xls' || extension === '.csv';
  const thin = (rows >= 12 && questions <= 2)
    || (tabular && rows >= 20 && questions / rows < 0.5);
  return { thin, questions, rows, extension };
}

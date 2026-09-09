// Backup export/import — and the one rule that governs both.
//
// The workspace blob in localStorage holds ESG records, policies, requests AND
// `settings.aiApiKey`, the user's own OpenAI or Anthropic key. "Export Backup"
// used to write that blob out verbatim, so a customer who sent a backup to
// support, to a colleague, or into a shared drive sent a live billable
// credential with it. Backups get passed around; that is what they are for.
//
// So: secrets never leave the browser in an export, and an import never
// clobbers the key that is already here (the file it came from does not
// carry one any more).

/**
 * Settings fields that hold a credential. Redacted on export, preserved from
 * the local workspace on import.
 */
export const SECRET_SETTINGS_FIELDS = ['aiApiKey'];

/**
 * Anything whose *name* looks like a credential, whatever nesting it sits at.
 * SECRET_SETTINGS_FIELDS covers what we ship today; this catches a field some
 * future version adds without anyone rereading this file.
 */
const SECRET_NAME = /(api[-_]?key|secret|password|passphrase|token|credential|bearer)/i;

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Deep copy of `data` with every credential-shaped field removed.
 * Returns a new object; the input is not modified.
 */
export function redactSecretsForBackup(data) {
  if (Array.isArray(data)) return data.map(redactSecretsForBackup);
  if (!isPlainObject(data)) return data;

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SECRET_NAME.test(key)) continue;
    clean[key] = redactSecretsForBackup(value);
  }
  return clean;
}

/**
 * Merge an imported backup over the current workspace, keeping the local
 * credentials. Without this, importing a (now key-free) backup would silently
 * clear the API key the user had configured and break answer rewriting with
 * no explanation.
 */
export function mergeImportedBackup(imported, current) {
  const merged = redactSecretsForBackup(imported);
  if (!isPlainObject(merged)) return merged;

  const currentSettings = isPlainObject(current?.settings) ? current.settings : {};
  const preserved = {};
  for (const field of SECRET_SETTINGS_FIELDS) {
    if (currentSettings[field]) preserved[field] = currentSettings[field];
  }
  if (Object.keys(preserved).length === 0) return merged;

  return {
    ...merged,
    settings: { ...(isPlainObject(merged.settings) ? merged.settings : {}), ...preserved },
  };
}

/** The JSON text to write to a backup file, given the raw stored workspace. */
export function serializeBackup(data) {
  return JSON.stringify(redactSecretsForBackup(data), null, 2);
}

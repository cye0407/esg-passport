const RECOVERY_PARAM = 'app-recovery';

export function isDynamicImportFailure(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|chunkloaderror|loading chunk [^ ]+ failed/i.test(message);
}

export function recoverFromDynamicImportFailure(error, browserWindow = globalThis.window) {
  if (!isDynamicImportFailure(error) || !browserWindow?.location) return false;

  const currentUrl = new URL(browserWindow.location.href);
  if (currentUrl.searchParams.has(RECOVERY_PARAM)) return false;

  currentUrl.searchParams.set(RECOVERY_PARAM, Date.now().toString());
  browserWindow.location.replace(currentUrl.toString());
  return true;
}

export function clearDynamicImportRecovery(browserWindow = globalThis.window) {
  if (!browserWindow?.location || !browserWindow?.history) return;
  const currentUrl = new URL(browserWindow.location.href);
  if (!currentUrl.searchParams.has(RECOVERY_PARAM)) return;

  currentUrl.searchParams.delete(RECOVERY_PARAM);
  browserWindow.history.replaceState(browserWindow.history.state, '', currentUrl.toString());
}

export function shouldSaveSession(ready: boolean, dirty: boolean) {
  return ready && dirty;
}

export function isQuotaError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED";
}

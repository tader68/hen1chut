// Only chooses whether to restore an account. Presence of a token is never
// authorization: the restore path still validates it with Auth.getUser().
// Storage key follows the pinned SupabaseClient's defaultStorageKey.
export function needsAccountRestore(
  projectUrl: string,
  href: string,
  storage: Pick<Storage, "getItem">,
): boolean {
  const callback = new URL(href).searchParams;
  if (callback.has("code") || callback.has("error")) return true;
  try {
    const project = new URL(projectUrl).hostname.split(".")[0];
    return storage.getItem(`sb-${project}-auth-token`) !== null;
  } catch {
    return false;
  }
}

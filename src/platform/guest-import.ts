const KEY = "hen1chut.import-guest";
export function requestGuestImport(sessionId: string): void {
  try { sessionStorage.setItem(KEY, sessionId); } catch { /* Guest data stays local. */ }
}
export function takeGuestImport(sessionId: string): boolean {
  try {
    const requested = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return requested === sessionId;
  } catch { return false; }
}

import { normalizePlayerState, type PlayerState } from "./player-state";
export interface PendingState {
  revision: number;
  state: PlayerState;
}
const key = (userId: string) => `hen1chut.account.${userId}.pending`;
export function loadPending(userId: string): PendingState | null {
  try {
    const value = JSON.parse(localStorage.getItem(key(userId)) || "null");
    const state = normalizePlayerState(value?.state);
    if (
      !state ||
      typeof value?.revision !== "number" ||
      !Number.isSafeInteger(value.revision) ||
      value.revision < 0
    )
      return null;
    return { revision: value.revision, state };
  } catch {
    return null;
  }
}
export function savePending(
  userId: string,
  revision: number,
  state: PlayerState,
): void {
  try {
    localStorage.setItem(key(userId), JSON.stringify({ revision, state }));
  } catch {
    /* Other local saves still run if quota is low. */
  }
}
export function clearPending(userId: string): void {
  try {
    localStorage.removeItem(key(userId));
  } catch {}
}
export function reconcileState(
  remote: PlayerState | null,
  revision: number,
  pending: PendingState | null,
): { state: PlayerState | undefined; conflict: boolean } {
  if (!pending) return { state: remote || undefined, conflict: false };
  return { state: pending.state, conflict: pending.revision !== revision };
}

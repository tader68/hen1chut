import { normalizeCharacter, type Character } from "../character/model";
import { normalizeSession, type PlaySession } from "../character/session";
import { normalizeProgress, type DailyProgress } from "../progress/daily";
import { normalizePreferences, type Preferences } from "./preferences";
export interface PlayerState {
  character: Character;
  session: PlaySession;
  daily: DailyProgress;
  preferences: Preferences;
}
export function normalizePlayerState(value: unknown): PlayerState | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<PlayerState>;
  if (!v.character || !v.session) return null;
  return {
    character: normalizeCharacter(v.character),
    session: normalizeSession(v.session),
    daily: normalizeProgress(v.daily),
    preferences: normalizePreferences(v.preferences),
  };
}

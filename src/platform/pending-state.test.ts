import { describe, it, expect } from "vitest";
import { reconcileState } from "./pending-state";
import { defaultCharacter } from "../character/model";
import { newSession, addImpact } from "../character/session";
import { normalizeProgress } from "../progress/daily";
import { normalizePreferences } from "./preferences";
const base = {
  character: defaultCharacter,
  session: newSession(),
  daily: normalizeProgress(null),
  preferences: normalizePreferences(null),
};
describe("unfinished session synchronization", () => {
  it("restores unsent local impacts on reload instead of replacing them with an older cloud snapshot", () => {
    const local = {
      ...base,
      session: addImpact(base.session, "tomato", 120, 140),
    };
    expect(reconcileState(base, 4, { revision: 4, state: local })).toEqual({
      state: local,
      conflict: false,
    });
  });
  it("keeps both versions when a different device has saved and asks for a choice", () => {
    const local = {
      ...base,
      session: addImpact(base.session, "boxing", 120, 140),
    };
    const result = reconcileState(base, 5, { revision: 4, state: local });
    expect(result.conflict).toBe(true);
    expect(result.state?.session.hits).toBe(1);
  });
  it("uses remote state when there is no pending save and supports first-time sync", () => {
    expect(reconcileState(base, 4, null).state).toBe(base);
    expect(reconcileState(null, 0, { revision: 0, state: base }).conflict).toBe(
      false,
    );
  });
});

import { describe, expect, it } from "vitest";
import { needsAccountRestore } from "./entry";
describe("instant guest entry", () => {
  const project = "https://game.supabase.co", href = "https://example.com/game/";
  it("does not load account services for a first visit", () => {
    expect(needsAccountRestore(project, href, { getItem: () => null })).toBe(false);
  });
  it("restores an existing SDK session without treating its contents as trusted", () => {
    expect(needsAccountRestore(project, href, { getItem: key => key === "sb-game-auth-token" ? "untrusted" : null })).toBe(true);
    expect(needsAccountRestore(project, href, { getItem: key => key === "sb-another-auth-token" ? "other account" : null })).toBe(false);
  });
  it("handles an OAuth callback even when storage is blocked", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); } };
    expect(needsAccountRestore(project, href + "?code=callback", blocked)).toBe(true);
    expect(needsAccountRestore(project, href + "?error=access_denied", blocked)).toBe(true);
    expect(needsAccountRestore(project, href, blocked)).toBe(false);
  });
});

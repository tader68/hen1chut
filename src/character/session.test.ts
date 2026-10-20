import { describe, it, expect, vi, afterEach } from "vitest";
import {
  newSession,
  addImpact,
  normalizeSession,
  loadSession,
  saveSession,
  renderMarks,
} from "./session";
afterEach(() => vi.unstubAllGlobals());
describe("session persistence", () => {
  it("keeps all impacts, cumulative expression and stains through serialisation/reload", () => {
    let s = newSession(1000);
    for (let i = 0; i < 16; i++)
      s = addImpact(s, i % 2 ? "tomato" : "water", 120, 140, 2000 + i);
    const saved = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => saved.get(key) || null,
      setItem: (key: string, v: string) => saved.set(key, v),
    });
    expect(saveSession(s)).toBe(true);
    expect(loadSession()).toEqual(s);
    expect(loadSession().mood).toBe("knocked");
    expect(renderMarks(s.marks)).toContain("#e89a7f");
  });
  it("does not accept new impacts after a session is ended", () => {
    const s = { ...newSession(1000), endedAt: 2000 };
    expect(addImpact(s, "boxing", 130, 140)).toBe(s);
  });
  it("clears effects only in an explicitly new session", () => {
    const s = addImpact(newSession(), "slipper", 90, 120);
    const next = newSession();
    expect(next.id).not.toBe(s.id);
    expect(next.hits).toBe(0);
    expect(next.marks).toEqual([]);
  });
  it("bounds stored effects and rejects hostile values", () => {
    let s = newSession();
    for (let i = 0; i < 100; i++) s = addImpact(s, "hammer", Infinity, -500);
    const restored = normalizeSession(s);
    expect(restored.marks.length).toBeLessThanOrEqual(18);
    expect(restored.marks.every((m) => Number.isFinite(m.x) && m.y >= 60)).toBe(
      true,
    );
    expect(normalizeSession({ id: "<script>", hits: Infinity }).hits).toBe(0);
  });
  it("keeps playing when browser storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    });
    expect(loadSession().hits).toBe(0);
    expect(saveSession(newSession())).toBe(false);
  });
});

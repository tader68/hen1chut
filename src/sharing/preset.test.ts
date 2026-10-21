import { describe, it, expect, vi, afterEach } from "vitest";
import {
  presetUrl,
  parsePreset,
  rememberPreset,
  recoverPreset,
} from "./preset";
import { defaultCharacter } from "../character/model";
describe("share presets", () => {
  it("round-trips appearance without exposing a private name or query parameters", () => {
    const url = presetUrl(
      {
        ...defaultCharacter,
        name: "Tên riêng tư",
        kind: "cat",
        outfit: "overalls",
        hat: "crown",
        glasses: "star",
      },
      "rain",
      "https://example.com/game/?private=1",
    );
    expect(url).not.toContain("private");
    expect(decodeURIComponent(url)).not.toContain("Tên riêng tư");
    expect(parsePreset(new URL(url).hash)).toEqual({
      character: {
        ...defaultCharacter,
        name: "Bạn hứng bực",
        kind: "cat",
        outfit: "overalls",
        hat: "crown",
        glasses: "star",
      },
      scene: "rain",
    });
  });
  it("rejects unknown versions, malformed URI and oversized input", () => {
    for (const hash of [
      "",
      "#other=x",
      "#ban=%ZZ",
      "#ban=v%3D2",
      "#ban=" + "x".repeat(601),
    ])
      expect(parsePreset(hash)).toBeNull();
  });
  it("normalizes hostile fields instead of inserting arbitrary markup", () => {
    const result = parsePreset(
      "#ban=" + encodeURIComponent("v=1&c=%22%3E%3Cscript%3E&k=oops&s=evil"),
    );
    expect(result?.character.color).toBe(defaultCharacter.color);
    expect(result?.scene).toBe("studio");
  });
});

describe("invitations across Google redirects", () => {
  afterEach(() => vi.unstubAllGlobals());
  function memoryStorage() {
    const values = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    return values;
  }
  it("restores appearance after OAuth without retaining private names or the callback code", () => {
    const values = memoryStorage(),
      source = presetUrl(
        {
          ...defaultCharacter,
          name: "Private target",
          hat: "crown",
          glasses: "star",
        },
        "rain",
        "https://example.com/game/",
      );
    rememberPreset(source);
    expect([...values.values()].join()).not.toContain("Private target");
    const result = new URL(
      recoverPreset("https://example.com/game/?code=one-time-code"),
    );
    expect(result.search).toBe("");
    expect(parsePreset(result.hash)?.character.hat).toBe("crown");
    expect(parsePreset(result.hash)?.character.glasses).toBe("star");
    expect(values.size).toBe(0);
  });
  it("preserves a newer incoming invitation and consumes the old one only once", () => {
    memoryStorage();
    rememberPreset(presetUrl(defaultCharacter, "rain", "https://example.com/"));
    const newer = presetUrl(
      { ...defaultCharacter, kind: "cat" },
      "space",
      "https://example.com/",
    );
    expect(recoverPreset(newer)).toBe(newer);
    expect(recoverPreset("https://example.com/")).toBe("https://example.com/");
  });
  it("continues without an invitation if session storage is blocked", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() =>
      rememberPreset(
        presetUrl(defaultCharacter, "rain", "https://example.com/"),
      ),
    ).not.toThrow();
    expect(recoverPreset("https://example.com/")).toBe("https://example.com/");
  });
});

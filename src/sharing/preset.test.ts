import { describe, it, expect } from "vitest";
import { presetUrl, parsePreset } from "./preset";
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

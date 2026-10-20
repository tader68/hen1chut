import { describe, it, expect } from "vitest";
import { normalizeCharacter, defaultCharacter, escapeHtml } from "./model";
import { renderFigure } from "./figure";
import { kinds, outfits, bodies, colors } from "./model";
import { tools, toolArt } from "../tools/registry";
import { scenes, sceneArt } from "../env/scenes";
describe("saved characters", () => {
  it("recovers malformed or missing data", () => {
    for (const input of [
      null,
      undefined,
      "oops",
      42,
      { kind: "unknown", name: "", outfit: "broken", color: "url(evil)" },
    ])
      expect(normalizeCharacter(input)).toEqual(defaultCharacter);
  });
  it("limits names by Unicode characters and escapes user content", () => {
    expect(
      Array.from(normalizeCharacter({ name: "🐈".repeat(30) }).name),
    ).toHaveLength(20);
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });
  it("rejects CSS or markup injected through saved colors", () => {
    expect(
      normalizeCharacter({ color: '"><script>alert(1)</script>' }).color,
    ).toBe(colors[0]);
  });
});
describe("rendering coverage", () => {
  it("renders every base character combination in every mood without invalid numbers", () => {
    for (const kind of kinds)
      for (const outfit of outfits)
        for (const body of bodies)
          for (const color of colors)
            for (const mood of [
              "normal",
              "ouch",
              "dizzy",
              "knocked",
            ] as const) {
              const svg = renderFigure(
                { ...defaultCharacter, kind, outfit, body, color },
                mood,
              );
              expect(svg).toContain("<svg");
              expect(svg).not.toMatch(/undefined|NaN/);
            }
  });
  it("has distinct art and valid definitions for every tool and scene", () => {
    expect(new Set(tools.map((t) => toolArt(t.id))).size).toBe(tools.length);
    expect(new Set(scenes.map((s) => sceneArt(s.id))).size).toBe(3);
  });
});

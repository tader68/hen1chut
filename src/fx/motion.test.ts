import { describe, it, expect } from "vitest";
import { tools } from "../tools/registry";
import { impactMotion } from "./motion";
describe("toy motion", () => {
  it("has a distinct figure reaction for each of the 12 toys, and a settled final pose", () => {
    const animations = tools.map((t) => impactMotion(t.id));
    expect(new Set(animations.map((a) => JSON.stringify(a.figure))).size).toBe(
      tools.length,
    );
    for (const animation of animations) {
      expect(animation.figure.at(-1)?.transform).toBe("scale(1)");
      expect(animation.duration).toBeLessThan(1000);
    }
  });
  it("extends the reaction in low gravity without changing persistent impact state", () => {
    for (const tool of tools)
      expect(impactMotion(tool.id, true).duration).toBeGreaterThan(
        impactMotion(tool.id).duration,
      );
  });
});

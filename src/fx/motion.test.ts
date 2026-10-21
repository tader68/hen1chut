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
  it("keeps the weapon and recoil on the intended side without mirroring the character art", () => {
    const right = impactMotion("boxing", false, 1);
    const left = impactMotion("boxing", false, -1);
    expect(right.figure[1].transform).toContain("translate(46px");
    expect(left.figure[1].transform).toContain("translate(-46px");
    expect(right.weapon[0].transform).toContain("translate(-170px");
    expect(left.weapon[0].transform).toContain("translate(65px");
    expect(JSON.stringify(left.figure)).not.toContain("scale(-1");
  });
});

import { describe, expect, it } from "vitest";
import { puppetMotion } from "./puppet";
import { tools } from "../tools/registry";
describe("articulated impact poses", () => {
  it("settles every body part, without hiding the character or freezing input", () => {
    for (const tool of tools) {
      const motion = puppetMotion(tool.id, 1, 360);
      for (const part of [motion.head, motion.body, motion.left, motion.right, motion.tuft, motion.mouth]) {
        expect(part.at(-1)?.transform).toBe("none");
        expect(part.map(frame => frame.offset)).toEqual([0,.18,.53,.79,1]);
        expect(JSON.stringify(part)).not.toMatch(/NaN|Infinity|opacity/);
      }
      expect(motion.duration).toBeLessThan(600);
    }
  });
  it("responds to the side of impact and keeps soft reactions distinct", () => {
    expect(puppetMotion("boxing", 1, 360).head[1].transform).toContain("rotate(17deg)");
    expect(puppetMotion("boxing", -1, 360).head[1].transform).toContain("rotate(-17deg)");
    expect(puppetMotion("pillow", 1, 400).head).not.toEqual(puppetMotion("hammer", 1, 360).head);
  });
});

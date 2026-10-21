import { describe, expect, it } from "vitest";
import { advance, impulse, spring } from "./dynamics";

describe("soft toy dynamics", () => {
  it("absorbs rapid repeated impacts without unstable or inverted deformation", () => {
    const s = spring();
    for (let i = 0; i < 1200; i++) {
      if (i % 5 === 0) s.velocity = Math.max(-9, s.velocity + impulse("hammer").squash);
      advance(s, i % 13 === 0 ? .2 : 1 / 60, 165, 10);
      expect(Number.isFinite(s.value)).toBe(true);
      expect(1 + s.value).toBeGreaterThan(.3);
    }
    for (let i = 0; i < 600; i++) advance(s, 1 / 60, 165, 10);
    expect(Math.abs(s.value)).toBeLessThan(.001);
    expect(Math.abs(s.velocity)).toBeLessThan(.001);
  });

  it("keeps the same contact response across common frame rates", () => {
    const after = (fps: number) => {
      const s = spring(); s.velocity = impulse("punch").tilt;
      for (let i = 0; i < fps / 2; i++) advance(s, 1 / fps, 125, 11);
      return s.value;
    };
    expect(Math.abs(after(30) - after(60))).toBeLessThan(.01);
    expect(Math.abs(after(120) - after(60))).toBeLessThan(.01);
  });
});

import { describe, it, expect } from "vitest";
import { validNickname } from "./onboarding";
describe("public nickname validation", () => {
  it("supports Vietnamese without treating an email as a nickname", () => {
    expect(validNickname("Đạt chill")).toBe(true);
    expect(validNickname("  Mèo ú  ")).toBe(true);
    expect(validNickname("dat@example.com")).toBe(false);
  });
  it("rejects empty, overlong, markup and control-character input", () => {
    for (const input of ["", "a", "x".repeat(21), "<script>", "Nick\nname"])
      expect(validNickname(input)).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  normalizeProgress,
  recordProgress,
  isDailyComplete,
  localDay,
  dailyNote,
} from "./daily";
const day = "2026-10-21";
describe("daily progress", () => {
  it("uses local calendar dates, including month and year boundaries", () => {
    expect(localDay(new Date(2026, 0, 1, 0, 1))).toBe("2026-01-01");
    expect(localDay(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
  it("rejects corrupt data and prevents bogus progress from invalid tools", () => {
    const value = normalizeProgress(
      {
        day,
        hits: Infinity,
        tools: ["hammer", "hammer", "<script>"],
        breathed: "yes",
        completedDays: [day, day, "wrong", "2099-01-01", 42],
      },
      day,
    );
    expect(value).toEqual({
      discoveries: [],
      day,
      hits: 0,
      tools: ["hammer"],
      breathed: false,
      completedDays: [day],
    });
  });
  it("requires hits, three distinct tools and a full breath, records completion once", () => {
    let p = normalizeProgress(null, day);
    for (let i = 0; i < 12; i++)
      p = recordProgress(
        p,
        {
          type: "hit",
          tool: i === 0 ? "pillow" : i === 1 ? "water" : "hammer",
        },
        day,
      );
    expect(isDailyComplete(p)).toBe(false);
    p = recordProgress(p, { type: "breath" }, day);
    expect(isDailyComplete(p)).toBe(true);
    expect(recordProgress(p, { type: "breath" }, day).completedDays).toEqual([
      day,
    ]);
  });
  it("resets daily tasks after midnight and keeps completed days without inventing streaks", () => {
    const p = normalizeProgress(
      {
        day,
        hits: 20,
        tools: ["hammer"],
        breathed: true,
        completedDays: [day],
      },
      "2026-10-23",
    );
    expect(p.hits).toBe(0);
    expect(p.breathed).toBe(false);
    expect(p.completedDays).toEqual([day]);
    expect(
      recordProgress(p, { type: "hit", tool: "water" }, "2026-10-24").tools,
    ).toEqual(["water"]);
  });
  it("returns a stable daily note", () => {
    expect(dailyNote(day)).toEqual(dailyNote(day));
  });
});

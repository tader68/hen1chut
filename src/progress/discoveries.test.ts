import { describe, expect, it } from "vitest";
import { findDiscovery, normalizeDiscoveries } from "./discoveries";
import { normalizeProgress, recordProgress } from "./daily";
describe("discoverable toy reactions", () => {
  it("uses actual toy order, character and scene, not a random paid reward", () => {
    const studio = {kind:"blob",scene:"studio"} as const;
    expect(findDiscovery("spring", {...studio,previousTool:"pillow"})?.id).toBe("pillow-spring");
    expect(findDiscovery("pillow", {...studio,previousTool:"spring"})).toBeUndefined();
    expect(findDiscovery("boot", {...studio,previousTool:"banana"})?.id).toBe("banana-boot");
    expect(findDiscovery("boot", {...studio,scene:"rain"})?.id).toBe("rain-boot");
    expect(findDiscovery("confetti", {...studio,scene:"space"})?.id).toBe("space-party");
    expect(findDiscovery("lightning", {...studio,previousTool:"water"})?.id).toBe("water-spark");
    expect(findDiscovery("chicken", {...studio,kind:"cat"})?.id).toBe("cat-chicken");
    expect(findDiscovery("chicken", studio)).toBeUndefined();
  });
  it("retains discoveries on a new day without completing unrelated breathing tasks", () => {
    const progress = normalizeProgress(null, "2026-10-21");
    const found = recordProgress(progress, {type:"discovery",id:"space-party"}, "2026-10-21");
    expect(found.breathed).toBe(false);
    expect(found.hits).toBe(0);
    const again = recordProgress(found, {type:"discovery",id:"space-party"}, "2026-10-21");
    const tomorrow = normalizeProgress(again, "2026-10-22");
    expect(tomorrow.discoveries).toEqual(["space-party"]);
    expect(tomorrow.completedDays).toEqual([]);
    expect(normalizeDiscoveries(["invalid","space-party","space-party"])).toEqual(["space-party"]);
  });
});

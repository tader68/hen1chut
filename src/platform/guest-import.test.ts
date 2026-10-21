import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestGuestImport, takeGuestImport } from "./guest-import";
describe("carrying a guest session through OAuth", () => {
  beforeEach(() => {
    const items = new Map<string,string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key:string) => items.get(key) ?? null,
      setItem: (key:string,value:string) => items.set(key,value),
      removeItem: (key:string) => items.delete(key),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("offers an import only for the requested session and consumes it once", () => {
    requestGuestImport("session-one");
    expect(takeGuestImport("session-one")).toBe(true);
    expect(takeGuestImport("session-one")).toBe(false);
    requestGuestImport("old-session");
    expect(takeGuestImport("new-session")).toBe(false);
  });
  it("keeps playing when the browser blocks temporary storage", () => {
    vi.stubGlobal("sessionStorage", {setItem:()=>{throw new Error("blocked");},getItem:()=>{throw new Error("blocked");}});
    expect(() => requestGuestImport("session")).not.toThrow();
    expect(takeGuestImport("session")).toBe(false);
  });
});

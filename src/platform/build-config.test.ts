import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { describe, it, expect } from "vitest";
const script = fileURLToPath(
  new URL("../../scripts/validate-env.mjs", import.meta.url),
);
function validate(content: string) {
  const cwd = mkdtempSync(join(tmpdir(), "hen1chut-config-"));
  const env = { ...process.env };
  delete env.VITE_SUPABASE_URL;
  delete env.VITE_SUPABASE_PUBLISHABLE_KEY;
  try {
    writeFileSync(join(cwd, ".env.local"), content);
    return spawnSync(process.execPath, [script], {
      cwd,
      env,
      encoding: "utf8",
    });
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}
describe("frontend build credential guard", () => {
  it("reads local env files and accepts public config", () => {
    expect(
      validate(
        "VITE_SUPABASE_URL=https://example.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_example",
      ).status,
    ).toBe(0);
  });
  it("rejects secret keys from env files without printing them", () => {
    const secret = "sb_secret_example_do_not_print",
      r = validate(
        "VITE_SUPABASE_URL=https://example.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=" +
          secret,
      );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("Never put a Supabase secret");
    expect(r.stderr).not.toContain(secret);
  });
  it("rejects partial config and privileged legacy JWTs", () => {
    expect(
      validate("VITE_SUPABASE_URL=https://example.supabase.co").status,
    ).not.toBe(0);
    const token =
      "header." +
      Buffer.from(JSON.stringify({ role: "service_role" })).toString(
        "base64url",
      ) +
      ".signature";
    expect(
      validate(
        "VITE_SUPABASE_URL=https://example.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=" +
          token,
      ).status,
    ).not.toBe(0);
  });
});

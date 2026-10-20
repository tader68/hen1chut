import { loadEnv } from "vite";
const config = loadEnv("production", process.cwd(), "VITE_SUPABASE_");
const url = config.VITE_SUPABASE_URL || "";
const key = config.VITE_SUPABASE_PUBLISHABLE_KEY || "";
if (Boolean(url) !== Boolean(key))
  throw new Error("Set both public Supabase build variables, or neither.");
if (url && !/^https:\/\/[a-z\d-]+\.supabase\.co$/.test(url))
  throw new Error("VITE_SUPABASE_URL must be a project HTTPS URL.");
if (key) {
  if (key.startsWith("sb_secret_"))
    throw new Error("Never put a Supabase secret key in a frontend build.");
  if (!key.startsWith("sb_publishable_")) {
    let payload;
    try {
      payload = JSON.parse(
        Buffer.from(key.split(".")[1] || "", "base64url").toString(),
      );
    } catch {}
    if (payload?.role !== "anon")
      throw new Error(
        "Only a publishable key or legacy anon key is allowed in the frontend.",
      );
  }
}

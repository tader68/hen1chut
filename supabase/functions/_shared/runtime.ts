import { createClient } from "npm:@supabase/supabase-js@2.118.0";
// These platform-provided secrets stay in the Edge runtime, never in Vite env.
export function serverClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
}

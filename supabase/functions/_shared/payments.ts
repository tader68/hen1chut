// Runtime-independent handlers: exercised with real Web Crypto in local tests.
export interface Merchant {
  bankCode: string;
  bankGateway: string;
  accountNumber: string;
  accountName: string;
  supportEmail: string;
}
export interface Payment {
  transactionId: string;
  code: string;
  amount: number;
  paidAt: string;
  bodyHash: string;
  bankGateway: string;
  accountNumber: string;
}
export interface CheckoutDependencies {
  allowedOrigins: string[];
  enabled: boolean;
  merchant?: Merchant;
  verifyUser: (token: string) => Promise<string | null>;
  createOrder: (userId: string, sku: string, merchant: Merchant) => Promise<unknown>;
  latestOrder: (userId: string, sku: string) => Promise<unknown>;
  now?: () => number;
}
const json = (data: unknown, status = 200, headers: Record<string,string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });
class InputError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
async function readBody(req: Request, maxBytes: number): Promise<string> {
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) { await reader.cancel(); throw new InputError(413, "body_too_large"); }
    chunks.push(value);
  }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder("utf-8", { fatal: true }).decode(joined);
}
export function merchantFromEnv(get: (key: string) => string | undefined): Merchant | undefined {
  const merchant = {
    bankCode: get("PAYMENT_BANK_CODE") || "",
    bankGateway: get("PAYMENT_BANK_GATEWAY") || "",
    accountNumber: get("PAYMENT_ACCOUNT_NUMBER") || "",
    accountName: get("PAYMENT_ACCOUNT_NAME") || "",
    supportEmail: get("PAYMENT_SUPPORT_EMAIL") || "",
  };
  return /^[A-Za-z0-9]{2,32}$/.test(merchant.bankCode) &&
    merchant.bankGateway.length >= 2 && merchant.bankGateway.length <= 60 &&
    /^\d{6,30}$/.test(merchant.accountNumber) &&
    merchant.accountName.trim().length >= 2 && merchant.accountName.length <= 100 &&
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(merchant.supportEmail)
    ? merchant : undefined;
}
export async function checkoutHandler(req: Request, deps: CheckoutDependencies): Promise<Response> {
  const origin = req.headers.get("Origin");
  if (origin && !deps.allowedOrigins.includes(origin)) return json({error:"origin_not_allowed"}, 403);
  const cors: Record<string,string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin",
  };
  if (origin) cors["Access-Control-Allow-Origin"] = origin;
  if (req.method === "OPTIONS") return new Response(null, {status:204,headers:cors});
  if (req.method !== "POST") return json({error:"method_not_allowed"},405,cors);
  try {
    const match = req.headers.get("Authorization")?.match(/^Bearer (\S+)$/i);
    if (!match) return json({error:"sign_in_required"},401,cors);
    const userId = await deps.verifyUser(match[1]);
    if (!userId) return json({error:"sign_in_required"},401,cors);
    if (!req.headers.get("Content-Type")?.startsWith("application/json")) throw new InputError(415,"json_required");
    let body: Record<string,unknown>;
    try { body = JSON.parse(await readBody(req, 2048)); }
    catch (error) { if (error instanceof InputError) throw error; throw new InputError(400,"invalid_body"); }
    if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.sku !== "string" || !/^[a-z0-9-]{1,80}$/.test(body.sku)) throw new InputError(400,"invalid_sku");
    if (body.action === "resume") {
      const order = await deps.latestOrder(userId,body.sku);
      return json({order,server_now:new Date((deps.now || Date.now)()).toISOString()},200,cors);
    }
    if (body.action !== "create") throw new InputError(400,"invalid_action");
    if (!deps.enabled || !deps.merchant) return json({error:"checkout_unavailable"},503,cors);
    const order = await deps.createOrder(userId,body.sku,deps.merchant);
    return json({order,server_now:new Date((deps.now || Date.now)()).toISOString()},200,cors);
  } catch (error) {
    if (error instanceof InputError) return json({error:error.code},error.status,cors);
    const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
    for (const [code,status] of [["already_owned",409],["order_rate_limit",429],["profile_required",403],["checkout_unavailable",503],["merchant_unavailable",503]] as const)
      if (message.includes(code)) return json({error:code},status,cors);
    return json({error:"checkout_failed"},503,cors);
  }
}
const encoder = new TextEncoder();
export async function verifySignature(raw: string, signature: string | null, timestamp: string | null, secret: string, now = Date.now()): Promise<boolean> {
  if (!secret || !timestamp || !/^\d{10}$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300 || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const bytes = Uint8Array.from(signature.slice(7).match(/../g)!, value => parseInt(value,16));
  const key = await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
  return crypto.subtle.verify("HMAC",key,bytes,encoder.encode(`${timestamp}.${raw}`));
}
export function bankDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) throw new Error("invalid_bank_date");
  const date = new Date(value.replace(" ","T") + "+07:00");
  if (!Number.isFinite(date.getTime()) || new Date(date.getTime()+7*3600000).toISOString().slice(0,19).replace("T"," ") !== value) throw new Error("invalid_bank_date");
  return date.toISOString();
}
function paymentCode(payload: Record<string,unknown>): string | null {
  const code = payload.code;
  if (code !== null && code !== undefined && code !== "" && (typeof code !== "string" || !/^H1C[A-F0-9]{12}$/i.test(code))) throw new Error("invalid_payment_code");
  if (typeof payload.content !== "string") throw new Error("invalid_content");
  const codes = [...payload.content.toUpperCase().matchAll(/(?:^|[^A-Z0-9])(H1C[A-F0-9]{12})(?![A-Z0-9])/g)].map(match=>match[1]);
  const unique = [...new Set(codes)];
  if (unique.length > 1 || (code && unique.length && String(code).toUpperCase() !== unique[0])) throw new Error("ambiguous_payment_code");
  return code ? String(code).toUpperCase() : unique[0] || null;
}
export async function webhookHandler(req: Request, deps: {secret?:string; settle:(payment:Payment)=>Promise<unknown>;now?:()=>number}): Promise<Response> {
  if (req.method !== "POST") return json({success:false},405);
  if (!deps.secret) return json({success:false},503);
  try {
    const raw = await readBody(req,16384);
    if (!await verifySignature(raw,req.headers.get("X-SePay-Signature"),req.headers.get("X-SePay-Timestamp"),deps.secret,(deps.now || Date.now)())) return json({success:false},401);
    if (!req.headers.get("Content-Type")?.startsWith("application/json")) return json({success:false},415);
    let payment: Payment;
    try {
      const payload = JSON.parse(raw);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("invalid_payload");
      if (payload.transferType === "out") return json({success:true});
      if (payload.transferType !== "in") throw new Error("invalid_direction");
      const code = paymentCode(payload);
      if (!code) return json({success:true}); // Unrelated transfers never become game orders.
      if (!Number.isSafeInteger(payload.id) || payload.id <= 0 || !Number.isSafeInteger(payload.transferAmount) || payload.transferAmount <= 0 || payload.transferAmount > 2147483647 || typeof payload.gateway !== "string" || payload.gateway.length < 2 || payload.gateway.length > 60 || typeof payload.accountNumber !== "string" || !/^\d{6,30}$/.test(payload.accountNumber)) throw new Error("invalid_payment");
      payment = { transactionId:String(payload.id),code,amount:payload.transferAmount,paidAt:bankDate(payload.transactionDate),bankGateway:payload.gateway,accountNumber:payload.accountNumber,bodyHash:Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(raw))),v=>v.toString(16).padStart(2,"0")).join("") };
    } catch { return json({success:false},400); }
    await deps.settle(payment);
    return json({success:true});
  } catch (error) {
    return json({success:false},error instanceof InputError ? error.status : 503);
  }
}

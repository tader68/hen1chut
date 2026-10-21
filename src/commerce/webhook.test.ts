import { describe, it, expect, vi } from "vitest";
import { bankDate, checkoutHandler, merchantFromEnv, verifySignature, webhookHandler } from "../../supabase/functions/_shared/payments";
const now=Date.parse("2026-10-21T04:00:00Z"), timestamp=String(now/1000), secret="local-test-only-not-a-live-secret";
const payload={id:92704,gateway:"Vietcombank",transactionDate:"2026-10-21 11:00:00",accountNumber:"0000000000",code:"H1CABCDEF123456",content:"H1CABCDEF123456 chuyen tien",transferType:"in",transferAmount:29000};
async function signed(value:unknown, overrides:Record<string,string>={}) {
  const body=typeof value === "string" ? value : JSON.stringify(value);
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature="sha256="+Array.from(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(`${timestamp}.${body}`))),v=>v.toString(16).padStart(2,"0")).join("");
  return new Request("https://example.com/webhook",{method:"POST",body,headers:{"Content-Type":"application/json","X-SePay-Timestamp":timestamp,"X-SePay-Signature":signature,...overrides}});
}
describe("signed SePay callbacks",()=>{
  it("verifies exact raw bytes, rejects stale, future and forged signatures",async()=>{
    const request=await signed(payload), raw=await request.text(), sig=request.headers.get("X-SePay-Signature");
    expect(await verifySignature(raw,sig,timestamp,secret,now)).toBe(true);
    for (const [body,stamp,current] of [[raw+" ",timestamp,now],[raw,timestamp,now+301000],[raw,timestamp,now-301000]] as const)
      expect(await verifySignature(body,sig,stamp,secret,current)).toBe(false);
    expect(await verifySignature(raw,"sha256="+"0".repeat(64),timestamp,secret,now)).toBe(false);
  });
  it("passes verified payment facts to settlement and never forwards bank balance or descriptions",async()=>{
    const settle=vi.fn().mockResolvedValue({result:"paid"});
    const response=await webhookHandler(await signed({...payload,accumulated:999999999,description:"private sender"}),{secret,settle,now:()=>now});
    expect(response.status).toBe(200);expect(await response.json()).toEqual({success:true});
    expect(settle).toHaveBeenCalledOnce();
    expect(settle.mock.calls[0][0]).toEqual({transactionId:"92704",code:payload.code,amount:29000,paidAt:"2026-10-21T04:00:00.000Z",bankGateway:"Vietcombank",accountNumber:"0000000000",bodyHash:expect.stringMatching(/^[a-f0-9]{64}$/)});
  });
  it("does not acknowledge failed storage and never settles unauthenticated callbacks",async()=>{
    const settle=vi.fn().mockRejectedValue(new Error("database down"));
    expect((await webhookHandler(await signed(payload),{secret,settle,now:()=>now})).status).toBe(503);
    settle.mockClear();
    expect((await webhookHandler(await signed(payload,{"X-SePay-Signature":"invalid"}),{secret,settle,now:()=>now})).status).toBe(401);
    expect((await webhookHandler(await signed(payload),{settle,now:()=>now})).status).toBe(503);
    expect(settle).not.toHaveBeenCalled();
  });
  it("supports exact memo fallback and rejects ambiguous or invalid monetary facts",async()=>{
    const settle=vi.fn().mockResolvedValue({});
    expect((await webhookHandler(await signed({...payload,code:null}),{secret,settle,now:()=>now})).status).toBe(200);
    expect(settle).toHaveBeenCalledOnce();settle.mockClear();
    for (const change of [{content:payload.content+" H1C000000000000"},{code:"H1C000000000000"},{id:9007199254740992},{transferAmount:2.5},{transactionDate:"2026-02-30 11:00:00"}])
      expect((await webhookHandler(await signed({...payload,...change}),{secret,settle,now:()=>now})).status).toBe(400);
    expect(settle).not.toHaveBeenCalled();
  });
  it("ignores outgoing/unrelated transfers and rejects oversized payloads",async()=>{
    const settle=vi.fn();
    for (const change of [{transferType:"out"},{code:null,content:"ordinary bank transfer"}])
      expect(await (await webhookHandler(await signed({...payload,...change}),{secret,settle,now:()=>now})).json()).toEqual({success:true});
    expect((await webhookHandler(await signed("x".repeat(17000)),{secret,settle,now:()=>now})).status).toBe(413);
    expect(settle).not.toHaveBeenCalled();
  });
  it("interprets bank time as Vietnam time and rejects impossible dates",()=>{
    expect(bankDate("2026-10-21 00:00:00")).toBe("2026-10-20T17:00:00.000Z");
    expect(()=>bankDate("2026-02-30 00:00:00")).toThrow();
    expect(merchantFromEnv(()=>undefined)).toBeUndefined();
  });
});
describe("checkout authentication and price authority",()=>{
  const merchant={bankCode:"VCB",bankGateway:"Vietcombank",accountNumber:"0000000000",accountName:"LOCAL TEST",supportEmail:"test@example.com"};
  const req=(body:unknown,headers:Record<string,string>={})=>new Request("https://example.com/checkout",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer test-user-jwt",Origin:"https://game.example",...headers},body:JSON.stringify(body)});
  const dependencies=()=>({allowedOrigins:["https://game.example"],enabled:true,merchant,verifyUser:vi.fn().mockResolvedValue("verified-user"),createOrder:vi.fn().mockResolvedValue({price_vnd:29000}),latestOrder:vi.fn().mockResolvedValue(null),now:()=>now});
  it("uses the authenticated identity and never accepts client prices, owners or bank accounts",async()=>{
    const deps=dependencies();
    const response=await checkoutHandler(req({action:"create",sku:"bo-khac-he",user_id:"someone-else",price_vnd:1,accountNumber:"1111111111"}),deps);
    expect(response.status).toBe(200);
    expect(deps.createOrder).toHaveBeenCalledWith("verified-user","bo-khac-he",merchant);
    expect(await response.json()).toMatchObject({order:{price_vnd:29000},server_now:"2026-10-21T04:00:00.000Z"});
  });
  it("fails closed without merchant setup or login while still allowing owners to resume",async()=>{
    const deps=dependencies();deps.enabled=false;
    expect((await checkoutHandler(req({action:"create",sku:"bo-khac-he"}),deps)).status).toBe(503);
    expect(deps.createOrder).not.toHaveBeenCalled();
    expect((await checkoutHandler(req({action:"resume",sku:"bo-khac-he"}),deps)).status).toBe(200);
    expect(deps.latestOrder).toHaveBeenCalledWith("verified-user","bo-khac-he");
    deps.verifyUser.mockResolvedValue(null);
    expect((await checkoutHandler(req({action:"create",sku:"bo-khac-he"}),deps)).status).toBe(401);
  });
  it("rejects foreign origins and malformed input without invoking order creation",async()=>{
    const deps=dependencies();
    expect((await checkoutHandler(req({action:"create",sku:"bo-khac-he"},{Origin:"https://foreign.example"}),deps)).status).toBe(403);
    for (const body of [null,[],{action:"create",sku:"invalid<>"},{action:"refund",sku:"bo-khac-he"}])
      expect((await checkoutHandler(req(body),deps)).status).toBe(400);
    expect(deps.createOrder).not.toHaveBeenCalled();
  });
});

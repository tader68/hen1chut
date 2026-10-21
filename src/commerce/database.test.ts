import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
const A = "00000000-0000-4000-8000-000000000001", B = "00000000-0000-4000-8000-000000000002";
const merchant = ["VCB","Vietcombank","0000000000","TEST MERCHANT","test@example.com"];
let db: PGlite;
async function role<T>(name: string, fn:()=>Promise<T>, user = A) {
  await db.exec(`set role ${name};select set_config('request.jwt.claim.sub','${user}',false)`);
  try { return await fn(); } finally { await db.exec("reset role;reset request.jwt.claim.sub"); }
}
async function value<T>(sql:string,args:unknown[]=[]):Promise<T> {
  return (await db.query<{value:T}>(sql,args)).rows[0].value;
}
interface Order { id:string; payment_code:string; price_vnd:number;created_at:string;expires_at:string;item_keys:string[] }
const order = (user=A) => role("service_role",()=>value<Order>("select public.create_checkout_order($1,'bo-khac-he',$2,$3,$4,$5,$6) as value",[user,...merchant]));
const settle = (o:Order, overrides:{id?:string;code?:string;amount?:number;paidAt?:string;gateway?:string;account?:string}={}) => role("service_role",()=>value<{result:string;duplicate:boolean}>("select public.settle_checkout_payment($1,$2,$3,$4,$5,$6,$7) as value",[overrides.id || "101",overrides.code || o.payment_code,overrides.amount ?? o.price_vnd,overrides.paidAt || o.created_at,"a".repeat(64),overrides.gateway || merchant[1],overrides.account || merchant[2]]));
beforeAll(async()=>{
  db = new PGlite(); await db.waitReady;
  await db.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values ('${A}'),('${B}');create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth,public to authenticated,anon,service_role;`);
  for (const file of ["202610210001_core.sql","202610210002_state_revision.sql","20261021021454_isolate_privileged_rpcs.sql"])
    await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`,import.meta.url),"utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/20261021024849_commerce_orders.sql",import.meta.url),"utf8"));
},30000);
beforeEach(async()=>{
  await db.exec("truncate hen1chut_private.payment_receipts,public.commerce_orders,public.entitlements,public.player_state,public.profiles;update public.commerce_products set published=true,active=true,price_vnd=29000");
  await role("authenticated",()=>db.query("select public.upsert_profile('One')"),A);
  await role("authenticated",()=>db.query("select public.upsert_profile('Two')"),B);
});
afterAll(async()=>{ await db?.close(); });
describe("commerce authorization and ownership",()=>{
  it("keeps orders private and lets neither guests nor buyers manufacture orders or receipts",async()=>{
    const o = await order();
    expect(await value<number>("select count(*)::integer as value from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef")).toBe(0);
    expect(await role("authenticated",()=>db.query("select * from public.commerce_orders"),B)).toMatchObject({rows:[]});
    expect((await role("authenticated",()=>db.query("select * from public.commerce_orders"),A)).rows).toHaveLength(1);
    for (const name of ["anon","authenticated"]) {
      await expect(role(name,()=>db.query("select public.create_checkout_order($1,'bo-khac-he',$2,$3,$4,$5,$6)",[A,...merchant]))).rejects.toThrow("permission denied");
      await expect(role(name,()=>db.query("select public.settle_checkout_payment('1',$1,29000,now(),$2,'Vietcombank','0000000000')",[o.payment_code,"a".repeat(64)]))).rejects.toThrow("permission denied");
      await expect(role(name,()=>db.query("select * from hen1chut_private.payment_receipts"))).rejects.toThrow("permission denied");
    }
  });
  it("blocks forged paid outfits in both profiles and state, even when the product is hidden",async()=>{
    await db.exec("update public.commerce_products set published=false,active=false");
    for (const outfit of ["dragon","mecha"]) {
      await expect(role("authenticated",()=>db.query("select public.upsert_profile('One',$1)",[JSON.stringify({outfit})]))).rejects.toThrow("cosmetic_not_owned");
      await expect(role("authenticated",()=>db.query("select public.save_player_state($1,0)",[JSON.stringify({character:{outfit},session:{hits:0}})]))).rejects.toThrow("cosmetic_not_owned");
    }
    expect((await role("anon",()=>db.query("select * from public.commerce_products"))).rows).toEqual([]);
    await expect(order()).rejects.toThrow("checkout_unavailable");
  });
  it("snapshots server prices, resumes one pending order and rate-limits abandoned orders",async()=>{
    const first = await order();
    expect(first.price_vnd).toBe(29000);
    expect((await order()).id).toBe(first.id);
    await db.exec("update public.commerce_products set price_vnd=39000");
    expect((await order()).price_vnd).toBe(29000);
    for (let i=0;i<4;i++) {
      await db.exec("update public.commerce_orders set status='cancelled' where status='pending'");
      expect((await order()).price_vnd).toBe(39000);
    }
    await db.exec("update public.commerce_orders set status='cancelled' where status='pending'");
    await expect(order()).rejects.toThrow("order_rate_limit");
  });
  it("grants both items atomically to the buyer and treats retry and second transfers separately",async()=>{
    const o=await order();
    expect(await settle(o)).toEqual({result:"paid",duplicate:false});
    expect(await settle(o)).toEqual({result:"paid",duplicate:true});
    expect(await settle(o,{id:"102"})).toEqual({result:"duplicate_payment",duplicate:false});
    expect((await role("authenticated",()=>db.query("select item_key from public.entitlements order by item_key"))).rows).toEqual([{item_key:"outfit:dragon"},{item_key:"outfit:mecha"}]);
    expect((await role("authenticated",()=>db.query("select item_key from public.entitlements"),B)).rows).toEqual([]);
    await role("authenticated",()=>db.query("select public.upsert_profile('One',$1)",[JSON.stringify({outfit:"dragon"})]));
    await expect(order()).rejects.toThrow("already_owned");
    expect(await value<string>("select status as value from public.commerce_orders where id=$1",[o.id])).toBe("paid");
  });
  it("does not reuse a transaction ID with altered payment facts",async()=>{
    const o=await order();await settle(o);
    await expect(settle(o,{amount:30000})).rejects.toThrow("transaction_conflict");
    expect((await db.query("select * from public.entitlements")).rows).toHaveLength(2);
  });
  it("routes wrong amounts, recipients and late payments to review without granting items",async()=>{
    let receiptId=200;
    for (const [change,reason] of [[{amount:28000},"amount_mismatch"],[{account:"1111111111"},"recipient_mismatch"],[{gateway:"BIDV"},"recipient_mismatch"],[{paidAt:new Date(Date.now()+20*60000).toISOString()},"outside_payment_window"]] as const) {
      // Keep a genuine near-future payment within the webhook's 5 minute allowance.
      const o=await order();
      const input = "paidAt" in change ? {paidAt:new Date(Date.parse(o.created_at)+120000).toISOString()} : change;
      if ("paidAt" in change) await db.query("update public.commerce_orders set expires_at=created_at+interval '1 minute' where id=$1",[o.id]);
      expect((await settle(o,{...input,id:String(receiptId++)})).result).toBe(reason);
      expect(await value<string>("select status as value from public.commerce_orders where id=$1",[o.id])).toBe("review");
      await db.query("update public.commerce_orders set status='cancelled' where id=$1",[o.id]);
    }
    expect((await db.query("select * from public.entitlements")).rows).toEqual([]);
  });
  it("accepts timely payments delivered late, and cancels the replacement order",async()=>{
    const old=await order();
    await db.query("update public.commerce_orders set created_at=clock_timestamp()-interval '25 minutes',expires_at=clock_timestamp()-interval '10 minutes' where id=$1",[old.id]);
    const replacement=await order();
    expect(replacement.id).not.toBe(old.id);
    const paidAt=new Date(Date.now()-20*60000).toISOString();
    expect((await settle(old,{paidAt})).result).toBe("paid");
    expect(await value<string>("select status as value from public.commerce_orders where id=$1",[replacement.id])).toBe("cancelled");
    expect((await settle(replacement,{id:"103"})).result).toBe("duplicate_payment");
  });
  it("records unmatched codes without leaking orders or granting items",async()=>{
    const o=await order();
    expect((await settle(o,{code:"H1CAAAAAAAAAAAA"})).result).toBe("unmatched");
    expect((await db.query("select * from public.entitlements")).rows).toEqual([]);
    expect(await value<string>("select status as value from public.commerce_orders where id=$1",[o.id])).toBe("pending");
  });
});

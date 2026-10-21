import { describe,it,expect } from "vitest";
import { accessibleCharacter,canWear,wearableOutfits } from "./catalog";
import { defaultCharacter,freeOutfits } from "../character/model";
import { orderPhase,qrUrl } from "./checkout";
import type { CommerceOrder } from "./catalog";
describe("cosmetics access and checkout presentation",()=>{
  it("keeps all existing outfits free, requires exact server ownership and preserves the rest of a shared character",()=>{
    expect(wearableOutfits(new Set())).toEqual([...freeOutfits]);
    expect(canWear("dragon",new Set(["dragon","admin"])) ).toBe(false);
    expect(canWear("dragon",new Set(["outfit:dragon"])) ).toBe(true);
    expect(accessibleCharacter({...defaultCharacter,outfit:"mecha",name:"Keep me",hat:"beanie"},new Set())).toMatchObject({name:"Keep me",hat:"beanie",outfit:"basic"});
  });
  it("uses server order amount and code for QR, never a nickname or user identity",()=>{
    const order={bank_code:"VCB",account_number:"0000000000",payment_code:"H1CABCDEF123456",price_vnd:29000} as CommerceOrder;
    const url=new URL(qrUrl(order));
    expect(url.origin).toBe("https://vietqr.app");
    expect([...url.searchParams.keys()]).toEqual(["acc","bank","amount","des"]);
    expect(url.searchParams.get("amount")).toBe("29000");
    expect(()=>qrUrl({...order,price_vnd:NaN})).toThrow();
  });
  it("expires locally without manufacturing a paid state",()=>{
    const order={status:"pending",expires_at:"2026-10-21T04:00:00Z"} as CommerceOrder;
    expect(orderPhase(order,Date.parse("2026-10-21T04:01:00Z"))).toBe("expired");
    expect(orderPhase({...order,status:"review"},Date.parse("2026-10-21T03:00:00Z"))).toBe("review");
    expect(orderPhase({...order,status:"paid"})).toBe("paid");
  });
});

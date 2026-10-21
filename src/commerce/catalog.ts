import { freeOutfits, premiumOutfits, type Character } from "../character/model";
export const PACK_SKU = "bo-khac-he";
export const PACK_NAME = "Bự khác hệ";
// The owner chose manual bank approval. Keep sales closed until that flow and
// merchant details are validated, even if an old server catalog is activated.
export const SALES_READY = false;
export type Outfit = Character["outfit"];
export function canWear(outfit: Outfit, owned: ReadonlySet<string>): boolean {
  return freeOutfits.some(value => value === outfit) || owned.has(`outfit:${outfit}`);
}
export function wearableOutfits(owned: ReadonlySet<string>): Outfit[] {
  return [...freeOutfits, ...premiumOutfits.filter(outfit => canWear(outfit, owned))];
}
export function accessibleCharacter(character: Character, owned: ReadonlySet<string>): Character {
  return canWear(character.outfit, owned) ? character : { ...character, outfit: "basic" };
}
export interface CommerceProduct {
  sku: string;
  name: string;
  description: string;
  price_vnd: number;
  item_keys: string[];
  active: boolean;
}
export interface CommerceOrder {
  id: string;
  sku: string;
  price_vnd: number;
  bank_code: string;
  bank_gateway: string;
  account_number: string;
  account_name: string;
  support_email: string;
  payment_code: string;
  status: "pending" | "paid" | "expired" | "review" | "cancelled";
  created_at: string;
  expires_at: string;
  paid_at: string | null;
}

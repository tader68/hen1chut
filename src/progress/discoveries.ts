import type { ToolId } from "../tools/registry";
import type { Kind } from "../character/model";
import type { SceneId } from "../env/scenes";
export const discoveries = [
  {id:"pillow-spring", name:"Nệm lò xo", clue:"Một chiếc gối, rồi đến cú đấm lò xo…", line:"Êm quá nên nảy luôn rồi!", motion:"spring", tool:"spring"},
  {id:"rain-boot", name:"Mưa trong giày", clue:"Thử cú đá bông giữa vườn mưa xem?", line:"Nước mưa văng cả lên rồi!", motion:"water", tool:"boot"},
  {id:"space-party", name:"Tiệc không trọng lực", clue:"Pháo giấy bay thế nào ngoài vũ trụ?", line:"Ở đây, niềm vui cũng bay chậm lại.", motion:"confetti", tool:"confetti"},
  {id:"banana-boot", name:"Trượt một chút thôi", clue:"Vỏ chuối ở đó. Một cú đá nữa thì sao?", line:"Úi! Giày bông cũng biết trượt!", motion:"banana", tool:"boot"},
  {id:"water-spark", name:"Mây tóc dựng đứng", clue:"Bóng nước rồi sấm tí hon, Bự sẽ làm gì?", line:"Tóc Bự bắt được sóng rồi!", motion:"lightning", tool:"lightning"},
  {id:"cat-chicken", name:"Mèo gặp gà", clue:"Mèo ú có thích tiếng gà cao su không?", line:"Meo? Ai vừa kêu cục tác thế?", motion:"chicken", tool:"chicken"},
] as const;
export type Discovery = (typeof discoveries)[number];
export type DiscoveryId = Discovery["id"];
export interface DiscoveryContext { kind: Kind; scene: SceneId; previousTool?: ToolId; }
export function findDiscovery(tool: ToolId, context: DiscoveryContext): Discovery | undefined {
  const {previousTool, kind, scene} = context;
  const id = tool === "spring" && previousTool === "pillow" ? "pillow-spring"
    : tool === "boot" && previousTool === "banana" ? "banana-boot"
    : tool === "boot" && scene === "rain" ? "rain-boot"
    : tool === "confetti" && scene === "space" ? "space-party"
    : tool === "lightning" && previousTool === "water" ? "water-spark"
    : tool === "chicken" && kind === "cat" ? "cat-chicken" : undefined;
  return discoveries.find(discovery => discovery.id === id);
}
export function normalizeDiscoveries(value: unknown): DiscoveryId[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is DiscoveryId => discoveries.some(discovery => discovery.id === id)))] : [];
}

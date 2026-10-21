import { defaultCharacter, type Character } from "./model";

// Generic fictional roles. Selecting a template does not reset the active session.
export const characterPresets: { id: string; label: string; note: string; character: Character }[] = [
  { id: "boss", label: "Sếp", note: "Vest, kính tròn, tóc rẽ ngôi", character: { ...defaultCharacter, kind: "buddy", name: "Sếp khó tính", color: "#f0a58e", outfit: "suit", glasses: "round" } },
  { id: "biz", label: "Chị Biz", note: "Blazer, tóc dài, dáng cao", character: { ...defaultCharacter, kind: "girl", name: "Chị Biz", color: "#f0a58e", outfit: "suit", body: "tall", glasses: "none" } },
  { id: "sales", label: "Bạn Sales", note: "Áo khoác, tai nghe, đầy năng lượng", character: { ...defaultCharacter, kind: "buddy", name: "Bạn Sales", color: "#f0a58e", outfit: "bomber", hat: "headphones" } },
  { id: "colleague", label: "Đồng nghiệp", note: "Áo kẻ, tóc dài, kính tròn", character: { ...defaultCharacter, kind: "girl", name: "Đồng nghiệp", color: "#e598be", outfit: "stripes", glasses: "round", body: "round" } },
  { id: "cat", label: "Mèo ú", note: "Tai nhọn, má tròn, đuôi cong", character: { ...defaultCharacter, kind: "cat", name: "Mèo ú", color: "#e5b857", body: "round" } },
  { id: "bu", label: "Bự", note: "Mặt quạu, chỏm gập, bụng vá", character: { ...defaultCharacter } },
];

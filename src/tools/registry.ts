export const tools = [
  {
    id: "hammer",
    label: "Búa mềm",
    hint: "Bực bao nhiêu, búa bấy nhiêu.",
    power: 1,
    color: "#b29be3",
    words: ["BỐP!", "BỘP!", "NHẸ CẢ NGƯỜI!"],
  },
  {
    id: "pillow",
    label: "Gối êm",
    hint: "Một cú thật êm cho ngày hơi căng.",
    power: 1,
    color: "#f1c784",
    words: ["PHỤP!", "ÊM RU!", "PHÙ…"],
  },
  {
    id: "tomato",
    label: "Cà chua",
    hint: "Ném một quả, bỏ lại chút bực.",
    power: 2,
    color: "#ed8f7f",
    words: ["BẸP!", "TÈN TEN!", "ĐỠ BỰC RỒI!"],
  },
  {
    id: "water",
    label: "Bóng nước",
    hint: "Tưới mát cái đầu đang nóng.",
    power: 1,
    color: "#86c6e4",
    words: ["TÕM!", "ÀO!", "MÁT CẢ NGƯỜI!"],
  },
  {
    id: "boot",
    label: "Cú đá bông",
    hint: "Đá bay chút muộn phiền.",
    power: 2,
    color: "#e7b365",
    words: ["VÈO!", "BỤP!", "BAY ĐI NÀO!"],
  },
  {
    id: "lightning",
    label: "Sấm tí hon",
    hint: "Nạp một chút năng lượng vui.",
    power: 3,
    color: "#e7c15b",
    words: ["ZAP!", "TÁCH!", "TỈNH NGƯỜI!"],
  },
] as const;
export type ToolId = (typeof tools)[number]["id"];
export type Tool = (typeof tools)[number];
export function toolArt(id: ToolId): string {
  const art: Record<ToolId, string> = {
    hammer:
      '<path d="m36 31-12 31q-2 7 4 8t9-5l10-31" fill="#d7aa78"/><path d="m19 20 8-10q2-3 6-1l31 19q4 2 2 6l-7 12q-2 4-6 2L21 29q-5-3-2-9Z" fill="#b99be9"/><path d="m29 12-9 14m41 4-9 15" stroke="#e4d5ff" stroke-width="5"/><path d="m34 17 17 10" stroke="#eee3ff" stroke-width="3"/>',
    pillow:
      '<path d="M15 20q-8-8-7 4l4 10-3 25q-3 10 8 5l12-2 27 3q12 4 8-7l-3-24 5-14q2-9-8-4l-20 2Z" fill="#f6d7a4"/><path d="m19 28 33-2m-32 6-2 22 32 3" fill="none" stroke="#fff0d7" stroke-width="3"/><path d="m55 49 3 8" stroke="#d2a765"/>',
    tomato:
      '<circle cx="39" cy="43" r="25" fill="#ef806e"/><path d="M20 39q2-13 14-15" fill="none" stroke="#ffb8a3" stroke-width="5"/><path d="m39 26-16-7 13 0 3-13 6 13 14 1-13 7-2 11Z" fill="#72a475"/>',
    water:
      '<path d="M38 10c-7 0-25 20-25 35a25 25 0 0 0 50 0c0-15-18-35-25-35Z" fill="#8ccbe7"/><path d="M24 35q-7 15 4 21" stroke="#dff8ff" stroke-width="5" fill="none"/><path d="m35 70 4-5 4 5Z" fill="#71abc9"/>',
    boot: '<path d="m23 12 25 3-4 30 18 7q9 5 5 13H14q-3-7 3-13l6-9Z" fill="#e7b574"/><path d="m21 17 25 3m-1 30-19-4M16 60h49" stroke="#f8e1bb" stroke-width="5"/><path d="m29 29 10 1m-11 7 10 1" stroke="#a47851"/>',
    lightning:
      '<path d="M43 5 16 43h20l-3 30 31-44H44l9-24Z" fill="#f3ce60"/><path d="m42 15-15 21h13" stroke="#fff0af" stroke-width="4" fill="none"/>',
  };
  return `<svg viewBox="0 0 80 80" aria-hidden="true"><g stroke="#58475c" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${art[id]}</g></svg>`;
}

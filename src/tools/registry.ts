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
  {
    id: "boxing",
    label: "Găng đấm",
    hint: "Một cú đấm bông cho bực bội bay xa.",
    power: 3,
    color: "#e5909d",
    words: ["BỐP!", "ĐỠ NÈ!", "MỀM XÈO!"],
  },
  {
    id: "spring",
    label: "Đấm lò xo",
    hint: "Kéo một cái, bực bội bật ra.",
    power: 2,
    color: "#a3c5ad",
    words: ["BOING!", "BẬT NÈ!", "TƯNG!"],
  },
  {
    id: "slipper",
    label: "Dép huyền thoại",
    hint: "Chiếc dép chuyên trị ngày hơi ngang.",
    power: 2,
    color: "#99c5b5",
    words: ["BẸT!", "VÈO!", "DÉP TỚI!"],
  },
  {
    id: "chicken",
    label: "Gà cao su",
    hint: "Bóp một tiếng cho cả ngày bật cười.",
    power: 1,
    color: "#e9c87e",
    words: ["QUẠC!", "ÉC ÉC!", "CỤC TÁC!"],
  },
  {
    id: "banana",
    label: "Vỏ chuối",
    hint: "Trượt một vòng, bỏ bực lại sau.",
    power: 1,
    color: "#e6cc69",
    words: ["ÚI!", "TRƯỢT NÈ!", "OÁI!"],
  },
  {
    id: "confetti",
    label: "Pháo giấy",
    hint: "Bực một chút cũng đáng được cổ vũ.",
    power: 1,
    color: "#d5a1d7",
    words: ["TADA!", "YAY!", "ĐỠ BỰC RỒI!"],
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
    boxing:
      '<path d="M21 49q-12-3-10-14 1-11 12-10 0-18 17-20 24-2 26 19 2 17-13 24v18H25Z" fill="#e48c9a"/><path d="M26 46h27v20H26z" fill="#b86983"/><path d="M32 17q13-6 21 3m-34 9q11-5 13 8" fill="none" stroke="#ffd2d4" stroke-width="4"/><path d="M32 56h15" stroke="#f7c7cc" stroke-width="4"/>',
    spring:
      '<path d="m10 59 9-8-2-9 10-5-2-9 10-4" fill="none" stroke="#7e8b92" stroke-width="5"/><path d="m28 33 5-19q2-6 7-3l1 7 3-13q6-5 8 1l-1 12 7-9q7-2 8 5l-5 13 8-1q8 6-5 17l-13 8-21-8Z" fill="#b7d0ba"/><path d="m8 62 12 8 13-19-14-8Z" fill="#8d70b3"/><path d="m38 27 17 9" fill="none" stroke="#e4f3d7" stroke-width="3"/>',
    slipper:
      '<path d="M31 9q19-8 29 10 10 27-6 47-11 14-28 3Q7 53 19 29Z" fill="#99c5b5"/><path d="M28 13q18-6 25 12 8 22-5 38-6 9-17 3Q17 53 26 31Z" fill="#c1dfca"/><path d="M21 36q14-15 35-4l2 14q-21-11-36 3Z" fill="#729d93"/><path d="m32 39 12 2" stroke="#ecf3d7" stroke-width="3"/>',
    chicken:
      '<path d="M30 54q-17-11-10-26 4-9 16-4L32 8l9-1 6 23q22 11 12 29l-9 4 3 11-9 1-3-12-7 1-5 10-8-3Z" fill="#edce7d"/><path d="M31 8 29 3l6-2 5 5 5-2 4 8Z" fill="#df8d7b"/><path d="m38 16 13 4-12 5" fill="#df8d7b"/><circle cx="36" cy="13" r="2" fill="#4c3c50"/><ellipse cx="41" cy="46" rx="9" ry="11" fill="#f4dfab"/>',
    banana:
      '<path d="M36 17 42 9l6 4-5 10q2 21 23 30-16 13-26-10 2 20-12 27-13-4-10-14 16-8 18-25-12 17-25 12 10-9 13-24Z" fill="#ead273"/><path d="m38 23 1 15m-9 17-4 7m21-28 13 19" fill="none" stroke="#fff0b2" stroke-width="3"/><path d="m42 10 5 3" stroke="#8b7254" stroke-width="4"/>',
    confetti:
      '<path d="m18 69 5-38 27 20Z" fill="#b595cf"/><path d="m22 49 14 10m-16-2 7 6" stroke="#f5d794" stroke-width="5"/><path d="m35 25 3-14m10 20 16-6m-20 14 20 7" fill="none" stroke="#df9cb3" stroke-width="4"/><path d="m55 10 4 7 8-2-4 7 4 6-9-1-5 5 1-9-6-5 8-2Z" fill="#f2d77e"/><path d="m17 14 5 5-5 6-5-6Z" fill="#9bc9b9"/><circle cx="67" cy="56" r="4" fill="#94bed6"/>',
  };
  return `<svg viewBox="0 0 80 80" aria-hidden="true"><g stroke="#58475c" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${art[id]}</g></svg>`;
}

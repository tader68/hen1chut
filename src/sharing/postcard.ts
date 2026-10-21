import { renderFigure } from "../character/figure";
import { normalizeCharacter, type Character } from "../character/model";
import { dailyNote, localDay } from "../progress/daily";
const WIDTH = 900,
  HEIGHT = 1120;
export async function makePostcard(
  character: Character,
  includeName: boolean,
  portrait?: string,
): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt chưa hỗ trợ tạo ảnh.");
  const safe = normalizeCharacter(character);
  const backdrop = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  backdrop.addColorStop(0, "#f2edf9");
  backdrop.addColorStop(1, "#dbcee9");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#eee5f6";
  ctx.beginPath();
  ctx.arc(880, 230, 280, 0, Math.PI * 2);
  ctx.fill();
  if (!portrait) {
    ctx.fillStyle = "#bba7ce";
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.ellipse(450, 816, 215, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const svg = renderFigure(safe, "normal", "postcard").replace(
    'viewBox="0 0 300 340"',
    'width="300" height="340" viewBox="0 0 300 340"',
  );
  const source = portrait || URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    ctx.drawImage(image, 235, 342, 430, 487);
  } finally {
    if (!portrait) URL.revokeObjectURL(source);
  }
  const family = '"Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillStyle = "#75608d";
  ctx.font = `700 32px ${family}`;
  ctx.fillText("hẹn1chút.", 64, 88);
  ctx.font = `400 19px ${family}`;
  ctx.textAlign = "right";
  ctx.fillText(localDay().split("-").reverse().join("."), 836, 83);
  ctx.textAlign = "center";
  ctx.fillStyle = "#493956";
  ctx.font = `700 55px ${family}`;
  ctx.fillText("Gửi bạn một chút", 450, 205);
  ctx.fillStyle = "#83639f";
  ctx.fillText("nhẹ lòng.", 450, 280);
  ctx.fillStyle = "#685570";
  ctx.font = `500 27px ${family}`;
  ctx.fillText(
    includeName ? safe.name : "Có một bạn luôn sẵn lòng hứng bực.",
    450,
    900,
    760,
  );
  ctx.font = `400 22px ${family}`;
  ctx.fillText(dailyNote()[1], 450, 950, 760);
  ctx.strokeStyle = "#c4b4d0";
  ctx.beginPath();
  ctx.moveTo(65, 1000);
  ctx.lineTo(835, 1000);
  ctx.stroke();
  ctx.font = `500 20px ${family}`;
  ctx.fillStyle = "#766481";
  ctx.fillText("Chạm một cái. Thở ra nào.", 450, 1045);
  ctx.font = `400 16px ${family}`;
  ctx.fillText("tader68.github.io/hen1chut", 450, 1083);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Chưa tạo được ảnh. Thử lại nhé.")),
      "image/png",
    ),
  );
}
export function downloadPostcard(blob: Blob): void {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `hen1chut-${localDay()}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

import "./style.css";
import { createToyStage } from "../character/renderer3d";
import type { Costume } from "./dynamics";
type Toy = "punch" | "hammer" | "pillow";

const toolNames: Record<Toy, string> = { punch: "Găng đấm", hammer: "Búa mềm", pillow: "Gối bông" };
const toolArt: Record<Toy, string> = {
  punch: '<path d="M10 25c-7-5-6-13-2-15 3-2 5 0 6 3-2-9 0-14 7-14 9 0 13 6 13 15 0 6-3 9-6 12v6H13v-7Z" fill="#e58d7c"/><path d="M12 26h17v8H12z" fill="#f1dcb8"/>',
  hammer: '<path d="M18 16h6v21h-6z" fill="#b79b7c"/><rect x="4" y="5" width="34" height="16" rx="6" fill="#e58d7c"/><path d="M8 8v10m26-10v10" stroke="#f1dcb8" stroke-width="3"/>',
  pillow: '<path d="M4 9q17 4 33 0-4 13 0 24-17-4-33 0 4-12 0-24Z" fill="#ead7ba" stroke="#ad927c" stroke-width="1.5"/><path d="m9 14 23 1-1 13-22-1Z" fill="none" stroke="#ba9f86" stroke-dasharray="2 2"/>',
};

export function mountAtelier(root: HTMLElement): void {
  root.innerHTML = `<main class="atelier">
    <header class="atelier-header"><a class="atelier-brand" href="./">hẹn1chút<span>.</span></a><span class="atelier-label">Phòng tạo hình</span><a class="atelier-back" href="./">Về góc chơi <span aria-hidden="true">↗</span></a></header>
    <div class="atelier-layout">
      <section class="toy-studio" aria-label="Thử nhân vật 3D">
        <div class="toy-studio-heading"><span class="atelier-chip">Mẫu thử tương tác</span><span class="toy-material">Đồ chơi mềm / Bự</span></div>
        <div class="toy-render" id="toy-render"><p class="toy-loading" id="toy-loading" role="status">Đang đánh thức Bự…</p></div>
        <button class="toy-touch" id="toy-touch" aria-label="Chạm Bự bằng găng đấm. Kéo để xoay nhân vật." disabled></button>
        <p class="toy-speech" id="toy-speech" aria-live="polite">Mặt vậy thôi. Người mềm xèo.</p>
        <div class="toy-rotate"><button id="toy-left" aria-label="Xoay Bự sang trái">↶</button><span>Kéo để ngắm · Chạm để thử</span><button id="toy-right" aria-label="Xoay Bự sang phải">↷</button></div>
        <fieldset class="atelier-options toy-tool-options"><legend>Chọn một món thử nhé</legend><div class="toy-tools">${(Object.keys(toolNames) as Toy[]).map(toy => `<button data-toy="${toy}" aria-pressed="${toy === "punch"}"><svg viewBox="0 0 42 42" aria-hidden="true">${toolArt[toy]}</svg><span>${toolNames[toy]}</span></button>`).join("")}</div></fieldset>
      </section>
      <aside class="atelier-controls" aria-label="Tạo hình và đồ chơi">
        <div class="atelier-intro"><span class="atelier-note">Đồng đội hứng bực</span><h1>Bự<span>.</span></h1><p>Mềm người.<br>Cứng miệng.</p></div>
        <fieldset class="atelier-options"><legend>Hôm nay mặc gì?</legend><div class="toy-costumes">${([
          ["original", "Nguyên bản", "Miếng vá quen thuộc"], ["dragon", "Rồng con", "Có sừng, có cánh"], ["mecha", "Giáp máy", "Trái tim vẫn mềm"],
        ] as const).map(([id, title, caption]) => `<button data-costume="${id}" aria-pressed="${id === "original"}" class="toy-costume"><span class="costume-sample ${id}" aria-hidden="true"></span><span><strong>${title}</strong><small>${caption}</small></span><span class="costume-check" aria-hidden="true">✓</span></button>`).join("")}</div></fieldset>
        <fieldset class="atelier-options toy-colors"><legend>Màu của Bự</legend>${[["#a27bce", "Tím khoai"], ["#6fae98", "Xanh bạc hà"], ["#e29a7f", "Hồng đào"]].map(([color, label], i) => `<button data-color="${color}" aria-label="${label}" aria-pressed="${i === 0}" style="--toy-color:${color}"><span></span></button>`).join("")}<span id="toy-color-name">Tím khoai</span></fieldset>
        <button class="toy-pause" id="toy-pause" aria-pressed="false">Dừng chuyển động</button>
        <p class="atelier-disclaimer">Thử ngoại hình và chuyển động mới. Phiên chơi của bạn vẫn giữ nguyên.</p>
      </aside>
    </div>
    <footer class="atelier-footer"><span>Một chút cho mình (ra đây nói chuyện 1 chút...)</span><span>Chưa mở bán mẫu thử</span></footer>
  </main>`;
  const $ = <E extends HTMLElement>(selector: string) => root.querySelector<E>(selector)!;
  const touch = $<HTMLButtonElement>("#toy-touch");
  const host = $("#toy-render"), loading = $("#toy-loading"), speech = $("#toy-speech");
  let stage: ReturnType<typeof createToyStage>;
  const fail = () => {
    touch.disabled = true;
    loading.hidden = false;
    loading.innerHTML = 'Chưa hiển thị được nhân vật 3D trên trình duyệt này.<br><a href="./">Về góc chơi</a> hoặc <button id="retry-toy">thử tải lại</button>.';
    $("#retry-toy").addEventListener("click", () => location.reload());
    root.querySelectorAll<HTMLButtonElement>(".atelier-controls button,.toy-rotate button,.toy-tools button").forEach(button => { button.disabled = true; });
  };
  try { stage = createToyStage(host, () => { loading.hidden = true; touch.disabled = false; }); }
  catch { fail(); return; }
  host.addEventListener("toy-context-lost", () => { stage.dispose(); fail(); });
  let toy: Toy = "punch", hits = 0, paused = false;
  const pause = $<HTMLButtonElement>("#toy-pause");
  const say = () => {
    const lines: Record<Toy, string[]> = {
      punch: ["Ê, má này còn mềm nè!", "Bực bạn. Méo mình.", "Được rồi, thở cái đã…"],
      hammer: ["Lún chút thôi. Lại phồng ngay.", "Ai vừa đóng dấu lên đầu mình?", "Đầu bẹp. Lòng vẫn rộng."],
      pillow: ["Ủa… ôm hay đấm vậy?", "Mềm gặp mềm. Huề nha.", "Cái này được. Tiếp đi."],
    };
    speech.textContent = lines[toy][hits++ % 3];
  };
  const hit = (direction = 1) => {
    stage.hit(toy, direction); say();
  };
  root.querySelectorAll<HTMLButtonElement>("[data-toy]").forEach(button => button.addEventListener("click", () => {
    toy = button.dataset.toy as Toy;
    root.querySelectorAll("[data-toy]").forEach(el => el.setAttribute("aria-pressed", String(el === button)));
    touch.setAttribute("aria-label", `Chạm Bự bằng ${toolNames[toy].toLowerCase()}. Kéo để xoay nhân vật.`);
    hit();
  }));
  root.querySelectorAll<HTMLButtonElement>("[data-costume]").forEach(button => button.addEventListener("click", () => {
    stage.costume(button.dataset.costume as Costume);
    root.querySelectorAll("[data-costume]").forEach(el => el.setAttribute("aria-pressed", String(el === button)));
    speech.textContent = button.dataset.costume === "dragon" ? "Rồng này không phun lửa. Chỉ phun bực." : button.dataset.costume === "mecha" ? "Giáp cứng. Bên trong vẫn là mình." : "Vẫn cái mặt ấy. Vẫn chờ bạn đây.";
  }));
  root.querySelectorAll<HTMLButtonElement>("[data-color]").forEach(button => button.addEventListener("click", () => {
    stage.color(button.dataset.color!);
    root.querySelectorAll("[data-color]").forEach(el => el.setAttribute("aria-pressed", String(el === button)));
    $("#toy-color-name").textContent = button.getAttribute("aria-label");
  }));
  pause.addEventListener("click", () => { paused = !paused; stage.pause(paused); pause.setAttribute("aria-pressed", String(paused)); pause.textContent = paused ? "Tiếp tục chuyển động" : "Dừng chuyển động"; });
  $("#toy-left").addEventListener("click", () => stage.rotate(-.45));
  $("#toy-right").addEventListener("click", () => stage.rotate(.45));
  let down: { x: number; y: number; last: number; moved: boolean } | undefined;
  touch.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, last: e.clientX, moved: false }; touch.setPointerCapture(e.pointerId); });
  touch.addEventListener("pointermove", e => {
    const rect = host.getBoundingClientRect();
    stage.look((e.clientX - rect.left) / rect.width * 2 - 1, 1 - (e.clientY - rect.top) / rect.height * 2);
    if (!down) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7) down.moved = true;
    if (down.moved) stage.rotate((e.clientX - down.last) * .009);
    down.last = e.clientX;
  });
  touch.addEventListener("pointerup", e => {
    if (down && !down.moved) { const r = touch.getBoundingClientRect(); hit(e.clientX < r.left + r.width / 2 ? -1 : 1); }
    down = undefined;
  });
  touch.addEventListener("pointercancel", () => { down = undefined; });
  touch.addEventListener("pointerleave", () => stage.look(0, 0));
  touch.addEventListener("click", e => { if (e.detail === 0) hit(); });
  touch.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); stage.rotate(e.key === "ArrowLeft" ? -.3 : .3); }
  });
  window.addEventListener("pagehide", event => { if (!event.persisted) stage.dispose(); });
}

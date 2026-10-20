import { renderFigure } from "../character/figure";
import { applyHit, initialState, type Mood } from "../character/reaction";
import {
  loadCharacter,
  saveCharacter,
  normalizeCharacter,
  escapeHtml,
  kinds,
  colors,
  type Character,
} from "../character/model";
import { Particles } from "../fx/particles";
import { tools, toolArt, type ToolId } from "../tools/registry";
import { scenes, sceneArt, type SceneId } from "../env/scenes";
import { Sound } from "../audio/synth";
const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({ sound: '<path d="m11 5-6 4H2v6h3l6 4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>', mute: '<path d="m11 5-6 4H2v6h3l6 4Zm6 4 5 6m0-6-5 6"/>', reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>', arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', shuffle: '<path d="m4 5 16 14m-4 0h4v-4M4 19l5-5m6-4 5-5m-4 0h4v4"/>', heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>', share: '<path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7"/>' } as Record<string, string>)[name] || ""}</svg>`;
const kindLabels = ["Cậu bạn", "Cô bạn", "Mèo ú", "Cục bực"];
export function mountStage(root: HTMLElement): void {
  let character = loadCharacter(),
    state = initialState(),
    selected: ToolId = "hammer",
    scene: SceneId = "studio",
    muted = true;
  try {
    muted = localStorage.getItem("hen1chut.muted") !== "false";
  } catch {
    /* Storage can be unavailable. */
  }
  root.innerHTML = `
  <div class="app-shell">
    <header class="topbar"><a class="brand" href="./" aria-label="Hẹn 1 chút, trang chủ"><span class="brand-mark"><i></i><i></i><b></b></span>hẹn<span>1</span>chút<span class="brand-dot">.</span></a><span class="brand-note">Một chút cho mình.</span><div class="header-actions"><button class="quiet-button" id="share" aria-label="Chia sẻ Hẹn 1 chút">${icon("share")}<span>Chia sẻ</span></button><button class="icon-button" id="sound" type="button"></button></div></header>
    <main>
      <section class="intro"><div><p class="intro-note"><span></span>Chỗ nhỏ cho một ngày hơi lớn</p><h1>Bực một chút.<br class="mobile-break"/> <span>Nhẹ đi nhiều.</span></h1><p>Cứ để bực bội ở đây. Chọn một món, chạm một cái, thở ra nào.</p></div><span class="intro-doodle" aria-hidden="true"><svg viewBox="0 0 120 95"><path d="M10 35q13 39 56 26 23-7 16-27-7-13-16-4-11 17 14 25 17 4 31-13m-14 1 15-3-5 15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>mọi thứ rồi sẽ ổn.</span></section>
      <div class="playground">
        <aside class="tool-panel" aria-labelledby="tools-title"><div class="panel-heading"><h2 id="tools-title">Chọn đồ chơi</h2><span>6 món xả bực</span></div><div class="tools" role="group" aria-label="Đồ chơi">${tools.map((t, i) => `<button type="button" class="tool-button" data-tool="${t.id}" aria-pressed="${i === 0}"><span class="tool-art">${toolArt(t.id)}</span><span>${t.label}</span><kbd>${i + 1}</kbd></button>`).join("")}</div><p class="tool-note">Mềm xèo thôi.<br/>Chỉ bực bội là bay mất.</p></aside>
        <section class="stage-panel" aria-label="Sân chơi xả stress"><div class="stage-top"><div class="scene-tabs" role="group" aria-label="Bối cảnh">${scenes.map((s, i) => `<button type="button" data-scene="${s.id}" aria-pressed="${i === 0}">${s.label}</button>`).join("")}</div><button id="reset" class="icon-button" aria-label="Bắt đầu lại">${icon("reset")}</button></div>
          <div class="arena" id="arena" data-scene="studio"><div class="scenery" id="scenery">${sceneArt("studio")}</div><div class="stage-caption"><span class="live-dot"></span><span id="scene-description">${scenes[0].description}</span></div><div class="speech" id="speech">Hôm nay có gì bực à?</div><div class="figure-ground"></div><div class="character-position"><button id="figure" class="figure-wrap" type="button" aria-label="Chạm để dùng búa mềm"></button></div><div class="impact-tool" id="impact-tool" aria-hidden="true"></div><canvas id="fx" aria-hidden="true"></canvas><div class="combo" id="combo" aria-hidden="true"></div><div class="stage-instruction" id="instruction"><span class="tap-symbol">${icon("arrow")}</span> Chạm vào mình để xả bực</div><div class="character-tag"><span id="character-name"></span><span>Đồng đội hứng bực của bạn</span></div></div>
          <div class="stage-bottom"><div class="score"><span class="score-icon">${icon("heart")}</span><div><strong><span id="count">0</span> <small>lần xả bực</small></strong><span id="milestone">Cứ từ từ, ở đây không ai vội.</span></div></div><button class="breathe-button" id="breathe">Thở một chút ${icon("arrow")}</button></div>
        </section>
        <aside class="creator-panel"><div class="panel-heading"><h2>Bạn đồng hành</h2><button type="button" id="shuffle" class="icon-button" aria-label="Tạo nhân vật ngẫu nhiên">${icon("shuffle")}</button></div><p class="panel-subtitle">Tạo một gương mặt để gửi bực bội.</p><div class="kind-options" role="group" aria-label="Loại nhân vật">${kinds.map((k, i) => `<button type="button" data-kind="${k}" aria-pressed="${k === character.kind}"><span>${renderFigure({ ...character, kind: k }, "normal", `thumb-${k}`)}</span>${kindLabels[i]}</button>`).join("")}</div><label class="field-label" for="name">Gọi bạn ấy là</label><div class="name-field"><input id="name" maxlength="40" value="${escapeHtml(character.name)}" autocomplete="off"/><span id="name-length"></span></div><span class="field-label" id="colors-label">Một chút màu sắc</span><div class="colors" role="group" aria-labelledby="colors-label">${colors.map((c, i) => `<button type="button" style="--swatch:${c}" data-color="${c}" aria-label="${["Tím khoai", "Cam đào", "Xanh bạc hà", "Vàng mật", "Xanh trời", "Hồng kẹo"][i]}" aria-pressed="${c === character.color}"><span></span></button>`).join("")}</div><label class="field-label" for="outfit">Mặc gì hôm nay?</label><select id="outfit"><option value="basic">Đồ ở nhà</option><option value="stripes">Áo kẻ chill chill</option><option value="overalls">Quần yếm</option></select><label class="field-label" for="body">Dáng người</label><select id="body"><option value="regular">Vừa xinh</option><option value="round">Tròn ủm</option><option value="tall">Cao nhòng</option></select><p class="saved-note" id="saved-note">Lưu trên máy bạn, riêng tư thôi.</p><div class="little-note"><span aria-hidden="true">“</span><p>Không cần lúc nào<br/>cũng phải ổn.<br/><b>Nghỉ một chút cũng được.</b></p></div></aside>
      </div>
      <footer class="footer"><p>Chỉ là hoạt hình. Chỉ để nhẹ lòng.</p><span>Không tài khoản · Không tải ảnh lên · Miễn phí</span><p>Hẹn bạn một ngày dịu hơn.</p></footer>
    </main>
    <dialog id="breathing" class="breathing-dialog" aria-labelledby="breath-label" aria-describedby="breath-description"><form method="dialog"><button class="icon-button close-dialog" aria-label="Đóng bài thở">×</button><p>Cho mình một khoảng nghỉ.</p><h2 id="breath-label">Hít vào…</h2><div class="breath-orb" aria-hidden="true"></div><p id="breath-description">Hít vào chậm trong 4 giây.</p><button class="breathe-button" value="done">Mình thấy nhẹ hơn rồi ${icon("heart")}</button></form></dialog><div class="toast" id="toast" role="status"></div>
  </div>`;
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!;
  const arena = $("#arena"),
    figure = $<HTMLButtonElement>("#figure"),
    canvas = $<HTMLCanvasElement>("#fx");
  const particles = new Particles(canvas),
    audio = new Sound(),
    reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let recovery: ReturnType<typeof setTimeout>,
    lastHit = 0,
    combo = 0,
    mood: Mood = "normal",
    toastTimer: ReturnType<typeof setTimeout>;
  const toast = (message: string) => {
    $("#toast").textContent = message;
    $("#toast").classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => $("#toast").classList.remove("visible"),
      3000,
    );
  };
  const draw = () => {
    figure.innerHTML = renderFigure(character, mood);
    figure.setAttribute(
      "aria-label",
      `Dùng ${tools.find((t) => t.id === selected)!.label} lên ${character.name}`,
    );
    $("#character-name").textContent = character.name;
    $("#count").textContent = String(state.hits);
    $("#name-length").textContent = `${Array.from(character.name).length}/20`;
  };
  const persist = () => {
    character = normalizeCharacter(character);
    if (!saveCharacter(character))
      $("#saved-note").textContent =
        "Trình duyệt chưa cho lưu. Bạn vẫn chơi được.";
    draw();
  };
  const resize = () => {
    const r = arena.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    canvas.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(resize).observe(arena);
  const syncSelections = () => {
    root
      .querySelectorAll<HTMLElement>("[data-kind]")
      .forEach((el) =>
        el.setAttribute(
          "aria-pressed",
          String(el.dataset.kind === character.kind),
        ),
      );
    root
      .querySelectorAll<HTMLElement>("[data-color]")
      .forEach((el) =>
        el.setAttribute(
          "aria-pressed",
          String(el.dataset.color === character.color),
        ),
      );
    $<HTMLInputElement>("#name").value = character.name;
    $<HTMLSelectElement>("#outfit").value = character.outfit;
    $<HTMLSelectElement>("#body").value = character.body;
  };
  const soundButton = () => {
    $("#sound").innerHTML = icon(muted ? "mute" : "sound");
    $("#sound").setAttribute(
      "aria-label",
      muted ? "Bật âm thanh" : "Tắt âm thanh",
    );
    $("#sound").setAttribute("aria-pressed", String(!muted));
  };
  const selectTool = (id: ToolId) => {
    selected = id;
    root
      .querySelectorAll<HTMLElement>("[data-tool]")
      .forEach((el) =>
        el.setAttribute("aria-pressed", String(el.dataset.tool === id)),
      );
    figure.setAttribute(
      "aria-label",
      `Dùng ${tools.find((t) => t.id === id)!.label} lên ${character.name}`,
    );
  };
  root
    .querySelectorAll<HTMLElement>("[data-tool]")
    .forEach((el) =>
      el.addEventListener("click", () => selectTool(el.dataset.tool as ToolId)),
    );
  root.querySelectorAll<HTMLElement>("button[data-scene]").forEach((el) =>
    el.addEventListener("click", () => {
      scene = el.dataset.scene as SceneId;
      arena.dataset.scene = scene;
      $("#scenery").innerHTML = sceneArt(scene);
      $("#scene-description").textContent = scenes.find(
        (s) => s.id === scene,
      )!.description;
      root
        .querySelectorAll<HTMLElement>("button[data-scene]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === el)));
      particles.clear();
    }),
  );
  root.querySelectorAll<HTMLElement>("[data-kind]").forEach((el) =>
    el.addEventListener("click", () => {
      character.kind = el.dataset.kind as Character["kind"];
      syncSelections();
      persist();
    }),
  );
  root.querySelectorAll<HTMLElement>("[data-color]").forEach((el) =>
    el.addEventListener("click", () => {
      character.color = el.dataset.color!;
      syncSelections();
      persist();
    }),
  );
  $("#name").addEventListener("input", () => {
    character.name = $<HTMLInputElement>("#name").value;
    persist();
  });
  $("#name").addEventListener("blur", syncSelections);
  for (const key of ["outfit", "body"] as const)
    $(`#${key}`).addEventListener("change", () => {
      character = normalizeCharacter({
        ...character,
        [key]: $<HTMLSelectElement>(`#${key}`).value,
      });
      persist();
    });
  $("#shuffle").addEventListener("click", () => {
    character = normalizeCharacter({
      ...character,
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      outfit: ["basic", "stripes", "overalls"][Math.floor(Math.random() * 3)],
      body: ["regular", "round", "tall"][Math.floor(Math.random() * 3)],
    });
    syncSelections();
    persist();
    toast("Một bạn mới, một chút vui mới.");
  });
  $("#sound").addEventListener("click", () => {
    muted = !muted;
    try {
      localStorage.setItem("hen1chut.muted", String(muted));
    } catch {
      /* Optional preference. */
    }
    if (muted) audio.mute();
    else audio.play(selected);
    soundButton();
  });
  const reset = () => {
    clearTimeout(recovery);
    state = initialState();
    mood = "normal";
    combo = 0;
    lastHit = 0;
    particles.clear();
    figure.getAnimations().forEach((a) => a.cancel());
    $("#impact-tool")
      .getAnimations()
      .forEach((a) => a.cancel());
    $("#impact-tool").innerHTML = "";
    $("#combo").textContent = "";
    arena.querySelectorAll(".pop,.impact-ring").forEach((el) => el.remove());
    $("#speech").textContent = "Lại đây, mình nghe nè.";
    $("#milestone").textContent = "Cứ từ từ, ở đây không ai vội.";
    $("#instruction").classList.remove("hidden");
    draw();
  };
  $("#reset").addEventListener("click", reset);
  const hit = (clientX?: number, clientY?: number) => {
    const now = performance.now();
    combo = now - lastHit < 850 ? Math.min(combo + 1, 99) : 1;
    lastHit = now;
    const tool = tools.find((t) => t.id === selected)!,
      bounds = arena.getBoundingClientRect(),
      fr = figure.getBoundingClientRect();
    const x = Math.max(
        40,
        Math.min(
          bounds.width - 40,
          clientX === undefined
            ? fr.left - bounds.left + fr.width / 2
            : clientX - bounds.left,
        ),
      ),
      y = Math.max(
        90,
        Math.min(
          bounds.height - 80,
          clientY === undefined
            ? fr.top - bounds.top + fr.height * 0.45
            : clientY - bounds.top,
        ),
      );
    state = applyHit(state);
    mood = state.mood;
    draw();
    clearTimeout(recovery);
    $("#instruction").classList.add("hidden");
    $("#speech").textContent = [
      "Cứ để mình lo!",
      "Bực bội bay đi!",
      "Thấy đỡ hơn chưa?",
      "Hết mưa là có nắng.",
    ][Math.floor(state.hits / 4) % 4];
    $("#milestone").textContent =
      state.hits < 10
        ? tool.hint
        : state.hits < 30
          ? "Bỏ lại thêm một chút bực bội."
          : "Đã xả kha khá rồi. Thử thở một chút nhé?";
    if (!muted) audio.play(selected);
    particles.burst(x, y, selected, reduceMotion.matches);
    $("#combo").textContent = combo >= 3 ? `×${combo} liên tiếp!` : "";
    if (!reduceMotion.matches) {
      figure.getAnimations().forEach((a) => a.cancel());
      const knock =
        selected === "boot"
          ? 25
          : selected === "water"
            ? -9
            : 9 + tool.power * 3;
      figure.animate(
        [
          { transform: "scale(1) rotate(0)" },
          {
            transform: `translate(${knock}px, 13px) scale(1.13,.83) rotate(${knock}deg)`,
            offset: 0.22,
          },
          {
            transform: "translate(-4px,-8px) scale(.95,1.06) rotate(-4deg)",
            offset: 0.6,
          },
          { transform: "scale(1) rotate(0)" },
        ],
        {
          duration: scene === "space" ? 660 : 360,
          easing: "cubic-bezier(.2,.7,.25,1)",
        },
      );
      const weapon = $("#impact-tool");
      weapon.getAnimations().forEach((a) => a.cancel());
      weapon.innerHTML = toolArt(selected);
      weapon.style.left = `${x}px`;
      weapon.style.top = `${y}px`;
      weapon.animate(
        [
          {
            opacity: 0,
            transform: "translate(65px,-90px) rotate(-60deg) scale(1.2)",
          },
          {
            opacity: 1,
            transform: "translate(-20px,-50px) rotate(15deg) scale(1)",
            offset: 0.35,
          },
          {
            opacity: 0,
            transform: "translate(25px,-85px) rotate(-20deg) scale(.7)",
          },
        ],
        { duration: 380, easing: "ease-out" },
      );
      const ring = document.createElement("span");
      ring.className = `impact-ring ${selected}`;
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      arena.append(ring);
      setTimeout(() => ring.remove(), 600);
    }
    const pop = document.createElement("div");
    pop.className = "pop";
    pop.textContent = tool.words[Math.floor(Math.random() * tool.words.length)];
    pop.style.left = `${Math.max(90, Math.min(bounds.width - 90, x))}px`;
    pop.style.top = `${Math.max(110, y - 70)}px`;
    arena.append(pop);
    setTimeout(() => pop.remove(), 800);
    recovery = setTimeout(() => {
      mood = "normal";
      draw();
      $("#combo").textContent = "";
    }, 1100);
  };
  figure.addEventListener("pointerdown", (e) => {
    if (e.button === 0) {
      e.preventDefault();
      figure.focus({ preventScroll: true });
      hit(e.clientX, e.clientY);
    }
  });
  figure.addEventListener("click", (e) => {
    if (e.detail === 0) hit();
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLSelectElement ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      $<HTMLDialogElement>("#breathing").open
    )
      return;
    const index = Number(e.key) - 1;
    if (index >= 0 && index < tools.length) selectTool(tools[index].id);
  });
  const dialog = $<HTMLDialogElement>("#breathing");
  let breathTimer: ReturnType<typeof setInterval>;
  $("#breathe").addEventListener("click", () => {
    let step = 0;
    $("#breath-label").textContent = "Hít vào…";
    $("#breath-description").textContent = "Hít vào chậm trong 4 giây.";
    dialog.dataset.exhale = "false";
    dialog.showModal();
    breathTimer = setInterval(() => {
      step++;
      const exhale = step % 2 === 1;
      dialog.dataset.exhale = String(exhale);
      $("#breath-label").textContent = exhale ? "Thở ra…" : "Hít vào…";
      $("#breath-description").textContent = exhale
        ? "Thả lỏng vai, thở ra chậm trong 4 giây."
        : "Hít vào chậm trong 4 giây.";
    }, 4000);
  });
  dialog.addEventListener("close", () => clearInterval(breathTimer));
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  $("#share").addEventListener("click", async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: "Hẹn 1 chút",
          text: "Bực một chút. Nhẹ đi nhiều.",
          url: location.href,
        });
      else {
        await navigator.clipboard.writeText(location.href);
        toast("Đã chép link. Gửi chút nhẹ lòng cho bạn bè nhé.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        toast("Bạn có thể chép đường dẫn trên thanh địa chỉ để chia sẻ.");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      particles.clear();
      audio.mute();
    }
  });
  syncSelections();
  draw();
  soundButton();
  selectTool(selected);
}

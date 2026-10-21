import { renderFigure } from "../character/figure";
import { type Mood } from "../character/reaction";
import {
  addImpact,
  loadSession,
  newSession,
  saveSession,
} from "../character/session";
import { loadPreferences, savePreferences } from "../platform/preferences";
import { mountCompanion } from "../ui/companion";
import { mountCloset } from "../ui/closet";
import { mountShop } from "../ui/shop";
import { accessibleCharacter, wearableOutfits } from "../commerce/catalog";
import { mountRanking } from "../ui/ranking";
import type { AccountContext } from "../ui/onboarding";
import type { PlayerState } from "../platform/cloud";
import { requestGuestImport } from "../platform/guest-import";
import { savePending, clearPending } from "../platform/pending-state";
import {
  loadCharacter,
  saveCharacter,
  normalizeCharacter,
  defaultCharacter,
  escapeHtml,
  kinds,
  colors,
  hats,
  glasses,
  outfitLabels,
  hatLabels,
  glassesLabels,
  type Character,
} from "../character/model";
import { Particles } from "../fx/particles";
import { impactMotion } from "../fx/motion";
import { animatePuppet, capturePuppetPose } from "../fx/puppet";
import { tools, toolArt, type ToolId } from "../tools/registry";
import { scenes, sceneArt, type SceneId } from "../env/scenes";
import { Sound } from "../audio/synth";
import { characterPresets } from "../character/presets";
const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({ sound: '<path d="m11 5-6 4H2v6h3l6 4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>', mute: '<path d="m11 5-6 4H2v6h3l6 4Zm6 4 5 6m0-6-5 6"/>', reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>', arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', shuffle: '<path d="m4 5 16 14m-4 0h4v-4M4 19l5-5m6-4 5-5m-4 0h4v4"/>', heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>', share: '<path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7"/>' } as Record<string, string>)[name] || ""}</svg>`;
const kindLabels = ["Cậu bạn", "Cô bạn", "Mèo ú", "Cục bực"];
export function mountStage(
  root: HTMLElement,
  account: AccountContext = { nickname: "Bạn chill" },
): void {
  const owned = new Set(account.owned || []);
  let availableOutfits = wearableOutfits(owned);
  let initializing = true;
  const prefix = account.userId
    ? `hen1chut.account.${account.userId}`
    : "hen1chut";
  const characterKey = account.userId
    ? `${prefix}.character`
    : "hen1chut.character";
  const sessionKey = account.userId
    ? `${prefix}.session`
    : "hen1chut.session.v1";
  const preferencesKey = account.userId
    ? `${prefix}.preferences`
    : "hen1chut.preferences.v1";
  const dailyKey = account.userId ? `${prefix}.daily` : "hen1chut.daily.v1";
  const preferences =
    account.initial?.preferences || loadPreferences(preferencesKey);
  let session = account.initial?.session || loadSession(sessionKey);
  let character = accessibleCharacter(
      account.initial?.character || account.character || loadCharacter(characterKey), owned),
    state = { hits: session.hits, mood: session.mood },
    selected: ToolId = preferences.tool,
    scene: SceneId = preferences.scene,
    muted = true;
  try {
    muted = localStorage.getItem("hen1chut.muted") !== "false";
  } catch {
    /* Storage can be unavailable. */
  }
  root.innerHTML = `
  <div class="app-shell">
    <header class="topbar"><a class="brand" href="./" aria-label="Hẹn 1 chút, trang chủ"><span class="brand-mark"><i></i><i></i><b></b></span>hẹn<span>1</span>chút<span class="brand-dot">.</span></a><span class="brand-note">Một chút cho mình (ra đây nói chuyện 1 chút...)</span><div class="header-actions"><button class="quiet-button ranking-button" id="ranking-open" aria-label="Mở bảng xếp hạng">Bảng xếp hạng</button><button class="account-pill" id="account-open" ${account.userId ? "" : 'aria-label="Lưu phiên bằng Google"'}>${account.userId ? escapeHtml(account.nickname) : '<span class="guest-label-full">Lưu phiên</span><span class="guest-label-short" aria-hidden="true">Lưu</span>'}</button><button class="quiet-button" id="share" aria-label="Chia sẻ Hẹn 1 chút">${icon("share")}<span>Chia sẻ</span></button><button class="icon-button" id="sound" type="button"></button></div></header>
    <main>
      <section class="intro"><div><p class="intro-note"><span></span>Chỗ nhỏ cho một ngày hơi lớn</p><h1>Bực một chút.<br class="mobile-break"/> <span>Nhẹ đi nhiều.</span></h1><p>Cứ để bực bội ở đây. Chọn một món, chạm một cái, thở ra nào.</p></div><span class="intro-doodle" aria-hidden="true"><svg viewBox="0 0 120 95"><path d="M10 35q13 39 56 26 23-7 16-27-7-13-16-4-11 17 14 25 17 4 31-13m-14 1 15-3-5 15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>mọi thứ rồi sẽ ổn.</span></section>
      <div class="playground">
        <aside class="tool-panel" aria-labelledby="tools-title"><div class="panel-heading"><h2 id="tools-title">Chọn đồ chơi</h2><span>12 món xả bực</span></div><div class="tools" role="group" aria-label="Đồ chơi">${tools.map((t, i) => `<button type="button" class="tool-button" data-tool="${t.id}" aria-pressed="${i === 0}"><span class="tool-art">${toolArt(t.id)}</span><span>${t.label}</span>${i < 6 ? `<kbd>${i + 1}</kbd>` : ""}</button>`).join("")}</div><p class="tool-note">Mềm xèo thôi.<br/>Chỉ bực bội là bay mất.</p></aside>
        <section class="stage-panel" aria-label="Sân chơi xả stress"><div class="stage-top"><div class="scene-tabs" role="group" aria-label="Bối cảnh">${scenes.map((s, i) => `<button type="button" data-scene="${s.id}" aria-pressed="${i === 0}">${s.label}</button>`).join("")}</div><button id="reset" class="icon-button" aria-label="Kết thúc phiên chơi">${icon("reset")}</button></div>
          <div class="arena" id="arena" data-scene="studio"><div class="scenery" id="scenery">${sceneArt("studio")}</div><div class="stage-caption"><span class="live-dot"></span><span id="scene-description">${scenes[0].description}</span></div><div class="speech" id="speech">Hôm nay có gì bực à?</div><div class="figure-ground"></div><div class="character-position"><button id="figure" class="figure-wrap" type="button" aria-label="Chạm để dùng búa mềm"></button></div><div class="impact-tool" id="impact-tool" aria-hidden="true"></div><canvas id="fx" aria-hidden="true"></canvas><div class="combo" id="combo" aria-hidden="true"></div><div class="stage-instruction" id="instruction"><span class="tap-symbol">${icon("arrow")}</span> Chạm vào mình để xả bực</div><div class="character-tag"><span id="character-name"></span><span>Đồng đội hứng bực của bạn</span></div></div>
          <div class="stage-bottom"><div class="score"><span class="score-icon">${icon("heart")}</span><div><strong><span id="count">0</span> <small>lần xả bực</small></strong><span id="milestone">Cứ từ từ, ở đây không ai vội.</span></div></div><button class="breathe-button" id="breathe">Thở một chút ${icon("arrow")}</button></div>
        </section>
        <aside class="creator-panel"><div class="panel-heading"><h2>Bạn đồng hành</h2><button type="button" id="closet-open" class="closet-launcher">Tủ đồ ↗</button><button type="button" id="shuffle" class="icon-button" aria-label="Tạo nhân vật ngẫu nhiên">${icon("shuffle")}</button></div><p class="panel-subtitle">Tạo một gương mặt để gửi bực bội.</p><div class="kind-options" role="group" aria-label="Loại nhân vật">${kinds.map((k, i) => `<button type="button" data-kind="${k}" aria-pressed="${k === character.kind}"><span>${renderFigure({ ...character, kind: k }, "normal", `thumb-${k}`)}</span>${kindLabels[i]}</button>`).join("")}</div><label class="field-label" for="name">Gọi bạn ấy là</label><div class="name-field"><input id="name" maxlength="40" value="${escapeHtml(character.name)}" autocomplete="off"/><span id="name-length"></span></div><span class="field-label" id="colors-label">Một chút màu sắc</span><div class="colors" role="group" aria-labelledby="colors-label">${colors.map((c, i) => `<button type="button" style="--swatch:${c}" data-color="${c}" aria-label="${["Tím khoai", "Cam đào", "Xanh bạc hà", "Vàng mật", "Xanh trời", "Hồng kẹo"][i]}" aria-pressed="${c === character.color}"><span></span></button>`).join("")}</div><label class="field-label" for="outfit">Mặc gì hôm nay?</label><select id="outfit">${availableOutfits.map((o) => `<option value="${o}">${outfitLabels[o]}</option>`).join("")}</select><label class="field-label" for="body">Dáng người</label><select id="body"><option value="regular">Vừa xinh</option><option value="round">Tròn ủm</option><option value="tall">Cao nhòng</option></select><div class="extra-customization"><label class="field-label" for="hat">Mũ & phụ kiện đầu</label><select id="hat">${hats.map((h) => `<option value="${h}">${hatLabels[h]}</option>`).join("")}</select><label class="field-label" for="glasses">Kính & biểu cảm</label><select id="glasses">${glasses.map((g) => `<option value="${g}">${glassesLabels[g]}</option>`).join("")}</select></div><p class="saved-note" id="saved-note">${account.cloud ? "Phiên lưu riêng trong tài khoản. Ngoại hình có thể hiện trên bảng điểm." : "Lưu trên máy bạn, riêng tư thôi."}</p><div class="little-note"><span aria-hidden="true">“</span><p>Không cần lúc nào<br/>cũng phải ổn.<br/><b>Nghỉ một chút cũng được.</b></p></div></aside>
      </div>
      <footer class="footer"><p>Chỉ là hoạt hình. Chỉ để nhẹ lòng.</p><span><a href="./huong-dan.html">Cách chơi</a> · <a href="./quyen-rieng-tu.html">Quyền riêng tư</a> · <a href="./ve-hen1chut.html">Về Hẹn 1 chút</a> · <a href="./dieu-khoan.html">Điều khoản</a></span><p>Hẹn bạn một ngày dịu hơn.</p></footer>
    </main>
    <dialog id="breathing" class="breathing-dialog" aria-labelledby="breath-label" aria-describedby="breath-description"><form method="dialog"><button class="icon-button close-dialog" aria-label="Đóng bài thở">×</button><p>Cho mình một khoảng nghỉ.</p><h2 id="breath-label">Hít vào…</h2><div class="breath-orb" aria-hidden="true"></div><p id="breath-description">Hít vào chậm trong 4 giây.</p><button class="breathe-button" value="done">Mình thấy nhẹ hơn rồi ${icon("heart")}</button></form></dialog><dialog id="session-summary" class="compact-dialog" aria-labelledby="summary-title"><button class="icon-button dialog-close" id="summary-close" aria-label="Tiếp tục phiên chơi">×</button><p class="intro-note">Một chút của bạn</p><h2 id="summary-title">Khép lại phiên này?</h2><p>Bạn đã gửi lại <b id="summary-hits"></b> chút bực bội. Mở phiên mới sẽ đưa nhân vật về ban đầu và xóa các vết tác động của phiên này.</p><div class="dialog-actions"><button id="summary-keep" class="secondary-button">Chơi tiếp phiên này</button><button id="session-new" class="primary-button">Kết thúc & mở phiên mới</button></div></dialog><dialog id="account-dialog" class="compact-dialog" aria-labelledby="account-title"><button class="icon-button dialog-close" id="account-close" aria-label="Đóng hồ sơ">×</button><p class="intro-note">Góc của bạn</p><h2 id="account-title">${escapeHtml(account.nickname)}</h2><p>${account.cloud ? "Đã kết nối Google. Nickname và điểm có thể xuất hiện trên bảng toàn cầu. Tên nhân vật và phiên chơi chỉ tài khoản của bạn truy cập được." : "Bạn đang chơi trên thiết bị này, không cần tài khoản. Đăng nhập Google để lưu sang thiết bị khác hoặc tham gia ranking. Phiên đã chơi trên máy vẫn được giữ để bạn chọn mang theo."}</p><p class="sync-status" id="sync-status" role="status">Đã lưu trên máy</p>${account.cloud ? '<button class="secondary-button" id="logout">Đăng xuất Google</button>' : account.connectCloud ? '<button class="primary-button" id="account-login">Lưu bằng Google</button><p class="field-help">Chỉ xin tên, ảnh hồ sơ và email để đăng nhập, không đọc Gmail.</p>' : ""}</dialog><dialog id="sync-conflict" class="compact-dialog" aria-labelledby="conflict-title"><h2 id="conflict-title">Có một phiên mới hơn.</h2><p>Thiết bị khác vừa đồng bộ. Chọn phiên muốn giữ để không ghi đè ngoài ý muốn.</p><div class="dialog-actions"><button class="secondary-button" id="use-cloud">Dùng phiên đã đồng bộ</button><button class="primary-button" id="use-device">Giữ phiên trên máy này</button></div></dialog><div class="ranked-banner" id="ranked-banner" hidden></div><div class="toast" id="toast" role="status"></div>
  </div>`;
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!;
  const arena = $("#arena"),
    figure = $<HTMLButtonElement>("#figure"),
    canvas = $<HTMLCanvasElement>("#fx");
  const particles = new Particles(canvas),
    audio = new Sound(),
    reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let sculpted: ReturnType<(typeof import("../character/renderer3d"))["createToyStage"]> | undefined;
  let previousAppearance = "";
  const creator = root.querySelector(".creator-panel")!;
  const presets = document.createElement("section");
  presets.className = "character-presets";
  presets.innerHTML = `<h3>Chọn mẫu rồi tự chỉnh</h3><div class="role-presets">${characterPresets.map(p => `<button type="button" data-role-preset="${p.id}" title="${p.note}"><span class="role-portrait">${renderFigure(p.character, "normal", `role-${p.id}`)}</span><span>${p.label}</span></button>`).join("")}</div><p class="field-help">Sếp, bạn cùng team hay ai đó bạn tự nghĩ ra. Đổi tên và phối đồ theo ý bạn.</p>`;
  creator.querySelector(".panel-subtitle")!.after(presets);
  const shortcuts = document.createElement("div"); shortcuts.className = "role-shortcuts"; shortcuts.setAttribute("role", "group"); shortcuts.setAttribute("aria-label", "Chọn nhanh nhân vật");
  shortcuts.innerHTML = `<span>Thử nhanh</span>${characterPresets.map(p => `<button type="button" data-role-preset="${p.id}" aria-pressed="false">${p.label}</button>`).join("")}`;
  root.querySelector(".stage-top")!.before(shortcuts);
  const renderControl = document.createElement("button"); renderControl.className = "quiet-button render-mode"; renderControl.id = "render-mode"; renderControl.textContent = "Đang chuẩn bị nhân vật 3D…"; renderControl.disabled = true; creator.append(renderControl);
  let recovery: ReturnType<typeof setTimeout>,
    lastHit = 0,
    combo = 0,
    mood: Mood = session.mood,
    toastTimer: ReturnType<typeof setTimeout>;
  let puppetAnimations: Animation[] = [];
  const cancelMotion = () => {
    puppetAnimations.forEach(animation => animation.cancel());
    puppetAnimations = [];
    figure.getAnimations().forEach(animation => animation.cancel());
  };
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
    figure.innerHTML = renderFigure(character, mood, "hero", session.marks);
    if (sculpted) {
      const appearance = JSON.stringify(character);
      if (appearance !== previousAppearance) { sculpted.character(character); previousAppearance = appearance; }
      sculpted.session(mood, session.marks);
    }
    figure.setAttribute(
      "aria-label",
      `Dùng ${tools.find((t) => t.id === selected)!.label} lên ${character.name}`,
    );
    $("#character-name").textContent = character.name;
    $("#count").textContent = String(state.hits);
    $("#name-length").textContent = `${Array.from(character.name).length}/20`;
  };
  const persist = () => {
    character = accessibleCharacter(normalizeCharacter(character), owned);
    draw();
    if (sculpted) root.querySelectorAll<HTMLElement>("[data-kind]").forEach(button => {
      const image = sculpted?.portrait({ ...character, kind: button.dataset.kind as Character["kind"] });
      if (image) button.querySelector("span")!.innerHTML = `<img src="${image}" alt=""/>`;
    });
    saveSnapshot();
  };
  root.querySelectorAll<HTMLButtonElement>("[data-role-preset]").forEach(button => button.addEventListener("click", () => {
    const preset = characterPresets.find(p => p.id === button.dataset.rolePreset)!;
    character = { ...preset.character }; syncSelections(); persist();
    toast(`Đã chọn mẫu ${preset.label}. Bạn có thể sửa tên và ngoại hình.`);
  }));
  const resize = () => {
    const r = arena.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    canvas.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(resize).observe(arena);
  const syncSelections = () => {
    root.querySelectorAll<HTMLElement>("[data-role-preset]").forEach(button => {
      const preset = characterPresets.find(p => p.id === button.dataset.rolePreset)!;
      button.setAttribute("aria-pressed", String((["kind", "outfit", "hat", "glasses", "color", "body"] as const).every(key => character[key] === preset.character[key])));
    });
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
    $<HTMLSelectElement>("#hat").value = character.hat;
    $<HTMLSelectElement>("#glasses").value = character.glasses;
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
    preferences.tool = id;
    root
      .querySelectorAll<HTMLElement>("[data-tool]")
      .forEach((el) =>
        el.setAttribute("aria-pressed", String(el.dataset.tool === id)),
      );
    figure.setAttribute(
      "aria-label",
      `Dùng ${tools.find((t) => t.id === id)!.label} lên ${character.name}`,
    );
    saveSnapshot();
  };
  root
    .querySelectorAll<HTMLElement>("[data-tool]")
    .forEach((el) =>
      el.addEventListener("click", () => selectTool(el.dataset.tool as ToolId)),
    );
  root.querySelectorAll<HTMLElement>("button[data-scene]").forEach((el) =>
    el.addEventListener("click", () => {
      scene = el.dataset.scene as SceneId;
      preferences.scene = scene;
      saveSnapshot();
      arena.dataset.scene = scene;
      $("#scenery").innerHTML = sceneArt(scene);
      $("#scene-description").textContent = scenes.find(
        (s) => s.id === scene,
      )!.description;
      root
        .querySelectorAll<HTMLElement>("button[data-scene]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === el)));
      particles.clear();
      const tabs = el.parentElement!;
      tabs.scrollTo({ left: el.offsetLeft - tabs.offsetLeft - (tabs.clientWidth - el.offsetWidth) / 2, behavior: reduceMotion.matches ? "auto" : "smooth" });
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
  for (const key of ["outfit", "body", "hat", "glasses"] as const)
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
      outfit: availableOutfits[Math.floor(Math.random() * availableOutfits.length)],
      hat: hats[Math.floor(Math.random() * hats.length)],
      glasses: glasses[Math.floor(Math.random() * glasses.length)],
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
    cancelMotion();
    clearTimeout(recovery);
    session = newSession();
    state = { hits: 0, mood: "normal" };
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
  $("#reset").addEventListener("click", () => {
    $("#summary-hits").textContent = String(session.hits);
    $<HTMLDialogElement>("#session-summary").showModal();
  });
  for (const id of ["summary-keep", "summary-close"])
    $(`#${id}`).addEventListener("click", () =>
      $<HTMLDialogElement>("#session-summary").close(),
    );
  $("#session-new").addEventListener("click", () => {
    try {
      localStorage.setItem(
        `${prefix}.last-session`,
        JSON.stringify({ ...session, endedAt: Date.now() }),
      );
    } catch {}
    reset();
    saveSnapshot();
    $<HTMLDialogElement>("#session-summary").close();
  });
  const hit = (clientX?: number, clientY?: number) => {
    const carried = puppetAnimations.length ? capturePuppetPose(figure) : undefined;
    const carriedFigure = puppetAnimations.length ? getComputedStyle(figure).transform : undefined;
    cancelMotion();
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
    const previousTool = session.marks.at(-1)?.tool;
    session = addImpact(
      session,
      selected,
      clientX === undefined ? 150 : ((clientX - fr.left) / fr.width) * 300,
      clientY === undefined ? 140 : ((clientY - fr.top) / fr.height) * 340,
    );
    state = { hits: session.hits, mood: session.mood };
    mood = session.mood;
    const discovery = companion.recordHit(selected, { previousTool, kind: character.kind, scene });
    ranking.recordHit();
    draw();
    const hitDirection = clientX === undefined ? (session.hits % 2 ? 1 : -1) : clientX < fr.left + fr.width / 2 ? 1 : -1;
    sculpted?.hit(discovery?.motion || selected, hitDirection);
    clearTimeout(recovery);
    $("#instruction").classList.add("hidden");
    $("#speech").textContent = discovery?.line || [
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
      const reactionTool = discovery?.motion || selected;
      const direction = clientX === undefined ? (session.hits % 2 ? 1 : -1) : clientX < fr.left + fr.width / 2 ? 1 : -1;
      const motion = impactMotion(reactionTool, scene === "space", direction);
      if (carriedFigure) motion.figure[0] = { ...motion.figure[0], transform: carriedFigure };
      if (!sculpted) figure.animate(motion.figure, {
        duration: motion.duration,
        easing: "cubic-bezier(.2,.7,.25,1)",
      });
      puppetAnimations = sculpted ? [] : animatePuppet(figure, reactionTool, direction, motion.duration, carried);
      const ball = scene === "football" && selected === "boot" ? root.querySelector(".pitch-ball") : null;
      if (ball) puppetAnimations.push(ball.animate([
        {transform:"none"},
        {transform:"translate(35px,-65px) rotate(95deg)",offset:.35},
        {transform:"translate(60px,0) rotate(170deg)",offset:.65},
        {transform:"translate(25px,-16px) rotate(220deg)",offset:.82},
        {transform:"none"},
      ],{duration:800,easing:"ease-out"}));
      const papers = scene === "office" ? root.querySelector(".office-papers") : null;
      if (papers) puppetAnimations.push(papers.animate([
        {transform:"none"},
        {transform:"translate(4px,-8px) rotate(8deg)",offset:.28},
        {transform:"none"},
      ],{duration:450,easing:"ease-out"}));
      const shadow = root.querySelector(".figure-ground");
      if (shadow) puppetAnimations.push(shadow.animate([
        {transform:"translateX(-50%) scale(1)"},
        {transform:`translateX(-50%) scale(${selected === "confetti" || selected === "lightning" ? ".7,.8" : "1.18,.85"})`,offset:.25},
        {transform:"translateX(-50%) scale(1)"},
      ], {duration:motion.duration,easing:"ease-out"}));
      const weapon = $("#impact-tool");
      weapon.getAnimations().forEach((a) => a.cancel());
      weapon.innerHTML = sculpted ? "" : toolArt(selected);
      weapon.style.left = `${x}px`;
      weapon.style.top = `${y}px`;
      weapon.animate(impactMotion(selected, scene === "space", direction).weapon, { duration: 380, easing: "ease-out" });
      const ring = document.createElement("span");
      ring.className = `impact-ring ${selected}`;
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      arena.querySelectorAll(".impact-ring").forEach(el => el.remove());
      arena.append(ring);
      setTimeout(() => ring.remove(), 600);
    }
    const pop = document.createElement("div");
    pop.className = "pop";
    pop.setAttribute("aria-hidden", "true");
    pop.textContent = tool.words[Math.floor(Math.random() * tool.words.length)];
    const popX = x + (session.hits % 2 ? 1 : -1) * Math.min(110, bounds.width * .28);
    pop.style.left = `${Math.max(72, Math.min(bounds.width - 72, popX))}px`;
    pop.style.top = `${Math.max(90, y - 60)}px`;
    arena.querySelectorAll(".pop").forEach(el => el.remove());
    arena.append(pop);
    setTimeout(() => pop.remove(), 800);
    recovery = setTimeout(() => {
      cancelMotion();
      mood = session.mood;
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
  figure.addEventListener("pointermove", event => {
    if (reduceMotion.matches || event.pointerType === "touch") return;
    const rect = figure.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    figure.style.setProperty("--look-x", `${x * 3}px`);
    figure.style.setProperty("--look-y", `${y * 2}px`);
    sculpted?.look(x, -y);
  });
  figure.addEventListener("pointerleave", () => {
    figure.style.setProperty("--look-x", "0px");
    figure.style.setProperty("--look-y", "0px");
    sculpted?.look(0, 0);
  });
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) { cancelMotion(); particles.clear(); }
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLSelectElement ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      root.querySelector("dialog[open]")
    )
      return;
    const index = Number(e.key) - 1;
    if (index >= 0 && index < 6) selectTool(tools[index].id);
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
      if (document.hidden) return;
      step++;
      if (step === 2) companion.recordBreath();
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
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelMotion();
      particles.clear();
      audio.mute();
      // Every input saves immediately. Hiding a read-only tab must not write
      // another cloud revision or turn a clean snapshot into a pending edit.
    } else companion.refresh();
  });
  let companion: ReturnType<typeof mountCompanion>;
  let syncTimer: ReturnType<typeof setTimeout>,
    syncing = false,
    queued = false,
    conflictRevision: number | null = account.conflicted
      ? account.cloud!.revision
      : null,
    saveGeneration = 0,
    discardingLocal = false;
  const snapshot = (): PlayerState => ({
    character,
    session,
    daily: companion.progress(),
    preferences,
  });
  const syncCloud = async () => {
    if (discardingLocal || !account.cloud || !navigator.onLine || conflictRevision !== null)
      return;
    if (syncing) {
      queued = true;
      return;
    }
    syncing = true;
    const sentGeneration = saveGeneration;
    try {
      const result = await account.cloud.saveState(snapshot());
      if (result.conflict) {
        conflictRevision = result.revision || 0;
        $("#sync-status").textContent = "Có phiên mới hơn trên thiết bị khác.";
        $<HTMLDialogElement>("#sync-conflict").showModal();
      } else {
        $("#sync-status").textContent = "Đã đồng bộ tài khoản";
        if (account.userId) {
          if (saveGeneration === sentGeneration) clearPending(account.userId);
          else {
            savePending(account.userId, account.cloud.revision, snapshot());
            queued = true;
          }
        }
      }
    } catch {
      $("#sync-status").textContent = "Đã lưu trên máy, chờ mạng để đồng bộ.";
    } finally {
      syncing = false;
      if (queued) {
        queued = false;
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => void syncCloud(), 1800);
      }
    }
  };
  const saveSnapshot = (localOnly = false) => {
    if (discardingLocal || initializing) return;
    if (!localOnly) saveGeneration++;
    const characterSaved = saveCharacter(character, characterKey),
      sessionSaved = saveSession(session, sessionKey);
    savePreferences(preferences, preferencesKey);
    if (!characterSaved || !sessionSaved)
      $("#saved-note").textContent =
        "Trình duyệt chưa cho lưu. Bạn vẫn chơi được.";
    if (localOnly) return;
    if (account.cloud && account.userId) {
      savePending(
        account.userId,
        conflictRevision === null
          ? account.cloud.revision
          : (account.pendingRevision ?? account.cloud.revision),
        snapshot(),
      );
      clearTimeout(syncTimer);
      $("#sync-status").textContent = "Đã lưu trên máy, đang chờ đồng bộ…";
      syncTimer = setTimeout(() => void syncCloud(), 1800);
    }
  };
  companion = mountCompanion(root, {
    getCharacter: () => character,
    getPortrait: value => sculpted?.portrait(value, 640),
    getScene: () => scene,
    onPreset: (value, newScene) => {
      character = accessibleCharacter({ ...value, name: character.name }, owned);
      if (character.outfit !== value.outfit) toast("Bạn mới đã vào sân. Bộ trang phục này có thể xem thử trong tủ đồ.");
      syncSelections();
      persist();
      root
        .querySelector<HTMLButtonElement>(`button[data-scene="${newScene}"]`)!
        .click();
    },
    onChange: saveSnapshot,
    toast,
    initial: account.initial?.daily,
    storageKey: dailyKey,
  });
  mountCloset(
    root,
    () => character,
    (value) => {
      character = value;
      syncSelections();
      persist();
    },
    { getOwned: () => owned, openShop: () => shop.open(), portrait: value => sculpted?.portrait(value) },
  );
  let signingIn = false;
  const signIn = async () => {
    if (!account.connectCloud || signingIn) return;
    signingIn = true;
    const login = root.querySelector<HTMLButtonElement>("#account-login");
    if (login) { login.disabled = true; login.textContent = "Đang mở Google…"; }
    saveSnapshot();
    const changedCharacter = (Object.keys(defaultCharacter) as (keyof Character)[]).some(k => character[k] !== defaultCharacter[k]);
    if (session.hits > 0 || changedCharacter || scene !== "studio") requestGuestImport(session.id);
    try { await (await account.connectCloud()).signIn(); }
    catch {
      signingIn = false;
      if (login) { login.disabled = false; login.textContent = "Lưu bằng Google"; }
      toast("Chưa mở được Google. Phiên vẫn lưu trên máy, thử lại khi có mạng nhé.");
    }
  };
  root.querySelector("#account-login")?.addEventListener("click", () => void signIn());
  const ranking = mountRanking(
    root,
    account.cloud || account.publicCloud,
    toast,
    account.userId,
    { connectCloud: account.connectCloud, onSignIn: account.connectCloud ? () => void signIn() : undefined, portrait: value => sculpted?.portrait(value) },
  );
  const shop = mountShop(root, account, {
    portrait: value => sculpted?.portrait(value),
    getCharacter: () => character,
    getOwned: () => owned,
    onSignIn: () => void signIn(),
    onRestore: items => {
      owned.clear();
      items.forEach(item => owned.add(item));
      availableOutfits = wearableOutfits(owned);
      $("#outfit").innerHTML = availableOutfits.map(outfit => `<option value="${outfit}">${outfitLabels[outfit]}</option>`).join("");
      const before = character.outfit;
      character = accessibleCharacter(character, owned);
      syncSelections();
      if (before !== character.outfit) persist();
    },
    onWear: outfit => {
      character = accessibleCharacter({ ...character, outfit }, owned);
      syncSelections();
      persist();
    },
    toast,
  });
  $("#account-open").addEventListener("click", () =>
    $<HTMLDialogElement>("#account-dialog").showModal(),
  );
  $("#account-close").addEventListener("click", () =>
    $<HTMLDialogElement>("#account-dialog").close(),
  );
  $("#logout")?.addEventListener("click", async () => {
    try {
      await account.cloud!.signOut();
      location.reload();
    } catch {
      toast("Chưa đăng xuất được. Thử lại khi có mạng nhé.");
    }
  });
  $("#use-cloud").addEventListener("click", () => {
    // Reload hides this document. Do not recreate the discarded pending save.
    discardingLocal = true;
    clearTimeout(syncTimer);
    queued = false;
    if (account.userId) clearPending(account.userId);
    location.reload();
  });
  $("#use-device").addEventListener("click", () => {
    if (account.cloud && conflictRevision !== null) {
      account.cloud.revision = conflictRevision;
      conflictRevision = null;
      saveSnapshot();
      $<HTMLDialogElement>("#sync-conflict").close();
      void syncCloud();
    }
  });
  window.addEventListener("online", () => void syncCloud());
  syncSelections();
  draw();
  soundButton();
  selectTool(selected);
  root
    .querySelector<HTMLButtonElement>(`button[data-scene="${scene}"]`)!
    .click();
  initializing = false;
  saveSnapshot(!account.needsInitialSave);
  if (account.conflicted) $<HTMLDialogElement>("#sync-conflict").showModal();
  if (session.hits) {
    $("#speech").textContent = "Mình vẫn nhớ phiên chơi của bạn.";
    $("#instruction").classList.add("hidden");
    $("#milestone").textContent = "Phiên trước vẫn còn đây. Cứ chơi tiếp nhé.";
  }
  let loading3d = false;
  const fallBack = () => {
    sculpted?.dispose(); sculpted = undefined; previousAppearance = "";
    arena.querySelector(".stage-render-3d")?.remove(); delete arena.dataset.renderer;
    renderControl.disabled = false; renderControl.textContent = "Bật tạo hình 3D";
  };
  const load3d = async () => {
    if (loading3d || sculpted) return;
    loading3d = true; renderControl.disabled = true;
    const host = document.createElement("div"); host.className = "stage-render-3d"; host.setAttribute("aria-hidden", "true"); arena.append(host);
    try {
      const { createToyStage } = await import("../character/renderer3d");
      sculpted = createToyStage(host, () => {
        arena.dataset.renderer = "3d"; renderControl.disabled = false; renderControl.textContent = "Dùng bản nhẹ 2D";
      }, { game: true });
      sculpted.character(character); sculpted.session(mood, session.marks); previousAppearance = JSON.stringify(character);
      host.addEventListener("toy-context-lost", fallBack, { once: true });
      for (const preset of characterPresets) {
        const image = sculpted.portrait(preset.character);
        if (image) presets.querySelector(`[data-role-preset="${preset.id}"] .role-portrait`)!.innerHTML = `<img src="${image}" alt=""/>`;
      }
      root.querySelectorAll<HTMLElement>("[data-kind]").forEach(button => {
        const image = sculpted?.portrait({ ...character, kind: button.dataset.kind as Character["kind"] });
        if (image) button.querySelector("span")!.innerHTML = `<img src="${image}" alt=""/>`;
      });
    } catch { fallBack(); }
    finally { loading3d = false; }
  };
  renderControl.addEventListener("click", () => { if (sculpted) fallBack(); else void load3d(); });
  window.addEventListener("pagehide", event => { if (!event.persisted) sculpted?.dispose(); });
  void load3d();
}

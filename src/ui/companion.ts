import {
  dailyTasks,
  dailyNote,
  isDailyComplete,
  loadProgress,
  recordProgress,
  saveProgress,
  normalizeProgress,
  type DailyProgress,
} from "../progress/daily";
import { makePostcard, downloadPostcard } from "../sharing/postcard";
import { presetUrl, parsePreset } from "../sharing/preset";
import type { Character } from "../character/model";
import type { SceneId } from "../env/scenes";
import type { ToolId } from "../tools/registry";
import { toolArt } from "../tools/registry";
import { discoveries, findDiscovery, type DiscoveryContext } from "../progress/discoveries";
interface CompanionOptions {
  getCharacter: () => Character;
  getPortrait?: (character: Character) => string | undefined;
  getScene: () => SceneId;
  onPreset: (character: Character, scene: SceneId) => void;
  onChange: () => void;
  toast: (message: string) => void;
  initial?: DailyProgress;
  storageKey?: string;
}
export function mountCompanion(root: HTMLElement, options: CompanionOptions) {
  let progress = options.initial
    ? normalizeProgress(options.initial)
    : loadProgress(options.storageKey);
  const holder = document.createElement("section");
  holder.className = "daily-panel";
  holder.setAttribute("aria-labelledby", "daily-heading");
  holder.innerHTML = `<div class="daily-copy"><p>Hẹn hôm nay</p><h2 id="daily-heading"></h2><span id="daily-note"></span></div><div class="daily-actions"><button type="button" class="quiet-button" id="daily-toggle" aria-expanded="false" aria-controls="daily-tasks"><span id="daily-count"></span> chút cho mình <span aria-hidden="true">⌄</span></button><button type="button" class="breathe-button" id="postcard-open">Gửi một chút nhẹ lòng <span aria-hidden="true">↗</span></button></div><div id="daily-tasks" class="daily-tasks" hidden></div><p class="daily-history" id="daily-history"></p>`;
  root.querySelector(".playground")!.after(holder);
  const dialogs = document.createElement("div");
  dialogs.innerHTML = `<dialog id="postcard" class="postcard-dialog" aria-labelledby="postcard-title"><button class="icon-button dialog-close" id="postcard-close" aria-label="Đóng bưu thiếp">×</button><div class="postcard-preview"><img id="postcard-preview" alt="Bưu thiếp Hẹn 1 chút có nhân vật bạn đang chơi"/></div><div class="postcard-copy"><p class="intro-note">Một chút của bạn, gửi cho ai đó</p><h2 id="postcard-title">Gửi nhẹ lòng đi.</h2><p>Một tấm thiệp nhỏ, kèm người bạn hứng bực đang mặc đúng bộ đồ bạn chọn.</p><label class="check-label"><input type="checkbox" id="postcard-name"/>Kèm tên nhân vật trên ảnh</label><p class="field-help">Mặc định không đưa tên riêng vào ảnh hoặc link.</p><button class="primary-button" id="postcard-share" disabled>Chia sẻ ảnh</button><button class="secondary-button" id="postcard-download" disabled>Tải ảnh PNG</button><button class="quiet-button" id="postcard-link">Chép link người bạn này</button><p id="postcard-status" class="field-help" role="status">Đang vẽ thiệp cho bạn…</p></div></dialog><dialog id="shared-preset" class="compact-dialog" aria-labelledby="preset-title"><p class="intro-note">Bạn có một lời hẹn</p><h2 id="preset-title">Có người gửi bạn<br/>một chút nhẹ lòng.</h2><p>Đón người bạn mới vào sân chơi? Nhân vật và trang phục sẽ đổi theo món quà, phiên chơi đang có vẫn được giữ.</p><div class="dialog-actions"><button class="secondary-button" id="preset-dismiss">Giữ bạn của mình</button><button class="primary-button" id="preset-accept">Đón bạn mới</button></div></dialog>`;
  root.append(dialogs);
  const book = document.createElement("div");
  book.className = "discovery-book";
  book.innerHTML = '<button class="quiet-button" id="discovery-toggle" aria-expanded="false" aria-controls="discovery-list">Sổ của Bự <span id="discovery-count">0/6 chuyện nhỏ</span></button><ul id="discovery-list" hidden></ul>';
  holder.append(book);
  const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
    root.querySelector<T>(s)!;
  const update = () => {
    progress = normalizeProgress(progress);
    const tasks = dailyTasks(progress),
      done = tasks.filter((t) => t.done).length;
    $("#daily-heading").textContent = dailyNote()[0];
    $("#daily-note").textContent = dailyNote()[1];
    $("#daily-count").textContent = `${done}/3`;
    $("#daily-tasks").innerHTML = tasks
      .map(
        (t) =>
          `<div class="daily-task ${t.done ? "complete" : ""}"><span class="task-dot" aria-hidden="true">${t.done ? "✓" : ""}</span><span>${t.label}</span><b>${t.value}</b>${t.id === "breathe" && !t.done ? '<button type="button" id="daily-breathe">Thử thở</button>' : ""}</div>`,
      )
      .join("");
    $("#daily-tasks")
      .querySelector("#daily-breathe")
      ?.addEventListener("click", () => $("#breathe").click());
    $("#daily-history").textContent = progress.completedDays.length
      ? `Bạn đã dành ${progress.completedDays.length} ngày dành một chút cho mình.`
      : "Ba gợi ý nhỏ, không cần phải làm hết. Tiến trình lưu riêng cho bạn.";
    holder.classList.toggle("daily-complete", isDailyComplete(progress));
    $("#discovery-count").textContent = `${progress.discoveries?.length || 0}/6 chuyện nhỏ`;
    if (!$("#discovery-list").hidden) drawDiscoveries();
  };
  const drawDiscoveries = () => {
    $("#discovery-list").innerHTML = discoveries.map(discovery => {
      const found = progress.discoveries?.includes(discovery.id);
      return `<li class="${found ? "discovered" : ""}"><span class="discovery-art" aria-hidden="true">${toolArt(discovery.tool)}</span><div><b>${found ? discovery.name : "Một chuyện chưa gặp"}</b><p>${found ? discovery.line : discovery.clue}</p></div><span class="discovery-state">${found ? "Đã gặp" : "Thử nhé"}</span></li>`;
    }).join("");
  };
  $("#discovery-toggle").addEventListener("click", () => {
    const open = $("#discovery-list").hidden;
    $("#discovery-list").hidden = !open;
    $("#discovery-toggle").setAttribute("aria-expanded", String(open));
    if (open) drawDiscoveries();
  });
  const record = (event: Parameters<typeof recordProgress>[1]) => {
    const before = isDailyComplete(normalizeProgress(progress));
    progress = recordProgress(progress, event);
    saveProgress(progress, options.storageKey);
    update();
    options.onChange();
    if (!before && isDailyComplete(progress))
      options.toast(
        "Hẹn hôm nay đã trọn vẹn. Gửi một tấm thiệp cho ai đó nhé.",
      );
  };
  $("#daily-toggle").addEventListener("click", () => {
    const expanded =
      $("#daily-toggle").getAttribute("aria-expanded") === "true";
    $("#daily-toggle").setAttribute("aria-expanded", String(!expanded));
    $("#daily-tasks").hidden = expanded;
  });
  const dialog = $<HTMLDialogElement>("#postcard");
  let blob: Blob | null = null,
    previewUrl = "",
    generation = 0;
  const prepare = async () => {
    const current = ++generation;
    blob = null;
    $<HTMLButtonElement>("#postcard-share").disabled = true;
    $<HTMLButtonElement>("#postcard-download").disabled = true;
    $("#postcard-status").textContent = "Đang vẽ thiệp cho bạn…";
    try {
      const generated = await makePostcard(
        options.getCharacter(),
        $<HTMLInputElement>("#postcard-name").checked,
        options.getPortrait?.(options.getCharacter()),
      );
      if (current !== generation || !dialog.open) return;
      blob = generated;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(blob);
      $<HTMLImageElement>("#postcard-preview").src = previewUrl;
      $<HTMLButtonElement>("#postcard-share").disabled = false;
      $<HTMLButtonElement>("#postcard-download").disabled = false;
      $("#postcard-status").textContent =
        "Ảnh được tạo ngay trên máy, không tải lên server.";
    } catch {
      $("#postcard-status").textContent =
        "Chưa tạo được ảnh. Đóng rồi mở lại thiệp để thử nhé.";
    }
  };
  const openPostcard = () => {
    if (!dialog.open) {
      dialog.showModal();
      void prepare();
    }
  };
  $("#postcard-open").addEventListener("click", openPostcard);
  $("#share").addEventListener("click", openPostcard);
  $("#postcard-close").addEventListener("click", () => dialog.close());
  $("#postcard-name").addEventListener("change", () => void prepare());
  dialog.addEventListener("close", () => {
    generation++;
    blob = null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = "";
    }
    $<HTMLImageElement>("#postcard-preview").removeAttribute("src");
  });
  $("#postcard-download").addEventListener("click", () => {
    if (blob) {
      downloadPostcard(blob);
      $("#postcard-status").textContent = "Đã tạo file PNG để lưu về máy.";
    }
  });
  $("#postcard-share").addEventListener("click", async () => {
    if (!blob) return;
    const file = new File([blob], "hen1chut.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share)
        await navigator.share({
          files: [file],
          title: "Hẹn 1 chút",
          text: "Gửi bạn một chút nhẹ lòng.",
        });
      else {
        downloadPostcard(blob);
        $("#postcard-status").textContent =
          "Trình duyệt này chưa chia sẻ ảnh trực tiếp. Ảnh PNG đã sẵn sàng tải về.";
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError"))
        $("#postcard-status").textContent =
          "Chưa chia sẻ được ảnh. Bạn vẫn có thể tải PNG hoặc chép link.";
    }
  });
  $("#postcard-link").addEventListener("click", async () => {
    const url = presetUrl(
      options.getCharacter(),
      options.getScene(),
      location.href,
    );
    try {
      await navigator.clipboard.writeText(url);
      $("#postcard-status").textContent =
        "Đã chép link người bạn này, không kèm tên riêng.";
    } catch {
      $("#postcard-status").textContent =
        "Chưa chép được. Bạn có thể dùng đường dẫn trên thanh địa chỉ.";
    }
  });
  const preset = parsePreset(location.hash),
    presetDialog = $<HTMLDialogElement>("#shared-preset");
  if (preset) {
    presetDialog.showModal();
    $("#preset-accept").addEventListener("click", () => {
      options.onPreset(preset.character, preset.scene);
      presetDialog.close();
      history.replaceState(null, "", location.pathname + location.search);
    });
    $("#preset-dismiss").addEventListener("click", () => {
      presetDialog.close();
      history.replaceState(null, "", location.pathname + location.search);
    });
  }
  update();
  return {
    recordHit: (tool: ToolId, context?: DiscoveryContext) => {
      record({type:"hit",tool});
      const discovery = context ? findDiscovery(tool, context) : undefined;
      if (discovery && !progress.discoveries?.includes(discovery.id)) {
        record({type:"discovery",id:discovery.id});
        options.toast(`Vừa khám phá: ${discovery.name}. Đã ghi vào sổ của Bự.`);
      }
      return discovery;
    },
    recordBreath: () => record({ type: "breath" }),
    progress: () => progress,
    openPostcard,
    refresh: update,
  };
}

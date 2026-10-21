import type { Cloud, LeaderboardEntry, RankedRound } from "../platform/cloud";
import { escapeHtml } from "../character/model";
import { renderFigure } from "../character/figure";
export function mountRanking(
  root: HTMLElement,
  cloud: Cloud | undefined,
  toast: (message: string) => void,
  userId?: string,
  options: { connectCloud?: () => Promise<Cloud>; onSignIn?: () => void } = {},
) {
  const dialog = document.createElement("dialog");
  dialog.className = "ranking-dialog";
  dialog.setAttribute("aria-labelledby", "ranking-title");
  dialog.innerHTML = `<header><div><p class="intro-note">Một chút thi đấu vui</p><h2 id="ranking-title">Bảng xếp hạng toàn cầu</h2></div><button class="icon-button" id="ranking-close" aria-label="Đóng bảng xếp hạng">×</button></header><p class="ranking-intro">30 giây xả bực. Server ghi nhận tối đa 8 lượt mỗi giây, chỉ nhận khi vòng còn mở. Nickname và điểm được công khai, tên nhân vật thì không.</p><div class="closet-tabs" role="group" aria-label="Kỳ xếp hạng"><button data-ranking-scope="all" aria-pressed="true">Từ trước đến nay</button><button data-ranking-scope="week" aria-pressed="false">7 ngày gần đây</button></div><div id="ranking-content" aria-live="polite"></div><div class="ranking-actions"><p class="field-help">Điểm tự do trong phiên chơi không tự đưa lên bảng. Chỉ vòng thi đấu đã hoàn tất mới được tính.</p><button class="primary-button" id="ranked-start" ${cloud && userId ? "" : "disabled"}>Chơi vòng 30 giây</button></div><p class="field-help" id="ranked-result" role="status"></p>`;
  if (!userId && options.onSignIn) {
    const startButton = dialog.querySelector("#ranked-start")!;
    startButton.insertAdjacentHTML("beforebegin", '<p class="field-help">Xem bảng tự do. Đăng nhập Google khi muốn tham gia thi đấu và giữ phiên.</p><button class="primary-button" id="ranking-sign-in">Đăng nhập để thi đấu</button>');
    startButton.remove();
    dialog.querySelector("#ranking-sign-in")!.addEventListener("click", options.onSignIn);
  }
  root.append(dialog);
  const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
    dialog.querySelector<T>(s)!;
  let scope: "all" | "week" = "all",
    request = 0,
    round: RankedRound | null = null,
    pending = 0,
    sequence = 0,
    serverHits = 0,
    sending = false,
    running = false,
    deadline = 0,
    timer: ReturnType<typeof setInterval>,
    finishing = false,
    retries = 0;
  const banner = root.querySelector<HTMLElement>("#ranked-banner")!;
  const pendingKey = userId
    ? `hen1chut.account.${userId}.ranked-pending`
    : null;
  const pendingId = () => {
    try {
      const value = pendingKey ? localStorage.getItem(pendingKey) : null;
      return value && /^[a-f\d-]{36}$/i.test(value) ? value : null;
    } catch {
      return null;
    }
  };
  const clearPendingRound = () => {
    try {
      if (pendingKey) localStorage.removeItem(pendingKey);
    } catch {}
  };

  const render = (entries: LeaderboardEntry[]) => {
    if (!entries.length) {
      $("#ranking-content").innerHTML =
        '<div class="ranking-empty"><span aria-hidden="true">↗</span><h3>Bảng đang đợi người mở màn.</h3><p>Hoàn thành vòng 30 giây để có điểm thật đầu tiên.</p></div>';
      return;
    }
    $("#ranking-content").innerHTML =
      `<ol class="ranking-list">${entries.map((e) => `<li class="${e.is_me ? "is-me" : ""}"><span class="rank-number">${e.rank}</span><span class="ranking-avatar">${renderFigure(e.avatar, "normal", `rank-${e.rank}`)}</span><span class="rank-nickname">${escapeHtml(e.nickname)}${e.is_me ? "<small>Bạn</small>" : ""}</span><strong>${e.score}<small>lượt</small></strong></li>`).join("")}</ol>`;
  };
  const load = async () => {
    const current = ++request;
    if (!cloud && options.connectCloud) {
      $("#ranking-content").innerHTML = '<p class="ranking-loading">Đang lấy bảng điểm thật…</p>';
      try { cloud = await options.connectCloud(); }
      catch {
        $("#ranking-content").innerHTML = '<p>Chưa tải được bảng điểm. Bạn vẫn có thể chơi và giữ phiên trên máy.</p>';
        return;
      }
    }
    if (!cloud) {
      $("#ranking-content").innerHTML =
        '<div class="ranking-empty"><span aria-hidden="true">↗</span><h3>Bảng toàn cầu chưa mở.</h3><p>Bản trải nghiệm hiện lưu trên máy. Google login và bảng điểm online sẽ mở cùng nhau, bạn vẫn có thể chơi và lưu phiên trên thiết bị này.</p></div>';
      return;
    }
    $("#ranking-content").innerHTML =
      '<p class="ranking-loading">Đang lấy bảng điểm thật…</p>';
    try {
      const pending = pendingId();
      if (pending && !running && !finishing) {
        try {
          const result = await cloud.finishRound(pending);
          $("#ranked-result").textContent =
            `Đã khôi phục kết quả vòng trước: ${result.hits} lượt hợp lệ.`;
          clearPendingRound();
        } catch {
          /* A still-open round will be resumed by startRound. */
        }
      }
      const entries = await cloud.leaderboard(scope);
      if (current === request) render(entries);
    } catch {
      if (current === request)
        $("#ranking-content").innerHTML =
          '<div class="ranking-empty"><h3>Chưa tải được bảng điểm.</h3><p>Kiểm tra mạng rồi mở lại bảng nhé. Phiên trên máy vẫn còn.</p></div>';
    }
  };
  const finish = async () => {
    if (!round || !cloud || finishing) return;
    finishing = true;
    running = false;
    clearInterval(timer);
    banner.textContent = "Vòng đã khép lại. Đang xác nhận điểm…";
    try {
      const result = await cloud.finishRound(round.id);
      serverHits = result.hits;
      clearPendingRound();
      $("#ranked-result").textContent =
        `Vòng vừa rồi: ${result.hits} lượt được server ghi nhận.`;
      toast(`Đã lên bảng với ${result.hits} lượt hợp lệ.`);
      await load();
      if (!dialog.open) dialog.showModal();
    } catch {
      toast(
        "Vòng đã dừng, chưa xác nhận được điểm. Mở bảng và thử lại khi có mạng.",
      );
      $("#ranked-result").textContent =
        "Chưa gửi được kết quả. Điểm chỉ xuất hiện khi server xác nhận vòng.";
    } finally {
      finishing = false;
      banner.hidden = true;
      $<HTMLButtonElement>("#ranked-start").disabled = false;
    }
  };
  const flush = async () => {
    if (!running || !cloud || !round || sending || pending === 0) return;
    if (performance.now() >= deadline) return;
    const batch = Math.min(8, pending);
    pending -= batch;
    sending = true;
    try {
      const result = await cloud.recordHits(round.id, sequence + 1, batch);
      serverHits = result.hits;
      sequence = result.sequence;
      retries = 0;
    } catch {
      pending = Math.min(8, pending + batch);
      retries++;
      if (retries >= 4) {
        toast("Mạng đang chậm. Vòng vẫn kết thúc theo thời gian server.");
        retries = 0;
      }
    } finally {
      sending = false;
    }
  };
  const start = async () => {
    if (!cloud || !userId || running || finishing) return;
    $<HTMLButtonElement>("#ranked-start").disabled = true;
    try {
      round = await cloud.startRound();
      try {
        if (pendingKey) localStorage.setItem(pendingKey, round.id);
      } catch {}
      sequence = round.sequence;
      serverHits = round.hits;
      pending = 0;
      running = true;
      retries = 0;
      deadline =
        performance.now() +
        Math.max(
          0,
          new Date(round.expires_at).getTime() -
            new Date(round.server_now).getTime(),
        );
      dialog.close();
      banner.hidden = false;
      const tick = () => {
        const remaining = Math.max(
          0,
          Math.ceil((deadline - performance.now()) / 1000),
        );
        banner.innerHTML = `<span>Vòng toàn cầu <b>${remaining}s</b></span><strong>${serverHits} <small>lượt đã xác nhận</small></strong>`;
        if (remaining === 0) {
          clearInterval(timer);
          setTimeout(() => void finish(), 700);
        } else void flush();
      };
      tick();
      timer = setInterval(tick, 300);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast(
        message.includes("round_cooldown")
          ? "Nghỉ vài giây rồi thử vòng mới nhé."
          : message.includes("hourly_round_limit")
            ? "Đã đủ nhiều vòng trong giờ này. Thử quay lại sau nhé."
            : "Chưa mở được vòng. Kiểm tra mạng hoặc đăng nhập lại nhé.",
      );
      $<HTMLButtonElement>("#ranked-start").disabled = false;
    }
  };
  root.querySelector("#ranking-open")!.addEventListener("click", () => {
    dialog.showModal();
    void load();
  });
  $("#ranking-close").addEventListener("click", () => dialog.close());
  dialog.querySelector("#ranked-start")?.addEventListener("click", () => void start());
  dialog.querySelectorAll<HTMLElement>("[data-ranking-scope]").forEach((el) =>
    el.addEventListener("click", () => {
      scope = el.dataset.rankingScope as typeof scope;
      dialog
        .querySelectorAll("[data-ranking-scope]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === el)));
      void load();
    }),
  );
  return {
    recordHit: () => {
      if (running && performance.now() < deadline)
        pending = Math.min(8, pending + 1);
    },
  };
}

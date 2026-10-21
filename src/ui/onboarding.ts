import {
  defaultCharacter,
  escapeHtml,
  normalizeCharacter,
  type Character,
} from "../character/model";
import { renderFigure } from "../character/figure";
import type { Cloud, PlayerState } from "../platform/cloud";
import { loadSession } from "../character/session";
import { loadCharacter } from "../character/model";
import { loadProgress } from "../progress/daily";
import { loadPreferences } from "../platform/preferences";
import { loadPending, reconcileState, clearPending } from "../platform/pending-state";
import { takeGuestImport } from "../platform/guest-import";
export interface AccountContext {
  nickname: string;
  userId?: string;
  cloud?: Cloud;
  initial?: PlayerState;
  character?: Character;
  conflicted?: boolean;
  pendingRevision?: number;
  publicCloud?: Cloud;
  connectCloud?: () => Promise<Cloud>;
}
export function guestAccount(connectCloud?: () => Promise<Cloud>): AccountContext {
  let nickname = "Bạn chill";
  try {
    const saved = JSON.parse(localStorage.getItem("hen1chut.guest-profile") || "null");
    if (saved && validNickname(saved.nickname)) nickname = saved.nickname;
  } catch { /* Playing does not require storage. */ }
  return { nickname, connectCloud };
}
export function validNickname(value: string): boolean {
  const n = value.trim().normalize("NFC");
  return (
    Array.from(n).length >= 2 &&
    Array.from(n).length <= 20 &&
    !/[<>@\u0000-\u001f\u007f]/.test(n)
  );
}
const BRAND =
  '<a class="brand" href="./"><span class="brand-mark"><i></i><i></i><b></b></span>hẹn<span>1</span>chút<span class="brand-dot">.</span></a>';
export async function onboard(
  root: HTMLElement,
  cloud?: Cloud,
): Promise<AccountContext> {
  const guestSession = loadSession();
  const importRequested = takeGuestImport(guestSession.id);
  let userId: string | undefined;
  if (cloud) {
    try {
      const user = await cloud.user();
      if (user) {
        userId = user.id;
        const profile = await cloud.profile(user.id);
        if (profile) {
          const remote = await cloud.state(user.id),
            pending = loadPending(user.id),
            resolved = reconcileState(remote, cloud.revision, pending);
          let keepGuest = false;
          if (importRequested) {
            root.innerHTML = `<main class="startup-error"><h1>Phiên nào đi cùng bạn?</h1><p>Trên máy đang có ${guestSession.hits} lượt. Tài khoản có ${resolved.state?.session.hits || 0} lượt. Chọn giữ một phiên, số lượt và dấu tác động sẽ đi cùng phiên đó.</p><button class="primary-button" id="import-guest-choice">Giữ phiên vừa chơi trên máy</button><button class="secondary-button" id="keep-account-choice">Dùng phiên của tài khoản</button></main>`;
            keepGuest = await new Promise<boolean>(resolve => {
              root.querySelector("#import-guest-choice")!.addEventListener("click", () => resolve(true), {once:true});
              root.querySelector("#keep-account-choice")!.addEventListener("click", () => resolve(false), {once:true});
            });
            if (keepGuest) clearPending(user.id);
          }
          return {
            nickname: profile.nickname,
            userId: user.id,
            cloud,
            initial: keepGuest ? { character: loadCharacter(), session: guestSession, daily: loadProgress(), preferences: loadPreferences() } : resolved.state,
            character: normalizeCharacter(profile.avatar),
            conflicted: keepGuest ? false : resolved.conflict,
            pendingRevision: keepGuest ? undefined : pending?.revision,
          };
        }
      }
    } catch {
      if (userId) throw new Error("account_state_unavailable");
    }
  }
  if (!userId || !cloud) return { ...guestAccount(cloud ? async () => cloud : undefined), publicCloud: cloud };
  const authenticatedCloud = cloud;
  const canImport = guestSession.hits > 0 || importRequested;
  const guestCharacter = canImport ? loadCharacter() : defaultCharacter;
  root.innerHTML = `<div class="welcome-shell"><header class="topbar">${BRAND}<span class="brand-note">Một chút cho mình (ra đây nói chuyện 1 chút...)</span></header><main class="welcome"><section class="welcome-intro"><p class="intro-note">Chỗ nhỏ cho một ngày hơi lớn</p><h1>Ra đây nói chuyện<br/><span>một chút nào.</span></h1><p>Một người bạn hứng bực. Cả tủ đồ chơi.<br/>Và một khoảng nghỉ chỉ dành cho bạn.</p><div class="welcome-mascot">${renderFigure({ ...defaultCharacter, hat: "headphones" }, "normal", "welcome")}</div><span class="welcome-speech">Bực gì, kể Bự nghe!</span></section><section class="welcome-form" aria-labelledby="welcome-title"><p class="welcome-step">Đã kết nối Google</p><h2 id="welcome-title">Mình gọi bạn là gì?</h2><p>Nickname cho bạn. Một cái tên cho người bạn hứng bực.</p><form id="profile-form"><label class="field-label" for="nickname">Nickname của bạn</label><input id="nickname" class="text-input" maxlength="40" placeholder="Ví dụ: Đạt chill" autocomplete="nickname" required/><p class="field-help">Nickname sẽ xuất hiện trên bảng xếp hạng.</p><label class="field-label" for="target-name">Tên nhân vật muốn đấm</label><input id="target-name" class="text-input" maxlength="40" placeholder="Ví dụ: Deadline dí" value="${escapeHtml(guestCharacter.name)}" autocomplete="off" required/><p class="field-help">Tên này chỉ bạn thấy. Bạn có thể đổi sau.</p>${canImport ? `<label class="import-session"><input id="import-session" type="checkbox" checked/> Giữ phiên trên máy: ${guestSession.hits} lượt, trang phục và dấu tác động</label>` : ""}<button type="submit" class="primary-button">Quay lại sân chơi <span aria-hidden="true">→</span></button></form><p class="form-error" id="onboarding-error" role="alert"></p><p class="welcome-privacy">Xem <a href="./quyen-rieng-tu.html">quyền riêng tư</a> và <a href="./dieu-khoan.html">điều khoản sử dụng</a>. Chỉ giải trí bằng hoạt hình, không tải ảnh người thật.</p></section></main></div>`;
  return new Promise((resolve) => {
    root
      .querySelector<HTMLFormElement>("#profile-form")!
      .addEventListener("submit", async (event) => {
        event.preventDefault();
        const nickname = root
          .querySelector<HTMLInputElement>("#nickname")!
          .value.trim()
          .normalize("NFC");
        const name = root
          .querySelector<HTMLInputElement>("#target-name")!
          .value.trim();
        const error = root.querySelector("#onboarding-error")!;
        if (!validNickname(nickname)) {
          error.textContent =
            "Nickname cần 2–20 ký tự, không chứa email hoặc dấu < >.";
          return;
        }
        if (!name) {
          error.textContent = "Đặt tên cho bạn hứng bực trước nhé.";
          return;
        }
        const character = normalizeCharacter({ ...defaultCharacter, name });
        const button = root.querySelector<HTMLButtonElement>(
          "button[type=submit]",
        )!;
        button.disabled = true;
        try {
          await authenticatedCloud.saveProfile(nickname, character);
          const importing =
            canImport &&
            root.querySelector<HTMLInputElement>("#import-session")?.checked;
          resolve({
            nickname,
            userId,
            cloud: authenticatedCloud,
            publicCloud: cloud,
            character,
            initial: importing
              ? {
                  character: { ...guestCharacter, name: character.name },
                  session: guestSession,
                  daily: loadProgress(),
                  preferences: loadPreferences(),
                }
              : undefined,
          });
        } catch (err) {
          const { cloudError } = await import("../platform/cloud");
          error.textContent = cloudError(err);
          button.disabled = false;
        }
      });
  });
}

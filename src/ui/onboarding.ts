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
import { loadPending, reconcileState } from "../platform/pending-state";
export interface AccountContext {
  nickname: string;
  userId?: string;
  cloud?: Cloud;
  initial?: PlayerState;
  character?: Character;
  conflicted?: boolean;
  pendingRevision?: number;
  publicCloud?: Cloud;
  googleEnabled?: boolean;
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
  googleEnabled: boolean | null = true,
): Promise<AccountContext> {
  let userId: string | undefined;
  let errorMessage = "";
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
          return {
            nickname: profile.nickname,
            userId: user.id,
            cloud,
            initial: resolved.state,
            character: normalizeCharacter(profile.avatar),
            conflicted: resolved.conflict,
            pendingRevision: pending?.revision,
          };
        }
      }
    } catch {
      if (userId) throw new Error("account_state_unavailable");
      errorMessage = "Chưa kết nối được tài khoản.";
    }
  }
  if (!userId && googleEnabled !== true) {
    try {
      const saved = JSON.parse(
        localStorage.getItem("hen1chut.guest-profile") || "null",
      );
      if (saved && validNickname(saved.nickname))
        return {
          nickname: saved.nickname,
          publicCloud: cloud,
          googleEnabled: false,
        };
    } catch {
      /* A damaged guest profile is safely ignored. */
    }
  }
  const authenticatedCloud = userId ? cloud : undefined;
  const needsSignIn = Boolean(cloud && !userId && googleEnabled === true);
  const guestSession = loadSession();
  const canImport = Boolean(userId && guestSession.hits > 0);
  const guestCharacter = canImport ? loadCharacter() : defaultCharacter;
  root.innerHTML = `<div class="welcome-shell"><header class="topbar">${BRAND}<span class="brand-note">Một chút cho mình (ra đây nói chuyện 1 chút...)</span></header><main class="welcome"><section class="welcome-intro"><p class="intro-note">Chỗ nhỏ cho một ngày hơi lớn</p><h1>Ra đây nói chuyện<br/><span>một chút nào.</span></h1><p>Một người bạn hứng bực. Cả tủ đồ chơi.<br/>Và một khoảng nghỉ chỉ dành cho bạn.</p><div class="welcome-mascot">${renderFigure({ ...defaultCharacter, hat: "headphones" }, "normal", "welcome")}</div><span class="welcome-speech">Bực gì, kể Bự nghe!</span></section><section class="welcome-form" aria-labelledby="welcome-title"><p class="welcome-step">${needsSignIn ? "Bắt đầu một chút cho mình" : authenticatedCloud ? "Sắp xong rồi" : "Chào bạn mới"}</p><h2 id="welcome-title">${needsSignIn ? "Có hẹn với chính mình." : "Mình gọi bạn là gì?"}</h2><p>${needsSignIn ? "Đăng nhập Google để giữ nhân vật, lưu phiên chơi và lên bảng xếp hạng." : "Nickname cho bạn. Một cái tên cho người bạn hứng bực."}</p>${needsSignIn ? '<button id="google-login" class="primary-button google-login"><span aria-hidden="true">G</span>Tiếp tục bằng Google</button><small>Chỉ dùng Google để đăng nhập, không đọc hộp thư.</small>' : `<form id="profile-form"><label class="field-label" for="nickname">Nickname của bạn</label><input id="nickname" class="text-input" maxlength="40" placeholder="Ví dụ: Đạt chill" autocomplete="nickname" required/><p class="field-help">${authenticatedCloud ? "Nickname sẽ xuất hiện trên bảng xếp hạng." : "Chơi thử trên máy này, chưa lên bảng toàn cầu."}</p><label class="field-label" for="target-name">Tên nhân vật muốn đấm</label><input id="target-name" class="text-input" maxlength="40" placeholder="Ví dụ: Deadline dí" value="${escapeHtml(guestCharacter.name)}" autocomplete="off" required/><p class="field-help">Tên này chỉ bạn thấy. Bạn có thể đổi sau.</p>${canImport ? `<label class="import-session"><input id="import-session" type="checkbox" checked/> Giữ phiên trên máy: ${guestSession.hits} lượt, trang phục và dấu tác động</label>` : ""}<button type="submit" class="primary-button">Ra đây một chút <span aria-hidden="true">→</span></button></form>`}<p class="form-error" id="onboarding-error" role="alert">${escapeHtml(errorMessage ? "Chưa tải được tài khoản. Thử đăng nhập lại nhé." : "")}</p><p class="welcome-privacy">Bằng cách tiếp tục, bạn xác nhận đã đọc <a href="./quyen-rieng-tu.html">quyền riêng tư</a>. Chỉ giải trí bằng hoạt hình, không tải ảnh người thật.</p></section></main><footer class="welcome-footer"><a href="./huong-dan.html">Cách chơi</a><a href="./ve-hen1chut.html">Về Hẹn 1 chút</a><span>Chỉ là hoạt hình. Chỉ để nhẹ lòng.</span></footer></div>`;
  return new Promise((resolve) => {
    if (needsSignIn) {
      root
        .querySelector<HTMLButtonElement>("#google-login")!
        .addEventListener("click", async () => {
          const button =
            root.querySelector<HTMLButtonElement>("#google-login")!;
          button.disabled = true;
          try {
            await cloud!.signIn();
          } catch {
            root.querySelector("#onboarding-error")!.textContent =
              "Chưa mở được Google. Thử lại nhé.";
            button.disabled = false;
          }
        });
      return;
    }
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
          if (authenticatedCloud)
            await authenticatedCloud.saveProfile(nickname, character);
          else
            try {
              localStorage.setItem(
                "hen1chut.guest-profile",
                JSON.stringify({ nickname }),
              );
            } catch {
              /* Guests can still play. */
            }
          const importing =
            canImport &&
            root.querySelector<HTMLInputElement>("#import-session")?.checked;
          resolve({
            nickname,
            userId,
            cloud: authenticatedCloud,
            publicCloud: cloud,
            googleEnabled: googleEnabled === true,
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

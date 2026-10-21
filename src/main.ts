import "./style.css";
import { mountStage } from "./stage/stage";
import { onboard, guestAccount } from "./ui/onboarding";
import { needsAccountRestore } from "./platform/entry";
import type { Cloud } from "./platform/cloud";
import { cloudConfig, cloudConfigured } from "./platform/config";
import { rememberPreset, recoverPreset } from "./sharing/preset";
const root = document.getElementById("app")!;
let cloudPromise: Promise<Cloud> | undefined;
const connectCloud = cloudConfigured ? () => {
  cloudPromise ||= import("./platform/cloud")
    .then(({ Cloud }) => new Cloud(cloudConfig.url!, cloudConfig.key!))
    .catch(error => { cloudPromise = undefined; throw error; });
  return cloudPromise;
} : undefined;
async function start(): Promise<void> {
  rememberPreset(location.href);
  let restore = false;
  if (connectCloud) {
    try { restore = needsAccountRestore(cloudConfig.url!, location.href, localStorage); }
    catch { restore = new URL(location.href).searchParams.has("code"); }
  }
  const status = root.querySelector("[data-startup-status]");
  if (status && restore) status.textContent = "Đang tải tài khoản và phiên chơi…";
  const account = restore && connectCloud
    ? await onboard(root, await connectCloud())
    : guestAccount(connectCloud);
  const resumed = recoverPreset(location.href);
  if (resumed !== location.href) history.replaceState(null, "", resumed);
  mountStage(root, account);
  window.scrollTo(0, 0);
}
void start().catch(() => {
  root.innerHTML =
    '<main class="startup-error"><h1>Chưa mở được góc nhỏ.</h1><p>Thử tải lại nhé. Nhân vật đã lưu trên máy vẫn còn nguyên.</p><button class="primary-button" id="retry-start">Tải lại trang</button><a href="./huong-dan.html">Xem hướng dẫn</a></main>';
  root
    .querySelector("#retry-start")!
    .addEventListener("click", () => location.reload());
});

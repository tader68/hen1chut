import "./style.css";
import { mountStage } from "./stage/stage";
import { onboard } from "./ui/onboarding";
import { cloudConfig, cloudConfigured } from "./platform/config";
const root = document.getElementById("app")!;
async function start(): Promise<void> {
  let cloud;
  if (cloudConfigured) {
    const { Cloud } = await import("./platform/cloud");
    cloud = new Cloud(cloudConfig.url!, cloudConfig.key!);
  }
  const account = await onboard(
    root,
    cloud,
    cloud ? await cloud.googleAvailable() : false,
  );
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

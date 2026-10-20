import {
  outfits,
  hats,
  glasses,
  outfitLabels,
  hatLabels,
  glassesLabels,
  type Character,
} from "../character/model";
import { renderFigure } from "../character/figure";
export function mountCloset(
  root: HTMLElement,
  getCharacter: () => Character,
  onChange: (c: Character) => void,
): void {
  const dialog = document.createElement("dialog");
  dialog.className = "closet-dialog";
  dialog.setAttribute("aria-labelledby", "closet-title");
  dialog.innerHTML =
    '<header><div><p class="intro-note">Tủ đồ của bạn đồng hành</p><h2 id="closet-title">Hôm nay mặc gì?</h2></div><button class="icon-button" id="closet-close" aria-label="Đóng tủ đồ">×</button></header><div class="closet-tabs" role="group" aria-label="Loại phụ kiện"><button data-closet-tab="outfit" aria-pressed="true">12 trang phục</button><button data-closet-tab="hat" aria-pressed="false">8 món đội đầu</button><button data-closet-tab="glasses" aria-pressed="false">5 món đeo mắt</button></div><div id="closet-items" class="closet-items"></div><p class="field-help">Chọn để mặc ngay. Đổi đồ vẫn giữ trạng thái phiên chơi.</p>';
  root.append(dialog);
  let tab: "outfit" | "hat" | "glasses" = "outfit";
  const draw = () => {
    const character = getCharacter();
    const values = tab === "outfit" ? outfits : tab === "hat" ? hats : glasses;
    const labels =
      tab === "outfit"
        ? outfitLabels
        : tab === "hat"
          ? hatLabels
          : glassesLabels;
    dialog.querySelector("#closet-items")!.innerHTML = values
      .map(
        (value, index) =>
          `<button type="button" data-closet-value="${value}" aria-pressed="${character[tab] === value}"><span class="closet-avatar">${renderFigure({ ...character, [tab]: value }, "normal", `closet-${index}`)}</span><span>${(labels as Record<string, string>)[value] || value}</span><small>${character[tab] === value ? "Đang mặc" : "Mặc thử"}</small></button>`,
      )
      .join("");
    dialog.querySelectorAll<HTMLElement>("[data-closet-value]").forEach((el) =>
      el.addEventListener("click", () => {
        onChange({ ...getCharacter(), [tab]: el.dataset.closetValue });
        draw();
      }),
    );
  };
  dialog.querySelectorAll<HTMLElement>("[data-closet-tab]").forEach((el) =>
    el.addEventListener("click", () => {
      tab = el.dataset.closetTab as typeof tab;
      dialog
        .querySelectorAll("[data-closet-tab]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === el)));
      draw();
    }),
  );
  root.querySelector("#closet-open")!.addEventListener("click", () => {
    draw();
    dialog.showModal();
  });
  dialog
    .querySelector("#closet-close")!
    .addEventListener("click", () => dialog.close());
}

import { renderFigure } from "../character/figure";
import { escapeHtml, outfitLabels, premiumOutfits, type Character } from "../character/model";
import { PACK_NAME,PACK_SKU,SALES_READY,canWear,type CommerceProduct,type CommerceOrder,type Outfit } from "../commerce/catalog";
import { checkoutMessage,orderPhase,qrUrl } from "../commerce/checkout";
import type { AccountContext } from "./onboarding";
import type { Cloud } from "../platform/cloud";
import { animatePuppet } from "../fx/puppet";
const money = (value: number) => new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(value);
const REOPEN = "hen1chut.reopen-shop";
export function mountShop(root: HTMLElement,account: AccountContext,options:{getCharacter:()=>Character;getOwned:()=>ReadonlySet<string>;onRestore:(items:string[])=>void;onWear:(outfit:Outfit)=>void;onSignIn:()=>void;toast:(message:string)=>void;portrait?:(character:Character)=>string|undefined}) {
  const dialog = document.createElement("dialog");
  dialog.className = "shop-dialog";
  dialog.setAttribute("aria-labelledby","shop-title");
  dialog.innerHTML = `<header><div><p class="intro-note">Thêm một chút cá tính</p><h2 id="shop-title">${PACK_NAME}</h2></div><button class="icon-button" id="shop-close" aria-label="Đóng bộ trang phục">×</button></header><p class="shop-intro">Rồng con có cánh mềm. Giáp máy có một trái tim sáng. Hai bộ dùng cho cả 4 nhân vật, chỉ đổi ngoại hình.</p><div class="pack-outfits" id="pack-outfits"></div><div class="shop-preview-actions"><button class="quiet-button" id="shop-react">Thử một phản ứng</button><button class="secondary-button" id="shop-wear" hidden>Mặc bộ đang chọn</button></div><p class="field-help">Bạn đang xem thử trong tủ. Nhân vật và dấu tác động ngoài sân chơi vẫn giữ nguyên.</p><div class="shop-purchase"><div><p class="shop-price" id="shop-price">Đang xem bộ mới…</p><p class="field-help" id="shop-availability"></p></div><button class="primary-button" id="shop-buy" disabled>Đang tải…</button></div><button class="quiet-button" id="shop-restore">${account.userId ? "Khôi phục đồ đã mua" : "Đăng nhập để khôi phục đồ"}</button><p class="field-help" id="shop-status" role="status"></p><section id="checkout-panel" class="checkout-panel" aria-label="Đơn chuyển khoản" hidden></section><p class="shop-free-note">12 trang phục ban đầu và toàn bộ đồ chơi vẫn miễn phí. Bộ này không tăng điểm hoặc lợi thế trên bảng xếp hạng.</p>`;
  root.append(dialog);
  const previewHost = document.createElement("div"); previewHost.className="shop-stage"; previewHost.hidden=true; dialog.querySelector("#pack-outfits")!.before(previewHost);
  let preview3d: ReturnType<(typeof import("../character/renderer3d"))["createToyStage"]>|undefined;
  const $ = <T extends HTMLElement=HTMLElement>(selector:string) => dialog.querySelector<T>(selector)!;
  let cloud: Cloud | undefined = account.cloud || account.publicCloud;
  let selected: Outfit = "dragon", product: CommerceProduct | undefined, order: CommerceOrder | null = null;
  let busy=false,request=0,offset=0,poll:ReturnType<typeof setTimeout> | undefined,previewAnimations:Animation[]=[];
  const clearPreview = () => { previewAnimations.forEach(animation=>animation.cancel());previewAnimations=[]; };
  const drawOutfits = () => {
    clearPreview();
    $("#pack-outfits").innerHTML = premiumOutfits.map(outfit=>{
      const character:Character={...options.getCharacter(),outfit,hat:"none",glasses:"none"}; const image=options.portrait?.(character);
      return `<button class="pack-outfit ${outfit}" data-pack-outfit="${outfit}" aria-pressed="${outfit===selected}"><span class="shop-avatar">${image ? `<img src="${image}" alt=""/>` : renderFigure(character,"normal",`shop-${outfit}`)}</span><span>${outfitLabels[outfit]}</span><small>${canWear(outfit,options.getOwned()) ? "Đã có trong tủ" : "Xem thử"}</small></button>`;
    }).join("");
    preview3d?.character({...options.getCharacter(),outfit:selected,hat:"none",glasses:"none"});
    $<HTMLButtonElement>("#shop-wear").hidden = !canWear(selected,options.getOwned());
    dialog.querySelectorAll<HTMLButtonElement>("[data-pack-outfit]").forEach(button=>button.addEventListener("click",()=>{selected=button.dataset.packOutfit as Outfit;drawOutfits();}));
  };
  const drawAvailability = () => {
    const owned = premiumOutfits.every(outfit=>canWear(outfit,options.getOwned()));
    $("#shop-price").textContent = owned ? "Bộ này đã ở trong tủ bạn." : product ? money(product.price_vnd) : "Bộ này chưa mở bán.";
    $("#shop-availability").textContent = owned ? "Đăng nhập cùng Google để dùng lại trên thiết bị khác." : product ? "Mua một lần cả hai bộ, gắn với tài khoản Google của bạn." : "Bạn vẫn có thể xem thử. Thanh toán sẽ mở sau khi hoàn tất kết nối nhận tiền.";
    const buy=$<HTMLButtonElement>("#shop-buy");
    buy.disabled=!SALES_READY || busy || owned || !product?.active;
    buy.textContent=owned ? "Đã sở hữu" : busy ? "Đang tạo mã…" : !product?.active ? "Chưa mở thanh toán" : account.userId ? "Tạo mã VietQR" : "Đăng nhập để mua bộ này";
  };
  const restore = async () => {
    if (!account.userId || !cloud) return;
    const items=await cloud.ownedItems();
    options.onRestore(items);drawOutfits();drawAvailability();
  };
  let renderedOrder = "";
  const drawOrder = () => {
    const panel=$("#checkout-panel");
    panel.hidden=!order;
    if (!order) { renderedOrder=""; return; }
    const phase=orderPhase(order,Date.now()+offset);
    const left=Math.max(0,Math.ceil((Date.parse(order.expires_at)-Date.now()-offset)/60000));
    const messages={pending:`Mã còn khoảng ${left} phút. Chỉ chuyển đúng số tiền và nội dung dưới đây.`,paid:"Server đã xác nhận thanh toán. Bộ trang phục đã về tài khoản của bạn.",expired:"Mã đã hết hạn, đừng chuyển thêm vào mã này. Nếu đã chuyển trước hạn, kiểm tra lại hoặc liên hệ hỗ trợ.",review:"Giao dịch cần được đối soát. Đừng chuyển thêm tiền. Liên hệ hỗ trợ và gửi mã đơn để kiểm tra.",cancelled:"Đơn này đã đóng. Nếu đã chuyển khoản, liên hệ hỗ trợ để đối soát."};
    const key=order.id+":"+phase;
    if (renderedOrder===key) { panel.querySelector(".order-state")!.textContent=messages[phase];return; }
    renderedOrder=key;
    panel.innerHTML=`<h3>${phase==="paid" ? "Bộ mới đã về tủ" : "Đơn chuyển khoản"}</h3><p class="order-state" data-state="${phase}" role="status">${messages[phase]}</p>${phase==="pending" ? `<img class="checkout-qr" src="${escapeHtml(qrUrl(order))}" alt="Mã VietQR chuyển khoản ${money(order.price_vnd)}" referrerpolicy="no-referrer"/><p class="field-help">Mở app ngân hàng để quét QR. Kiểm tra tên người nhận trước khi xác nhận chuyển.</p>` : ""}<dl class="checkout-details"><dt>Số tiền</dt><dd>${money(order.price_vnd)}</dd><dt>Ngân hàng</dt><dd>${escapeHtml(order.bank_gateway)}</dd><dt>Người nhận</dt><dd>${escapeHtml(order.account_name)}</dd><dt>Số tài khoản</dt><dd>${escapeHtml(order.account_number)}</dd><dt>Nội dung</dt><dd><code>${escapeHtml(order.payment_code)}</code></dd></dl><div class="checkout-actions">${phase==="pending" ? '<button class="secondary-button" id="payment-copy">Chép nội dung chuyển khoản</button>' : ""}<button class="quiet-button" id="payment-check">Kiểm tra lại trạng thái</button></div><p class="field-help">Nút kiểm tra chỉ đọc kết quả server, không tự xác nhận đã trả tiền. Đóng tủ không hủy giao dịch. <a id="payment-support">Liên hệ hỗ trợ</a>.</p>`;
    panel.querySelector(".checkout-qr")?.addEventListener("error",()=>{ $("#shop-status").textContent="Chưa tải được ảnh QR. Bạn có thể dùng đúng thông tin người nhận, số tiền và nội dung ở dưới để chuyển khoản."; });
    const support=$<HTMLAnchorElement>("#payment-support");
    support.href=`mailto:${order.support_email}?subject=${encodeURIComponent(`Đối soát Hẹn 1 chút ${order.payment_code}`)}`;
    $("#payment-check").addEventListener("click",()=>void check(true));
    panel.querySelector("#payment-copy")?.addEventListener("click",async()=>{
      try {await navigator.clipboard.writeText(order!.payment_code);$("#shop-status").textContent="Đã chép đúng nội dung. Không sửa mã khi chuyển khoản nhé.";}
      catch {$("#shop-status").textContent="Chưa chép được. Bạn có thể chọn và chép mã nội dung ở trên.";}
    });
  };
  const schedule = () => {
    clearTimeout(poll);
    if (dialog.open && order?.status==="pending" && orderPhase(order,Date.now()+offset)==="pending" && !document.hidden)
      poll=setTimeout(()=>void check(false),5000);
  };
  const check = async (manual:boolean) => {
    if (!order || !cloud) return;
    const current=request,id=order.id;
    try {
      const next=await cloud.order(id);
      if (!dialog.open || current!==request || order?.id!==id) return;
      if (!next) throw new Error("order_unavailable");
      const justPaid=order.status!=="paid" && next.status==="paid";
      order=next;drawOrder();
      if (next.status==="paid") {await restore();if (justPaid) options.toast("Bộ Bự khác hệ đã về tủ của bạn.");}
      if (manual) $("#shop-status").textContent=next.status==="paid" ? "Đã khôi phục đồ từ tài khoản." : "Đã kiểm tra server. Nếu đã chuyển khoản, đừng chuyển lần nữa trong lúc chờ xác nhận.";
    } catch {if (dialog.open && current===request) $("#shop-status").textContent="Chưa kiểm tra được vì mất kết nối. Nếu đã chuyển, đừng chuyển lần nữa. Thử kiểm tra lại khi có mạng.";}
    finally {schedule();}
  };
  const signIn = () => {
    try {sessionStorage.setItem(REOPEN,"1");} catch {}
    options.onSignIn();
  };
  const open = async () => {
    if (dialog.open) return;
    request++;const current=request;
    drawOutfits();drawAvailability();dialog.showModal();
    void import("../character/renderer3d").then(({createToyStage})=>{
      if (!dialog.open || current!==request) return;
      try {previewHost.hidden=false;preview3d=createToyStage(previewHost,()=>{});preview3d.character({...options.getCharacter(),outfit:selected,hat:"none",glasses:"none"});previewHost.addEventListener("toy-context-lost",()=>{preview3d?.dispose();preview3d=undefined;previewHost.hidden=true;},{once:true});}
      catch {previewHost.hidden=true;}
    }).catch(()=>{previewHost.hidden=true;});
    $("#shop-status").textContent="Đang kiểm tra bộ trang phục…";
    if (!SALES_READY) { $("#shop-status").textContent="Giá đã chốt 10.000đ cho cả hai bộ. Chưa nhận chuyển khoản, bạn cứ xem thử miễn phí."; return; }
    try {
      cloud ||= await account.connectCloud?.();
      if (!cloud) {$("#shop-status").textContent="Bạn đang xem thử trên máy này. Chưa có kết nối thanh toán.";return;}
      const products=await cloud.products();
      if (!dialog.open || current!==request) return;
      product=products.find(item=>item.sku===PACK_SKU);
      if (account.userId) {
        await restore();
        if (!premiumOutfits.every(outfit=>canWear(outfit,options.getOwned()))) {
          const resumed=await cloud.checkout("resume",PACK_SKU);
          if (!dialog.open || current!==request) return;
          order=resumed.order;offset=Date.parse(resumed.server_now)-Date.now();
        }
      }
      drawAvailability();drawOrder();schedule();
      $("#shop-status").textContent="";
    } catch {if (dialog.open && current===request) {drawAvailability();$("#shop-status").textContent="Chưa tải được thông tin mua hàng. Bạn vẫn có thể xem thử, đóng tủ và chơi tiếp.";}}
  };
  $("#shop-buy").addEventListener("click",async()=>{
    if (!account.userId) {signIn();return;}
    if (!SALES_READY || !cloud || busy || !product?.active) return;
    busy=true;drawAvailability();
    const current=request;
    try {
      const created=await cloud.checkout("create",PACK_SKU);
      if (!dialog.open || current!==request) return;
      order=created.order;offset=Date.parse(created.server_now)-Date.now();drawOrder();schedule();
      $("#shop-status").textContent="Mã nhận tiền đã sẵn sàng. Chỉ tạo đơn, chưa có tiền bị trừ.";
      $("#checkout-panel").scrollIntoView({block:"nearest",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
    } catch (error) {if (dialog.open && current===request) $("#shop-status").textContent=checkoutMessage(error);}
    finally {busy=false;drawAvailability();}
  });
  $("#shop-restore").addEventListener("click",async()=>{
    if (!account.userId) {signIn();return;}
    try {await restore();$("#shop-status").textContent=premiumOutfits.some(outfit=>canWear(outfit,options.getOwned())) ? "Đã khôi phục đồ từ tài khoản." : "Tài khoản này chưa có bộ Bự khác hệ. Nếu đã chuyển tiền, kiểm tra trạng thái đơn hoặc liên hệ hỗ trợ.";}
    catch {$("#shop-status").textContent="Chưa khôi phục được. Đồ đã mua vẫn gắn với tài khoản, thử lại khi có mạng nhé.";}
  });
  $("#shop-wear").addEventListener("click",()=>{
    if (!canWear(selected,options.getOwned())) return;
    options.onWear(selected);dialog.close();
  });
  $("#shop-react").addEventListener("click",()=>{
    if (preview3d) {preview3d.hit("boxing");return;}
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {options.toast("Đây là xem thử, phiên ngoài sân vẫn giữ nguyên.");return;}
    clearPreview();
    const preview=dialog.querySelector<HTMLElement>(`[data-pack-outfit="${selected}"] .shop-avatar`)!;
    previewAnimations=animatePuppet(preview,"boxing",1,450);
  });
  $("#shop-close").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",()=>{request++;clearTimeout(poll);clearPreview();preview3d?.dispose();preview3d=undefined;previewHost.hidden=true;});
  document.addEventListener("visibilitychange",()=>{if (document.hidden) {clearTimeout(poll);clearPreview();} else if (dialog.open) void check(false);});
  try {if (sessionStorage.getItem(REOPEN)) {sessionStorage.removeItem(REOPEN);queueMicrotask(()=>void open());}} catch {}
  return {open:()=>void open()};
}

import type { CommerceOrder } from "./catalog";
export function orderPhase(order: CommerceOrder, now = Date.now()): CommerceOrder["status"] {
  if (order.status !== "pending") return order.status;
  return Date.parse(order.expires_at) <= now ? "expired" : "pending";
}
export function qrUrl(order: CommerceOrder): string {
  if (!/^[A-Za-z0-9]{2,32}$/.test(order.bank_code) || !/^\d{6,30}$/.test(order.account_number) || !/^H1C[A-F0-9]{12}$/.test(order.payment_code) || !Number.isSafeInteger(order.price_vnd) || order.price_vnd <= 0) throw new Error("invalid_order");
  const params = new URLSearchParams({acc:order.account_number,bank:order.bank_code,amount:String(order.price_vnd),des:order.payment_code});
  return `https://vietqr.app/img?${params}`;
}
export function checkoutMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  return ({
    already_owned:"Bạn đã có bộ này. Chọn khôi phục đồ để cập nhật tủ nhé.",
    order_rate_limit:"Có nhiều đơn vừa được tạo. Dùng lại mã đang chờ hoặc thử sau một giờ nhé.",
    profile_required:"Hồ sơ chưa hoàn tất. Tải lại trang để đặt nickname trước nhé.",
    checkout_unavailable:"Thanh toán chưa mở. Bạn vẫn có thể xem thử bộ mới và chơi các món miễn phí.",
    merchant_unavailable:"Chưa tạo được mã nhận tiền. Đừng chuyển khoản, thử lại sau nhé.",
    sign_in_required:"Phiên đăng nhập đã hết hạn. Đăng nhập Google lại để tiếp tục.",
  } as Record<string,string>)[code] || "Chưa kết nối được. Nếu đã chuyển khoản, đừng chuyển lần nữa. Chọn kiểm tra lại khi có mạng.";
}

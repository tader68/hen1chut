# Checkout đang chuẩn bị

Quyết định đã chốt: VietQR/chuyển khoản, 10.000đ cho cả Rồng con + Giáp máy, duyệt thủ công trước. Checkout đóng, chưa có thông tin ngân hàng hoặc đơn thanh toán thật. Ưu tiên mới nhất là nâng chất lượng nhân vật/animation.

Migration `20261021024849_commerce_orders.sql` đã được kiểm chứng và áp dụng lên backend để chuẩn bị catalog, đơn và ownership. Row sản phẩm 29.000đ của bản đề xuất cũ đang ẩn, inactive, không phải giá mở bán được duyệt. Frontend commerce còn là WIP.

`20261021073008_commerce_manual_review.sql` là draft chưa test/chưa áp dụng. Tên do Supabase CLI tạo, được giữ ở đây để không lẫn với migration đã sẵn sàng. Draft đổi giá về 10.000đ và thêm claim/duyệt thủ công. Cần kiểm chứng RLS, quyền operator, receipt trùng, giao dịch lệch/đến muộn và việc cấp entitlement nguyên tử trước khi đưa trở lại `supabase/migrations/`.

Chưa cấp quyền operator, mở tài khoản thanh toán, liên kết ngân hàng hoặc bật billing. SePay không phải luồng đã chọn cho bản đầu. Không dùng draft hoặc mẫu 3D làm bằng chứng đã có checkout/doanh thu.

# Checkout đang chuẩn bị

Chủ dự án đã chọn VietQR/chuyển khoản. Ưu tiên hiện tại là animation và guest entry, theo yêu cầu mới nhất.

`20261021024849_commerce_orders.sql` được CLI tạo tên rồi chuyển vào thư mục draft để tránh bị áp dụng khi deploy migration. Chưa test, chưa áp dụng lên Supabase. Giá 29.000đ và hai trang phục trong draft là đề xuất, chưa phải sản phẩm đã mở bán hoặc giá được chủ dự án duyệt. Chưa có trang phục, checkout UI hoặc webhook tương ứng hoạt động.

SePay đã được nghiên cứu từ tài liệu chính thức, chưa mở tài khoản, liên kết ngân hàng hoặc bật billing. Gói Free 50 giao dịch/tháng có tính phí vượt mức, cần chủ dự án cân nhắc trước khi dùng live: https://sepay.vn/bang-gia.html.

Khi quay lại phần này: hoàn thiện bộ trang phục để xem, chốt giá, test DDL/RLS/idempotency và webhook HMAC, sau đó mới đưa migration đã kiểm chứng về `supabase/migrations/`. Không dùng draft này làm bằng chứng đã có checkout hoặc doanh thu.

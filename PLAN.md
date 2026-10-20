# Kế hoạch hoàn thiện Hẹn 1 chút

Yêu cầu và tiêu chí bằng chứng hiện hành nằm ở `PRODUCT.md`. File này thay kế hoạch MVP cũ, vốn chưa có tài khoản và backend.

## Đã triển khai trong code

- Nâng cấp Cục bực, 12 đồ chơi, 12 trang phục, phụ kiện và tủ đồ xem trước.
- Giữ phiên chưa kết thúc, biểu cảm, dấu tác động, lựa chọn đồ chơi và bối cảnh qua reload.
- Onboarding nickname/tên nhân vật, Google PKCE, private sync và xử lý xung đột thiết bị, nhập phiên guest vào tài khoản mới.
- Vòng global 30 giây, server kiểm soát thời gian/giới hạn lượt/sequence, bảng thật all-time và 7 ngày.
- Gợi ý ngày, bài thở, bưu thiếp PNG, link ngoại hình riêng tư, trang hướng dẫn/quyền riêng tư/giới thiệu/404 và metadata.
- Supabase Free online tại Singapore, RLS trên 6 bảng, 2 migration đã áp dụng. API leaderboard thật trả bảng trống, không seed điểm giả.

## Đang hoàn tất

1. Bật Google provider trong Supabase, URL allowlist, Google audience phù hợp public. OAuth client đã tạo trên project Google cá nhân riêng, chưa liên kết billing.
2. Kiểm chứng login thật, nickname, nhập phiên guest, sync, logout/login, vòng global trên production. Kiểm tra bằng hai tài khoản thật cần chủ tài khoản tham gia khi xác thực.
3. Kiểm tra responsive, reduced motion, contrast và lỗi trình duyệt. Build/tests hiện qua, browser 144 tổ hợp qua. Chưa đo Lighthouse/FPS hoặc kiểm tra điện thoại thật.
4. Cập nhật GitHub Pages và kiểm tra đúng commit đã publish.

## Sau khi flow tài khoản hoạt động

- Tài khoản publisher và approval quảng cáo, đặt vị trí không che sân chơi. Không chèn publisher ID giả.
- Chọn nhà cung cấp thanh toán có thể nhận tiền cho chủ dự án, cấu hình checkout, webhook đã xác minh và restore entitlement. Secret chỉ ở backend.
- Đóng gói bộ cosmetics có nội dung/giá rõ và kiểm chứng sandbox rồi live. Không khóa các món đã cho thử chỉ bằng flag client.
- Chuẩn bị nội dung phân phối và measurement phù hợp. Chỉ đăng/gửi ra cộng đồng khi chủ dự án cho phép đúng kênh.
- Thu feedback, đo dữ liệu thật trước khi kết luận người dùng thích, tăng traffic hay có doanh thu.

Không đánh dấu mục tiêu toàn sản phẩm hoàn tất khi đăng nhập, kiếm tiền hoặc bằng chứng sử dụng thực còn thiếu. Không nâng gói hoặc bật billing ngoài yêu cầu.

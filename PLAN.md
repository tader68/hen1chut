# Kế hoạch hoàn thiện Hẹn 1 chút

Yêu cầu và tiêu chí bằng chứng hiện hành nằm ở `PRODUCT.md`. File này thay kế hoạch MVP cũ, vốn chưa có tài khoản và backend.

## Đã triển khai trong code

- 5 bối cảnh, gồm Công sở và Sân bóng mới, tương tác giấy/bóng và lưu lựa chọn trong phiên.
- Nâng cấp Cục bực, 12 đồ chơi, 12 trang phục, phụ kiện và tủ đồ xem trước.
- Giữ phiên chưa kết thúc, biểu cảm, dấu tác động, lựa chọn đồ chơi và bối cảnh qua reload.
- Guest vào chơi ngay, Google PKCE khi muốn lưu/thi đấu. Nhập phiên guest có lựa chọn khi tài khoản đã có dữ liệu, private sync và xử lý xung đột thiết bị.
- Nhân vật có nhiều khớp animation, chuyển tiếp từ tư thế đang chạy. 6 phản ứng khám phá miễn phí được giữ trong tiến trình.
- Vòng global 30 giây, server kiểm soát thời gian/giới hạn lượt/sequence, bảng thật all-time và 7 ngày.
- Gợi ý ngày, bài thở, bưu thiếp PNG, link ngoại hình riêng tư, trang hướng dẫn/quyền riêng tư/giới thiệu/404 và metadata.
- Supabase Free online tại Singapore, RLS trên 6 bảng, 3 migration đã áp dụng. API leaderboard thật có vòng QA 3 lượt của chủ dự án, không seed điểm giả.
- Startup HTML có trạng thái tải và đường phục hồi khi chờ lâu, mô tả search đúng luồng Google. Font WOFF2 giảm 69,6% tổng dung lượng 5 font, giữ nguyên glyph.

## Đang hoàn tất

1. Google provider đã bật, Site URL và allowlist đã lưu, Google audience đã chuyển Production. Chủ tài khoản đã hoàn tất consent, login thật đã kiểm chứng. Không liên kết billing.
2. Login, nickname, sync, logout/login và vòng global của chủ dự án đã qua trên production. Guest → Google → chọn giữ phiên tài khoản đã kiểm tra thật trên preview. Nhánh chọn nhập guest vào tài khoản và hai tài khoản/thiết bị thật vẫn cần kiểm chứng riêng.
3. Kiểm tra responsive, reduced motion, contrast và lỗi trình duyệt. Build/tests hiện qua, browser 144 tổ hợp trước đây và 96 tổ hợp hai cảnh mới qua. Chưa đo Lighthouse/FPS hoặc kiểm tra điện thoại thật.
4. Cập nhật GitHub Pages và kiểm tra đúng commit đã publish.

## Sau khi flow tài khoản hoạt động

- Tài khoản publisher và approval quảng cáo, đặt vị trí không che sân chơi. Không chèn publisher ID giả.
- Đã chọn VietQR/chuyển khoản. Nghiên cứu SePay, chưa đăng ký/liên kết ngân hàng. Draft checkout nằm ngoài thư mục migration, chưa test hoặc áp dụng. Sau animation/guest entry sẽ hoàn thiện sản phẩm/giá, checkout, webhook đã xác minh và restore entitlement. Secret chỉ ở backend.
- Đóng gói bộ cosmetics có nội dung/giá rõ và kiểm chứng sandbox rồi live. Không khóa các món đã cho thử chỉ bằng flag client.
- Chuẩn bị nội dung phân phối và measurement phù hợp. Chỉ đăng/gửi ra cộng đồng khi chủ dự án cho phép đúng kênh.
- Thu feedback, đo dữ liệu thật trước khi kết luận người dùng thích, tăng traffic hay có doanh thu.

Không đánh dấu mục tiêu toàn sản phẩm hoàn tất khi đăng nhập, kiếm tiền hoặc bằng chứng sử dụng thực còn thiếu. Không nâng gói hoặc bật billing ngoài yêu cầu.

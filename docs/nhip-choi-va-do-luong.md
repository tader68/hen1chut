# Nhịp chơi và động lực quay lại

Quyết định của chủ dự án ngày 21/10/2026: cho chơi ngay, Google khi cần đồng bộ hoặc thi đấu. Ưu tiên animation và trải nghiệm trước checkout. Luồng thanh toán sau đó dùng VietQR/chuyển khoản cho người chơi Việt Nam.

## Nguồn nghiên cứu và giới hạn

- [Ryan, Rigby & Przybylski, 2006](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf): cảm nhận tự chủ và năng lực có liên hệ với sự thích thú khi chơi. Đây không phải bằng chứng rằng đăng nhập tùy chọn chắc chắn tăng retention của Hẹn 1 chút.
- [Hicks và cộng sự, CHI PLAY 2019](https://doi.org/10.1145/3311350.3347171): hiệu ứng bổ sung tăng hấp dẫn thị giác trong các game được nghiên cứu, ảnh hưởng đến cảm nhận năng lực tùy hoàn cảnh.
- [Kao và cộng sự, CHI 2024](https://doi.org/10.1145/3613904.3642656): tò mò có liên hệ với thời gian chơi tự nguyện. Khuếch đại phản hồi đơn thuần không bảo đảm kết quả tốt, nhất là khi che mối liên hệ giữa hành động và kết quả. Không suy thành lời hứa gây nghiện hoặc tăng thời gian chơi cho sản phẩm này.

## Đã áp dụng trong code

- Người mới chạm được nhân vật trước form. SDK tài khoản chỉ tải khi cần đăng nhập/xem ranking. Tài khoản đã lưu vẫn được xác thực trước khi khôi phục. Dấu hiệu có token chỉ dùng để chọn luồng tải, không dùng để cấp quyền.
- Đầu, thân, tay, chỏm tóc và miệng chuyển động riêng. Phản ứng đang chạy nối sang cú mới từ tư thế hiện tại, có bóng dưới chân và vật liệu particles khác nhau. Reduced motion bỏ chuyển động lớn.
- “Sổ của Bự” có 6 phản ứng theo công thức đồ chơi, nhân vật và bối cảnh. Có gợi ý, ghi nhận một lần và giữ qua ngày khác. Hoàn tất 6 chuyện là một điểm dừng rõ, không cần mua hoặc giữ streak.
- Các phiên, dấu tác động và ngoại hình tiếp tục được giữ. Sau Google login, người có cả phiên guest lẫn phiên tài khoản tự chọn phiên muốn giữ. Không tự ghi đè tài khoản bằng phiên guest.

## Giả thuyết cần đo bằng người chơi thật

| Giả thuyết | Tín hiệu cần xem |
| --- | --- |
| Vào chơi ngay giúp người mới thử được game | Tỷ lệ có cú chạm đầu, thời gian tới cú chạm đầu |
| Phản hồi có quan hệ rõ với thao tác làm game vui hơn | Đánh giá sau chơi, lỗi input, tỷ lệ thử thêm đồ chơi |
| Công thức khám phá tạo lý do chơi tiếp | Số món đã thử, số chuyện đã gặp, tỷ lệ mở sổ |
| Người chơi muốn mang phiên theo tài khoản | Tỷ lệ chủ động chọn Google và hoàn tất quay lại game |
| Người chơi thích quay lại | D1/D7, phản hồi tự nguyện và thời gian chơi khi tab có focus |

Hiện chưa có analytics funnel hoặc dữ liệu đủ để kết luận các giả thuyết đúng. Không dùng thời gian tab mở làm thời gian chơi, không dùng lượt QA của chủ dự án làm bằng chứng retention. Cần xem mức hài lòng cùng thời gian chơi, không chỉ tối đa hóa một chỉ số.

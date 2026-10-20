# Hẹn 1 chút

## Purpose and audience

Trò chơi hoạt hình tiếng Việt cho người muốn giải trí nhanh trên web/mobile. Người chơi đặt tên nhân vật muốn đấm, chọn đồ chơi, thay ngoại hình, giữ phiên chưa khép và có thể gửi bưu thiếp cho bạn bè. Không suy bối cảnh Be/Product từ nghề nghiệp chủ dự án.

## Platform

web

## Decisions from the owner

- Thương hiệu: `hẹn1chút.`. Dòng cạnh logo: `Một chút cho mình (ra đây nói chuyện 1 chút...)`.
- Kiếm tiền bằng quảng cáo và bán bộ nhân vật/trang phục/phụ kiện. Không chọn hướng ủng hộ tự nguyện.
- Luồng đầu: Google login, nickname, tên nhân vật muốn đấm. Không làm textbox Gmail giả thay cho xác thực.
- Bảng xếp hạng global có dữ liệu server thật. Không seed người chơi/điểm giả trên production.
- Database phải dùng gói Free, chưa có quyền nâng cấp hoặc bật billing.
- Phiên chưa kết thúc phải giữ số lượt, biểu cảm, các vết tác động, trang phục và lựa chọn đang dùng qua reload/quay lại.
- Mở rộng đồ chơi, có găng đấm/nắm đấm và nhiều món khác. Có nhiều trang phục, phụ kiện. Cục bực cần nhận diện riêng.

## Implementation choices

- Giữ static frontend GitHub Pages đang public. Supabase Free cung cấp Google Auth và PostgreSQL.
- Nickname, ngoại hình công khai ở leaderboard. Email thuộc Auth, tên nhân vật và phiên thuộc dữ liệu riêng có RLS.
- Vòng global 30 giây độc lập với bộ đếm tự do. Điểm do RPC nhận lượt với giới hạn 8 lượt/giây server, sequence chống replay, không có API nhận `score` từ client. Cơ chế không chứng minh người thật hoặc ngăn toàn bộ auto-click.
- Tất cả đồ hiện có cho thử miễn phí. Đồ trả phí tương lai cần entitlement do webhook thanh toán đã xác minh cấp, không mở khóa bằng flag client.
- Bản chưa cấu hình backend có thể trải nghiệm local, nhập nickname và tên nhân vật. Không gọi đây là Google login/global ranking đã hoạt động.

## Ý tưởng đang trao đổi

Chủ dự án hỏi thêm soundboard meme bằng đoạn giọng thật từ video, như “10 điểm” và “đúng đúng đúng”. Đã giải thích có thể phát clip gốc khi tương tác, cần nguồn/quyền phù hợp cho bản kiếm tiền. Chưa chốt clip hoặc triển khai thư viện âm thanh có bản quyền.

## Requirement evidence to finish

| Requirement               | Required evidence                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Public sản phẩm mới       | CI pass, mở URL public và chơi phiên mới trên đúng commit                                                  |
| Google login              | OAuth thật ở production, nickname/target saved, logout/login lại, kiểm tra hai tài khoản                   |
| Database Free             | Project online xác nhận gói Free, migration applied, API keys public only, live reads/writes               |
| Global ranking            | Hai tài khoản hoàn thành vòng thật, scoreboard chỉ hiện dữ liệu công khai, điểm không chỉnh trực tiếp được |
| Giữ phiên                 | Browser reload trước khi sync và khi đã sync vẫn giữ impacts; kết thúc/mở phiên mới mới xóa                |
| Đồ chơi / tủ đồ           | Render các lựa chọn, dùng trên desktop/mobile, không lỗi console                                           |
| Chia sẻ                   | PNG đúng avatar, riêng tư mặc định, link nhận preset có opt-in                                             |
| Quảng cáo                 | Publisher hợp lệ, placement/consent đúng provider, kiểm tra live sau approval                              |
| Bán cosmetics             | Checkout thật hoặc sandbox provider, signed webhook, entitlement chỉ tới đúng tài khoản, restore purchases |
| Thu hút và giữ người dùng | Phân phối được chủ dự án cho phép, measurement có dữ liệu thật, feedback từ người chơi thật                |
| Performance/a11y          | Đo kiểm phù hợp production/mobile, không dùng unit tests thay cho bằng chứng FPS/device                    |

Chưa được đánh dấu hoàn tất objective khi Google/backend, quảng cáo/thanh toán hoặc bằng chứng trải nghiệm thật còn thiếu. Không biến số tính năng hay tests pass thành bằng chứng đã có doanh thu hoặc người dùng thích.

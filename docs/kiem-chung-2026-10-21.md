# Kiểm chứng bản nâng cấp ngày 21/10/2026

## Đã có bằng chứng

- Public frontend commit `b55e7ab`: workflow GitHub Pages thành công, trang chính, hướng dẫn, quyền riêng tư và điều khoản trả HTTP 200. Browser hiện onboarding mới và mở đúng Google OAuth client.
- Supabase project `kxzwotzmxlulmwhwljwt` gói Free trong organization cá nhân hiện có, Singapore. 6 bảng bật RLS, 3 migration áp dụng thành công. Không tạo người chơi hoặc điểm giả trên production.
- Google provider bật, email/password và anonymous sign-in tắt. Site URL và 3 redirect URL giới hạn đúng production/local. Google audience chuyển Production theo xác nhận của chủ tài khoản. Màn hình consent chỉ hỏi tên/ảnh hồ sơ và email.
- Browser bản build chạy 144 tổ hợp 4 nhân vật × 12 đồ chơi × 3 bối cảnh, ghi nhận đúng 144 lượt, không console error. Reload giữ số lượt, dấu pháo giấy, hoodie, mũ len, kính tròn. Chơi tiếp không reset. Mở phiên mới xóa dấu và đưa số lượt về 0, giữ ngoại hình.
- Khung browser 320px và 375px: đã phát hiện và sửa thanh đồ chơi xếp dọc che sân chơi. Kiểm tra lại bằng ảnh cho thấy hàng ngang có thể vuốt, sân chơi hiện đầy đủ trong khung. Đây không phải thiết bị điện thoại thật.
- Bưu thiếp PNG đã tải được từ browser. Mặc định không kèm tên riêng.
- Build TypeScript/Vite qua, 42 tests qua trên 10 files. Bộ SQL tests thực thi cả 3 migration trên PostgreSQL WASM, kiểm tra RLS hai tài khoản, anonymous bị chặn ghi, CAS, sequence, deadline, giới hạn điểm và quyền entitlement. Tests chia sẻ kiểm tra giữ mũ/kính và lời mời qua Google redirect.
- API sau migration mới: leaderboard HTTP 200, schema nội bộ HTTP 406, anonymous ghi hồ sơ HTTP 401. Advisor không còn WARN về hàm đặc quyền công khai. Hai INFO default-deny bảng điểm có giải thích ở tài liệu kết nối.

## Chưa được coi là hoàn thành

- Consent tài khoản Google cá nhân đang chờ chủ tài khoản hoàn tất. Chưa chứng minh login quay lại game, lưu nickname và tên riêng bằng tài khoản thật, sync hai thiết bị, logout/login hoặc vòng global thật của hai tài khoản.
- Việc helper giữ lời mời qua OAuth đã được kiểm tra bằng tests, chưa có bằng chứng end-to-end qua consent thật.
- Chưa tích hợp publisher quảng cáo, checkout, webhook thanh toán hoặc có doanh thu. Chưa có số liệu người dùng thích/truy cập/giữ chân.
- Chưa đo Lighthouse/FPS hoặc kiểm tra Safari/iOS/Android thật. Không dùng test unit thay cho các phép đo đó.

Các thay đổi sau commit public nêu trên chỉ được coi đã publish khi workflow của commit mới thành công.

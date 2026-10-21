# Kiểm chứng bản nâng cấp ngày 21/10/2026

## Đã có bằng chứng

- Public frontend commit `687f2ce`: workflow GitHub Pages thành công, trang chính, hướng dẫn, quyền riêng tư và điều khoản trả HTTP 200. Browser hiện onboarding mới và mở đúng Google OAuth client.
- Supabase project `kxzwotzmxlulmwhwljwt` gói Free trong organization cá nhân hiện có, Singapore. 6 bảng bật RLS, 3 migration áp dụng thành công. Không tạo người chơi hoặc điểm giả trên production.
- Google provider bật, email/password và anonymous sign-in tắt. Site URL và 3 redirect URL giới hạn đúng production/local. Google audience chuyển Production theo xác nhận của chủ tài khoản. Màn hình consent chỉ hỏi tên/ảnh hồ sơ và email.
- Browser bản build chạy 144 tổ hợp 4 nhân vật × 12 đồ chơi × 3 bối cảnh, ghi nhận đúng 144 lượt, không console error. Reload giữ số lượt, dấu pháo giấy, hoodie, mũ len, kính tròn. Chơi tiếp không reset. Mở phiên mới xóa dấu và đưa số lượt về 0, giữ ngoại hình.
- Khung browser 320px và 375px: đã phát hiện và sửa thanh đồ chơi xếp dọc che sân chơi. Kiểm tra lại bằng ảnh cho thấy hàng ngang có thể vuốt, sân chơi hiện đầy đủ trong khung. Đây không phải thiết bị điện thoại thật.
- Bưu thiếp PNG đã tải được từ browser. Mặc định không kèm tên riêng.
- Chủ tài khoản hoàn tất consent Google. Browser public quay về game với nickname `Đạt đuối`, reload giữ phiên 4 lượt. Chơi thêm 3 lượt cà chua, chờ đồng bộ rồi logout/login lại vẫn giữ 7 lượt và 7 dấu cà chua. SQL read-only xác nhận revision 5, saved_hits 7 và saved_marks 7. Không ghi tên riêng vào báo cáo.
- Tải lại ngay sau một lượt găng đấm, trước debounce đồng bộ 1,8 giây: browser khôi phục đúng 8 lượt, 7 dấu cà chua và 1 dấu găng đấm. Console không ghi error trong lượt QA này. Phiên chưa bị kết thúc/reset.
- Vòng ranking thật 30 giây bằng tài khoản chủ dự án: 3 thao tác qua UI, server chốt 3 lượt, hiện trên bảng tổng và 7 ngày. SQL read-only xác nhận round_finished true, ranked_hits 3, best_score 3. Đây là vòng QA của chủ dự án, không phải bằng chứng traffic hoặc người chơi độc lập. Ảnh bằng chứng: `/Users/dat.ta/Downloads/app/hen1chut-ranking-verified.png` (nằm ngoài repository).
- Build TypeScript/Vite qua, 42 tests qua trên 10 files. Bộ SQL tests thực thi cả 3 migration trên PostgreSQL WASM, kiểm tra RLS hai tài khoản, anonymous bị chặn ghi, CAS, sequence, deadline, giới hạn điểm và quyền entitlement. Tests chia sẻ kiểm tra giữ mũ/kính và lời mời qua Google redirect.
- API sau migration mới: leaderboard HTTP 200, schema nội bộ HTTP 406, anonymous ghi hồ sơ HTTP 401. Advisor không còn WARN về hàm đặc quyền công khai. Hai INFO default-deny bảng điểm có giải thích ở tài liệu kết nối.

## Chưa được coi là hoàn thành

- Chưa kiểm tra sync bằng hai thiết bị hoặc vòng global của hai tài khoản thật. Kiểm tra RLS hai tài khoản hiện là SQL tests local, không thay cho kiểm tra production hai người chơi.
- Việc helper giữ lời mời qua OAuth đã được kiểm tra bằng tests, chưa có bằng chứng end-to-end qua consent thật.
- Chưa tích hợp publisher quảng cáo, checkout, webhook thanh toán hoặc có doanh thu. Chưa có số liệu người dùng thích/truy cập/giữ chân.
- Chưa đo Lighthouse/FPS hoặc kiểm tra Safari/iOS/Android thật. Không dùng test unit thay cho các phép đo đó.

Các thay đổi sau commit public nêu trên chỉ được coi đã publish khi workflow của commit mới thành công.

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
- Startup mới kiểm tra bằng preview build: HTML hiện trạng thái tải trước khi app mount, app mở thành công thì bỏ màn chờ và không có console error. Fixture local cố ý làm module không tải được cho thấy sau 8 giây hiện lời nhắc/nút tải lại ở khung 320px và 375px. Đây là kiểm tra lỗi tải module trong fixture, chưa phải đo mạng 3G/Lighthouse hay điện thoại thật. Fixture chỉ nằm trong dist lúc QA, không deploy.
- 5 font WOFF2 tổng 188.156 bytes so với TTF 618.188 bytes, giảm 69,6%. Script fontTools đối chiếu toàn bộ cmap, metric và tọa độ glyph đều bằng nhau. TTF cũ vẫn tồn tại cho stylesheet đã cache. Không suy số này thành mức giảm thời gian tải trang hoặc FPS.

## Nâng cấp guest, chuyển động và bối cảnh

- 52 tests qua trên 14 files. Các tests mới kiểm tra chọn luồng khôi phục tài khoản, marker nhập guest một lần, keyframe chuyển động, 6 phản ứng và lưu khám phá qua ngày. Build TypeScript/Vite qua.
- Preview cho người chưa có tài khoản mở thẳng sân chơi, không có form hoặc yêu cầu Google. Mở bảng xếp hạng đọc được nickname/điểm thật, nút đăng nhập chỉ dành cho thi đấu.
- Guest → Google bằng tài khoản chủ dự án → màn chọn phiên đã chạy qua OAuth thật tại `127.0.0.1:4173`. Chọn dùng phiên tài khoản giữ đúng số lượt hiện tại của tài khoản, không ghi đè bằng 11 lượt guest. Tại thời điểm kiểm tra này cả browser production và SQL read-only đều có phiên tài khoản 0 lượt, revision 10, khác phiên 8 lượt ở lượt QA trước. Không khôi phục dữ liệu cũ đè lên phiên hiện hành.
- Sáu phản ứng khám phá đã thử qua UI trên guest preview, sổ đạt 6/6 và vẫn giữ 6/6 sau reload. Đây là lượt kiểm tra, không phải người chơi độc lập.
- Công sở và Sân bóng chạy 96 tổ hợp 4 nhân vật × 12 đồ chơi × 2 cảnh. Thêm 8 thao tác lặp trước khi sửa danh sách selector của script QA, tổng bộ đếm guest từ 3 lên 107. Console không có error, reload giữ 107 và cảnh Sân bóng. Không ghi các lượt này vào bảng production.
- Khung browser 320px và 375px hiển thị đầy đủ sân chơi và hàng bối cảnh có vuốt ngang, xem được Công sở/Sân bóng. Không phải kiểm tra trên điện thoại thật.
- Chưa kiểm tra end-to-end nhánh chọn nhập guest vào tài khoản đã có phiên. Nhánh chọn giữ phiên tài khoản đã qua. Không suy kết quả nhánh này thành chứng minh cả hai lựa chọn.

## Chưa được coi là hoàn thành

- Chưa kiểm tra sync bằng hai thiết bị hoặc vòng global của hai tài khoản thật. Kiểm tra RLS hai tài khoản hiện là SQL tests local, không thay cho kiểm tra production hai người chơi.
- Việc helper giữ lời mời qua OAuth đã được kiểm tra bằng tests, chưa có bằng chứng end-to-end qua consent thật.
- Chưa tích hợp publisher quảng cáo, checkout, webhook thanh toán hoặc có doanh thu. Chưa có số liệu người dùng thích/truy cập/giữ chân.
- Chưa đo Lighthouse/FPS hoặc kiểm tra Safari/iOS/Android thật. Không dùng test unit thay cho các phép đo đó.

Các thay đổi sau commit public nêu trên chỉ được coi đã publish khi workflow của commit mới thành công.

## Bản 3D và mẫu công sở

- Chủ dự án chọn 3D đồ chơi mềm, yêu cầu nâng cả dàn nhân vật và có sếp/Biz/đồng nghiệp, không chỉ hai bộ bán thêm. Code đưa renderer vào màn chơi chính cho cả 4 loại. Sáu mẫu chọn nhanh là tổ hợp từ các loại/đồ miễn phí, không phải sáu model độc lập.
- Build TypeScript/Vite qua, 74 tests trên 18 files qua, Deno check cả hai Edge Functions qua. Giới hạn Vitest hai workers để tránh tranh CPU khi mở nhiều scene WebGL. Một lần chạy bản tách dùng mặc định nhiều workers đã timeout test config, chạy hai workers hết timeout và được đưa vào script chuẩn.
- Guest riêng trên `127.0.0.1:4174`: 96 lượt qua UI, tương ứng 4 loại × 12 đồ chơi × 2 cảnh Công sở/Sân bóng. Reload giữ 96, ngoại hình và dấu tác động. Có ảnh xác nhận dấu 3D vẫn nằm trên mặt và mood được khôi phục. Không đưa các lượt này lên bảng điểm production.
- Thử 48 lựa chọn quần áo (12 đồ miễn phí trên 4 loại), tám lựa chọn đầu, năm lựa chọn kính và ba dáng qua UI. Thay đồ không tăng hoặc reset bộ đếm 96. Chuyển 3D → 2D → 3D cũng giữ 96.
- Chọn “Chơi tiếp” trong hộp kết thúc giữ 96. Chỉ chọn mở phiên QA mới mới về 0 và xóa dấu, giữ ngoại hình. Các thao tác này là guest QA riêng, không reset phiên Google của chủ dự án.
- Tủ đồ dùng ảnh render 3D, bưu thiếp xuất được PNG với nhân vật Chị Biz, tên riêng mặc định tắt. File QA ngoài Git: `/Users/dat.ta/Downloads/72eed767-c94e-45c6-a373-e49705fb0ab3.png`. Đã bỏ bóng ellipse cũ khi ảnh đã có bóng 3D để tránh bóng đôi.
- Fixture browser có hai iframe rộng 375px và 320px, cao 640px. Đo DOM trong fixture cho thấy chiều rộng nội dung/scroll là 360/360 và 305/305 (15px dành cho scrollbar của iframe). Không tràn ngang toàn trang, danh sách vai trò/bối cảnh/đồ chơi vẫn có scroll riêng. Ảnh QA ngoài Git: `/Users/dat.ta/Downloads/app/hen1chut-3d-mobile.png`. Không gọi đây là đo trên điện thoại thật hoặc bằng chứng FPS.
- Catalog/checkout vẫn đóng. UI có hard gate `SALES_READY=false` cho đến khi luồng duyệt tay được kiểm chứng. Giá đã chốt 10.000đ/cả hai được ghi rõ, chưa nhận chuyển khoản. Không dùng nút xem thử để cấp entitlement.
- Nghiên cứu sơ cấp, giới hạn và các giả thuyết áp dụng ở `docs/suc-hut-nhan-vat.md`. Chưa có dữ liệu người chơi độc lập về độ thích, mua hàng hay khả năng quay lại.

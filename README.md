# Hẹn 1 chút

Game hoạt hình tiếng Việt tại https://tader68.github.io/hen1chut/. Vite + TypeScript, SVG nhân vật, Canvas particles và Web Audio. Supabase Free cung cấp tài khoản, đồng bộ riêng tư và bảng xếp hạng.

## Chạy và kiểm tra

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Chưa cấu hình backend vẫn chơi được trên máy. Copy `.env.example` sang `.env.local` và điền Project URL, publishable key để kết nối. Không đưa `service_role`, `sb_secret_...` hoặc Google Client secret vào frontend.

## Trải nghiệm hiện có

- 4 nhân vật, Cục bực có tạo hình riêng, 12 trang phục, 8 lựa chọn mũ và 5 lựa chọn kính, 3 dáng, 6 màu.
- 12 đồ chơi với art, chuyển động, particles và âm thanh riêng. Phím 1–6 chọn sáu món đầu, Enter/Space dùng món đang chọn khi focus nhân vật.
- 3 bối cảnh: phòng chill, vườn mưa, vũ trụ.
- Phiên chưa kết thúc giữ số lượt, biểu cảm và tối đa 18 dấu tác động gần nhất, cùng nhân vật và bối cảnh. Reload không xóa phiên. Nút kết thúc yêu cầu chọn rõ mở phiên mới.
- Tủ đồ xem trước, bài thở 8 giây, gợi ý hằng ngày và bưu thiếp PNG. Link chia sẻ ngoại hình không chứa tên nhân vật và được giữ qua redirect Google. Bưu thiếp mặc định ẩn tên riêng.
- Khi Google provider sẵn sàng, onboarding yêu cầu Google rồi tạo nickname và tên nhân vật. Đăng nhập lần đầu có thể nhập phiên trên máy. Khi provider chưa bật hoặc không tải được cấu hình, chơi local vẫn hoạt động.
- Bảng điểm đọc từ server. Thi đấu cần tài khoản, vòng 30 giây, giới hạn server 8 lượt/giây và sequence chống gửi lại. Đây không phải cơ chế ngăn mọi bot.

## Database và public

Project Supabase `hen1chut` đã tạo trong organization cá nhân hiện có, vùng Singapore, gói Free. Ba migration trong `supabase/migrations/` đã áp dụng online. Sáu bảng đều bật RLS, dữ liệu riêng chỉ tài khoản sở hữu đọc được. Bảng công khai chỉ trả nickname, ngoại hình và điểm qua RPC giới hạn kết quả.

Xem `docs/ket-noi-supabase-free.md` để nối Google OAuth và cấu hình build. Workflow `.github/workflows/deploy.yml` test, build và deploy GitHub Pages khi push `main`. Hai Actions Variables là `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`, đều là cấu hình public.

Quảng cáo và bán cosmetics là hướng kiếm tiền đã chọn, hiện chưa có quảng cáo/checkout hoạt động. Không dùng điểm hoặc unlock giả để mô phỏng thanh toán thành công. Bảng `entitlements` chỉ cho tài khoản đọc quyền của mình, frontend không được tự cấp.

## Bằng chứng kiểm tra

Ngày 21/10/2026, 42 tests qua trên 10 files, gồm thực thi migration bằng PostgreSQL WASM, RLS giữa hai tài khoản, từ chối ghi điểm/entitlement trực tiếp, revision conflict và vòng thi đấu server. Browser bản build: 144 tổ hợp 4 nhân vật × 12 đồ chơi × 3 bối cảnh ghi đúng 144 lượt, không console error. Reload giữ 144 lượt, hoodie, mũ len, kính tròn và dấu pháo giấy. Chọn chơi tiếp giữ phiên, mở phiên mới đưa về 0 và xóa dấu, vẫn giữ trang phục. PNG bưu thiếp đã tải được. Đã xem lại bằng khung trình duyệt 320px và 375px, sửa thanh đồ chơi xếp dọc che sân chơi thành hàng ngang có vuốt.

Google OAuth thật, đồng bộ hai thiết bị, thanh toán/quảng cáo live, Lighthouse/FPS và thiết bị iOS/Android thật vẫn cần kiểm chứng riêng. Tests local không thay thế các bằng chứng này. Bản code mới chỉ là bản public sau khi workflow deploy của commit tương ứng thành công.

# Hẹn 1 chút

Game hoạt hình tiếng Việt tại https://tader68.github.io/hen1chut/. Vite + TypeScript, nhân vật Three.js 3D với SVG fallback, Canvas particles và Web Audio. Supabase Free cung cấp tài khoản, đồng bộ riêng tư và bảng xếp hạng.

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
- Cả 4 loại có model 3D trên màn chơi chính. Sáu mẫu chọn nhanh: Sếp, Chị Biz, Bạn Sales, Đồng nghiệp, Mèo ú và Bự. Bốn mẫu công sở là tổ hợp từ các loại người, trang phục và phụ kiện miễn phí, vẫn sửa được tên/ngoại hình. Không gọi chúng là sáu bộ model độc lập.
- Cả 12 trang phục miễn phí, mũ, kính, dáng và 12 đồ chơi có hình khối 3D. Tủ đồ, chân dung và bưu thiếp dùng tạo hình 3D khi WebGL hoạt động. Khi tải 3D lỗi/mất context vẫn chơi bằng SVG, có nút chuyển bản nhẹ. `?atelier` chỉ là phòng thử thêm, không phải nơi duy nhất có đồ họa mới.
- 12 đồ chơi với art, chuyển động, particles và âm thanh riêng. Phím 1–6 chọn sáu món đầu, Enter/Space dùng món đang chọn khi focus nhân vật.
- 5 bối cảnh: phòng chill, vườn mưa, vũ trụ, công sở và sân bóng. Công sở có giấy rung khi tác động, sân bóng có bóng nảy khi dùng cú đá.
- Phiên chưa kết thúc giữ số lượt, biểu cảm và tối đa 18 dấu tác động gần nhất, cùng nhân vật và bối cảnh. Reload không xóa phiên. Nút kết thúc yêu cầu chọn rõ mở phiên mới.
- Tủ đồ xem trước, bài thở 8 giây, gợi ý hằng ngày và bưu thiếp PNG. Link chia sẻ ngoại hình không chứa tên nhân vật và được giữ qua redirect Google. Bưu thiếp mặc định ẩn tên riêng.
- Vào chơi ngay bằng guest. Google chỉ khi muốn đồng bộ hoặc thi đấu ranking. Tài khoản có sẵn vẫn được khôi phục, người đăng nhập chọn mang theo phiên guest hoặc giữ phiên tài khoản. SDK tài khoản tải sau khi cần, không nằm trên đường vào chơi lần đầu.
- Animation tách đầu/thân/tay/tóc/miệng và nối tư thế khi chạm liên tiếp. Sổ của Bự có 6 phản ứng theo đồ chơi/bối cảnh, miễn phí và giữ qua ngày khác. Nghiên cứu và giả thuyết cần đo ở `docs/nhip-choi-va-do-luong.md`.
- Bảng điểm đọc từ server. Thi đấu cần tài khoản, vòng 30 giây, giới hạn server 8 lượt/giây và sequence chống gửi lại. Đây không phải cơ chế ngăn mọi bot.
- HTML hiện màn chờ ngay khi mở trang, trước khi app tải xong. Sau 8 giây chưa mở được có đường tải lại/hướng dẫn. Không có bộ đếm phần trăm giả, tôn trọng reduced motion.

## Font tự host

Các trang mới dùng `public/fonts-woff2.css`. Tổng 5 font WOFF2 là 188.156 bytes thay cho 618.188 bytes TTF, giảm 69,6% dung lượng font khi tải đủ 5 weight. Chuyển định dạng giữ nguyên mọi ký tự, outline và horizontal metric, không subset tiếng Việt. TTF và stylesheet cũ vẫn được giữ để trang đã cache không gọi font bị mất. License OFL ở `public/fonts/OFL.txt`.

Để tạo lại font bằng Python 3.11 trở lên, dùng virtualenv riêng:

```sh
python3 -m venv /tmp/hen1chut-fonts
/tmp/hen1chut-fonts/bin/pip install fonttools==4.67.0 brotli==1.2.0
/tmp/hen1chut-fonts/bin/python scripts/compress-fonts.py
```

Script so sánh cmap, glyph coordinates và metric trước/sau. Font đầu ra đã commit nên build bình thường chỉ cần Node.js. Cách chuyển theo [fontTools WOFF2](https://fonttools.readthedocs.io/en/stable/ttLib/woff2.html).

## Database và public

Project Supabase `hen1chut` đã tạo trong organization cá nhân hiện có, vùng Singapore, gói Free. Bốn migration trong `supabase/migrations/` đã áp dụng online, gồm phần chuẩn bị commerce đang đóng. Các bảng đều bật RLS, dữ liệu riêng chỉ tài khoản sở hữu đọc được. Bảng điểm chỉ trả nickname, ngoại hình và điểm qua RPC giới hạn kết quả.

Xem `docs/ket-noi-supabase-free.md` để nối Google OAuth và cấu hình build. Workflow `.github/workflows/deploy.yml` test, build và deploy GitHub Pages khi push `main`. Hai Actions Variables là `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`, đều là cấu hình public.

Quảng cáo và bán cosmetics là hướng kiếm tiền đã chọn, hiện chưa có quảng cáo/checkout hoạt động. Không dùng điểm hoặc unlock giả để mô phỏng thanh toán thành công. Bảng `entitlements` chỉ cho tài khoản đọc quyền của mình, frontend không được tự cấp.

Chủ dự án đã chốt 10.000đ/cả hai bộ Rồng con + Giáp máy, duyệt chuyển khoản thủ công trước. Mẫu trang phục có thể xem 3D trong tủ, chưa mở bán. Backend catalog cũ 29.000đ vẫn hidden/inactive, không phải giá được duyệt để bán. Luồng manual nằm trong `docs/drafts/`, chưa áp dụng, chưa có ngân hàng hoặc quyền operator. Hai Edge Functions chuẩn bị checkout/webhook fail closed khi chưa cấu hình, không được xem đó là thanh toán live.

## Bằng chứng kiểm tra

Ngày 21/10/2026, 52 tests qua trên 14 files, gồm thực thi migration bằng PostgreSQL WASM, RLS giữa hai tài khoản, từ chối ghi điểm/entitlement trực tiếp, revision conflict và vòng thi đấu server. Browser bản build: 144 tổ hợp 4 nhân vật × 12 đồ chơi × 3 bối cảnh ghi đúng 144 lượt, không console error. Reload giữ 144 lượt, hoodie, mũ len, kính tròn và dấu pháo giấy. Chọn chơi tiếp giữ phiên, mở phiên mới đưa về 0 và xóa dấu, vẫn giữ trang phục. PNG bưu thiếp đã tải được. Đã xem lại bằng khung trình duyệt 320px và 375px, sửa thanh đồ chơi xếp dọc che sân chơi thành hàng ngang có vuốt.

Bản nâng cấp còn được kiểm tra 96 tổ hợp 4 nhân vật × 12 đồ chơi × 2 bối cảnh mới. Guest tải lại giữ 107 lượt, scene Sân bóng và dấu tác động. Sáu phản ứng trong Sổ của Bự đã được thử qua UI, reload giữ 6/6. Guest xem được bảng thật. Luồng guest → Google → chọn phiên tài khoản đã chạy thật trên preview 127.0.0.1 được allowlist, không tự nhập phiên guest.

Google OAuth production của chủ dự án đã qua vòng login, sync, reload và logout/login. Vòng QA 30 giây ghi nhận 3 lượt trên bảng tổng/7 ngày. Reload ngay sau cú đấm giữ đúng phiên 8 lượt và 8 dấu tác động, sau đó đồng bộ lên server. Chi tiết ở `docs/kiem-chung-2026-10-21.md`.

Đồng bộ hai thiết bị/tài khoản thật, thanh toán/quảng cáo live, Lighthouse/FPS và thiết bị iOS/Android thật vẫn cần kiểm chứng riêng. Tests local không thay thế các bằng chứng này. Bản code mới chỉ là bản public sau khi workflow deploy của commit tương ứng thành công.

Nghiên cứu tạo hình và giới hạn áp dụng nằm ở [sức hút nhân vật](docs/suc-hut-nhan-vat.md). Không có dữ liệu nào hiện chứng minh các mẫu mới sẽ nổi tiếng hoặc bán được như một IP lớn. Three.js 0.186.1 được khóa phiên bản, thông báo MIT đi kèm tại `public/three-LICENSE.txt`.

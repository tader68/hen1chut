# Kết nối database miễn phí và Google login

Database online đã tạo ngày 21/10/2026 trên organization cá nhân hiện có, gói Free:

- Project: `hen1chut`, ref `kxzwotzmxlulmwhwljwt`, Singapore.
- Project URL: `https://kxzwotzmxlulmwhwljwt.supabase.co`.
- Hai migration `202610210001_core.sql` và `202610210002_state_revision.sql` đã áp dụng thành công, không chạy lại trên database này.
- API bảng điểm đã phản hồi HTTP 200 với bảng trống, sáu bảng đều có RLS.
- Google Cloud project cá nhân: `glossy-box-512221-q9`, tên `hen1chut`. Branding OAuth và web client `hen1chut Supabase login` đã tạo. Google provider đã bật trong Supabase, Site URL và 3 redirect URL đã lưu. Google audience vẫn ở Testing, đăng nhập thật còn chờ kiểm chứng.

Các bước tạo database dưới đây dành cho môi trường mới. Không dùng tài khoản Google Cloud của công ty cho project cá nhân này.

## 1. Tạo project Free

1. Vào https://supabase.com/dashboard, đăng nhập tài khoản cá nhân.
2. Tạo organization gói **Free**, rồi tạo project `hen1chut`. Chọn Singapore nếu có. Giữ database password trong password manager, không gửi trong chat hoặc commit.
3. Trong SQL Editor, chạy lần lượt hai migration trong `supabase/migrations/` một lần trên project mới. Không chạy lại migration lên project đã có bảng cùng tên.
4. Vào Settings → API hoặc Connect, lấy Project URL và **publishable key**. Legacy `anon` key cũng được hỗ trợ. Không dùng `service_role` hoặc `sb_secret_...` trong frontend.

Gói Free có hạn mức và có thể tạm dừng khi không hoạt động. Không thêm billing hay nâng cấp gói khi chưa được chủ tài khoản yêu cầu. Theo dõi dung lượng trong console, không tạo cron giả để né chính sách tạm dừng.

## 2. Google OAuth

1. Dùng tài khoản Google cá nhân vào https://console.cloud.google.com/, tạo project riêng cho `hen1chut`. Không liên kết billing.
2. Trong Google Auth Platform, cấu hình tên ứng dụng Hẹn 1 chút, support email của chủ tài khoản, audience External. Chỉ dùng scope `openid`, `email`, `profile`, không xin quyền Gmail.
3. Tạo OAuth client loại Web application. Authorized redirect URI lấy nguyên văn từ Supabase → Authentication → Providers → Google, của project hiện tại là `https://kxzwotzmxlulmwhwljwt.supabase.co/auth/v1/callback`.
4. Nhập Client ID và Client secret vào Google provider trong console Supabase. Không gửi Client secret trong chat và không đưa vào GitHub frontend.
5. Authentication → URL configuration: Site URL `https://tader68.github.io/hen1chut/`. Redirect allow list gồm đúng URL đó và `http://127.0.0.1:5173/`, `http://127.0.0.1:4173/` cho kiểm tra local. Không dùng wildcard toàn miền khi không cần.
6. Tắt email/password và anonymous sign-in nếu chỉ cung cấp Google. Với OAuth app ở Testing, thêm tài khoản kiểm tra. Trước khi public rộng, chuyển app sang Production và hoàn thành yêu cầu Google hiển thị trong console. Không coi cấu hình provider là bằng chứng đăng nhập thật đã qua.

## 3. Bật trên GitHub Pages

Repository → Settings → Secrets and variables → Actions → Variables:

- `VITE_SUPABASE_URL`: Project URL HTTPS, không có dấu `/` cuối.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: publishable key hoặc legacy anon key.

Đây là cấu hình public, được đưa vào bundle. Script build sẽ từ chối secret key hoặc legacy JWT có role khác `anon`. Trigger lại workflow Publish Hẹn 1 chút sau khi thêm đủ cả hai biến.

## 4. Kiểm chứng bắt buộc sau kết nối

- Đăng nhập Google thật, tạo nickname và tên nhân vật, reload giữ hồ sơ.
- Hai tài khoản khác nhau không thấy tên nhân vật/phiên riêng của nhau.
- Chơi, đóng tab trước khi kết thúc phiên, quay lại vẫn giữ số lượt, biểu cảm và các vết tác động.
- Mở trên thiết bị thứ hai, đồng bộ đúng, xung đột không bị ghi đè âm thầm.
- Hoàn thành vòng 30 giây, bảng toàn cầu hiện đúng nickname và điểm server. Không có email, tên nhân vật hay dữ liệu giả.
- Thử logout, login lại, popup bị chặn và mất mạng.

Tests PostgreSQL local có thể chứng minh logic SQL và RLS. Chúng không thay thế kiểm tra Google OAuth, cấu hình project hay login thật trên production.

## 5. Ranking và giới hạn

Điểm tự do của nhân vật không được client đưa lên bảng. Vòng xếp hạng dài 30 giây do server ấn định, nhận tối đa 8 lượt trong mỗi giây server, sequence chống nhận lặp, kết quả chỉ được công bố khi vòng khép lại. Server giới hạn số vòng theo giờ và dọn round cũ theo tài khoản.

Cơ chế này ngăn tự ghi điểm, replay và sửa thời gian trên client. Nó không chứng minh người chơi là người thật và không ngăn được hoàn toàn bot/auto-click. Nếu có lạm dụng thực tế, bổ sung challenge/rate limit ở API trước khi mở thưởng có giá trị tiền.

# Hẹn 1 chút

Game xả stress hoạt hình tiếng Việt. Vite + TypeScript, không backend hay tài khoản.

## Chạy local

```sh
npm ci
npm run dev
```

Mở URL Vite in trong terminal. Chọn 1 trong 6 đồ chơi, chạm nhân vật hoặc dùng Enter/Space khi nhân vật được focus. Phím 1–6 đổi đồ chơi. Có 4 loại nhân vật, 3 trang phục, 3 dáng, 6 màu và 3 bối cảnh.

Nhân vật và lựa chọn âm thanh được lưu bằng localStorage. Âm thanh mặc định tắt. Nếu trình duyệt không cho lưu, game vẫn hoạt động. Nhân vật có phản ứng tạm thời và trở lại bình thường sau mỗi lượt. Bộ đếm là số lần tương tác, không phải điểm damage.

## Kiểm tra và build

```sh
npm test
npm run build
npm run preview
```

Output nằm trong `dist/`. Asset dùng đường dẫn tương đối để chạy được ở cả root domain và subdirectory. Không có analytics. Web Audio chỉ khởi động sau khi người chơi bật âm thanh. Hỗ trợ reduced motion và keyboard.

## Public

Repo dùng `.github/workflows/deploy.yml`: push vào `main` sẽ test, build và deploy GitHub Pages. Trong Settings → Pages, Source là GitHub Actions. Workflow cần quyền `pages: write` và `id-token: write`.

URL của repo hiện tại: https://tader68.github.io/hen1chut/

Cloudflare Pages cũng chạy được: build command `npm run build`, output directory `dist`, Node 24. Khi chuyển domain, cập nhật `og:image` trong `index.html` cho đúng URL.

## Phạm vi kiểm chứng

Unit tests kiểm tra reaction, dữ liệu nhân vật lỗi hoặc không an toàn, toàn bộ 216 tổ hợp nhân vật ở 4 trạng thái và các định nghĩa công cụ/bối cảnh. Đây không phải bằng chứng đo FPS, Lighthouse hoặc thử trên thiết bị iOS thật.

Browser smoke test ngày 21/10/2026: đã chơi 72 tổ hợp 4 loại × 6 công cụ × 3 bối cảnh, đếm đúng 72 lượt và không console error. Đã kiểm tra desktop, mobile 375px không tràn ngang, reload giữ nhân vật, Enter/Space, bật/tắt âm thanh và dialog bài thở.

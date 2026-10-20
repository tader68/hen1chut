# Implementation plan: web xả stress (hen1chut)

## Overview

Website tĩnh, miễn phí, tiếng Việt. User tạo 1 nhân vật hoạt hình (nam, nữ, con vật, đồ vật), đặt tên, chọn trang phục và hình dáng, rồi chọn công cụ và môi trường để "tác động" lên nhân vật. Nhân vật phản ứng vui nhộn, không máu, không gore. Không backend, không đăng nhập, lưu nhân vật bằng localStorage.

## Quyết định đã chốt

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Tone nội dung | Cartoon, hài hước, không máu | Dễ public, ít rủi ro bị report hoặc bị chặn |
| Render | 2D, nhân vật ghép layer SVG, hiệu ứng vẽ trên Canvas | Nhẹ, chạy tốt mobile, đổi trang phục và hình dáng rẻ |
| Hosting | Static site trên Cloudflare Pages (phương án dự phòng: GitHub Pages) | Miễn phí, không cần backend |
| Ngôn ngữ | Tiếng Việt, tách chuỗi text sang file riêng để thêm tiếng Anh sau | Giữ MVP gọn |
| Stack | Vite + TypeScript, không framework, Vitest cho logic | Bundle nhỏ, ít phụ thuộc |
| Âm thanh | Tổng hợp bằng Web Audio, không dùng file âm thanh ngoài | Tránh vấn đề bản quyền asset |

Giả định cần xác nhận (suy luận): "vũ khí" chỉ gồm đồ hài hước như búa cao su, gối, cà chua, bóng nước, sấm sét, không có súng hay dao thật.

## Acceptance checks cho toàn dự án

1. User hoàn thành flow tạo nhân vật rồi dùng công cụ trong dưới 60 giây, trên mobile 375px và desktop, không lỗi console.
2. Có tối thiểu 4 loại đối tượng, 6 công cụ, 3 môi trường, và mọi tổ hợp đều chạy, không crash.
3. Lighthouse trên bản production đạt Performance từ 90, trang tải dưới 1MB lần đầu, chạy ở 60 fps trên điện thoại tầm trung (đo bằng DevTools throttling).
4. Bản public truy cập được bằng URL miễn phí và không cần đăng nhập. Reload vẫn giữ nhân vật đã tạo.

## Dependency graph

```
Scaffold + deploy
   └── Stage + 1 nhân vật + 1 công cụ (core loop)
          ├── Data model nhân vật ── Creator UI ── Outfit/shape layers
          ├── Tool system ── 6 tools
          └── Environment system ── 3 envs
                  └── Sound/haptics ── Mobile/responsive ── Polish + launch
```

## Task list

### Phase 1: Foundation và core loop (rủi ro cao nhất, làm sớm)

**Task 1: Scaffold và deploy sớm** (S)
- Mô tả: Khởi tạo Vite + TS, trang trống, cấu hình deploy lên Cloudflare Pages.
- Acceptance: `npm run build` thành công, URL public hiển thị trang "hello", có script test chạy được.
- Verify: `npm run build`, `npm test`, mở URL public.
- Dependencies: None. Files: `package.json`, `index.html`, `src/main.ts`, `vite.config.ts`.

**Task 2: Core loop, 1 nhân vật cố định và 1 công cụ** (M)
- Mô tả: Stage canvas, 1 nhân vật SVG hardcode, 1 công cụ (búa cao su). Chạm hoặc click vào nhân vật thì có squash/stretch, rung, đổi mặt, số "stress đã xả" tăng, nút reset.
- Acceptance: Click hoặc tap tạo hiệu ứng trong dưới 100ms, mặt nhân vật đổi theo số lần bị tác động, reset đưa về trạng thái đầu.
- Verify: Test thủ công trên desktop và mobile emulation, unit test cho state machine phản ứng.
- Dependencies: 1. Files: `src/stage/stage.ts`, `src/character/reaction.ts`, `src/tools/hammer.ts`, test.
- Đây là điểm quyết định "có vui không". Nếu cảm giác chưa tốt thì chỉnh ở đây trước khi mở rộng.

**Checkpoint A: sau task 1 và 2**
- [ ] Build sạch, deploy chạy
- [ ] Đánh nhân vật thấy vui và mượt, Dat xác nhận trước khi đi tiếp

### Phase 2: Tạo nhân vật

**Task 3: Data model nhân vật và lưu localStorage** (S)
- Mô tả: Kiểu `Character { kind, name, outfit, body, color }`, hàm save/load có validate, fallback khi dữ liệu hỏng.
- Acceptance: Reload giữ nhân vật, dữ liệu hỏng không làm crash, tên được cắt tối đa 20 ký tự và escape khi hiển thị.
- Verify: Unit test save/load/invalid. Dependencies: 1. Files: `src/character/model.ts`, `src/character/storage.ts`, test.

**Task 4: Creator UI, chọn đối tượng và đặt tên** (M)
- Mô tả: Màn hình chọn 4 loại (nam, nữ, con vật, đồ vật), nhập tên, nút bắt đầu. Mỗi loại có 1 bộ layer cơ bản.
- Acceptance: Tạo được 4 loại, tên hiện trên stage, không cho tên rỗng.
- Verify: Test thủ công 4 loại, test component state. Dependencies: 2, 3. Files: `src/ui/creator.ts`, `src/character/parts/*.svg`.

**Task 5: Trang phục, hình dáng, màu sắc** (M)
- Mô tả: Mỗi loại có tối thiểu 3 trang phục, 3 hình dáng (gầy, tròn, to), bảng màu. Ghép layer SVG theo data.
- Acceptance: Đổi tùy chọn cập nhật preview ngay, mọi tổ hợp render đúng, phản ứng ở task 2 vẫn chạy với mọi tổ hợp.
- Verify: Test duyệt toàn bộ tổ hợp (snapshot hoặc render smoke test), kiểm tra thủ công. Dependencies: 4. Files: `src/character/compose.ts`, `src/ui/creator.ts`, assets.

**Checkpoint B: sau task 3 đến 5**
- [ ] Flow tạo nhân vật hoàn chỉnh, reload giữ dữ liệu
- [ ] Review với Dat trước khi làm công cụ và môi trường

### Phase 3: Công cụ và môi trường

**Task 6: Tool system theo data và 6 công cụ** (L, tách đôi nếu vượt 5 file)
- Mô tả: Interface `Tool { id, icon, effect, sound, reactionPower }`. Công cụ gợi ý: búa cao su, gối, cà chua, bóng nước, cú đá cartoon, sấm sét. Mỗi công cụ có hiệu ứng particle riêng.
- Acceptance: Chọn công cụ trên thanh dưới, thêm công cụ mới chỉ cần thêm 1 file data, mỗi công cụ có hiệu ứng và phản ứng riêng.
- Verify: Unit test registry, thủ công từng công cụ trên 4 loại nhân vật. Dependencies: 2, 5. Files: `src/tools/registry.ts`, `src/tools/*.ts`, `src/fx/particles.ts`.

**Task 7: Environment system và 3 môi trường** (M)
- Mô tả: Nền và hiệu ứng môi trường: phòng trống, ngoài trời có mưa, không gian có trọng lực thấp (nhân vật bay nhẹ). Môi trường tác động lên vật lý nhẹ hoặc hiệu ứng, không chỉ đổi nền.
- Acceptance: Đổi môi trường không mất nhân vật, mỗi môi trường khác biệt rõ khi dùng cùng công cụ.
- Verify: Thủ công 3 env x 6 tools, kiểm tra không rò rỉ listener hoặc animation khi đổi env. Dependencies: 6. Files: `src/env/registry.ts`, `src/env/*.ts`.

**Checkpoint C: sau task 6 và 7**
- [ ] 6 tools x 3 envs x 4 loại không crash
- [ ] Giữ 60 fps trên emulation mobile

### Phase 4: Hoàn thiện và launch

**Task 8: Âm thanh và rung** (S)
- Mô tả: Âm thanh tổng hợp bằng Web Audio cho từng công cụ, nút tắt tiếng lưu theo user, rung nhẹ trên mobile nếu hỗ trợ.
- Acceptance: Không phát tiếng trước lần tương tác đầu tiên (đúng autoplay policy), tắt tiếng có hiệu lực ngay và được nhớ.
- Verify: Thủ công trên Chrome và Safari iOS. Dependencies: 6. Files: `src/audio/synth.ts`.

**Task 9: Mobile, responsive, accessibility cơ bản** (M)
- Mô tả: Layout 375px đến desktop, touch target từ 44px, hỗ trợ keyboard cho các nút chọn, tôn trọng `prefers-reduced-motion`, không rung màn hình quá mạnh (chống say, chống động kinh quang nhạy).
- Acceptance: Không scroll ngang ở 375px, không có hiệu ứng nhấp nháy quá 3 lần mỗi giây, điều hướng bằng Tab được.
- Verify: DevTools mobile emulation, kiểm tra thủ công, Lighthouse accessibility từ 90. Dependencies: 7, 8.

**Task 10: Lưu ảnh khoảnh khắc và chia sẻ** (S, tùy chọn)
- Mô tả: Nút lưu ảnh canvas hiện tại (toDataURL), không upload server.
- Acceptance: Tải được PNG đúng nội dung stage. Dependencies: 7.

**Task 11: Launch checklist** (S)
- Mô tả: Title, meta, OG image, favicon, dòng disclaimer "nhân vật hoạt hình, chỉ để giải trí", 404 page, kiểm tra không tracking hay cookie thừa. Có thể dùng analytics ẩn danh miễn phí nếu Dat muốn.
- Acceptance: Link share ra preview đúng, Lighthouse Performance từ 90, deploy production bằng 1 lệnh hoặc push.
- Dependencies: 9. Files: `index.html`, `public/*`.

**Checkpoint D: hoàn tất**
- [ ] 4 acceptance checks toàn dự án đều pass kèm bằng chứng
- [ ] Dat review bản public

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Core loop không đủ vui | Cao | Làm task 2 sớm, review ở Checkpoint A trước khi đầu tư creator |
| Tạo asset SVG cho 4 loại x trang phục x hình dáng tốn thời gian | Cao | Bắt đầu 3 trang phục và 3 hình dáng mỗi loại, ghép layer thay vì vẽ từng tổ hợp |
| Nội dung bạo lực bị coi là nhạy cảm khi public hoặc xin quảng cáo | Trung bình | Giữ cartoon, không máu, không vũ khí thật, thêm disclaimer |
| Hiệu năng yếu trên điện thoại cũ | Trung bình | Giới hạn số particle, dùng 1 canvas, đo ở Checkpoint C |
| Người dùng đặt tên người thật để "đánh" | Thấp đến trung bình | Chỉ lưu local, không chia sẻ lên server, có disclaimer. Quyết định có lọc từ khóa hay không ở Open decisions |
| Hiệu ứng rung và nhấp nháy gây khó chịu | Thấp | `prefers-reduced-motion`, giới hạn tần số flash |

## Open decisions

- Có cần lọc tên (từ tục) không, hay để tự do vì chỉ lưu local
- Domain: dùng subdomain miễn phí (`*.pages.dev`) hay mua domain riêng sau
- Có thêm analytics ẩn danh để biết công cụ nào được dùng nhiều nhất không
- Task 10 (lưu ảnh) nằm trong MVP hay để sau

## MVP và long-term

- MVP: task 1 đến 9 và 11, tiếng Việt, 4 loại, 6 công cụ, 3 môi trường.
- Sau MVP: tiếng Anh, thêm công cụ và môi trường, nhân vật tùy biến sâu hơn (tải ảnh mặt lên và xử lý cục bộ), chia sẻ link nhân vật (cần backend), bảng xếp hạng.

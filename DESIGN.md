# Design

## Register

Product UI with a playful illustrated stage. Người dùng đang tìm một khoảng nghỉ ngắn trên điện thoại hoặc laptop, thường mở vào giữa một ngày làm việc. Nền sáng dịu và sân khấu như đồ chơi trên bàn giữ hình/biểu cảm rõ mà không dùng màn hình tối mặc định.

## Identity

- Lavender, muted violet ink, paper-like illustration materials. Brand accent around `#80629f`, dark ink `#493a56`, background `#f7f6fa`.
- Be Vietnam Pro served locally, system-ui fallback.
- Bự / Cục bực: rounded asymmetric head, small cloud tuft, forehead note patch, slanted eyebrows, zigzag belly seam. No rabbit ears on this mascot. Other kinds retain distinct human/cat silhouettes.
- Character clothing and accessory layers remain SVG, effect particles Canvas. No remote image dependencies.

## Layout and interaction

- Stage is primary. Desktop has toy palette left and customization right. Mobile toys remain reachable at the bottom with horizontal scroll for all 12.
- Clothing closet shows actual outfit previews, not generic locked thumbnails.
- Persistent impact marks and cumulative expression are session state, distinct from temporary squash/weapon motion.
- End session is explicit with a review dialog. Opening/closing dialogs, changing clothes, reloading or changing scenes do not reset impacts.
- Sharing removes private character name unless user opts in. Preset links change appearance only after recipient accepts.
- Respect reduced motion, native keyboard controls and visible focus. Never flash full-screen strobe effects for lightning.
- No fake players, testimonials, online counts, earnings, medical claims or success percentages.

# Nguồn tài nguyên

- `meadow-real.webp`: cánh đồng cosmos dày dưới hoàng hôn, tạo bằng imagegen tích hợp theo màu sắc, ánh sáng và bố cục ảnh tham chiếu do người dùng gửi. Dùng cho ảnh dự phòng và hình chia sẻ.
- `meadow-empty.webp`: chỉnh sửa từ ảnh trên bằng imagegen để loại bỏ hoa, giữ góc chụp, trời, mặt trời, đồi núi và rừng; dùng làm hậu cảnh.
- `cosmos-atlas.webp`: bốn cụm cosmos vàng, cam, hồng và vàng/cam được tạo bằng imagegen, có alpha thực; dùng cho các lớp hoa vươn lên và đung đưa riêng.
- `meadow-grass.webp`: ảnh chất liệu cỏ nhìn thẳng từ trên xuống, tạo bằng imagegen cho mặt đất của hành trình camera. Chuyển WebP 1024 × 1024.
- Các ảnh AI mô phỏng ảnh chụp, không phải ảnh chụp tại địa điểm thực. Các ảnh được lưu cục bộ và chuyển định dạng WebP; không gọi AI lúc mở web.
- `meadow.webp`: ảnh chụp cảnh 3D của phiên bản trước, được giữ lại trong bộ nguồn; phiên bản hiện tại không dùng.
- Prompt và quy trình: xem `IMAGE-PROMPTS.md`.
- Three.js 0.186.1: thư viện chính thức từ npm/jsDelivr; MIT License đính kèm `dist/assets/THREE-LICENSE.txt`. Bản `three.core.js` là nội dung minified chính thức, đặt tên phù hợp với đường import của Three.js.
- Font Lora và Be Vietnam Pro: Google Fonts, lưu cục bộ; SIL Open Font License đính kèm.
- Icon flower, heart và favicon: Phosphor Icons, MIT License đính kèm. Icon heart được giữ trong bộ tài nguyên.
- `bouquet.webp`: ảnh hoa tạo riêng bằng imagegen tích hợp, ngày 20/10/2026, được giữ từ phiên bản trước; phiên bản cánh đồng không sử dụng ảnh này. Chuyển định dạng WebP để tối ưu tải trang.

## Prompt ảnh hoa dự phòng

Fine art floral studio still life for Vietnamese Women's Day October 20. An airy hand-tied bouquet of blush pink garden roses, ivory roses, small white cosmos and muted sage eucalyptus, loosely wrapped in warm ivory translucent tissue with a dusty burgundy silk ribbon. Entire bouquet and trailing ribbon visible, no vase, hands or people. Soft warm afternoon light, uniform light warm cream background, natural petals, generous border. No letters, logos, watermark, butterflies or hearts.

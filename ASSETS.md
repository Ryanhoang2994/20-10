# Nguồn tài nguyên

## Cánh đồng cosmos hồng hiện tại

- `cosmos-sunset.webp`: cánh đồng cosmos hồng dưới nắng hoàng hôn, ảnh AI theo tham chiếu mới do người dùng gửi. 1536 × 1024, dùng cho nền trời/cánh đồng xa, ảnh dự phòng và chia sẻ.
- `cosmos-pink-atlas.webp`: bốn cụm cây cosmos hồng đậm, hồng nhạt và trắng, có alpha trong suốt thực, 1536 × 1024. Tạo bằng imagegen tích hợp; giữ alpha khi chuyển sang WebP.
- Các cây là ảnh cắt nền đặt tại tọa độ 3D, vẽ bằng instancing và quay về phía camera. Hiệu ứng mọc từ gốc và gió chạy trên GPU. Đây là kỹ thuật billboard/2.5D, không phải mô hình cánh hoa 3D đầy đủ.
- Ảnh AI mô phỏng chất ảnh chụp, không ghi lại một địa điểm thực. Toàn bộ tài nguyên được lưu cùng website; không gọi AI khi mở link.
- `meadow-grass.webp` tiếp tục là chất liệu mặt đất. Các ảnh và thư viện cũ bên dưới được giữ trong bộ mã nguồn để bảo toàn lịch sử tài nguyên.

## Cảnh hoa đào ở phiên bản trước

- Toàn bộ cành gỗ, hoa năm cánh cong, nhụy, nụ và cánh hoa bay được dựng bằng hình học trong `dist/garden.js`. Ánh sáng và hạt lấp lánh được tính bằng Three.js/GLSL.
- `peach-garden.webp`: ảnh chụp từ chính vùng đất hoa WebGL với thảm cỏ và đồi xa, 1440 × 900, ẩn giao diện trước khi chụp. Dùng làm ảnh dự phòng và ảnh chia sẻ. Không phải ảnh AI tạo riêng hoặc ảnh chụp cây thật.
- Cảnh dùng chất liệu cỏ `meadow-grass.webp` đã tạo ở phiên bản trước. Tài nguyên được phục vụ cùng website; không gọi dịch vụ AI khi xem.

## Tài nguyên được giữ từ các phiên bản cánh đồng trước

Những vai trò bên dưới mô tả phiên bản cũ. Riêng `meadow-grass.webp` tiếp tục làm chất liệu mặt đất; các ảnh còn lại không được tải trong cảnh hoa đào hiện tại.

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

# Nở vì em · Cánh đồng hoa cosmos · 20/10

Một cánh đồng hoa cosmos hồng dưới hoàng hôn, dựa trên ảnh tham chiếu của người dùng: cánh mỏng có vân, thân xanh thanh mảnh, lá tơi, hoa hồng đậm xen hồng nhạt và trắng. Nắng vàng ở phía trái, trời xanh tím và mây hồng.

**Website:** https://gui-ban-mot-doa-hoa-20-10.yvonne821952.chatgpt.site/

## Trải nghiệm

- Camera bay thấp theo đường uốn nhẹ dài hơn 60 m giữa các lớp hoa gần và xa.
- Các cây vươn lên khi camera đến gần và đung đưa nhẹ theo gió.
- Hành trình khoảng 32 giây: mở đầu 1,8 giây, di chuyển 28 giây, dừng 2 giây rồi hiện thiệp.
- **Chạm nhận yêu thương** mở thiệp 20/10, dùng cách gọi “em”. **Nhận thêm yêu thương** hiển thị sáu lời chúc.
- **Thêm chút lấp lánh** tạo hạt sáng. Kéo nhẹ trên cảnh để đổi góc nhìn.
- Nút ngắm lại hoa và chia sẻ nằm trong thiệp. Màn hình chính không có thanh điều khiển hay chữ hướng dẫn ở đáy.
- Hỗ trợ giảm chuyển động; thiết bị không có WebGL hiển thị ảnh cánh đồng và thiệp tương tác.

## Cách dựng cảnh

Cảnh dùng Three.js với các cây dạng ảnh cắt nền được đặt ở tọa độ 3D (billboard/2.5D), kết hợp nền cánh đồng hoàng hôn. Ảnh do công cụ imagegen tích hợp tạo theo tham chiếu, không phải ảnh chụp một địa điểm thực. Kỹ thuật này giữ chi tiết cánh hoa và ánh sáng trong khi camera vẫn di chuyển qua từng lớp cây. Đây không phải mô hình hình học đầy đủ cho từng cánh hoa.

Cây được vẽ bằng instancing; hiệu ứng mọc và gió chạy trên GPU. Mật độ giảm trên điện thoại. Tất cả ảnh, font và thư viện lưu cùng website; không gọi AI khi người nhận mở link.

## Chạy trên máy

Cần Node.js 20 trở lên:

```sh
node server.mjs
```

Mở http://127.0.0.1:4173/. Không cần cài thêm gói.

```sh
node --check dist/app.js
node --check dist/garden.js
```

## Tệp chính

- `dist/index.html`: nội dung và thiệp.
- `dist/app.js`: mở thiệp, sáu lời chúc, chia sẻ và xem lại.
- `dist/garden.js`: bố trí cây, camera, gió, mọc hoa và ánh sáng lấp lánh.
- `dist/style.css`: giao diện responsive và chế độ giảm chuyển động.
- `dist/assets/cosmos-sunset.webp`: nền cánh đồng, ảnh dự phòng và ảnh chia sẻ.
- `dist/assets/cosmos-pink-atlas.webp`: bốn cụm cây cosmos với alpha trong suốt.
- `ASSETS.md`, `IMAGE-PROMPTS.md`: nguồn tài nguyên và prompt đã sử dụng.

## Hosting

Website tĩnh, xuất bản thư mục **dist**, không có bước build.

- Netlify: import repository, publish directory `dist`.
- Vercel: Framework Preset **Other**, output directory `dist`, không cần build command.
- Hosting tĩnh khác: đưa nội dung `dist/` vào thư mục website.

Cập nhật `og:image` khi đổi tên miền. Nút chia sẻ tự dùng tên miền đang mở. Bản công khai dùng Sites; GitHub và Sites được cập nhật riêng.

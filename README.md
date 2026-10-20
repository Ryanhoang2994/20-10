# Nở vì bạn · 20/10

Một cánh đồng hoa mọc lên dưới trời hoàng hôn, với chất liệu hoa như ảnh chụp. Camera lướt nhẹ qua hoa vàng, cam và hồng, sau đó lời chúc 20/10 **dành chung cho mọi cô gái** tự hiện ra.

**Website:** https://gui-ban-mot-doa-hoa-20-10.yvonne821952.chatgpt.site

## Trải nghiệm

- Cả cánh đồng mọc dần trong khoảng 18 giây sau phần mở đầu.
- Thân và lá vươn lên trước, cánh hoa bung ra sau, từ gần đến xa.
- Camera lướt qua cánh đồng, phía xa có đồi núi và ánh hoàng hôn.
- Lời chúc tự hiện khi cánh đồng nở xong; có thể đóng thiệp để ngắm hoa và chạm để đọc lại.
- Tạm dừng, tiếp tục, bỏ qua hoặc xem lại hành trình.
- Sao chép/chia sẻ link trang qua trình chia sẻ của thiết bị khi được hỗ trợ.
- Không nhập tên, không thu thập dữ liệu, không có tài khoản hay backend.
- Chế độ giảm chuyển động hiển thị ngay cánh đồng và lời chúc. Thiết bị không có WebGL vẫn xem được lời chúc với ảnh cánh đồng thay thế.

Hình ảnh được tạo bằng imagegen tích hợp theo ảnh tham chiếu cánh đồng hoàng hôn của người dùng. Trải nghiệm dùng **ảnh nhiều lớp (2.5D)** với WebGL/Three.js: cảnh cỏ chuyển dần thành cánh đồng, các cụm hoa tiền cảnh vươn lên và đung đưa độc lập. Camera lia bằng parallax và thay đổi khung hình nhẹ. Không phải video quay thật hoặc cảnh 3D có thể xoay tự do; không gọi dịch vụ AI khi người xem mở trang.

## Chạy trên máy

Cần Node.js 20 trở lên:

```sh
node server.mjs
```

Mở http://127.0.0.1:4173. Không cần `npm install`; thư viện Three.js, font và ảnh đã lưu trong `dist/assets/`.

Kiểm tra cú pháp:

```sh
node --check dist/app.js
```

## Cấu trúc

```text
dist/
  index.html       Nội dung, bộ điều khiển và lời chúc
  style.css        Giao diện, responsive, chế độ giảm chuyển động
  app.js           Điều khiển, lời chúc và chia sẻ
  garden.js        Các lớp ảnh, hiệu ứng mọc, gió và camera
  assets/          Three.js, font, ảnh dự phòng, icon và giấy phép
server.mjs         Server xem thử trên máy
netlify.toml       Publish directory: dist
vercel.json        Output directory: dist
ASSETS.md          Nguồn tài nguyên
```

Trong `dist/garden.js`, chỉnh `DURATION` để đổi thời gian hoa nở; `uTravel` và các hệ số parallax để chỉnh camera. Các texture chính là `meadow-empty.webp`, `meadow-real.webp` và `cosmos-atlas.webp`. Lời chúc nằm trực tiếp trong `dist/index.html`.

## Hosting

Website tĩnh, thư mục xuất bản **`dist`**, không có bước build.

- **Netlify:** import repository, publish directory `dist`; có sẵn `netlify.toml`.
- **Vercel:** import repository, Framework Preset **Other**, output directory **dist**, không cần build command.
- **Hosting tĩnh khác:** đưa nội dung `dist/` vào thư mục website.

Sau khi đổi tên miền, cập nhật URL `og:image` trong `dist/index.html`. Nút chia sẻ tự dùng tên miền đang mở.

Netlify/Vercel là cấu hình để thuận tiện chuyển hosting; bản demo hiện tại dùng Sites. Không có đồng bộ tự động giữa GitHub và Sites.

## Kỹ thuật

- Three.js 0.186.1, WebGLRenderer và InstancedBufferGeometry; cảnh chỉ cần hai lượt vẽ.
- 76 cụm hoa tiền cảnh trên màn hình lớn, 38 cụm trên điện thoại, mỗi cụm gồm nhiều bông; hậu cảnh là cánh đồng dày phủ kín.
- Shader chạy hiệu ứng mọc và gió trên GPU mỗi khung hình. Camera dùng đường chuyển động bậc 5 có vận tốc và gia tốc về 0 ở hai đầu.
- Không cập nhật hàng nghìn ma trận cây bằng JavaScript theo từng khung hình.
- Tab ẩn không làm hành trình tiếp tục chạy; giới hạn mật độ điểm ảnh trên điện thoại.
- Hỗ trợ bàn phím và Escape đóng lời chúc.

Chất lượng và tốc độ WebGL phụ thuộc thiết bị. Kiểm tra bằng trình duyệt giả lập không thay thế kiểm thử trên mọi điện thoại thực.

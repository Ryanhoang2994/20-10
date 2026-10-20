# Nở vì bạn · 20/10

Một đường hoa 3D nở dần trong không gian tối, camera đi theo từng đoạn, kết thúc bằng bông hoa có thể chạm để mở lời chúc **dành chung cho mọi cô gái**.

**Website:** https://gui-ban-mot-doa-hoa-20-10.yvonne821952.chatgpt.site

## Trải nghiệm

- Đường hoa mọc dần trong khoảng 24 giây sau phần mở đầu.
- Camera di chuyển theo đường cong 3D, các nhánh, lá và hoa xuất hiện lần lượt.
- Chạm trực tiếp vào bông hoa cuối hoặc chọn “Chạm vào hoa” để mở lời chúc 20/10.
- Tạm dừng, tiếp tục, bỏ qua hoặc xem lại hành trình.
- Sao chép/chia sẻ link trang qua trình chia sẻ của thiết bị khi được hỗ trợ.
- Không nhập tên, không thu thập dữ liệu, không có tài khoản hay backend.
- Chế độ giảm chuyển động hiển thị ngay cảnh hoa cuối. Thiết bị không có WebGL vẫn xem được lời chúc với ảnh hoa thay thế.

Phong cách hình ảnh lấy cảm hứng từ không gian hoa kỹ thuật số. Hiệu ứng là 3D được lập trình bằng Three.js, không gọi dịch vụ AI lúc người xem mở trang.

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
  app.js           Đường hoa, camera, tương tác và chia sẻ
  assets/          Three.js, font, ảnh dự phòng, icon và giấy phép
server.mjs         Server xem thử trên máy
netlify.toml       Publish directory: dist
vercel.json        Output directory: dist
ASSETS.md          Nguồn tài nguyên
```

Trong `dist/app.js`, chỉnh `DURATION` để đổi thời gian hoa nở; chỉnh các điểm `CatmullRomCurve3` để đổi đường đi; lời chúc nằm trực tiếp trong `dist/index.html`.

## Hosting

Website tĩnh, thư mục xuất bản **`dist`**, không có bước build.

- **Netlify:** import repository, publish directory `dist`; có sẵn `netlify.toml`.
- **Vercel:** import repository, Framework Preset **Other**, output directory **dist**, không cần build command.
- **Hosting tĩnh khác:** đưa nội dung `dist/` vào thư mục website.

Sau khi đổi tên miền, cập nhật URL `og:image` trong `dist/index.html`. Nút chia sẻ tự dùng tên miền đang mở.

Netlify/Vercel là cấu hình để thuận tiện chuyển hosting; bản demo hiện tại dùng Sites. Không có đồng bộ tự động giữa GitHub và Sites.

## Kỹ thuật

- Three.js 0.186.1, WebGLRenderer, InstancedMesh để giảm số lần vẽ.
- Các cánh hoa dựng bằng hình học có màu theo đỉnh, đường hoa dùng TubeGeometry.
- Camera theo CatmullRomCurve3; bấm hoa bằng raycasting.
- Tab ẩn không làm hành trình tiếp tục chạy; giới hạn mật độ điểm ảnh trên điện thoại.
- Hỗ trợ bàn phím và Escape đóng lời chúc.

Chất lượng và tốc độ WebGL phụ thuộc thiết bị. Kiểm tra bằng trình duyệt giả lập không thay thế kiểm thử trên mọi điện thoại thực.

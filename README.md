# Nở vì bạn · 20/10

Một hành trình xuyên qua cánh đồng hoa dưới trời hoàng hôn. Camera tiến dọc đường cong dài, từng vùng hoa vàng, cam và hồng mọc lên khi camera đến gần. Cuối hành trình, tấm thiệp 20/10 **dành chung cho mọi cô gái** tự hiện ra.

**Website:** https://gui-ban-mot-doa-hoa-20-10.yvonne821952.chatgpt.site

## Trải nghiệm

- Khoảng 35 giây từ mở đầu đến khi camera dừng: mở đầu 2,4 giây, di chuyển 30 giây, hoa cuối đường nở thêm 2,6 giây.
- Camera phối cảnh đi 108 đơn vị trong không gian cảnh, theo đường cong nhẹ; hoa đi từ xa đến gần rồi lướt ra hai bên.
- Mỗi vùng cây mọc theo khoảng cách đến camera. Thân và lá vươn lên trước, cánh hoa hiện dần sau.
- Camera tăng tốc, đi đều, giảm tốc về 0 và nâng nhẹ góc nhìn ở cuối đường; thiệp xuất hiện sau khi dừng.
- Thiệp có hiệu ứng nâng lên và mở vào khung hình. Có thể đóng thiệp để ngắm hoa và chạm để đọc lại.
- Tạm dừng, tiếp tục, bỏ qua hoặc xem lại hành trình.
- Sao chép/chia sẻ link trang qua trình chia sẻ của thiết bị khi được hỗ trợ.
- Không nhập tên, không thu thập dữ liệu, không có tài khoản hay backend.
- Chế độ giảm chuyển động hiển thị ngay cánh đồng và lời chúc. Thiết bị không có WebGL vẫn xem được lời chúc với ảnh cánh đồng thay thế.

Hình ảnh được tạo bằng imagegen tích hợp theo ảnh tham chiếu cánh đồng hoàng hôn của người dùng. Trải nghiệm dùng **camera 3D và các cụm hoa dạng ảnh có nền trong suốt** với WebGL/Three.js. Cây có vị trí cố định trên mặt đất, xoay hướng mặt ảnh về camera, vươn lên và đung đưa bằng shader. Núi và trời là ảnh hậu cảnh. Đây là cảnh đồ họa dùng chất liệu ảnh AI, không phải video quay thật; không gọi dịch vụ AI khi người xem mở trang.

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
  garden.js        Đường bay 3D, cây theo vị trí, hiệu ứng mọc khi tới gần
  assets/          Three.js, font, ảnh dự phòng, icon và giấy phép
server.mjs         Server xem thử trên máy
netlify.toml       Publish directory: dist
vercel.json        Output directory: dist
ASSETS.md          Nguồn tài nguyên
```

Trong `dist/garden.js`, chỉnh `DURATION` để đổi thời gian di chuyển, `DISTANCE` để đổi độ dài đường bay, `path()` để đổi đường cong, `SETTLE` để đổi thời gian hoa nở ở điểm đến. Khoảng cách mọc nằm trong vertex shader của `flowerMaterial`. Lời chúc nằm trực tiếp trong `dist/index.html`.

## Hosting

Website tĩnh, thư mục xuất bản **`dist`**, không có bước build.

- **Netlify:** import repository, publish directory `dist`; có sẵn `netlify.toml`.
- **Vercel:** import repository, Framework Preset **Other**, output directory **dist**, không cần build command.
- **Hosting tĩnh khác:** đưa nội dung `dist/` vào thư mục website.

Sau khi đổi tên miền, cập nhật URL `og:image` trong `dist/index.html`. Nút chia sẻ tự dùng tên miền đang mở.

Netlify/Vercel là cấu hình để thuận tiện chuyển hosting; bản demo hiện tại dùng Sites. Không có đồng bộ tự động giữa GitHub và Sites.

## Kỹ thuật

- Three.js 0.186.1, PerspectiveCamera và InstancedBufferGeometry; cảnh chỉ cần ba lượt vẽ.
- 15.840 cụm hoa trên toàn vùng cảnh desktop, 9.620 cụm khi khởi tạo trên điện thoại; mỗi cụm gồm nhiều bông. Chỉ các cụm trong tầm nhìn được hiển thị.
- Shader chạy hiệu ứng mọc theo khoảng cách, gió và phối cảnh mỗi khung hình. Camera dùng tăng/giảm tốc cosine với vận tốc và gia tốc liên tục; cả hai bằng 0 ở hai đầu.
- Không cập nhật hàng nghìn ma trận cây bằng JavaScript theo từng khung hình.
- Tab ẩn không làm hành trình tiếp tục chạy; giới hạn mật độ điểm ảnh trên điện thoại.
- Hỗ trợ bàn phím và Escape đóng lời chúc.

Chất lượng và tốc độ WebGL phụ thuộc thiết bị. Kiểm tra bằng trình duyệt giả lập không thay thế kiểm thử trên mọi điện thoại thực.

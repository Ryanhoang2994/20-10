# Nở vì bạn · Một vùng đất hoa · 20/10

Một vùng đất hoa đào 3D trải rộng trên thảm cỏ và những triền đồi, với hoàng hôn, cánh hoa rơi và ánh sáng lấp lánh. Camera bay thấp theo một lối uốn lượn giữa các khóm hoa dày. Các nhành đào vươn lên rồi nở theo thời điểm camera đến từng vùng; lớp hoa thấp lấp các khoảng trống bên dưới tán. Cảnh chiếm toàn màn hình; khi hoa nở xong, lời chúc ngắn và nút mở thiệp xuất hiện ở giữa.

**Website:** https://gui-ban-mot-doa-hoa-20-10.yvonne821952.chatgpt.site

## Trải nghiệm

- Khoảng 32 giây: mở đầu 1,8 giây, camera di chuyển và hoa nở trong 28 giây, dừng cảnh 2 giây rồi mới hiện lời chúc.
- Các cụm đào mọc từ mặt đất, với thân, cành, nụ rồi hoa năm cánh.
- Camera đi theo đường cong giữa các khóm, giữ độ cao khoảng 1,38 m trên địa hình, rồi nâng nhẹ đến 1,75 m ở cuối. Tốc độ về 0 trước khi hiện thiệp. Không có chữ lời chúc che cảnh trong lúc bay.
- **Mở lời chúc:** mở tấm thiệp dành chung cho mọi cô gái ngày 20/10.
- **Nhận thêm yêu thương:** lần lượt mở sáu lời chúc khác nhau.
- **Thêm chút lấp lánh:** tăng ánh sáng của các hạt trong vườn.
- **Kéo trên cảnh:** xoay góc nhìn. **Chạm trên cảnh:** tạo lấp lánh.
- Tạm dừng, tiếp tục, bỏ qua hoặc xem lại hành trình.
- Sao chép/chia sẻ link qua trình chia sẻ của thiết bị khi được hỗ trợ.
- Không nhập tên, không thu thập dữ liệu, không có tài khoản hay backend.
- Chế độ giảm chuyển động hiển thị ngay cảnh hoàn chỉnh và nút mở thiệp.
- Thiết bị không có WebGL dùng ảnh chụp cảnh đã dựng; vẫn mở thiệp và nhận thêm lời chúc.

Đây là cảnh 3D bằng mã với Three.js/WebGL. Tài nguyên có sẵn trong bộ nguồn; không gọi AI khi mở website.

## Chạy trên máy

Cần Node.js 20 trở lên:

```sh
node server.mjs
```

Mở http://127.0.0.1:4173. Không cần cài thêm gói; thư viện Three.js, font và ảnh lưu trong `dist/assets/`.

```sh
node --check dist/app.js
node --check dist/garden.js
```

## Cấu trúc và chỉnh sửa

- `dist/index.html`: nội dung, nút điều khiển và thiệp.
- `dist/style.css`: giao diện toàn màn hình, responsive và chế độ giảm chuyển động.
- `dist/app.js`: mở thiệp, chia sẻ, điều khiển; mảng `wishes` chứa sáu lời chúc.
- `dist/garden.js`: địa hình, trồng hoa, cành và hoa, camera, ánh sáng, cánh hoa bay.
- `dist/assets/`: Three.js, font, chất liệu cỏ, ảnh dự phòng, icon và giấy phép.
- `server.mjs`: server xem thử trên máy.
- `netlify.toml`, `vercel.json`: cấu hình thư mục xuất bản.
- `ASSETS.md`, `IMAGE-PROMPTS.md`: nguồn và quy trình tạo tài nguyên.

Trong `garden.js`, `terrainHeight()` tạo triền đất; `shrubs` bố trí 511 cụm đào dày và lớp hoa thấp; `flowersOn()` bố trí bông trên cành; `growMaterial()` xử lý nở trên GPU. `DURATION` và `render()` điều khiển thời gian và đường camera.

## Kỹ thuật

- Three.js 0.186.1, tài nguyên được lưu cục bộ.
- 30.660 bông trên desktop, 20.440 bông khi khởi tạo trên điện thoại; cùng 511 cụm và cách bố trí địa hình.
- Hoa gần có cánh cong và nhụy; hoa xa dùng hình học đơn giản hơn, vẫn giữ hình năm cánh.
- Các cụm hoa được chia theo vị trí và loại bỏ khỏi lượt vẽ khi nằm ngoài góc nhìn.
- Thân/cành gộp thành một mesh; hoa, nụ và cỏ dùng instancing.
- 750/400 hạt sáng và 64 cánh hoa rơi; không cập nhật lại hàng nghìn ma trận hoa mỗi khung hình.
- Camera dùng đường cong Catmull–Rom theo độ dài quãng đường và tăng/giảm tốc mềm; độ cao bám theo địa hình. Tab ẩn dừng hành trình; giới hạn mật độ điểm ảnh.
- Hỗ trợ bàn phím và Escape đóng thiệp. Chất lượng/tốc độ WebGL phụ thuộc thiết bị.

## Hosting

Website tĩnh, thư mục xuất bản **`dist`**, không có bước build.

- **Netlify:** import repository, publish directory `dist`.
- **Vercel:** import repository, Framework Preset **Other**, output directory **dist**, không cần build command.
- **Hosting tĩnh khác:** đưa nội dung `dist/` vào thư mục website.

Sau khi đổi tên miền, cập nhật URL `og:image` trong `dist/index.html`. Nút chia sẻ tự dùng tên miền đang mở.

Bản demo hiện tại dùng Sites. Không có đồng bộ tự động giữa GitHub và Sites.

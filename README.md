# Hướng dẫn Cài đặt, Triển khai và Sử dụng Dự án

Tài liệu này hướng dẫn cách thiết lập và chạy toàn bộ hệ thống xác thực văn bằng trên hệ thống mới

Phần 1: Yêu cầu Môi trường (Cài đặt một lần)

Để chạy dự án, máy tính cần được cài đặt các phần mềm sau:
1.	Node.js: Tải phiên bản LTS từ nodejs.org. Đây là nền tảng để chạy các công cụ của dự án.
2.	Ganache: Tải từ trang chủ Truffle Suite. Đây là blockchain giả lập trên máy tính cá nhân.
3.	MySQL & Workbench: Tải MySQL Community Server và MySQL Workbench từ trang chủ MySQL. Đây là hệ quản trị cơ sở dữ liệu. (Hoặc bạn có thể dùng XAMPP để có cả hai).
4.	Trình duyệt có MetaMask: Sử dụng Chrome hoặc Firefox và cài đặt tiện ích MetaMask.
5.	Trình soạn thảo mã nguồn: Ví dụ: Visual Studio Code.

Phần 2: Cài đặt Dự án
1.	Sao chép thư mục dự án: Sao chép toàn bộ thư mục dự án của bạn (ví dụ: new hardhat) sang máy tính mới.
2.	Mở Terminal: Mở một cửa sổ dòng lệnh (CMD hoặc PowerShell) ngay tại thư mục gốc của dự án.
3.	Cài đặt các gói cần thiết: Chạy lệnh sau để tải về tất cả các thư viện mà dự án cần (Hardhat, Ethers, Express, Tailwind,...).
4.	npm install

Phần 3: Thiết lập Cơ sở dữ liệu
1.	Mở MySQL Workbench và tạo một kết nối đến máy chủ MySQL của bạn.
2.	Tạo cơ sở dữ liệu mới (Schema): Đặt tên là certichain_db.
3.	Tạo bảng universities: Mở một tab truy vấn mới, chọn schema certichain_db và chạy câu lệnh SQL sau:
4.	CREATE TABLE universities (
5.	    id INT AUTO_INCREMENT PRIMARY KEY,
6.	    name VARCHAR(255) NOT NULL,
7.	    walletAddress VARCHAR(42) NOT NULL UNIQUE,
8.	    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
9.	);

Phần 4: Thiết lập Blockchain
1.	Khởi động Ganache: Mở ứng dụng Ganache và chọn "Quickstart" để tạo một không gian làm việc mới.
2.	Biên dịch Hợp đồng: Trong terminal tại thư mục dự án, chạy lệnh:
3.	npx hardhat compile
4.	Triển khai Hợp đồng: Chạy lệnh sau để đưa hợp đồng thông minh của bạn lên mạng Ganache đang chạy.
5.	npx hardhat run scripts/deploy.js --network localhost
6.	Lưu lại Địa chỉ và ABI:
o	Lệnh trên sẽ trả về một địa chỉ hợp đồng mới. Hãy sao chép và lưu lại nó.
o	Mở file artifacts/contracts/Certificate.sol/Certificate.json, tìm đến khóa "abi" và sao chép toàn bộ nội dung của mảng đó.
Phần 5: Cấu hình Dự án

Đây là bước quan trọng để kết nối các thành phần lại với nhau.
1.	Cập nhật các file JavaScript: Mở các file sau: addsite.js, dashboard.js, login.js, search.js.
o	Tìm đến 2 dòng đầu tiên và dán Địa chỉ hợp đồng MỚI và ABI MỚI mà bạn vừa lấy được ở Phần 4.
2.	const contractAddress = "DÁN_ĐỊA_CHỈ_MỚI_VÀO_ĐÂY";
3.	const contractABI = [ /* DÁN_NỘI_DUNG_ABI_MỚI_VÀO_ĐÂY */ ];

4.	Cập nhật file server.js:
o	Mở file server.js.
o	Tìm đến đối tượng dbConfig và đảm bảo user và password khớp với thiết lập MySQL trên máy tính mới.
Phần 6: Chạy Dự án
Để hệ thống hoạt động, bạn cần mở và để chạy HAI cửa sổ terminal riêng biệt.
•	Terminal 1 - Chạy Máy chủ Backend:
•	node server.js

Bạn sẽ thấy thông báo: Backend server is running on http://localhost:3000
•	Terminal 2 - Chạy Tailwind CSS:
•	npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch

Cửa sổ này sẽ theo dõi và tự động cập nhật file CSS cho bạn.
Sau khi cả hai terminal đã chạy, bạn có thể mở các file .html (ví dụ: index.html) bằng trình duyệt để bắt đầu sử dụng.
Phần 7: Quy trình sử dụng mẫu
1.	Admin Thêm trường: Mở file addsite.html. Kết nối bằng ví của người đã triển khai hợp đồng (ví Admin). Thêm một trường đại học mới với tên và địa chỉ ví của trường đó.
2.	Trường Đăng nhập: Mở file login.html. Chọn vai trò "Trường Đại học" và nhấn nút đăng nhập. Kết nối bằng đúng ví đã được Admin cấp quyền ở bước trên. Hệ thống sẽ tự động chuyển đến trang dashboard.html.
3.	Trường Cấp bằng: Trên trang dashboard.html, vào mục "Cấp phát Văn bằng", điền thông tin và cấp một văn bằng mới.
4.	Công chúng Tra cứu: Mở file search.html. Bất kỳ ai cũng có thể vào đây, chọn đúng trường và nhập ID của văn bằng vừa được cấp để xác thực.

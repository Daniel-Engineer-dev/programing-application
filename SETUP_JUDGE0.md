# Hướng Dẫn Thiết Lập Máy Chủ Biên Dịch Code Judge0 CE

Tài liệu này hướng dẫn cách cài đặt và vận hành hệ thống thực thi code **Judge0 Community Edition (CE)** để chạy song song hoặc thay thế Piston API trong dự án.

---

## 1. Thiết Lập Môi Trường Phát Triển (Chạy local bằng Docker)

Để chạy thử nghiệm Judge0 ngay trên máy tính cá nhân của bạn, yêu cầu máy đã cài đặt **Docker** và **Docker Compose**.

### Bước 1: Tải xuống tệp cấu hình Judge0 CE
Tải phiên bản ổn định v1.13.0 và giải nén:
```bash
wget https://github.com/judge0/judge0/releases/download/v1.13.0/judge0-v1.13.0.tar.gz
tar -xvf judge0-v1.13.0.tar.gz
cd judge0-v1.13.0
```

### Bước 2: Tạo các tệp cấu hình
Sao chép cấu hình mẫu từ thư mục giải nén:
```bash
cp templates/judge0.conf judge0.conf
cp templates/docker-compose.yml docker-compose.yml
```

### Bước 3: Khởi động Judge0 ở chế độ chạy ngầm
```bash
docker compose up -d
```
Lệnh này sẽ khởi động 4 dịch vụ:
* `judge0-server`: API chính, lắng nghe ở cổng `2358`.
* `judge0-worker`: Trình chấm bài và biên dịch code chạy trong sandbox.
* `judge0-redis`: Hàng đợi tác vụ (Message Queue).
* `judge0-db`: Cơ sở dữ liệu PostgreSQL.

### Bước 4: Kiểm tra trạng thái hoạt động
Gửi yêu cầu HTTP để kiểm tra xem hệ thống đã hoạt động chưa:
```bash
curl -s http://localhost:2358/system_info
```
Nếu nhận về chuỗi JSON chứa thông tin hệ thống, Judge0 đã sẵn sàng hoạt động tại `http://localhost:2358`.

---

## 2. Thiết Lập Môi Trường Production (Chạy 24/24 trên VPS)

Khi triển khai thực tế trên máy chủ VPS (Ubuntu Server 22.04 LTS, cấu hình đề nghị: 2 vCPU, 4GB RAM), thực hiện theo quy trình sau:

### Bước 1: Cài đặt Docker trên VPS
```bash
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### Bước 2: Khởi chạy dịch vụ Judge0
Thực hiện lại các lệnh tải xuống và khởi động như ở mục 1 tại VPS. Docker sẽ tự động cấu hình `restart: always` giúp hệ thống tự khởi động lại khi VPS bị reboot hoặc tiến trình bị crash.

### Bước 3: Cấu hình Nginx làm Reverse Proxy & Cấp SSL Certbot (HTTPS)
Cài đặt Nginx và Certbot:
```bash
sudo apt-get install nginx certbot python3-certbot-nginx -y
```

Tạo cấu hình ảo cho Nginx tại `/etc/nginx/sites-available/judge0`:
```nginx
server {
    listen 80;
    server_name compiler.yourdomain.com; # Điền subdomain của bạn ở đây

    location / {
        proxy_pass http://localhost:2358;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Kích hoạt và khởi động lại Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/judge0 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Cấp chứng chỉ bảo mật SSL miễn phí:
```bash
sudo certbot --nginx -d compiler.yourdomain.com
```

---

## 3. Cấu Hình Ứng Dụng Next.js Kết Nối Judge0

Mở tệp cấu hình môi trường `.env` ở thư mục gốc của dự án này và cấu hình biến `JUDGE0_API_URL`:

* **Nếu chạy local**:
  ```env
  JUDGE0_API_URL=http://localhost:2358
  ```
* **Nếu chạy production**:
  ```env
  JUDGE0_API_URL=https://compiler.yourdomain.com
  ```

---

## 4. Danh Sách ID Ngôn Ngữ Judge0 CE Hỗ Trợ
Bộ định tuyến Next.js đã cấu hình sẵn bản đồ ánh xạ ID cho các ngôn ngữ chính của dự án:

| Ngôn ngữ | ID Judge0 | Phiên bản mặc định |
|---|---|---|
| **C++ (GCC)** | `54` (hoặc `75`) | GCC 9.2.0 / GCC 14.1.0 |
| **Java (OpenJDK)** | `62` (hoặc `91`) | OpenJDK 13.0.1 / OpenJDK 21 |
| **JavaScript (NodeJS)**| `63` (hoặc `93`) | NodeJS 12.14.0 / NodeJS 20.17.0 |
| **Python** | `71` (hoặc `92`) | Python 3.8.1 / Python 3.12.5 |

---

## 5. Khắc Phục Sự Cố Thường Gặp (Troubleshooting)

### Lỗi 401 (Unauthorized) từ Judge0
* **Nguyên nhân**: Judge0 CE của bạn cấu hình bắt buộc truyền API Key hoặc client Next.js gửi thừa header `Authorization` của ứng dụng người dùng sang Judge0.
* **Cách sửa**: 
  * Hãy cấu hình `http = axios.create()` cô lập (đã cập nhật sẵn trong mã nguồn Next.js của dự án).
  * Nếu sử dụng dịch vụ trả phí/RapidAPI, đảm bảo bạn đã điền đúng `JUDGE0_API_KEY` và `JUDGE0_API_HOST` vào tệp `.env`.

### Lỗi 429 (Too Many Requests)
* **Nguyên nhân**: Bạn đang dùng public API key thử nghiệm hoặc gói dịch vụ giới hạn số lượng request đồng thời.
* **Cách sửa**: Cần tự host máy chủ riêng bằng Docker như hướng dẫn tại phần 1 và 2 để toàn quyền sử dụng không bị giới hạn lượt gọi.

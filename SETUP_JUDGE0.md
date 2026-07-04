# Hướng Dẫn Thiết Lập Máy Chủ Biên Dịch Code Judge0 CE

Tài liệu này hướng dẫn cách cài đặt và vận hành hệ thống thực thi code **Judge0 Community Edition (CE)** để chạy song song hoặc thay thế Piston API trong dự án.

---

## 1. Thiết Lập Môi Trường Phát Triển (Chạy local bằng Docker)

Để chạy thử nghiệm Judge0 ngay trên máy tính cá nhân của bạn, yêu cầu máy đã cài đặt **Docker** và **Docker Compose**.

### Bước 1: Tải xuống tệp cấu hình Judge0 CE
Tải phiên bản ổn định v1.13.0 và giải nén (file phát hành là **`.zip`**, cần `unzip`):
```bash
sudo apt-get install -y unzip
wget https://github.com/judge0/judge0/releases/download/v1.13.0/judge0-v1.13.0.zip
unzip judge0-v1.13.0.zip
cd judge0-v1.13.0
```
> Thư mục giải nén đã có sẵn `judge0.conf` và `docker-compose.yml` ở gốc (không còn thư mục `templates/`), nên có thể bỏ qua bước sao chép cấu hình.

### Bước 2: Đặt mật khẩu bắt buộc cho Redis & PostgreSQL
Bản v1.13.0 **bắt buộc** phải đặt 2 mật khẩu này, nếu để trống các container sẽ crash:
```bash
sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$(openssl rand -hex 16)/" judge0.conf
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 16)/" judge0.conf
```

### Bước 3: Khởi động Judge0 ở chế độ chạy ngầm
Khởi động DB + Redis trước ~10 giây rồi mới bật toàn bộ (tránh lỗi race condition):
```bash
docker compose up -d db redis
sleep 12
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

## 2. Thiết Lập Môi Trường Production Trên VPS Oracle Cloud (Chạy 24/24 - Miễn Phí)

Oracle Cloud Infrastructure (OCI) cung cấp gói **Always Free** rất mạnh, đủ sức chạy Judge0 24/24 hoàn toàn miễn phí. Phần này hướng dẫn chi tiết từ lúc tạo máy chủ đến khi có API HTTPS hoạt động.

> ⚠️ **Lưu ý quan trọng về kiến trúc CPU (đọc trước khi tạo máy):**
> - Judge0 CE chỉ phát hành image Docker cho kiến trúc **amd64 (x86-64)**. Image **không chạy** trên chip ARM.
> - Gói Always Free của Oracle có 2 loại:
>   - **VM.Standard.A1.Flex (ARM Ampere)** — mạnh (tối đa 4 OCPU / 24GB RAM) nhưng là **ARM → KHÔNG dùng được cho Judge0**.
>   - **VM.Standard.E2.1.Micro (AMD x86)** — 1 OCPU / 1GB RAM, kiến trúc **amd64 → dùng được**.
> - ➡️ **Bắt buộc chọn shape `VM.Standard.E2.1.Micro` (AMD)**. Vì máy chỉ có 1GB RAM, ta sẽ thêm swap ở Bước 3 để Judge0 chạy ổn định.

### Bước 1: Tạo VPS (Instance) trên Oracle Cloud

1. Đăng nhập [cloud.oracle.com](https://cloud.oracle.com) → menu **≡** → **Compute** → **Instances** → **Create Instance**.
2. **Name**: đặt tùy ý, ví dụ `judge0-server`.
3. **Image and shape** → nhấn **Edit**:
   - **Image**: chọn **Canonical Ubuntu 22.04**.
   - **Shape**: chọn tab **Ampere**? → **KHÔNG**. Chuyển sang **Specialty and previous generation** → chọn **VM.Standard.E2.1.Micro** (AMD, Always Free eligible).
4. **Networking**: giữ mặc định (tự tạo VCN mới), đảm bảo tick **Assign a public IPv4 address**.
5. **Add SSH keys**: chọn **Generate a key pair for me** và **tải cả private key + public key** về máy (giữ kỹ private key), hoặc dán public key SSH sẵn có của bạn.
6. Nhấn **Create**. Chờ trạng thái chuyển sang **RUNNING**, ghi lại **Public IP address**.

### Bước 2: Mở cổng mạng (Firewall 2 lớp của Oracle)

Oracle chặn traffic ở **2 tầng** — phải mở cả hai thì HTTP/HTTPS mới vào được.

**2a. Security List (tầng mạng đám mây):**
1. Vào instance vừa tạo → mục **Primary VNIC** → nhấn vào tên **Subnet**.
2. Chọn **Security Lists** → nhấn vào **Default Security List**.
3. **Add Ingress Rules** — thêm 2 luật sau:

   | Source CIDR | IP Protocol | Destination Port |
   |---|---|---|
   | `0.0.0.0/0` | TCP | `80`  |
   | `0.0.0.0/0` | TCP | `443` |

   (Cổng `22` cho SSH đã được mở sẵn mặc định.)

**2b. Firewall trong Ubuntu (tầng hệ điều hành):** Oracle Ubuntu image mặc định bật `iptables` với một luật **`REJECT`** chặn mọi cổng chưa được cho phép. Điều tối quan trọng: luật `ACCEPT` cho 80/443 **phải nằm TRƯỚC luật REJECT**, nếu không sẽ vô tác dụng. SSH vào máy (xem Bước 3) rồi chạy:
```bash
sudo iptables -I INPUT -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save   # lưu để không mất sau khi reboot
```
> `-I INPUT` (không kèm số thứ tự) chèn luật lên **đầu chuỗi**, đảm bảo luôn đứng trước REJECT. Kiểm tra lại bằng `sudo iptables -L INPUT -n --line-numbers` — 2 dòng ACCEPT cho cổng 80/443 phải nằm **trên** dòng `REJECT ... icmp-host-prohibited`.

### Bước 3: Kết nối SSH và cài đặt hệ thống cơ bản

Từ máy tính của bạn (dùng private key đã tải ở Bước 1):
```bash
chmod 600 ./ssh-key.key                       # chỉ cần trên Linux/macOS
ssh -i ./ssh-key.key ubuntu@<PUBLIC_IP>       # user mặc định của Ubuntu image là "ubuntu"
```

Cập nhật hệ thống và **tạo swap 2GB** (bù cho việc máy chỉ có 1GB RAM):
```bash
sudo apt-get update && sudo apt-get upgrade -y

sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Bước 4: Kích hoạt cgroup v1 (BẮT BUỘC cho Judge0)

Judge0 dùng `isolate` để chạy sandbox và **yêu cầu cgroup v1**, trong khi Ubuntu 22.04 mặc định dùng cgroup v2. Nếu bỏ qua bước này, worker sẽ báo lỗi khi chấm bài.

```bash
sudo sed -i 's/GRUB_CMDLINE_LINUX_DEFAULT="/GRUB_CMDLINE_LINUX_DEFAULT="systemd.unified_cgroup_hierarchy=0 /' /etc/default/grub
sudo update-grub
sudo reboot
```
Sau khi máy khởi động lại (chờ ~1 phút), SSH vào lại và kiểm tra:
```bash
stat -fc %T /sys/fs/cgroup    # phải trả về "tmpfs" (cgroup v1). Nếu trả "cgroup2fs" là chưa đạt.
```

### Bước 5: Cài đặt Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
docker run hello-world        # kiểm tra Docker chạy được
```

### Bước 6: Khởi chạy dịch vụ Judge0

Thực hiện lại các lệnh tải xuống và khởi động như ở **Mục 1** (Bước 1 → Bước 3) ngay trên VPS:
```bash
sudo apt-get install -y unzip
wget https://github.com/judge0/judge0/releases/download/v1.13.0/judge0-v1.13.0.zip
unzip judge0-v1.13.0.zip
cd judge0-v1.13.0
# Đặt mật khẩu bắt buộc
sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$(openssl rand -hex 16)/" judge0.conf
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 16)/" judge0.conf
# Khởi động
docker compose up -d db redis && sleep 12 && docker compose up -d
```
Docker cấu hình sẵn `restart: always`, giúp Judge0 tự khởi động lại khi VPS reboot hoặc tiến trình crash. Kiểm tra:
```bash
curl -s http://localhost:2358/system_info
```

> 💡 **Bảo mật khuyến nghị:** mở tệp `judge0.conf`, đặt một chuỗi ngẫu nhiên cho `AUTHN_TOKEN` (yêu cầu mọi request phải kèm header `X-Auth-Token`) rồi chạy lại `docker compose up -d`. Nhớ cấu hình token tương ứng ở phía Next.js.

### Bước 7: Cấu hình Nginx làm Reverse Proxy & Cấp SSL Certbot (HTTPS)

Trước tiên, trỏ bản ghi **DNS A** của subdomain (ví dụ `compiler.yourdomain.com`) về **Public IP** của VPS. Sau đó cài Nginx + Certbot:
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

Cấp chứng chỉ bảo mật SSL miễn phí (Certbot tự sửa cấu hình Nginx sang HTTPS và tự động gia hạn):
```bash
sudo certbot --nginx -d compiler.yourdomain.com
```

Sau bước này, API Judge0 đã sẵn sàng tại `https://compiler.yourdomain.com`.

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

### Bài chấm luôn treo ở trạng thái `In Queue` / `Processing` (thường gặp trên Oracle)
* **Nguyên nhân**: VPS đang chạy cgroup v2 nên `isolate` không tạo được sandbox.
* **Cách sửa**: Thực hiện lại **Mục 2 - Bước 4** (bật `systemd.unified_cgroup_hierarchy=0`), kiểm tra `stat -fc %T /sys/fs/cgroup` phải trả về `tmpfs`, rồi chạy `docker compose restart`.

### Lỗi `exec format error` khi khởi động worker
* **Nguyên nhân**: Bạn đã tạo VPS bằng shape **ARM Ampere (A1)**; image Judge0 chỉ hỗ trợ amd64.
* **Cách sửa**: Tạo lại instance với shape AMD **VM.Standard.E2.1.Micro** như hướng dẫn ở **Mục 2 - Bước 1**.

### Truy cập được qua SSH nhưng không mở được `http(s)://` từ trình duyệt
* **Nguyên nhân**: Chưa mở đủ cả 2 tầng firewall của Oracle.
* **Cách sửa**: Kiểm tra lại **Mục 2 - Bước 2** — phải thêm Ingress Rule cổng 80/443 trong **Security List** *và* chạy lệnh `iptables` + `netfilter-persistent save` trong Ubuntu.

# วิธีรัน Chinese App ด้วย Docker

## 📋 ไฟล์ที่สร้างให้:

1. **`docker-compose.yml`** - ตั้งค่า services ทั้งหมด
2. **`Dockerfile`** - สร้าง image สำหรับ Next.js app
3. **`next.config.mjs`** - เพิ่ม `output: 'standalone'`

## 🚀 วิธีใช้งาน:

### 1. Build และรัน (ครั้งแรก):

```bash
# Build images
docker-compose build

# รัน services
docker-compose up -d

# ดู logs
docker-compose logs -f
```

### 2. เข้าใช้งาน:

- **Chinese App**: http://localhost:3000
- **MinIO Console**: http://localhost:9001
  - Username: `admin`
  - Password: `admin12345`

### 3. ตั้งค่า MinIO Bucket (ครั้งแรก):

```bash
# เข้า MinIO container
docker exec -it minio sh

# ตั้งค่า MinIO Client
mc alias set myminio http://localhost:9000 admin admin12345

# สร้าง bucket และตั้งค่า public
mc mb myminio/image
mc anonymous set download myminio/image

# ตั้งค่า CORS
mc admin config set myminio api cors_allow_origin="*"
mc admin service restart myminio

exit
```

### 4. คำสั่งที่ใช้บ่อย:

```bash
# หยุด services
docker-compose down

# หยุดและลบ volumes
docker-compose down -v

# Restart services
docker-compose restart

# ดู logs แบบ real-time
docker-compose logs -f chinese-app

# Rebuild และรันใหม่
docker-compose up -d --build
```

## 🔧 Environment Variables:

แก้ไขใน `docker-compose.yml`:

```yaml
environment:
  - MINIO_ENABLED=true
  - MINIO_ENDPOINT=192.168.1.13 # เปลี่ยนเป็น IP ของคุณ
  - MINIO_PUBLIC_URL=minio.ovenx.shop # Domain สำหรับ download
```

## 📦 Services ที่รัน:

1. **chinese-app** (Port 3000)

   - Next.js application
   - เชื่อมต่อกับ MinIO

2. **minio** (Port 9000, 9001)
   - Object storage สำหรับรูป GIF
   - Console UI ที่ port 9001

## 🌐 Deploy บน Production:

### 1. ใช้ Cloudflare Tunnel:

เพิ่มใน `/etc/cloudflared/config.yml`:

```yaml
ingress:
  - hostname: chinese.ovenx.shop
    service: http://localhost:3000
  - hostname: minio.ovenx.shop
    service: http://localhost:9000
  - hostname: console-minio.ovenx.shop
    service: http://localhost:9001
  - service: http_status:404
```

Restart Cloudflare Tunnel:

```bash
systemctl restart cloudflared
```

### 2. หรือใช้ Nginx Reverse Proxy:

```nginx
server {
    listen 80;
    server_name chinese.ovenx.shop;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 Troubleshooting:

### ปัญหา: Build ล้มเหลว

```bash
# ลบ cache และ build ใหม่
docker-compose build --no-cache
```

### ปัญหา: MinIO เชื่อมต่อไม่ได้

```bash
# ตรวจสอบว่า MinIO รันอยู่
docker-compose ps

# ดู logs
docker-compose logs minio
```

### ปัญหา: รูปไม่แสดง

```bash
# ตรวจสอบ bucket policy
docker exec -it minio sh
mc anonymous get myminio/image
```

## 📊 Monitoring:

```bash
# ดูการใช้ resources
docker stats

# ดูขนาด volumes
docker system df -v
```

## 🔄 Update Application:

```bash
# Pull code ใหม่
git pull

# Rebuild และ restart
docker-compose up -d --build chinese-app
```

---

**หมายเหตุ**:

- MinIO data จะถูกเก็บใน Docker volume `minio-data`
- ถ้าต้องการ backup ให้ backup volume นี้
- สำหรับ production ควรใช้ external MinIO หรือ S3

# วิธีรัน Chinese App ด้วย Docker

## 📋 ไฟล์ที่ใช้:

1. **`docker-compose.yml`** - รัน Chinese App
2. **`Dockerfile`** - Build Next.js app
3. **`.dockerignore`** - ไฟล์ที่ไม่ต้อง copy

## 🚀 วิธีใช้งาน:

### 1. Build และรัน:

```bash
# Build image
docker-compose build

# รัน container
docker-compose up -d

# ดู logs
docker-compose logs -f
```

### 2. เข้าใช้งาน:

- **Chinese App**: http://localhost:9999

### 3. คำสั่งที่ใช้บ่อย:

```bash
# หยุด container
docker-compose down

# Restart
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
  - MINIO_ENDPOINT=192.168.1.13 # IP ของ MinIO server
  - MINIO_PUBLIC_URL=minio.ovenx.shop # Domain สำหรับ download
```

## 🌐 Deploy บน Production:

### ใช้ Cloudflare Tunnel:

เพิ่มใน `/etc/cloudflared/config.yml`:

```yaml
ingress:
  - hostname: chinese.ovenx.shop
    service: http://localhost:9999
  - service: http_status:404
```

Restart Cloudflare Tunnel:

```bash
systemctl restart cloudflared
```

## 🐛 Troubleshooting:

### ปัญหา: Build ล้มเหลว

```bash
# ลบ cache และ build ใหม่
docker-compose build --no-cache
```

### ปัญหา: Port 9999 ถูกใช้งานอยู่

```bash
# ดู process ที่ใช้ port 9999
netstat -ano | findstr :9999

# หรือเปลี่ยน port ใน docker-compose.yml
ports:
  - "8888:3000"  # เปลี่ยนเป็น port อื่น
```

### ปัญหา: MinIO เชื่อมต่อไม่ได้

```bash
# ตรวจสอบว่า MinIO server รันอยู่
curl http://192.168.1.13:9000/minio/health/live

# ดู logs
docker-compose logs chinese-app
```

## 📊 Monitoring:

```bash
# ดูการใช้ resources
docker stats chinese-app

# ดูขนาด image
docker images | grep chinese-app
```

## 🔄 Update Application:

```bash
# Pull code ใหม่
git pull

# Rebuild และ restart
docker-compose up -d --build
```

## 📝 หมายเหตุ:

- App รันที่ port **9999** (ภายนอก) → **3000** (ภายใน container)
- MinIO รันแยกบน server 192.168.1.13
- ข้อมูลจะเชื่อมต่อกับ MinIO ภายนอก
- Google Sheet API ทำงานผ่าน environment variables

## 🎯 Production Checklist:

- [ ] Build และทดสอบ: `docker-compose up -d`
- [ ] ตรวจสอบ logs: `docker-compose logs -f`
- [ ] ทดสอบ upload รูป
- [ ] ตรวจสอบ Google Sheet บันทึกข้อมูล
- [ ] ตั้งค่า Cloudflare Tunnel
- [ ] ทดสอบจาก domain

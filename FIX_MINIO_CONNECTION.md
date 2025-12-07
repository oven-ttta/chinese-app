# วิธีแก้ปัญหา MinIO Upload Timeout

## ปัญหา:

- MinIO อยู่ใน Docker บน server 192.168.1.13
- Next.js รันบน Windows PC ของคุณ
- เชื่อมต่อ minio.ovenx.shop:443 ไม่ได้ (502 Bad Gateway)

## วิธีแก้:

### 1. สร้างไฟล์ `.env.local` ในโฟลเดอร์โปรเจค:

```env
MINIO_ENABLED=true
MINIO_ENDPOINT=192.168.1.13
MINIO_PORT=9000
MINIO_SECURE=false
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin12345
MINIO_BUCKET_NAME=image
```

**สำคัญ**:

- ใช้ IP `192.168.1.13` แทน domain
- Port `9000` (MinIO default port)
- `MINIO_SECURE=false` (ไม่ใช้ HTTPS ใน local network)

### 2. แก้ไข `src/app/api/add/route.js`:

```javascript
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "192.168.1.13",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_SECURE === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "admin",
  secretKey: process.env.MINIO_SECRET_KEY || "admin12345",
});
```

**เปลี่ยนแปลง**:

- เพิ่ม `port` config (ต้องเป็น number)
- ใช้ IP แทน domain
- `useSSL: false` สำหรับ local network

### 3. ตรวจสอบ MinIO Port บน Server:

```bash
# SSH เข้า server
ssh root@192.168.1.13

# ดู port ที่ MinIO expose
docker port minio

# ควรเห็นประมาณนี้:
# 9000/tcp -> 0.0.0.0:9000
# 9001/tcp -> 0.0.0.0:9001
```

### 4. ทดสอบเชื่อมต่อจาก Windows:

```bash
# ใน PowerShell หรือ CMD
curl http://192.168.1.13:9000/minio/health/live

# ถ้าได้ response แสดงว่าเชื่อมต่อได้
```

### 5. Restart Next.js Server:

```bash
# หยุด server (Ctrl+C)
npm run dev
```

## ทางเลือกอื่น (ถ้าวิธีแรกไม่ได้):

### วิธีที่ 2: ใช้ MinIO ผ่าน Reverse Proxy

ถ้า `minio.ovenx.shop` มี reverse proxy (nginx/traefik) ให้:

```env
MINIO_ENDPOINT=minio.ovenx.shop
MINIO_PORT=443
MINIO_SECURE=true
```

แต่ต้องแน่ใจว่า:

- Domain resolve ได้จาก Windows PC
- Reverse proxy forward ไป MinIO ถูกต้อง

### วิธีที่ 3: Upload ผ่าน Server (แนะนำสำหรับ Production)

แทนที่จะ upload จาก Windows → MinIO
ให้ upload จาก Windows → Next.js API → Server → MinIO

แต่ต้องแก้โค้ดให้ API รันบน server เดียวกับ MinIO

## สรุป:

**สำหรับ Development (ตอนนี้)**:

- ใช้ IP `192.168.1.13:9000`
- `useSSL: false`

**สำหรับ Production**:

- ใช้ domain `minio.ovenx.shop:443`
- `useSSL: true`
- ต้องแน่ใจว่า domain resolve ได้

ลองทำตามวิธีที่ 1 ก่อนครับ แล้วบอกผลว่าได้หรือไม่!

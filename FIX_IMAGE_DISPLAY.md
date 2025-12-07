# วิธีแก้ปัญหารูปไม่แสดง

## ตรวจสอบ 3 จุด:

### 1. ตรวจสอบว่า URL ถูกบันทึกใน Google Sheet หรือไม่

เปิด Google Sheet: https://docs.google.com/spreadsheets/d/19J6lDC5t-T1qvOpyO-3hryhClqszLbxwaAPzuejY-1M/edit?gid=2116654352

ดูที่ **Column G (image)** ว่ามี URL แบบนี้หรือไม่:

```
https://minio.ovenx.shop/image/xxx_123456.gif
```

ถ้า **ไม่มี** หรือ **ว่างเปล่า**:

- แสดงว่า Google Apps Script ยังไม่ได้รับข้อมูล
- ต้อง Deploy Google Script ใหม่ (ดูไฟล์ `DEPLOY_GOOGLE_SCRIPT.js`)

### 2. ทดสอบว่า URL เข้าถึงได้หรือไม่

ถ้ามี URL ใน Sheet แล้ว ให้ Copy URL มาลองเปิดในเบราว์เซอร์:

```
https://minio.ovenx.shop/image/test_1234567.gif
```

ถ้า **เปิดไม่ได้** หรือ **403 Forbidden**:

- MinIO bucket ไม่ได้ตั้งค่า public
- รัน command นี้บน server:

```bash
ssh root@192.168.1.13
docker exec -it minio sh
mc alias set myminio http://localhost:9000 admin admin12345
mc anonymous set download myminio/image
exit
exit
```

### 3. ตรวจสอบ Console ในเบราว์เซอร์

กด F12 → Console tab → ดูว่ามี error แบบนี้หรือไม่:

**CORS Error:**

```
Access to image at 'https://minio.ovenx.shop/...' from origin 'http://localhost:9999'
has been blocked by CORS policy
```

**วิธีแก้**: ตั้งค่า CORS บน MinIO

```bash
ssh root@192.168.1.13
docker exec -it minio sh

# ตั้งค่า CORS
mc admin config set myminio api cors_allow_origin="*"
mc admin service restart myminio

exit
exit
```

### 4. ตรวจสอบข้อมูลที่ API ส่ง

เปิด Browser Console (F12) → Network tab → กด "บันทึก" คำใหม่

ดูที่ request `/api/add` → Response → ดูว่า `image` field มี URL หรือไม่:

```json
{
  "success": true,
  "result": {
    "status": "success",
    "data": {
      "char": "test",
      "image": "https://minio.ovenx.shop/image/test_123.gif"  ← ต้องมี!
    }
  }
}
```

ถ้า `image: ""` (ว่างเปล่า):

- MinIO upload ล้มเหลว
- ดู Terminal จะมี error message

## สรุปขั้นตอนแก้ไข:

1. ✅ ตรวจสอบ Google Sheet column G มี URL หรือไม่
2. ✅ ลอง Copy URL ไปเปิดในเบราว์เซอร์
3. ✅ ถ้าเปิดไม่ได้ → ตั้งค่า public policy บน MinIO
4. ✅ ถ้ามี CORS error → ตั้งค่า CORS บน MinIO
5. ✅ Refresh หน้าเว็บ → รูปควรแสดง

## คำสั่งรวม (รันบน server):

```bash
ssh root@192.168.1.13

# เข้า MinIO container
docker exec -it minio sh

# ตั้งค่า MinIO
mc alias set myminio http://localhost:9000 admin admin12345
mc anonymous set download myminio/image
mc admin config set myminio api cors_allow_origin="*"
mc admin service restart myminio

exit
exit
```

หลังจากรันคำสั่งนี้แล้ว รูปควรแสดงได้ครับ!

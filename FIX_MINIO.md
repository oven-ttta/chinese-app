# คำสั่งตรวจสอบและแก้ไข MinIO ใน Docker

## ขั้นตอนที่ 1: เชื่อมต่อ SSH

```bash
ssh root@192.168.1.13
# Password: 1212
```

## ขั้นตอนที่ 2: ตรวจสอบ MinIO Container

```bash
# ดู container ที่รันอยู่
docker ps | grep minio

# ดูรายละเอียด MinIO
docker inspect <container_name_or_id> | grep -A 10 "Env"
```

## ขั้นตอนที่ 3: ตรวจสอบ Bucket

```bash
# เข้าไปใน MinIO container
docker exec -it <minio_container_name> sh

# ใช้ mc (MinIO Client) ตรวจสอบ
mc alias set myminio http://localhost:9000 admin admin1234
mc ls myminio
mc ls myminio/image  # ถ้ามี bucket image
```

## ขั้นตอนที่ 4: สร้าง Bucket และตั้งค่า Public (ถ้ายังไม่มี)

```bash
# สร้าง bucket
mc mb myminio/image

# ตั้งค่า public read policy
mc anonymous set download myminio/image

# ตรวจสอบ policy
mc anonymous get myminio/image
```

## ขั้นตอนที่ 5: ทดสอบ Upload

```bash
# สร้างไฟล์ทดสอบ
echo "test" > test.txt

# Upload ทดสอบ
mc cp test.txt myminio/image/test.txt

# ตรวจสอบ
mc ls myminio/image
```

## ขั้นตอนที่ 6: ตรวจสอบ Network/Port

```bash
# ตรวจสอบว่า MinIO expose port อะไร
docker port <minio_container_name>

# ตรวจสอบว่าเข้าถึงได้จากภายนอกหรือไม่
curl http://192.168.1.13:9000/minio/health/live
```

## ขั้นตอนที่ 7: ตรวจสอบ Logs

```bash
# ดู logs ของ MinIO
docker logs <minio_container_name> --tail 50

# ดู logs แบบ real-time
docker logs -f <minio_container_name>
```

## การแก้ปัญหาที่พบบ่อย

### ปัญหา 1: Bucket ไม่มี

```bash
mc mb myminio/image
mc anonymous set download myminio/image
```

### ปัญหา 2: Permission denied

```bash
# ตรวจสอบ credentials
mc alias set myminio http://localhost:9000 admin admin1234

# หรือถ้า password ผิด ให้ดูจาก docker inspect
docker inspect <container> | grep -i "MINIO_ROOT"
```

### ปัญหา 3: Network ไม่ถึง

```bash
# ตรวจสอบว่า MinIO ฟังที่ port ไหน
netstat -tulpn | grep 9000

# ตรวจสอบ firewall
iptables -L -n | grep 9000
```

## คำสั่งสำคัญสำหรับคุณ

เนื่องจากผมไม่สามารถ SSH เข้าไปได้โดยตรง (Host key verification failed)
คุณต้องทำเองตามขั้นตอนนี้:

1. SSH เข้าไป: `ssh root@192.168.1.13`
2. หา MinIO container: `docker ps | grep minio`
3. เข้า container: `docker exec -it <container_name> sh`
4. สร้าง bucket: `mc mb myminio/image`
5. ตั้ง public: `mc anonymous set download myminio/image`
6. ออกจาก container: `exit`

หลังจากนั้นลอง upload รูปใหม่ จะใช้งานได้แล้วครับ!

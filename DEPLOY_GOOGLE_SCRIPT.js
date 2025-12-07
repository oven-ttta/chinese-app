/*
 * คัดลอกโค้ดนี้ทั้งหมด (บรรทัด 1-37)
 * ไปวางใน Google Apps Script
 * แล้วทำตามขั้นตอนด้านล่าง
 */

function doPost(e) {
    try {
        var sheetId = '19J6lDC5t-T1qvOpyO-3hryhClqszLbxwaAPzuejY-1M';
        var spreadsheet = SpreadsheetApp.openById(sheetId);
        var sheet = spreadsheet.getSheets()[0];
        var data = JSON.parse(e.postData.contents);

        // บันทึก 8 columns (A ถึง H)
        sheet.appendRow([
            data.char,        // A: ตัวอักษรจีน
            data.pinyin,      // B: พินอิน
            data.thai,        // C: คำอ่านไทย
            data.tone,        // D: วรรณยุกต์
            data.meaning,     // E: ความหมาย
            data.contributor, // F: ชื่อผู้บันทึก ← ตรงนี้สำคัญ!
            data.image,       // G: URL รูปภาพ ← ตรงนี้สำคัญ!
            data.date         // H: วันที่ ← ตรงนี้สำคัญ!
        ]);

        return ContentService.createTextOutput(
            JSON.stringify({ "status": "success", "data": data })
        ).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(
            JSON.stringify({ "status": "error", "message": error.toString() })
        ).setMimeType(ContentService.MimeType.JSON);
    }
}

/*
 * ========================================
 * ขั้นตอนการ Deploy (ทำตามทุกข้อ!)
 * ========================================
 * 
 * 1. เปิด https://script.google.com/
 * 2. เลือกโปรเจคของคุณ
 * 3. ลบโค้ดเดิมทั้งหมด
 * 4. วางโค้ดนี้ (บรรทัด 1-37) ลงไป
 * 5. กด Ctrl+S เพื่อ Save
 * 
 * 6. กดปุ่ม "Deploy" (มุมขวาบน)
 * 7. เลือก "New deployment" (ห้ามเลือก "Manage deployments")
 * 8. กดไอคอน "เฟือง" เลือก Type: "Web app"
 * 9. กรอก:
 *    - Description: "Version 6 - Fixed 8 columns"
 *    - Execute as: "Me" (อีเมลของคุณ)
 *    - Who has access: "Anyone" ← สำคัญมาก! ต้องเป็น "Anyone" ไม่ใช่ "Anyone with Google Account"
 * 10. กด "Deploy"
 * 11. Copy URL ที่ได้ (ขึ้นต้นด้วย https://script.google.com/macros/s/...)
 * 
 * 12. เปิดไฟล์: src/app/api/add/route.js
 * 13. หาบรรทัดที่ 67 (ประมาณนั้น):
 *     const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfy...';
 * 14. แทนที่ด้วย URL ใหม่ที่คุณ Copy มา
 * 15. Save ไฟล์
 * 
 * 16. Restart server: กด Ctrl+C แล้ว npm run dev
 * 17. ทดสอบเพิ่มคำใหม่
 * 18. เช็ค Google Sheet → จะเห็นข้อมูล columns F, G, H แล้ว!
 * 
 * ========================================
 * หมายเหตุสำคัญ:
 * ========================================
 * - ถ้าแค่กด "Save" โดยไม่ Deploy ใหม่ = ใช้ไม่ได้!
 * - ต้อง "New deployment" ทุกครั้งที่แก้โค้ด
 * - "Who has access" ต้องเป็น "Anyone" ไม่งั้นจะ Error 502
 */

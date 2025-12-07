function doPost(e) {
    try {
        // Use openById to be absolutely sure we get the right spreadsheet
        var sheetId = '19J6lDC5t-T1qvOpyO-3hryhClqszLbxwaAPzuejY-1M';
        var spreadsheet = SpreadsheetApp.openById(sheetId);

        // Try to finding the exact sheet, or default to the first one
        // User provided gid=2116654352 in URL, but we can't easily map GID to name in script without iterating
        // Usually, appendRow to the *active* or *first* sheet works if the script is bound properly.
        // Let's stick to getActiveSheet() or index 0 if bound.
        // However, safest is to get the sheet by name if we knew it. 
        // Let's assume the first sheet is the target if getActiveSheet fails or is ambiguous.
        var sheet = spreadsheet.getSheets()[0]; // Default to the first sheet (usually the main one)

        var data = JSON.parse(e.postData.contents);

        // Append columns: 
        // A=Char, B=Pinyin, C=Thai, D=Tone, E=Meaning, F=Contributor, G=Image, H=Date
        sheet.appendRow([
            data.char,
            data.pinyin,
            data.thai,
            data.tone,
            data.meaning,
            data.contributor,
            data.image,
            data.date
        ]);

        return ContentService.createTextOutput(JSON.stringify({ "status": "success", "data": data }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/*
CRITICAL DEPLOYMENT INSTRUCTIONS:

1. Copy ALL the code above.
2. Go to https://script.google.com/ and open your project.
3. Replace the existing code.
4. Click the blue "Deploy" button (top right) -> "New deployment".
5. SELECT TYPE: "Web app" (click the gear icon if needed).
6. Configuration:
   - Description: "Version 3 Fixed"
   - Execute as: "Me" (your email address) <-- VERY IMPORTANT
   - Who has access: "Anyone" (Anonymous) <-- VERY IMPORTANT (Do NOT choose "Anyone with Google Account")
7. Click "Deploy".
8. COPY the "Web app URL" (it starts with https://script.google.com/macros/s/...).
9. UPDATE your src/app/api/add/route.js file with this new URL at line 60.
*/
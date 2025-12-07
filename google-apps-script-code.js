function doPost(e) {
    try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var data = JSON.parse(e.postData.contents);
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
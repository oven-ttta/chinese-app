function doPost(e) {
    try {
        var sheetId = '19J6lDC5t-T1qvOpyO-3hryhClqszLbxwaAPzuejY-1M';
        var spreadsheet = SpreadsheetApp.openById(sheetId);
        var sheet = spreadsheet.getSheets()[0];

        // Parse JSON safely
        var data;
        try {
            data = JSON.parse(e.postData.contents);
        } catch (jsonErr) {
            throw new Error("Invalid JSON: " + jsonErr.toString());
        }

        var action = data.action || 'add';

        if (action === 'delete') {
            return deleteRow(sheet, data);
        } else if (action === 'edit') {
            return editRow(sheet, data);
        } else {
            return addRow(sheet, data);
        }

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function addRow(sheet, data) {
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
    return successResponse({ "type": "add", "data": data });
}

function deleteRow(sheet, data) {
    var rowIndex = findRowIndex(sheet, data.originalChar || data.char);

    if (rowIndex === -1) {
        throw new Error("Word not found for delete: " + (data.originalChar || data.char));
    }

    sheet.deleteRow(rowIndex);
    return successResponse({ "type": "delete", "row": rowIndex });
}

function editRow(sheet, data) {
    var rowIndex = findRowIndex(sheet, data.originalChar || data.char);

    if (rowIndex === -1) {
        throw new Error("Word not found for edit: " + (data.originalChar || data.char));
    }

    // Update cells (Column A=1, B=2, etc.)
    sheet.getRange(rowIndex, 1).setValue(data.char);
    sheet.getRange(rowIndex, 2).setValue(data.pinyin);
    sheet.getRange(rowIndex, 3).setValue(data.thai);
    sheet.getRange(rowIndex, 4).setValue(data.tone);
    sheet.getRange(rowIndex, 5).setValue(data.meaning);
    sheet.getRange(rowIndex, 6).setValue(data.contributor);

    if (data.image) sheet.getRange(rowIndex, 7).setValue(data.image);
    // Preserving date usually
    if (data.date) sheet.getRange(rowIndex, 8).setValue(data.date);

    return successResponse({ "type": "edit", "row": rowIndex, "data": data });
}

function findRowIndex(sheet, charToFind) {
    if (!charToFind) return -1;
    var data = sheet.getDataRange().getValues();
    var cleanChar = charToFind.toString().trim();

    // Start from 1 to skip header
    for (var i = 1; i < data.length; i++) {
        var rowChar = data[i][0];
        if (rowChar && rowChar.toString().trim() === cleanChar) {
            return i + 1;
        }
    }
    return -1;
}

function successResponse(payload) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "result": payload }))
        .setMimeType(ContentService.MimeType.JSON);
}
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const sheetId = '19J6lDC5t-T1qvOpyO-3hryhClqszLbxwaAPzuejY-1M';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

        const response = await fetch(csvUrl);
        const csvText = await response.text();

        const rows = parseCSV(csvText);

        // Transform rows to our data format
        // CSV Headers: ตัวอักษรจีน,พินอิน (Pinyin),อ่านว่า,วรรณยุกต์,ความหมาย
        const words = rows.slice(1).map((row, index) => {
            // Ensure row has enough columns
            if (row.length < 5) return null;

            return {
                id: index + 1,
                char: row[0],
                pinyin: row[1],
                thai: row[2],
                tone: row[3],
                meaning: row[4]
            };
        }).filter(item => item !== null && item.char); // Filter out empty or invalid rows

        return NextResponse.json(words);
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

// Simple CSV parser that handles quoted fields
function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++;
            } else {
                // Toggle quotes
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            // End of field
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !insideQuotes) {
            // End of row
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());
                rows.push(currentRow);
            }
            currentRow = [];
            currentField = '';
            // Handle \r\n
            if (char === '\r' && nextChar === '\n') i++;
        } else {
            currentField += char;
        }
    }

    // Add last field/row if exists
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    return rows;
}

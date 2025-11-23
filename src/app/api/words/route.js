import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // 1. Fetch from Google Sheet
        const sheetId = '19J6lDC5t-T1qvOpyO-3hryhClqszLbxwaAPzuejY-1M';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

        let sheetWords = [];
        try {
            const response = await fetch(csvUrl);
            const csvText = await response.text();
            const rows = parseCSV(csvText);

            sheetWords = rows.slice(1).map((row, index) => {
                if (row.length < 5) return null;
                return {
                    id: index + 1,
                    char: row[0],
                    pinyin: row[1],
                    thai: row[2],
                    tone: row[3],
                    meaning: row[4]
                };
            }).filter(item => item !== null && item.char);
        } catch (e) {
            console.error("Error fetching sheet:", e);
        }

        // 2. Return Sheet Data Only
        return NextResponse.json(sheetWords);
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

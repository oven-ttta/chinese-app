import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // 1. Fetch from Google Sheet
        const sheetId = '19J6lDC5t-T1qvOpyO-3hryhClqszLbxwaAPzuejY-1M';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=2116654352`;

        console.log(`[API] Fetching CSV from Google Sheet...`);

        const response = await fetch(csvUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            next: { revalidate: 0 } // Ensure Next.js doesn't cache this fetch deeply
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[API] Google Sheet Error: ${response.status} ${response.statusText}`, text);
            return NextResponse.json(
                { error: `Google Sheet returned ${response.status}: ${text.substring(0, 100)}` },
                { status: response.status }
            );
        }

        const csvText = await response.text();

        if (!csvText || csvText.length === 0) {
            console.error('[API] Received empty CSV');
            return NextResponse.json({ error: 'Received empty data from Google Sheet' }, { status: 500 });
        }

        console.log(`[API] CSV fetched. Length: ${csvText.length}. Parsing...`);

        const rows = parseCSV(csvText);

        const sheetWords = rows.slice(1).map((row, index) => {
            if (!row || row.length < 5) return null;
            return {
                id: index + 1,
                char: row[0]?.trim() || '',
                pinyin: row[1]?.trim() || '',
                thai: row[2]?.trim() || '',
                tone: row[3]?.trim() || '',
                meaning: row[4]?.trim() || '',
                contributor: row[5]?.trim() || '',
                strokeOrderGifUrl: row[6]?.trim() || '',
                date: row[7]?.trim() || ''
            };
        }).filter(item => item !== null && item.char);

        console.log(`[API] Successfully parsed ${sheetWords.length} words.`);
        return NextResponse.json(sheetWords);

    } catch (error) {
        console.error('[API] Critical Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message, stack: error.stack },
            { status: 500 }
        );
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

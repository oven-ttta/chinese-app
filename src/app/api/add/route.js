import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'local_words.json');

export async function POST(request) {
    try {
        const body = await request.json();
        const { char, pinyin, thai, tone, meaning } = body;

        if (!char || !pinyin || !thai || !meaning) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure directory exists
        const dir = path.dirname(dataFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Read existing data
        let words = [];
        if (fs.existsSync(dataFilePath)) {
            const fileContent = fs.readFileSync(dataFilePath, 'utf8');
            try {
                words = JSON.parse(fileContent);
            } catch (e) {
                console.error("Error parsing local words:", e);
                words = [];
            }
        }

        // Create new word object
        // Generate a unique ID (using timestamp)
        const newWord = {
            id: `local_${Date.now()}`,
            char,
            pinyin,
            thai,
            tone: tone || '',
            meaning
        };

        // Add to array
        words.push(newWord);

        // Save back to file
        fs.writeFileSync(dataFilePath, JSON.stringify(words, null, 2));

        return NextResponse.json({ success: true, word: newWord });
    } catch (error) {
        console.error('Error saving word:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

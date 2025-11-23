import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { char, pinyin, thai, tone, meaning } = body;

        if (!char || !pinyin || !thai || !meaning) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqUzv6hfUgEdDvacvKCKOxQ742J01JMnk1YhiN601u2HEOLuEnofyhNToqgXmeZuUvZw/exec';

        if (GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return NextResponse.json({ error: 'Please configure the Google Script URL in src/app/api/add/route.js' }, { status: 500 });
        }

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ char, pinyin, thai, tone, meaning }),
        });

        if (!response.ok) {
            throw new Error('Failed to send data to Google Sheet');
        }

        const result = await response.json();

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Error saving word:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

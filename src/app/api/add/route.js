import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { char, pinyin, thai, tone, meaning, contributor, date } = body;

        // Validation for required fields
        if (!char || !pinyin || !thai || !meaning) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // We don't handle file uploads here anymore.
        // Frontend will generate stroke order URL dynamically from 'char'.
        // We might still send an empty string or the dynamic URL to Google Sheets if it expects an 'image' column.

        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhHw0FhGw32Vjp_kAu3WZX5b-QEYvLxKoZFoDEyN2MwNLJ5O7d9cL9v_P0WkIni4lOaA/exec';

        if (GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return NextResponse.json({ error: 'Please configure Google Script URL' }, { status: 500 });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        try {
            // We still pass 'image' as empty string or potentially the generated URL if we wanted to persist it.
            // But for now, let's pass a placeholder or empty since the frontend handles logic.
            // To ensure compatibility with existing sheet structure, we send an empty string for local image URL.
            const payload = {
                char,
                pinyin,
                thai,
                tone,
                meaning,
                contributor,
                image: '', // No uploaded image
                date
            };

            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Google Sheet error: ${response.status}`);
            }

            const result = await response.json();
            return NextResponse.json({ success: true, result });

        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error('Google error:', fetchError.message);
            return NextResponse.json({
                error: 'Failed to save to Google Sheet',
                details: fetchError.message
            }, { status: 502 });
        }
    } catch (error) {
        console.error('API error:', error.message);
        return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
    }
}

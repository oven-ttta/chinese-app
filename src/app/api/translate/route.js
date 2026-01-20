import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const from = searchParams.get('from') || 'th';
    const to = searchParams.get('to') || 'en';

    if (!text) {
        return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    try {
        // Using MyMemory Translation API (free, no API key required)
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
        );

        if (!response.ok) {
            throw new Error('Translation API error');
        }

        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData) {
            return NextResponse.json({
                translatedText: data.responseData.translatedText
            });
        } else {
            throw new Error('Translation failed');
        }
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
}

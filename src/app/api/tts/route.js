import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'zh-CN'; // Default to Chinese if not specified

    if (!text) {
        return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    try {
        // Google Translate TTS URL
        // tl = target language
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`TTS API responded with ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('TTS Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 });
    }
}

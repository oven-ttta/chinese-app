import { NextResponse } from 'next/server';

// In-memory cache so repeated words (reloads, bulk video downloads) skip the
// upstream call. Keyed by from|to|text; bounded to avoid unbounded growth.
const translationCache = new Map();
const MAX_CACHE = 5000;

// Translate via Google's free gtx endpoint (no API key, high limits, ~0.3s).
// Response shape: [[["translated","original",...], ...], ...] — segments in data[0].
async function translateWithGoogle(text, from, to) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) throw new Error(`Google translate HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
        throw new Error('Unexpected Google translate response');
    }
    const translated = data[0].map(seg => (seg && seg[0]) || '').join('').trim();
    if (!translated) throw new Error('Empty Google translation');
    return translated;
}

// Fallback: MyMemory (free tier, but has a daily quota and may return 429).
async function translateWithMyMemory(text, from, to) {
    const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    );
    if (!response.ok) throw new Error(`MyMemory HTTP ${response.status}`);
    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    // MyMemory signals quota errors inside a 200 body, so guard against those.
    if (data.responseStatus !== 200 || !translated || /MYMEMORY WARNING/i.test(translated)) {
        throw new Error('MyMemory translation unavailable');
    }
    return translated.trim();
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const from = searchParams.get('from') || 'th';
    const to = searchParams.get('to') || 'en';

    if (!text) {
        return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const cacheKey = `${from}|${to}|${text}`;
    if (translationCache.has(cacheKey)) {
        return NextResponse.json({ translatedText: translationCache.get(cacheKey) });
    }

    const cacheAndRespond = (translatedText) => {
        translationCache.set(cacheKey, translatedText);
        if (translationCache.size > MAX_CACHE) {
            translationCache.delete(translationCache.keys().next().value);
        }
        return NextResponse.json({ translatedText });
    };

    try {
        return cacheAndRespond(await translateWithGoogle(text, from, to));
    } catch (googleError) {
        console.error('Google translate failed, falling back to MyMemory:', googleError.message);
        try {
            return cacheAndRespond(await translateWithMyMemory(text, from, to));
        } catch (fallbackError) {
            console.error('Translation error:', fallbackError.message);
            return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
        }
    }
}

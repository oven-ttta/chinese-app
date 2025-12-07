import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const char = searchParams.get('char');

    if (!char) {
        return new NextResponse('Character is required', { status: 400 });
    }

    const charCode = char.charCodeAt(0).toString(16).toLowerCase();

    // Fallback strategy: 1. Hanzi5 (Hex) -> 2. WrittenChinese (Hex) -> 3. Bishun (Char)
    // เพิ่มแบบละเอียด
    const sources = [
        `https://www.hanzi5.com/assets/bishun/animation/${charCode}.gif`,
        `https://wp.writtenchinese.com/gif/${charCode}.gif`,
        `https://bishun.shufaji.com/chinese/${encodeURIComponent(char)}.gif`
    ];

    for (const url of sources) {
        try {
            console.log(`[Proxy] Attempting to fetch GIF from: ${url}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout per source

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': new URL(url).origin
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                // Ensure it is actually an image (some sites return 200 OK for HTML errors)
                if (contentType && contentType.includes('image')) {
                    const buffer = await response.arrayBuffer();
                    return new NextResponse(buffer, {
                        headers: {
                            'Content-Type': 'image/gif',
                            // Allow caching to reduce load
                            'Cache-Control': 'public, max-age=86400',
                            'Content-Disposition': `attachment; filename="${encodeURIComponent(char)}_stroke.gif"`
                        }
                    });
                } else {
                    console.warn(`[Proxy] ${url} returned non-image content-type: ${contentType}`);
                }
            } else {
                console.warn(`[Proxy] Failed to fetch from ${url}. Status: ${response.status}`);
            }
        } catch (error) {
            console.warn(`[Proxy] Error fetching from ${url}:`, error.message);
            // Continue to next source
        }
    }

    return new NextResponse('Image not found in any source', { status: 404 });
}

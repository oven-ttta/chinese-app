import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const char = searchParams.get('char');

    if (!char) {
        return NextResponse.json({ error: 'Character is required' }, { status: 400 });
    }

    try {
        // Encode character properly for URL using common standard
        // Some basic testing shows just the char works often, but encoding is safer
        // Try raw char first as the site expects
        const targetUrl = `https://bishun.shufaji.com/chinese/${char}.gif`;

        // Fetch the image from the external source
        const response = await fetch(targetUrl);

        if (!response.ok) {
            // If direct fetch fails, try encoding
            const encodedUrl = `https://bishun.shufaji.com/chinese/${encodeURIComponent(char)}.gif`;
            const response2 = await fetch(encodedUrl);

            if (!response2.ok) {
                return NextResponse.json({ error: 'Failed to fetch GIF from source' }, { status: 404 });
            }
            // Process second response
            const blob = await response2.blob();
            const headers = new Headers();
            headers.set("Content-Type", "image/gif");
            headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(char)}_stroke_order.gif"`);
            return new NextResponse(blob, { status: 200, statusText: "OK", headers });
        }

        // Process first successful response
        const blob = await response.blob();
        const headers = new Headers();
        headers.set("Content-Type", "image/gif");
        headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(char)}_stroke_order.gif"`);

        return new NextResponse(blob, { status: 200, statusText: "OK", headers });

    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import * as Minio from 'minio';

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio.ovenx.shop',
    port: 443,
    useSSL: process.env.MINIO_SECURE === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'admin12345'
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { char, pinyin, thai, tone, meaning, contributor, date, strokeOrderGif } = body;

        // Basic validation (contributor and date are optional on backend to avoid breaking old clients, but enforced on frontend)
        if (!char || !pinyin || !thai || !meaning) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let strokeOrderGifUrl = '';

        // Handle MinIO Upload if GIF is provided
        if (strokeOrderGif && process.env.MINIO_ENABLED === 'true') {
            try {
                // Remove data:image/gif;base64, prefix
                const base64Data = strokeOrderGif.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const bucketName = process.env.MINIO_BUCKET_NAME || 'image';
                const filename = `${pinyin}_${Date.now()}.gif`;

                // Check and create bucket if needed
                const bucketExists = await minioClient.bucketExists(bucketName);
                if (!bucketExists) {
                    await minioClient.makeBucket(bucketName, 'us-east-1'); // Region doesn't matter much for self-hosted
                    // Set public policy if needed, but for now assuming public read or handling via presigned (but user wants public link likely)
                    // Just setting a simple public read policy is complex via code, assuming bucket is public or we construct public URL
                }

                await minioClient.putObject(bucketName, filename, buffer, {
                    'Content-Type': 'image/gif'
                });

                // Construct URL
                strokeOrderGifUrl = `https://${process.env.MINIO_ENDPOINT}/${bucketName}/${filename}`;
                console.log("Uploaded GIF to:", strokeOrderGifUrl);

            } catch (err) {
                console.error("MinIO Upload Error:", err);
                // Continue without image or fail? Continue is safer for now.
            }
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
            body: JSON.stringify({ char, pinyin, thai, tone, meaning, contributor, date, image: strokeOrderGifUrl }),
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

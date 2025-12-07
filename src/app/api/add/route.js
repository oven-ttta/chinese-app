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
                console.log(`Starting MinIO Upload to ${process.env.MINIO_ENDPOINT} (Bucket: ${process.env.MINIO_BUCKET_NAME})`);

                // Remove data:image/gif;base64, prefix
                const base64Data = strokeOrderGif.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const bucketName = process.env.MINIO_BUCKET_NAME || 'image';
                const filename = `${pinyin}_${Date.now()}.gif`;

                // Create a promise for the upload
                const uploadPromise = async () => {
                    // Optimized: Skip bucketExists check for speed. If bucket missing, it will throw.
                    // await minioClient.bucketExists(bucketName);
                    // if (!bucketExists) ...

                    await minioClient.putObject(bucketName, filename, buffer, {
                        'Content-Type': 'image/gif'
                    });
                    return `https://${process.env.MINIO_ENDPOINT}/${bucketName}/${filename}`;
                };

                // Race against a 20-second timeout
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('MinIO upload timed out (>20s)')), 20000)
                );

                strokeOrderGifUrl = await Promise.race([uploadPromise(), timeoutPromise]);
                console.log("Uploaded GIF success:", strokeOrderGifUrl);

            } catch (err) {
                console.error("MinIO Upload Error (Non-fatal, proceeding to save text):", err.message);
                // Fallback: Save without image, but keep other data intact
                strokeOrderGifUrl = '';
            }
        } else {
            console.log("MinIO skipping: Enabled=", process.env.MINIO_ENABLED, "HasGif=", !!strokeOrderGif);
        }

        // REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqUzv6hfUgEdDvacvKCKOxQ742J01JMnk1YhiN601u2HEOLuEnofyhNToqgXmeZuUvZw/exec';

        if (GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return NextResponse.json({ error: 'Please configure the Google Script URL in src/app/api/add/route.js' }, { status: 500 });
        }

        // Add timeout for Google Script Fetch (avoid hanging indefinitely)
        // Set to 15 seconds to allow for script execution time
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Include date and image mapped correctly to columns
                body: JSON.stringify({ char, pinyin, thai, tone, meaning, contributor, image: strokeOrderGifUrl, date }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to send data to Google Sheet: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            return NextResponse.json({ success: true, result });

        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error("Google Script Fetch Error:", fetchError);
            return NextResponse.json({
                error: 'Failed to contact Google Sheet. Please check the URL and deployment.',
                details: fetchError.message
            }, { status: 502 });
        }
    } catch (error) {
        console.error('Error saving word:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

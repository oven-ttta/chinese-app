import { NextResponse } from 'next/server';
import * as Minio from 'minio';

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio.ovenx.shop',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_SECURE === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'admin12345'
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { char, pinyin, thai, tone, meaning, contributor, date, strokeOrderGif } = body;

        if (!char || !pinyin || !thai || !meaning) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let strokeOrderGifUrl = '';

        // Handle MinIO Upload if GIF is provided
        if (strokeOrderGif && process.env.MINIO_ENABLED === 'true') {
            try {
                const base64Data = strokeOrderGif.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');

                const bucketName = process.env.MINIO_BUCKET_NAME || 'image';
                const filename = `${pinyin}_${Date.now()}.gif`;

                const uploadPromise = async () => {
                    const bucketExists = await minioClient.bucketExists(bucketName);

                    if (!bucketExists) {
                        await minioClient.makeBucket(bucketName, 'us-east-1');

                        const policy = {
                            Version: '2012-10-17',
                            Statement: [{
                                Effect: 'Allow',
                                Principal: { AWS: ['*'] },
                                Action: ['s3:GetObject'],
                                Resource: [`arn:aws:s3:::${bucketName}/*`]
                            }]
                        };

                        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
                    }

                    await minioClient.putObject(bucketName, filename, buffer, buffer.length, {
                        'Content-Type': 'image/gif'
                    });

                    // Generate public URL (always use HTTPS for domain)
                    const endpoint = process.env.MINIO_ENDPOINT || 'minio.ovenx.shop';
                    const url = `https://${endpoint}/${bucketName}/${filename}`;
                    return url;
                };

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Upload timeout')), 30000)
                );

                strokeOrderGifUrl = await Promise.race([uploadPromise(), timeoutPromise]);
                console.log('[Upload] Success:', strokeOrderGifUrl);

            } catch (err) {
                console.error('[Upload] Error:', err.message);
                strokeOrderGifUrl = '';
            }
        }

        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhHw0FhGw32Vjp_kAu3WZX5b-QEYvLxKoZFoDEyN2MwNLJ5O7d9cL9v_P0WkIni4lOaA/exec';

        if (GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return NextResponse.json({ error: 'Please configure Google Script URL' }, { status: 500 });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const payload = { char, pinyin, thai, tone, meaning, contributor, image: strokeOrderGifUrl, date };

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

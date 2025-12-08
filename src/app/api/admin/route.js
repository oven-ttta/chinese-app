import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        // Use the SAME Google Script URL as in /api/add
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhHw0FhGw32Vjp_kAu3WZX5b-QEYvLxKoZFoDEyN2MwNLJ5O7d9cL9v_P0WkIni4lOaA/exec';

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        const payload = {
            action,
            ...data
        };

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Google Sheet error: ${response.status}`);
        }

        const result = await response.json();
        return NextResponse.json(result);

    } catch (error) {
        console.error('Admin API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}

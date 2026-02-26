export async function recordHanziVideo(char, size = 500) {
    return new Promise(async (resolve, reject) => {
        if (!window.HanziWriter) {
            await new Promise((res) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
                script.onload = res;
                document.body.appendChild(script);
            });
        }

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        // Don't append to body, keep it off-screen

        const writer = window.HanziWriter.create(canvas, char, {
            width: size,
            height: size,
            padding: size / 30,
            strokeColor: '#000000',
            radicalColor: '#168F16',
            showOutline: true,
            delayBetweenStrokes: 50,
            renderer: 'canvas'
        });

        const stream = canvas.captureStream(30); // 30 FPS
        const recorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });

        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(blob);
        };

        recorder.start();

        try {
            // Animate
            await writer.animateCharacter();
            // Wait a tiny bit at the end
            await new Promise(r => setTimeout(r, 500));
            recorder.stop();
        } catch (err) {
            reject(err);
        }
    });
}

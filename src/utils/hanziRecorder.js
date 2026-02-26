export async function recordHanziVideo(wordObj, width = 720, height = 960) {
    return new Promise(async (resolve, reject) => {
        const { char, pinyin, thai, meaning } = wordObj;

        // 1. Ensure HanziWriter is loaded
        if (!window.HanziWriter) {
            await new Promise((res) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
                script.onload = res;
                document.body.appendChild(script);
            });
        }

        // 2. Setup Audio
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();

        let audioBuffer = null;
        try {
            const audioRes = await fetch(`/api/tts?text=${encodeURIComponent(char)}&lang=zh-CN`);
            const arrayBuffer = await audioRes.arrayBuffer();
            audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (err) {
            console.error("Audio recording failed:", err);
        }

        // 3. Setup Hidden Container in DOM (CRITICAL FOR REQUEST_ANIMATION_FRAME)
        // If not in DOM, browser throttles rAF to 0 or 1 FPS, causing stuttering!
        const recordingContainer = document.createElement('div');
        recordingContainer.style.position = 'fixed';
        recordingContainer.style.top = '-9999px';
        recordingContainer.style.left = '-9999px';
        recordingContainer.style.opacity = '0';
        recordingContainer.style.pointerEvents = 'none';
        document.body.appendChild(recordingContainer);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        recordingContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        const writerSize = width * 0.7; // 70% of width
        const writerCanvas = document.createElement('canvas');
        writerCanvas.width = writerSize;
        writerCanvas.height = writerSize;
        recordingContainer.appendChild(writerCanvas);

        // 4. Mixing Stream
        const canvasStream = canvas.captureStream(60); // 60 FPS
        const combinedStream = new MediaStream();
        canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
        dest.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));

        const recorder = new MediaRecorder(combinedStream, {
            mimeType: 'video/webm'
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        // Cleanup function
        const cleanup = (blob) => {
            document.body.removeChild(recordingContainer);
            if (audioCtx.state !== 'closed') {
                audioCtx.close();
            }
            if (blob) resolve(blob);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            cleanup(blob);
        };

        // 5. Drawing Loop
        let animationRequested = true;
        const render = () => {
            if (!animationRequested) return;

            // 1. Solid White Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // 2. Grey Container Header Box
            const margin = width * 0.1;
            const topMargin = height * 0.1;
            const boxSize = width - (margin * 2);
            ctx.fillStyle = '#f8fafc'; // slate-50
            ctx.beginPath();
            ctx.roundRect(margin, topMargin, boxSize, boxSize, 25);
            ctx.fill();

            // Draw box border (dashed like the website)
            ctx.strokeStyle = '#e2e8f0'; // slate-200
            ctx.lineWidth = 4;
            ctx.stroke();

            // 3. Draw HanziWriter in the box Center
            ctx.drawImage(writerCanvas, margin + (boxSize - writerSize) / 2, topMargin + (boxSize - writerSize) / 2);

            // 4. BIG BOLD CHARACTER
            const textStartY = topMargin + boxSize + 120;
            ctx.fillStyle = '#1e293b'; // slate-800
            ctx.font = `bold ${width * 0.18}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(char, width / 2, textStartY);

            // 5. PINYIN WITH THAI REPRESENTATION (e.g. wǒ - หว่อ)
            ctx.fillStyle = '#334155'; // slate-700
            ctx.font = `bold ${width * 0.08}px Arial, sans-serif`;
            const pinyinText = `${pinyin || ''} - ${thai || ''}`;
            ctx.fillText(pinyinText, width / 2, textStartY + 90);

            // 6. MEANING (e.g. ฉัน, ผม, ดิฉัน -)
            ctx.fillStyle = '#64748b'; // slate-500
            ctx.font = `normal ${width * 0.06}px Arial, sans-serif`;
            ctx.fillText(meaning || '', width / 2, textStartY + 170);

            requestAnimationFrame(render);
        };

        recorder.start();
        render();

        try {
            // Wait slightly before starting
            await new Promise(r => setTimeout(r, 600));

            // Start Audio
            if (audioBuffer) {
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(dest);
                source.start(0);
            }

            const charsToAnimate = char.split('').filter(c => /[\u4E00-\u9FFF]/.test(c));
            if (charsToAnimate.length === 0) {
                await new Promise(r => setTimeout(r, 2000));
            } else {
                for (const c of charsToAnimate) {
                    const writer = window.HanziWriter.create(writerCanvas, c, {
                        width: writerSize,
                        height: writerSize,
                        padding: writerSize / 15,
                        strokeColor: '#333333',
                        radicalColor: '#16a34a', // green-600
                        showOutline: true,
                        strokeAnimationSpeed: 1.5,
                        delayBetweenStrokes: 50,
                        renderer: 'canvas'
                    });

                    await new Promise(r => setTimeout(r, 300));
                    await writer.animateCharacter();
                    await new Promise(r => setTimeout(r, 300)); // Pause between characters
                }
            }

            await new Promise(r => setTimeout(r, 1200)); // Final buffer

            animationRequested = false;
            recorder.stop();
        } catch (err) {
            console.error("Recording error:", err);
            animationRequested = false;
            recorder.stop();
            reject(err);
        }
    });
}

// Resolve the page's font stack (Sarabun for Thai/Latin + Noto Sans SC for the
// Chinese glyph) so the video matches the UI. Falls back to a Sarabun stack.
function getFontFamily() {
    try {
        const f = getComputedStyle(document.body).fontFamily;
        if (f) return f;
    } catch { /* not in a DOM context */ }
    return 'Sarabun, Tahoma, sans-serif';
}

// Set ctx.font to the largest size that still fits `text` within `maxWidth`,
// shrinking from basePx if needed. Returns the chosen pixel size.
function fitFont(ctx, text, maxWidth, weight, basePx, family) {
    let px = basePx;
    ctx.font = `${weight} ${px}px ${family}`;
    const w = ctx.measureText(text).width;
    if (w > maxWidth && w > 0) {
        px = Math.max(12, Math.floor(px * (maxWidth / w)));
        ctx.font = `${weight} ${px}px ${family}`;
    }
    return px;
}

export async function recordHanziVideo(wordObj, width = 720, height = 960, onProgress = null) {
    return new Promise(async (resolve, reject) => {
        const { char, pinyin, thai, meaning } = wordObj;

        const fontFamily = getFontFamily();
        // Make sure the webfont (Sarabun) is actually loaded before we draw to
        // the canvas, otherwise early frames render in a fallback font.
        if (typeof document !== 'undefined' && document.fonts) {
            try { await document.fonts.ready; } catch { /* ignore */ }
        }

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
        // Start fetching audio in the background IMMEDIATELY, but don't await till needed
        const fetchAudioPromise = fetch(`/api/tts?text=${encodeURIComponent(char)}&lang=zh-CN`)
            .then(res => res.arrayBuffer())
            .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
            .then(buffer => { audioBuffer = buffer; })
            .catch(err => { console.error("Audio recording failed:", err); });

        // 2b. English translation. Use the value passed in (already fetched by the
        // card UI) when available; otherwise fetch it ourselves so bulk downloads
        // also get the English line. Falls back silently to Thai-only on failure.
        let englishText = (wordObj.english || '').trim();
        const fetchEnglishPromise = (!englishText && meaning)
            ? fetch(`/api/translate?text=${encodeURIComponent(meaning)}&from=th&to=en`)
                .then(res => res.json())
                .then(data => { if (data.translatedText) englishText = data.translatedText.trim(); })
                .catch(err => { console.error("Translation for video failed:", err); })
            : Promise.resolve();

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

        // 3b. Layout geometry (portrait). Computed so all three text lines fit
        // comfortably above the bottom edge — the previous layout pushed the
        // meaning line to y=962 on a 960px canvas, clipping it off-screen.
        const margin = width * 0.1;
        const boxTop = height * 0.05;
        const boxSize = width - (margin * 2);
        const boxBottom = boxTop + boxSize;

        const writerSize = width * 0.7; // 70% of width
        const writerCanvas = document.createElement('canvas');
        writerCanvas.width = writerSize;
        writerCanvas.height = writerSize;
        recordingContainer.appendChild(writerCanvas);

        // Baselines for the text block below the animation box.
        const charBaseline = boxBottom + (height - boxBottom) * 0.42;
        const pinyinBaseline = charBaseline + width * 0.11;
        const meaningBaseline = pinyinBaseline + width * 0.09;

        // Pre-compose the text lines (matches the card modal: "a - b").
        const pinyinLine = [pinyin, thai].filter(Boolean).join(' - ');

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

        // Setup Progress Reporting
        let progressInterval = null;
        const charLength = char.split('').filter(c => /[一-鿿]/.test(c)).length || 1;
        // Adjust estimated duration dynamically for the slower 1.5 speed:
        // Initial wait (200ms) + Char loop(wait 200 + anim ~2500 + wait 400 = 3100ms) + buffer (1000ms)
        const estimatedDuration = 200 + (charLength * 3100) + 1000;
        const startTime = Date.now();

        if (onProgress) {
            progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                let p = elapsed / estimatedDuration;
                if (p > 0.999) p = 0.999; // Cap at 99.9%
                onProgress(p);
            }, 50); // update every 50ms for smooth 0.1 increment
        }

        // Cleanup function
        const cleanup = (blob) => {
            document.body.removeChild(recordingContainer);
            if (audioCtx.state !== 'closed') {
                audioCtx.close();
            }
            if (progressInterval) clearInterval(progressInterval);
            if (onProgress) onProgress(1); // 100%
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

            // 2. Grey Container Box (matches the website's stroke-order panel)
            ctx.fillStyle = '#f8fafc'; // slate-50
            ctx.beginPath();
            ctx.roundRect(margin, boxTop, boxSize, boxSize, 25);
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; // slate-200
            ctx.lineWidth = 4;
            ctx.stroke();

            // 3. Draw HanziWriter animation in the box center
            ctx.drawImage(writerCanvas, margin + (boxSize - writerSize) / 2, boxTop + (boxSize - writerSize) / 2);

            ctx.textAlign = 'center';

            // 4. BIG BOLD CHARACTER (Chinese)
            ctx.fillStyle = '#1e293b'; // slate-800
            fitFont(ctx, char, width - margin, 'bold', width * 0.18, fontFamily);
            ctx.fillText(char, width / 2, charBaseline);

            // 5. PINYIN + THAI READING (e.g. "pà - พ่า")
            if (pinyinLine) {
                ctx.fillStyle = '#334155'; // slate-700
                fitFont(ctx, pinyinLine, width - margin, 'bold', width * 0.075, fontFamily);
                ctx.fillText(pinyinLine, width / 2, pinyinBaseline);
            }

            // 6. MEANING: THAI + ENGLISH (e.g. "กลัว - Fear")
            // Built every frame so it picks up the translation once it resolves.
            const meaningLine = [meaning, englishText].filter(Boolean).join(' - ');
            if (meaningLine) {
                ctx.fillStyle = '#64748b'; // slate-500
                fitFont(ctx, meaningLine, width - margin * 0.6, 'normal', width * 0.058, fontFamily);
                ctx.fillText(meaningLine, width / 2, meaningBaseline);
            }

            // Use setTimeout to avoid requestAnimationFrame being throttled when tab is inactive/backgrounded
            setTimeout(render, 1000 / 60);
        };

        recorder.start();
        render();

        try {
            // Wait slightly before starting (reduced)
            await new Promise(r => setTimeout(r, 200));

            // Ensure audio + translation are ready before the stroke animation runs,
            // so the animated portion of the video always shows the full text.
            await Promise.all([fetchAudioPromise, fetchEnglishPromise]);

            // Start Audio
            if (audioBuffer) {
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(dest);
                source.start(0);
            }

            const charsToAnimate = char.split('').filter(c => /[一-鿿]/.test(c));
            if (charsToAnimate.length === 0) {
                await new Promise(r => setTimeout(r, 1000));
            } else {
                for (const c of charsToAnimate) {
                    const writer = window.HanziWriter.create(writerCanvas, c, {
                        width: writerSize,
                        height: writerSize,
                        padding: writerSize / 15,
                        strokeColor: '#333333',
                        radicalColor: '#16a34a', // green-600
                        showOutline: true,
                        strokeAnimationSpeed: 1.5, // ลดความเร็วลงเพื่อให้มองเห็นวิธีเขียนชัดเจนขึ้น
                        delayBetweenStrokes: 40, // เพิ่มช่องว่างให้การตวัดพู่กันดูเป็นธรรมชาติ
                        renderer: 'canvas'
                    });

                    await new Promise(r => setTimeout(r, 200)); // หน่วงนิดนึงก่อนเริ่มตัวแรก
                    await writer.animateCharacter();
                    await new Promise(r => setTimeout(r, 400)); // Pause ระหว่างตัว
                }
            }

            await new Promise(r => setTimeout(r, 1000)); // Final buffer

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

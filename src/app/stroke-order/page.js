"use client";

import { useState, useEffect, useRef } from 'react';

export default function StrokeOrderPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [displayChars, setDisplayChars] = useState('');
    const [searchTrigger, setSearchTrigger] = useState(0);
    const writersRef = useRef([]);
    const containerRef = useRef(null);

    // Initial Load of HanziWriter
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { };
    }, []);

    // Re-init writers when chars change
    useEffect(() => {
        if (window.HanziWriter && displayChars) {
            initWriters(displayChars);
        }
    }, [displayChars, searchTrigger]);

    // --- Quiz State ---
    const [quizChar, setQuizChar] = useState(null);
    const [quizQueue, setQuizQueue] = useState([]);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(-1);
    const quizWriterRef = useRef(null);
    const audioContextRef = useRef(null);

    // --- Ad & Unlock State ---
    const [showAd, setShowAd] = useState(false);
    const [adTimer, setAdTimer] = useState(5);
    const [unlockExpiry, setUnlockExpiry] = useState(null); // Global expiry timestamp for ALL chars

    // --- Audio System ---
    useEffect(() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioContextRef.current = new AudioContext();
        }
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    const playTone = (type, freqStart, freqEnd, duration, volume = 0.1) => {
        try {
            const ctx = audioContextRef.current;
            if (!ctx) return;
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
            if (freqEnd) {
                osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
            }
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.error("Audio error", e);
        }
    };

    const playCorrectSound = () => playTone('sine', 800, 1200, 0.15, 0.15);
    const playMistakeSound = () => playTone('sawtooth', 150, 100, 0.15, 0.10);
    const playCompleteSound = () => {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.5);
        });
    };

    // --- Quiz Logic ---
    const startQuizForWriter = (writer) => {
        writer.quiz({
            onCorrectStroke: playCorrectSound,
            onMistake: playMistakeSound,
            onComplete: () => {
                playCompleteSound();
                if (quizQueue.length > 0) {
                    setTimeout(() => {
                        const nextIndex = currentQuizIndex + 1;
                        if (nextIndex < quizQueue.length) {
                            setCurrentQuizIndex(nextIndex);
                            setQuizChar(quizQueue[nextIndex]);
                        } else {
                            setQuizChar(null);
                            setQuizQueue([]);
                            setCurrentQuizIndex(-1);
                        }
                    }, 1000);
                }
            }
        });
    };

    useEffect(() => {
        if (quizChar && document.getElementById('quiz-writer-target')) {
            const target = document.getElementById('quiz-writer-target');
            target.innerHTML = '';

            const writer = window.HanziWriter.create(target, quizChar, {
                width: 300,
                height: 300,
                padding: 20,
                showOutline: true,
                strokeAnimationSpeed: 1, // Normal speed for hint
                delayBetweenStrokes: 200,
                radicalColor: '#166534',
                strokeColor: '#333333',
                showCharacter: false,
                outlineColor: '#999999',
                drawingWidth: 50,
                lenience: 2.0,
            });

            startQuizForWriter(writer);
            quizWriterRef.current = writer;
        }
    }, [quizChar, quizQueue, currentQuizIndex]);

    // --- Hint & Ad Logic ---
    const handleHintClick = () => {
        if (!quizChar) return;

        const now = Date.now();

        // Check Global Expiry
        if (unlockExpiry && now < unlockExpiry) {
            playHintAnimation();
        } else {
            // Needed to watch ad
            setAdTimer(5); // Reset timer to 5s
            setShowAd(true);
        }
    };

    // Ad Timer & AdSense Trigger
    useEffect(() => {
        let interval;
        if (showAd) {
            // Trigger AdSense when modal opens
            try {
                // Ensure we only push once per show session reset
                if (adTimer === 5) {
                    // Safe push
                    if (window && window.adsbygoogle) {
                        try {
                            window.adsbygoogle.push({});
                        } catch (e) {/* Ignore if pushed already */ }
                    }
                }
            } catch (e) {
                console.error("AdSense error", e);
            }

            if (adTimer > 0) {
                interval = setInterval(() => {
                    setAdTimer((prev) => prev - 1);
                }, 1000);
            } else if (adTimer === 0) {
                // Ad Finished
                const timeout = setTimeout(() => {
                    setShowAd(false);
                    unlockGlobalHints();
                    playHintAnimation();
                }, 1000); // Give user 1s to see "Finished"
                return () => clearTimeout(timeout);
            }
        }
        return () => clearInterval(interval);
    }, [showAd, adTimer]);

    const unlockGlobalHints = () => {
        const thirtyMinutes = 30 * 60 * 1000;
        setUnlockExpiry(Date.now() + thirtyMinutes);
    };

    const playHintAnimation = () => {
        const writer = quizWriterRef.current;
        if (!writer) return;

        // 1. Cancel Quiz (stop accepting input)
        writer.cancelQuiz();

        // 2. Play Animation (Show Answer)
        writer.animateCharacter({
            onComplete: () => {
                // 3. Restart Quiz (Back to practice)
                setTimeout(() => {
                    writer.hideCharacter(); // Clear filled strokes
                    startQuizForWriter(writer); // Restart
                }, 1000);
            }
        });
    };

    // --- List Initialization ---
    const [selectedChars, setSelectedChars] = useState(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const toggleSelectChar = (char) => {
        setSelectedChars(prev => {
            const newSet = new Set(prev);
            if (newSet.has(char)) newSet.delete(char);
            else newSet.add(char);
            return newSet;
        });
    };

    const handleDownloadZip = async () => {
        if (selectedChars.size === 0) return;
        setIsDownloading(true);
        setDownloadProgress(0);

        try {
            const JSZip = (await import('jszip')).default;
            const { saveAs } = await import('file-saver');
            const { recordHanziVideo } = await import('@/utils/hanziRecorder');

            const zip = new JSZip();
            let completed = 0;
            const charsArray = Array.from(selectedChars);

            for (const char of charsArray) {
                const blob = await recordHanziVideo({ char }, 720, 960, (internalProgress) => {
                    const currentPercent = ((completed + internalProgress) / charsArray.length) * 100;
                    setDownloadProgress(currentPercent.toFixed(1));
                });
                zip.file(`${char}.webm`, blob);

                completed++;
                setDownloadProgress(((completed / charsArray.length) * 100).toFixed(1));
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `hanzi_videos_${Date.now()}.zip`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    const initWriters = (chars) => {
        if (!containerRef.current || !window.HanziWriter) return;

        containerRef.current.innerHTML = '';
        writersRef.current = [];

        const charArray = chars.split('').filter(char => /[\u4E00-\u9FFF]/.test(char));
        const grid = document.createElement('div');
        grid.className = "flex flex-wrap justify-center gap-8";
        containerRef.current.appendChild(grid);

        charArray.forEach((char, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = `flex flex-col items-center gap-2 p-2 rounded-xl transition-all border-2 ${selectedChars.has(char) ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-transparent'}`;
            grid.appendChild(wrapper);

            // Checkbox for selection
            const checkbox = document.createElement('div');
            checkbox.className = `self-end w-5 h-5 rounded border mb-[-24px] z-10 cursor-pointer flex items-center justify-center transition-colors ${selectedChars.has(char) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`;
            checkbox.innerHTML = selectedChars.has(char) ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : '';
            checkbox.onclick = (e) => {
                e.stopPropagation();
                toggleSelectChar(char);
            };
            wrapper.appendChild(checkbox);

            const div = document.createElement('div');
            div.id = `writer-${index}-${Date.now()}`;
            div.className = "bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors";
            div.style.width = '200px';
            div.style.height = '200px';
            wrapper.appendChild(div);

            const writer = window.HanziWriter.create(div, char, {
                width: 200,
                height: 200,
                padding: 10,
                showOutline: true,
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 50,
                radicalColor: '#166534',
                strokeColor: '#333333',
            });

            writersRef.current.push(writer);

            const controlsDiv = document.createElement('div');
            controlsDiv.className = "flex items-center gap-3 mt-2";
            wrapper.appendChild(controlsDiv);

            const playBtn = document.createElement('button');
            playBtn.className = "p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100";
            playBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
            playBtn.onclick = () => writer.animateCharacter();
            controlsDiv.appendChild(playBtn);

            const quizBtn = document.createElement('button');
            quizBtn.className = "p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100";
            quizBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>`;
            quizBtn.onclick = () => openQuizModal(char); // Open Modal
            controlsDiv.appendChild(quizBtn);

            const downloadBtn = document.createElement('button');
            downloadBtn.className = "text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 font-bold transition-colors h-9 flex items-center gap-1";
            downloadBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Video`;
            downloadBtn.onclick = () => handleDownloadSingle(char);
            controlsDiv.appendChild(downloadBtn);
        });
    };

    const openQuizModal = (char) => {
        setQuizQueue([]);
        setCurrentQuizIndex(-1);
        setQuizChar(char);
    };

    const handleQuizAll = () => {
        const charArray = displayChars.split('').filter(char => /[\u4E00-\u9FFF]/.test(char));
        if (charArray.length > 0) {
            setQuizQueue(charArray);
            setCurrentQuizIndex(0);
            setQuizChar(charArray[0]);
        }
    };

    const closeQuizModal = () => {
        setQuizChar(null);
        setQuizQueue([]);
        setCurrentQuizIndex(-1);
        setShowAd(false); // Close ad if modal closed
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim().length > 0) {
            setDisplayChars(searchTerm);
            setSearchTrigger(prev => prev + 1);
        }
    };

    const handleAnimateAll = async () => {
        for (const writer of writersRef.current) {
            await writer.animateCharacter();
        }
    };

    const handleDownloadSingle = async (charToDownload) => {
        try {
            const { recordHanziVideo } = await import('@/utils/hanziRecorder');
            const { saveAs } = await import('file-saver');
            const blob = await recordHanziVideo({ char: charToDownload });
            saveAs(blob, `${charToDownload}.webm`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <main className="flex-1 h-full bg-slate-50 py-4 sm:py-8 px-2 sm:px-4 md:px-8 selection:bg-blue-100">
            <div className="w-full text-center">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-4 sm:mb-8 px-2">
                    ฝึกเขียนภาษาจีน <span className="text-blue-600">Stroke Order</span>
                </h1>

                <div className="bg-white p-3 sm:p-4 md:p-8 rounded-xl shadow-sm">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center mb-4 sm:mb-8">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="พิมพ์คำศัพท์ (เช่น 你好)"
                            className="text-center text-xl sm:text-2xl md:text-3xl w-full sm:w-64 h-12 sm:h-14 md:h-16 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-bold"
                        />
                        <button type="submit" className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center gap-2 h-12 sm:h-14 md:h-16 text-base sm:text-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            ค้นหา
                        </button>
                    </form>

                    <div className="mb-4 sm:mb-8 min-h-[200px] sm:min-h-[250px]" ref={containerRef}></div>

                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                        <button onClick={handleAnimateAll} className="px-3 sm:px-6 py-2 sm:py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                            <span className="hidden sm:inline">เล่นทั้งหมด (Animate All)</span>
                            <span className="sm:hidden">เล่น</span>
                        </button>

                        <button onClick={handleQuizAll} className="px-3 sm:px-6 py-2 sm:py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                            <span className="hidden sm:inline">ลองเขียนทั้งหมด (Quiz All)</span>
                            <span className="sm:hidden">ฝึกเขียน</span>
                        </button>

                        <button
                            onClick={handleDownloadZip}
                            disabled={selectedChars.size === 0 || isDownloading}
                            className={`px-3 sm:px-6 py-2 sm:py-3 font-bold rounded-lg transition-all shadow-sm flex items-center gap-1 sm:gap-2 text-sm sm:text-base ${selectedChars.size === 0 || isDownloading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            {isDownloading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                    {downloadProgress}%
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    <span className="hidden sm:inline">โหลดที่เลือก ({selectedChars.size})</span>
                                    <span className="sm:hidden">ZIP ({selectedChars.size})</span>
                                </>
                            )}
                        </button>
                    </div>

                    <p className="mt-4 sm:mt-6 text-slate-500 text-xs sm:text-sm px-2">
                        * พิมพ์คำศัพท์ลงในช่องแล้วกดค้นหา เพื่อดูวิธีการเขียน<br />
                        ** คลิกเลือกตัวอักษรที่ต้องการ แล้วกด &quot;โหลดที่เลือก&quot; เพื่อดาวน์โหลดเป็นไฟล์ ZIP
                    </p>
                </div>
            </div>

            {/* Quiz Modal */}
            {quizChar && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-lg relative animate-in fade-in zoom-in duration-200 max-h-[95vh] overflow-y-auto">
                        <button onClick={closeQuizModal} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-600 p-1 sm:p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 text-center pr-8">
                            ฝึกเขียน: <span className="text-blue-600 text-2xl sm:text-4xl ml-1 sm:ml-2">{quizChar}</span>
                            {quizQueue.length > 0 && <span className="text-xs sm:text-sm text-slate-400 ml-2 sm:ml-4 font-normal">({currentQuizIndex + 1}/{quizQueue.length})</span>}
                        </h3>

                        <div className="flex justify-center mb-4 sm:mb-6">
                            <div
                                id="quiz-writer-target"
                                className="border-4 border-dashed border-slate-200 rounded-xl bg-slate-50 transition-colors w-[250px] h-[250px] sm:w-[300px] sm:h-[300px]"
                            ></div>
                        </div>

                        <p className="text-center text-slate-500 mb-3 sm:mb-4 text-xs sm:text-sm px-2">
                            ลากเส้นตามลำดับขีด | คลิกกรอบเพื่อดูเฉลย
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                            <button onClick={() => quizWriterRef.current?.quiz({ onCorrectStroke: playCorrectSound, onMistake: playMistakeSound, onComplete: playCompleteSound })} className="px-3 sm:px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors text-sm sm:text-base">
                                เริ่มใหม่
                            </button>
                            <button
                                onClick={handleHintClick}
                                className={`px-3 sm:px-4 py-2 font-bold rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base ${unlockExpiry && Date.now() < unlockExpiry ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                            >
                                {unlockExpiry && Date.now() < unlockExpiry ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        <span className="hidden sm:inline">ดูเฉลยฟรี (30m)</span>
                                        <span className="sm:hidden">เฉลย</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                                        <span className="hidden sm:inline">ดูเฉลย (Ad)</span>
                                        <span className="sm:hidden">เฉลย</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AdSense Modal (Interstitial) */}
            {showAd && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white p-2 sm:p-4">
                    <div className="bg-white text-black p-3 sm:p-4 rounded-xl w-full max-w-lg shadow-2xl relative">
                        <div className="text-center mb-3 sm:mb-4">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-800">Advertisement</h3>
                            <p className="text-slate-500 text-xs sm:text-sm">รอ {adTimer} วินาที</p>
                        </div>

                        {/* Adsense Placement */}
                        <div className="flex justify-center items-center bg-slate-100 min-h-[200px] sm:min-h-[250px] rounded-lg overflow-hidden mb-3 sm:mb-4 border border-slate-200">
                            <ins className="adsbygoogle"
                                style={{ display: 'block', width: '100%', maxWidth: '300px', height: '250px' }}
                                data-ad-client="ca-pub-6059901629514213"
                                data-ad-slot="8235863029"
                                data-ad-format="auto"
                                data-full-width-responsive="true">
                            </ins>
                        </div>

                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
                            <div
                                className="bg-amber-500 h-full transition-all duration-1000 ease-linear"
                                style={{ width: `${(5 - adTimer) * 20}%` }}
                            ></div>
                        </div>

                        {adTimer === 0 && (
                            <p className="text-center text-green-600 font-bold animate-bounce text-sm sm:text-base">
                                กำลังปลดล็อก...
                            </p>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}

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
            setAdTimer(5);
            setShowAd(true);
        }
    };

    // Simulate Ad Timer
    useEffect(() => {
        let interval;
        if (showAd && adTimer > 0) {
            interval = setInterval(() => {
                setAdTimer((prev) => prev - 1);
            }, 1000);
        } else if (showAd && adTimer === 0) {
            // Ad Finished (Wait briefly then close and unlock)
            const timeout = setTimeout(() => {
                setShowAd(false);
                unlockGlobalHints();
                playHintAnimation();
            }, 500);
            return () => clearTimeout(timeout);
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
                // Use timeout to let user see finished char briefly
                setTimeout(() => {
                    writer.hideCharacter(); // Clear filled strokes
                    startQuizForWriter(writer); // Restart
                }, 1000);
            }
        });
    };

    // --- List Initialization ---
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
            wrapper.className = "flex flex-col items-center gap-2";
            grid.appendChild(wrapper);

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
            downloadBtn.className = "text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 font-bold transition-colors h-9";
            downloadBtn.innerHTML = "GIF";
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

    const handleDownloadSingle = (charToDownload) => {
        const charCode = charToDownload.charCodeAt(0).toString(16).toLowerCase();
        window.open(`https://www.hanzi5.com/assets/bishun/animation/${charCode}.gif`, '_blank');
    };

    return (
        <main className="flex-1 h-full bg-slate-50 py-8 px-4 sm:px-8 selection:bg-blue-100">
            <div className="w-full text-center">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-8">
                    ฝึกเขียนภาษาจีน <span className="text-blue-600">Stroke Order</span>
                </h1>

                <div className="bg-white p-4 sm:p-8">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="พิมพ์คำศัพท์ (เช่น 你好)"
                            className="text-center text-2xl sm:text-3xl w-full sm:w-64 h-14 sm:h-16 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-bold"
                        />
                        <button type="submit" className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center gap-2 h-14 sm:h-16 text-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            ค้นหา
                        </button>
                    </form>

                    <div className="mb-8 min-h-[250px]" ref={containerRef}></div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button onClick={handleAnimateAll} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                            เล่นทั้งหมด (Animate All)
                        </button>

                        <button onClick={handleQuizAll} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                            ลองเขียนทั้งหมด (Quiz All)
                        </button>
                    </div>

                    <p className="mt-6 text-slate-500 text-sm">
                        * พิมพ์คำศัพท์ลงในช่องแล้วกดค้นหา เพื่อดูวิธีการเขียน<br />
                        ** กด "ลองเขียนทั้งหมด" เพื่อเริ่มฝึกเขียนทีละตัวจนครบ
                    </p>
                </div>
            </div>

            {/* Quiz Modal */}
            {quizChar && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
                        <button onClick={closeQuizModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                            ฝึกเขียน: <span className="text-blue-600 text-4xl ml-2">{quizChar}</span>
                            {quizQueue.length > 0 && <span className="text-sm text-slate-400 ml-4 font-normal">({currentQuizIndex + 1}/{quizQueue.length})</span>}
                        </h3>

                        <div className="flex justify-center mb-6">
                            <div
                                id="quiz-writer-target"
                                className="border-4 border-dashed border-slate-200 rounded-xl bg-slate-50 transition-colors"
                            ></div>
                        </div>

                        <p className="text-center text-slate-500 mb-4">
                            ลากเส้นตามลำดับขีด | คลิกกรอบเพื่อดูเฉลย
                        </p>

                        <div className="flex justify-center gap-4">
                            <button onClick={() => quizWriterRef.current?.quiz({ onCorrectStroke: playCorrectSound, onMistake: playMistakeSound, onComplete: playCompleteSound })} className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors">
                                เริ่มใหม่ (Retry)
                            </button>
                            <button
                                onClick={handleHintClick}
                                className={`px-4 py-2 font-bold rounded-lg transition-colors flex items-center gap-2 ${unlockExpiry && Date.now() < unlockExpiry ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                            >
                                {unlockExpiry && Date.now() < unlockExpiry ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        ดูเฉลยฟรี (30m)
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                                        ดูเฉลย (Ad)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Simulated Ad Modal */}
            {showAd && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
                    <div className="text-3xl font-bold mb-4 animate-pulse">สนับสนุนค่าไฟ...</div>
                    <div className="bg-gray-800 p-8 rounded-xl max-w-sm w-full text-center border border-gray-700">
                        <div className="mb-6">
                            <span className="text-6xl">📺</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">กำลังเล่นโฆษณา</h3>
                        <p className="text-gray-400 mb-6">คุณจะได้รับสิทธิ์ดูเฉลยฟรีทุกตัว 30 นาที</p>

                        <div className="text-4xl font-mono font-bold text-amber-500 mb-2">
                            {adTimer}s
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-amber-500 h-full transition-all duration-1000 ease-linear"
                                style={{ width: `${(5 - adTimer) * 20}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

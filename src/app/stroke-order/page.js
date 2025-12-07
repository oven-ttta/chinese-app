"use client";

import { useState, useEffect, useRef } from 'react';

export default function StrokeOrderPage() {
    const [searchTerm, setSearchTerm] = useState(''); // Default text
    const [displayChars, setDisplayChars] = useState('');
    const [searchTrigger, setSearchTrigger] = useState(0); // Trigger to re-run effect
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

    // Sound Effect Function
    const playCorrectSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    const playCompleteSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    // Quiz Modal Logic
    useEffect(() => {
        if (quizChar && document.getElementById('quiz-writer-target')) {
            const target = document.getElementById('quiz-writer-target');
            target.innerHTML = ''; // Clear previous

            const writer = window.HanziWriter.create(target, quizChar, {
                width: 300,
                height: 300,
                padding: 20,
                showOutline: true,
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 500,
                radicalColor: '#166534',
                strokeColor: '#333333',
                showCharacter: false,
                outlineColor: '#999999',
                drawingWidth: 30,
            });

            // Start Quiz
            writer.quiz({
                onCorrectStroke: () => {
                    playCorrectSound();
                },
                onComplete: () => {
                    playCompleteSound();

                    // If in Queue Mode (Quiz All)
                    if (quizQueue.length > 0) {
                        setTimeout(() => {
                            const nextIndex = currentQuizIndex + 1;
                            if (nextIndex < quizQueue.length) {
                                setCurrentQuizIndex(nextIndex);
                                setQuizChar(quizQueue[nextIndex]);
                            } else {
                                // Finished Queue
                                setQuizChar(null);
                                setQuizQueue([]);
                                setCurrentQuizIndex(-1);
                                // alert("ฝึกเขียนครบแล้ว! (Completed!)");
                            }
                        }, 800); // Wait bit before next
                    }
                }
            });

            quizWriterRef.current = writer;
        }
    }, [quizChar, quizQueue, currentQuizIndex]);

    const initWriters = (chars) => {
        if (!containerRef.current || !window.HanziWriter) return;

        containerRef.current.innerHTML = '';
        writersRef.current = [];

        const charArray = chars.split('').filter(char => /[\u4E00-\u9FFF]/.test(char));

        // Grid Container
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

            // Click to animate
            div.onclick = () => writer.animateCharacter();
            writersRef.current.push(writer);

            // Controls
            const controlsDiv = document.createElement('div');
            controlsDiv.className = "flex items-center gap-3 mt-2";
            wrapper.appendChild(controlsDiv);

            // Play Btn
            const playBtn = document.createElement('button');
            playBtn.className = "p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100";
            playBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
            playBtn.onclick = () => writer.animateCharacter();
            controlsDiv.appendChild(playBtn);

            // Quiz Btn (Individual)
            const quizBtn = document.createElement('button');
            quizBtn.className = "p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100";
            quizBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>`;
            quizBtn.onclick = () => openQuizModal(char); // Single mode
            controlsDiv.appendChild(quizBtn);

            // GIF Btn
            const downloadBtn = document.createElement('button');
            downloadBtn.className = "text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 font-bold transition-colors h-9";
            downloadBtn.innerHTML = "GIF";
            downloadBtn.onclick = () => handleDownloadSingle(char);
            controlsDiv.appendChild(downloadBtn);
        });
    };

    // --- Handlers ---

    const openQuizModal = (char) => {
        // Find if this char is in our current display list to potentially start queue from there?
        // For simplicity, individual button = single char mode
        setQuizQueue([]);
        setCurrentQuizIndex(-1);
        setQuizChar(char);
    };

    const handleQuizAll = () => {
        // Filter valid chars
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
                    {/* Search Form */}
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

                    {/* Writers Grid */}
                    <div className="mb-8 min-h-[250px]" ref={containerRef}></div>

                    {/* Main Controls */}
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
                                className="border-4 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:border-blue-300 transition-colors"
                                onClick={() => quizWriterRef.current?.showOutline()}
                                title="คลิกเพื่อดูเฉลย (Click for Hint)"
                            ></div>
                        </div>

                        <p className="text-center text-slate-500 mb-4">
                            ลากเส้นตามลำดับขีด | คลิกกรอบเพื่อดูเฉลย
                        </p>

                        <div className="flex justify-center gap-4">
                            <button onClick={() => quizWriterRef.current?.quiz()} className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors">
                                เริ่มใหม่ (Retry)
                            </button>
                            <button onClick={() => quizWriterRef.current?.showOutline()} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors">
                                ดูเฉลย (Hint)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

"use client";

import { useState, useEffect, useRef } from 'react';

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const PenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
);

export default function StrokeOrderPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [displayChars, setDisplayChars] = useState('');
    const [searchTrigger, setSearchTrigger] = useState(0);
    const writersRef = useRef([]);
    const containerRef = useRef(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { };
    }, []);

    useEffect(() => {
        if (window.HanziWriter && displayChars) {
            initWriters(displayChars);
        }
    }, [displayChars, searchTrigger]);

    const [quizChar, setQuizChar] = useState(null);
    const [quizQueue, setQuizQueue] = useState([]);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(-1);
    const quizWriterRef = useRef(null);
    const audioContextRef = useRef(null);

    const [showAd, setShowAd] = useState(false);
    const [adTimer, setAdTimer] = useState(5);
    const [unlockExpiry, setUnlockExpiry] = useState(null);

    useEffect(() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioContextRef.current = new AudioContext();
        }
        return () => audioContextRef.current?.close();
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
            if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
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
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 200,
                radicalColor: '#4f46e5',
                strokeColor: '#1e293b',
                showCharacter: false,
                outlineColor: '#cbd5e1',
                drawingWidth: 50,
                lenience: 2.0,
            });
            startQuizForWriter(writer);
            quizWriterRef.current = writer;
        }
    }, [quizChar, quizQueue, currentQuizIndex]);

    const handleHintClick = () => {
        if (!quizChar) return;
        const now = Date.now();
        if (unlockExpiry && now < unlockExpiry) {
            playHintAnimation();
        } else {
            setAdTimer(5);
            setShowAd(true);
        }
    };

    useEffect(() => {
        let interval;
        if (showAd) {
            try {
                if (adTimer === 5) {
                    if (window && window.adsbygoogle) {
                        try { window.adsbygoogle.push({}); } catch (e) { }
                    }
                }
            } catch (e) {}

            if (adTimer > 0) {
                interval = setInterval(() => setAdTimer(prev => prev - 1), 1000);
            } else if (adTimer === 0) {
                const timeout = setTimeout(() => {
                    setShowAd(false);
                    unlockGlobalHints();
                    playHintAnimation();
                }, 1000);
                return () => clearTimeout(timeout);
            }
        }
        return () => clearInterval(interval);
    }, [showAd, adTimer]);

    const unlockGlobalHints = () => {
        setUnlockExpiry(Date.now() + 30 * 60 * 1000);
    };

    const playHintAnimation = () => {
        const writer = quizWriterRef.current;
        if (!writer) return;
        writer.cancelQuiz();
        writer.animateCharacter({
            onComplete: () => {
                setTimeout(() => {
                    writer.hideCharacter();
                    startQuizForWriter(writer);
                }, 1000);
            }
        });
    };

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
                const blob = await recordHanziVideo({ char }, 1080, 1440, (internalProgress) => {
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
        grid.className = "flex flex-wrap justify-center gap-6";
        containerRef.current.appendChild(grid);

        charArray.forEach((char, index) => {
            const wrapper = document.createElement('div');
            const isSelected = selectedChars.has(char);
            wrapper.className = `group relative flex flex-col items-center bg-white p-4 rounded-3xl transition-all border-2 ${isSelected ? 'border-indigo-500 shadow-md shadow-indigo-100 ring-4 ring-indigo-50' : 'border-slate-100 shadow-sm hover:border-indigo-300 hover:shadow-md'}`;
            grid.appendChild(wrapper);

            const checkbox = document.createElement('div');
            checkbox.className = `absolute top-3 right-3 w-5 h-5 rounded-md cursor-pointer flex items-center justify-center transition-colors z-10 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-2 border-slate-300'}`;
            checkbox.innerHTML = isSelected ? '<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : '';
            checkbox.onclick = (e) => {
                e.stopPropagation();
                toggleSelectChar(char);
            };
            wrapper.appendChild(checkbox);

            const div = document.createElement('div');
            div.id = `writer-${index}-${Date.now()}`;
            div.className = "bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 transition-colors mt-2";
            div.style.width = '200px';
            div.style.height = '200px';
            wrapper.appendChild(div);

            const writer = window.HanziWriter.create(div, char, {
                width: 200,
                height: 200,
                padding: 15,
                showOutline: true,
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 50,
                radicalColor: '#4f46e5',
                strokeColor: '#1e293b',
                outlineColor: '#e2e8f0',
            });
            writersRef.current.push(writer);

            const controlsDiv = document.createElement('div');
            controlsDiv.className = "flex items-center gap-2 mt-4 w-full justify-between";
            wrapper.appendChild(controlsDiv);

            const playBtn = document.createElement('button');
            playBtn.className = "flex-1 flex justify-center items-center py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-indigo-600 rounded-xl transition-colors font-semibold text-sm gap-1";
            playBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> ดูขีด`;
            playBtn.onclick = () => writer.animateCharacter();
            controlsDiv.appendChild(playBtn);

            const quizBtn = document.createElement('button');
            quizBtn.className = "flex-1 flex justify-center items-center py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-colors font-semibold text-sm gap-1";
            quizBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> เขียน`;
            quizBtn.onclick = () => openQuizModal(char);
            controlsDiv.appendChild(quizBtn);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = "flex-none flex justify-center items-center w-10 h-9 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors";
            downloadBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>`;
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
        setShowAd(false);
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
        <main className="flex-1 min-h-screen bg-slate-100 py-6 sm:py-10 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
                            <PenIcon />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">ฝึกเขียนภาษาจีน</h1>
                    </div>
                </div>

                <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200 text-center mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8 max-w-3xl mx-auto">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="พิมพ์คำศัพท์ภาษาจีน (เช่น 你好)"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all text-slate-800 font-bold text-lg sm:text-xl placeholder:text-slate-400 placeholder:font-medium"
                            />
                        </div>
                        <button type="submit" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95 flex justify-center items-center gap-2 whitespace-nowrap text-lg">
                            ค้นหาลำดับขีด
                        </button>
                    </form>

                    <div className="mb-8 min-h-[200px]" ref={containerRef}>
                        {!displayChars && (
                            <div className="h-[200px] flex items-center justify-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-3xl">
                                พิมพ์ตัวอักษรจีนด้านบนแล้วกดค้นหา เพื่อดูวิธีเขียนและฝึกเขียน
                            </div>
                        )}
                    </div>

                    {displayChars && (
                        <div className="flex flex-wrap justify-center gap-3">
                            <button onClick={handleAnimateAll} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-sm active:scale-95 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                เล่นอัตโนมัติทั้งหมด
                            </button>

                            <button onClick={handleQuizAll} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-sm active:scale-95 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                เข้าโหมดฝึกเขียนทั้งหมด
                            </button>

                            <button
                                onClick={handleDownloadZip}
                                disabled={selectedChars.size === 0 || isDownloading}
                                className={`px-6 py-3 font-bold rounded-xl transition-all flex items-center gap-2 ${selectedChars.size === 0 || isDownloading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95 shadow-sm'}`}
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                        {downloadProgress}%
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        โหลด Video ที่เลือก ({selectedChars.size})
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quiz Modal */}
            {quizChar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md relative animate-in zoom-in-95 duration-200 flex flex-col items-center">
                        <button onClick={closeQuizModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            ฝึกเขียน: <span className="text-indigo-600 text-4xl">{quizChar}</span>
                            {quizQueue.length > 0 && <span className="text-sm bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-bold">({currentQuizIndex + 1}/{quizQueue.length})</span>}
                        </h3>

                        <div
                            id="quiz-writer-target"
                            className="border-2 border-slate-200 rounded-3xl bg-slate-50 shadow-inner w-[300px] h-[300px] mb-6 flex justify-center items-center"
                        ></div>

                        <p className="text-center text-slate-500 mb-6 text-sm font-medium">
                            ลากเส้นตามลำดับขีดที่ถูกต้องบนกระดาน
                        </p>

                        <div className="flex w-full gap-3">
                            <button onClick={() => quizWriterRef.current?.quiz({ onCorrectStroke: playCorrectSound, onMistake: playMistakeSound, onComplete: playCompleteSound })} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                เริ่มเขียนใหม่
                            </button>
                            <button
                                onClick={handleHintClick}
                                className={`flex-1 py-3 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 ${unlockExpiry && Date.now() < unlockExpiry ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"}`}
                            >
                                {unlockExpiry && Date.now() < unlockExpiry ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        ดูเฉลยฟรี
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

            {/* AdSense Modal */}
            {showAd && (
                <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl relative">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">ผู้สนับสนุน (Sponsor)</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">กรุณารอ {adTimer} วินาทีเพื่อปลดล็อกเฉลย</p>
                        </div>

                        <div className="flex justify-center items-center bg-slate-50 min-h-[250px] rounded-2xl overflow-hidden mb-6 border border-slate-200">
                            <ins className="adsbygoogle"
                                style={{ display: 'block', width: '100%', maxWidth: '300px', height: '250px' }}
                                data-ad-client="ca-pub-6059901629514213"
                                data-ad-slot="8235863029"
                                data-ad-format="auto"
                                data-full-width-responsive="true">
                            </ins>
                        </div>

                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-2">
                            <div
                                className="bg-indigo-500 h-full transition-all duration-1000 ease-linear rounded-full"
                                style={{ width: `${(5 - adTimer) * 20}%` }}
                            ></div>
                        </div>

                        {adTimer === 0 && (
                            <p className="text-center text-emerald-600 font-bold animate-bounce mt-4">
                                กำลังปลดล็อก...
                            </p>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}

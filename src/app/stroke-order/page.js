"use client";

import { useState, useEffect, useRef } from 'react';

export default function StrokeOrderPage() {
    const [searchTerm, setSearchTerm] = useState(''); // Default text
    const [displayChars, setDisplayChars] = useState('');
    const writersRef = useRef([]);
    const containerRef = useRef(null);

    useEffect(() => {
        // Load HanziWriter from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
        script.async = true;
        script.onload = () => {
            if (window.HanziWriter) {
                initWriters(displayChars);
            }
        };
        document.body.appendChild(script);

        return () => {
            // Cleanup: remove script if needed, though usually not necessary for CDN
        };
    }, []);

    // Re-init when displayChars changes
    useEffect(() => {
        if (window.HanziWriter) {
            initWriters(displayChars);
        }
    }, [displayChars]);

    const initWriters = (chars) => {
        if (!containerRef.current || !window.HanziWriter) return;

        containerRef.current.innerHTML = ''; // Clear previous
        writersRef.current = []; // Reset writers array

        const charArray = chars.split('');

        // Container for all chars
        const grid = document.createElement('div');
        grid.className = "flex flex-wrap justify-center gap-8";
        containerRef.current.appendChild(grid);

        charArray.forEach((char, index) => {
            // Wrapper for each char + download button
            const wrapper = document.createElement('div');
            wrapper.className = "flex flex-col items-center gap-2";
            grid.appendChild(wrapper);

            // Writer Container
            const div = document.createElement('div');
            // Unique ID properly
            const id = `writer-${index}-${Date.now()}`;
            div.id = id;
            div.className = "bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors";
            div.style.width = '200px';
            div.style.height = '200px';
            wrapper.appendChild(div);

            // Create Writer
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

            // Allow click to animate individual
            div.onclick = () => writer.animateCharacter();

            writersRef.current.push(writer);

            // React render logic for download button using standard DOM is messy
            // We'll handle downloads via a separate React UI mapping below containerRef if possible
            // BUT since writers are DOM manip, mixing is hard.
            // Let's attach a pure HTML button for download for simplicity in this specific DOM-heavy component
            const downloadBtn = document.createElement('button');
            downloadBtn.className = "text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mt-1";
            downloadBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                     <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                GIF
            `;
            downloadBtn.onclick = () => handleDownloadSingle(char);
            wrapper.appendChild(downloadBtn);
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim().length > 0) {
            setDisplayChars(searchTerm);
        }
    };

    const handleAnimateAll = async () => {
        for (const writer of writersRef.current) {
            await writer.animateCharacter();
        }
    };

    const handleQuizAll = async () => {
        // Sequential quiz
        // Note: HanziWriter quiz is async but doesn't return a promise effectively for chaining easily without callback hell
        // We will try a recursive approach
        quizNext(0);
    };

    const quizNext = (index) => {
        if (index >= writersRef.current.length) return;
        const writer = writersRef.current[index];
        writer.quiz({
            onComplete: () => {
                setTimeout(() => quizNext(index + 1), 500);
            }
        });
    };

    const handleDownloadSingle = async (charToDownload) => {
        const charCode = charToDownload.charCodeAt(0).toString(16).toLowerCase();
        // Fallback to direct download link since proxy might be slow/complex for multiple
        // But for single click it's fine.
        try {
            // Try Opening direct URL first as it's fastest for user to save
            window.open(`https://www.hanzi5.com/assets/bishun/animation/${charCode}.gif`, '_blank');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-100">
            <div className="max-w-5xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-8">
                    ฝึกเขียนภาษาจีน <span className="text-blue-600">Stroke Order</span>
                </h1>

                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="flex gap-4 justify-center mb-8">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="พิมพ์คำศัพท์ (เช่น 你好)"
                            className="text-center text-3xl w-64 h-16 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-bold"
                        />
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            ค้นหา
                        </button>
                    </form>

                    {/* Writers Container */}
                    <div className="mb-8 min-h-[250px]" ref={containerRef}>
                        {/* DOM populated by initWriters */}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={handleAnimateAll}
                            className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            เล่นทั้งหมด (Animate All)
                        </button>

                        {/* <button
                            onClick={handleQuizAll}
                            className="px-6 py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            ลองเขียนทั้งหมด (Quiz All)
                        </button> */}
                    </div>

                    <p className="mt-6 text-slate-500 text-sm">
                        * พิมพ์คำศัพท์ลงในช่องแล้วกดค้นหา เพื่อดูวิธีการเขียน<br />
                        ** กด "ลองเขียนทั้งหมด" เพื่อเริ่มฝึกเขียนทีละตัวจนครบ
                    </p>
                </div>
            </div>
        </main>
    );
}

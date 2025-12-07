"use client";

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function StrokeOrderPage() {
    const [char, setChar] = useState('中'); // Default character
    const [writer, setWriter] = useState(null);
    const writerContainerRef = useRef(null);

    useEffect(() => {
        // Load HanziWriter from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
        script.async = true;
        script.onload = () => {
            initWriter(char);
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const initWriter = (character) => {
        if (!window.HanziWriter || !writerContainerRef.current) return;

        // Clear previous writer
        writerContainerRef.current.innerHTML = '';

        const newWriter = window.HanziWriter.create(writerContainerRef.current, character, {
            width: 300,
            height: 300,
            padding: 20,
            showOutline: true,
            strokeAnimationSpeed: 1,
            delayBetweenStrokes: 1000, // delay between strokes in ms
            radicalColor: '#166534', // green-800
            strokeColor: '#333333',
        });

        setWriter(newWriter);
        newWriter.animateCharacter();
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (char && char.length > 0) {
            // Take only the first character if multiple are entered
            const firstChar = char.charAt(0);
            if (firstChar !== char) {
                setChar(firstChar);
            }
            initWriter(firstChar);
        }
    };

    const handleAnimate = () => {
        if (writer) {
            writer.animateCharacter();
        }
    };

    const handleQuiz = () => {
        if (writer) {
            writer.quiz();
        }
    };

    const handleDownload = async () => {
        if (!char) return;

        try {
            // Use our own proxy API to bypass CORS
            const proxyUrl = `/api/proxy-gif?char=${encodeURIComponent(char)}`;

            // Fetch blob from our proxy
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${char}_stroke_order.gif`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Download failed:', error);
            // Fallback
            window.open(`https://bishun.shufaji.com/chinese/${char}.gif`, '_blank');
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-100">
            <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-8">
                    ฝึกเขียนภาษาจีน <span className="text-blue-600">Stroke Order</span>
                </h1>

                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="flex gap-4 justify-center mb-8">
                        <input
                            type="text"
                            value={char}
                            onChange={(e) => setChar(e.target.value)}
                            placeholder="พิมพ์ตัวอักษรจีน (เช่น 你)"
                            maxLength={1}
                            className="text-center text-4xl w-24 h-24 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 font-bold"
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

                    {/* Writer Container */}
                    <div className="flex justify-center mb-8">
                        <div
                            ref={writerContainerRef}
                            className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors"
                            onClick={handleAnimate}
                        ></div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={handleAnimate}
                            className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            เล่นซ้ำ (Animate)
                        </button>

                        <button
                            onClick={handleQuiz}
                            className="px-6 py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            ลองเขียนเอง (Quiz)
                        </button>

                        <button
                            onClick={handleDownload}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            ดาวน์โหลด GIF
                        </button>
                    </div>

                    <p className="mt-6 text-slate-500 text-sm">
                        * พิมพ์ตัวอักษรจีนลงในช่องแล้วกดค้นหา เพื่อดูวิธีการเขียน<br />
                        ** กด "ลองเขียนเอง" เพื่อฝึกเขียนตามลำดับขีด (ใช้เมาส์ลากเส้นในกรอบ)
                        <br />*** กดดาวน์โหลดเพื่อบันทึกไฟล์ GIF
                    </p>
                </div>
            </div>
        </main>
    );
}

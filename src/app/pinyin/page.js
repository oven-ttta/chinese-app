"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PinyinCard from '@/components/PinyinCard';

export default function PinyinPage() {
    const [activeId, setActiveId] = useState(null);
    const synthRef = useRef(null);

    // Initialize Synthesis once
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis;
        }
        // Cleanup on unmount
        return () => {
            if (synthRef.current) synthRef.current.cancel();
        };
    }, []);

    const speakThai = (text, id) => {
        if (!synthRef.current) return;

        // 1. STOP previous sound immediately
        synthRef.current.cancel();

        // 2. Set Active State
        setActiveId(id);

        // 3. Prepare Utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH'; // Force Thai Language
        utterance.rate = 0.9; // Slightly slower for clarity

        // Find a Thai voice if available (optional, browsers usually default correctly for th-TH)
        const voices = synthRef.current.getVoices();
        const thaiVoice = voices.find(v => v.lang.includes('th'));
        if (thaiVoice) utterance.voice = thaiVoice;

        utterance.onend = () => {
            setActiveId(null);
        };

        utterance.onerror = () => {
            setActiveId(null);
        };

        // 4. Speak
        synthRef.current.speak(utterance);
    };

    const handlePlay = (item) => {
        // Extract text inside parentheses for Thai reading
        // E.g., "b (ปัว)" -> "ปัว"
        // E.g., "เสียง 1 (High)" -> "เสียง 1 High" (We can clean this)

        let textToRead = item.label;

        // Try to capture text inside (...)
        const match = item.label.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            textToRead = match[1];
        }

        // Special cleanup for Tones if needed, otherwise "High" is read in Thai accent which is funny but okay
        // Or we can map specific IDs to specific Thai words if needed.

        speakThai(textToRead, item.id);
    };

    const initials = [
        // Labials (b p m f)
        { id: 'b', char: 'b', label: 'b (ปัว)', color: 'bg-amber-400' },
        { id: 'p', char: 'p', label: 'p (พัว)', color: 'bg-amber-400' },
        { id: 'm', char: 'm', label: 'm (มัว)', color: 'bg-amber-400' },
        { id: 'f', char: 'f', label: 'f (ฟัว)', color: 'bg-amber-400' },

        // Alveolars (d t n l)
        { id: 'd', char: 'd', label: 'd (เตอ)', color: 'bg-red-500' },
        { id: 't', char: 't', label: 't (เทอ)', color: 'bg-red-500' },
        { id: 'n', char: 'n', label: 'n (เนอ)', color: 'bg-red-500' },
        { id: 'l', char: 'l', label: 'l (เลอ)', color: 'bg-red-500' },

        // Velars (g k h)
        { id: 'g', char: 'g', label: 'g (เกอ)', color: 'bg-orange-400' },
        { id: 'k', char: 'k', label: 'k (เคอ)', color: 'bg-orange-400' },
        { id: 'h', char: 'h', label: 'h (เฮอ)', color: 'bg-orange-400' },

        // Palatals (j q x)
        { id: 'j', char: 'j', label: 'j (จี)', color: 'bg-emerald-500' },
        { id: 'q', char: 'q', label: 'q (ชี)', color: 'bg-emerald-500' },
        { id: 'x', char: 'x', label: 'x (ซี)', color: 'bg-emerald-500' },

        // Retroflexes (zh ch sh r)
        { id: 'zh', char: 'zh', label: 'zh (จือ)', color: 'bg-blue-500' },
        { id: 'ch', char: 'ch', label: 'ch (ชือ)', color: 'bg-blue-500' },
        { id: 'sh', char: 'sh', label: 'sh (ซือ)', color: 'bg-blue-500' },
        { id: 'r', char: 'r', label: 'r (ยือ)', color: 'bg-blue-500' },

        // Dental Sibilants (z c s)
        { id: 'z', char: 'z', label: 'z (จือ)', color: 'bg-purple-500' },
        { id: 'c', char: 'c', label: 'c (ชือ)', color: 'bg-purple-500' },
        { id: 's', char: 's', label: 's (ซือ)', color: 'bg-purple-500' },

        // Semi-vowels (y w)
        { id: 'y', char: 'y', label: 'y (อี)', color: 'bg-pink-500' },
        { id: 'w', char: 'w', label: 'w (อู)', color: 'bg-pink-500' },
    ];

    const vowels = [
        { id: 'a', char: 'a', label: 'a (อา)', color: 'bg-teal-500' },
        { id: 'o', char: 'o', label: 'o (โอ)', color: 'bg-teal-500' },
        { id: 'e', char: 'e', label: 'e (เออ)', color: 'bg-teal-500' },
        { id: 'i', char: 'i', label: 'i (อี)', color: 'bg-teal-500' },
        { id: 'u', char: 'u', label: 'u (อู)', color: 'bg-teal-500' },
        { id: 'ü', char: 'ü', label: 'ü (อวี)', color: 'bg-teal-500' },
    ];

    const tones = [
        { id: 'tone1', char: 'ā', label: 'เสียง 1 (High)', color: 'bg-indigo-500' },
        { id: 'tone2', char: 'á', label: 'เสียง 2 (Rising)', color: 'bg-indigo-500' },
        { id: 'tone3', char: 'ǎ', label: 'เสียง 3 (Falling-Rising)', color: 'bg-indigo-500' },
        { id: 'tone4', char: 'à', label: 'เสียง 4 (Falling)', color: 'bg-indigo-500' },
    ];

    return (
        <main className="flex-1 h-full bg-slate-50 py-4 sm:py-8 px-2 sm:px-4 md:px-8 selection:bg-blue-100">
            <div className="w-full">
                <div className="text-center mb-6 sm:mb-12">
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2 sm:mb-4 px-2">
                        ตารางพินอิน <span className="text-blue-600">Pinyin Chart</span>
                    </h1>
                    <p className="text-sm sm:text-lg text-slate-600 px-2">
                        ฝึกอ่านออกเสียงพยัญชนะ สระ และวรรณยุกต์ (ไทย)
                    </p>
                    <div className="mt-4 sm:mt-6">
                        <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            กลับหน้าหลัก
                        </Link>
                    </div>
                </div>

                {/* Initials Section */}
                <section className="mb-8 sm:mb-16">
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-6 border-l-4 border-amber-400 pl-3 sm:pl-4 flex items-center gap-1 sm:gap-2">
                        พยัญชนะ <span className="text-gray-500 text-sm sm:text-lg font-normal">(Initials)</span>
                    </h2>
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
                        {initials.map((item) => (
                            <PinyinCard
                                key={item.id}
                                char={item.char}
                                label={item.label}
                                colorClass={item.color}
                                isActive={activeId === item.id}
                                onPlay={() => handlePlay(item)}
                            />
                        ))}
                    </div>
                </section>

                {/* Vowels Section */}
                <section className="mb-8 sm:mb-16">
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-6 border-l-4 border-teal-500 pl-3 sm:pl-4 flex items-center gap-1 sm:gap-2">
                        สระเดี่ยว <span className="text-gray-500 text-sm sm:text-lg font-normal">(Simple Vowels)</span>
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                        {vowels.map((item) => (
                            <PinyinCard
                                key={item.id}
                                char={item.char}
                                label={item.label}
                                colorClass={item.color}
                                isActive={activeId === item.id}
                                onPlay={() => handlePlay(item)}
                            />
                        ))}
                    </div>
                </section>

                {/* Tones Section */}
                <section className="mb-8 sm:mb-16">
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-6 border-l-4 border-indigo-500 pl-3 sm:pl-4 flex items-center gap-1 sm:gap-2">
                        วรรณยุกต์ <span className="text-gray-500 text-sm sm:text-lg font-normal">(Tones)</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                        {tones.map((item) => (
                            <PinyinCard
                                key={item.id}
                                char={item.char}
                                label={item.label}
                                colorClass={item.color}
                                isActive={activeId === item.id}
                                onPlay={() => handlePlay(item)}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

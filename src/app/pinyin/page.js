"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PinyinCard from '@/components/PinyinCard';

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);

export default function PinyinPage() {
    const [activeId, setActiveId] = useState(null);
    const synthRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis;
        }
        return () => {
            if (synthRef.current) synthRef.current.cancel();
        };
    }, []);

    const speakThai = (text, id) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        setActiveId(id);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        utterance.rate = 0.9;

        const voices = synthRef.current.getVoices();
        const thaiVoice = voices.find(v => v.lang.includes('th'));
        if (thaiVoice) utterance.voice = thaiVoice;

        utterance.onend = () => setActiveId(null);
        utterance.onerror = () => setActiveId(null);

        synthRef.current.speak(utterance);
    };

    const handlePlay = (item) => {
        let textToRead = item.label;
        const match = item.label.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            textToRead = match[1];
        }
        speakThai(textToRead, item.id);
    };

    // Use pure color names (Tailwind generic colors)
    const initials = [
        { id: 'b', char: 'b', label: 'b (ปัว)', color: 'amber' },
        { id: 'p', char: 'p', label: 'p (พัว)', color: 'amber' },
        { id: 'm', char: 'm', label: 'm (มัว)', color: 'amber' },
        { id: 'f', char: 'f', label: 'f (ฟัว)', color: 'amber' },

        { id: 'd', char: 'd', label: 'd (เตอ)', color: 'red' },
        { id: 't', char: 't', label: 't (เทอ)', color: 'red' },
        { id: 'n', char: 'n', label: 'n (เนอ)', color: 'red' },
        { id: 'l', char: 'l', label: 'l (เลอ)', color: 'red' },

        { id: 'g', char: 'g', label: 'g (เกอ)', color: 'orange' },
        { id: 'k', char: 'k', label: 'k (เคอ)', color: 'orange' },
        { id: 'h', char: 'h', label: 'h (เฮอ)', color: 'orange' },

        { id: 'j', char: 'j', label: 'j (จี)', color: 'emerald' },
        { id: 'q', char: 'q', label: 'q (ชี)', color: 'emerald' },
        { id: 'x', char: 'x', label: 'x (ซี)', color: 'emerald' },

        { id: 'zh', char: 'zh', label: 'zh (จือ)', color: 'blue' },
        { id: 'ch', char: 'ch', label: 'ch (ชือ)', color: 'blue' },
        { id: 'sh', char: 'sh', label: 'sh (ซือ)', color: 'blue' },
        { id: 'r', char: 'r', label: 'r (ยือ)', color: 'blue' },

        { id: 'z', char: 'z', label: 'z (จือ)', color: 'purple' },
        { id: 'c', char: 'c', label: 'c (ชือ)', color: 'purple' },
        { id: 's', char: 's', label: 's (ซือ)', color: 'purple' },

        { id: 'y', char: 'y', label: 'y (อี)', color: 'pink' },
        { id: 'w', char: 'w', label: 'w (อู)', color: 'pink' },
    ];

    const vowels = [
        { id: 'a', char: 'a', label: 'a (อา)', color: 'teal' },
        { id: 'o', char: 'o', label: 'o (โอ)', color: 'teal' },
        { id: 'e', char: 'e', label: 'e (เออ)', color: 'teal' },
        { id: 'i', char: 'i', label: 'i (อี)', color: 'teal' },
        { id: 'u', char: 'u', label: 'u (อู)', color: 'teal' },
        { id: 'ü', char: 'ü', label: 'ü (อวี)', color: 'teal' },
    ];

    const tones = [
        { id: 'tone1', char: 'ā', label: 'เสียง 1 (High)', color: 'indigo' },
        { id: 'tone2', char: 'á', label: 'เสียง 2 (Rising)', color: 'indigo' },
        { id: 'tone3', char: 'ǎ', label: 'เสียง 3 (Falling-Rising)', color: 'indigo' },
        { id: 'tone4', char: 'à', label: 'เสียง 4 (Falling)', color: 'indigo' },
    ];

    return (
        <main className="flex-1 min-h-screen bg-slate-100 py-6 sm:py-10 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto">
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 text-white font-bold text-xl">
                            A
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                                ตารางพินอิน <span className="text-indigo-600">Pinyin Chart</span>
                            </h1>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                ฝึกอ่านออกเสียงพยัญชนะ สระ และวรรณยุกต์ (ไทย)
                            </p>
                        </div>
                    </div>
                    <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-semibold text-sm transition-colors bg-slate-50 hover:bg-indigo-50 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-200">
                        <BackIcon /> กลับหน้าหลัก
                    </Link>
                </div>

                {/* Initials Section */}
                <section className="mb-10 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-8 bg-amber-400 rounded-full"></div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                            พยัญชนะ <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">(Initials)</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 md:gap-5">
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
                <section className="mb-10 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-8 bg-teal-400 rounded-full"></div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                            สระเดี่ยว <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">(Simple Vowels)</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
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
                <section className="mb-10 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                            วรรณยุกต์ <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">(Tones)</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
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

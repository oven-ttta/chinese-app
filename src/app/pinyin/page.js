"use client";

import { useState } from 'react';
import PinyinCard from '@/components/PinyinCard';

export default function PinyinPage() {
    const [activeId, setActiveId] = useState(null);

    const handlePlay = (id) => {
        setActiveId(id);
    };

    const handleStop = () => {
        setActiveId(null);
    };

    const initials = [
        { id: 'b', char: 'b', label: 'b (ป)', color: 'bg-amber-400' },
        { id: 'p', char: 'p', label: 'p (พ)', color: 'bg-amber-400' },
        { id: 'm', char: 'm', label: 'm (ม)', color: 'bg-amber-400' },
        { id: 'f', char: 'f', label: 'f (ฟ)', color: 'bg-amber-400' },
        { id: 'd', char: 'd', label: 'd (ต)', color: 'bg-red-600' },
        { id: 't', char: 't', label: 't (ท)', color: 'bg-red-600' },
        { id: 'n', char: 'n', label: 'n (น)', color: 'bg-red-600' },
        { id: 'l', char: 'l', label: 'l (ล)', color: 'bg-red-600' },
        { id: 'g', char: 'g', label: 'g (ก)', color: 'bg-orange-400' },
        { id: 'k', char: 'k', label: 'k (ค)', color: 'bg-orange-400' },
        { id: 'h', char: 'h', label: 'h (ฮ)', color: 'bg-orange-400' },
        { id: 'j', char: 'j', label: 'j (จ)', color: 'bg-pink-500' },
        { id: 'q', char: 'q', label: 'q (ช)', color: 'bg-pink-500' },
        { id: 'x', char: 'x', label: 'x (ซ)', color: 'bg-pink-500' },
        { id: 'zh', char: 'zh', label: 'zh (จ)', color: 'bg-green-500' },
        { id: 'ch', char: 'ch', label: 'ch (ช)', color: 'bg-green-500' },
        { id: 'sh', char: 'sh', label: 'sh (ซ)', color: 'bg-green-500' },
        { id: 'r', char: 'r', label: 'r (ย/ร)', color: 'bg-green-500' },
        { id: 'z', char: 'z', label: 'z (จ)', color: 'bg-purple-500' },
        { id: 'c', char: 'c', label: 'c (ช)', color: 'bg-purple-500' },
        { id: 's', char: 's', label: 's (ซ)', color: 'bg-purple-500' },
        { id: 'y', char: 'y', label: 'y (ย)', color: 'bg-blue-400' },
        { id: 'w', char: 'w', label: 'w (ว)', color: 'bg-blue-400' },
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
        { id: 'tone1', char: 'ā', label: 'เสียง 1 (ˉ)', color: 'bg-indigo-500' },
        { id: 'tone2', char: 'á', label: 'เสียง 2 (ˊ)', color: 'bg-indigo-500' },
        { id: 'tone3', char: 'ǎ', label: 'เสียง 3 (ˇ)', color: 'bg-indigo-500' },
        { id: 'tone4', char: 'à', label: 'เสียง 4 (ˋ)', color: 'bg-indigo-500' },
    ];

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-100">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
                        พินอิน <span className="text-blue-600">Pinyin</span>
                    </h1>
                    <p className="text-lg text-slate-600">
                        ฝึกอ่านออกเสียงพยัญชนะ สระ และวรรณยุกต์ (Initials, Vowels, Tones)
                    </p>
                    <div className="mt-6">
                        <a href="/" className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            กลับหน้าหลัก (Back to Home)
                        </a>
                    </div>
                </div>

                {/* Initials Section */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 border-l-4 border-amber-400 pl-4">
                        พยัญชนะ (Initials)
                    </h2>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                        {initials.map((item) => (
                            <PinyinCard
                                key={item.id}
                                char={item.char}
                                label={item.label}
                                colorClass={item.color}
                                isActive={activeId === item.id}
                                onPlay={() => handlePlay(item.id)}
                                onStop={handleStop}
                            />
                        ))}
                    </div>
                </section>

                {/* Vowels Section */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 border-l-4 border-teal-500 pl-4">
                        สระเดี่ยว (Simple Vowels)
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {vowels.map((item) => (
                            <PinyinCard
                                key={item.id}
                                char={item.char}
                                label={item.label}
                                colorClass={item.color}
                                isActive={activeId === item.id}
                                onPlay={() => handlePlay(item.id)}
                                onStop={handleStop}
                            />
                        ))}
                    </div>
                </section>

                {/* Tones Section */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 border-l-4 border-indigo-500 pl-4">
                        วรรณยุกต์ (Tones)
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {tones.map((item) => (
                            <PinyinCard
                                key={item.id}
                                char={item.char}
                                label={item.label}
                                colorClass={item.color}
                                isActive={activeId === item.id}
                                onPlay={() => handlePlay(item.id)}
                                onStop={handleStop}
                            />
                        ))}
                    </div>
                </section>

                <footer className="mt-20 text-center text-slate-400 text-sm">
                    <p>Created with Next.js & Tailwind CSS</p>
                </footer>
            </div>
        </main>
    );
}

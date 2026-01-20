"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function ReportPage() {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('All');

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/words', { cache: 'no-store' });
                const data = await response.json();
                setWords(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const uniqueDates = useMemo(() => {
        return [...new Set(words.map(w => w.date).filter(Boolean))].sort().reverse();
    }, [words]);

    const stats = useMemo(() => {
        const targetWords = selectedDate === 'All'
            ? words
            : words.filter(w => w.date === selectedDate);

        return targetWords.reduce((acc, word) => {
            const person = word.contributor || 'ไม่ระบุ (Unknown)';
            if (!acc[person]) {
                acc[person] = {
                    name: person,
                    count: 0,
                    words: [],
                    dates: new Set()
                };
            }
            acc[person].count++;
            acc[person].words.push(word);
            if (word.date) acc[person].dates.add(word.date);
            return acc;
        }, {});
    }, [words, selectedDate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 py-4 sm:py-8 md:py-12 px-2 sm:px-4 md:px-6 lg:px-8">
            <div className="w-full">
                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">สรุปการบันทึกข้อมูล</h1>
                        <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
                            &larr; กลับหน้าหลัก
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium text-slate-700">วันที่:</span>
                        <select
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border border-slate-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            <option value="All">ทั้งหมด (All Time)</option>
                            {uniqueDates.map(date => (
                                <option key={date} value={date}>{date}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {Object.values(stats).map((person) => (
                        <Link
                            href={`/report/${encodeURIComponent(person.name)}?date=${selectedDate}`}
                            key={person.name}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 block hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{person.name}</h2>
                            <div className="flex justify-between items-end mb-3 sm:mb-4">
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-500">จำนวนคำศัพท์</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{person.count}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs sm:text-sm text-slate-500">วันที่บันทึก</p>
                                    <p className="text-xs sm:text-sm font-medium text-slate-700 max-w-[120px] truncate">
                                        {Array.from(person.dates).sort().slice(-2).join(', ') || '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
                                <h3 className="text-xs sm:text-sm font-semibold text-slate-600 mb-2">คำศัพท์ล่าสุด:</h3>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {person.words.slice(0, 4).map((w, i) => (
                                        <span key={i} className="inline-block bg-slate-100 text-slate-700 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                            {w.char}
                                        </span>
                                    ))}
                                    {person.words.length > 4 && (
                                        <span className="text-[10px] sm:text-xs text-slate-400 py-0.5 sm:py-1">+{person.words.length - 4}</span>
                                    )}
                                </div>

                                <div className="mt-3 sm:mt-4 text-center text-blue-600 text-xs sm:text-sm font-medium opacity-80 group-hover:opacity-100">
                                    ดูทั้งหมด &rarr;
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {Object.keys(stats).length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        {selectedDate === 'All'
                            ? 'ยังไม่มีข้อมูลผู้บันทึก (No contribution data available)'
                            : `ไม่มีข้อมูลสำหรับวันที่ ${selectedDate}`}
                    </div>
                )}
            </div>
        </main>
    );
}

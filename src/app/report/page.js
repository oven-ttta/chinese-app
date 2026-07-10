"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
);
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);

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
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
        );
    }

    return (
        <main className="flex-1 min-h-screen bg-slate-100 py-6 sm:py-10 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
                            <ChartIcon />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">สรุปการบันทึกข้อมูล</h1>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">วันที่:</span>
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent text-sm font-bold text-indigo-700 focus:outline-none cursor-pointer outline-none"
                            >
                                <option value="All">ทั้งหมด (All Time)</option>
                                {uniqueDates.map(date => (
                                    <option key={date} value={date}>{date}</option>
                                ))}
                            </select>
                        </div>
                        <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-semibold text-sm transition-colors bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200">
                            <BackIcon /> <span className="hidden sm:inline">กลับหน้าหลัก</span>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {Object.values(stats).map((person) => (
                        <Link
                            href={`/report/${encodeURIComponent(person.name)}?date=${selectedDate}`}
                            key={person.name}
                            className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 block hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group hover:-translate-y-1"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{person.name}</h2>
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg group-hover:bg-indigo-100 transition-colors">
                                    {person.name.charAt(0)}
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-5">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">จำนวนคำศัพท์</p>
                                    <p className="text-4xl font-extrabold text-indigo-600 leading-none">{person.count}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">วันที่บันทึก</p>
                                    <p className="text-xs font-semibold text-slate-600 max-w-[120px] truncate">
                                        {Array.from(person.dates).sort().slice(-2).join(', ') || '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 pt-5 border-t border-slate-100">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">คำศัพท์ล่าสุด</h3>
                                <div className="flex flex-wrap gap-2">
                                    {person.words.slice(0, 4).map((w, i) => (
                                        <span key={i} className="inline-block bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                                            {w.char}
                                        </span>
                                    ))}
                                    {person.words.length > 4 && (
                                        <span className="text-xs text-slate-400 py-1 font-medium">+{person.words.length - 4}</span>
                                    )}
                                </div>

                                <div className="mt-5 text-center bg-slate-50 text-slate-600 text-sm font-bold py-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    ดูรายละเอียด &rarr;
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {Object.keys(stats).length === 0 && (
                    <div className="text-center py-20 mt-8 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300">
                        {selectedDate === 'All'
                            ? 'ยังไม่มีข้อมูลผู้บันทึก (No contribution data available)'
                            : `ไม่มีข้อมูลสำหรับวันที่ ${selectedDate}`}
                    </div>
                )}
            </div>
        </main>
    );
}

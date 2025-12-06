"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReportPage() {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/words', { cache: 'no-store' });
                const data = await response.json();
                setWords(data);
                processStats(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const processStats = (data) => {
        const statsByPerson = data.reduce((acc, word) => {
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
        setStats(statsByPerson);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">สรุปการบันทึกข้อมูล (Contribution Report)</h1>
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                        &larr; กลับหน้าหลัก
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.values(stats).map((person) => (
                        <Link
                            href={`/report/${encodeURIComponent(person.name)}`}
                            key={person.name}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 block hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{person.name}</h2>
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-sm text-slate-500">จำนวนคำศัพท์</p>
                                    <p className="text-3xl font-bold text-blue-600">{person.count}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">วันที่บันทึก</p>
                                    <p className="text-sm font-medium text-slate-700">
                                        {Array.from(person.dates).sort().join(', ') || '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">คำศัพท์ที่บันทึก (Recent):</h3>
                                <div className="flex flex-wrap gap-2">
                                    {person.words.slice(0, 5).map((w, i) => (
                                        <span key={i} className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
                                            {w.char} ({w.pinyin})
                                        </span>
                                    ))}
                                    {person.words.length > 5 && (
                                        <span className="text-xs text-slate-400 py-1">+ {person.words.length - 5} more</span>
                                    )}
                                </div>

                                <div className="mt-4 text-center text-blue-600 text-sm font-medium opacity-80 group-hover:opacity-100">
                                    ดูทั้งหมด &rarr;
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {Object.keys(stats).length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        ยังไม่มีข้อมูลผู้บันทึก (No contribution data available)
                    </div>
                )}
            </div>
        </main>
    );
}

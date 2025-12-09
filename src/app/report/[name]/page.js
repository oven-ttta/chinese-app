"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WordCard from '@/components/WordCard';

export default function ContributorResults() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);

    // Initialize queryDate from URL or default to 'All'
    // We use a state to allow changing it in this page
    const [selectedDate, setSelectedDate] = useState('All');

    // Decode the contributor name accurately
    const contributorName = params?.name ? decodeURIComponent(params.name) : '';

    useEffect(() => {
        // Sync state with URL param on mount
        const dateParam = searchParams.get('date');
        if (dateParam) {
            setSelectedDate(dateParam);
        }
    }, [searchParams]);

    useEffect(() => {
        async function fetchWords() {
            try {
                const response = await fetch('/api/words', { cache: 'no-store' });
                const data = await response.json();

                // Filter words by contributor first (get ALL their words)
                const filtered = data.filter(w =>
                    w.contributor === contributorName ||
                    (w.contributor === '' && contributorName === 'ไม่ระบุ (Unknown)')
                );

                setWords(filtered);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }

        if (contributorName) {
            fetchWords();
        } else {
            setLoading(false);
        }
    }, [contributorName]);

    // Calculate unique dates available for this user
    const uniqueDates = useMemo(() => {
        return [...new Set(words.map(w => w.date).filter(Boolean))].sort().reverse();
    }, [words]);

    // Filter words based on selectedDate
    const displayedWords = useMemo(() => {
        if (selectedDate === 'All') return words;
        return words.filter(w => w.date === selectedDate);
    }, [words, selectedDate]);

    const handlePlay = (id) => {
        setActiveId(id);
    };

    const handleStop = () => {
        setActiveId(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full">
                <div className="mb-6 sm:mb-8">
                    <Link href="/report" className="text-blue-600 hover:text-blue-800 font-medium mb-3 sm:mb-4 inline-block transition-colors">
                        &larr; กลับหน้าสรุป (Back to Report)
                    </Link>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
                                รายการคำศัพท์ของ: <span className="text-blue-600">{contributorName}</span>
                            </h1>
                            <p className="text-slate-600 mt-2 text-sm sm:text-base">
                                ทั้งหมด {displayedWords.length} คำ {selectedDate !== 'All' ? `(จาก ${words.length} คำ)` : ''}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">วันที่:</span>
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            >
                                <option value="All">ทั้งหมด (All Time)</option>
                                {uniqueDates.map(date => (
                                    <option key={date} value={date}>{date}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
                    {displayedWords.map((word) => (
                        <WordCard
                            key={word.id}
                            word={word}
                            isActive={activeId === word.id}
                            onPlay={() => handlePlay(word.id)}
                            onStop={handleStop}
                        />
                    ))}

                    {displayedWords.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-400">
                            {selectedDate === 'All'
                                ? 'ไม่พบคำศัพท์สำหรับผู้บันทึกนี้'
                                : `ไม่พบคำศัพท์ในวันที่ ${selectedDate}`}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

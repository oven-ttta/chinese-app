"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WordCard from '@/components/WordCard';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { recordHanziVideo } from '@/utils/hanziRecorder';

export default function ContributorResults() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);

    // Selection state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

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

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const selectAll = () => {
        const allIds = displayedWords.map(w => w.id);
        setSelectedIds(new Set(allIds));
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleDownloadZip = async () => {
        if (selectedIds.size === 0) return;
        setIsDownloading(true);
        setDownloadProgress(0);
        const zip = new JSZip();
        const selectedWords = words.filter(w => selectedIds.has(w.id));

        let completed = 0;
        for (const word of selectedWords) {
            try {
                const blob = await recordHanziVideo(word.char);
                zip.file(`${word.char}_${word.pinyin}.webm`, blob);
                completed++;
                setDownloadProgress(Math.round((completed / selectedWords.length) * 100));
            } catch (err) {
                console.error(err);
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `report_${contributorName}_${Date.now()}.zip`);
        setIsDownloading(false);
        setDownloadProgress(0);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 py-4 sm:py-8 md:py-12 px-2 sm:px-4 md:px-6 lg:px-8 pb-24">
            <div className="w-full">
                <div className="mb-4 sm:mb-6 md:mb-8">
                    <Link href="/report" className="text-blue-600 hover:text-blue-800 font-medium mb-2 sm:mb-4 inline-block transition-colors text-sm">
                        &larr; กลับหน้าสรุป
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-3 sm:gap-4">
                            <div>
                                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 break-all">
                                    รายการคำศัพท์ของ: <span className="text-blue-600">{contributorName}</span>
                                </h1>
                                <p className="text-slate-600 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
                                    ทั้งหมด {displayedWords.length} คำ {selectedDate !== 'All' ? `(จาก ${words.length} คำ)` : ''}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-medium text-slate-700">วันที่:</span>
                                <select
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border border-slate-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                                >
                                    <option value="All">ทั้งหมด (All Time)</option>
                                    {uniqueDates.map(date => (
                                        <option key={date} value={date}>{date}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Batch Download Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">เลือกแล้ว {selectedIds.size} คำ</span>
                                <div className="flex gap-3">
                                    <button onClick={selectAll} className="text-xs text-blue-600 hover:underline font-medium">เลือกทั้งหมด</button>
                                    <button onClick={deselectAll} className="text-xs text-red-600 hover:underline font-medium">ล้าง</button>
                                </div>
                            </div>

                            <button
                                onClick={handleDownloadZip}
                                disabled={selectedIds.size === 0 || isDownloading}
                                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold shadow-md transition-all text-sm
                                    ${selectedIds.size === 0 || isDownloading
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'}`}
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                        {downloadProgress}%
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        ดาวน์โหลด Video (.ZIP)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                    {displayedWords.map((word) => (
                        <WordCard
                            key={word.id}
                            word={word}
                            isActive={activeId === word.id}
                            isSelected={selectedIds.has(word.id)}
                            onPlay={() => handlePlay(word.id)}
                            onStop={handleStop}
                            onSelect={() => toggleSelect(word.id)}
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

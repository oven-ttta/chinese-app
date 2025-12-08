"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import WordCard from '@/components/WordCard';

export default function ContributorResults() {
    const params = useParams();
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);

    // Decode the contributor name accurately
    const contributorName = params?.name ? decodeURIComponent(params.name) : '';

    useEffect(() => {
        async function fetchWords() {
            try {
                const response = await fetch('/api/words', { cache: 'no-store' });
                const data = await response.json();

                // Filter words by contributor
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
            // If name is somehow not ready, maybe wait or just don't fetch yet.
            // But usually it should be ready. 
            // If it is empty string, we might fetch nothing or all? 
            // Let's assume valid name.
            setLoading(false);
        }
    }, [contributorName]);

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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
                        รายการคำศัพท์ของ: <span className="text-blue-600">{contributorName}</span>
                    </h1>
                    <p className="text-slate-600 mt-2 text-sm sm:text-base">
                        ทั้งหมด {words.length} คำ
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
                    {words.map((word) => (
                        <WordCard
                            key={word.id}
                            word={word}
                            isActive={activeId === word.id}
                            onPlay={() => handlePlay(word.id)}
                            onStop={handleStop}
                        />
                    ))}

                    {words.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-400">
                            ไม่พบคำศัพท์สำหรับผู้บันทึกนี้
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

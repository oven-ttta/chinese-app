"use client";

import { useState, useEffect } from 'react';
import WordCard from '@/components/WordCard';

export default function Home() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [selectedVowel, setSelectedVowel] = useState('all');
  const [selectedTone, setSelectedTone] = useState('all');

  useEffect(() => {
    async function fetchWords() {
      try {
        const response = await fetch('/api/words', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch words');
        }
        const data = await response.json();
        setWords(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWords();
  }, []);

  const handlePlay = (id) => {
    setActiveId(id);
  };

  const handleStop = () => {
    setActiveId(null);
  };

  // Filter Logic
  const filteredWords = words.filter(word => {
    // Vowel Filter
    if (selectedVowel !== 'all') {
      const pinyinLower = (word.pinyin || '').toLowerCase();
      if (selectedVowel === 'ü') {
        const uUmlautVariants = ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'v'];
        const hasExplicitU = uUmlautVariants.some(v => pinyinLower.includes(v));
        if (!hasExplicitU) {
          const uVariants = ['u', 'ū', 'ú', 'ǔ', 'ù'];
          const initials = ['j', 'q', 'x', 'y'];
          const hasHiddenU = initials.some(initial => {
            return uVariants.some(u => pinyinLower.includes(initial + u));
          });
          if (!hasHiddenU) return false;
        }
      } else {
        const baseVowels = {
          'a': ['a', 'ā', 'á', 'ǎ', 'à'],
          'o': ['o', 'ō', 'ó', 'ǒ', 'ò'],
          'e': ['e', 'ē', 'é', 'ě', 'è'],
          'i': ['i', 'ī', 'í', 'ǐ', 'ì'],
          'u': ['u', 'ū', 'ú', 'ǔ', 'ù'],
        };

        if (baseVowels[selectedVowel]) {
          const hasVowel = baseVowels[selectedVowel].some(v => pinyinLower.includes(v));
          if (!hasVowel) return false;
        } else {
          if (!pinyinLower.includes(selectedVowel)) return false;
        }
      }
    }

    // Tone Filter
    if (selectedTone !== 'all') {
      if (!String(word.tone || '').includes(selectedTone)) return false;
    }

    return true;
  });

  const vowels = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'a', label: 'a (อา)' },
    { id: 'o', label: 'o (โอ)' },
    { id: 'e', label: 'e (เออ)' },
    { id: 'i', label: 'i (อี)' },
    { id: 'u', label: 'u (อู)' },
    { id: 'ü', label: 'ü (อวี)' },
  ];

  const tones = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: '1', label: 'เสียง 1 (ˉ)' },
    { id: '2', label: 'เสียง 2 (ˊ)' },
    { id: '3', label: 'เสียง 3 (ˇ)' },
    { id: '4', label: 'เสียง 4 (ˋ)' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="text-red-500 text-xl font-semibold">Error: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          ลองใหม่ (Retry)
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-100">
      <div className="max-w-7xl mx-auto">

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-100 flex flex-col lg:flex-row flex-wrap items-start lg:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">

          {/* Vowel Filter */}
          <div className="w-full sm:w-auto flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <label htmlFor="vowel-select" className="text-sm font-bold text-slate-700 whitespace-nowrap min-w-fit">
              สระ (Vowel):
            </label>
            <select
              id="vowel-select"
              value={selectedVowel}
              onChange={(e) => setSelectedVowel(e.target.value)}
              className="block w-full pl-3 pr-10 py-2.5 text-base text-slate-900 font-medium border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg shadow-sm hover:border-blue-300 transition-colors cursor-pointer"
            >
              {vowels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tone Filter */}
          <div className="w-full sm:w-auto flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <label htmlFor="tone-select" className="text-sm font-bold text-slate-700 whitespace-nowrap min-w-fit">
              วรรณยุกต์ (Tone):
            </label>
            <select
              id="tone-select"
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="block w-full pl-3 pr-10 py-2.5 text-base text-slate-900 font-medium border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg shadow-sm hover:border-blue-300 transition-colors cursor-pointer"
            >
              {tones.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Word Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6 lg:gap-8">
          {filteredWords.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              isActive={activeId === word.id}
              onPlay={() => handlePlay(word.id)}
              onStop={handleStop}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

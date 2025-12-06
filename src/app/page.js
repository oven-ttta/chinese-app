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
      // Note: This might be too simple if we want strict "main vowel" matching, 
      // but for a basic filter it works.
      // For 'ü', we check 'ü' or 'v' (common typing for ü)
      // Also 'u' after j, q, x, y represents 'ü'
      if (selectedVowel === 'ü') {
        // Check for explicit ü and its tone variants
        const uUmlautVariants = ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'v'];
        const hasExplicitU = uUmlautVariants.some(v => pinyinLower.includes(v));

        if (hasExplicitU) {
          // keep it
        } else {
          // Check for hidden ü (u after j, q, x, y)
          const uVariants = ['u', 'ū', 'ú', 'ǔ', 'ù'];
          const initials = ['j', 'q', 'x', 'y'];
          const hasHiddenU = initials.some(initial => {
            return uVariants.some(u => pinyinLower.includes(initial + u));
          });
          if (!hasHiddenU) return false;
        }
      } else {
        // Remove tone marks for easier checking? 
        // Actually, let's check if the character is present.
        // But pinyin often has tone marks on vowels (ā, á, ǎ, à).
        // Standardizing to base vowel might be better.
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
          // Fallback
          if (!pinyinLower.includes(selectedVowel)) return false;
        }
      }
    }

    // Tone Filter
    if (selectedTone !== 'all') {
      // Check if the tone string contains the selected tone number
      // The data format is like "เสียง 4" or "เสียง 1, เสียง 1"
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
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight sm:text-6xl">
            เรียนภาษาจีน <span className="text-blue-600">Chinese</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            ฝึกอ่านและฟังเสียงภาษาจีนพื้นฐาน (Basic Chinese Vocabulary)
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-sm text-slate-500 border border-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>กดที่การ์ดเพื่อฟังเสียง (Click card to listen)</span>
            </div>

            <a href="/pinyin" className="inline-flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full shadow-sm text-sm text-amber-700 border border-amber-200 hover:bg-amber-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              <span>ตารางพินอิน (Pinyin Chart)</span>
            </a>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <a href="/add" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              เพิ่มคำศัพท์ใหม่ (Add Word)
            </a>
            <a href="/report" className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              สรุปข้อมูล (Report)
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Vowel Filter */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="vowel-select" className="text-sm font-semibold text-slate-700 whitespace-nowrap">
              สระ (Vowel):
            </label>
            <select
              id="vowel-select"
              value={selectedVowel}
              onChange={(e) => setSelectedVowel(e.target.value)}
              className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-slate-50"
            >
              {vowels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tone Filter */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="tone-select" className="text-sm font-semibold text-slate-700 whitespace-nowrap">
              วรรณยุกต์ (Tone):
            </label>
            <select
              id="tone-select"
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-slate-50"
            >
              {tones.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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

        <footer className="mt-20 text-center text-slate-400 text-sm">
          <p>Created with Next.js & Tailwind CSS</p>
        </footer>
      </div>
    </main>
  );
}

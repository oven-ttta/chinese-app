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
      const pinyinLower = word.pinyin.toLowerCase();
      // Simple check for vowel presence. 
      // Note: This might be too simple if we want strict "main vowel" matching, 
      // but for a basic filter it works.
      // For 'ü', we check 'ü' or 'v' (common typing for ü)
      if (selectedVowel === 'ü') {
        if (!pinyinLower.includes('ü') && !pinyinLower.includes('v')) return false;
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
      // Assuming word.tone is a number or string '1', '2', '3', '4'
      if (String(word.tone) !== String(selectedTone)) return false;
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-red-500 text-xl">Error: {error}</div>
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
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-sm text-slate-500 border border-slate-200 mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>กดที่การ์ดเพื่อฟังเสียง (Click card to listen)</span>
          </div>

          <div className="mt-6">
            <a href="/add" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              เพิ่มคำศัพท์ใหม่ (Add Word)
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 space-y-6">
          {/* Vowel Filter */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">เลือกสระ (Vowel)</h3>
            <div className="flex flex-wrap gap-2">
              {vowels.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVowel(v.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${selectedVowel === v.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone Filter */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">เลือกเสียงวรรณยุกต์ (Tone)</h3>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTone(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${selectedTone === t.id
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
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

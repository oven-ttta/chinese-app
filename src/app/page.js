"use client";

import { useState, useEffect } from 'react';
import WordCard from '@/components/WordCard';

export default function Home() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWords() {
      try {
        const response = await fetch('/api/words');
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {words.map((word) => (
            <WordCard key={word.id} word={word} />
          ))}
        </div>

        <footer className="mt-20 text-center text-slate-400 text-sm">
          <p>Created with Next.js & Tailwind CSS</p>
        </footer>
      </div>
    </main>
  );
}

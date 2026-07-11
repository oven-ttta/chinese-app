"use client";

import { useState, useEffect, useMemo } from 'react';
import WordCard from '@/components/WordCard';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { recordHanziVideo } from '@/utils/hanziRecorder';

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);
const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const SortIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
);
const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);

const ITEMS_PER_PAGE = 48;

export default function Home() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  
  // Filter, Search, Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVowel, setSelectedVowel] = useState('all');
  const [selectedTone, setSelectedTone] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'pinyin_asc', 'pinyin_desc'
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    async function fetchWords() {
      try {
        const response = await fetch('/api/words', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch words');
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

  const handlePlay = (id) => setActiveId(id);
  const handleStop = () => setActiveId(null);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredAndSortedWords.map(w => w.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleDownloadZip = async () => {
    if (selectedIds.size === 0) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    const zip = new JSZip();
    const selectedWords = words.filter(w => selectedIds.has(w.id));

    let completed = 0;
    for (const word of selectedWords) {
      try {
        const blob = await recordHanziVideo(word, 1080, 1440, (internalProgress) => {
          const currentPercent = ((completed + internalProgress) / selectedWords.length) * 100;
          setDownloadProgress(currentPercent.toFixed(1));
        });
        zip.file(`${word.char}_${word.pinyin}.webm`, blob);
        completed++;
        setDownloadProgress(((completed / selectedWords.length) * 100).toFixed(1));
      } catch (err) {
        console.error(`Failed to record ${word.char}:`, err);
      }
    }
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `chinese_words_video_${Date.now()}.zip`);
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedVowel, selectedTone, sortOrder]);

  const filteredAndSortedWords = useMemo(() => {
    let result = words.filter(word => {
      // 1. Search Filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesChar = (word.char || '').toLowerCase().includes(query);
        const matchesPinyin = (word.pinyin || '').toLowerCase().includes(query);
        const matchesThai = (word.thai || '').toLowerCase().includes(query);
        const matchesMeaning = (word.meaning || '').toLowerCase().includes(query);
        if (!matchesChar && !matchesPinyin && !matchesThai && !matchesMeaning) return false;
      }

      // 2. Vowel Filter
      if (selectedVowel !== 'all') {
        const pinyinLower = (word.pinyin || '').toLowerCase();
        if (selectedVowel === 'ü') {
          const uUmlautVariants = ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'v'];
          if (!uUmlautVariants.some(v => pinyinLower.includes(v))) {
            const uVariants = ['u', 'ū', 'ú', 'ǔ', 'ù'];
            const initials = ['j', 'q', 'x', 'y'];
            if (!initials.some(initial => uVariants.some(u => pinyinLower.includes(initial + u)))) return false;
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
            if (!baseVowels[selectedVowel].some(v => pinyinLower.includes(v))) return false;
          } else {
            if (!pinyinLower.includes(selectedVowel)) return false;
          }
        }
      }

      // 3. Tone Filter
      if (selectedTone !== 'all') {
        if (!String(word.tone || '').includes(selectedTone)) return false;
      }

      return true;
    });

    // 4. Sort
    result.sort((a, b) => {
      if (sortOrder === 'newest' || sortOrder === 'oldest') {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateA !== dateB) {
          return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        }
        return sortOrder === 'newest' ? String(b.id).localeCompare(String(a.id)) : String(a.id).localeCompare(String(b.id));
      } else if (sortOrder === 'pinyin_asc') {
        return (a.pinyin || '').localeCompare(b.pinyin || '');
      } else if (sortOrder === 'pinyin_desc') {
        return (b.pinyin || '').localeCompare(a.pinyin || '');
      }
      return 0;
    });

    return result;
  }, [words, searchTerm, selectedVowel, selectedTone, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedWords.length / ITEMS_PER_PAGE) || 1;
  const paginatedWords = filteredAndSortedWords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

  const sortOptions = [
    { id: 'newest', label: 'เพิ่มล่าสุด' },
    { id: 'oldest', label: 'เก่าสุด' },
    { id: 'pinyin_asc', label: 'พินอิน (A-Z)' },
    { id: 'pinyin_desc', label: 'พินอิน (Z-A)' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
        <div className="text-red-500 text-xl font-bold bg-white p-6 rounded-2xl shadow-sm">Error: {error}</div>
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors shadow-sm font-semibold">
          ลองใหม่ (Retry)
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-slate-100 py-6 sm:py-8 px-4 sm:px-6 md:px-8 pb-24">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header / Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
              <ZapIcon />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">คลังคำศัพท์ภาษาจีน</h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="ค้นหา (จีน, พินอิน, ไทย, ความหมาย)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row flex-wrap items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-indigo-700 font-bold mb-1 lg:mb-0">
            <FilterIcon />
            <span>ตัวกรองและจัดเรียง</span>
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto flex-1 justify-end">
            <div className="w-full sm:w-auto flex-1 sm:flex-none flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label htmlFor="sort-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><SortIcon /> จัดเรียง</label>
              <select
                id="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-slate-700 outline-none transition-all cursor-pointer"
              >
                {sortOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-auto flex-1 sm:flex-none flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label htmlFor="vowel-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider">สระ</label>
              <select
                id="vowel-select"
                value={selectedVowel}
                onChange={(e) => setSelectedVowel(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-slate-700 outline-none transition-all cursor-pointer"
              >
                {vowels.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-auto flex-1 sm:flex-none flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label htmlFor="tone-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider">วรรณยุกต์</label>
              <select
                id="tone-select"
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-slate-700 outline-none transition-all cursor-pointer"
              >
                {tones.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Selection Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-indigo-900 bg-indigo-100 px-3 py-1 rounded-lg">เลือกแล้ว {selectedIds.size} คำ</span>
            <button onClick={selectAll} className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold underline-offset-4 hover:underline">เลือกทั้งหมดหน้านี้</button>
            <button onClick={deselectAll} className="text-sm text-slate-500 hover:text-red-500 font-semibold underline-offset-4 hover:underline">ล้างการเลือก</button>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={selectedIds.size === 0 || isDownloading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
              selectedIds.size === 0 || isDownloading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                กำลังโหลด... {downloadProgress}%
              </>
            ) : (
              <>
                <DownloadIcon />
                ดาวน์โหลด ZIP
              </>
            )}
          </button>
        </div>

        {/* Info Text */}
        <div className="mb-4 text-sm font-bold text-slate-500">
          แสดงผล {filteredAndSortedWords.length} คำศัพท์ (หน้า {currentPage} จาก {totalPages})
        </div>

        {/* Word Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4 md:gap-5 mb-8">
          {paginatedWords.map((word) => (
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
          {paginatedWords.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
              ไม่พบคำศัพท์ที่ตรงกับการค้นหาและตัวกรอง
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pb-10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft />
            </button>
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Simple pagination display logic to prevent too many buttons
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg border font-bold transition-colors cursor-pointer ${
                        currentPage === pageNum 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 || 
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="w-10 h-10 flex items-center justify-center text-slate-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight />
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

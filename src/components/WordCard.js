"use client";

import { useState, useEffect } from 'react';
import { recordHanziVideo } from '@/utils/hanziRecorder';
import { saveAs } from 'file-saver';
import HanziPlayer from './HanziPlayer';

// Global variable to track the currently playing proxy audio
let currentProxyAudio = null;

// Icons
const VolumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
);

export default function WordCard({ word, isActive, isSelected, onPlay, onStop, onSelect }) {
    const [voice, setVoice] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [translatedEnglish, setTranslatedEnglish] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    useEffect(() => {
        if (!word.meaning) return;
        let cancelled = false;

        const fetchTranslation = async () => {
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const res = await fetch(`/api/translate?text=${encodeURIComponent(word.meaning)}&from=th&to=en`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    if (cancelled) return;
                    if (data.translatedText) setTranslatedEnglish(data.translatedText);
                    return;
                } catch (err) {
                    if (cancelled) return;
                    if (attempt === 2) {
                        console.error('Translation error:', err);
                        return;
                    }
                    await new Promise(r => setTimeout(r, 500 * (attempt + 1) + Math.random() * 500));
                }
            }
        };

        fetchTranslation();
        return () => { cancelled = true; };
    }, [word.meaning]);

    useEffect(() => {
        const loadVoices = () => {
            const voices = typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : [];
            const maleVoice = voices.find(v =>
                (v.lang.includes('zh') || v.lang.includes('CN')) &&
                (v.name.includes('Male') || v.name.includes('Kangkang') || v.name.includes('Danny'))
            );
            const anyChineseVoice = voices.find(v => v.lang === 'zh-CN' || v.lang === 'zh');
            setVoice(maleVoice || anyChineseVoice);
        };

        loadVoices();
        if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, []);

    useEffect(() => {
        let currentAudio = null;
        let utterance = null;

        const playProxy = () => {
            currentAudio = new Audio(`/api/tts?text=${encodeURIComponent(word.char)}&lang=zh-CN`);
            currentProxyAudio = currentAudio;

            currentAudio.onended = () => {
                currentProxyAudio = null;
                onStop();
            };
            currentAudio.onerror = (e) => {
                console.error('Proxy TTS error:', e);
                currentProxyAudio = null;
                onStop();
            };

            currentAudio.play().catch(err => {
                console.error('Proxy play error:', err);
                currentProxyAudio = null;
                onStop();
            });
        };

        if (isActive) {
            if (currentProxyAudio) {
                currentProxyAudio.pause();
                currentProxyAudio = null;
            }
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }

            playProxy();
        }

        return () => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
            if (utterance && typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, [isActive, word.char, voice, onStop]);

    const handleClick = () => {
        onPlay(word.id);
    };

    const handleDownloadSingle = async () => {
        setIsDownloading(true);
        setDownloadProgress(0);
        try {
            const blob = await recordHanziVideo({ ...word, english: translatedEnglish }, 1080, 1440, (internalProgress) => {
                setDownloadProgress((internalProgress * 100).toFixed(1));
            });
            saveAs(blob, `${word.char}_${word.pinyin}.webm`);
        } catch (err) {
            console.error('Download error:', err);
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    return (
        <>
            <div
                onClick={handleClick}
                className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-indigo-100' : 'border-slate-200'} hover:border-indigo-300 p-3 sm:p-4 h-[120px] sm:h-[140px] overflow-hidden flex items-center justify-between`}
            >
                {/* Selection Checkbox */}
                {typeof onSelect === 'function' && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onSelect(); }}
                        className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors z-10 ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'bg-slate-50 border-2 border-slate-300'}`}
                    >
                        {isSelected && <CheckIcon />}
                    </div>
                )}

                {/* Left side - Text content */}
                <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
                    <div className="text-3xl sm:text-4xl font-bold text-slate-800 mb-1 font-sans transition-colors group-hover:text-indigo-600 wrap-break-word leading-tight">
                        {word.char}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 font-bold tracking-wide">
                        {word.pinyin}
                    </div>
                    <div className="text-xs sm:text-sm text-indigo-900/80 font-medium truncate mt-0.5">
                        {word.thai}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 leading-tight line-clamp-1">
                        {word.meaning} {translatedEnglish && <span className="opacity-70 mx-0.5">•</span>} {translatedEnglish}
                    </div>
                </div>

                {/* Right side - Hanzi Writer Preview */}
                <div
                    className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform bg-slate-50 rounded-xl border border-slate-100 overflow-hidden p-1 shadow-inner"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowImageModal(true);
                    }}
                >
                    <HanziPlayer char={word.char} size={35} controls={false} />
                </div>

                {/* Speaker Icon */}
                <div className={`absolute top-2.5 left-2.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'animate-pulse opacity-100' : ''}`}>
                    <VolumeIcon />
                </div>
            </div>

            {/* Image Modal */}
            {showImageModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-200">
                        {/* Close button */}
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors z-10"
                        >
                            <CloseIcon />
                        </button>

                        <div className="flex flex-col items-center w-full mt-4">
                            {/* Interactive Hanzi Player */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner mb-6">
                              <HanziPlayer char={word.char} />
                            </div>

                            {/* Image info */}
                            <div className="text-center w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6">
                                <p className="text-6xl font-extrabold text-slate-800 mb-4">{word.char}</p>
                                <div className="flex items-center justify-center gap-3 text-lg sm:text-xl font-bold text-indigo-700 mb-2">
                                  <span>{word.pinyin}</span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                                  <span>{word.thai}</span>
                                </div>
                                <p className="text-sm sm:text-base text-slate-500 font-medium">
                                  {word.meaning} {translatedEnglish && <span className="opacity-70 mx-1">•</span>} {translatedEnglish}
                                </p>
                            </div>

                            {/* Download Button */}
                            <button
                                onClick={handleDownloadSingle}
                                disabled={isDownloading}
                                className={`mt-6 w-full flex justify-center items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95 ${isDownloading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                        กำลังสร้าง Video... {downloadProgress}%
                                    </>
                                ) : (
                                    <>
                                        <DownloadIcon />
                                        ดาวน์โหลด Video ตัวอักษรนี้
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

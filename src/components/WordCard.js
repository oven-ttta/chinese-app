"use client";

import { useState, useEffect } from 'react';
import { recordHanziVideo } from '@/utils/hanziRecorder';
import { saveAs } from 'file-saver';

// Global variable to track the currently playing proxy audio
let currentProxyAudio = null;

import HanziPlayer from './HanziPlayer';

export default function WordCard({ word, isActive, isSelected, onPlay, onStop, onSelect }) {
    const [voice, setVoice] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [translatedEnglish, setTranslatedEnglish] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    // Translate Thai to English
    useEffect(() => {
        if (word.meaning) {
            fetch(`/api/translate?text=${encodeURIComponent(word.meaning)}&from=th&to=en`)
                .then(res => res.json())
                .then(data => {
                    if (data.translatedText) {
                        setTranslatedEnglish(data.translatedText);
                    }
                })
                .catch(err => {
                    console.error('Translation error:', err);
                    setTranslatedEnglish('');
                });
        }
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
        try {
            const blob = await recordHanziVideo(word);
            saveAs(blob, `${word.char}_${word.pinyin}.webm`);
        } catch (err) {
            console.error('Download error:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <>
            <div
                onClick={handleClick}
                className={`group relative bg-linear-to-br from-white to-blue-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-100'} hover:border-blue-300 p-2 sm:p-3 h-28 sm:h-32 overflow-hidden flex items-center justify-between`}
            >
                {/* Selection Checkbox */}
                {typeof onSelect === 'function' && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onSelect(); }}
                        className={`absolute top-2 right-2 w-5 h-5 rounded border flex items-center justify-center transition-colors z-10 ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                    >
                        {isSelected && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        )}
                    </div>
                )}

                {/* Left side - Text content */}
                <div className="flex-1 flex flex-col justify-center min-w-0 pr-1 sm:pr-2">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-0.5 font-sans transition-colors group-hover:text-blue-600 wrap-break-word leading-tight">
                        {word.char}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>
                        {word.pinyin}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-700 font-medium truncate mt-1">
                        {word.thai}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 leading-tight line-clamp-1">
                        {word.meaning} - {translatedEnglish ? ` ${translatedEnglish}` : ''}
                    </div>
                </div>

                {/* Right side - Hanzi Writer Preview */}
                <div
                    className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity bg-white rounded border border-gray-200 overflow-hidden p-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowImageModal(true);
                    }}
                >
                    <HanziPlayer char={word.char} size={35} controls={false} />
                </div>

                {/* Speaker Icon */}
                <div className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'animate-pulse opacity-100' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                </div>
            </div>

            {/* Image Modal */}
            {showImageModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4"
                >
                    <div className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-lg p-3 sm:p-6 shadow-2xl overflow-y-auto">
                        {/* Close button */}
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1.5 sm:p-2 shadow-md z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex flex-col items-center w-full">
                            {/* Interactive Hanzi Player */}
                            <HanziPlayer char={word.char} />

                            {/* Image info */}
                            <div className="text-center mt-2 text-gray-700">
                                <p className="text-5xl font-bold mb-3">{word.char}</p>
                                <p className="text-2xl text-gray-600">{word.pinyin} - {word.thai}</p>
                                <p className="text-2xl text-gray-600">{word.meaning} - {translatedEnglish ? ` ${translatedEnglish}` : ''}</p>
                            </div>

                            {/* Download Button in Modal */}
                            <button
                                onClick={handleDownloadSingle}
                                disabled={isDownloading}
                                className={`mt-6 flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-full font-bold shadow-lg hover:bg-green-700 transition-all hover:scale-105 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                        กำลังสร้าง Video...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
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

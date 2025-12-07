"use client";

import { useState, useEffect } from 'react';

// Global variable to track the currently playing proxy audio
let currentProxyAudio = null;

export default function WordCard({ word, isActive, onPlay, onStop }) {
    const [voice, setVoice] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            const maleVoice = voices.find(v =>
                (v.lang.includes('zh') || v.lang.includes('CN')) &&
                (v.name.includes('Male') || v.name.includes('Kangkang') || v.name.includes('Danny'))
            );
            const anyChineseVoice = voices.find(v => v.lang === 'zh-CN' || v.lang === 'zh');
            setVoice(maleVoice || anyChineseVoice);
        };

        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
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

        const playLocal = () => {
            utterance = new SpeechSynthesisUtterance(word.char);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.8;
            utterance.pitch = 0.9;

            if (voice) {
                utterance.voice = voice;
            }

            utterance.onend = () => {
                onStop();
            };

            utterance.onerror = (e) => {
                console.error('Speech synthesis error:', e);
                onStop();
            };

            window.speechSynthesis.speak(utterance);
        };

        if (isActive) {
            if (currentProxyAudio) {
                currentProxyAudio.pause();
                currentProxyAudio = null;
            }
            window.speechSynthesis.cancel();

            playProxy();
        }

        return () => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
            if (utterance) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isActive, word.char, voice, onStop]);

    const handleClick = () => {
        onPlay(word.id);
    };

    return (
        <>
            <div
                onClick={handleClick}
                className="group relative bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-blue-100 hover:border-blue-300 p-3 h-32 overflow-hidden flex items-center justify-between"
            >
                {/* Left side - Text content */}
                <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
                    <div className="text-3xl font-bold text-gray-800 mb-0.5 font-sans transition-colors group-hover:text-blue-600 break-words leading-tight">
                        {word.char}
                    </div>
                    <div className="text-sm text-gray-600 font-medium leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>
                        {word.pinyin}
                    </div>
                    <div className="text-xs text-gray-700 font-medium truncate mt-1">
                        {word.thai}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 leading-tight line-clamp-1">
                        {word.meaning}
                    </div>
                </div>

                {/* Right side - Image */}
                {word.strokeOrderGifUrl && (
                    <div
                        className="flex-shrink-0 w-24 h-24 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowImageModal(true);
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={word.strokeOrderGifUrl}
                            alt="Stroke Order"
                            className="max-w-full max-h-full object-contain rounded border border-gray-200 shadow-sm"
                            onError={(e) => {
                                console.error('Image load error:', word.strokeOrderGifUrl);
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* Speaker Icon */}
                <div className={`absolute top-2 left-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'animate-pulse opacity-100' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                </div>
            </div>

            {/* Image Modal */}
            {showImageModal && word.strokeOrderGifUrl && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                >
                    <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-6 shadow-2xl">
                        {/* Close button */}
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-md z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Large image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={word.strokeOrderGifUrl}
                            alt="Stroke Order - Large View"
                            className="max-w-full max-h-[70vh] object-contain mx-auto"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Image info - LARGER TEXT */}
                        <div className="text-center mt-6 text-gray-700">
                            <p className="text-5xl font-bold mb-3">{word.char}</p>
                            <p className="text-2xl text-gray-600">{word.pinyin} - {word.thai}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

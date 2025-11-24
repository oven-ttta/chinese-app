"use client";

import { useState, useEffect } from 'react';

// Global variable to track the currently playing proxy audio
let currentProxyAudio = null;

export default function WordCard({ word, isActive, onPlay, onStop }) {
    const [voice, setVoice] = useState(null);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            // Try to find a Chinese male voice
            const maleVoice = voices.find(v =>
                (v.lang.includes('zh') || v.lang.includes('CN')) &&
                (v.name.includes('Male') || v.name.includes('Kangkang') || v.name.includes('Danny'))
            );

            // Fallback to any Chinese voice
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
                console.error("Proxy Audio Error:", e);
                currentProxyAudio = null;
                onStop();
            };

            currentAudio.play().catch(e => {
                console.error("Proxy Audio Play Error:", e);
                currentProxyAudio = null;
                onStop();
            });
        };

        if (isActive) {
            // Stop any lingering audio first (safety net)
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (currentProxyAudio) {
                currentProxyAudio.pause();
                currentProxyAudio = null;
            }

            if ('speechSynthesis' in window) {
                // If we have a voice, try browser TTS
                if (voice) {
                    utterance = new SpeechSynthesisUtterance(word.char);
                    utterance.lang = 'zh-CN';
                    utterance.voice = voice;
                    utterance.rate = 0.8;

                    utterance.onend = () => onStop();
                    utterance.onerror = (e) => {
                        console.warn("Browser TTS failed, trying proxy...", e);
                        // If TTS fails, try proxy. 
                        // Note: This might cause a slight race if cleanup runs, but usually safe.
                        playProxy();
                    };

                    window.speechSynthesis.speak(utterance);
                } else {
                    // No Chinese voice found, use proxy directly
                    console.log("No Chinese voice found, using proxy.");
                    playProxy();
                }
            } else {
                // Browser doesn't support TTS, use proxy
                playProxy();
            }
        }

        return () => {
            // Cleanup: Stop audio when isActive becomes false or component unmounts
            if (utterance) {
                window.speechSynthesis.cancel();
            }
            if (currentAudio) {
                currentAudio.pause();
                if (currentProxyAudio === currentAudio) {
                    currentProxyAudio = null;
                }
            }
        };
    }, [isActive, word]); // Intentionally omitting voice to avoid restart on voice load

    const handleClick = () => {
        if (isActive) {
            onStop();
        } else {
            onPlay();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`bg-white rounded-xl shadow-sm p-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md border relative overflow-hidden group h-full flex flex-col justify-between ${isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100 hover:border-blue-300'}`}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

            <div className="relative z-10 text-center flex flex-col items-center h-full">
                <div className="mb-1 w-full">
                    <div className="text-3xl font-bold text-gray-800 mb-0.5 font-sans transition-colors group-hover:text-blue-600 break-words leading-tight">{word.char}</div>
                    <div className="text-sm text-gray-600 font-medium leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>{word.pinyin}</div>
                </div>

                <div className="w-full mt-1 flex-grow flex flex-col justify-end">
                    <div className="text-xs text-gray-700 font-medium truncate">{word.thai}</div>
                    {/* Tone and Meaning might be too much for 100x100, hiding tone visually or making it tiny, showing meaning in tooltip or very small */}
                    <div className="hidden">{word.tone}</div>
                    <div className="text-[10px] text-gray-400 mt-1 leading-tight line-clamp-1">
                        {word.meaning}
                    </div>
                </div>

                {/* Speaker Icon hint */}
                <div className={`absolute top-1 right-1 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'animate-pulse opacity-100' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

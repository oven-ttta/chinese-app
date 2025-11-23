"use client";

import { useState, useEffect } from 'react';

// Global variable to track the currently playing proxy audio
let currentProxyAudio = null;

export default function PinyinCard({ char, label, colorClass, isActive, onPlay, onStop }) {
    const [voice, setVoice] = useState(null);

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
            // For single pinyin/initials, we might need to adjust the text for better TTS
            // e.g., 'b' -> 'bo', 'p' -> 'po' for initials if just sending 'b' doesn't work well.
            // But let's try sending the char first.
            currentAudio = new Audio(`/api/tts?text=${encodeURIComponent(char)}&lang=zh-CN`);
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
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (currentProxyAudio) {
                currentProxyAudio.pause();
                currentProxyAudio = null;
            }

            if ('speechSynthesis' in window) {
                if (voice) {
                    utterance = new SpeechSynthesisUtterance(char);
                    utterance.lang = 'zh-CN';
                    utterance.voice = voice;
                    utterance.rate = 0.8;

                    utterance.onend = () => onStop();
                    utterance.onerror = (e) => {
                        console.warn("Browser TTS failed, trying proxy...", e);
                        playProxy();
                    };

                    window.speechSynthesis.speak(utterance);
                } else {
                    playProxy();
                }
            } else {
                playProxy();
            }
        }

        return () => {
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
    }, [isActive, char]);

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
            className={`${colorClass} rounded-xl shadow-sm p-4 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md border-2 relative overflow-hidden group flex flex-col items-center justify-center aspect-square ${isActive ? 'ring-4 ring-white ring-opacity-50 scale-105 z-10' : 'border-transparent'}`}
        >
            <span className="text-4xl font-bold text-white mb-1">{char}</span>
            {label && <span className="text-xs text-white/90 font-medium">{label}</span>}

            {/* Active Indicator */}
            {isActive && (
                <div className="absolute inset-0 bg-black/10 pointer-events-none animate-pulse"></div>
            )}
        </div>
    );
}

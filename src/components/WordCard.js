"use client";

import { useState, useRef } from 'react';

export default function WordCard({ word }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const speak = () => {
        if (isPlaying) return;

        setIsPlaying(true);

        // Use our own proxy API to avoid CORS/loading errors
        const audio = new Audio(`/api/tts?text=${encodeURIComponent(word.char)}`);

        audio.onended = () => setIsPlaying(false);
        audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
            // Fallback to browser TTS if audio fails
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(word.char);
                utterance.lang = 'th-TH';
                window.speechSynthesis.speak(utterance);
            } else {
                alert("Audio playback failed");
            }
        };

        audio.play().catch(e => {
            console.error("Audio play error:", e);
            setIsPlaying(false);
        });
    };

    return (
        <div
            onClick={speak}
            className={`bg-white rounded-2xl shadow-md p-4 sm:p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl border-2 relative overflow-hidden group ${isPlaying ? 'border-blue-500 ring-4 ring-blue-100' : 'border-transparent hover:border-blue-300'}`}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 sm:w-24 sm:h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

            <div className="relative z-10 text-center flex flex-col items-center h-full justify-between">
                <div className="mb-4 w-full">
                    <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-800 mb-2 font-sans transition-colors group-hover:text-blue-600 break-words">{word.char}</div>
                    <div className="text-xl sm:text-2xl text-blue-500 font-semibold font-serif">{word.pinyin}</div>
                </div>

                <div className="space-y-1 w-full">
                    <div className="text-base sm:text-lg text-gray-700 font-medium">{word.thai}</div>
                    <div className="text-xs text-gray-400 bg-gray-50 rounded-full px-2 py-1 inline-block mb-2">{word.tone}</div>
                    <div className="text-sm text-gray-600 border-t border-gray-100 pt-3 mt-1 leading-relaxed min-h-[3rem] flex items-center justify-center">
                        {word.meaning}
                    </div>
                </div>

                {/* Speaker Icon hint */}
                <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ${isPlaying ? 'animate-pulse opacity-100' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

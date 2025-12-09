"use client";

import { useEffect, useRef, useState } from 'react';

export default function HanziPlayer({ char, size = 150, controls = true, loop = true }) {
    const containerRef = useRef(null);
    const stopLoopRef = useRef(false);
    const [writers, setWriters] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    // 1. Intersection Observer to detect visibility
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.disconnect(); // Load once and stay loaded
            }
        }, {
            rootMargin: '100px', // Preload slightly before view
            threshold: 0.01 // Trigger as soon as 1% is visible
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    // 2. Initialize Writers only when visible
    useEffect(() => {
        if (!isVisible) return; // Wait until visible

        let isMounted = true;
        stopLoopRef.current = false;

        const loadHanziWriter = async () => {
            if (!window.HanziWriter) {
                await new Promise((resolve) => {
                    if (window.HanziWriter) {
                        resolve();
                        return;
                    }
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
                    script.onload = resolve;
                    document.body.appendChild(script);
                });
            }
            if (isMounted) initWriters();
        };

        const initWriters = () => {
            if (!containerRef.current) return;

            // Clear previous content to avoid duplicates if re-running
            containerRef.current.innerHTML = '';
            const chars = char.split('');
            const newWriters = [];

            // Container for flex layout
            const flexContainer = document.createElement('div');
            flexContainer.style.display = 'flex';
            flexContainer.style.flexWrap = 'wrap';
            flexContainer.style.justifyContent = 'center';
            flexContainer.style.gap = controls ? '10px' : '2px';
            containerRef.current.appendChild(flexContainer);

            chars.forEach((c) => {
                const div = document.createElement('div');
                div.style.width = `${size}px`;
                div.style.height = `${size}px`;
                flexContainer.appendChild(div);

                const writer = window.HanziWriter.create(div, c, {
                    width: size,
                    height: size,
                    padding: size / 30, // Dynamic padding
                    strokeColor: '#000000', // Black char
                    radicalColor: '#168F16', // Green radical
                    showOutline: true,
                    delayBetweenStrokes: 50,
                });
                newWriters.push(writer);
            });

            setWriters(newWriters);

            if (loop) {
                startLoop(newWriters);
            }
        };

        const startLoop = async (currentWriters) => {
            const animateSequence = async () => {
                if (stopLoopRef.current) return;

                // Animate each character sequentially
                for (const writer of currentWriters) {
                    if (stopLoopRef.current) return;
                    await writer.animateCharacter();
                }

                // Wait before restarting
                if (stopLoopRef.current) return;
                await new Promise(r => setTimeout(r, 2000));

                // Recursive call to loop
                if (!stopLoopRef.current) {
                    animateSequence();
                }
            };

            // Start the sequence
            animateSequence();
        };

        loadHanziWriter();

        return () => {
            isMounted = false;
            stopLoopRef.current = true; // Stop loop on unmount or char change
        };
    }, [char, size, controls, loop, isVisible]);

    const animateAll = async () => {
        // Speak the character
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(char);
            utterance.lang = 'zh-CN';
            window.speechSynthesis.speak(utterance);
        }

        // Manual play logic
        stopLoopRef.current = true; // Stop current auto-loop temporarily if needed, but simple manual play is fine

        if (writers.length === 0) return;

        for (const writer of writers) {
            await writer.animateCharacter();
        }

        // Optionally restart loop here if desired, but user pressed "Play" so maybe just play once
    };

    return (
        <div className={`flex flex-col items-center w-full ${!controls ? 'pointer-events-none' : ''}`}>
            {/* Placeholder/Container that is always rendered to hold space */}
            <div
                ref={containerRef}
                className={`w-full flex justify-center ${controls ? 'bg-gray-50 rounded-xl p-4 min-h-[180px]' : ''}`}
                style={{ minHeight: controls ? undefined : `${size}px` }}
            >
                {/* Fallback while loading or not visible could go here */}
            </div>

            {controls && (
                <>
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={(e) => { e.stopPropagation(); animateAll(); }}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            เล่นซ้ำ (Animate)
                        </button>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">คลิกที่ตัวอักษรเพื่อฟังเสียง (ถ้ามี) หรือฝึกเขียน</p>
                </>
            )}
        </div>
    );
}

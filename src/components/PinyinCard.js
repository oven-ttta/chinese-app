"use client";

export default function PinyinCard({ char, label, colorClass, isActive, onPlay }) {
    return (
        <div
            onClick={onPlay}
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

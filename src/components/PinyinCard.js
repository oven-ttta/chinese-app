"use client";

export default function PinyinCard({ char, label, colorClass, isActive, onPlay }) {
    // We will pass text color classes like 'text-amber-500', 'text-red-500' instead of bg.
    // However, the original code used 'bg-amber-400', 'bg-red-500' etc. 
    // To make it look premium, we'll keep the colorful vibe but make it a soft pastel background with a strong text color.
    
    // Map bg-* to text-* and bg-*-50 for soft background
    const baseColor = colorClass.replace('bg-', ''); // e.g. 'amber-400'
    const colorName = baseColor.split('-')[0]; // e.g. 'amber'
    
    const softBgClass = `bg-${colorName}-50`;
    const textClass = `text-${colorName}-600`;
    const borderClass = `border-${colorName}-200`;
    const hoverBorderClass = `hover:border-${colorName}-400`;
    const ringClass = `ring-${colorName}-200`;

    // To avoid Tailwind purging these dynamic classes if they aren't generated elsewhere,
    // we should just stick to the original classes or map them properly in the parent,
    // but since we are modifying the whole UI, let's use a safe consistent approach.
    // I'll accept `colorClass` as the theme color (e.g., 'amber', 'red', 'indigo').

    return (
        <div
            onClick={onPlay}
            className={`
                bg-white border-2 rounded-2xl shadow-sm p-2 sm:p-4 cursor-pointer transition-all duration-300 transform 
                flex flex-col items-center justify-center aspect-square relative overflow-hidden group
                ${isActive ? `border-${colorClass}-500 shadow-lg scale-[1.02] ring-4 ring-${colorClass}-50 bg-${colorClass}-50` : `border-slate-100 hover:border-${colorClass}-300 hover:shadow-md hover:-translate-y-1`}
            `}
        >
            <span className={`text-3xl sm:text-5xl font-extrabold mb-1 sm:mb-2 transition-colors ${isActive ? `text-${colorClass}-700` : `text-${colorClass}-500 group-hover:text-${colorClass}-600`}`}>
                {char}
            </span>
            {label && (
                <span className={`text-[10px] sm:text-sm font-bold text-center leading-tight transition-colors ${isActive ? `text-${colorClass}-800` : 'text-slate-500 group-hover:text-slate-700'}`}>
                    {label}
                </span>
            )}

            {/* Active Indicator Pulse */}
            {isActive && (
                <div className={`absolute inset-0 bg-${colorClass}-500/10 animate-pulse pointer-events-none`}></div>
            )}
        </div>
    );
}

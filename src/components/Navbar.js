"use client";

import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="text-slate-800 shadow-sm sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                
                {/* Logo Section */}
                <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2 group">
                    <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4 7 4 4-4 4"/><path d="M12 15h8"/></svg>
                    </div>
                    <span className="text-indigo-900 group-hover:text-indigo-600 transition-colors">คำศัพท์จีน</span>
                </Link>

                {/* Navigation Links */}
                <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 text-sm font-medium">
                    <Link href="/" className="hover:text-indigo-600 text-slate-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-indigo-50">
                        หน้าแรก
                    </Link>
                    <Link href="/pinyin" className="hover:text-indigo-600 text-slate-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-indigo-50">
                        พินอิน
                    </Link>
                    <Link href="/stroke-order" className="hover:text-indigo-600 text-slate-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-indigo-50">
                        ฝึกเขียน
                    </Link>
                    <Link href="/sentence-breakdown" className="hover:text-indigo-600 text-slate-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-indigo-50">
                        สร้างประโยค
                    </Link>
                    <Link href="/report" className="hover:text-indigo-600 text-slate-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-indigo-50">
                        สรุป
                    </Link>

                    {/* Primary Action Button */}
                    <Link href="/add" className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-indigo-200 hover:shadow-indigo-300 active:scale-95 text-sm font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span className="hidden sm:inline">เพิ่มคำศัพท์</span>
                        <span className="sm:hidden">เพิ่ม</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
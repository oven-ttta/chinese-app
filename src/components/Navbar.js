"use client";

import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="p-2 sm:p-4 text-black shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-white/95">
            <div className="w-full px-2 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
                {/* Logo Section */}
                <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2 group">
                    <span>คำศัพท์จีน</span>
                </Link>

                {/* Navigation Links */}
                <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-4 text-xs sm:text-base font-medium">
                    <Link href="/" className="hover:text-blue-600 transition-colors py-1 px-2 sm:py-1.5 sm:px-3 rounded-md hover:bg-blue-50">
                        หน้าแรก
                    </Link>
                    <Link href="/pinyin" className="hover:text-blue-600 transition-colors py-1 px-2 sm:py-1.5 sm:px-3 rounded-md hover:bg-blue-50">
                        พินอิน
                    </Link>
                    <Link href="/stroke-order" className="hover:text-blue-600 transition-colors py-1 px-2 sm:py-1.5 sm:px-3 rounded-md hover:bg-blue-50">
                        ฝึกเขียน
                    </Link>
                    <Link href="/report" className="hover:text-blue-600 transition-colors py-1 px-2 sm:py-1.5 sm:px-3 rounded-md hover:bg-blue-50">
                        สรุป
                    </Link>

                    {/* Primary Action Button */}
                    <Link href="/add" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full transition-all flex items-center gap-1 sm:gap-2 shadow-sm active:scale-95 text-xs sm:text-base">
                        <span className="text-sm sm:text-lg leading-none font-bold">+</span>
                        <span className="hidden sm:inline">เพิ่มคำศัพท์</span>
                        <span className="sm:hidden">เพิ่ม</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
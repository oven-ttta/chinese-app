"use client";

import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
            <div className="w-full px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Logo Section */}
                <Link href="/" className="text-2xl font-extrabold tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2 group">
                    <span className="text-3xl group-hover:scale-110 transition-transform">🇨🇳</span>
                    <span>คำศัพท์จีน</span>
                </Link>

                {/* Navigation Links */}
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-6 text-sm sm:text-base font-medium">
                    <Link href="/" className="hover:text-blue-100 transition-colors py-1.5 px-3 rounded-md hover:bg-white/10">
                        หน้าแรก
                    </Link>
                    <Link href="/pinyin" className="hover:text-blue-100 transition-colors py-1.5 px-3 rounded-md hover:bg-white/10">
                        พินอิน
                    </Link>
                    <Link href="/stroke-order" className="hover:text-blue-100 transition-colors py-1.5 px-3 rounded-md hover:bg-white/10">
                        ฝึกเขียน
                    </Link>

                    {/* Primary Action Button */}
                    <Link href="/add" className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20 hover:border-white/40 shadow-sm active:scale-95">
                        <span className="text-lg leading-none font-bold">+</span>
                        <span>เพิ่มคำศัพท์</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
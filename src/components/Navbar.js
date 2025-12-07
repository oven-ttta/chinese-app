"use client";

import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <span className="text-white text-2xl font-bold">
                            เรียนภาษาจีน
                        </span>
                    </Link>

                    {/* Menu Items */}
                    <div className="flex items-center gap-8">
                        <Link
                            href="/"
                            className="text-white hover:text-blue-100 transition-colors font-medium"
                        >
                            Home
                        </Link>

                        <Link
                            href="/pinyin"
                            className="text-white hover:text-blue-100 transition-colors font-medium"
                        >
                            Pinyin Chart
                        </Link>

                        <Link
                            href="/add"
                            className="text-white hover:text-blue-100 transition-colors font-medium"
                        >
                            Add Word
                        </Link>

                        <Link
                            href="/report"
                            className="text-white hover:text-blue-100 transition-colors font-medium"
                        >
                            Report
                        </Link>

                        <Link
                            href="/stroke-order"
                            className="text-white hover:text-blue-100 transition-colors font-medium bg-white/10 px-3 py-1 rounded-full hover:bg-white/20"
                        >
                            Stroke Order
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
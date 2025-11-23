"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddWord() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        char: '',
        pinyin: '',
        thai: '',
        tone: '',
        meaning: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to add word');
            }

            alert('เพิ่มคำศัพท์เรียบร้อยแล้ว (Added successfully)');
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Error:', error);
            alert('เกิดข้อผิดพลาด (Error adding word)');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">เพิ่มคำศัพท์ใหม่</h1>
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                        &larr; กลับหน้าหลัก
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="char" className="block text-sm font-medium text-gray-700">
                            ตัวอักษรจีน (Chinese Character)
                        </label>
                        <input
                            type="text"
                            name="char"
                            id="char"
                            required
                            value={formData.char}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border"
                            placeholder="เช่น 饭"
                        />
                    </div>

                    <div>
                        <label htmlFor="pinyin" className="block text-sm font-medium text-gray-700">
                            พินอิน (Pinyin)
                        </label>
                        <input
                            type="text"
                            name="pinyin"
                            id="pinyin"
                            required
                            value={formData.pinyin}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border"
                            placeholder="เช่น fàn"
                        />
                    </div>

                    <div>
                        <label htmlFor="thai" className="block text-sm font-medium text-gray-700">
                            อ่านว่า (Thai Reading)
                        </label>
                        <input
                            type="text"
                            name="thai"
                            id="thai"
                            required
                            value={formData.thai}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border"
                            placeholder="เช่น ฟ่าน"
                        />
                    </div>

                    <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
                            วรรณยุกต์ (Tone)
                        </label>
                        <input
                            type="text"
                            name="tone"
                            id="tone"
                            value={formData.tone}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border"
                            placeholder="เช่น เสียง 4"
                        />
                    </div>

                    <div>
                        <label htmlFor="meaning" className="block text-sm font-medium text-gray-700">
                            ความหมาย (Meaning)
                        </label>
                        <textarea
                            name="meaning"
                            id="meaning"
                            required
                            rows="3"
                            value={formData.meaning}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border"
                            placeholder="เช่น ข้าว, อาหาร"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

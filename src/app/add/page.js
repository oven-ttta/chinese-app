"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAlert } from '@/providers/AlertProvider';

export default function AddWord() {
    const router = useRouter();
    const { addAlert } = useAlert();
    const [formData, setFormData] = useState({
        char: '',
        pinyin: '',
        thai: '',
        tone: '',
        meaning: '',
        contributor: '',
        date: new Date().toISOString().split('T')[0]
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

            addAlert('เพิ่มคำศัพท์เรียบร้อยแล้ว (Added successfully)', 'success');
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Error:', error);
            addAlert('เกิดข้อผิดพลาด (Error adding word)', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex-1 h-full bg-slate-50 py-4 sm:py-8 px-2 sm:px-4 md:px-8">
            <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-3 sm:p-4 md:p-8">
                <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900">เพิ่มคำศัพท์ใหม่</h1>
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                        &larr; กลับหน้าหลัก
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                        <label htmlFor="char" className="block text-xs sm:text-sm font-medium text-gray-700">
                            ตัวอักษรจีน (Chinese Character)
                        </label>
                        <input
                            type="text"
                            name="char"
                            id="char"
                            required
                            value={formData.char}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-lg p-2 border placeholder:text-gray-500 text-gray-900"
                            placeholder="เช่น 饭"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="pinyin" className="block text-xs sm:text-sm font-medium text-gray-700">
                                พินอิน (Pinyin)
                            </label>
                            <input
                                type="text"
                                name="pinyin"
                                id="pinyin"
                                required
                                value={formData.pinyin}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-lg p-2 border placeholder:text-gray-500 text-gray-900"
                                placeholder="เช่น fàn"
                            />
                        </div>

                        <div>
                            <label htmlFor="thai" className="block text-xs sm:text-sm font-medium text-gray-700">
                                อ่านว่า (Thai Reading)
                            </label>
                            <input
                                type="text"
                                name="thai"
                                id="thai"
                                required
                                value={formData.thai}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-lg p-2 border placeholder:text-gray-500 text-gray-900"
                                placeholder="เช่น ฟ่าน"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="tone" className="block text-xs sm:text-sm font-medium text-gray-700">
                            วรรณยุกต์ (Tone)
                        </label>
                        <input
                            type="text"
                            name="tone"
                            id="tone"
                            value={formData.tone}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-lg p-2 border placeholder:text-gray-500 text-gray-900"
                            placeholder="เช่น เสียง 4"
                        />
                    </div>

                    <div>
                        <label htmlFor="meaning" className="block text-xs sm:text-sm font-medium text-gray-700">
                            ความหมาย (Meaning)
                        </label>
                        <textarea
                            name="meaning"
                            id="meaning"
                            required
                            rows="2"
                            value={formData.meaning}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-lg p-2 border placeholder:text-gray-500 text-gray-900"
                            placeholder="เช่น ข้าว, อาหาร"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="contributor" className="block text-xs sm:text-sm font-medium text-gray-700">
                                ผู้บันทึก (Contributor)
                            </label>
                            <select
                                name="contributor"
                                id="contributor"
                                required
                                value={formData.contributor}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-lg p-2 border text-gray-900"
                            >
                                <option value="">เลือกผู้บันทึก</option>
                                <option value="โอ">โอ</option>
                                <option value="เอย">เอย</option>
                                <option value="โจ">โจ</option>
                                <option value="แบม">แบม</option>
                                <option value="เบล">เบล</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="date" className="block text-xs sm:text-sm font-medium text-gray-700">
                                วันที่บันทึก (Date)
                            </label>
                            <DatePicker
                                selected={formData.date ? new Date(formData.date) : null}
                                onChange={(date) => {
                                    const formattedDate = date ? date.toISOString().split('T')[0] : '';
                                    setFormData(prev => ({ ...prev, date: formattedDate }));
                                }}
                                dateFormat="yyyy-MM-dd"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base sm:text-lg p-2 border placeholder:text-gray-500 text-gray-900"
                                placeholderText="เลือกวันที่"
                                isClearable
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-2 sm:pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </div>
                </form>
            </div >
        </main >
    );
}

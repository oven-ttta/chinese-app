"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function AddWord() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        char: '',
        pinyin: '',
        thai: '',
        tone: '',
        meaning: '',
        contributor: '',
        date: new Date().toISOString().split('T')[0],
        strokeOrderGif: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (files && files[0]) {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    [name]: reader.result // Base64 string
                }));
            };
            reader.readAsDataURL(file);
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border placeholder:text-gray-500"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border placeholder:text-gray-500"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border placeholder:text-gray-500"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border placeholder:text-gray-500"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border placeholder:text-gray-500"
                            placeholder="เช่น ข้าว, อาหาร"
                        />
                    </div>

                    <div>
                        <label htmlFor="contributor" className="block text-sm font-medium text-gray-700">
                            ผู้บันทึก (Contributor)
                        </label>
                        <select
                            name="contributor"
                            id="contributor"
                            required
                            value={formData.contributor}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border text-gray-700"
                        >
                            <option value="">เลือกผู้บันทึก (Select Contributor)</option>
                            <option value="โอ">โอ</option>
                            <option value="เอย">เอย</option>
                            <option value="โจ">โจ</option>
                            <option value="แบม">แบม</option>
                            <option value="เบล">เบล</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            วันที่บันทึก (Date)
                        </label>
                        <DatePicker
                            selected={formData.date ? new Date(formData.date) : null}
                            onChange={(date) => {
                                // Convert to YYYY-MM-DD for consistency
                                const formattedDate = date ? date.toISOString().split('T')[0] : '';
                                setFormData(prev => ({ ...prev, date: formattedDate }));
                            }}
                            dateFormat="yyyy-MM-dd"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg p-2 border placeholder:text-gray-500"
                            placeholderText="Select date"
                            isClearable
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="strokeOrderGif" className="block text-sm font-medium text-gray-700">
                            ลำดับการขีด (Stroke Order GIF)
                        </label>
                        <input
                            type="file"
                            name="strokeOrderGif"
                            id="strokeOrderGif"
                            accept="image/gif"
                            onChange={handleChange}
                            className="mt-1 block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
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
            </div >
        </main >
    );
}

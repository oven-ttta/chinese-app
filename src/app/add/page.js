"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAlert } from '@/providers/AlertProvider';

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to add word');

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

    const InputField = ({ label, name, value, onChange, placeholder, required = false, type = "text", as = "input", children }) => (
        <div>
            <label htmlFor={name} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            {as === "input" ? (
              <input
                  type={type}
                  name={name}
                  id={name}
                  required={required}
                  value={value}
                  onChange={onChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 outline-none placeholder:text-slate-400 font-medium"
                  placeholder={placeholder}
              />
            ) : as === "textarea" ? (
              <textarea
                  name={name}
                  id={name}
                  required={required}
                  rows="2"
                  value={value}
                  onChange={onChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 outline-none placeholder:text-slate-400 font-medium resize-y"
                  placeholder={placeholder}
              />
            ) : as === "select" ? (
              <select
                  name={name}
                  id={name}
                  required={required}
                  value={value}
                  onChange={onChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 outline-none font-medium cursor-pointer"
              >
                  {children}
              </select>
            ) : null}
        </div>
    );

    return (
        <main className="flex-1 min-h-screen bg-slate-100 py-6 sm:py-10 px-4 sm:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
                            <PlusIcon />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">เพิ่มคำศัพท์ใหม่</h1>
                    </div>
                    <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-semibold text-sm transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                        <BackIcon /> กลับหน้าหลัก
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <InputField label="ตัวอักษรจีน (Chinese Character)" name="char" value={formData.char} onChange={handleChange} placeholder="เช่น 饭" required />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InputField label="พินอิน (Pinyin)" name="pinyin" value={formData.pinyin} onChange={handleChange} placeholder="เช่น fàn" required />
                            <InputField label="อ่านว่า (Thai Reading)" name="thai" value={formData.thai} onChange={handleChange} placeholder="เช่น ฟ่าน" required />
                        </div>

                        <InputField label="วรรณยุกต์ (Tone)" name="tone" value={formData.tone} onChange={handleChange} placeholder="เช่น เสียง 4" />

                        <InputField as="textarea" label="ความหมาย (Meaning)" name="meaning" value={formData.meaning} onChange={handleChange} placeholder="เช่น ข้าว, อาหาร" required />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InputField as="select" label="ผู้บันทึก (Contributor)" name="contributor" value={formData.contributor} onChange={handleChange} required>
                                <option value="">เลือกผู้บันทึก</option>
                                <option value="โอ">โอ</option>
                                <option value="เอย">เอย</option>
                                <option value="โจ">โจ</option>
                                <option value="แบม">แบม</option>
                                <option value="เบล">เบล</option>
                            </InputField>

                            <div>
                                <label htmlFor="date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    วันที่บันทึก (Date)
                                </label>
                                <DatePicker
                                    selected={formData.date ? new Date(formData.date) : null}
                                    onChange={(date) => {
                                        const formattedDate = date ? date.toISOString().split('T')[0] : '';
                                        setFormData(prev => ({ ...prev, date: formattedDate }));
                                    }}
                                    dateFormat="yyyy-MM-dd"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 outline-none placeholder:text-slate-400 font-medium"
                                    placeholderText="เลือกวันที่"
                                    isClearable
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full flex justify-center py-4 px-4 rounded-xl shadow-md text-base font-bold text-white transition-all active:scale-[0.98] ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300'}`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                      กำลังบันทึก...
                                    </span>
                                ) : 'บันทึกคำศัพท์'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAlert } from '@/providers/AlertProvider'; // Import useAlert

export default function AdminPage() {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingWord, setEditingWord] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Use the alert hook
    const { addAlert } = useAlert();

    // Fetch words
    const fetchWords = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/words', { cache: 'no-store' });
            const data = await res.json();
            if (Array.isArray(data)) {
                setWords(data);
            }
        } catch (error) {
            console.error('Error fetching words:', error);
            addAlert('Failed to load words', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWords();
    }, []);

    const filteredWords = words.filter(word =>
        word.char.includes(searchTerm) ||
        word.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.thai.includes(searchTerm) ||
        (word.meaning && word.meaning.includes(searchTerm))
    );

    const handleDelete = async (word) => {
        if (!confirm(`ยืนยันการลบคำศัพท์: ${word.char} (${word.thai})?`)) return;

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    char: word.char,
                    originalChar: word.char // Send originalChar for safe lookup
                })
            });

            let result;
            try {
                result = await res.json();
            } catch (e) {
                // If response is not JSON (e.g. 404 HTML or 500 plaintext)
                const text = await res.text();
                throw new Error('Server returned non-JSON response: ' + text.substring(0, 100));
            }

            if (result.status === 'success' || result.success) {
                addAlert('Deleted successfully', 'success');
                // Optimistically update list
                setWords(prev => prev.filter(w => w.char !== word.char));
            } else {
                addAlert('Error deleting: ' + (result.message || JSON.stringify(result)), 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            addAlert('Delete failed: ' + error.message, 'error');
        }
    };

    const handleEditClick = (word) => {
        setEditingWord({ ...word, originalChar: word.char });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'edit',
                    ...editingWord
                })
            });

            let result;
            try {
                result = await res.json();
            } catch (e) {
                const text = await res.text();
                throw new Error('Server returned non-JSON response: ' + text.substring(0, 100));
            }

            if (result.status === 'success' || result.success) {
                addAlert('Saved successfully', 'success');
                setEditingWord(null);

                // Optimistically update list
                setWords(prev => prev.map(w =>
                    w.char === editingWord.originalChar ? { ...w, ...editingWord } : w
                ));
            } else {
                addAlert('Error updating: ' + (result.message || JSON.stringify(result)), 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            addAlert('Update failed: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">จัดการคำศัพท์ (Admin)</h1>
                    <div className="flex gap-2">
                        <Link href="/add" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                            + เพิ่มคำใหม่
                        </Link>
                        <Link href="/" className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-50">
                            หน้าหลัก
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by Char, Pinyin, Thai..."
                        className="w-full p-3 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-2"></div>
                        <span className="text-slate-500">Loading words...</span>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600 whitespace-nowrap">ID</th>
                                        <th className="p-4 font-semibold text-slate-600 whitespace-nowrap">อักษรจีน</th>
                                        <th className="p-4 font-semibold text-slate-600 whitespace-nowrap">พินอิน</th>
                                        <th className="p-4 font-semibold text-slate-600 whitespace-nowrap">คำแปล</th>
                                        <th className="p-4 font-semibold text-slate-600 whitespace-nowrap">ผู้บันทึก</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredWords.map((word, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 sm:p-4 text-slate-400 text-sm whitespace-nowrap">#{word.id}</td>
                                            <td className="p-3 sm:p-4 text-lg font-bold text-slate-800 whitespace-nowrap">{word.char}</td>
                                            <td className="p-3 sm:p-4 text-slate-600 whitespace-nowrap">{word.pinyin}</td>
                                            <td className="p-3 sm:p-4 text-slate-600 min-w-[150px]">{word.thai}</td>
                                            <td className="p-3 sm:p-4 text-sm text-slate-500 whitespace-nowrap">{word.contributor}</td>
                                            <td className="p-3 sm:p-4 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleEditClick(word)}
                                                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(word)}
                                                    className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredWords.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-slate-400">
                                                No words found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingWord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">Edit Word</h2>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Chinese Char</label>
                                <input
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editingWord.char}
                                    onChange={e => setEditingWord({ ...editingWord, char: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Pinyin</label>
                                    <input
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editingWord.pinyin}
                                        onChange={e => setEditingWord({ ...editingWord, pinyin: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
                                    <input
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editingWord.tone || ''}
                                        onChange={e => setEditingWord({ ...editingWord, tone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Thai Trans/Meaning</label>
                                <input
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editingWord.thai}
                                    onChange={e => setEditingWord({ ...editingWord, thai: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Meaning (Details)</label>
                                <textarea
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editingWord.meaning}
                                    onChange={e => setEditingWord({ ...editingWord, meaning: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contributor</label>
                                <input
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editingWord.contributor}
                                    onChange={e => setEditingWord({ ...editingWord, contributor: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingWord(null)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

const STORAGE_KEY = "chinese-app:sentence-breakdown:v1";

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createEmptyItem = (index = 1) => ({
  id: createId(),
  sentence: { index: `${index}.`, hanzi: "", pinyin: "", english: "", thai: "" },
  blocks: []
});

const createBlock = (values = {}) => ({
  id: createId(),
  thai: "",
  hanzi: "",
  pinyin: "",
  topNote: "",
  showTopArrow: false,
  ...values
});

const normalizeItems = (value) => {
  if (!Array.isArray(value) || value.length === 0) return [createEmptyItem()];
  return value.map((item, index) => ({
    id: item?.id || createId(),
    sentence: {
      index: item?.sentence?.index || `${index + 1}.`,
      hanzi: item?.sentence?.hanzi || "",
      pinyin: item?.sentence?.pinyin || "",
      english: item?.sentence?.english || "",
      thai: item?.sentence?.thai || ""
    },
    blocks: Array.isArray(item?.blocks)
      ? item.blocks.map((block) => createBlock(block))
      : []
  }));
};

// --- Icons ---
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);
const ArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
);
const ArrowDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const VolumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
);
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);

const InputField = ({ label, value, onChange, placeholder = "", className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-sm outline-none"
    />
  </div>
);

export default function SentenceBreakdown() {
  const [items, setItems] = useState(() => [createEmptyItem()]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [exporting, setExporting] = useState("");
  const [notice, setNotice] = useState("");

  const previewRef = useRef(null);
  const importRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(normalizeItems(JSON.parse(saved)));
    } catch (error) {
      console.error("Failed to restore sentence breakdown", error);
      setNotice("ไม่สามารถกู้คืนงานที่บันทึกไว้ได้");
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timeout);
  }, [notice]);

  // --- Quick Generate ---
  const [quickInput, setQuickInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleQuickGenerate = async () => {
    const sentences = quickInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (sentences.length === 0) {
      setNotice("กรุณาใส่ประโยคภาษาจีนอย่างน้อย 1 ประโยค");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/sentence-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentences })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "วิเคราะห์ประโยคไม่สำเร็จ");

      const hasOnlyEmptyItem =
        items.length === 1 &&
        items[0].blocks.length === 0 &&
        !items[0].sentence.hanzi;
      const startingIndex = hasOnlyEmptyItem ? 1 : items.length + 1;
      const newItems = data.results.map((result, index) => ({
        id: createId(),
        sentence: {
          index: `${startingIndex + index}.`,
          hanzi: result.hanzi,
          pinyin: result.pinyin,
          thai: result.thai,
          english: result.english
        },
        blocks: result.blocks.map((block) => createBlock(block))
      }));

      setItems((current) => hasOnlyEmptyItem ? newItems : [...current, ...newItems]);
      setQuickInput("");
      setNotice(`วิเคราะห์และสร้าง ${newItems.length} ประโยคเรียบร้อย`);
    } catch (error) {
      console.error("Failed to analyze sentences", error);
      setNotice(error.message || "วิเคราะห์ประโยคไม่สำเร็จ");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Item Management ---
  const addNewItem = () => {
    setItems((current) => [...current, createEmptyItem(current.length + 1)]);
  };

  const removeItem = (itemId) => {
    setItems((current) => {
      const remaining = current.filter(item => item.id !== itemId);
      return remaining.length > 0 ? remaining : [createEmptyItem()];
    });
  };

  const updateSentence = (itemId, field, value) => {
    setItems(items.map(item => item.id === itemId ? {
      ...item,
      sentence: { ...item.sentence, [field]: value }
    } : item));
  };

  // --- Block Management ---
  const addBlock = (itemId) => {
    setItems(items.map(item => item.id === itemId ? {
      ...item,
      blocks: [...item.blocks, createBlock()]
    } : item));
  };

  const updateBlock = (itemId, blockId, field, value) => {
    setItems(items.map(item => item.id === itemId ? {
      ...item,
      blocks: item.blocks.map(b => b.id === blockId ? { ...b, [field]: value } : b)
    } : item));
  };

  const removeBlock = (itemId, blockId) => {
    setItems(items.map(item => item.id === itemId ? {
      ...item,
      blocks: item.blocks.filter(b => b.id !== blockId)
    } : item));
  };

  const moveBlock = (itemId, blockIndex, direction) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newBlocks = [...item.blocks];
        if (direction === -1 && blockIndex > 0) {
          const temp = newBlocks[blockIndex];
          newBlocks[blockIndex] = newBlocks[blockIndex - 1];
          newBlocks[blockIndex - 1] = temp;
        } else if (direction === 1 && blockIndex < newBlocks.length - 1) {
          const temp = newBlocks[blockIndex];
          newBlocks[blockIndex] = newBlocks[blockIndex + 1];
          newBlocks[blockIndex + 1] = temp;
        }
        return { ...item, blocks: newBlocks };
      }
      return item;
    }));
  };

  const duplicateItem = (itemId) => {
    setItems((current) => {
      const sourceIndex = current.findIndex((item) => item.id === itemId);
      if (sourceIndex < 0) return current;
      const source = current[sourceIndex];
      const duplicate = {
        ...source,
        id: createId(),
        sentence: { ...source.sentence, index: `${sourceIndex + 2}.` },
        blocks: source.blocks.map((block) => ({ ...block, id: createId() }))
      };
      const next = [...current];
      next.splice(sourceIndex + 1, 0, duplicate);
      return next;
    });
    setNotice("คัดลอกประโยคแล้ว");
  };

  const moveItem = (itemIndex, direction) => {
    setItems((current) => {
      const destination = itemIndex + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[itemIndex], next[destination]] = [next[destination], next[itemIndex]];
      return next;
    });
  };

  const syncSentenceFromBlocks = (itemId) => {
    setItems((current) => current.map((item) => {
      if (item.id !== itemId || item.blocks.length === 0) return item;
      return {
        ...item,
        sentence: {
          ...item.sentence,
          hanzi: item.blocks.map((block) => block.hanzi).join(""),
          pinyin: item.blocks.map((block) => block.pinyin).filter(Boolean).join(" "),
          thai: item.blocks.map((block) => block.thai).filter(Boolean).join(" ")
        }
      };
    }));
    setNotice("อัปเดตข้อมูลประโยคจากช่องคำแล้ว");
  };

  const playSentence = (text) => {
    if (!text) {
      setNotice("กรุณากรอกประโยคภาษาจีนก่อน");
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=zh-CN`);
    audioRef.current = audio;
    audio.play().catch(() => setNotice("ไม่สามารถเล่นเสียงได้"));
  };

  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ version: 1, items }, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sentence_breakdown_project_${Date.now()}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("ดาวน์โหลดไฟล์โปรเจกต์แล้ว");
  };

  const importProject = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      setItems(normalizeItems(parsed.items ?? parsed));
      setNotice("นำเข้าโปรเจกต์เรียบร้อย");
    } catch (error) {
      console.error("Failed to import project", error);
      setNotice("ไฟล์โปรเจกต์ไม่ถูกต้อง");
    }
  };

  const clearProject = () => {
    if (!window.confirm("ล้างประโยคทั้งหมดและเริ่มใหม่ใช่หรือไม่?")) return;
    setItems([createEmptyItem()]);
    setQuickInput("");
    setNotice("เริ่มโปรเจกต์ใหม่แล้ว");
  };

  // --- Export ---
  const downloadImage = async () => {
    if (!previewRef.current) return;
    setExporting("image");
    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: "#ffffff",
        scale: Math.min(window.devicePixelRatio || 2, 2),
        useCORS: true
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentence_breakdown_${Date.now()}.png`;
      a.click();
    } catch (error) {
      console.error("Failed to generate image", error);
      setNotice("สร้างรูปภาพไม่สำเร็จ");
    } finally {
      setExporting("");
    }
  };

  const downloadDocx = async () => {
    setExporting("docx");
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, VerticalAlign, TableLayoutType } = await import("docx");

      const noBorders = {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      };

      const children = [];

      items.forEach(item => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ font: "Sarabun", text: item.sentence.index || "", bold: true, size: 32 }),
            ],
            spacing: { before: 400, after: 100 },
          })
        );

        if (item.blocks.length > 0) {
          const rows = [];
          const hasTopNote = item.blocks.some(b => b.topNote);
          const hasTopArrow = item.blocks.some(b => b.showTopArrow);

          if (hasTopNote) {
            rows.push(new TableRow({ children: item.blocks.map(b => new TableCell({ children: [new Paragraph({ children: [new TextRun({ font: "Sarabun", text: b.topNote || "", size: 24 })], alignment: AlignmentType.CENTER })], borders: noBorders, verticalAlign: VerticalAlign.BOTTOM })) }));
          }
          if (hasTopArrow) {
            rows.push(new TableRow({ children: item.blocks.map(b => new TableCell({ children: [new Paragraph({ children: [new TextRun({ font: "Sarabun", text: b.showTopArrow ? "↑" : "", size: 24 })], alignment: AlignmentType.CENTER })], borders: noBorders, verticalAlign: VerticalAlign.BOTTOM })) }));
          }
          rows.push(new TableRow({ children: item.blocks.map(b => new TableCell({ children: [new Paragraph({ children: [new TextRun({ font: "Sarabun", text: b.thai || "", size: 24 })], alignment: AlignmentType.CENTER })], borders: noBorders, verticalAlign: VerticalAlign.BOTTOM })) }));
          rows.push(new TableRow({ children: item.blocks.map(b => new TableCell({ children: [new Paragraph({ children: [new TextRun({ font: "Sarabun", text: b.hanzi || "", size: 36, bold: true })], alignment: AlignmentType.CENTER })], borders: noBorders, verticalAlign: VerticalAlign.CENTER })) }));
          rows.push(new TableRow({ children: item.blocks.map(b => new TableCell({ children: [new Paragraph({ children: [new TextRun({ font: "Sarabun", text: b.pinyin ? "↑" : "", size: 24 })], alignment: AlignmentType.CENTER })], borders: noBorders, verticalAlign: VerticalAlign.TOP })) }));
          rows.push(new TableRow({ children: item.blocks.map(b => new TableCell({ children: [new Paragraph({ children: [new TextRun({ font: "Sarabun", text: b.pinyin || "", size: 24 })], alignment: AlignmentType.CENTER })], borders: noBorders, verticalAlign: VerticalAlign.TOP })) }));

          const table = new Table({
            rows: rows,
            layout: TableLayoutType.FIXED,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 50, right: 50 }
          });
          children.push(table);
        }

        if (item.sentence.hanzi) children.push(new Paragraph({ children: [new TextRun({ font: "Sarabun", text: item.sentence.hanzi, size: 28 })], spacing: { before: 200 } }));
        if (item.sentence.pinyin) children.push(new Paragraph({ children: [new TextRun({ font: "Sarabun", text: item.sentence.pinyin, size: 28 })] }));
        if (item.sentence.english) children.push(new Paragraph({ children: [new TextRun({ font: "Sarabun", text: item.sentence.english, size: 28 })] }));
        if (item.sentence.thai) children.push(new Paragraph({ children: [new TextRun({ font: "Sarabun", text: item.sentence.thai, size: 28 })], spacing: { before: 100 } }));
        
        children.push(new Paragraph({ text: "" }));
      });

      const doc = new Document({ sections: [{ properties: {}, children: children }] });
      const buffer = await Packer.toBlob(doc);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(buffer);
      a.download = `sentence_breakdown_${Date.now()}.docx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (error) {
      console.error("Failed to generate docx", error);
      setNotice("สร้างไฟล์ Word ไม่สำเร็จ");
    } finally {
      setExporting("");
    }
  };

  return (
    <main className="flex-1 min-h-screen bg-slate-100 py-8 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Editor */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
              <ZapIcon />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">สร้างโครงสร้างประโยค</h1>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-2">
            <button onClick={exportProject} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
              สำรองโปรเจกต์
            </button>
            <button onClick={() => importRef.current?.click()} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
              นำเข้าโปรเจกต์
            </button>
            <input ref={importRef} type="file" accept="application/json,.json" onChange={importProject} className="hidden" />
            <button onClick={clearProject} className="ml-auto px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors">
              เริ่มใหม่
            </button>
            <p className="basis-full text-[11px] text-slate-400 px-1">
              บันทึกอัตโนมัติในอุปกรณ์นี้ {isHydrated ? "• พร้อมใช้งาน" : "• กำลังกู้คืนข้อมูล…"}
            </p>
          </div>

          {notice && (
            <div role="status" className="fixed z-[60] bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
              {notice}
            </div>
          )}
          
          {/* Quick Input Section */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-indigo-700 flex items-center gap-2 mb-2">
              <ZapIcon /> สร้างอัตโนมัติจากประโยคจีน
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
              ใส่เฉพาะประโยคภาษาจีน <b className="text-indigo-700">หนึ่งประโยคต่อหนึ่งบรรทัด</b>
              ระบบจะแยกคำ สร้างพินอิน และแปลไทย–อังกฤษให้อัตโนมัติ
            </p>
            <textarea
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="我爱你。&#10;很高兴认识你。&#10;今天天气很好。"
              disabled={isAnalyzing}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all min-h-[160px] text-sm outline-none resize-y mb-3"
            />
            <button
              onClick={handleQuickGenerate}
              disabled={isAnalyzing || !quickInput.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-200 active:scale-[0.98] flex justify-center items-center gap-2 text-sm"
            >
              <ZapIcon /> {isAnalyzing ? "กำลังแยกคำและแปล…" : "วิเคราะห์และสร้างอัตโนมัติ"}
            </button>
          </div>
          
          {/* Items List */}
          <div className="space-y-6">
            {items.map((item, itemIndex) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group transition-all hover:shadow-md">
                
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">{itemIndex + 1}</span>
                    ประโยคที่ {itemIndex + 1}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveItem(itemIndex, -1)} disabled={itemIndex === 0} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors disabled:opacity-25" title="ย้ายประโยคขึ้น"><ArrowUpIcon /></button>
                    <button onClick={() => moveItem(itemIndex, 1)} disabled={itemIndex === items.length - 1} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors disabled:opacity-25" title="ย้ายประโยคลง"><ArrowDownIcon /></button>
                    <button onClick={() => duplicateItem(item.id)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="คัดลอกประโยค"><CopyIcon /></button>
                    <button onClick={() => playSentence(item.sentence.hanzi)} className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors" title="ฟังเสียงประโยค"><VolumeIcon /></button>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="ลบข้อนี้"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Sentence Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="เลขข้อ" value={item.sentence.index} onChange={(e) => updateSentence(item.id, 'index', e.target.value)} className="sm:col-span-1" />
                    <InputField label="จีน" value={item.sentence.hanzi} onChange={(e) => updateSentence(item.id, 'hanzi', e.target.value)} className="sm:col-span-1" />
                    <InputField label="พินอิน" value={item.sentence.pinyin} onChange={(e) => updateSentence(item.id, 'pinyin', e.target.value)} className="sm:col-span-1" />
                    <InputField label="อังกฤษ" value={item.sentence.english} onChange={(e) => updateSentence(item.id, 'english', e.target.value)} className="sm:col-span-1" />
                    <InputField label="ไทย" value={item.sentence.thai} onChange={(e) => updateSentence(item.id, 'thai', e.target.value)} className="sm:col-span-2" />
                  </div>

                  {/* Word Blocks */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">คำศัพท์ในประโยค</h3>
                      <div className="flex flex-wrap justify-end gap-2">
                        {item.blocks.length > 0 && (
                          <button onClick={() => syncSentenceFromBlocks(item.id)} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-100 transition-colors">
                            รวมเป็นประโยค
                          </button>
                        )}
                        <button
                          onClick={() => addBlock(item.id)}
                          className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
                        >
                          <PlusIcon /> เพิ่มคำ
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {item.blocks.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                          ยังไม่มีคำศัพท์ กดเพิ่มคำ หรือใช้เครื่องมือสร้างอัตโนมัติด้านบน
                        </div>
                      ) : item.blocks.map((block, blockIndex) => (
                        <div key={block.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative group/block hover:border-indigo-200 transition-colors">
                          <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex-col gap-1 sm:opacity-0 sm:group-hover/block:opacity-100 transition-opacity hidden sm:flex">
                            <button onClick={() => moveBlock(item.id, blockIndex, -1)} disabled={blockIndex === 0} className="p-1.5 bg-white shadow-sm border border-slate-200 hover:text-indigo-600 rounded-full text-slate-400 disabled:opacity-30 transition-colors"><ArrowUpIcon /></button>
                            <button onClick={() => moveBlock(item.id, blockIndex, 1)} disabled={blockIndex === item.blocks.length - 1} className="p-1.5 bg-white shadow-sm border border-slate-200 hover:text-indigo-600 rounded-full text-slate-400 disabled:opacity-30 transition-colors"><ArrowDownIcon /></button>
                          </div>
                          
                          <div className="absolute top-2 right-2 sm:opacity-0 sm:group-hover/block:opacity-100 transition-opacity">
                            <button onClick={() => removeBlock(item.id, block.id)} className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded-md text-slate-400 transition-colors"><TrashIcon /></button>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pr-8 pl-1 sm:pl-4">
                            <InputField label="จีน" value={block.hanzi} onChange={(e) => updateBlock(item.id, block.id, 'hanzi', e.target.value)} />
                            <InputField label="ไทย" value={block.thai} onChange={(e) => updateBlock(item.id, block.id, 'thai', e.target.value)} />
                            <InputField label="พินอิน" value={block.pinyin} onChange={(e) => updateBlock(item.id, block.id, 'pinyin', e.target.value)} />
                            <InputField label="Note บน" value={block.topNote} placeholder="(เช่น รัก)" onChange={(e) => updateBlock(item.id, block.id, 'topNote', e.target.value)} />
                          </div>
                          <div className="mt-3 pl-1 sm:pl-4 flex items-center gap-2">
                            <input type="checkbox" id={`arrow-${block.id}`} checked={block.showTopArrow} onChange={(e) => updateBlock(item.id, block.id, 'showTopArrow', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <label htmlFor={`arrow-${block.id}`} className="text-xs font-medium text-slate-500 cursor-pointer select-none">แสดงลูกศร ↑ ชี้ Note</label>
                            <div className="ml-auto flex gap-1 sm:hidden">
                              <button onClick={() => moveBlock(item.id, blockIndex, -1)} disabled={blockIndex === 0} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 disabled:opacity-25" aria-label="ย้ายคำขึ้น"><ArrowUpIcon /></button>
                              <button onClick={() => moveBlock(item.id, blockIndex, 1)} disabled={blockIndex === item.blocks.length - 1} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 disabled:opacity-25" aria-label="ย้ายคำลง"><ArrowDownIcon /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button onClick={addNewItem} className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-2xl hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group cursor-pointer">
              <span className="bg-slate-200 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 p-1 rounded-full transition-colors"><PlusIcon /></span> 
              เพิ่มประโยคใหม่
            </button>
          </div>
        </div>

        {/* Right Column: Preview (Sticky) */}
        <div className="w-full lg:w-1/2 lg:sticky lg:top-8 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">ตัวอย่าง (Preview)</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <button disabled={Boolean(exporting)} onClick={downloadImage} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors text-sm cursor-pointer disabled:cursor-wait">
                <DownloadIcon /> {exporting === "image" ? "กำลังสร้าง…" : "รูปภาพ"}
              </button>
              <button disabled={Boolean(exporting)} onClick={downloadDocx} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors text-sm cursor-pointer disabled:cursor-wait">
                <DownloadIcon /> {exporting === "docx" ? "กำลังสร้าง…" : "Word"}
              </button>
            </div>
          </div>
          
          <div className="bg-slate-200/50 p-4 rounded-2xl border border-slate-200 overflow-x-auto shadow-inner h-auto max-h-[calc(100vh-140px)] overflow-y-auto">
            <div 
              ref={previewRef} 
              className="bg-white rounded-lg shadow-sm mx-auto p-8 sm:p-12 w-full flex flex-col gap-16"
              style={{ minHeight: '500px', color: '#1e293b', fontFamily: 'var(--font-sarabun), var(--font-noto-sans-sc), sans-serif' }}
            >
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 sm:gap-6">
                  <div className="text-2xl font-bold pt-14 whitespace-nowrap min-w-[2rem] text-slate-800">
                    {item.sentence.index}
                  </div>
                  
                  <div className="flex flex-col gap-8 flex-1">
                    {/* Top Word Breakdown Section */}
                    {item.blocks.length > 0 && (
                      <div className="flex flex-wrap gap-x-6 gap-y-8">
                        {item.blocks.map((block) => (
                          <div key={block.id} className="flex flex-col items-center justify-end min-w-[3rem]">
                            <div className="h-14 flex flex-col items-center justify-end mb-1 text-slate-600">
                              {block.topNote && <span className="text-lg font-medium">{block.topNote}</span>}
                              {block.showTopArrow && <span className="text-xl mt-1 text-slate-400">↑</span>}
                            </div>
                            <div className="text-xl h-8 flex items-center font-medium text-slate-700">{block.thai}</div>
                            <div className="text-3xl font-bold mt-1 mb-1 text-slate-900">{block.hanzi}</div>
                            {block.pinyin && <div className="text-lg text-slate-400">↑</div>}
                            <div className="text-xl font-medium text-slate-600">{block.pinyin}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sentence Translation Section */}
                    <div className="flex flex-col gap-1.5 mt-2 text-xl text-slate-700 leading-relaxed">
                      {item.sentence.hanzi && <div className="font-semibold text-slate-900">{item.sentence.hanzi}</div>}
                      {item.sentence.pinyin && <div>{item.sentence.pinyin}</div>}
                      {item.sentence.english && <div>{item.sentence.english}</div>}
                      {item.sentence.thai && <div className="mt-3 font-medium">{item.sentence.thai}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}

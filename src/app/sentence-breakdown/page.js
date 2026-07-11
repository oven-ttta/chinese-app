"use client";

import { useState, useRef } from "react";
import html2canvas from "html2canvas";

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

export default function SentenceBreakdown() {
  const [items, setItems] = useState([
    {
      id: Date.now(),
      sentence: { index: "1.", hanzi: "", pinyin: "", english: "", thai: "" },
      blocks: []
    }
  ]);

  const previewRef = useRef(null);

  // --- Quick Generate ---
  const [quickInput, setQuickInput] = useState("");

  const handleQuickGenerate = () => {
    const rawBlocks = quickInput.split(/\n\s*\n/);
    const newItems = [];
    
    rawBlocks.forEach((rawBlock, i) => {
      const lines = rawBlock.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length === 0) return;

      const newHanzi = lines[0] || "";
      const newPinyin = lines[1] || "";
      const newThai = lines[2] || "";
      const newEnglish = lines[3] || "";

      const hanziChars = Array.from(newHanzi).filter(char => !/[。，？！,.?!]/.test(char));
      const pinyinWords = newPinyin.split(/\s+/).map(p => p.replace(/[。，？！,.?!]/g, '')).filter(Boolean);
      const thaiWords = newThai.includes(' ') ? newThai.split(/\s+/).filter(Boolean) : [];

      const blocks = hanziChars.map((char, index) => ({
        id: Date.now() + i * 1000 + index,
        hanzi: char,
        pinyin: pinyinWords[index] || "",
        thai: thaiWords[index] || "",
        topNote: "",
        showTopArrow: false
      }));

      newItems.push({
        id: Date.now() + i,
        sentence: { 
          index: `${items.length === 1 && items[0].blocks.length === 0 && !items[0].sentence.hanzi ? 1 + i : items.length + i + 1}.`, 
          hanzi: newHanzi, 
          pinyin: newPinyin, 
          thai: newThai, 
          english: newEnglish 
        },
        blocks
      });
    });

    if (newItems.length > 0) {
      if (items.length === 1 && items[0].blocks.length === 0 && !items[0].sentence.hanzi) {
        setItems(newItems);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
      setQuickInput("");
    }
  };

  // --- Item Management ---
  const addNewItem = () => {
    setItems([...items, {
      id: Date.now(),
      sentence: { index: `${items.length + 1}.`, hanzi: "", pinyin: "", english: "", thai: "" },
      blocks: []
    }]);
  };

  const removeItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
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
      blocks: [...item.blocks, { id: Date.now(), thai: "", hanzi: "", pinyin: "", topNote: "", showTopArrow: false }]
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

  // --- Export ---
  const downloadImage = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentence_breakdown_${Date.now()}.png`;
      a.click();
    } catch (error) {
      console.error("Failed to generate image", error);
      alert("Failed to generate image.");
    }
  };

  const downloadDocx = async () => {
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
      URL.revokeObjectURL(a.href);
    } catch (error) {
      console.error("Failed to generate docx", error);
      alert("Failed to generate docx.");
    }
  };

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
          
          {/* Quick Input Section */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-indigo-700 flex items-center gap-2 mb-2">
              <ZapIcon /> สร้างอัตโนมัติจากข้อความ (รองรับหลายข้อ)
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
              วางข้อความเรียงตามบรรทัด หากต้องการสร้างหลายข้อให้ <b className="text-indigo-700">เว้นบรรทัดว่าง 1 บรรทัด</b> ระหว่างข้อ<br/>
              <span className="inline-block mt-1">
                <b>1:</b> จีน | <b>2:</b> พินอิน | <b>3:</b> ไทย | <b>4:</b> อังกฤษ (ไม่บังคับ)
              </span>
            </p>
            <textarea
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="我爱你。&#10;wǒ ài nǐ.&#10;ฉัน รัก คุณ&#10;I love you.&#10;&#10;很高兴认识你。&#10;Hěn gāoxìng rènshi nǐ.&#10;ยินดี ที่ได้ รู้จัก คุณ"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all min-h-[160px] text-sm outline-none resize-y mb-3"
            />
            <button
              onClick={handleQuickGenerate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-200 active:scale-[0.98] flex justify-center items-center gap-2 text-sm"
            >
              <ZapIcon /> แยกลงช่องอัตโนมัติ
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
                  {items.length > 1 && (
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="ลบข้อนี้"
                    >
                      <TrashIcon />
                    </button>
                  )}
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
                      <button 
                        onClick={() => addBlock(item.id)} 
                        className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
                      >
                        <PlusIcon /> เพิ่มคำ
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {item.blocks.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                          ยังไม่มีคำศัพท์ กดเพิ่มคำ หรือใช้เครื่องมือสร้างอัตโนมัติด้านบน
                        </div>
                      ) : item.blocks.map((block, blockIndex) => (
                        <div key={block.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative group/block hover:border-indigo-200 transition-colors">
                          <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex-col gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity hidden sm:flex">
                            <button onClick={() => moveBlock(item.id, blockIndex, -1)} disabled={blockIndex === 0} className="p-1.5 bg-white shadow-sm border border-slate-200 hover:text-indigo-600 rounded-full text-slate-400 disabled:opacity-30 transition-colors"><ArrowUpIcon /></button>
                            <button onClick={() => moveBlock(item.id, blockIndex, 1)} disabled={blockIndex === item.blocks.length - 1} className="p-1.5 bg-white shadow-sm border border-slate-200 hover:text-indigo-600 rounded-full text-slate-400 disabled:opacity-30 transition-colors"><ArrowDownIcon /></button>
                          </div>
                          
                          <div className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 transition-opacity">
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
              <button onClick={downloadImage} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors text-sm cursor-pointer">
                <DownloadIcon /> รูปภาพ
              </button>
              <button onClick={downloadDocx} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors text-sm cursor-pointer">
                <DownloadIcon /> Word
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

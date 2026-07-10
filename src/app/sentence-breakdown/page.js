"use client";

import { useState, useRef } from "react";
import html2canvas from "html2canvas";

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
    // Split by double newline to separate multiple items
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
      // If the first item is completely empty, replace it
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
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, VerticalAlign } = await import("docx");

      const noBorders = {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      };

      const children = [];

      items.forEach(item => {
        // 1. Index Paragraph
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: item.sentence.index || "",
                bold: true,
                size: 32, // 16pt
              }),
            ],
            spacing: { before: 400, after: 100 },
          })
        );

        // 2. Table for Word Blocks
        if (item.blocks.length > 0) {
          const rows = [];
          
          const hasTopNote = item.blocks.some(b => b.topNote);
          const hasTopArrow = item.blocks.some(b => b.showTopArrow);

          if (hasTopNote) {
            rows.push(
              new TableRow({
                children: item.blocks.map(b => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: b.topNote || "", size: 24 })], alignment: AlignmentType.CENTER })],
                  borders: noBorders,
                  verticalAlign: VerticalAlign.BOTTOM,
                })),
              })
            );
          }

          if (hasTopArrow) {
            rows.push(
              new TableRow({
                children: item.blocks.map(b => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: b.showTopArrow ? "↑" : "", size: 24 })], alignment: AlignmentType.CENTER })],
                  borders: noBorders,
                  verticalAlign: VerticalAlign.BOTTOM,
                })),
              })
            );
          }

          // Thai Row
          rows.push(
            new TableRow({
              children: item.blocks.map(b => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: b.thai || "", size: 24 })], alignment: AlignmentType.CENTER })],
                borders: noBorders,
                verticalAlign: VerticalAlign.BOTTOM,
              })),
            })
          );

          // Hanzi Row
          rows.push(
            new TableRow({
              children: item.blocks.map(b => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: b.hanzi || "", size: 36, bold: true })], alignment: AlignmentType.CENTER })],
                borders: noBorders,
                verticalAlign: VerticalAlign.CENTER,
              })),
            })
          );

          // Bottom Arrow Row
          rows.push(
            new TableRow({
              children: item.blocks.map(b => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: b.pinyin ? "↑" : "", size: 24 })], alignment: AlignmentType.CENTER })],
                borders: noBorders,
                verticalAlign: VerticalAlign.TOP,
              })),
            })
          );

          // Pinyin Row
          rows.push(
            new TableRow({
              children: item.blocks.map(b => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: b.pinyin || "", size: 24 })], alignment: AlignmentType.CENTER })],
                borders: noBorders,
                verticalAlign: VerticalAlign.TOP,
              })),
            })
          );

          const table = new Table({
            rows: rows,
            width: {
              size: 100,
              type: WidthType.AUTO,
            },
            margins: {
              top: 0,
              bottom: 0,
              left: 100,
              right: 100,
            }
          });

          children.push(table);
        }

        // 3. Sentence Translations
        if (item.sentence.hanzi) children.push(new Paragraph({ children: [new TextRun({ text: item.sentence.hanzi, size: 28 })], spacing: { before: 200 } }));
        if (item.sentence.pinyin) children.push(new Paragraph({ children: [new TextRun({ text: item.sentence.pinyin, size: 28 })] }));
        if (item.sentence.english) children.push(new Paragraph({ children: [new TextRun({ text: item.sentence.english, size: 28 })] }));
        if (item.sentence.thai) children.push(new Paragraph({ children: [new TextRun({ text: item.sentence.thai, size: 28 })], spacing: { before: 100 } }));
        
        // Add spacer
        children.push(new Paragraph({ text: "" }));
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

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

  return (
    <main className="flex-1 min-h-screen bg-slate-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Editor */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col gap-6">
          <h1 className="text-2xl font-bold text-slate-800">เครื่องมือสร้างโครงสร้างประโยค</h1>
          
          {/* Quick Input Section */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-3">
            <h2 className="text-sm font-bold text-blue-800">⚡ สร้างอัตโนมัติจากข้อความ (รองรับหลายข้อ)</h2>
            <p className="text-xs text-blue-600">
              วางข้อความเรียงตามบรรทัด หากต้องการสร้างหลายข้อให้ <b>เว้นบรรทัดว่าง 1 บรรทัด</b> ระหว่างข้อ<br/>
              บรรทัด 1: ภาษาจีน<br/>
              บรรทัด 2: พินอิน (เว้นวรรคแต่ละคำ)<br/>
              บรรทัด 3: ภาษาไทย (เว้นวรรคแต่ละคำถ้าต้องการให้แยกช่องอัตโนมัติ)<br/>
              บรรทัด 4: ภาษาอังกฤษ (ไม่บังคับ)
            </p>
            <textarea
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="我爱你。&#10;wǒ ài nǐ.&#10;ฉัน รัก คุณ&#10;I love you.&#10;&#10;很高兴认识你。&#10;Hěn gāoxìng rènshi nǐ.&#10;ยินดี ที่ได้ รู้จัก คุณ"
              className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[150px] text-sm"
            />
            <button
              onClick={handleQuickGenerate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm"
            >
              แยกลงช่องอัตโนมัติ
            </button>
          </div>
          
          {/* Items List */}
          <div className="space-y-6">
            {items.map((item, itemIndex) => (
              <div key={item.id} className="p-4 border-2 border-slate-200 rounded-xl bg-slate-50 relative">
                {items.length > 1 && (
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg text-sm font-bold"
                  >
                    ลบข้อนี้
                  </button>
                )}
                <h2 className="text-lg font-bold text-slate-700 mb-4">ข้อที่ {itemIndex + 1}</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">เลขข้อ (Index)</label>
                      <input type="text" value={item.sentence.index} onChange={(e) => updateSentence(item.id, 'index', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">ประโยคภาษาจีน</label>
                      <input type="text" value={item.sentence.hanzi} onChange={(e) => updateSentence(item.id, 'hanzi', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">พินอิน (Pinyin)</label>
                      <input type="text" value={item.sentence.pinyin} onChange={(e) => updateSentence(item.id, 'pinyin', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">คำแปลอังกฤษ</label>
                      <input type="text" value={item.sentence.english} onChange={(e) => updateSentence(item.id, 'english', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-600 mb-1">คำแปลไทย</label>
                      <input type="text" value={item.sentence.thai} onChange={(e) => updateSentence(item.id, 'thai', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-md font-bold text-slate-700 flex justify-between items-center mb-3">
                      <span>คำศัพท์ในประโยค</span>
                      <button onClick={() => addBlock(item.id)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-200 transition-colors">
                        + เพิ่มคำ
                      </button>
                    </h3>
                    
                    <div className="space-y-3">
                      {item.blocks.map((block, blockIndex) => (
                        <div key={block.id} className="p-3 bg-white border border-slate-200 rounded-lg relative group shadow-sm">
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveBlock(item.id, blockIndex, -1)} disabled={blockIndex === 0} className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30">↑</button>
                            <button onClick={() => moveBlock(item.id, blockIndex, 1)} disabled={blockIndex === item.blocks.length - 1} className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30">↓</button>
                            <button onClick={() => removeBlock(item.id, block.id)} className="p-1 hover:bg-red-100 rounded text-red-600">✕</button>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">จีน</label>
                              <input type="text" value={block.hanzi} onChange={(e) => updateBlock(item.id, block.id, 'hanzi', e.target.value)} className="w-full p-1.5 text-sm border border-slate-200 rounded" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">ไทย</label>
                              <input type="text" value={block.thai} onChange={(e) => updateBlock(item.id, block.id, 'thai', e.target.value)} className="w-full p-1.5 text-sm border border-slate-200 rounded" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">พินอิน</label>
                              <input type="text" value={block.pinyin} onChange={(e) => updateBlock(item.id, block.id, 'pinyin', e.target.value)} className="w-full p-1.5 text-sm border border-slate-200 rounded" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Note ด้านบน</label>
                              <input type="text" value={block.topNote} onChange={(e) => updateBlock(item.id, block.id, 'topNote', e.target.value)} placeholder="(เช่น รัก)" className="w-full p-1.5 text-sm border border-slate-200 rounded" />
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <input type="checkbox" id={`arrow-${block.id}`} checked={block.showTopArrow} onChange={(e) => updateBlock(item.id, block.id, 'showTopArrow', e.target.checked)} className="rounded text-blue-600" />
                            <label htmlFor={`arrow-${block.id}`} className="text-xs text-slate-600 cursor-pointer">แสดงลูกศร ↑ ชี้ Note ด้านบน</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button onClick={addNewItem} className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <span className="text-xl">+</span> เพิ่มข้อใหม่
            </button>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">ตัวอย่าง (Preview)</h2>
            <div className="flex gap-2">
              <button onClick={downloadImage} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm">ดาวน์โหลดรูปภาพ</button>
              <button onClick={downloadDocx} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm">ดาวน์โหลด Word (.docx)</button>
            </div>
          </div>
          
          <div className="bg-white overflow-x-auto rounded-2xl shadow-lg border border-slate-200">
            <div 
              ref={previewRef} 
              className="p-10 bg-white w-full flex flex-col gap-16"
              style={{ minHeight: '400px', color: '#000', fontFamily: 'var(--font-sarabun), var(--font-noto-sans-sc), sans-serif' }}
            >
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="text-2xl font-bold pt-14 whitespace-nowrap min-w-[2rem]">
                    {item.sentence.index}
                  </div>
                  
                  <div className="flex flex-col gap-8 flex-1">
                    {/* Top Word Breakdown Section */}
                    {item.blocks.length > 0 && (
                      <div className="flex flex-wrap gap-x-8 gap-y-6">
                        {item.blocks.map((block) => (
                          <div key={block.id} className="flex flex-col items-center justify-end min-w-[3rem]">
                            <div className="h-14 flex flex-col items-center justify-end mb-1">
                              {block.topNote && <span className="text-xl">{block.topNote}</span>}
                              {block.showTopArrow && <span className="text-xl mt-1">↑</span>}
                            </div>
                            <div className="text-xl h-8 flex items-center">{block.thai}</div>
                            <div className="text-2xl font-medium mt-1 mb-1">{block.hanzi}</div>
                            {block.pinyin && <div className="text-xl">↑</div>}
                            <div className="text-xl">{block.pinyin}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sentence Translation Section */}
                    <div className="flex flex-col gap-1 mt-2 text-xl">
                      {item.sentence.hanzi && <div>{item.sentence.hanzi}</div>}
                      {item.sentence.pinyin && <div>{item.sentence.pinyin}</div>}
                      {item.sentence.english && <div>{item.sentence.english}</div>}
                      {item.sentence.thai && <div className="mt-4">{item.sentence.thai}</div>}
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

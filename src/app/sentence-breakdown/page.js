"use client";

import { useState, useRef } from "react";
import html2canvas from "html2canvas";

export default function SentenceBreakdown() {
  const [blocks, setBlocks] = useState([]);

  const [sentence, setSentence] = useState({
    index: "",
    hanzi: "",
    pinyin: "",
    english: "",
    thai: ""
  });

  const previewRef = useRef(null);

  const addBlock = () => {
    setBlocks([...blocks, { id: Date.now(), thai: "", hanzi: "", pinyin: "", topNote: "", showTopArrow: false }]);
  };

  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index, direction) => {
    const newBlocks = [...blocks];
    if (direction === -1 && index > 0) {
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[index - 1];
      newBlocks[index - 1] = temp;
    } else if (direction === 1 && index < newBlocks.length - 1) {
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[index + 1];
      newBlocks[index + 1] = temp;
    }
    setBlocks(newBlocks);
  };

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

  const [quickInput, setQuickInput] = useState("");

  const handleQuickGenerate = () => {
    const lines = quickInput.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const newHanzi = lines[0] || "";
    const newPinyin = lines[1] || "";
    const newThai = lines[2] || "";
    const newEnglish = lines[3] || "";

    setSentence(prev => ({
      ...prev,
      hanzi: newHanzi,
      pinyin: newPinyin,
      thai: newThai,
      english: newEnglish
    }));

    const hanziChars = Array.from(newHanzi).filter(char => !/[。，？！,.?!]/.test(char));
    const pinyinWords = newPinyin.split(/\s+/).map(p => p.replace(/[。，？！,.?!]/g, '')).filter(Boolean);
    
    // If Thai is separated by spaces, try to map it
    const thaiWords = newThai.includes(' ') ? newThai.split(/\s+/).filter(Boolean) : [];

    const newBlocks = hanziChars.map((char, index) => ({
      id: Date.now() + index,
      hanzi: char,
      pinyin: pinyinWords[index] || "",
      thai: thaiWords[index] || "",
      topNote: "",
      showTopArrow: false
    }));

    if (newBlocks.length > 0) {
      setBlocks(newBlocks);
    }
  };

  return (
    <main className="flex-1 min-h-screen bg-slate-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Editor */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col gap-6">
          <h1 className="text-2xl font-bold text-slate-800">เครื่องมือสร้างโครงสร้างประโยค</h1>
          
          {/* Quick Input Section */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-3">
            <h2 className="text-sm font-bold text-blue-800">⚡ สร้างอัตโนมัติจากข้อความ (Auto Generate)</h2>
            <p className="text-xs text-blue-600">
              วางข้อความเรียงตามบรรทัด:<br/>
              บรรทัด 1: ภาษาจีน<br/>
              บรรทัด 2: พินอิน (เว้นวรรคแต่ละคำ)<br/>
              บรรทัด 3: ภาษาไทย (เว้นวรรคแต่ละคำถ้าต้องการให้แยกช่องอัตโนมัติ)<br/>
              บรรทัด 4: ภาษาอังกฤษ (ไม่บังคับ)
            </p>
            <textarea
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="我爱你。&#10;wǒ ài nǐ.&#10;ฉัน รัก คุณ&#10;I love you."
              className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px] text-sm"
            />
            <button
              onClick={handleQuickGenerate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm"
            >
              แยกลงช่องอัตโนมัติ
            </button>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-700">1. ข้อมูลประโยค (Sentence Info)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">เลขข้อ (Index)</label>
                <input 
                  type="text" 
                  value={sentence.index} 
                  onChange={(e) => setSentence({ ...sentence, index: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">ประโยคภาษาจีน</label>
                <input 
                  type="text" 
                  value={sentence.hanzi} 
                  onChange={(e) => setSentence({ ...sentence, hanzi: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">พินอิน (Pinyin)</label>
                <input 
                  type="text" 
                  value={sentence.pinyin} 
                  onChange={(e) => setSentence({ ...sentence, pinyin: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">คำแปลอังกฤษ</label>
                <input 
                  type="text" 
                  value={sentence.english} 
                  onChange={(e) => setSentence({ ...sentence, english: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-1">คำแปลไทย</label>
                <input 
                  type="text" 
                  value={sentence.thai} 
                  onChange={(e) => setSentence({ ...sentence, thai: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-700 flex justify-between items-center">
              <span>2. คำศัพท์ในประโยค (Words)</span>
              <button 
                onClick={addBlock}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
              >
                + เพิ่มคำ
              </button>
            </h2>
            
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <div key={block.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30">↑</button>
                    <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30">↓</button>
                    <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-200 rounded text-red-600">✕</button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">จีน</label>
                      <input type="text" value={block.hanzi} onChange={(e) => updateBlock(block.id, 'hanzi', e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">ไทย</label>
                      <input type="text" value={block.thai} onChange={(e) => updateBlock(block.id, 'thai', e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">พินอิน</label>
                      <input type="text" value={block.pinyin} onChange={(e) => updateBlock(block.id, 'pinyin', e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Note ด้านบน</label>
                      <input type="text" value={block.topNote} onChange={(e) => updateBlock(block.id, 'topNote', e.target.value)} placeholder="(เช่น รัก)" className="w-full p-2 text-sm border border-slate-200 rounded-md" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`arrow-${block.id}`} 
                      checked={block.showTopArrow} 
                      onChange={(e) => updateBlock(block.id, 'showTopArrow', e.target.checked)} 
                      className="rounded text-blue-600"
                    />
                    <label htmlFor={`arrow-${block.id}`} className="text-xs text-slate-600 cursor-pointer">แสดงลูกศร ↑ ชี้ Note ด้านบน</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">ตัวอย่าง (Preview)</h2>
            <button 
              onClick={downloadImage}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
            >
              <span>ดาวน์โหลดเป็นรูปภาพ</span>
            </button>
          </div>
          
          <div className="bg-white overflow-hidden rounded-2xl shadow-lg border border-slate-200">
            {/* The actual element to be converted to image */}
            <div 
              ref={previewRef} 
              className="p-10 bg-white w-full"
              style={{ minHeight: '400px', color: '#000', fontFamily: 'var(--font-sarabun), var(--font-noto-sans-sc), sans-serif' }}
            >
              <div className="flex gap-4">
                <div className="text-2xl font-bold pt-14">
                  {sentence.index}
                </div>
                
                <div className="flex flex-col gap-8 flex-1">
                  {/* Top Word Breakdown Section */}
                  <div className="flex flex-wrap gap-x-8 gap-y-6">
                    {blocks.map((block) => (
                      <div key={block.id} className="flex flex-col items-center justify-end min-w-[3rem]">
                        {/* Optional Top Note & Arrow */}
                        <div className="h-14 flex flex-col items-center justify-end mb-1">
                          {block.topNote && (
                            <span className="text-xl">{block.topNote}</span>
                          )}
                          {block.showTopArrow && (
                            <span className="text-xl mt-1">↑</span>
                          )}
                        </div>
                        
                        {/* Thai Meaning */}
                        <div className="text-xl h-8 flex items-center">{block.thai}</div>
                        
                        {/* Hanzi */}
                        <div className="text-2xl font-medium mt-1 mb-1">{block.hanzi}</div>
                        
                        {/* Bottom Arrow (always show if pinyin exists) */}
                        {block.pinyin && <div className="text-xl">↑</div>}
                        
                        {/* Pinyin */}
                        <div className="text-xl">{block.pinyin}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sentence Translation Section */}
                  <div className="flex flex-col gap-1 mt-6 text-xl">
                    {sentence.hanzi && <div>{sentence.hanzi}</div>}
                    {sentence.pinyin && <div>{sentence.pinyin}</div>}
                    {sentence.english && <div>{sentence.english}</div>}
                    {sentence.thai && <div className="mt-4">{sentence.thai}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PinyinCard from "@/components/PinyinCard";

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const initials = [
  { id: "b", char: "b", label: "ปอ", speech: "播", color: "amber" },
  { id: "p", char: "p", label: "พอ", speech: "坡", color: "amber" },
  { id: "m", char: "m", label: "มอ", speech: "摸", color: "amber" },
  { id: "f", char: "f", label: "ฟอ", speech: "佛", color: "amber" },
  { id: "d", char: "d", label: "เตอ", speech: "得", color: "red" },
  { id: "t", char: "t", label: "เทอ", speech: "特", color: "red" },
  { id: "n", char: "n", label: "เนอ", speech: "讷", color: "red" },
  { id: "l", char: "l", label: "เลอ", speech: "勒", color: "red" },
  { id: "g", char: "g", label: "เกอ", speech: "哥", color: "orange" },
  { id: "k", char: "k", label: "เคอ", speech: "科", color: "orange" },
  { id: "h", char: "h", label: "เฮอ", speech: "喝", color: "orange" },
  { id: "j", char: "j", label: "จี", speech: "鸡", color: "emerald" },
  { id: "q", char: "q", label: "ชี", speech: "七", color: "emerald" },
  { id: "x", char: "x", label: "ซี", speech: "西", color: "emerald" },
  { id: "zh", char: "zh", label: "จือ", speech: "知", color: "blue" },
  { id: "ch", char: "ch", label: "ชือ", speech: "吃", color: "blue" },
  { id: "sh", char: "sh", label: "ซือ", speech: "诗", color: "blue" },
  { id: "r", char: "r", label: "ยือ", speech: "日", color: "blue" },
  { id: "z", char: "z", label: "จือ", speech: "资", color: "purple" },
  { id: "c", char: "c", label: "ชือ", speech: "雌", color: "purple" },
  { id: "s", char: "s", label: "ซือ", speech: "思", color: "purple" },
  { id: "y", char: "y", label: "อี", speech: "衣", color: "pink" },
  { id: "w", char: "w", label: "อู", speech: "屋", color: "pink" },
];

const vowels = [
  { id: "a", char: "a", label: "อา", speech: "啊", color: "teal" },
  { id: "o", char: "o", label: "โอ", speech: "喔", color: "teal" },
  { id: "e", char: "e", label: "เออ", speech: "鹅", color: "teal" },
  { id: "i", char: "i", label: "อี", speech: "一", color: "teal" },
  { id: "u", char: "u", label: "อู", speech: "乌", color: "teal" },
  { id: "ü", char: "ü", label: "อวี", speech: "鱼", color: "teal" },
];

const tones = [
  { id: "tone1", char: "mā", label: "เสียง 1 (สูงราบ)", speech: "妈", color: "indigo" },
  { id: "tone2", char: "má", label: "เสียง 2 (สูงขึ้น)", speech: "麻", color: "indigo" },
  { id: "tone3", char: "mǎ", label: "เสียง 3 (ต่ำแล้วขึ้น)", speech: "马", color: "indigo" },
  { id: "tone4", char: "mà", label: "เสียง 4 (ตก)", speech: "骂", color: "indigo" },
];

const vocabulary = [
  { char: "你好", pinyin: "nǐ hǎo", thai: "สวัสดี" },
  { char: "谢谢", pinyin: "xiè xie", thai: "ขอบคุณ" },
  { char: "再见", pinyin: "zài jiàn", thai: "ลาก่อน" },
  { char: "请", pinyin: "qǐng", thai: "กรุณา / เชิญ" },
  { char: "对不起", pinyin: "duì bu qǐ", thai: "ขอโทษ" },
  { char: "没关系", pinyin: "méi guān xi", thai: "ไม่เป็นไร" },
  { char: "是", pinyin: "shì", thai: "ใช่ / เป็น" },
  { char: "不是", pinyin: "bú shì", thai: "ไม่ใช่" },
  { char: "有", pinyin: "yǒu", thai: "มี" },
  { char: "没有", pinyin: "méi yǒu", thai: "ไม่มี" },
  { char: "我", pinyin: "wǒ", thai: "ฉัน" },
  { char: "你", pinyin: "nǐ", thai: "คุณ" },
  { char: "他", pinyin: "tā", thai: "เขา (ผู้ชาย)" },
  { char: "她", pinyin: "tā", thai: "เขา (ผู้หญิง)" },
  { char: "我们", pinyin: "wǒ men", thai: "พวกเรา" },
  { char: "什么", pinyin: "shén me", thai: "อะไร" },
  { char: "谁", pinyin: "shéi", thai: "ใคร" },
  { char: "哪里", pinyin: "nǎ lǐ", thai: "ที่ไหน" },
  { char: "多少", pinyin: "duō shao", thai: "เท่าไร" },
  { char: "今天", pinyin: "jīn tiān", thai: "วันนี้" },
  { char: "明天", pinyin: "míng tiān", thai: "พรุ่งนี้" },
  { char: "昨天", pinyin: "zuó tiān", thai: "เมื่อวาน" },
  { char: "现在", pinyin: "xiàn zài", thai: "ตอนนี้" },
  { char: "早上", pinyin: "zǎo shang", thai: "ตอนเช้า" },
  { char: "晚上", pinyin: "wǎn shang", thai: "ตอนเย็น / กลางคืน" },
  { char: "吃", pinyin: "chī", thai: "กิน" },
  { char: "喝", pinyin: "hē", thai: "ดื่ม" },
  { char: "水", pinyin: "shuǐ", thai: "น้ำ" },
  { char: "饭", pinyin: "fàn", thai: "ข้าว / อาหาร" },
  { char: "朋友", pinyin: "péng you", thai: "เพื่อน" },
  { char: "家", pinyin: "jiā", thai: "บ้าน / ครอบครัว" },
  { char: "学校", pinyin: "xué xiào", thai: "โรงเรียน" },
  { char: "老师", pinyin: "lǎo shī", thai: "ครู" },
  { char: "学生", pinyin: "xué sheng", thai: "นักเรียน" },
  { char: "喜欢", pinyin: "xǐ huan", thai: "ชอบ" },
  { char: "学习", pinyin: "xué xí", thai: "เรียน" },
];

export default function PinyinPage() {
  const [activeId, setActiveId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => () => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  const speakChineseFallback = (text, id) => {
    if (!window.speechSynthesis) {
      setActiveId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    const chineseVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("zh"));
    if (chineseVoice) utterance.voice = chineseVoice;
    utterance.onend = () => setActiveId(null);
    utterance.onerror = () => setActiveId(null);
    window.speechSynthesis.speak(utterance);
  };

  const speakChinese = (text, id) => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setActiveId(id);

    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=zh-CN`);
    audioRef.current = audio;
    audio.onended = () => setActiveId(null);
    audio.onerror = () => speakChineseFallback(text, id);
    audio.play().catch(() => speakChineseFallback(text, id));
  };

  const renderPinyinCards = (items, columns) => (
    <div className={columns}>
      {items.map((item) => (
        <PinyinCard
          key={item.id}
          char={item.char}
          label={item.label}
          colorClass={item.color}
          isActive={activeId === item.id}
          onPlay={() => speakChinese(item.speech, item.id)}
        />
      ))}
    </div>
  );

  return (
    <main className="flex-1 min-h-screen bg-slate-100 py-6 sm:py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 text-white font-bold text-xl">拼</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                ตารางพินอิน <span className="text-indigo-600">Pinyin Chart</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">กดที่การ์ดเพื่อฟังเสียงภาษาจีนกลาง</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-semibold text-sm transition-colors bg-slate-50 hover:bg-indigo-50 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-200">
            <BackIcon /> กลับหน้าหลัก
          </Link>
        </div>

        <section className="mb-10 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-amber-400 rounded-full" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">พยัญชนะ <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">(Initials)</span></h2>
          </div>
          {renderPinyinCards(initials, "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 md:gap-5")}
        </section>

        <section className="mb-10 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-teal-400 rounded-full" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">สระเดี่ยว <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">(Simple Vowels)</span></h2>
          </div>
          {renderPinyinCards(vowels, "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 md:gap-5")}
        </section>

        <section className="mb-10 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-indigo-500 rounded-full" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">วรรณยุกต์ <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">(Tones)</span></h2>
          </div>
          {renderPinyinCards(tones, "grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5")}
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-rose-400 rounded-full" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">คำศัพท์พื้นฐาน <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">(36 คำ)</span></h2>
            </div>
            <span className="hidden sm:inline text-sm text-slate-400">แตะเพื่อฟังเสียงจีน</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {vocabulary.map((word, index) => {
              const id = `word-${index}`;
              const isActive = activeId === id;
              return (
                <button
                  type="button"
                  key={`${word.char}-${index}`}
                  onClick={() => speakChinese(word.char, id)}
                  className={`text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-rose-100 ${isActive ? "border-rose-400 bg-rose-50 shadow-md" : "border-slate-200 bg-slate-50 hover:border-rose-300"}`}
                  aria-label={`ฟังเสียงคำว่า ${word.char}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-slate-800">{word.char}</span>
                    <span className={`${isActive ? "text-rose-600 animate-pulse" : "text-slate-400"}`}><SpeakerIcon /></span>
                  </div>
                  <div className="mt-2 font-semibold text-indigo-600">{word.pinyin}</div>
                  <div className="mt-1 text-sm text-slate-500">{word.thai}</div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

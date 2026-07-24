"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PinyinCard from "@/components/PinyinCard";

const INITIAL_VOICE_STORAGE_KEY = "pinyin-initial-voice";
const initialVoices = [
  { id: "clear", label: "เสียงใส", description: "ชัด ไม่มีเสียงพื้นหลัง" },
  { id: "native", label: "เสียงธรรมชาติ", description: "เสียงบันทึกเจ้าของภาษา" },
];

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
  { id: "b", char: "b", label: "ปอ", speech: "波", audio: "bo1", color: "amber" },
  { id: "p", char: "p", label: "พอ", speech: "坡", audio: "po1", color: "amber" },
  { id: "m", char: "m", label: "มอ", speech: "摸", audio: "mo1", color: "amber" },
  { id: "f", char: "f", label: "ฟอ", speech: "佛", audio: "fo1", color: "amber" },
  { id: "d", char: "d", label: "เตอ", speech: "嘚", audio: "de1", color: "red" },
  { id: "t", char: "t", label: "เทอ", speech: "忒", audio: "te1", color: "red" },
  { id: "n", char: "n", label: "เนอ", speech: "呢", audio: "ne1", color: "red" },
  { id: "l", char: "l", label: "เลอ", speech: "嘞", audio: "le1", color: "red" },
  { id: "g", char: "g", label: "เกอ", speech: "哥", audio: "ge1", color: "orange" },
  { id: "k", char: "k", label: "เคอ", speech: "科", audio: "ke1", color: "orange" },
  { id: "h", char: "h", label: "เฮอ", speech: "喝", audio: "he1", color: "orange" },
  { id: "j", char: "j", label: "จี", speech: "鸡", audio: "ji1", color: "emerald" },
  { id: "q", char: "q", label: "ชี", speech: "七", audio: "qi1", color: "emerald" },
  { id: "x", char: "x", label: "ซี", speech: "西", audio: "xi1", color: "emerald" },
  { id: "zh", char: "zh", label: "จือ", speech: "知", audio: "zhi1", color: "blue" },
  { id: "ch", char: "ch", label: "ชือ", speech: "吃", audio: "chi1", color: "blue" },
  { id: "sh", char: "sh", label: "ซือ", speech: "诗", audio: "shi1", color: "blue" },
  { id: "r", char: "r", label: "ยือ", speech: "日", audio: "ri1", color: "blue" },
  { id: "z", char: "z", label: "จือ", speech: "资", audio: "zi1", color: "purple" },
  { id: "c", char: "c", label: "ชือ", speech: "呲", audio: "ci1", color: "purple" },
  { id: "s", char: "s", label: "ซือ", speech: "思", audio: "si1", color: "purple" },
  { id: "y", char: "y", label: "อี", speech: "衣", audio: "yi1", color: "pink" },
  { id: "w", char: "w", label: "อู", speech: "乌", audio: "wu1", color: "pink" },
];

const vowels = [
  { id: "a", char: "a", label: "อา", speech: "啊", color: "teal" },
  { id: "o", char: "o", label: "โอ", speech: "喔", color: "teal" },
  { id: "e", char: "e", label: "เออ", speech: "鹅", color: "teal" },
  { id: "i", char: "i", label: "อี", speech: "一", color: "teal" },
  { id: "u", char: "u", label: "อู", speech: "乌", color: "teal" },
  { id: "ü", char: "ü", label: "อวี", speech: "鱼", color: "teal" },
];

const finals = [
  { id: "final-a", char: "a", speech: "啊" },
  { id: "final-o", char: "o", speech: "喔" },
  { id: "final-e", char: "e", speech: "鹅" },
  { id: "final-i", char: "i", speech: "衣" },
  { id: "final-u", char: "u", speech: "乌" },
  { id: "final-ü", char: "ü", speech: "鱼" },
  { id: "final-er", char: "er", speech: "儿" },
  { id: "final-ai", char: "ai", speech: "爱" },
  { id: "final-ei", char: "ei", speech: "诶" },
  { id: "final-ao", char: "ao", speech: "奥" },
  { id: "final-ou", char: "ou", speech: "欧" },
  { id: "final-ia", char: "ia", speech: "呀" },
  { id: "final-ie", char: "ie", speech: "耶" },
  { id: "final-ua", char: "ua", speech: "蛙" },
  { id: "final-uo", char: "uo", speech: "窝" },
  { id: "final-üe", char: "üe", speech: "月" },
  { id: "final-iao", char: "iao", speech: "腰" },
  { id: "final-iou", char: "iou", speech: "优" },
  { id: "final-uai", char: "uai", speech: "歪" },
  { id: "final-uei", char: "uei", speech: "威" },
  { id: "final-an", char: "an", speech: "安" },
  { id: "final-ian", char: "ian", speech: "烟" },
  { id: "final-uan", char: "uan", speech: "弯" },
  { id: "final-üan", char: "üan", speech: "冤" },
  { id: "final-en", char: "en", speech: "恩" },
  { id: "final-in", char: "in", speech: "因" },
  { id: "final-uen", char: "uen", speech: "温" },
  { id: "final-ün", char: "ün", speech: "晕" },
  { id: "final-ang", char: "ang", speech: "昂" },
  { id: "final-iang", char: "iang", speech: "央" },
  { id: "final-uang", char: "uang", speech: "汪" },
  { id: "final-eng", char: "eng", speech: "鞥" },
  { id: "final-ing", char: "ing", speech: "英" },
  { id: "final-ueng", char: "ueng", speech: "翁" },
  { id: "final-ong", char: "ong", speech: "东" },
  { id: "final-iong", char: "iong", speech: "庸" },
];

const tones = [
  { id: "tone1", char: "mā", label: "เสียง 1 (สูงราบ)", speech: "妈", color: "indigo" },
  { id: "tone2", char: "má", label: "เสียง 2 (สูงขึ้น)", speech: "麻", color: "indigo" },
  { id: "tone3", char: "mǎ", label: "เสียง 3 (ต่ำแล้วขึ้น)", speech: "马", color: "indigo" },
  { id: "tone4", char: "mà", label: "เสียง 4 (ตก)", speech: "骂", color: "indigo" },
];

export default function PinyinPage() {
  const [activeId, setActiveId] = useState(null);
  const [initialVoice, setInitialVoice] = useState("clear");
  const audioRef = useRef(null);

  useEffect(() => {
    const savedVoice = localStorage.getItem(INITIAL_VOICE_STORAGE_KEY);
    if (initialVoices.some((voice) => voice.id === savedVoice)) {
      setInitialVoice(savedVoice);
    }
  }, []);

  useEffect(() => () => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  const selectInitialVoice = (voiceId) => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setActiveId(null);
    setInitialVoice(voiceId);
    localStorage.setItem(INITIAL_VOICE_STORAGE_KEY, voiceId);
  };

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

  const speakChinese = (text, id, audioName) => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setActiveId(id);

    const voiceFolder = initialVoice === "native" ? "native/" : "";
    const audioUrl = audioName
      ? `/audio/pinyin-initials/${voiceFolder}${audioName}.mp3`
      : `/api/tts?text=${encodeURIComponent(text)}&lang=zh-CN`;
    const audio = new Audio(audioUrl);
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
          onPlay={() => speakChinese(item.speech, item.id, item.audio)}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-amber-400 rounded-full" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">พยัญชนะ <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">(Initials)</span></h2>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="เลือกชุดเสียงพยัญชนะ">
              {initialVoices.map((voice) => {
                const selected = initialVoice === voice.id;
                return (
                  <button
                    type="button"
                    key={voice.id}
                    onClick={() => selectInitialVoice(voice.id)}
                    aria-pressed={selected}
                    title={voice.description}
                    className={`rounded-xl border px-3 py-2 text-left transition-all ${
                      selected
                        ? "border-amber-400 bg-amber-50 text-amber-900 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-300 hover:bg-amber-50/60"
                    }`}
                  >
                    <span className="block text-xs font-bold">{voice.label}</span>
                    <span className="hidden md:block text-[10px] mt-0.5 opacity-70">{voice.description}</span>
                  </button>
                );
              })}
            </div>
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
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-cyan-500 rounded-full" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                ตารางสระและตัวสะกด <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">(Finals 36 รูป)</span>
              </h2>
            </div>
            <span className="hidden sm:inline text-sm text-slate-400">แตะเพื่อฟังเสียงจีน</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 overflow-hidden rounded-2xl border border-slate-300 bg-slate-300 gap-px">
            {finals.map((item) => {
              const isActive = activeId === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => speakChinese(item.speech, item.id)}
                  className={`relative min-h-16 sm:min-h-20 px-2 py-3 text-lg sm:text-xl font-extrabold transition-colors focus:z-10 focus:outline-none focus:ring-4 focus:ring-cyan-200 ${
                    isActive
                      ? "bg-cyan-100 text-cyan-800"
                      : "bg-white text-slate-800 hover:bg-cyan-50 hover:text-cyan-700"
                  }`}
                  aria-label={`ฟังเสียงสระ ${item.char}`}
                >
                  {item.char}
                  <span className={`absolute right-2 top-2 ${isActive ? "text-cyan-600 animate-pulse" : "text-slate-300"}`}>
                    <SpeakerIcon />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-10 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-indigo-500 rounded-full" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">วรรณยุกต์ <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">(Tones)</span></h2>
          </div>
          {renderPinyinCards(tones, "grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5")}
        </section>

      </div>
    </main>
  );
}

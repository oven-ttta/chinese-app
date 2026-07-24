import { NextResponse } from "next/server";

const MAX_SENTENCES = 20;
const MAX_SENTENCE_LENGTH = 500;
const LEARNING_BOUNDARY_CHARS = new Set(
  Array.from("我你他她它爱好很是的地得有在不没吗呢吧啊呀嘛么了着过去来想要会能给把被和也都")
);
const PRESERVED_WORDS = new Set([
  "没有", "我们", "你们", "他们", "她们", "它们", "喜欢", "可以", "因为",
  "所以", "但是", "还是", "已经", "正在", "知道", "觉得"
]);
const NO_DIRECT_MEANING_WORDS = new Set([
  "的", "地", "得", "了", "着", "过", "吗", "呢", "吧", "啊", "呀", "嘛", "么"
]);

const mapWithConcurrency = async (values, limit, mapper) => {
  const results = new Array(values.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker())
  );
  return results;
};

const translate = async (text, to, includeRomanization = false) => {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "zh-CN",
    tl: to,
    dt: "t",
    q: text
  });
  if (includeRomanization) params.append("dt", "rm");

  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!response.ok) throw new Error(`Translation service returned ${response.status}`);

  const data = await response.json();
  const segments = Array.isArray(data?.[0]) ? data[0] : [];
  const translatedText = segments
    .map((segment) => segment?.[0] || "")
    .join("")
    .trim();
  const pinyin = segments
    .map((segment) => segment?.[3] || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!translatedText) throw new Error("Translation service returned no text");
  return { translatedText, pinyin };
};

const segmentChinese = (sentence) => {
  const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
  return [...segmenter.segment(sentence)]
    .filter((part) => part.isWordLike && /[\p{Script=Han}]/u.test(part.segment))
    .flatMap((part) => {
      const word = part.segment;
      if (PRESERVED_WORDS.has(word)) return word;

      const refined = [];
      let lexicalBuffer = "";
      const flushBuffer = () => {
        if (lexicalBuffer) refined.push(lexicalBuffer);
        lexicalBuffer = "";
      };

      Array.from(word).forEach((character) => {
        if (LEARNING_BOUNDARY_CHARS.has(character)) {
          flushBuffer();
          refined.push(character);
        } else {
          lexicalBuffer += character;
        }
      });
      flushBuffer();
      return refined;
    });
};

const analyzeSentence = async (sentence) => {
  const words = segmentChinese(sentence);
  if (words.length === 0) throw new Error("No Chinese words found");

  const [thaiSentence, englishSentence, wordDetails] = await Promise.all([
    translate(sentence, "th", true),
    translate(sentence, "en"),
    mapWithConcurrency(
      words,
      6,
      async (word) => {
        const result = await translate(word, "th", true);
        const hasDirectMeaning =
          !NO_DIRECT_MEANING_WORDS.has(word) &&
          result.translatedText &&
          result.translatedText !== word;
        return {
          hanzi: word,
          pinyin: result.pinyin,
          thai: hasDirectMeaning ? result.translatedText : "0",
          topNote: "",
          showTopArrow: false
        };
      }
    )
  ]);

  return {
    hanzi: sentence,
    pinyin: thaiSentence.pinyin,
    thai: thaiSentence.translatedText,
    english: englishSentence.translatedText,
    blocks: wordDetails
  };
};

export async function POST(request) {
  try {
    const body = await request.json();
    const sentences = Array.isArray(body?.sentences)
      ? body.sentences.map((value) => String(value).trim()).filter(Boolean)
      : [];

    if (sentences.length === 0) {
      return NextResponse.json({ error: "กรุณาใส่ประโยคภาษาจีน" }, { status: 400 });
    }
    if (sentences.length > MAX_SENTENCES) {
      return NextResponse.json(
        { error: `วิเคราะห์ได้สูงสุด ${MAX_SENTENCES} ประโยคต่อครั้ง` },
        { status: 400 }
      );
    }
    if (sentences.some((sentence) => sentence.length > MAX_SENTENCE_LENGTH)) {
      return NextResponse.json(
        { error: `แต่ละประโยคต้องไม่เกิน ${MAX_SENTENCE_LENGTH} ตัวอักษร` },
        { status: 400 }
      );
    }
    if (sentences.some((sentence) => !/[\p{Script=Han}]/u.test(sentence))) {
      return NextResponse.json(
        { error: "พบข้อความที่ไม่มีตัวอักษรจีน กรุณาใส่ภาษาจีนเท่านั้น" },
        { status: 400 }
      );
    }

    const results = await mapWithConcurrency(sentences, 2, analyzeSentence);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Sentence breakdown error:", error);
    return NextResponse.json(
      { error: "วิเคราะห์ประโยคไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}

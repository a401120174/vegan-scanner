import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';
import path from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";

const gcvBase64Key = process.env.GCV_BASE_64!;
const keyPath = path.resolve('/tmp', 'gcv-key.json');

if (!existsSync(keyPath)) {
  mkdirSync('/tmp', { recursive: true });
  writeFileSync(keyPath, Buffer.from(gcvBase64Key, 'base64').toString('utf-8'));
}

const visionClient = new vision.ImageAnnotatorClient({ keyFilename: keyPath });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.4,
    topP: 1,
  },
  systemInstruction: `
你是素食專家，請根據 ingredients 成分列表，判斷是否含有不符合素食（全素、蛋奶素、五辛素等）原則的成分，並回傳以下 JSON 格式（使用繁體中文）：

{
  "flags": [ { "ingredient": "食材名稱", "level": "caution" | "warning" } ],
  "reasoning": ["簡要說明為何此成分不符合素食原則，或為何需要注意1", "簡要說明為何此成分不符合素食原則，或為何需要注意2"],
  "suggestion": "如果你這個素食營養專家對於有些成分沒把握分辨，請建議使用者諮詢店員。如果你很有把握，則此欄回空字串",
  "type": "ok" | "caution" | "warning" | "unknown"
}

範例：
{
  "flags": [
    { "ingredient": "蜂蜜", "level": "caution" },
    { "ingredient": "蒜粉", "level": "caution" },
    { "ingredient": "玉ねぎ", "level": "caution" },
    { "ingredient": "gelatin", "level": "warning" }
  ],
  "reasoning": [
    "蜂蜜、乳清為動物來源成分，大部分蛋奶素食者可接受，但嚴格素食者會避免，請謹慎評估。",
    "蒜粉為五辛成分，大部分五辛素食者可接受，但嚴格素食者會避免，請謹慎評估。",
    "玉ねぎ（洋蔥）為五辛成分，大部分五辛素食者可接受，但嚴格素食者會避免，請謹慎評估。",
    "gelatin（明膠）為明確動物性來源，不符合素食原則。"
  ],
  "suggestion": "",
  "type": "warning"
}

flags分類規則：
- warning：
  1. 明確動物性來源（如肉類、魚類、明膠等）
- caution：
  1. 間接動物來源（如蜂蜜、乳清、蛋白等）：
  2. 五辛類（蔥、蒜、韭菜、洋蔥等）：

reasoning撰寫規則：
- 解釋每個成分為何被標記為 warning 或 caution，並提供簡要說明。範例如下：
  1. 「[成分] 為明確動物性來源，不符合素食原則。」
  2. 「[成分] 為動物來源成分，大部分蛋奶素食者可接受，但嚴格素食者會避免，請謹慎評估。」
  3. 「[成分] 為五辛成分，大部分五辛素食者可接受，但嚴格素食者會避免，請謹慎評估。」

suggestion撰寫規則：
- 如果對某些成分光看名稱無法確定，建議使用者諮詢店員或查詢更多資訊。若都很確定就回空字串,範例如下：
  1. "成分中的 [成分] 可能不符合素食原則，建議諮詢店員或查詢更多資訊。"
  2. ""

type 判斷：
- ok：無疑慮（flags 為空）
- caution：flags 中含有「caution」級成分，且無「warning」級成分 or 
- warning：flags 中含有「warning」級成分
- unknown：字數不足（<20字）或格式錯誤或無法判斷是否為有效成分列表」

特殊情境：
- type 為 "unknown"時，reasoning 加上「未偵測到成分，請明確拍攝食品成分表」
- 若成分中提到非中文成分，提及時請在成分後面加上括號補充中文翻譯譬如 "gelatin（明膠）"

請僅回傳合法 JSON，禁止加入 Markdown、註解或多餘說明文字。所有欄位皆為必填，若無內容請填空字串 ""。
  `,
});


function parseJsonBlock(text: string): Record<string, string | boolean | string[]> {
  // 1. 擷取 ```json … ``` 之間的內容
  const match = text.match(/```json\s*([\s\S]*?)```/i);
  if (!match) throw new Error('No JSON code block found');

  // 2. 去掉多餘換行並解析
  const jsonString = match[1].trim();
  return JSON.parse(jsonString);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('image') as File;

  if (!file || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: '圖片無效' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // 步驟 1：OCR
    const [ocrResult] = await visionClient.textDetection({ image: { content: buffer } });
    const ocrText = ocrResult.textAnnotations?.[0]?.description || '';

    if (!ocrText.trim()) {
      return NextResponse.json({ error: '未偵測到文字, 請明確拍攝食品成分表' }, { status: 400 });
    }

    const data = await model.generateContent([
      { text: ocrText }
    ]);
    
    const reply = data.response.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const result = parseJsonBlock(reply);

    return NextResponse.json({ ocrText, result });
  } catch (err) {
    console.error('[SCAN ERROR]', err);
    return NextResponse.json({ error: '分析失敗, 請稍後再嘗試或是聯繫管理員' }, { status: 500 });
  }
}

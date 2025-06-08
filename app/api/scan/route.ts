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
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.4,
    topP: 1,
  },
  systemInstruction: `
你是營養專家，請根據 ingredients 成分列表，判斷是否含有不符合素食原則的成分，並回傳以下 JSON 格式（使用繁體中文）：

{
  "flags": [ { "ingredient": "食材名稱", "level": "注意" | "警告" } ],
  "reasoning": ["簡要說明（可多條，含中文翻譯）"],
  "suggestion": "提醒或外語詢問語句，若無請回傳空字串",
  "type": "ok" | "warning" | "no"
}

分類規則：
- 「警告」：豬肉、牛肉、雞肉、魚、蝦、明膠、魚露、雞粉、動物萃取物等。
  → 說明：「[成分] 為明確動物性來源，不符合素食原則。」
- 「注意」：
  1. 動物來源（如蜂蜜、乳清、蛋白等）：
     → 「[成分] 為動物來源成分，大部分蛋奶素食者可接受，但嚴格素食者會避免，請謹慎評估。」
  2. 五辛類（蔥、蒜、韭菜、洋蔥等）：
     → 「[成分] 為五辛成分，大部分五辛素食者可接受，但嚴格素食者會避免，請謹慎評估。」
  3. 模糊成分（香料、調味料、蛋白質水解物等）：
     → 「[成分] 可能含有動物性或五辛成分，請謹慎評估。」

特殊處理：
- 若模糊成分後方標示為「植物性」、「植物來源」、「植物萃取物」，則不列入 flags，不需說明或提醒。
- 若 flags 含模糊成分，請補充 suggestion：
  「[成分A 和 成分B] 的來源可能包含動物性或五辛成分，建議查看詳細標示或詢問廠商。您可以說：「這個產品有包含動物性或五辛成分嗎？」」

type 判斷：
- ok：無疑慮（flags 為空）
- warning：含「注意」級成分
- no：含任一「警告」級成分
- 字數不足（<20字）或格式錯誤：flags 為空，reasoning 加上「資訊不足，無法判斷是否為有效成分列表」，result 為 "warning"

其他語言：
- reasoning 中提到非中文成分，請用括號補充中文翻譯（如：gelatin（明膠））
- 若 ingredients 為外語，suggestion 中請補充當地常見動物性隱藏成分提醒，並提供簡單詢問語句，例如：「これは動物由来の原材料が入っていますか？」

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

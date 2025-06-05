import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';
import path from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const gcvBase64Key = process.env.GCV_BASE_64!;
const keyPath = path.resolve('/tmp', 'gcv-key.json');

if (!existsSync(keyPath)) {
  mkdirSync('/tmp', { recursive: true });
  writeFileSync(keyPath, Buffer.from(gcvBase64Key, 'base64').toString('utf-8'));
}

const visionClient = new vision.ImageAnnotatorClient({ keyFilename: keyPath });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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

    // 2. Gemini 處理
const prompt = `
你是營養專家。請根據提供的 ingredients 列表，判斷這個食品是否屬於以下分類之一，並說明原因。

請根據以下分類標準進行判斷：

1.「全素」：完全不含任何動物性成分，也不含五辛（如蔥、蒜、蒜粉、蔥粉等）
2.「蛋奶素」：可含蛋與奶，但不含肉類與五辛
3.「五葷素」：不含肉類，但含五辛成分（蔥、蒜、洋蔥等）
4.「非素食」：含有肉、魚、雞、牛、豬、海鮮、動物萃取物、明膠、魚露、蜂蜜、豬油、雞粉等明確動物性成分
5.「無法判斷」：若 ingredients 資訊過少、不清楚、非成分表格式等，請明確說明並標為無法判斷

以下是你應回傳的 JSON 格式（使用繁體中文）：

{
  "type": "全素" | "蛋奶素" | "五葷素" | "非素食" | "無法判斷",
  "reasoning": "簡要說明為何屬於此分類或為何無法判斷",
  "riskyKeywords": ["出現的疑似動物性或五辛關鍵字"]
}

請特別注意以下：
- 以下視為五辛：蔥、蒜、蔥粉、蒜粉、青蔥、洋蔥、大蒜萃取物等
- 以下視為動物來源：雞、豬、牛、魚、蝦、動物萃取物、明膠、乳清、蜂蜜、魚露、豬油、雞粉、動物脂肪等
- 若 ingredients 太短（少於 20 字）或無法辨認內容，也請回傳「無法判斷」
- 如果 ingredients 中提到「與肉類同一產線製造」或「生產線可能含有蛋、魚、牛奶成分」等資訊，不影響素食分類判定。但請在 reasoning 補充說明：「若您對生產線混用有所顧慮，請自行判斷是否食用。」

請務必依格式回傳有效 JSON，不要加註說明文字或 Markdown，僅回傳 JSON。
`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: prompt + '\n\n' + ocrText }] }
        ]
      })
    });

    const geminiData = await geminiRes.json();
    
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const result = parseJsonBlock(reply);

    return NextResponse.json({ ocrText, result });

  } catch (err) {
    console.error('[SCAN ERROR]', err);
    return NextResponse.json({ error: '分析失敗, 請稍後再嘗試或是聯繫管理員' }, { status: 500 });
  }
}

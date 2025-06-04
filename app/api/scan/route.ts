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
      return NextResponse.json({ error: 'OCR 未偵測到文字' }, { status: 400 });
    }

    // 2. Gemini 處理
    const prompt = `
你是營養專家。請根據提供的 ingredients 列表，判斷這個食品是否符合「奶蛋素 (vegetarian)」與「全素 (vegan)」。

請回傳 JSON 格式如下：
{
  "vegetarian": boolean,
  "vegan": boolean,
  "reasoning": string,
  "riskyKeywords": string[]
}
請特別注意「萃取物（如 chicken extract、beef flavor）」或「動物來源添加物」。全用繁體中文回應
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
    return NextResponse.json({ error: 'OCR/GPT 分析失敗' }, { status: 500 });
  }
}

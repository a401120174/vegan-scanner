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

// const mockData = {
//     "ocrText": "t\nViva 萬歲牌 蜜汁腰果\n掛及製程及重江網球\n蜜汁腰果\n成分:腰果、糖、棕櫚油、乙醯化\n「白二酸二澱粉、麥芽糊精、蜂蜜、\n「權、麥芽寡、小麥纖維、玉米糖\n過敏原資訊:本產品含有堅果類及\n有體質之穀物製品。\n淨書160公克\n保存限通:360天(係指未開封狀態)\n有效日期:請參閱包裝標示\n檢查 為確保產品品質,產品\n请存表真量豆乾燥處。開封後請密\n制冷藏保存每個快食用完畢。\n聯華食品\n安心履歷\n回約\n有效日期(西元年/月/日)\nExpiry Date(YYYY/MM/DD)\n20260212\nD20845\n營養標示\n| 每一份量20.0公克\n4371\n244",
//     "result": {
//         "vegetarian": false,
//         "vegan": false,
//         "reasoning": "This product contains honey, which is an animal product and thus makes it neither vegetarian nor vegan.  The presence of honey disqualifies it from both categories.",
//         "riskyKeywords": [
//             "蜂蜜"
//         ]
//     }
// }

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

 // return a mock response for testing
//  return NextResponse.json({
//     ocrText: 'Mock OCR text for testing',
//     result: {
//       vegetarian: true,
//       vegan: false,
//       reasoning: '這個食品含有蛋和奶，但不含肉類，因此是蛋奶素食品。',
//       riskyKeywords: ['milk', 'egg'],
//     },
//   });

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

#!/bin/bash

echo "開始生成 PWA 圖標..."

# 確保目錄存在
mkdir -p public/icons

# 使用 Node.js 創建簡單的 PWA 圖標
cat > temp-icon-generator.js << 'EOF'
const fs = require('fs');
const { createCanvas } = require('canvas');

// 要生成的圖標尺寸
const sizes = [192, 384, 512];

// 為每個尺寸生成圖標
sizes.forEach((size) => {
  // 創建 Canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 背景
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, size, size);
  
  // 文字樣式
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // "素食" 文字
  const mainFontSize = size * 0.25;
  ctx.font = `bold ${mainFontSize}px Arial`;
  ctx.fillText('素食', size/2, size/2 - mainFontSize/4);
  
  // "掃描儀" 文字
  const subFontSize = size * 0.15;
  ctx.font = `bold ${subFontSize}px Arial`;
  ctx.fillText('掃描儀', size/2, size/2 + mainFontSize/2);
  
  // 保存為 PNG 文件
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icons/icon-${size}x${size}.png`, buffer);
  console.log(`已生成: icon-${size}x${size}.png`);
});

console.log('所有 PWA 圖標已生成完成！');
EOF

echo "注意: 這個腳本需要安裝 'canvas' npm 套件才能生成圖標。"
echo "您可以使用下面的命令安裝它:"
echo "npm install canvas"
echo ""
echo "然後運行圖標生成器:"
echo "node temp-icon-generator.js"
echo ""
echo "或者您可以使用瀏覽器打開 /generate-icons.html 頁面來生成和下載圖標。"
echo "完成後，將圖標放到 public/icons 目錄中。"

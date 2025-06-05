const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const size = 192;

canvas.width = size;
canvas.height = size;

// Background
ctx.fillStyle = '#4CAF50';
ctx.fillRect(0, 0, size, size);

// Text
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// "素食" text
const mainFontSize = size * 0.25;
ctx.font = `bold ${mainFontSize}px Arial`;
ctx.fillText('素食', size/2, size/2 - mainFontSize/4);

// "掃描儀" text
const subFontSize = size * 0.15;
ctx.font = `bold ${subFontSize}px Arial`;
ctx.fillText('掃描儀', size/2, size/2 + mainFontSize/2);

// Convert to PNG
const pngData = canvas.toDataURL('image/png');
console.log('Icon data URL:', pngData);

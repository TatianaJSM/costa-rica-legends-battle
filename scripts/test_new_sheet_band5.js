import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781750210599.jpg";
const outputDir = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\test_cadejo_new";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function isBackgroundPixel(r, g, b) {
  // White background
  return r > 240 && g > 240 && b > 240;
}

function floodFillBackground(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const visited = Array(width * height).fill(false);
  const queue = [];

  for (let x = 0; x < width; x++) {
    queue.push({ x, y: 0 });
    queue.push({ x, y: height - 1 });
    visited[0 * width + x] = true;
    visited[(height - 1) * width + x] = true;
  }
  for (let y = 1; y < height - 1; y++) {
    queue.push({ x: 0, y });
    queue.push({ x: width - 1, y });
    visited[y * width + 0] = true;
    visited[y * width + (width - 1)] = true;
  }

  while (queue.length > 0) {
    const curr = queue.shift();
    const idx = (curr.y * width + curr.x) * 4;
    const r = image.bitmap.data[idx + 0];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    const a = image.bitmap.data[idx + 3];

    if (isBackgroundPixel(r, g, b) && a > 0) {
      image.bitmap.data[idx + 0] = 0;
      image.bitmap.data[idx + 1] = 0;
      image.bitmap.data[idx + 2] = 0;
      image.bitmap.data[idx + 3] = 0;

      const neighbors = [
        { x: curr.x + 1, y: curr.y },
        { x: curr.x - 1, y: curr.y },
        { x: curr.x, y: curr.y + 1 },
        { x: curr.x, y: curr.y - 1 }
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
          const nIdx = n.y * width + n.x;
          if (!visited[nIdx]) {
            visited[nIdx] = true;
            queue.push(n);
          }
        }
      }
    }
  }
}

function autoCrop(image) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let hasPixels = false;

  image.scan(0, 0, w, h, function(x, y, idx) {
    const a = this.bitmap.data[idx + 3];
    if (a > 0) {
      hasPixels = true;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  if (!hasPixels) return image;

  const croppedW = maxX - minX + 1;
  const croppedH = maxY - minY + 1;
  return image.clone().crop({ x: minX, y: minY, w: croppedW, h: croppedH });
}

async function main() {
  const image = await Jimp.read(imgPath);
  
  // Save Band 5 columns
  const cols = [
    [6, 94], [96, 168], [171, 265], [289, 374], [382, 563],
    [578, 661], [675, 774], [778, 879], [883, 1005]
  ];

  for (let i = 0; i < cols.length; i++) {
    const [xMin, xMax] = cols[i];
    const cropped = image.clone().crop({ x: xMin, y: 191, w: xMax - xMin, h: 85 });
    floodFillBackground(cropped);
    const finalImg = autoCrop(cropped);
    await finalImg.write(path.join(outputDir, `band5_col_${i + 1}.png`));
    console.log(`Saved band5_col_${i + 1}.png (width: ${finalImg.bitmap.width}px, height: ${finalImg.bitmap.height}px)`);
  }
}

main().catch(console.error);

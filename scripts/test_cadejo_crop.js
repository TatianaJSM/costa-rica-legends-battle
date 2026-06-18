import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";
const outputDir = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\test_cadejo";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function isBackgroundPixel(r, g, b) {
  // Background of Cadejos sheet is very dark, almost black. Let's say < 25 for r, g, b.
  return r < 25 && g < 25 && b < 25;
}

function floodFillBackground(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const visited = Array(width * height).fill(false);
  const queue = [];

  // Add all border pixels
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
  
  // Row 1 layout columns
  const row1Cols = [
    [9, 92], [101, 177], [188, 269], // idle
    [290, 384], [388, 461], [466, 545], [553, 629], [636, 718], [741, 821], // walk
    [822, 902], [906, 998] // jump? wait, where is jump 3?
  ];

  console.log("Saving Row 1 test crops...");
  for (let i = 0; i < row1Cols.length; i++) {
    const [xMin, xMax] = row1Cols[i];
    const cropped = image.clone().crop({ x: xMin, y: 20, w: xMax - xMin, h: 115 });
    floodFillBackground(cropped);
    const finalImg = autoCrop(cropped);
    await finalImg.write(path.join(outputDir, `row1_col_${i + 1}.png`));
  }
  console.log("Crops completed!");
}

main().catch(console.error);

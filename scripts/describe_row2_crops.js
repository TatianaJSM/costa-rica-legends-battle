import { Jimp } from 'jimp';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";

function isBackgroundPixel(r, g, b) {
  return r < 25 && g < 25 && b < 25;
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

function getCropBounds(image) {
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

  return hasPixels ? { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 } : null;
}

async function main() {
  const image = await Jimp.read(imgPath);
  
  // Sliced columns in row 2:
  const row2Cols = [
    [15, 46], [48, 149], [151, 173], [185, 275], [303, 384],
    [394, 459], [464, 569], [582, 664], [674, 776], [790, 884], [892, 1009]
  ];

  console.log("Row 2 Crop Details:");
  for (let i = 0; i < row2Cols.length; i++) {
    const [xMin, xMax] = row2Cols[i];
    const cropped = image.clone().crop({ x: xMin, y: 180, w: xMax - xMin, h: 90 });
    floodFillBackground(cropped);
    const bounds = getCropBounds(cropped);
    if (bounds) {
      console.log(`Col ${i + 1} (${xMin}-${xMax}): cropped size ${bounds.w}x${bounds.h}, vertical range in crop: Y=[${bounds.minY}, ${bounds.maxY}]`);
    } else {
      console.log(`Col ${i + 1} (${xMin}-${xMax}): EMPTY`);
    }
  }
}

main().catch(console.error);

import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const padreSource = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781475185374.png";
const seguaSource = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781475206059.png";

const padreDest = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\padre-sin-cabeza.png";
const seguaDest = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\segua.png";

function isPadreBackground(r, g, b) {
  // Checkerboard squares: around 127 or 167
  const isGray1 = Math.abs(r - 127) <= 6 && Math.abs(g - 127) <= 6 && Math.abs(b - 127) <= 6;
  const isGray2 = Math.abs(r - 167) <= 6 && Math.abs(g - 167) <= 6 && Math.abs(b - 167) <= 6;
  return isGray1 || isGray2;
}

function isSeguaBackground(r, g, b) {
  // Solid dark gray background around 42-45
  return Math.abs(r - 43) <= 6 && Math.abs(g - 42) <= 6 && Math.abs(b - 40) <= 6;
}

function floodFillBackground(image, checkFn) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const visited = Array(width * height).fill(false);
  const queue = [];

  // Add all border pixels to queue
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

  let count = 0;
  while (queue.length > 0) {
    const curr = queue.shift();
    const idx = (curr.y * width + curr.x) * 4;
    const r = image.bitmap.data[idx + 0];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    const a = image.bitmap.data[idx + 3];

    if (checkFn(r, g, b) && a > 0) {
      image.bitmap.data[idx + 0] = 0;
      image.bitmap.data[idx + 1] = 0;
      image.bitmap.data[idx + 2] = 0;
      image.bitmap.data[idx + 3] = 0;
      count++;

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
  console.log(`Cleared ${count} background pixels.`);
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

async function processPadre() {
  console.log("Processing El Padre Sin Cabeza presentation image...");
  const image = await Jimp.read(padreSource);
  floodFillBackground(image, isPadreBackground);
  const cropped = autoCrop(image);
  await cropped.write(padreDest);
  console.log(`Saved clean image to: ${padreDest}`);
}

async function processSegua() {
  console.log("Processing La Segua presentation image...");
  const image = await Jimp.read(seguaSource);
  floodFillBackground(image, isSeguaBackground);
  const cropped = autoCrop(image);
  await cropped.write(seguaDest);
  console.log(`Saved clean image to: ${seguaDest}`);
}

async function main() {
  await processPadre();
  await processSegua();
  console.log("Both presentation images processed successfully!");
}

main().catch(console.error);

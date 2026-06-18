import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781433326077.jpg";

function isBackgroundPixel(r, g, b) {
  // Solid dark grey background is #141414 (20, 20, 20)
  return r < 26 && g < 26 && b < 26;
}

async function main() {
  const image = await Jimp.read(imgPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  const visited = Array(width * height).fill(false);
  const components = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;

      const pIdx = idx * 4;
      const r = image.bitmap.data[pIdx + 0];
      const g = image.bitmap.data[pIdx + 1];
      const b = image.bitmap.data[pIdx + 2];

      if (!isBackgroundPixel(r, g, b)) {
        const queue = [{ x, y }];
        visited[idx] = true;

        let minX = x, maxX = x;
        let minY = y, maxY = y;
        let pixelCount = 0;

        while (queue.length > 0) {
          const curr = queue.shift();
          pixelCount++;

          if (curr.x < minX) minX = curr.x;
          if (curr.x > maxX) maxX = curr.x;
          if (curr.y < minY) minY = curr.y;
          if (curr.y > maxY) maxY = curr.y;

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
                const npIdx = nIdx * 4;
                const nr = image.bitmap.data[npIdx + 0];
                const ng = image.bitmap.data[npIdx + 1];
                const nb = image.bitmap.data[npIdx + 2];

                if (!isBackgroundPixel(nr, ng, nb)) {
                  visited[nIdx] = true;
                  queue.push(n);
                }
              }
            }
          }
        }

        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        // Keep component if it has reasonable size
        if (pixelCount > 100 && w > 10 && h > 15) {
          components.push({ minX, minY, maxX, maxY, w, h, pixelCount });
        }
      }
    }
  }

  console.log(`Detected ${components.length} components.`);
  
  // Sort components by Y coordinate first, then X coordinate
  // We can group them by rows by checking overlap or coordinate ranges
  components.sort((a, b) => {
    const ay = (a.minY + a.maxY) / 2;
    const by = (b.minY + b.maxY) / 2;
    return ay - by;
  });

  // Print all sorted components details to inspect rows
  components.forEach((c, idx) => {
    console.log(`Component ${idx}: Bounds [${c.minX}, ${c.minY}, ${c.maxX}, ${c.maxY}] size ${c.w}x${c.h} pxCount ${c.pixelCount}`);
  });
}

main().catch(err => console.error(err));

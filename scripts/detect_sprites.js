import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781431923076.jpg";

// Helper to check if a pixel is part of the checkerboard background
function isBackgroundPixel(r, g, b) {
  // White/grey checkerboard has high R,G,B and low saturation
  return r > 230 && g > 230 && b > 230 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12;
}

async function main() {
  const image = await Jimp.read(imgPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  // Create a grid of visited pixels
  const visited = Array(width * height).fill(false);
  const components = [];

  console.log(`Scanning image of size ${width}x${height}...`);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x);
      if (visited[idx]) continue;

      const pIdx = idx * 4;
      const r = image.bitmap.data[pIdx + 0];
      const g = image.bitmap.data[pIdx + 1];
      const b = image.bitmap.data[pIdx + 2];

      if (!isBackgroundPixel(r, g, b)) {
        // Found a non-background pixel! Let's do a BFS to find the connected component
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

          // Check neighbors (4-connectivity)
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

        // Only keep components that are large enough (filter out noise, text letters, etc.)
        // A typical sprite frame is at least 30x60 = 1800 pixels box
        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        if (pixelCount > 150 && w > 15 && h > 25) {
          components.push({ minX, minY, maxX, maxY, w, h, pixelCount });
        }
      }
    }
  }

  console.log(`Detected ${components.length} large components:`);
  components.forEach((c, idx) => {
    console.log(`Component ${idx + 1}: Bounding Box: [${c.minX}, ${c.minY}] to [${c.maxX}, ${c.maxY}] Size: ${c.w}x${c.h} Pixels: ${c.pixelCount}`);
  });
}

main().catch(err => console.error(err));

import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781433326077.jpg";

function isBackgroundPixel(r, g, b) {
  // Hex background is #141414
  return r < 28 && g < 28 && b < 28;
}

async function main() {
  const image = await Jimp.read(imgPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  const visited = Array(w * h).fill(false);
  const components = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
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
            if (n.x >= 0 && n.x < w && n.y >= 0 && n.y < h) {
              const nIdx = n.y * w + n.x;
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

        const cw = maxX - minX + 1;
        const ch = maxY - minY + 1;
        
        // Filter out small noise and labels
        if (pixelCount > 120 && cw > 15 && ch > 40) {
          components.push({ minX, minY, maxX, maxY, w: cw, h: ch, pixelCount });
        }
      }
    }
  }

  console.log(`Detected ${components.length} character/fringe components.`);

  // Group components into rows based on Y centers
  const rows = [
    { name: "Row 1 (Idle, Walk, Jump)", yMin: 10, yMax: 150, items: [] },
    { name: "Row 2 (Crouch, Claws, Scream)", yMin: 150, yMax: 300, items: [] },
    { name: "Row 3 (Special Attack, Projectile)", yMin: 300, yMax: 450, items: [] },
    { name: "Row 4 (Hurt, Knockdown, Victory)", yMin: 450, yMax: 570, items: [] }
  ];

  for (const c of components) {
    const yCenter = (c.minY + c.maxY) / 2;
    const matchedRow = rows.find(r => yCenter >= r.yMin && yCenter <= r.yMax);
    if (matchedRow) {
      matchedRow.items.push(c);
    }
  }

  // Sort each row horizontally
  for (const r of rows) {
    r.items.sort((a, b) => a.minX - b.minX);
    console.log(`\n${r.name}: Found ${r.items.length} frames.`);
    r.items.forEach((c, idx) => {
      console.log(`  Frame ${idx}: Bounds [X: ${c.minX}..${c.maxX}, Y: ${c.minY}..${c.maxY}] Size: ${c.w}x${c.h} pxCount: ${c.pixelCount}`);
    });
  }
}

main().catch(console.error);

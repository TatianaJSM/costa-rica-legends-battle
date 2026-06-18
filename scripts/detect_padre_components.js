import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781474185777.png";

function isBackground(r, g, b, a) {
  if (a === 0) return true;
  return r > 240 && g > 240 && b > 240;
}

const rows = [
  { name: "Row 1 (Idle, Walk, Jump)", yMin: 7, yMax: 128 },
  { name: "Row 2 (Crouch, Light, Heavy)", yMin: 168, yMax: 267 },
  { name: "Row 3 (Special Attack, Projectile)", yMin: 299, yMax: 406 },
  { name: "Row 4 (Hurt, Knockdown, Victory)", yMin: 437, yMax: 540 }
];

async function main() {
  const image = await Jimp.read(imgPath);
  const w = image.bitmap.width;

  for (const row of rows) {
    console.log(`\nAnalyzing ${row.name} (Y: ${row.yMin} to ${row.yMax}):`);
    const visited = new Set();
    const components = [];

    for (let y = row.yMin; y <= row.yMax; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (visited.has(idx)) continue;

        const dataIdx = idx * 4;
        const r = image.bitmap.data[dataIdx + 0];
        const g = image.bitmap.data[dataIdx + 1];
        const b = image.bitmap.data[dataIdx + 2];
        const a = image.bitmap.data[dataIdx + 3];

        if (!isBackground(r, g, b, a)) {
          // Found a new component, flood fill it
          const pixels = [];
          const queue = [{ x, y }];
          visited.add(idx);

          let minX = x, maxX = x, minY = y, maxY = y;

          while (queue.length > 0) {
            const curr = queue.shift();
            pixels.push(curr);

            if (curr.x < minX) minX = curr.x;
            if (curr.x > maxX) maxX = curr.x;
            if (curr.y < minY) minY = curr.y;
            if (curr.y > maxY) maxY = curr.y;

            // 8-way connectivity
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = curr.x + dx;
                const ny = curr.y + dy;

                if (nx >= 0 && nx < w && ny >= row.yMin && ny <= row.yMax) {
                  const nidx = ny * w + nx;
                  if (!visited.has(nidx)) {
                    const ndataIdx = nidx * 4;
                    const nr = image.bitmap.data[ndataIdx + 0];
                    const ng = image.bitmap.data[ndataIdx + 1];
                    const nb = image.bitmap.data[ndataIdx + 2];
                    const na = image.bitmap.data[ndataIdx + 3];

                    if (!isBackground(nr, ng, nb, na)) {
                      visited.add(nidx);
                      queue.push({ x: nx, y: ny });
                    }
                  }
                }
              }
            }
          }

          components.push({
            minX, maxX, minY, maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            pixelCount: pixels.length
          });
        }
      }
    }

    // Filter out tiny components (like noise or text labels if any bled in)
    let filtered = components.filter(c => c.pixelCount > 15);

    // Merge components that overlap or are extremely close to each other
    // because a character might have disjoint parts (like detached floating skulls/flames)
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < filtered.length; i++) {
        for (let j = i + 1; j < filtered.length; j++) {
          const c1 = filtered[i];
          const c2 = filtered[j];

          // Check horizontal and vertical distance
          const xOverlap = !(c1.maxX + 15 < c2.minX || c2.maxX + 15 < c1.minX);
          const yOverlap = !(c1.maxY + 15 < c2.minY || c2.maxY + 15 < c1.minY);

          if (xOverlap && yOverlap) {
            // Merge c2 into c1
            c1.minX = Math.min(c1.minX, c2.minX);
            c1.maxX = Math.max(c1.maxX, c2.maxX);
            c1.minY = Math.min(c1.minY, c2.minY);
            c1.maxY = Math.max(c1.maxY, c2.maxY);
            c1.width = c1.maxX - c1.minX + 1;
            c1.height = c1.maxY - c1.minY + 1;
            c1.pixelCount += c2.pixelCount;

            filtered.splice(j, 1);
            merged = true;
            break;
          }
        }
        if (merged) break;
      }
    }

    // Sort components from left to right (by minX)
    filtered.sort((a, b) => a.minX - b.minX);

    filtered.forEach((c, idx) => {
      console.log(`  Component ${idx}: X: [${c.minX}, ${c.maxX}] (w: ${c.width}), Y: [${c.minY}, ${c.maxY}] (h: ${c.height}), pixels: ${c.pixelCount}`);
    });
  }
}

main().catch(err => console.error(err));

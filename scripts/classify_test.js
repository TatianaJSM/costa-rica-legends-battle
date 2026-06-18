import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781431923076.jpg";

function isBackgroundPixel(r, g, b) {
  return r > 230 && g > 230 && b > 230 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12;
}

async function main() {
  const image = await Jimp.read(imgPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  const visited = Array(width * height).fill(false);
  const components = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x);
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
        if (pixelCount > 150 && w > 15 && h > 25) {
          components.push({ minX, minY, maxX, maxY, w, h, pixelCount });
        }
      }
    }
  }

  // Sort by Y center
  components.sort((a, b) => {
    const ay = (a.minY + a.maxY) / 2;
    const by = (b.minY + b.maxY) / 2;
    return ay - by;
  });

  // Group into rows
  const row1 = components.slice(0, 11).sort((a, b) => a.minX - b.minX);
  const row2 = components.slice(11, 20).sort((a, b) => a.minX - b.minX);
  const row3 = components.slice(20, 27).sort((a, b) => a.minX - b.minX);
  const row4 = components.slice(27, 36).sort((a, b) => a.minX - b.minX);

  console.log("--- Row 1 Classification ---");
  row1.slice(0, 3).forEach((c, i) => console.log(`IDLE ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));
  row1.slice(3, 8).forEach((c, i) => console.log(`WALK ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));
  row1.slice(8, 11).forEach((c, i) => console.log(`JUMP ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));

  console.log("--- Row 2 Classification ---");
  row2.slice(0, 3).forEach((c, i) => console.log(`CROUCH ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));
  row2.slice(3, 6).forEach((c, i) => console.log(`LIGHT_ATTACK ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));
  row2.slice(6, 9).forEach((c, i) => console.log(`SPECIAL_ATTACK ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));

  console.log("--- Row 3 Classification ---");
  row3.slice(0, 3).forEach((c, i) => console.log(`PROJECTILE_LAUNCH ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));
  console.log(`PROJECTILE_FX: X=${row3[3].minX}, Size=${row3[3].w}x${row3[3].h}`);
  row3.slice(4, 7).forEach((c, i) => console.log(`HURT ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));

  console.log("--- Row 4 Classification ---");
  row4.slice(0, 3).forEach((c, i) => console.log(`CRITICAL_HURT ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));
  row4.slice(3, 7).forEach((c, i) => console.log(`KNOCKDOWN ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));
  row4.slice(7, 9).forEach((c, i) => console.log(`VICTORY ${i+1}: X=${c.minX}, Size=${c.w}x${c.h}`));
}

main().catch(err => console.error(err));

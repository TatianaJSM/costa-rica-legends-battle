import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781431923076.jpg";
const outputBaseDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\segua";

function isBackgroundPixel(r, g, b) {
  return r > 230 && g > 230 && b > 230 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12;
}

function floodFillBackground(image) {
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

  while (queue.length > 0) {
    const curr = queue.shift();
    const idx = (curr.y * width + curr.x) * 4;
    const r = image.bitmap.data[idx + 0];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    const a = image.bitmap.data[idx + 3];

    // If it is checkerboard background, clear it to transparent
    if (isBackgroundPixel(r, g, b) && a > 0) {
      image.bitmap.data[idx + 0] = 0;
      image.bitmap.data[idx + 1] = 0;
      image.bitmap.data[idx + 2] = 0;
      image.bitmap.data[idx + 3] = 0;

      // Traverse 4-neighbors
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

  // Also clean up any loose background pixels (e.g. single pixels that got disconnected)
  image.scan(0, 0, width, height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    if (isBackgroundPixel(r, g, b)) {
      this.bitmap.data[idx + 3] = 0;
    }
  });
}

async function main() {
  const image = await Jimp.read(imgPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  const visited = Array(width * height).fill(false);
  const components = [];

  console.log(`Detecting components from sprite sheet...`);

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

  // Sort components by Y center
  components.sort((a, b) => {
    const ay = (a.minY + a.maxY) / 2;
    const by = (b.minY + b.maxY) / 2;
    return ay - by;
  });

  // Group row segments
  const row1 = components.slice(0, 11).sort((a, b) => a.minX - b.minX);
  const row2 = components.slice(11, 20).sort((a, b) => a.minX - b.minX);
  const row3 = components.slice(20, 27).sort((a, b) => a.minX - b.minX);
  const row4 = components.slice(27, 36).sort((a, b) => a.minX - b.minX);

  // Define target mappings: folder name -> array of component boxes
  const animationMappings = {
    "idle": [
      row1[0], // idle 1
      row1[1], // idle 2
      row1[2], // idle 3
      row1[1], // idle 4 (repeat idle 2 for a smooth loop)
    ],
    "walk": [
      row1[3],
      row1[4],
      row1[5],
      row1[6],
      row1[7]
    ],
    "jump": [
      row1[8],
      row1[9],
      row1[10]
    ],
    "attack": [
      row2[3],
      row2[4],
      row2[5]
    ],
    "special": [
      row2[6],
      row2[7],
      row2[8]
    ],
    "projectile": [
      row3[0],
      row3[1],
      row3[2]
    ],
    "hurt": [
      row3[4],
      row3[5],
      row3[6]
    ],
    "ko": [
      row4[3],
      row4[4],
      row4[5],
      row4[6]
    ],
    "victory": [
      row4[7],
      row4[8]
    ]
  };

  // Helper to process, clean, and write a crop component to destination
  async function saveCrop(c, destPath) {
    // Crop the region
    const cropped = image.clone().crop({ x: c.minX, y: c.minY, w: c.w, h: c.h });
    
    // Flood fill the checkerboard background to transparency
    floodFillBackground(cropped);

    // Save
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await cropped.write(destPath);
    console.log(`Saved transparent sprite to: ${destPath}`);
  }

  // 1. Process all animation directories
  for (const [folder, comps] of Object.entries(animationMappings)) {
    console.log(`Processing animation folder '${folder}'...`);
    for (let i = 0; i < comps.length; i++) {
      const idxStr = String(i + 1).padStart(2, '0');
      const destPath = path.join(outputBaseDir, folder, `${folder}_${idxStr}.png`);
      await saveCrop(comps[i], destPath);
    }
  }

  // 2. Process and save the single Projectile FX
  console.log("Saving projectile FX...");
  const projPath = path.join(outputBaseDir, "projectile.png");
  await saveCrop(row3[3], projPath);

  console.log("All sprites extracted and transparent backgrounds successfully processed!");
}

main().catch(err => console.error(err));

import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781474185777.png";
const outputBaseDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\padre";

function isBackgroundPixel(r, g, b) {
  // Pure white or very close to white
  return r > 245 && g > 245 && b > 245;
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

    if (isBackgroundPixel(r, g, b) && a > 0) {
      // Set to fully transparent
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

// Helper to crop to visible bounding box
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

// Map the animation groups to their exact row and column bounding boxes
const layouts = {
  idle: {
    yMin: 23, yMax: 128,
    cols: [[16, 83], [90, 155], [159, 220], [229, 288]]
  },
  walk: {
    yMin: 23, yMax: 128,
    cols: [
      [333, 407], [409, 479], [480, 551],
      [556, 626], [628, 695], [696, 768]
    ]
  },
  jump: {
    yMin: 23, yMax: 128,
    cols: [[780, 855], [862, 932], [933, 1002]]
  },
  attack: { // light attack
    yMin: 183, yMax: 267,
    cols: [[273, 364], [365, 462], [473, 571]]
  },
  heavy: {
    yMin: 183, yMax: 267,
    cols: [[620, 732], [734, 838], [840, 931]]
  },
  special: {
    yMin: 312, yMax: 406,
    cols: [[8, 97], [98, 182], [183, 262], [263, 334], [349, 407]]
  },
  hit: { // hurt
    yMin: 450, yMax: 540,
    cols: [[15, 82], [99, 160], [176, 244]]
  },
  ko: { // knockdown
    yMin: 450, yMax: 540,
    cols: [[287, 373], [389, 466], [500, 629]]
  },
  victory: {
    yMin: 450, yMax: 540,
    cols: [[709, 789], [803, 874]]
  }
};

// Projectile columns inside Row 3
const projectileCols = [
  [438, 502], [524, 596], [632, 668], [690, 731], [756, 806], [831, 895], [916, 1001]
];

async function main() {
  const image = await Jimp.read(imgPath);
  const metadata = {};

  // Extract regular animations
  for (const [folder, layout] of Object.entries(layouts)) {
    console.log(`Extracting '${folder}' (${layout.cols.length} frames)...`);
    const outputFolder = path.join(outputBaseDir, folder);
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    for (let i = 0; i < layout.cols.length; i++) {
      const [xMin, xMax] = layout.cols[i];
      const cw = xMax - xMin;
      const ch = layout.yMax - layout.yMin;

      const cropped = image.clone().crop({ x: xMin, y: layout.yMin, w: cw, h: ch });
      floodFillBackground(cropped);
      const tightlyCropped = autoCrop(cropped);

      // Save frame file
      const fileNum = String(i + 1).padStart(2, '0');
      const filename = `${folder}_${fileNum}.png`;
      const destPath = path.join(outputFolder, filename);
      await tightlyCropped.write(destPath);

      // Anchor detection: vertical bottom-center midpoint analysis of bottom 15%
      const tw = tightlyCropped.bitmap.width;
      const th = tightlyCropped.bitmap.height;
      let feetSumX = 0;
      let feetCount = 0;
      const scanStartY = Math.floor(th * 0.85);

      tightlyCropped.scan(0, scanStartY, tw, th - scanStartY, function(x, y, idx) {
        const a = this.bitmap.data[idx + 3];
        if (a > 0) {
          feetSumX += x;
          feetCount++;
        }
      });

      const feetX = feetCount > 0 ? feetSumX / feetCount : tw / 2;
      const offsetPct = (feetX - tw / 2) / tw;

      // Metadata mapping
      const metaKey = `${folder}/${folder}_${fileNum}.png`;
      metadata[metaKey] = {
        width: tw,
        height: th,
        feetX: parseFloat(feetX.toFixed(1)),
        offsetPct: parseFloat(offsetPct.toFixed(6))
      };
    }
  }

  // Extract Projectile frames
  console.log("Extracting projectile frames...");
  const projFolder = path.join(outputBaseDir, "projectile");
  if (!fs.existsSync(projFolder)) {
    fs.mkdirSync(projFolder, { recursive: true });
  }

  for (let i = 0; i < projectileCols.length; i++) {
    const [xMin, xMax] = projectileCols[i];
    const cw = xMax - xMin;
    const ch = 406 - 299;

    const cropped = image.clone().crop({ x: xMin, y: 299, w: cw, h: ch });
    floodFillBackground(cropped);
    const tightlyCropped = autoCrop(cropped);

    const fileNum = String(i + 1).padStart(2, '0');
    const destPath = path.join(projFolder, `projectile_${fileNum}.png`);
    await tightlyCropped.write(destPath);

    // Save metadata for projectile frames too, just in case
    const tw = tightlyCropped.bitmap.width;
    const th = tightlyCropped.bitmap.height;
    const metaKey = `projectile/projectile_${fileNum}.png`;
    metadata[metaKey] = {
      width: tw,
      height: th,
      feetX: tw / 2,
      offsetPct: 0.0
    };
  }

  // Also write the master static projectile.png
  console.log("Saving master projectile.png...");
  const finalProjPath = path.join(outputBaseDir, "projectile.png");
  // Frame 7 of projectile (the largest, most awesome flying skull)
  const [xMin, xMax] = projectileCols[6];
  const cropped = image.clone().crop({ x: xMin, y: 299, w: xMax - xMin, h: 406 - 299 });
  floodFillBackground(cropped);
  const tightlyCropped = autoCrop(cropped);
  await tightlyCropped.write(finalProjPath);

  // Write metadata file
  const metaPath = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\data\\padreMetadata.json";
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  console.log(`Saved metadata to: ${metaPath}`);

  console.log("Finished extracting all El Padre Sin Cabeza frames successfully!");
}

main().catch(console.error);

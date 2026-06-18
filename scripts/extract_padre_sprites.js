import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781433326077.jpg";
const outputBaseDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\padre";

function isBackgroundPixel(r, g, b) {
  // background is hex #141414
  return r < 26 && g < 26 && b < 26;
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

  // Also clean up any loose background pixels
  image.scan(0, 0, width, height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    if (isBackgroundPixel(r, g, b)) {
      this.bitmap.data[idx + 3] = 0;
    }
  });
}

// Bounding definitions: [xMin, xMax]
const layouts = {
  idle: {
    yMin: 14, yMax: 122,
    cols: [[10, 75], [78, 145], [148, 215], [218, 282]]
  },
  walk: {
    yMin: 14, yMax: 122,
    cols: [[295, 368], [368, 430], [430, 492], [492, 558], [558, 628]]
  },
  jump: {
    yMin: 14, yMax: 122,
    cols: [[660, 747], [749, 832], [842, 924]]
  },
  crouch: {
    yMin: 178, yMax: 277,
    cols: [[10, 83], [84, 154], [155, 230]]
  },
  attack: {
    yMin: 178, yMax: 277,
    cols: [[245, 340], [341, 420], [421, 500], [501, 620]]
  },
  heavy: {
    yMin: 178, yMax: 277,
    cols: [[630, 700], [701, 785], [786, 890], [891, 1000]]
  },
  hit: {
    yMin: 326, yMax: 426,
    cols: [[568, 638], [641, 725], [726, 810], [811, 895], [896, 988]]
  },
  ko: {
    yMin: 470, yMax: 563,
    cols: [[300, 390], [391, 480], [481, 575], [576, 720]]
  },
  victory: {
    yMin: 470, yMax: 563,
    cols: [[740, 835], [840, 960]]
  },
  special: {
    yMin: 574, yMax: 675,
    cols: [[365, 450], [451, 530], [531, 640], [641, 730], [731, 830], [831, 980]]
  }
};

async function main() {
  const image = await Jimp.read(imgPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  // Process animations
  for (const [folder, layout] of Object.entries(layouts)) {
    console.log(`Processing '${folder}'...`);
    for (let i = 0; i < layout.cols.length; i++) {
      const [xMin, xMax] = layout.cols[i];
      const cw = xMax - xMin + 1;
      const ch = layout.yMax - layout.yMin + 1;

      // Crop
      const cropped = image.clone().crop({ x: xMin, y: layout.yMin, w: cw, h: ch });
      
      // Clear background to transparent
      floodFillBackground(cropped);

      // Save
      const fileNum = String(i + 1).padStart(2, '0');
      const destPath = path.join(outputBaseDir, folder, `${folder}_${fileNum}.png`);
      
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await cropped.write(destPath);
      console.log(`Saved: ${destPath}`);
    }
  }

  // Process projectile skull
  console.log("Saving projectile skull...");
  const projCrop = image.clone().crop({ x: 195, y: 574, w: 345 - 195 + 1, h: 675 - 574 + 1 });
  floodFillBackground(projCrop);
  const destProj = path.join(outputBaseDir, "projectile.png");
  await projCrop.write(destProj);
  console.log(`Saved projectile to: ${destProj}`);

  console.log("Padre Sin Cabeza sprites extracted successfully!");
}

main().catch(err => console.error(err));

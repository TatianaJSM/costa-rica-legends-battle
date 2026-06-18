import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781742708882.jpg";
const outputDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\ui\\portraits";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Color matching helpers
function isSeguaBg(r, g, b) {
  // Segua background is dark brown/black. It gets brighter in the middle, but edges are very dark.
  // We can also check if the pixel is part of the background gradient.
  // Let's use a threshold on brightness and color balance.
  const brightness = (r + g + b) / 3;
  // Segua's dress is white/gold, her skull is light, her skin is warm light brown.
  // The background is dark brown/black.
  return brightness < 45 && r > g && g >= b;
}

function isCadejoBg(r, g, b) {
  // Cadejo background is dark blue/black.
  const brightness = (r + g + b) / 3;
  // Cadejo is a black wolf with bright blue flames.
  // The background is very dark at the edges, but has blue aura.
  return brightness < 20 || (brightness < 60 && b > r && b > g);
}

function isPadreBg(r, g, b) {
  // Padre background is dark gray/black textured smoke.
  const brightness = (r + g + b) / 3;
  return brightness < 30;
}

function floodFillBg(image, checkFn) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const visited = Array(w * h).fill(false);
  const queue = [];

  // Start from borders
  for (let x = 0; x < w; x++) {
    queue.push({ x, y: 0 });
    queue.push({ x, y: h - 1 });
    visited[0 * w + x] = true;
    visited[(h - 1) * w + x] = true;
  }
  for (let y = 1; y < h - 1; y++) {
    queue.push({ x: 0, y });
    queue.push({ x: w - 1, y });
    visited[y * w + 0] = true;
    visited[y * w + (w - 1)] = true;
  }

  while (queue.length > 0) {
    const curr = queue.shift();
    const idx = (curr.y * w + curr.x) * 4;
    const r = image.bitmap.data[idx + 0];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    const a = image.bitmap.data[idx + 3];

    if (a > 0 && checkFn(r, g, b)) {
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
        if (n.x >= 0 && n.x < w && n.y >= 0 && n.y < h) {
          const nIdx = n.y * w + n.x;
          if (!visited[nIdx]) {
            visited[nIdx] = true;
            queue.push(n);
          }
        }
      }
    }
  }
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

// Center the cropped character inside a standard canvas size (e.g. 300x400)
// filling approximately 80% to 90% of the canvas height
async function makePortrait(charImage, destPath, targetW = 300, targetH = 400) {
  const cropped = autoCrop(charImage);
  const cw = cropped.bitmap.width;
  const ch = cropped.bitmap.height;

  // We want the character to fill 85% of targetH
  const scale = (targetH * 0.85) / ch;
  const newW = Math.round(cw * scale);
  const newH = Math.round(ch * scale);

  const resized = cropped.clone().resize({ w: newW, h: newH });

  // Create a blank transparent canvas
  const canvas = new Jimp({ width: targetW, height: targetH, color: 0x00000000 });

  // Blit the resized character centered on the canvas
  const px = Math.round((targetW - newW) / 2);
  const py = Math.round((targetH - newH) / 2);

  canvas.composite(resized, px, py);
  await canvas.write(destPath);
  console.log(`Saved portrait: ${destPath} (scaled by ${scale.toFixed(2)})`);
}

async function main() {
  const image = await Jimp.read(imgPath);

  // Crop panels (excluding bottom text labels which start at Y ~ 650)
  // X-ranges: Segua [15, 325], Cadejo [350, 670], Padre [695, 1005]
  // Y-range: [15, 630]
  const yMin = 15;
  const yMax = 630;
  const panelH = yMax - yMin;

  console.log("Extracting Segua...");
  const seguaPanel = image.clone().crop({ x: 15, y: yMin, w: 310, h: panelH });
  floodFillBg(seguaPanel, isSeguaBg);
  await makePortrait(seguaPanel, path.join(outputDir, "segua_portrait.png"));

  console.log("Extracting Cadejo...");
  const cadejoPanel = image.clone().crop({ x: 350, y: yMin, w: 320, h: panelH });
  floodFillBg(cadejoPanel, isCadejoBg);
  await makePortrait(cadejoPanel, path.join(outputDir, "cadejo_portrait.png"));

  console.log("Extracting Padre...");
  const padrePanel = image.clone().crop({ x: 695, y: yMin, w: 310, h: panelH });
  floodFillBg(padrePanel, isPadreBg);
  await makePortrait(padrePanel, path.join(outputDir, "padre_portrait.png"));

  console.log("Done!");
}

main().catch(console.error);

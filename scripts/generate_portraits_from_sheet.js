import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781742708882.jpg";
const outputDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\ui\\portraits";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function extractPanel(x, y, w, h, filename, targetW = 300, targetH = 400) {
  console.log(`Extracting panel for ${filename} at X: ${x}, Y: ${y}, W: ${w}, H: ${h}...`);
  const image = await Jimp.read(imgPath);
  const cropped = image.clone().crop({ x, y, w, h });

  // Scale to fit 90% of the target height (360px) to keep them large and filling 80-90% of area
  const scale = (targetH * 0.90) / h;
  const newW = Math.round(w * scale);
  const newH = Math.round(h * scale);

  const resized = cropped.clone().resize({ w: newW, h: newH });

  // Create canvas (use a solid dark background or transparent - let's use transparent so it merges nicely with UI)
  const canvas = new Jimp({ width: targetW, height: targetH, color: 0x00000000 });

  // Blit centered
  const px = Math.round((targetW - newW) / 2);
  const py = Math.round((targetH - newH) / 2);
  canvas.composite(resized, px, py);

  const destPath = path.join(outputDir, filename);
  await canvas.write(destPath);
  console.log(`Saved portrait: ${destPath} (W: ${newW}, H: ${newH})`);
}

async function main() {
  // Crop coordinates:
  // Segua: X [15, 325] (w: 310), Y [15, 630] (h: 615)
  // Cadejo: X [350, 670] (w: 320), Y [15, 630] (h: 615)
  // Padre: X [695, 1005] (w: 310), Y [15, 630] (h: 615)
  const yMin = 15;
  const yMax = 630;
  const h = yMax - yMin;

  await extractPanel(15, yMin, 310, h, "segua_portrait.png");
  await extractPanel(350, yMin, 320, h, "cadejo_portrait.png");
  await extractPanel(695, yMin, 310, h, "padre_portrait.png");
  console.log("Portraits extracted from panel sheet successfully!");
}

main().catch(console.error);

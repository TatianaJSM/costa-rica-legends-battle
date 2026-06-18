import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const seguaSource = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\segua.png";
const cadejoSource = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\cadejos.png";
const padreSource = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\padre-sin-cabeza.png";

const outputDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\ui\\portraits";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function autoCropIgnoreWatermark(image, ignoreRightX = 0, ignoreBottomY = 0) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let hasPixels = false;

  image.scan(0, 0, w, h, function(x, y, idx) {
    // If the pixel is in the bottom-right watermark zone, ignore it
    if (ignoreRightX > 0 && ignoreBottomY > 0) {
      if (x >= w - ignoreRightX && y >= h - ignoreBottomY) {
        return;
      }
    }

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

async function makePortrait(sourcePath, filename, ignoreRightX = 0, ignoreBottomY = 0, targetW = 300, targetH = 400) {
  console.log(`Processing: ${sourcePath}`);
  const image = await Jimp.read(sourcePath);
  
  // Crop character ignoring watermarks
  const cropped = autoCropIgnoreWatermark(image, ignoreRightX, ignoreBottomY);
  const cw = cropped.bitmap.width;
  const ch = cropped.bitmap.height;

  // Scale to fit 85% of target height (340px)
  const scale = (targetH * 0.85) / ch;
  const newW = Math.round(cw * scale);
  const newH = Math.round(ch * scale);

  const resized = cropped.clone().resize({ w: newW, h: newH });

  // Create empty transparent canvas
  const canvas = new Jimp({ width: targetW, height: targetH, color: 0x00000000 });

  // Composite centered
  const px = Math.round((targetW - newW) / 2);
  const py = Math.round((targetH - newH) / 2);
  canvas.composite(resized, px, py);

  const destPath = path.join(outputDir, filename);
  await canvas.write(destPath);
  console.log(`Saved clean portrait: ${destPath} (W: ${newW}, H: ${newH})`);
}

async function main() {
  // Segua has a watermark in the bottom-right corner. Ignore bottom 100px and right 100px.
  await makePortrait(seguaSource, "segua_portrait.png", 100, 100);
  
  // Cadejo has no watermark, but let's be safe
  await makePortrait(cadejoSource, "cadejo_portrait.png", 0, 0);
  
  // Padre has a watermark in the bottom-right corner. Ignore bottom 100px and right 100px.
  await makePortrait(padreSource, "padre_portrait.png", 100, 100);
  
  console.log("Dedicated roster portraits created successfully!");
}

main().catch(console.error);

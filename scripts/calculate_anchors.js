import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const baseDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\segua";

async function processDir(dir, metadata) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDir(fullPath, metadata);
    } else if (entry.name.endsWith('.png') && entry.name !== 'projectile.png') {
      try {
        const img = await Jimp.read(fullPath);
        const w = img.bitmap.width;
        const h = img.bitmap.height;

        // Find tight bounding box of visible pixels (alpha > 0)
        let minX = w, maxX = 0, minY = h, maxY = 0;
        let count = 0;
        img.scan(0, 0, w, h, (x, y, idx) => {
          if (img.bitmap.data[idx + 3] > 0) {
            count++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        });

        if (count === 0) continue;

        // Crop image to tight visible bounds if it isn't already cropped
        let croppedImg = img;
        let finalW = w;
        let finalH = h;
        if (minX > 0 || maxX < w - 1 || minY > 0 || maxY < h - 1) {
          croppedImg = img.clone().crop({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
          finalW = croppedImg.bitmap.width;
          finalH = croppedImg.bitmap.height;
          await croppedImg.write(fullPath);
          console.log(`Auto-cropped padding for ${path.relative(baseDir, fullPath)}: New size ${finalW}x${finalH}`);
        }

        // Now find feet horizontal position on the cropped image
        // We look at the bottom 15% of the image height
        const startY = Math.floor(finalH * 0.85);
        let minFeetX = finalW;
        let maxFeetX = 0;
        let feetPixelCount = 0;

        croppedImg.scan(0, startY, finalW, finalH - startY, (x, y, idx) => {
          if (croppedImg.bitmap.data[idx + 3] > 0) {
            feetPixelCount++;
            if (x < minFeetX) minFeetX = x;
            if (x > maxFeetX) maxFeetX = x;
          }
        });

        // Fallback to full width if no feet pixels found
        if (feetPixelCount === 0) {
          minFeetX = 0;
          maxFeetX = finalW - 1;
        }

        const feetX = (minFeetX + maxFeetX) / 2;
        // The offset as a percentage of cropped image width
        const relativeOffset = (feetX / finalW) - 0.5;

        // Relative path to use as key
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        metadata[relPath] = {
          width: finalW,
          height: finalH,
          feetX: feetX,
          offsetPct: relativeOffset,
          // Bounding box relative to cropped image (for collision boxes)
          // Since it's tightly cropped, bounding box of visible pixels is the entire cropped image [0, 0, finalW, finalH]
          collisionBox: {
            left: 0,
            top: 0,
            right: finalW,
            bottom: finalH
          }
        };
      } catch (err) {
        console.error(`Error processing ${fullPath}:`, err);
      }
    }
  }
}

async function main() {
  const metadata = {};
  await processDir(baseDir, metadata);
  const metadataPath = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\data\\seguaMetadata.json";
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`Saved anchor metadata for ${Object.keys(metadata).length} sprites to ${metadataPath}`);
}

main().catch(err => console.error(err));

import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const baseDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\segua";

async function checkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await checkDir(fullPath);
    } else if (entry.name.endsWith('.png') && entry.name !== 'projectile.png') {
      try {
        const img = await Jimp.read(fullPath);
        const w = img.bitmap.width;
        const h = img.bitmap.height;
        let minX = w, maxX = 0, minY = h, maxY = 0;
        let nonTransparentCount = 0;

        img.scan(0, 0, w, h, (x, y, idx) => {
          if (img.bitmap.data[idx + 3] > 0) {
            nonTransparentCount++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        });

        if (nonTransparentCount === 0) {
          console.log(`${path.relative(baseDir, fullPath)}: EMPTY!`);
        } else {
          const padLeft = minX;
          const padRight = w - 1 - maxX;
          const padTop = minY;
          const padBottom = h - 1 - maxY;
          if (padLeft > 0 || padRight > 0 || padTop > 0 || padBottom > 0) {
            console.log(`${path.relative(baseDir, fullPath)}: Dimensions ${w}x${h}. Bounding Box: [${minX}, ${minY}, ${maxX}, ${maxY}] (Padding L:${padLeft} R:${padRight} T:${padTop} B:${padBottom})`);
          }
        }
      } catch (err) {
        console.error(`Error reading ${fullPath}:`, err);
      }
    }
  }
}

checkDir(baseDir).then(() => console.log("Done checking sprites."));

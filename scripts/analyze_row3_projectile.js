import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781474185777.png";

function isBackgroundPixel(r, g, b) {
  return r > 245 && g > 245 && b > 245;
}

async function main() {
  const image = await Jimp.read(imgPath);
  const w = image.bitmap.width;
  const yMin = 299;
  const yMax = 406;
  const rh = yMax - yMin + 1;

  console.log("--- ROW 3 PROJECTILE COLUMNS 430 to 1024 ---");
  for (let x = 430; x < w; x++) {
    let nonBg = 0;
    for (let y = yMin; y <= yMax; y++) {
      const idx = (y * w + x) * 4;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      const a = image.bitmap.data[idx + 3];
      if (a > 0 && !isBackgroundPixel(r, g, b)) {
        nonBg++;
      }
    }
    if (nonBg === 0) {
      console.log(`X = ${x}: GAP (0 pixels)`);
    } else {
      if (x % 10 === 0 || nonBg < 10) {
        console.log(`X = ${x}: ${nonBg} pixels`);
      }
    }
  }
}

main().catch(err => console.error(err));

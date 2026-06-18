import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781433326077.jpg";

function isBackgroundPixel(r, g, b) {
  return r < 28 && g < 28 && b < 28;
}

async function main() {
  const image = await Jimp.read(imgPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  // Calculate row densities (percentage of non-background pixels)
  const densities = Array(h).fill(0);
  for (let y = 0; y < h; y++) {
    let nonBgCount = 0;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      if (!isBackgroundPixel(r, g, b)) {
        nonBgCount++;
      }
    }
    densities[y] = nonBgCount / w;
  }

  // Print segments of Y coordinates where density is > 0
  let inRow = false;
  let startY = 0;
  console.log("Detecting row boundaries based on horizontal projection:");
  for (let y = 0; y < h; y++) {
    const isRowPixel = densities[y] > 0.005; // 0.5% threshold
    if (!inRow && isRowPixel) {
      inRow = true;
      startY = y;
    } else if (inRow && !isRowPixel) {
      inRow = false;
      console.log(`Row: Y-range [${startY}, ${y - 1}], height = ${y - startY}`);
    }
  }
  if (inRow) {
    console.log(`Row: Y-range [${startY}, ${h - 1}], height = ${h - startY}`);
  }
}

main().catch(err => console.error(err));

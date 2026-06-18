import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781750210599.jpg";

function isCharacterPixel(r, g, b) {
  // If not white background (which is close to 255, 255, 255)
  return r < 240 || g < 240 || b < 240;
}

async function main() {
  const image = await Jimp.read(imgPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  console.log(`Dimensions: ${w}x${h}`);
  
  const rowActivity = [];
  for (let y = 0; y < h; y++) {
    let charPixelCount = 0;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      if (isCharacterPixel(r, g, b)) {
        charPixelCount++;
      }
    }
    rowActivity.push({ y, charPixelCount });
  }

  // Find continuous bands of rows with character pixels
  let inBand = false;
  let bandStart = 0;
  const bands = [];
  for (let y = 0; y < h; y++) {
    const hasPixels = rowActivity[y].charPixelCount > 8; // threshold
    if (hasPixels && !inBand) {
      inBand = true;
      bandStart = y;
    } else if (!hasPixels && inBand) {
      inBand = false;
      bands.push({ yMin: bandStart, yMax: y - 1 });
    }
  }
  if (inBand) {
    bands.push({ yMin: bandStart, yMax: h - 1 });
  }

  console.log("\nDetected Row Bands:");
  bands.forEach((band, idx) => {
    console.log(`  Band ${idx + 1}: Y = [${band.yMin}, ${band.yMax}] (height: ${band.yMax - band.yMin + 1}px)`);
  });

  // For each band, find column activities
  for (let bIdx = 0; bIdx < bands.length; bIdx++) {
    const band = bands[bIdx];
    const cols = [];
    let inCol = false;
    let startX = 0;
    
    for (let x = 0; x < w; x++) {
      let count = 0;
      for (let y = band.yMin; y <= band.yMax; y++) {
        const idx = (y * w + x) * 4;
        const r = image.bitmap.data[idx + 0];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        if (isCharacterPixel(r, g, b)) {
          count++;
        }
      }
      const isColActive = count >= 1;
      if (!inCol && isColActive) {
        inCol = true;
        startX = x;
      } else if (inCol && !isColActive) {
        inCol = false;
        cols.push([startX, x - 1]);
      }
    }
    if (inCol) {
      cols.push([startX, w - 1]);
    }
    
    console.log(`\n--- Band ${bIdx + 1} Columns (Y: ${band.yMin} to ${band.yMax}) ---`);
    cols.forEach((col, cIdx) => {
      const colW = col[1] - col[0] + 1;
      console.log(`  Col ${cIdx + 1}: X = [${col[0]}, ${col[1]}] (width: ${colW}px)`);
    });
  }
}

main().catch(console.error);

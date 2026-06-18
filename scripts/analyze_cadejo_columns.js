import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";

function getColumnsInBand(image, yMin, yMax) {
  const w = image.bitmap.width;
  const cols = [];
  let inCol = false;
  let startX = 0;
  
  // Count non-bg pixels for each X in the vertical range [yMin, yMax]
  for (let x = 0; x < w; x++) {
    let nonBgCount = 0;
    for (let y = yMin; y <= yMax; y++) {
      const idx = (y * w + x) * 4;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      if (r >= 25 || g >= 25 || b >= 25) {
        nonBgCount++;
      }
    }
    
    // We consider X as part of a sprite if it has at least 1 non-bg pixel
    const isColPixel = nonBgCount >= 1;
    
    if (!inCol && isColPixel) {
      inCol = true;
      startX = x;
    } else if (inCol && !isColPixel) {
      inCol = false;
      cols.push([startX, x - 1]);
    }
  }
  if (inCol) {
    cols.push([startX, w - 1]);
  }
  return cols;
}

async function main() {
  const image = await Jimp.read(imgPath);
  
  const bands = [
    { name: "Row 1 (Idle / Walk / Jump)", yMin: 28, yMax: 123 },
    { name: "Row 2 (Attacks / Special)", yMin: 186, yMax: 269 },
    { name: "Row 3 (Projectile / Hurt / KD)", yMin: 346, yMax: 439 },
    { name: "Row 4 (Victory / Block / Get Up)", yMin: 486, yMax: 631 }
  ];
  
  for (const band of bands) {
    console.log(`\n--- ${band.name} Y: ${band.yMin} to ${band.yMax} ---`);
    const cols = getColumnsInBand(image, band.yMin, band.yMax);
    console.log(`Detected ${cols.length} columns:`);
    cols.forEach((col, idx) => {
      const w = col[1] - col[0] + 1;
      console.log(`  Col ${idx + 1}: X = [${col[0]}, ${col[1]}] (width: ${w}px)`);
    });
  }
}

main().catch(console.error);

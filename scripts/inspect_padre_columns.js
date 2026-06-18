import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781433326077.jpg";

function isBackgroundPixel(r, g, b) {
  return r < 28 && g < 28 && b < 28;
}

const rows = [
  { name: "Row 1 (Idle, Walk, Jump)", yMin: 14, yMax: 122 },
  { name: "Row 2 (Crouch, Claws, Scream)", yMin: 178, yMax: 277 },
  { name: "Row 3 (Projectile, Hit)", yMin: 326, yMax: 426 },
  { name: "Row 4 (Critical, Fall, Victory)", yMin: 470, yMax: 563 },
  { name: "Row 5 (Bottom Details)", yMin: 574, yMax: 675 }
];

async function main() {
  const image = await Jimp.read(imgPath);
  const w = image.bitmap.width;

  for (const row of rows) {
    console.log(`\nAnalyzing ${row.name} (Y: ${row.yMin} to ${row.yMax}):`);
    
    // Calculate vertical density for this row
    const densities = Array(w).fill(0);
    const rh = row.yMax - row.yMin + 1;
    for (let x = 0; x < w; x++) {
      let nonBgCount = 0;
      for (let y = row.yMin; y <= row.yMax; y++) {
        const idx = (y * w + x) * 4;
        const r = image.bitmap.data[idx + 0];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        if (!isBackgroundPixel(r, g, b)) {
          nonBgCount++;
        }
      }
      densities[x] = nonBgCount / rh;
    }

    // Detect columns
    let inCol = false;
    let startX = 0;
    let colIdx = 0;
    for (let x = 0; x < w; x++) {
      const isColPixel = densities[x] > 0.01; // 1% density threshold
      if (!inCol && isColPixel) {
        inCol = true;
        startX = x;
      } else if (inCol && !isColPixel) {
        inCol = false;
        console.log(`  Col ${colIdx++}: X-range [${startX}, ${x - 1}], width = ${x - startX}`);
      }
    }
    if (inCol) {
      console.log(`  Col ${colIdx++}: X-range [${startX}, ${w - 1}], width = ${w - startX}`);
    }
  }
}

main().catch(err => console.error(err));

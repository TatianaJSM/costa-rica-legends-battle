import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781474185777.png";

function isBackgroundPixel(r, g, b) {
  return r > 245 && g > 245 && b > 245;
}

const rows = [
  { name: "Row 1 (Idle, Walk, Jump)", yMin: 7, yMax: 128 },
  { name: "Row 2 (Crouch, Light, Heavy)", yMin: 168, yMax: 267 },
  { name: "Row 3 (Special Attack, Projectile)", yMin: 299, yMax: 406 },
  { name: "Row 4 (Hurt, Knockdown, Victory)", yMin: 437, yMax: 540 },
  { name: "Row 5 (Projectile Impact)", yMin: 550, yMax: 668 }
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
        const a = image.bitmap.data[idx + 3];
        if (a > 0 && !isBackgroundPixel(r, g, b)) {
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
      const isColPixel = densities[x] > 0.005; // 0.5% density threshold
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

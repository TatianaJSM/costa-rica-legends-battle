import { Jimp } from 'jimp';

async function main() {
  const file = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";
  const image = await Jimp.read(file);
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  // Calculate average brightness for each row (y)
  const rowBrightness = [];
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      sum += (r + g + b) / 3;
    }
    rowBrightness.push({ y, avg: sum / w });
  }
  
  // Print rows with very low average brightness (likely row gaps)
  // Let's print out areas where avg < 5 (assuming black background is < 5)
  console.log("Analyzing dark horizontal bands (potential row gaps):");
  let inGap = false;
  let gapStart = 0;
  for (let y = 0; y < h; y++) {
    const isDark = rowBrightness[y].avg < 3.0; // threshhold
    if (isDark && !inGap) {
      inGap = true;
      gapStart = y;
    } else if (!isDark && inGap) {
      inGap = false;
      console.log(`Gap from Y: ${gapStart} to ${y - 1} (average brightness ~ ${rowBrightness[gapStart].avg.toFixed(2)})`);
    }
  }
  if (inGap) {
    console.log(`Gap from Y: ${gapStart} to ${h - 1}`);
  }
}

main().catch(console.error);

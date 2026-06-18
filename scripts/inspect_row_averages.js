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
    rowBrightness.push(sum / w);
  }

  // Print averages at every 10 lines
  for (let y = 0; y < h; y += 10) {
    console.log(`Y: ${String(y).padStart(3, ' ')} -> Avg: ${rowBrightness[y].toFixed(2)}`);
  }
}

main().catch(console.error);

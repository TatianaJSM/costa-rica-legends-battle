import { Jimp } from 'jimp';

async function main() {
  const file = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";
  const image = await Jimp.read(file);
  const w = image.bitmap.width;
  const yMin = 20, yMax = 135;
  
  for (let x = 700; x < w; x++) {
    let sum = 0;
    for (let y = yMin; y < yMax; y++) {
      const idx = (y * w + x) * 4;
      sum += (image.bitmap.data[idx+0] + image.bitmap.data[idx+1] + image.bitmap.data[idx+2]) / 3;
    }
    const avg = sum / (yMax - yMin);
    console.log(`X: ${x} -> Avg: ${avg.toFixed(2)}`);
  }
}

main().catch(console.error);

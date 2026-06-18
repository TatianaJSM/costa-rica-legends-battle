import { Jimp } from 'jimp';

async function main() {
  const file = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\row1_right.png";
  const image = await Jimp.read(file);
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  const colAvg = [];
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = 0; y < h; y++) {
      const idx = (y * w + x) * 4;
      sum += (image.bitmap.data[idx+0] + image.bitmap.data[idx+1] + image.bitmap.data[idx+2]) / 3;
    }
    colAvg.push(sum / h);
  }
  
  let inSprite = false;
  let startX = 0;
  console.log("Visible elements inside row1_right.png (relative to original X: 730):");
  for (let x = 0; x < w; x++) {
    const isBright = colAvg[x] > 10.4;
    if (isBright && !inSprite) {
      inSprite = true;
      startX = x;
    } else if (!isBright && inSprite) {
      inSprite = false;
      console.log(`  Element: [${startX + 730}, ${x - 1 + 730}] (width: ${x - startX}px)`);
    }
  }
  if (inSprite) {
    console.log(`  Element: [${startX + 730}, ${w - 1 + 730}]`);
  }
}

main().catch(console.error);

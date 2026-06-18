import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";

async function main() {
  const image = await Jimp.read(imgPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  console.log(`Dimensions: ${w}x${h}`);
  
  const rowBrightness = [];
  for (let y = 0; y < h; y++) {
    let nonBgCount = 0;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      // Background is black. Let's count pixels that are not black (r >= 25 or g >= 25 or b >= 25)
      if (r >= 25 || g >= 25 || b >= 25) {
        nonBgCount++;
      }
    }
    rowBrightness.push({ y, nonBgCount });
  }

  // Find continuous bands of rows with non-bg pixels
  let inBand = false;
  let bandStart = 0;
  for (let y = 0; y < h; y++) {
    const hasPixels = rowBrightness[y].nonBgCount > 10; // threshold of 10 pixels in a row
    if (hasPixels && !inBand) {
      inBand = true;
      bandStart = y;
    } else if (!hasPixels && inBand) {
      inBand = false;
      console.log(`Row band: Y = ${bandStart} to ${y - 1} (${y - bandStart}px height)`);
    }
  }
  if (inBand) {
    console.log(`Row band: Y = ${bandStart} to ${h - 1}`);
  }
}

main().catch(console.error);

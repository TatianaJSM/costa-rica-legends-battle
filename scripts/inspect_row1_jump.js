import { Jimp } from 'jimp';

async function main() {
  const file = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";
  const image = await Jimp.read(file);
  const w = image.bitmap.width;
  
  // Scan X: 800 to 1024, Y: 0 to 180
  console.log("Scanning top-right region for character pixels:");
  const threshold = 10.4;
  
  // Let's divide into grid of 5x5 pixels and print if any pixel is bright
  for (let y = 0; y < 170; y += 8) {
    let rowStr = "";
    for (let x = 800; x < w; x += 8) {
      let maxVal = 0;
      for (let dy = 0; dy < 8; dy++) {
        for (let dx = 0; dx < 8; dx++) {
          if (x + dx < w && y + dy < 170) {
            const idx = ((y + dy) * w + (x + dx)) * 4;
            const val = (image.bitmap.data[idx+0] + image.bitmap.data[idx+1] + image.bitmap.data[idx+2]) / 3;
            if (val > maxVal) maxVal = val;
          }
        }
      }
      rowStr += maxVal > 11.0 ? "#" : ".";
    }
    console.log(`Y: ${String(y).padStart(3, ' ')}: ${rowStr}`);
  }
}

main().catch(console.error);

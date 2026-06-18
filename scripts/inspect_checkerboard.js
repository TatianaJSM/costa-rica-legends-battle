import { Jimp } from 'jimp';

const imgPath1 = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781475185374.png";

async function main() {
  const image = await Jimp.read(imgPath1);
  console.log("Top-left 20x20 pixels:");
  for (let y = 0; y < 20; y++) {
    let rowStr = "";
    for (let x = 0; x < 20; x++) {
      const idx = (y * image.bitmap.width + x) * 4;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      // Represent color as a single character
      const avg = (r + g + b) / 3;
      if (avg < 140) {
        rowStr += "D"; // Dark square
      } else {
        rowStr += "L"; // Light square
      }
    }
    console.log(rowStr);
  }
}

main().catch(console.error);

import { Jimp } from 'jimp';
import path from 'path';

async function main() {
  const file = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";
  const image = await Jimp.read(file);
  const w = image.bitmap.width;
  
  // Crop the right side of Row 1 (X: 730 to 1024, Y: 15 to 135)
  const cropped = image.clone().crop({ x: 730, y: 15, w: w - 730, h: 120 });
  
  const dest = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\row1_right.png";
  await cropped.write(dest);
  console.log(`Saved row1_right.png to: ${dest}`);
}

main().catch(console.error);

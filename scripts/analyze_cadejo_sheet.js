import { Jimp } from 'jimp';

async function main() {
  const file = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";
  const image = await Jimp.read(file);
  console.log(`Image dimensions: ${image.bitmap.width}x${image.bitmap.height}`);
}

main().catch(console.error);

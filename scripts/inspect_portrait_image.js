import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781742708882.jpg";

async function main() {
  const image = await Jimp.read(imgPath);
  console.log(`Dimensions: ${image.bitmap.width}x${image.bitmap.height}`);
}

main().catch(console.error);

import { Jimp } from 'jimp';

const imgPath1 = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781475185374.png";
const imgPath2 = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781475206059.png";

async function inspect(filePath, label) {
  const image = await Jimp.read(filePath);
  console.log(`\n--- ${label} ---`);
  console.log(`Dimensions: ${image.bitmap.width}x${image.bitmap.height}`);
  
  // Inspect corners
  const corners = [
    { x: 0, y: 0 },
    { x: image.bitmap.width - 1, y: 0 },
    { x: 0, y: image.bitmap.height - 1 },
    { x: image.bitmap.width - 1, y: image.bitmap.height - 1 }
  ];
  
  corners.forEach((c, idx) => {
    const pixelIdx = (c.y * image.bitmap.width + c.x) * 4;
    const r = image.bitmap.data[pixelIdx + 0];
    const g = image.bitmap.data[pixelIdx + 1];
    const b = image.bitmap.data[pixelIdx + 2];
    const a = image.bitmap.data[pixelIdx + 3];
    console.log(`Corner ${idx} (${c.x}, ${c.y}): RGBA(${r}, ${g}, ${b}, ${a})`);
  });
}

async function main() {
  await inspect(imgPath1, "Image 1 (media__1781475185374.png)");
  await inspect(imgPath2, "Image 2 (media__1781475206059.png)");
}

main().catch(console.error);

import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781742708882.jpg";

async function main() {
  const image = await Jimp.read(imgPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  // Let's print background color samples for each panel
  // Segua panel is around X: 100, Y: 100
  // Cadejo panel is around X: 500, Y: 100
  // Padre panel is around X: 850, Y: 100
  
  function getSample(x, y, label) {
    const idx = (y * w + x) * 4;
    const r = image.bitmap.data[idx + 0];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    console.log(`${label} at (${x}, ${y}): RGB(${r}, ${g}, ${b})`);
  }

  console.log("--- Background Samples ---");
  getSample(40, 40, "Segua top-left background");
  getSample(300, 40, "Segua top-right background");
  getSample(40, 300, "Segua mid-left background");
  
  getSample(380, 40, "Cadejo top-left background");
  getSample(640, 40, "Cadejo top-right background");
  getSample(380, 300, "Cadejo mid-left background");

  getSample(720, 40, "Padre top-left background");
  getSample(980, 40, "Padre top-right background");
  getSample(720, 300, "Padre mid-left background");
}

main().catch(console.error);

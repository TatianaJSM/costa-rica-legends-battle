import { Jimp } from 'jimp';
import path from 'path';

const outputDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\ui\\portraits";

async function check(filename) {
  const image = await Jimp.read(path.join(outputDir, filename));
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  // Find if there are transparent holes inside the character's bounding box
  // We can scan the middle rows of the image and see if there are alternating transparent/opaque segments
  let transparentCount = 0;
  let opaqueCount = 0;
  
  image.scan(0, 0, w, h, function(x, y, idx) {
    const a = this.bitmap.data[idx + 3];
    if (a === 0) transparentCount++;
    else opaqueCount++;
  });
  
  console.log(`${filename}: ${w}x${h} | Opaque pixels: ${opaqueCount}, Transparent pixels: ${transparentCount}`);
}

async function main() {
  await check("segua_portrait.png");
  await check("cadejo_portrait.png");
  await check("padre_portrait.png");
}

main().catch(console.error);

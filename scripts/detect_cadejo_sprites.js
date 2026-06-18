import { Jimp } from 'jimp';

async function main() {
  const file = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";
  const image = await Jimp.read(file);
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  // Define row boundaries
  const rows = [
    { name: "Row 1 (Idle/Walk/Jump)", yMin: 20, yMax: 135 },
    { name: "Row 2 (Attacks/Special)", yMin: 180, yMax: 270 },
    { name: "Row 3 (Projectile/Hurt/KO)", yMin: 340, yMax: 440 },
    { name: "Row 4 (Victory/Block/GetUp/Impact)", yMin: 490, yMax: 650 }
  ];

  for (const row of rows) {
    console.log(`\n=== Analyzing columns in ${row.name} (Y: ${row.yMin} - ${row.yMax}) ===`);
    const colBrightness = [];
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let y = row.yMin; y < row.yMax; y++) {
        const idx = (y * w + x) * 4;
        const r = image.bitmap.data[idx + 0];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        sum += (r + g + b) / 3;
      }
      colBrightness.push(sum / (row.yMax - row.yMin));
    }
    
    // Find active columns where brightness > 10.8 (background is around 9.5-10.0)
    let inSprite = false;
    let spriteStart = 0;
    const sprites = [];
    const threshold = 10.4; // Slightly above background average
    for (let x = 0; x < w; x++) {
      const isBright = colBrightness[x] > threshold;
      if (isBright && !inSprite) {
        inSprite = true;
        spriteStart = x;
      } else if (!isBright && inSprite) {
        inSprite = false;
        if (x - spriteStart > 5) { // Minimum width of 5px
          sprites.push([spriteStart, x - 1]);
        }
      }
    }
    if (inSprite) {
      sprites.push([spriteStart, w - 1]);
    }
    
    console.log(`Detected ${sprites.length} columns:`);
    sprites.forEach((s, idx) => {
      console.log(`  Col ${idx + 1}: [${s[0]}, ${s[1]}] (width: ${s[1] - s[0] + 1}px)`);
    });
  }
}

main().catch(console.error);

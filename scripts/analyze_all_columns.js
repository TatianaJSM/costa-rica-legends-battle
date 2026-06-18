import { Jimp } from 'jimp';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781474185777.png";

function isBackgroundPixel(r, g, b) {
  return r > 245 && g > 245 && b > 245;
}

async function getRowColumns(image, yMin, yMax, minX, maxX) {
  const w = image.bitmap.width;
  const rh = yMax - yMin + 1;
  const densities = Array(w).fill(0);

  for (let x = minX; x <= maxX; x++) {
    let nonBg = 0;
    for (let y = yMin; y <= yMax; y++) {
      const idx = (y * w + x) * 4;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      const a = image.bitmap.data[idx + 3];
      if (a > 0 && !isBackgroundPixel(r, g, b)) {
        nonBg++;
      }
    }
    densities[x] = nonBg / rh;
  }

  const cols = [];
  let inCol = false;
  let startX = 0;
  for (let x = minX; x <= maxX; x++) {
    const isColPixel = densities[x] > 0.005; // low threshold
    if (!inCol && isColPixel) {
      inCol = true;
      startX = x;
    } else if (inCol && !isColPixel) {
      inCol = false;
      cols.push([startX, x - 1]);
    }
  }
  if (inCol) {
    cols.push([startX, maxX]);
  }
  return cols;
}

async function main() {
  const image = await Jimp.read(imgPath);

  console.log("--- ROW 1 IDLE ---");
  const idleCols = await getRowColumns(image, 7, 128, 16, 288);
  console.log("Idle columns:", idleCols);

  console.log("--- ROW 1 WALK & JUMP ---");
  const walkJumpCols = await getRowColumns(image, 7, 128, 333, 1002);
  console.log("Walk/Jump columns:", walkJumpCols);

  console.log("--- ROW 2 CROUCH ---");
  const crouchCols = await getRowColumns(image, 168, 267, 17, 182);
  console.log("Crouch columns:", crouchCols);

  console.log("--- ROW 2 LIGHT ATTACK ---");
  const lightCols = await getRowColumns(image, 168, 267, 273, 571);
  console.log("Light attack columns:", lightCols);

  console.log("--- ROW 2 HEAVY ATTACK ---");
  const heavyCols = await getRowColumns(image, 168, 267, 620, 931);
  console.log("Heavy attack columns:", heavyCols);

  console.log("--- ROW 3 SPECIAL ATTACK ---");
  const specialCols = await getRowColumns(image, 299, 406, 8, 407);
  console.log("Special attack columns:", specialCols);

  console.log("--- ROW 3 PROJECTILE ---");
  const projCols = await getRowColumns(image, 299, 406, 430, 1002);
  console.log("Projectile columns:", projCols);

  console.log("--- ROW 4 HURT & KNOCKDOWN & VICTORY ---");
  const row4Cols = await getRowColumns(image, 437, 540, 15, 874);
  console.log("Row 4 columns:", row4Cols);
}

main().catch(console.error);

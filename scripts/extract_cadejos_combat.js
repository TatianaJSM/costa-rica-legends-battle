import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781750210599.jpg";
const outputBaseDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\cadejos";

function makeWhiteTransparent(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      const a = image.bitmap.data[idx + 3];

      // Replace any pixel that is very close to white (background color and inner pockets)
      if (r > 225 && g > 225 && b > 225 && a > 0) {
        image.bitmap.data[idx + 0] = 0;
        image.bitmap.data[idx + 1] = 0;
        image.bitmap.data[idx + 2] = 0;
        image.bitmap.data[idx + 3] = 0;
      }
    }
  }
}

// Helper to crop to visible bounding box
function autoCrop(image) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let hasPixels = false;

  image.scan(0, 0, w, h, function(x, y, idx) {
    const a = this.bitmap.data[idx + 3];
    if (a > 0) {
      hasPixels = true;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  if (!hasPixels) return image;

  const croppedW = maxX - minX + 1;
  const croppedH = maxY - minY + 1;
  return image.clone().crop({ x: minX, y: minY, w: croppedW, h: croppedH });
}

// Map the animation groups to their exact row and column bounding boxes
const layouts = {
  idle: {
    yMin: 26, yMax: 127,
    cols: [[8, 87], [105, 180], [185, 259]]
  },
  walk: {
    yMin: 26, yMax: 127,
    cols: [
      [283, 375], [376, 459], [462, 547],
      [552, 630], [631, 712], [732, 815]
    ]
  },
  jump: {
    yMin: 26, yMax: 127,
    cols: [[816, 895], [900, 946], [947, 991]]
  },
  attack: { // light attack
    yMin: 191, yMax: 275,
    cols: [[6, 94], [96, 168], [171, 265]]
  },
  heavy: {
    yMin: 191, yMax: 275,
    cols: [[289, 374], [382, 457], [458, 563]]
  },
  special: {
    yMin: 191, yMax: 275,
    cols: [[578, 661], [675, 774], [778, 879], [883, 1005]]
  },
  hit: { // hurt
    yMin: 348, yMax: 441,
    cols: [[474, 547], [554, 621], [632, 694]]
  },
  ko: { // knockdown
    yMin: 348, yMax: 441,
    cols: [[714, 817], [822, 912], [917, 1008]]
  },
  victory: {
    yMin: 488, yMax: 635,
    cols: [[9, 83], [102, 184]]
  }
};

// Projectile columns inside Row 3 (wolf head projectile)
const projectileCols = [
  [9, 56], [69, 149], [162, 257], [270, 451]
];

async function main() {
  const image = await Jimp.read(imgPath);
  const metadata = {};

  // Clean old folders to make sure we don't have unused files
  const foldersToClean = ['block', 'getup', 'impact'];
  foldersToClean.forEach(f => {
    const dir = path.join(outputBaseDir, f);
    if (fs.existsSync(dir)) {
      console.log(`Cleaning old folder: ${dir}`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // Extract regular animations
  for (const [folder, layout] of Object.entries(layouts)) {
    console.log(`Extracting '${folder}' (${layout.cols.length} frames)...`);
    const outputFolder = path.join(outputBaseDir, folder);
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    // Clean existing files in output folder to avoid old remnants
    const files = fs.readdirSync(outputFolder);
    files.forEach(file => {
      fs.unlinkSync(path.join(outputFolder, file));
    });

    for (let i = 0; i < layout.cols.length; i++) {
      const [xMin, xMax] = layout.cols[i];
      const cw = xMax - xMin;
      const ch = layout.yMax - layout.yMin;

      const cropped = image.clone().crop({ x: xMin, y: layout.yMin, w: cw, h: ch });
      makeWhiteTransparent(cropped);
      const tightlyCropped = autoCrop(cropped);

      // Save frame file
      const fileNum = String(i + 1).padStart(2, '0');
      const filename = `${folder}_${fileNum}.png`;
      const destPath = path.join(outputFolder, filename);
      await tightlyCropped.write(destPath);

      // Anchor detection: vertical bottom-center midpoint analysis of bottom 15%
      const tw = tightlyCropped.bitmap.width;
      const th = tightlyCropped.bitmap.height;
      let feetSumX = 0;
      let feetCount = 0;
      const scanStartY = Math.floor(th * 0.85);

      tightlyCropped.scan(0, scanStartY, tw, th - scanStartY, function(x, y, idx) {
        const a = this.bitmap.data[idx + 3];
        if (a > 0) {
          feetSumX += x;
          feetCount++;
        }
      });

      const feetX = feetCount > 0 ? feetSumX / feetCount : tw / 2;
      const offsetPct = (feetX - tw / 2) / tw;

      // Metadata mapping
      const metaKey = `${folder}/${folder}_${fileNum}.png`;
      metadata[metaKey] = {
        width: tw,
        height: th,
        feetX: parseFloat(feetX.toFixed(1)),
        offsetPct: parseFloat(offsetPct.toFixed(6))
      };
    }
  }

  // Extract Projectile frames
  console.log("Extracting projectile frames...");
  const projFolder = path.join(outputBaseDir, "projectile");
  if (!fs.existsSync(projFolder)) {
    fs.mkdirSync(projFolder, { recursive: true });
  }
  const projFiles = fs.readdirSync(projFolder);
  projFiles.forEach(file => {
    fs.unlinkSync(path.join(projFolder, file));
  });

  for (let i = 0; i < projectileCols.length; i++) {
    const [xMin, xMax] = projectileCols[i];
    const cw = xMax - xMin;
    const ch = 441 - 348;

    const cropped = image.clone().crop({ x: xMin, y: 348, w: cw, h: ch });
    makeWhiteTransparent(cropped);
    const tightlyCropped = autoCrop(cropped);

    const fileNum = String(i + 1).padStart(2, '0');
    const destPath = path.join(projFolder, `projectile_${fileNum}.png`);
    await tightlyCropped.write(destPath);

    // Save metadata for projectile frames
    const tw = tightlyCropped.bitmap.width;
    const th = tightlyCropped.bitmap.height;
    const metaKey = `projectile/projectile_${fileNum}.png`;
    metadata[metaKey] = {
      width: tw,
      height: th,
      feetX: tw / 2,
      offsetPct: 0.0
    };
  }

  // Also write the master static projectile.png
  console.log("Saving master projectile.png...");
  const finalProjPath = path.join(outputBaseDir, "projectile.png");
  const [pxMin, pxMax] = projectileCols[3];
  const pcropped = image.clone().crop({ x: pxMin, y: 348, w: pxMax - pxMin, h: 441 - 348 });
  makeWhiteTransparent(pcropped);
  const ptightlyCropped = autoCrop(pcropped);
  await ptightlyCropped.write(finalProjPath);

  // Write metadata file
  const metaPath = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\data\\cadejosMetadata.json";
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  console.log(`Saved metadata to: ${metaPath}`);

  console.log("Finished extracting all El Cadejos combat frames successfully!");
}

main().catch(console.error);

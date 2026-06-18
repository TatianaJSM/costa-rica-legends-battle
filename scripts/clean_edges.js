import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

// Root directory of character sprites
const charsDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters";

// Clean edges algorithm
async function cleanEdges(imgPath, dryRun = false) {
  const img = await Jimp.read(imgPath);
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  let modified = false;
  let removedCount = 0;

  // We run up to 2 passes of our refined edge cleanup.
  // The dark outlines of the characters act as a shield to prevent eroding the character interior.
  for (let pass = 1; pass <= 2; pass++) {
    const toRemove = [];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = img.bitmap.data[idx + 0];
        const g = img.bitmap.data[idx + 1];
        const b = img.bitmap.data[idx + 2];
        const a = img.bitmap.data[idx + 3];

        if (a > 0) {
          // Check if it is a boundary pixel (adjacent to a transparent pixel)
          let isBoundary = false;
          let neighbors = [];
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nidx = (ny * w + nx) * 4;
                const na = img.bitmap.data[nidx + 3];
                if (na === 0) {
                  isBoundary = true;
                } else {
                  neighbors.push({
                    r: img.bitmap.data[nidx + 0],
                    g: img.bitmap.data[nidx + 1],
                    b: img.bitmap.data[nidx + 2],
                    a: na
                  });
                }
              } else {
                isBoundary = true; // Image edge is a boundary
              }
            }
          }

          if (isBoundary) {
            const brightness = (r + g + b) / 3;
            const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
            const isGreyishOrWhite = maxDiff < 20;

            if (brightness > 120 && isGreyishOrWhite) {
              const isSemi = a < 255;
              
              let hasDarkNeighbor = false;
              let allNeighborsBright = true;
              
              for (const n of neighbors) {
                const nBrightness = (n.r + n.g + n.b) / 3;
                if (nBrightness < brightness - 30) {
                  hasDarkNeighbor = true;
                }
                if (nBrightness < 160) {
                  allNeighborsBright = false;
                }
              }

              // Isolated pixel count as halo
              if (neighbors.length === 0) {
                hasDarkNeighbor = true;
                allNeighborsBright = false;
              }

              // It's a halo if:
              // 1. It is semi-transparent
              // 2. Or it is adjacent to a dark pixel (meaning it is a light halo outside a dark border)
              // 3. Or it is extremely bright white and not completely surrounded by other bright pixels
              const isHalo = isSemi || hasDarkNeighbor || (brightness > 235 && !allNeighborsBright);

              if (isHalo) {
                toRemove.push({ x, y });
              }
            }
          }
        }
      }
    }

    if (toRemove.length === 0) {
      break;
    }

    // Apply removals for this pass
    for (const { x, y } of toRemove) {
      const idx = (y * w + x) * 4;
      img.bitmap.data[idx + 0] = 0;
      img.bitmap.data[idx + 1] = 0;
      img.bitmap.data[idx + 2] = 0;
      img.bitmap.data[idx + 3] = 0;
      removedCount++;
    }
    modified = true;
  }

  if (modified && !dryRun) {
    await img.write(imgPath);
  }

  return removedCount;
}

// Process directory recursively
async function processDir(dir, dryRun = false) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalCleaned = 0;
  let filesProcessed = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const { cleaned, count } = await processDir(fullPath, dryRun);
      totalCleaned += cleaned;
      filesProcessed += count;
    } else if (entry.name.endsWith('.png') && !fullPath.includes('padre')) {
      try {
        const removed = await cleanEdges(fullPath, dryRun);
        if (removed > 0) {
          console.log(`Cleaned ${removed} fringe pixels from: ${path.relative(charsDir, fullPath)}`);
          totalCleaned += removed;
        }
        filesProcessed++;
      } catch (err) {
        console.error(`Error processing ${fullPath}:`, err);
      }
    }
  }

  return { cleaned: totalCleaned, count: filesProcessed };
}

const dryRunMode = process.argv.includes('--dry-run');

console.log(`Starting refined alpha edge cleanup on: ${charsDir} (Dry run: ${dryRunMode})`);
processDir(charsDir, dryRunMode).then(({ cleaned, count }) => {
  console.log(`\nFinished processing. Cleaned total of ${cleaned} pixels across ${count} sprites.`);
}).catch(console.error);

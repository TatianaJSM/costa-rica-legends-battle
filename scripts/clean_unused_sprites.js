import fs from 'fs';
import path from 'path';

const padreDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\assets\\images\\characters\\padre";

// Define the valid frames that we extracted and want to keep
const keepFiles = {
  idle: ['idle_01.png', 'idle_02.png', 'idle_03.png', 'idle_04.png'],
  walk: ['walk_01.png', 'walk_02.png', 'walk_03.png', 'walk_04.png', 'walk_05.png', 'walk_06.png'],
  jump: ['jump_01.png', 'jump_02.png', 'jump_03.png'],
  attack: ['attack_01.png', 'attack_02.png', 'attack_03.png'],
  heavy: ['heavy_01.png', 'heavy_02.png', 'heavy_03.png'],
  special: ['special_01.png', 'special_02.png', 'special_03.png', 'special_04.png', 'special_05.png'],
  hit: ['hit_01.png', 'hit_02.png', 'hit_03.png'],
  ko: ['ko_01.png', 'ko_02.png', 'ko_03.png'],
  victory: ['victory_01.png', 'victory_02.png'],
  projectile: [
    'projectile_01.png', 'projectile_02.png', 'projectile_03.png',
    'projectile_04.png', 'projectile_05.png', 'projectile_06.png',
    'projectile_07.png'
  ]
};

// Root files to keep (like the master projectile.png)
const keepRootFiles = ['projectile.png'];

function cleanDirectory() {
  const subdirs = fs.readdirSync(padreDir);

  for (const name of subdirs) {
    const fullPath = path.join(padreDir, name);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // If it is an unused folder (like crouch), delete it entirely
      if (!keepFiles[name]) {
        console.log(`Deleting unused directory: ${name}`);
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        // It is an active folder, check for extra files
        const files = fs.readdirSync(fullPath);
        const allowedFiles = keepFiles[name];
        for (const file of files) {
          if (!allowedFiles.includes(file)) {
            console.log(`Deleting extra file: ${name}/${file}`);
            fs.unlinkSync(path.join(fullPath, file));
          }
        }
      }
    } else {
      // It is a file in the root of the padre directory
      if (!keepRootFiles.includes(name)) {
        console.log(`Deleting extra root file: ${name}`);
        fs.unlinkSync(fullPath);
      }
    }
  }
}

cleanDirectory();
console.log("Cleanup completed successfully!");

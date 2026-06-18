import fs from 'fs';
import path from 'path';

const compDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\components";
const files = fs.readdirSync(compDir);

console.log("Searching for VS screen / VS elements in components...");
for (const file of files) {
  if (file.endsWith('.vue')) {
    const content = fs.readFileSync(path.join(compDir, file), 'utf8');
    if (content.toLowerCase().includes('vs') || content.toLowerCase().includes('versus')) {
      console.log(`\n--- Found in ${file} ---`);
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes('vs') || line.toLowerCase().includes('versus') || line.toLowerCase().includes('character')) {
          console.log(`${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

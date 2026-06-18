import fs from 'fs';
import path from 'path';

const compDir = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\components";
const files = fs.readdirSync(compDir);

console.log("Searching components for character image / roster rendering...");
for (const file of files) {
  if (file.endsWith('.vue')) {
    const fullPath = path.join(compDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('.image') || content.includes('padre-sin-cabeza') || content.includes('character-select')) {
      console.log(`\n--- Found in ${file} ---`);
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('.image') || line.includes('padre-sin-cabeza') || line.includes('characters/')) {
          console.log(`${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

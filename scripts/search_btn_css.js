import fs from 'fs';

const cssPath = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\css\\global.css";
const css = fs.readFileSync(cssPath, 'utf-8');
const lines = css.split('\n');

lines.forEach((line, i) => {
  if (line.includes('.btn') || line.includes('menu-btn') || line.includes('font-family') || line.includes('Press Start 2P')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});

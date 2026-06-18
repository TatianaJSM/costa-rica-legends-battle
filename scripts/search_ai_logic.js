import fs from 'fs';

const battleScreenPath = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\components\\BattleScreen.vue";
const fileContent = fs.readFileSync(battleScreenPath, 'utf-8');
const lines = fileContent.split('\n');

lines.forEach((line, i) => {
  if (line.includes('ai') || line.includes('enemy') && (line.includes('Attack') || line.includes('perform'))) {
    if (line.includes('function') || line.includes('timeout') || line.includes('setInterval') || line.includes('setTimeout') || line.includes('random')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  }
});

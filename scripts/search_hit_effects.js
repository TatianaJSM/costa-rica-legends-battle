import fs from 'fs';

const battleScreenPath = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\components\\BattleScreen.vue";
const fileContent = fs.readFileSync(battleScreenPath, 'utf-8');
const lines = fileContent.split('\n');

lines.forEach((line, i) => {
  if (line.includes('impact') || line.includes('effect') && (line.includes('active') || line.includes('show') || line.includes('render'))) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});

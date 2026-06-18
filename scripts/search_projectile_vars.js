import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\components\\BattleScreen.vue', 'utf8');
const lines = content.split('\n');

console.log("Searching for 'proj' in BattleScreen.vue...");
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('proj')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

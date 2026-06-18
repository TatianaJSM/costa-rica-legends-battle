import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\components\\BattleScreen.vue', 'utf8');
const lines = content.split('\n');

console.log("Searching for 'padre' references...");
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('padre')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

console.log("\nSearching for 'scale' references...");
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('scale')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

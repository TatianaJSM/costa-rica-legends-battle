import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\components\\BattleScreen.vue', 'utf8');
const lines = content.split('\n');

console.log("Searching for return statement near end of setup in BattleScreen.vue...");
lines.forEach((line, idx) => {
  if (idx > 1320 && idx < 1400) {
    console.log(`${idx + 1}: ${line}`);
  }
});

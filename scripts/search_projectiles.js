import fs from 'fs';

const battleScreenPath = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\components\\BattleScreen.vue";
const fileContent = fs.readFileSync(battleScreenPath, 'utf-8');
const lines = fileContent.split('\n');

lines.forEach((line, i) => {
  if (line.includes('headThrow') || line.includes('coyolBlast') || line.includes('spawnProjectile') || line.includes('activeProjectiles')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});

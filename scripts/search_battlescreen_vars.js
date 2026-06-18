import fs from 'fs';

const battleScreenPath = "C:\\Users\\Lenovo\\Desktop\\costa-rica-legends-battle-vue\\src\\components\\BattleScreen.vue";
const fileContent = fs.readFileSync(battleScreenPath, 'utf-8');
const lines = fileContent.split('\n');

const keywords = [
  'cadejosAnimations',
  'padreAnimations',
  'seguaAnimations',
  'padreMetadata',
  'seguaMetadata',
  'projectile',
  '300px',
  '240px',
  'feetX',
  'offsetPct',
  'specialAttack',
  'heavyAttack',
  'lightAttack',
  'attacks',
  'cooldown',
  'vino de coyol',
  'vino'
];

lines.forEach((line, i) => {
  keywords.forEach(kw => {
    if (line.includes(kw)) {
      console.log(`Line ${i + 1} [${kw}]: ${line.trim()}`);
    }
  });
});

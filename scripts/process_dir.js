import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Uso: node scripts/process_dir.js <input_dir> <output_dir> [threshold]');
  process.exit(1);
}

const inputDir = path.resolve(args[0]);
const outputDir = path.resolve(args[1]);
const threshold = args[2] || '220';

if (!fs.existsSync(inputDir)) {
  console.error('Directorio de entrada no existe:', inputDir);
  process.exit(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => f.toLowerCase().endsWith('.png'));

for (const file of files) {
  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, file);
  try {
    execSync(`node scripts/remove_background.js "${inputPath}" "${outputPath}" ${threshold}`, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Error procesando ${file}:`, e.message);
  }
}

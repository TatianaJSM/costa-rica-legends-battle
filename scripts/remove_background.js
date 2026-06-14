import { Jimp } from 'jimp';
import path from 'path';
import fs from 'fs';

async function removeBackground(inputPath, outputPath, threshold = 220) {
  try {
    const image = await Jimp.read(inputPath);
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    image.scan(0, 0, width, height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];

      // El fondo es blanco, por lo que R, G, B serán muy altos.
      // Calculamos qué tan blanco es.
      const minVal = Math.min(r, g, b);
      const maxVal = Math.max(r, g, b);

      // Si los tres canales son muy altos y no es un color saturado (grisáceo/blanco)
      if (minVal > threshold && (maxVal - minVal) < 15) {
        // Hacemos un desvanecimiento (feathering) para suavizar los bordes
        // Si minVal es 255 -> alpha = 0
        // Si minVal es threshold -> alpha = 255
        const ratio = (255 - minVal) / (255 - threshold);
        this.bitmap.data[idx + 3] = Math.round(ratio * a);
      }
    });

    // Guardamos la imagen procesada
    await image.write(outputPath);
    console.log(`✓ Procesado con éxito: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`✕ Error al procesar ${inputPath}:`, error.message);
  }
}

// Ejecutar si se corre desde CLI
const args = process.argv.slice(2);
if (args.length >= 2) {
  const input = path.resolve(args[0]);
  const output = path.resolve(args[1]);
  const threshold = args[2] ? parseInt(args[2], 10) : 220;
  
  // Asegurar que exista la carpeta de destino
  const destDir = path.dirname(output);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  removeBackground(input, output, threshold);
} else {
  console.log('Uso: node scripts/remove_background.js <input_path> <output_path> [threshold]');
}

import { Jimp } from 'jimp';
import path from 'path';

const imgPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\media__1781746508973.jpg";
const outPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7\\annotated_sheet.png";

async function main() {
  const image = await Jimp.read(imgPath);
  
  // Convert to RGBA
  const annotated = image.clone();
  
  const bands = [
    { name: "Row 1", yMin: 28, yMax: 123, cols: [
      [9, 92], [101, 177], [188, 269], // idle
      [290, 384], [388, 461], [466, 545], [553, 629], [636, 718], [741, 821], // walk
      [822, 902], [902, 963], [963, 1024] // jump
    ]},
    { name: "Row 2", yMin: 186, yMax: 269, cols: [
      [15, 46], [48, 149], [151, 173], [185, 275], [303, 384],
      [394, 459], [464, 569], [582, 664], [674, 776], [790, 884], [892, 1009]
    ]},
    { name: "Row 3", yMin: 346, yMax: 439, cols: [
      [16, 65], [80, 156], [170, 265], [274, 459], [476, 548],
      [560, 625], [636, 698], [720, 822], [828, 914], [921, 1010]
    ]},
    { name: "Row 4", yMin: 486, yMax: 631, cols: [
      [10, 86], [102, 184], [212, 289], [297, 367], [389, 484],
      [496, 575], [582, 661], [689, 1010]
    ]}
  ];
  
  // Draw horizontal lines for bands
  for (const band of bands) {
    // Draw top and bottom boundary
    for (let x = 0; x < image.bitmap.width; x++) {
      // Top line
      let idx = (band.yMin * image.bitmap.width + x) * 4;
      annotated.bitmap.data[idx] = 255;   // R
      annotated.bitmap.data[idx+1] = 0;   // G
      annotated.bitmap.data[idx+2] = 0;   // B
      
      // Bottom line
      idx = (band.yMax * image.bitmap.width + x) * 4;
      annotated.bitmap.data[idx] = 255;   // R
      annotated.bitmap.data[idx+1] = 0;   // G
      annotated.bitmap.data[idx+2] = 0;   // B
    }
    
    // Draw vertical lines for columns
    for (const [xMin, xMax] of band.cols) {
      for (let y = band.yMin; y <= band.yMax; y++) {
        // Left column edge
        let idx = (y * image.bitmap.width + xMin) * 4;
        annotated.bitmap.data[idx] = 0;     // R
        annotated.bitmap.data[idx+1] = 255; // G
        annotated.bitmap.data[idx+2] = 0;   // B
        
        // Right column edge
        idx = (y * image.bitmap.width + xMax) * 4;
        annotated.bitmap.data[idx] = 0;     // R
        annotated.bitmap.data[idx+1] = 255; // G
        annotated.bitmap.data[idx+2] = 0;   // B
      }
    }
  }

  await annotated.write(outPath);
  console.log(`Saved annotated sheet to ${outPath}`);
}

main().catch(console.error);

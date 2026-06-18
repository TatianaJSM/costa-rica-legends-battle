import fs from 'fs';
import path from 'path';

const brainDir = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7";
const files = fs.readdirSync(brainDir);

console.log("Image files in brain directory:");
for (const file of files) {
  const fullPath = path.join(brainDir, file);
  const stat = fs.statSync(fullPath);
  if (stat.isFile() && (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))) {
    // Check if modified in the last 24 hours
    const ageHrs = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    if (ageHrs < 24) {
      console.log(`- ${file} (${(stat.size / 1024).toFixed(1)} KB) - Modified: ${stat.mtime}`);
    }
  }
}

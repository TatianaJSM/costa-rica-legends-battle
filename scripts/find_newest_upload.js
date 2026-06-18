import fs from 'fs';
import path from 'path';

function main() {
  const dir = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\7dcca147-9f07-4cb1-a5ac-51ddb8db57e7";
  const files = fs.readdirSync(dir);
  
  const fileDetails = files.map(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    return { name: file, mtime: stat.mtime };
  }).sort((a, b) => b.mtime - a.mtime);
  
  console.log("Newest files:");
  fileDetails.slice(0, 10).forEach(f => {
    console.log(`${f.name} - ${f.mtime}`);
  });
}

main();

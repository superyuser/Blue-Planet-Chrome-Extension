import fs from 'fs';
import path from 'path';

const files = fs.readdirSync("assets/scenic");
console.log(`${files.length} files found.`);
const output = "frontend/scenicImages.json";
fs.writeFileSync(output, JSON.stringify(files, null, 2));
console.log(`Wrote ${files.length} files to ${output}.`);
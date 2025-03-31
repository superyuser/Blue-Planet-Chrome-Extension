import fs from 'fs';

const readDir = fs.readdirSync('assets')

fs.writeFileSync('./scenicImages.json', JSON.stringify(readDir, null, 2));

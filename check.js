import fs from 'fs';

var file = fs.readFileSync('./github_webContentScraped.json', 'utf-8');
var fileJson = JSON.parse(file);
var emptyEntries = Array.from(fileJson).filter(elem => elem.about == null);
console.log((emptyEntries.length / fileJson.length).toFixed(3));
var filledEntries = fileJson.filter(elem => elem.about != null);
var output_file = './filled_webContentScraped.json';
fs.writeFileSync(output_file, JSON.stringify(filledEntries, null, 2));
console.log(`Wrote to file!`);
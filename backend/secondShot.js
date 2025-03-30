import fs from 'fs/promises';
import { chromium } from 'playwright';
import { spawn } from 'child_process';

const inputFile = './github_webContentScraped.json';
const sourceFile = './vary_webContentScraped.json';

const promptTemplate = (readme) => `
Provide a short summary of the project limited to 100 words based on this README file. Provide just the response, without anything else.

${readme}
`;

function getRawReadmeUrl(githubUrl) {
  return githubUrl
    .replace('https://github.com/', 'https://raw.githubusercontent.com/')
    .replace('/tree/', '/')
    .replace(/\/$/, '') + '/main/README.md';
}

function runOllama(prompt) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ollama', ['run', 'gemma3']);
    let output = '';

    proc.stdout.on('data', (data) => output += data.toString());
    proc.stderr.on('data', (err) => console.error('[ollama stderr]', err.toString()));
    proc.on('error', reject);
    proc.on('close', () => resolve(output.trim()));

    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

const projects = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
const missingItems = projects.filter(p => !p.about && p.github);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', (msg) => {
  const text = msg.text();
  if (!text.includes('JQMIGRATE') && !text.includes('Cookie')) {
    console.log(`[browser] ${msg.type()}: ${text}`);
  }
});

for (const proj of missingItems) {
  if (!proj.github) {
    console.warn(`⚠️  No GitHub for ${proj.name}`);
    continue;
  }

  let rawUrl = getRawReadmeUrl(proj.github);
  let readmeText = '';

  try {
    await page.goto(rawUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch {
    console.log(`🔁 Retrying ${proj.name} with master branch...`);
    rawUrl = rawUrl.replace('/main/', '/master/');
    try {
      await page.goto(rawUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch (err) {
      console.warn(`❌ Skipped ${proj.name}: ${err.message}`);
      continue;
    }
  }

  try {
    console.log(`📖 Reading: ${rawUrl}`);
    readmeText = await page.evaluate(() => document.body.innerText);
    if (!readmeText || readmeText.includes('404')) throw new Error('404 or empty README');
    console.log(`✅ README Loaded for ${proj.name}`);
  } catch (err) {
    console.warn(`❌ Failed to read README for ${proj.name}: ${err.message}`);
    continue;
  }

  try {
    const prompt = promptTemplate(readmeText.slice(0, 3000));
    const summary = await runOllama(prompt);
    proj.about = summary;
    console.log(`📘 ${proj.name} Summary:\n${summary}\n`);
  } catch (err) {
    console.warn(`❌ Failed to summarize ${proj.name}: ${err.message}`);
    continue;
  }

  try {
    await fs.writeFile(inputFile, JSON.stringify(projects, null, 2));
  } catch (err) {
    console.error(`❌ Failed to write to file: ${err.message}`);
  }
}

await browser.close();

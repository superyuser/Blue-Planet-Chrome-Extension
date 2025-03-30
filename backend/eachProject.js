import fs from 'fs';
import { chromium } from 'playwright';
import cliProgress from 'cli-progress';

const INPUT_FILE = './output.json';
const OUTPUT_FILE = './vary_webContentScraped.json';
const MAX_RETRIES = 3;
const BATCH_DELAY = 300;

// Load input and existing output
const readUrls = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
let gleanedContent = fs.existsSync(OUTPUT_FILE)
  ? JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'))
  : [];

const alreadyDone = new Set(gleanedContent.map(p => p.link));
const pending = readUrls.filter(p => !alreadyDone.has(p.project_link));

// Progress bar setup
const bar = new cliProgress.Bar({
  format: 'Progress [{bar}] {percentage}% | {value}/{total} projects',
});
bar.start(readUrls.length, gleanedContent.length);

// Launch browser
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on('console', msg => {
  console.log(`[browser] ${msg.type()}: ${msg.text()}`);
});

for (const item of pending) {
  const { project_name: name, project_link: link } = item;
  console.log(`\n🔎 Scraping: ${name} → ${link}`);
  let data = null;
  let tries = 0;

  while (tries < MAX_RETRIES && !data) {
    try {
      await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000); // Allow lazy-load sections to render

      // Scrape page content
      data = await page.evaluate(() => {
        const normalize = str => str?.trim().toLowerCase();

        const findSectionContent = (label) => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
          const target = normalize(label);

          for (const h of headings) {
            if (normalize(h.innerText) === target) {
              const paragraphs = [];
              let sibling = h.nextElementSibling;

              while (sibling && sibling.tagName.toLowerCase() === 'p') {
                if (sibling.innerText.trim()) {
                  paragraphs.push(sibling.innerText.trim());
                }
                sibling = sibling.nextElementSibling;
              }

              return paragraphs.join('\n\n') || null;
            }
          }
          return null;
        };

        const whatItDoes = findSectionContent("What it does");

        const builtWithDiv = document.getElementById("built-with");
        const tools = builtWithDiv
          ? Array.from(builtWithDiv.querySelectorAll('span')).map(el => el.innerText.trim())
          : [];

        const githubText = Array.from(document.querySelectorAll('span'))
          .find(el => el.innerText.trim() === "GitHub Repo");
        
        const githubLink = githubText
          ? githubText.closest('a')?.href || null
          : null;
        
        return {
          about: whatItDoes,
          github: githubLink,
          tools
        };
      });

    } catch (err) {
      tries++;
      console.warn(`❌ Attempt ${tries} failed for ${name}: ${err.message}`);
      if (tries >= MAX_RETRIES) {
        data = { problem: null, about: null, tools: [] };
        console.warn(`💀 Giving up on ${name}`);
      } else {
        await new Promise(r => setTimeout(r, 2000)); // backoff before retry
      }
    }
  }

  gleanedContent.push({ name, link, ...data });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(gleanedContent, null, 2));
  console.log(`✅ Saved ${name} (${gleanedContent.length}/${readUrls.length})`);
  bar.update(gleanedContent.length);
  await new Promise(r => setTimeout(r, BATCH_DELAY));
}

bar.stop();
await browser.close();
console.log('\n🎉 All done! Data saved to:', OUTPUT_FILE);

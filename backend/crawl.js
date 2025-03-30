import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'https://treehacks-2025.devpost.com/project-gallery?page=';
const results = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

let pageNum = 1;
let hasMore = true;

while (hasMore) {
  const url = `${BASE_URL}${pageNum}`;
  console.log(`📄 Scraping: ${url}`);

  await page.goto(url, { waitUntil: 'networkidle' });

  // Scroll to bottom
  await autoScroll(page);
  await page.waitForTimeout(1000); // Let lazy content load

  // Extract all thumbnail entries
  const projects = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('a.block-wrapper-link'));
    return blocks.map(block => {
        const project_link = block.href;
        const h5 = block.querySelector('h5');
        const project_name = h5 ? h5.innerText.trim() : "unnamed";
        return { project_name, project_link };
    })
  });

  if (projects.length === 0) {
    console.log('🚫 No more projects found. Stopping.');
    hasMore = false;
  } else {
    console.log(`✅ Found ${projects.length} projects on page ${pageNum}`);
    results.push(...projects);
    pageNum++;
  }
}

await browser.close();

fs.writeFileSync('output.json', JSON.stringify(results, null, 2));
console.log('📝 Saved to output.json');

// Scroll helper
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

/* eslint-disable */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const HTML = path.resolve(__dirname, '../exports/svivva-tools-pitch.html');
  const PDF = path.resolve(__dirname, '../exports/svivva-tools-pitch.pdf');
  if (!fs.existsSync(HTML)) {
    console.error('Run scripts/generate-pitch.cjs first.');
    process.exit(1);
  }

  const { execSync } = require('child_process');
  let executablePath;
  try {
    executablePath = execSync('which chromium', { encoding: 'utf8' }).trim();
  } catch {
    executablePath = undefined;
  }
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.goto('file://' + HTML, { waitUntil: 'networkidle0' });
  await page.emulateMediaType('print');
  await page.pdf({
    path: PDF,
    format: 'Letter',
    printBackground: true,
    margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    preferCSSPageSize: false,
  });
  await browser.close();
  const stat = fs.statSync(PDF);
  console.log('Wrote', PDF, '(' + (stat.size / 1024).toFixed(1) + ' KB)');
})();

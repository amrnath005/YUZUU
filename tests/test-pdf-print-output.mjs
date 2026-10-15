import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const delay = ms => new Promise(r => setTimeout(r, ms));

async function testPdfPrint() {
  console.log('Testing PDF print layout...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  await page.goto(`${BASE_URL}/statements?client=c_1`, { waitUntil: 'domcontentloaded' });
  await delay(1500);

  // Emulate print media
  await page.emulateMediaType('print');
  await delay(500);

  // Check if any toast or toast container is visible in print
  const toastVisible = await page.evaluate(() => {
    const toast = document.querySelector('[data-toast-container]');
    if (!toast) return false;
    const style = window.getComputedStyle(toast);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });

  console.log('Toast container visible in print mode:', toastVisible);
  if (toastVisible) {
    console.error('FAIL: Toast is visible in print mode!');
  } else {
    console.log('PASS: Toast is completely hidden in print mode!');
  }

  // Generate actual test PDF buffer to ensure it produces without errors
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  console.log(`PASS: Successfully generated PDF (${pdfBuffer.length} bytes)!`);

  await browser.close();
}

testPdfPrint().catch(console.error);

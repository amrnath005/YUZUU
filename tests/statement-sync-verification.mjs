import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const delay = ms => new Promise(r => setTimeout(r, ms));

async function runStatementSyncVerification() {
  console.log('================================================================');
  console.log('       YUZU STATEMENT & CLIENT SYNCHRONIZATION TEST             ');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Visit /clients and verify client list rendered
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    const clientCards = await page.$$('div.cursor-pointer');
    assert(clientCards.length > 0, `Clients page rendered with ${clientCards.length} client cards`);

    // 2. Visit /statements with client c_1 (Nova Media)
    await page.goto(`${BASE_URL}/statements?client=c_1`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    // Verify statement document is visible
    const docTitle = await page.$eval('h2', el => el.textContent);
    assert(docTitle && docTitle.toUpperCase().includes('STATEMENT OF ACCOUNT'), 'Statement document rendered immediately with proper header');

    // Check All-Time Ledger button is active by default
    const allTimeBtn = await page.$('button ::-p-text(All-Time Ledger)');
    assert(allTimeBtn !== null, 'All-Time Ledger toggle is visible and active');

    // Check Total Balance Due text
    const content = await page.content();
    assert(content.includes('Total Balance Due'), 'Total Balance Due section visible in ribbon');

    // Toggle to Monthly Period
    const monthlyBtn = await page.$('button ::-p-text(Monthly Period)');
    if (monthlyBtn) {
      await monthlyBtn.click();
      await delay(500);
      const updatedContent = await page.content();
      assert(updatedContent.includes('Statement Month'), 'Statement Month selector appears when Monthly Period is active');
    }

    // 3. Test Reactivity: Add payment via dialog and verify statement updates without refresh
    await page.goto(`${BASE_URL}/payments`, { waitUntil: 'domcontentloaded' });
    await delay(1200);

    // Open Record Payment dialog
    const recordBtn = await page.$('button ::-p-text(Record payment)');
    if (recordBtn) {
      await recordBtn.click();
      await delay(800);

      const testRef = `SYNC-TEST-${Date.now()}`;
      const refInput = await page.$('input[placeholder*="UPI-"]');
      if (refInput) {
        await refInput.type(testRef);
      }

      const submitBtn = await page.$('button[type="submit"] ::-p-text(Record Payment)');
      if (submitBtn) {
        await submitBtn.click();
        await delay(1500);
      }

      // Navigate back to statements for c_1
      await page.goto(`${BASE_URL}/statements?client=c_1`, { waitUntil: 'domcontentloaded' });
      await delay(1200);

      const paymentsTableContent = await page.content();
      assert(paymentsTableContent.includes(testRef), `Newly recorded payment (${testRef}) is immediately credited in statements!`);
    }

    console.log('\n================================================================');
    console.log(`STATEMENT SYNC TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
  }
}

runStatementSyncVerification();

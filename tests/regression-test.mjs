import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const delay = ms => new Promise(r => setTimeout(r, ms));

async function runRegressionSuite() {
  console.log('================================================================');
  console.log('       YUZU CRITICAL WORKFLOW FIXES — REGRESSION SUITE          ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  try {
    // -----------------------------------------------------------------
    // TEST 1: BATCH ENTRY (SAVE & ADD ANOTHER + STICKY RETENTION)
    // -----------------------------------------------------------------
    console.log('--- TEST 1: BATCH ENTRY ("Save & Add Another" + Sticky Retention) ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Open Add Work modal
    await page.keyboard.press('KeyN');
    await page.waitForSelector('form#add-work-form', { timeout: 3000 });
    await delay(100);

    // Select Pixel House
    await page.evaluate(() => {
      const sel = document.querySelector('select[name="clientId"]');
      const opt = Array.from(sel.options).find(o => o.text.includes('Pixel House'));
      if (opt) {
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await delay(100);

    // Select Short
    await page.evaluate(() => {
      const sel = document.querySelector('select[name="type"]');
      if (sel) {
        sel.value = 'short';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await delay(100);

    // Verify rate auto-populated for Pixel House Short (₹1,000 in rate card or customized)
    const initialRate = await page.evaluate(() => {
      const amtInput = document.querySelector('input[type="text"]:not([name="title"])');
      return amtInput ? amtInput.value : '';
    });
    console.log(`  Initial auto-populated rate for Pixel House Short: ₹${initialRate}`);

    // Log 5 items using "Save & Add Another" (and Shift+Enter)
    const batchTitles = [
      'Batch Item 101',
      'Batch Item 102',
      'Batch Item 103',
      'Batch Item 104',
      'Batch Item 105',
    ];

    for (let i = 0; i < batchTitles.length; i++) {
      const title = batchTitles[i];
      // Title should be focused or we type into it
      const titleInp = await page.$('input[name="title"]');
      await titleInp.click();
      await titleInp.type(title);

      if (i < batchTitles.length - 1) {
        // Use Shift + Enter or click "Save & Add Another" button
        if (i % 2 === 0) {
          // Click button
          const addAnotherBtn = await page.$('button::-p-text(Save & Add Another)');
          await addAnotherBtn.click();
        } else {
          // Keyboard Shift + Enter
          await page.keyboard.down('Shift');
          await page.keyboard.press('Enter');
          await page.keyboard.up('Shift');
        }
        await delay(200);

        // Verify modal remains open
        const modalOpen = await page.evaluate(() => Boolean(document.querySelector('form#add-work-form')));
        // Verify Title input is cleared
        const titleVal = await page.evaluate(() => document.querySelector('input[name="title"]')?.value);
        // Verify client remains Pixel House
        const clientText = await page.evaluate(() => {
          const sel = document.querySelector('select[name="clientId"]');
          return sel.options[sel.selectedIndex]?.text;
        });
        // Verify type remains Short
        const typeVal = await page.evaluate(() => document.querySelector('select[name="type"]')?.value);

        console.log(`  [Batch #${i+1}] "${title}" saved -> Modal open: ${modalOpen}, Title cleared: "${titleVal}", Client: "${clientText}", Type: "${typeVal}"`);
      } else {
        // Last item: click Save (or press Enter) to save and close
        const saveBtn = await page.$('button[type="submit"]');
        await saveBtn.click();
        await page.waitForFunction(() => !document.querySelector('form#add-work-form'), { timeout: 3000 });
        console.log(`  [Batch #${i+1}] Final item "${title}" saved -> Modal closed cleanly.`);
      }
    }

    // Verify Sticky Retention: reopen modal with 'N', verify Pixel House & Short are pre-selected!
    await delay(200);
    await page.keyboard.press('KeyN');
    await page.waitForSelector('form#add-work-form', { timeout: 3000 });
    const rememberedClient = await page.evaluate(() => {
      const sel = document.querySelector('select[name="clientId"]');
      return sel.options[sel.selectedIndex]?.text;
    });
    const rememberedType = await page.evaluate(() => document.querySelector('select[name="type"]')?.value);
    console.log(`  Sticky Retention Verification: Reopened modal has Client="${rememberedClient}", Type="${rememberedType}"`);
    await page.keyboard.press('Escape');
    await delay(200);

    // -----------------------------------------------------------------
    // TEST 2: PERSISTENCE (DELIVERABLE + PAYMENT + REFRESH SURVIVAL)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: USER DATA PERSISTENCE ACROSS REFRESH ---');
    // Record a unique test payment
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Record payment'));
      if (btn) btn.click();
    });
    await page.waitForSelector('form select[name="clientId"]', { timeout: 3000 });
    await delay(100);

    // Select Pixel House
    await page.evaluate(() => {
      const sel = document.querySelector('select[name="clientId"]');
      const opt = Array.from(sel.options).find(o => o.text.includes('Pixel House'));
      if (opt) {
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await delay(100);

    // Type unique amount ₹7,777
    const amtInput = await page.$('input[type="text"]');
    if (amtInput) {
      await amtInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.keyboard.type('7777');
    }

    // Reference
    const refInput = await page.$('input[name="reference"]');
    if (refInput) {
      await refInput.type('PERSIST-TEST-7777');
    }

    // Submit payment
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent?.includes('Record Payment'));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => !document.querySelector('form select[name="clientId"]'), { timeout: 3000 });
    await delay(300);

    // Check localStorage in browser
    const rawStorage = await page.evaluate(() => localStorage.getItem('yuzu_freelance_store_v1'));
    const parsedStorage = JSON.parse(rawStorage || '{}');
    const paymentPersisted = parsedStorage.payments?.some(p => p.amount === 7777 || p.reference === 'PERSIST-TEST-7777');
    const deliverablePersisted = parsedStorage.deliverables?.some(d => d.title === 'Batch Item 105');
    console.log(`  localStorage Check: Deliverable persisted: ${deliverablePersisted}, Payment persisted: ${paymentPersisted}`);

    // Now reload the page (F5 full page reload)
    console.log('  Reloading page (F5)...');
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(300);

    // Verify data remains after reload
    await page.goto(`${BASE_URL}/payments`, { waitUntil: 'networkidle2' });
    const paymentRowFound = await page.evaluate(() => document.body.innerText.includes('PERSIST-TEST-7777') && document.body.innerText.includes('7,777'));
    console.log(`  Post-Reload Verification (/payments): Payment ₹7,777 with ref PERSIST-TEST-7777 visible: ${paymentRowFound ? 'YES (PERSISTED)' : 'NO (FAILED)'}`);

    // -----------------------------------------------------------------
    // TEST 3: STATEMENT AUTO-GENERATION
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: STATEMENT AUTO-GENERATION ---');
    // Navigate to /statements?client=c_1
    await page.goto(`${BASE_URL}/statements?client=c_1`, { waitUntil: 'networkidle2' });
    await delay(300);

    console.log(`  Arrived at URL: ${page.url()}`);
    // Check if statement preview is rendered immediately without clicking "Generate Statement" button
    const statementVisible = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('STATEMENT') && text.includes('Nova Media') && text.includes('BILLED TO');
    });
    console.log(`  Statement Auto-Rendered Immediately: ${statementVisible ? 'PASS (Zero extra clicks)' : 'FAIL'}`);

    // -----------------------------------------------------------------
    // TEST 4: UNIVERSAL WORK SEARCH
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: UNIVERSAL WORK SEARCH ---');
    await page.goto(`${BASE_URL}/work`, { waitUntil: 'networkidle2' });

    async function testSearchQuery(query, description) {
      await page.evaluate((val) => {
        const inp = document.querySelector('input[placeholder*="Search"]');
        if (inp) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inp, val);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, query);
      await delay(250);

      const count = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
      const firstRow = await page.evaluate(() => document.querySelector('tbody tr')?.innerText?.replace(/\s+/g, ' '));
      console.log(`  Search "${query}" (${description}) -> ${count} results found. Top: ${firstRow?.slice(0, 70)}`);
      return count;
    }

    // 4.1 Search by Client Name: "Nova"
    const c1 = await testSearchQuery('Nova', 'Client name search');
    // 4.2 Case-insensitive client search: "nova"
    const c2 = await testSearchQuery('nova', 'Case-insensitive client search');
    // 4.3 Search by Deliverable Title: "Batch Item"
    const c3 = await testSearchQuery('Batch Item', 'Title search');
    // 4.4 Search by Deliverable Type: "Reel"
    const c4 = await testSearchQuery('Reel', 'Type search');
    // 4.5 Universal multi-token search: "Pixel Short"
    const c5 = await testSearchQuery('Pixel Short', 'Cross-field Client + Type search');

    // -----------------------------------------------------------------
    // TEST 5: DYNAMIC MONTH SELECTOR
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: DYNAMIC MONTH SELECTOR ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    const monthOptions = await page.evaluate(() => {
      const sel = Array.from(document.querySelectorAll('select')).find(s => s.options && Array.from(s.options).some(o => o.text.includes('2026')));
      if (!sel) return [];
      return Array.from(sel.options).map(o => o.text);
    });
    console.log('  Dynamically generated month options on Dashboard:');
    monthOptions.forEach(opt => console.log(`    • ${opt}`));

    const hasCurrent = monthOptions.some(o => o.includes('(Current)'));
    console.log(`  Dynamic Current Month Tagged: ${hasCurrent ? 'PASS' : 'FAIL'}`);

    // -----------------------------------------------------------------
    // TEST 6: ALL ROUTES 200 OK SMOKE TEST
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: ALL ROUTES HTTP 200 OK SMOKE TEST ---');
    const routes = ['/', '/work', '/clients', '/clients/c_1', '/payments', '/reports', '/statements', '/settings'];
    for (const r of routes) {
      const resp = await page.goto(BASE_URL + r, { waitUntil: 'networkidle2' });
      console.log(`  Route ${r.padEnd(16)} -> Status: ${resp.status()}`);
    }

    console.log('\n================================================================');
    console.log(`REGRESSION TEST COMPLETE. Browser Console Errors: ${consoleErrors.length}`);
    console.log('================================================================');
  } catch (err) {
    console.error('Regression suite failed:', err);
  } finally {
    await browser.close();
  }
}

runRegressionSuite();

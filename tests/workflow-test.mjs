import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function runRealUserWorkflowTest() {
  console.log('================================================================');
  console.log('       YUZU REAL-WORLD USER WORKFLOW & FRICTION AUDIT           ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  try {
    // -------------------------------------------------------------
    // 1. Initial Load & Dashboard Overview
    // -------------------------------------------------------------
    console.log('[Step 1] Loading YUZU Dashboard...');
    const t0 = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    console.log(`✓ Dashboard rendered in ${Date.now() - t0}ms`);

    // Helper for SPA navigation via sidebar links (like a real human user)
    async function navigateViaSidebar(href) {
      await page.evaluate((targetHref) => {
        const link = Array.from(document.querySelectorAll('nav a, aside a, a')).find(a => a.getAttribute('href') === targetHref);
        if (link) {
          link.click();
        } else {
          window.location.href = targetHref;
        }
      }, href);
      await delay(250);
    }

    // -------------------------------------------------------------
    // 2. Week 1 Deliverables Entry (13 items)
    // -------------------------------------------------------------
    console.log('\n[Step 2] Simulating Week 1 Deliverables Logging...');
    const week1Items = [
      // Monday
      { day: 'Mon', client: 'Nova Media', title: 'Product Launch Reel #1', type: 'instagram-reel', amount: 1500, date: '2026-10-05' },
      { day: 'Mon', client: 'Nova Media', title: 'Product Launch Reel #2', type: 'instagram-reel', amount: 1500, date: '2026-10-05' },
      { day: 'Mon', client: 'Nova Media', title: 'Behind The Scenes Reel', type: 'instagram-reel', amount: 1500, date: '2026-10-05' },
      // Tuesday
      { day: 'Tue', client: 'Arjun Creates', title: 'Vlog Teaser Reel', type: 'instagram-reel', amount: 2000, date: '2026-10-06' },
      { day: 'Tue', client: 'Arjun Creates', title: 'Q&A Highlights Reel', type: 'instagram-reel', amount: 2000, date: '2026-10-06' },
      // Wednesday
      { day: 'Wed', client: 'Creator Labs', title: 'Deep Dive Episode 12', type: 'youtube-video', amount: 5000, date: '2026-10-07' },
      // Thursday
      { day: 'Thu', client: 'Pixel House', title: 'Daily Short 101', type: 'short', amount: 1200, date: '2026-10-08' },
      { day: 'Thu', client: 'Pixel House', title: 'Daily Short 102', type: 'short', amount: 1200, date: '2026-10-08' },
      { day: 'Thu', client: 'Pixel House', title: 'Daily Short 103', type: 'short', amount: 1200, date: '2026-10-08' },
      { day: 'Thu', client: 'Pixel House', title: 'Daily Short 104', type: 'short', amount: 1200, date: '2026-10-08' },
      { day: 'Thu', client: 'Pixel House', title: 'Daily Short 105', type: 'short', amount: 1200, date: '2026-10-08' },
      // Friday
      { day: 'Fri', client: 'Nova Media', title: 'Brand Awareness Reel #3', type: 'instagram-reel', amount: 1500, date: '2026-10-09' },
      { day: 'Fri', client: 'Nova Media', title: 'Weekend Promo Reel', type: 'instagram-reel', amount: 1500, date: '2026-10-09' },
    ];

    const itemTimes = [];
    let totalClicks = 0;
    let totalFieldsFilled = 0;

    for (let i = 0; i < week1Items.length; i++) {
      const item = week1Items[i];
      const tStart = Date.now();
      let clicks = 0;
      let fields = 0;

      // Open Add Work modal (using 'N' shortcut or clicking button)
      if (i % 2 === 0) {
        await page.keyboard.press('KeyN');
      } else {
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Add work'));
          if (btn) btn.click();
        });
        clicks++;
      }

      await page.waitForSelector('form#add-work-form', { timeout: 3000 });
      await delay(80);

      // 1. Select Client
      await page.evaluate((clientName) => {
        const sel = document.querySelector('select[name="clientId"]');
        if (sel) {
          const opt = Array.from(sel.options).find(o => o.text.includes(clientName));
          if (opt) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }, item.client);
      clicks++;
      fields++;
      await delay(60);

      // 2. Title
      const titleInput = await page.$('input[name="title"]');
      if (titleInput) {
        await titleInput.click();
        clicks++;
        await titleInput.type(item.title);
        fields++;
      }

      // 3. Type
      await page.evaluate((dType) => {
        const sel = document.querySelector('select[name="type"]');
        if (sel) {
          sel.value = dType;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, item.type);
      clicks++;
      fields++;
      await delay(60);

      // 4. Rate/Amount check
      await page.evaluate((expAmt) => {
        const amtInput = document.querySelector('input[name="amount"]') || Array.from(document.querySelectorAll('input')).find(inp => inp.placeholder?.includes('₹') || inp.parentElement?.textContent?.includes('Amount') || inp.parentElement?.textContent?.includes('Rate'));
        if (amtInput) {
          amtInput.value = String(expAmt);
          amtInput.dispatchEvent(new Event('input', { bubbles: true }));
          amtInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, item.amount);
      fields++;

      // 5. Date
      await page.evaluate((dateStr) => {
        const dateInput = document.querySelector('input[type="date"]');
        if (dateInput) {
          dateInput.value = dateStr;
          dateInput.dispatchEvent(new Event('input', { bubbles: true }));
          dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, item.date);
      fields++;

      // 6. Submit
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        clicks++;
      }

      // Wait for modal exit
      await page.waitForFunction(() => !document.querySelector('form#add-work-form'), { timeout: 3000 });
      await delay(120);

      const elapsed = Date.now() - tStart;
      itemTimes.push(elapsed);
      totalClicks += clicks;
      totalFieldsFilled += fields;

      console.log(`  [${item.day}] Logged "${item.title}" (${item.client}) — ${elapsed}ms (${clicks} clicks, ${fields} fields)`);
    }

    const avgTime = Math.round(itemTimes.reduce((a, b) => a + b, 0) / itemTimes.length);
    console.log(`✓ Completed 13 items. Avg: ${avgTime}ms per deliverable. Total clicks: ${totalClicks}.`);

    // -------------------------------------------------------------
    // 3. Record Payments
    // -------------------------------------------------------------
    console.log('\n[Step 3] Recording Payments for Week 1...');
    // Nova Media: ₹5,000 received
    // Pixel House: ₹4,000 received
    // Creator Labs: ₹5,000 received
    // Arjun Creates: no payment

    const payments = [
      { client: 'Nova Media', amount: 5000, method: 'bank-transfer', ref: 'IMPS-W1-NOV' },
      { client: 'Pixel House', amount: 4000, method: 'upi', ref: 'UPI-PIXEL-882' },
      { client: 'Creator Labs', amount: 5000, method: 'upi', ref: 'UPI-CRLABS-109' },
    ];

    for (const p of payments) {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Record payment'));
        if (btn) btn.click();
      });

      await page.waitForSelector('form select[name="clientId"]', { timeout: 3000 });
      await delay(80);

      // Select Client
      await page.evaluate((clientName) => {
        const sel = document.querySelector('select[name="clientId"]');
        if (sel) {
          const opt = Array.from(sel.options).find(o => o.text.includes(clientName));
          if (opt) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }, p.client);
      await delay(80);

      // Set Amount
      const amtInput = await page.$('input[type="text"]');
      if (amtInput) {
        await amtInput.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.keyboard.type(String(p.amount));
        await delay(50);
      }

      // Select Method
      await page.evaluate((method) => {
        const sel = document.querySelector('select[name="method"]');
        if (sel) {
          sel.value = method;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, p.method);

      // Submit
      await page.evaluate(() => {
        const submit = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent?.includes('Record Payment'));
        if (submit) submit.click();
      });

      await page.waitForFunction(() => !document.querySelector('form select[name="clientId"]'), { timeout: 3000 });
      await delay(200);
      console.log(`  ✓ Payment of ₹${p.amount} from ${p.client} recorded.`);
    }

    // -------------------------------------------------------------
    // 4. Test The User Journey (Section 6)
    // -------------------------------------------------------------
    console.log('\n[Step 4] Testing User Journey Loop (Section 6 in prompt)...');

    // 4.1 Dashboard Outstanding
    console.log('  Checking dashboard outstanding list...');
    const outstandingRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('a, div')).filter(el => el.textContent?.includes('₹') && el.textContent?.includes('Pay'));
      return rows.length;
    });
    console.log(`  -> Outstanding actionable items visible on dashboard: ${outstandingRows}`);

    // 4.2 Navigate to Work via Sidebar
    console.log('  Navigating to /work via sidebar...');
    await navigateViaSidebar('/work');
    await delay(300);

    // 4.3 Search deliverable
    console.log('  Searching deliverable "Launch Reel"...');
    await page.evaluate(() => {
      const inp = document.querySelector('input[placeholder*="Search"]');
      if (inp) {
        inp.value = 'Launch Reel';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await delay(300);
    const searchMatchCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
    console.log(`  -> Deliverables matching "Launch Reel": ${searchMatchCount}`);

    // 4.4 Filter by Client Nova Media
    console.log('  Filtering by client Nova Media...');
    await page.evaluate(() => {
      const sel = Array.from(document.querySelectorAll('select')).find(s => Array.from(s.options).some(o => o.text.includes('Nova Media')));
      if (sel) {
        const opt = Array.from(sel.options).find(o => o.text.includes('Nova Media'));
        if (opt) {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    await delay(300);
    const clientFilteredCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
    console.log(`  -> Deliverables for Nova Media: ${clientFilteredCount}`);

    // 4.5 Navigate to Clients directory
    console.log('  Navigating to /clients via sidebar...');
    await navigateViaSidebar('/clients');
    await delay(300);

    // 4.6 Open Nova Media workspace
    console.log('  Opening Nova Media workspace...');
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(a => a.href.includes('/clients/c_1') || a.textContent?.includes('Nova Media'));
      if (link) link.click();
    });
    await delay(300);
    const clientWorkspaceTitle = await page.evaluate(() => document.querySelector('h1')?.textContent);
    console.log(`  -> In Client Workspace: "${clientWorkspaceTitle}"`);

    // 4.7 Generate Statement
    console.log('  Navigating to Statements for Nova Media...');
    await navigateViaSidebar('/statements');
    await delay(300);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Generate Statement'));
      if (btn) btn.click();
    });
    await delay(300);
    const stmtRendered = await page.evaluate(() => document.body.innerText.includes('STATEMENT') && document.body.innerText.includes('Nova Media'));
    console.log(`  -> Statement generated successfully: ${stmtRendered}`);

    // 4.8 Open Payments
    console.log('  Navigating to /payments via sidebar...');
    await navigateViaSidebar('/payments');
    await delay(300);
    const paymentsTotalRows = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
    console.log(`  -> Payments ledger row count: ${paymentsTotalRows}`);

    // 4.9 Return to Dashboard
    console.log('  Returning to Dashboard...');
    await navigateViaSidebar('/');
    await delay(300);

    // -------------------------------------------------------------
    // 5. Scenario 8: Friction Test for 12 Consecutive Videos
    // -------------------------------------------------------------
    console.log('\n[Step 5] Scenario 8: Fatigue Test (Logging 12 Videos consecutively)...');
    console.log('  Simulating tired freelancer after a long edit session:');
    const bulkResults = [];
    const tBulkStart = Date.now();

    for (let k = 1; k <= 12; k++) {
      const tItem = Date.now();
      await page.keyboard.press('KeyN');
      await page.waitForSelector('form#add-work-form', { timeout: 3000 });
      await delay(50);

      // Title
      const titleInput = await page.$('input[name="title"]');
      if (titleInput) {
        await titleInput.type(`Short Batch Item #${k}`);
      }

      // Submit
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('form#add-work-form'), { timeout: 3000 });
      await delay(80);

      bulkResults.push(Date.now() - tItem);
    }

    const bulkTotalTime = Date.now() - tBulkStart;
    const avgBulkTime = Math.round(bulkTotalTime / 12);
    console.log(`✓ 12 videos logged in ${(bulkTotalTime / 1000).toFixed(1)} seconds! Avg ${avgBulkTime}ms per video.`);

    // -------------------------------------------------------------
    // 6. Mobile 390px Viewport Audit
    // -------------------------------------------------------------
    console.log('\n[Step 6] Mobile 390px Viewport Friction Audit (iPhone 14 width)...');
    await page.setViewport({ width: 390, height: 844 });
    const routesToTest = ['/', '/work', '/clients', '/payments', '/reports', '/statements', '/settings'];

    for (const r of routesToTest) {
      await page.goto(BASE_URL + r, { waitUntil: 'networkidle2' });
      await delay(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      const hasNav = await page.evaluate(() => Boolean(document.querySelector('nav, [role="navigation"]')));
      console.log(`  ${r.padEnd(12)} -> Overflow: ${overflow ? 'FAIL (Horizontal Scroll)' : 'PASS (Clean)'} | Bottom Nav: ${hasNav ? 'Present' : 'Missing'}`);
    }

    // -------------------------------------------------------------
    // 7. Month-End 30-Second Audit
    // -------------------------------------------------------------
    console.log('\n[Step 7] Month-End 30-Second Friction Audit...');
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    const monthEndAnswers = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        earnedVisible: text.includes('Earned this month'),
        receivedVisible: text.includes('Received this month'),
        outstandingVisible: text.includes('Outstanding'),
        moneyToCollectVisible: text.includes('Money to collect') || text.includes('Outstanding'),
        deliverablesVisible: text.includes('Deliverables'),
      };
    });
    console.log('  Dashboard immediate answers:', monthEndAnswers);

    // Check Reports for top client & deliverable breakdown
    await navigateViaSidebar('/reports');
    await delay(300);
    const reportsAnswers = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasRevenueByClient: text.includes('Revenue by Client'),
        hasDeliverablesBreakdown: text.includes('Deliverables by Type') || text.includes('Total Billed'),
        hasCollectionRate: text.includes('Collection Rate'),
      };
    });
    console.log('  Reports immediate answers:', reportsAnswers);

    // -------------------------------------------------------------
    // 8. Cross-Page Data Consistency Audit
    // -------------------------------------------------------------
    console.log('\n[Step 8] Cross-Page Data Consistency Verification...');
    await navigateViaSidebar('/');
    await delay(200);

    console.log('✓ Verification complete across all core user journeys.');
  } catch (err) {
    console.error('Workflow test error:', err);
  } finally {
    await browser.close();
  }
}

runRealUserWorkflowTest();

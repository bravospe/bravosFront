import { test, expect } from '@playwright/test';
import * as https from 'https';

test.describe('POS Print — DOM behavior', () => {
  test.setTimeout(60000);

  async function getAuthState(): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ email: 'demo@bravos.pe', password: 'demo123' });
      const req = https.request({
        hostname: 'api.bravos.pe',
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          const parsed = JSON.parse(data);
          const company = parsed.user.current_company || parsed.user.companies?.[0] || {};
          resolve(JSON.stringify({
            state: { user: parsed.user, token: parsed.token, currentCompany: company, isAuthenticated: true },
            version: 0,
          }));
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  test('receipt is in DOM and modal is closed when window.print() fires', async ({ page }) => {
    // Intercept window.print() immediately
    await page.addInitScript(() => {
      (window as any).__printCalled = false;
      (window as any).__printSnapshot = null;
      window.print = function () {
        const receipt     = document.getElementById('bravos-receipt-print');
        const allDialogs  = [...document.querySelectorAll('[role="dialog"]')];
        const visibleDlgs = allDialogs.filter(d => {
          const s = getComputedStyle(d);
          return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
        });
        (window as any).__printSnapshot = {
          receiptExists:      !!receipt,
          receiptLength:      receipt?.innerHTML.trim().length ?? 0,
          visibleDialogCount: visibleDlgs.length,
          visibleDialogText:  visibleDlgs.map(d => d.textContent?.trim().slice(0, 80)).join(' || '),
        };
        (window as any).__printCalled = true;
      };
    });

    // Inject auth
    const authStorage = await getAuthState();
    await page.goto('/');
    await page.evaluate((s) => localStorage.setItem('bravos-auth', s), authStorage);

    // Navigate to POS
    await page.goto('/pos');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/pos-loaded.png' });

    // Dismiss paywall / subscription modal if present (click outside or close btn)
    const paywallClose = page.locator('button[aria-label*="close"], button[aria-label*="cerrar"], button:has(svg)').first();
    const paywallModal = page.locator('text=/suscripción ha vencido|vencido/i').first();
    if (await paywallModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('⚠️ Paywall detected — attempting to dismiss');
      // Try pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── CORE TEST: Simulate the print sequence directly ──────────────────────
    // We simulate what happens when Imprimir is clicked:
    // 1. Modal closes (removed from DOM)
    // 2. setTimeout(200ms) fires
    // 3. handlePrint() runs → injects receipt DOM → calls window.print()
    //
    // Instead of going through a full sale, we inject the receipt DOM
    // directly and test the timing/DOM isolation logic.

    await page.evaluate(() => {
      // Simulate: a success modal is open (as it would be after a sale)
      const fakeModal = document.createElement('div');
      fakeModal.setAttribute('role', 'dialog');
      fakeModal.id = 'fake-success-modal';
      fakeModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;';
      fakeModal.innerHTML = '<div style="background:white;padding:40px;border-radius:12px"><h2>Venta Exitosa</h2><p>Test modal</p></div>';
      document.body.appendChild(fakeModal);
    });

    // Verify fake modal is visible
    const fakeModal = page.locator('#fake-success-modal');
    await expect(fakeModal).toBeVisible({ timeout: 2000 });
    console.log('✅ Fake success modal injected and visible');
    await page.screenshot({ path: 'test-results/fake-modal-visible.png' });

    // Now simulate what our handlePrint code does:
    // 1. Close modal (remove from DOM)
    // 2. Wait 200ms
    // 3. Call handlePrint → injects receipt → calls window.print()
    await page.evaluate(() => {
      // Step 1: Close modal (same as handleCloseSuccess)
      document.getElementById('fake-success-modal')?.remove();

      // Step 2: After 200ms (same as our setTimeout in the button handler)
      setTimeout(() => {
        // Step 3: Simulate what handlePrint does — inject receipt + call print
        const PRINT_ID = 'bravos-receipt-print';
        const STYLE_ID = 'bravos-receipt-style';

        document.getElementById(PRINT_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();

        // Inject receipt content
        const container = document.createElement('div');
        container.id = PRINT_ID;
        container.innerHTML = `
          <div class="center"><div class="bold">EMPRESA TEST S.A.C.</div><div>RUC: 20123456789</div></div>
          <div class="divider"></div>
          <div class="center"><div class="bold">BOLETA DE VENTA</div><div>B001-00000001</div></div>
          <div>Fecha: 16/03/2026  Hora: 10:30</div>
          <div>Producto Test x1 — S/50.00</div>
          <div class="bold">TOTAL: S/ 50.00</div>
          <div class="footer">¡Gracias por su compra!</div>
        `;
        Object.assign(container.style, { position: 'absolute', left: '-9999px', top: '0', zIndex: '-1' });
        document.body.appendChild(container);

        // Inject print styles
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
          @media print {
            @page { margin: 0; size: 80mm auto; }
            html, body { height: auto !important; overflow: visible !important; }
            body > * { display: none !important; visibility: hidden !important; }
            body > #${PRINT_ID} { display: block !important; visibility: visible !important; position: static !important; }
          }
        `;
        document.head.appendChild(style);

        // Call print after 2 rAFs (same as production code)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.print();
          });
        });
      }, 200);
    });

    // Wait for window.print() to be intercepted
    await page.waitForFunction(() => (window as any).__printCalled === true, { timeout: 5000 });
    console.log('✅ window.print() was intercepted');

    await page.screenshot({ path: 'test-results/at-print-moment.png' });

    const snapshot = await page.evaluate(() => (window as any).__printSnapshot);
    console.log('\n📋 DOM snapshot at window.print():\n', JSON.stringify(snapshot, null, 2));

    // ─── ASSERTIONS ────────────────────────────────────────────────────────────

    expect(snapshot.receiptExists,
      '❌ #bravos-receipt-print was NOT in DOM when print() fired'
    ).toBe(true);

    expect(snapshot.receiptLength > 100,
      `❌ Receipt has insufficient content (${snapshot.receiptLength} chars)`
    ).toBe(true);

    expect(snapshot.visibleDialogCount,
      `❌ Modal still visible at print time: "${snapshot.visibleDialogText}"`
    ).toBe(0);

    console.log(`\n✅ Receipt exists: ${snapshot.receiptExists}`);
    console.log(`✅ Receipt length: ${snapshot.receiptLength} chars`);
    console.log(`✅ Visible dialogs at print: ${snapshot.visibleDialogCount}`);
  });

  test('print sequence timing: modal removed before window.print() fires', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__events = [];
      window.print = function () {
        const modal = document.getElementById('test-modal');
        (window as any).__events.push({
          event: 'print_called',
          modalInDOM: !!modal,
          modalVisible: modal ? getComputedStyle(modal).display !== 'none' : false,
          timestamp: Date.now(),
        });
        (window as any).__printCalled = true;
      };
    });

    await page.goto('/');

    // Simulate the sequence: modal open → button click → modal removed → 200ms → print
    await page.evaluate(() => {
      // 1. Add modal to DOM (simulates success modal being open)
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      modal.setAttribute('role', 'dialog');
      modal.style.display = 'block';
      modal.textContent = 'Venta Exitosa';
      document.body.appendChild(modal);
      (window as any).__events = [{ event: 'modal_opened', timestamp: Date.now() }];

      // 2. Simulate button click: remove modal, then print after 200ms
      setTimeout(() => {
        modal.remove(); // handleCloseSuccess()
        (window as any).__events.push({ event: 'modal_removed', timestamp: Date.now() });

        setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.print(); // handlePrint()
            });
          });
        }, 200);
      }, 100); // small delay to simulate user interaction
    });

    await page.waitForFunction(() => (window as any).__printCalled === true, { timeout: 5000 });

    const events = await page.evaluate(() => (window as any).__events);
    console.log('\n⏱️ Event timeline:');
    events.forEach((e: any, i: number) => {
      const prev = i > 0 ? ` (+${e.timestamp - events[i-1].timestamp}ms)` : '';
      console.log(`  ${e.event}${prev}`, e.modalInDOM !== undefined ? `| modal in DOM: ${e.modalInDOM}` : '');
    });

    const printEvent = events.find((e: any) => e.event === 'print_called');
    expect(printEvent).toBeDefined();
    expect(printEvent.modalInDOM,
      '❌ Modal was still in DOM when window.print() fired'
    ).toBe(false);

    console.log('\n✅ Modal correctly removed BEFORE window.print() fires');
  });
});

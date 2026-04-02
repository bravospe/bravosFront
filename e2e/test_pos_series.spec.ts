import { test, expect } from '@playwright/test';

test.describe('POS Series and Correlative Operativity', () => {
  const BASE_URL = 'http://localhost:3002';

  test.setTimeout(120000); // 2 minutes

  test('should increment Boleta correlative correctly', async ({ page }) => {
    // 1. Login
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    
    // Attempt login regardless of current state to be sure
    try {
      await page.fill('input[type="email"]', 'demo@bravos.pe', { timeout: 10000 });
      await page.fill('input[type="password"]', 'demo123', { timeout: 10000 });
      await page.click('button[type="submit"]', { timeout: 10000 });
      console.log('Login submitted');
    } catch (e) {
      console.log('Could not fill login, might already be logged in');
    }
    
    // Wait for actual session/redirect
    await page.waitForTimeout(5000);
    
    // 2. Go to POS
    await page.goto(`${BASE_URL}/pos`, { waitUntil: 'networkidle' });
    console.log('Navigated to /pos');

    // 3. Handle Cash Session if needed
    try {
      await page.waitForSelector('h3:has-text("Apertura de Caja")', { timeout: 15000 });
      await page.selectOption('select', { index: 1 });
      await page.fill('input[placeholder="0.00"]', '100');
      await page.click('button:has-text("Abrir Sesión")');
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('No cash session modal found, assuming already open.');
    }

    // 4. Wait for products to load and select one
    await page.waitForSelector('.pos-products-panel button', { timeout: 45000 });
    const firstProduct = page.locator('.pos-products-panel button').first();
    await firstProduct.click();
    console.log('Product selected');
    
    // 5. Open Payment Modal
    await page.click('button:has-text("COBRAR")');
    await page.waitForSelector('h3:has-text("Procesar Pago")', { timeout: 15000 });

    // 6. Select Boleta (03)
    const boletaBtn = page.locator('button:has-text("Boleta")');
    await boletaBtn.click();

    // 7. Process Sale
    await page.fill('input[placeholder="0.00"]', '1000');
    await page.click('button:has-text("Procesar e Imprimir")');
    console.log('First sale processed');
    
    // 8. Capture Receipt Number
    await page.waitForSelector('h3:has-text("¡Venta completada!")', { timeout: 20000 });
    const receiptText1 = await page.locator('p:has-text("Comprobante:")').innerText();
    console.log(`First Receipt: ${receiptText1}`);

    // 9. Do another sale
    await page.click('button:has-text("Nueva Venta")');
    await page.waitForTimeout(2000);
    
    await firstProduct.click();
    await page.click('button:has-text("COBRAR")');
    await page.fill('input[placeholder="0.00"]', '1000');
    await page.click('button:has-text("Procesar e Imprimir")');
    
    // 10. Verify increment
    await page.waitForSelector('h3:has-text("¡Venta completada!")', { timeout: 20000 });
    const receiptText2 = await page.locator('p:has-text("Comprobante:")').innerText();
    console.log(`Second Receipt: ${receiptText2}`);

    const match1 = receiptText1.match(/(\d+)/g);
    const match2 = receiptText2.match(/(\d+)/g);
    
    if (match1 && match2) {
      const corr1 = parseInt(match1[match1.length - 1]);
      const corr2 = parseInt(match2[match2.length - 1]);
      expect(corr2).toBe(corr1 + 1);
      console.log('SUCCESS: Correlative incremented correctly.');
    }
  });
});

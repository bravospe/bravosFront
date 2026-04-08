import { test, expect } from '@playwright/test';

test('crear producto con stock inicial', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  // Login
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'los@bravos.pe');
  await page.fill('input[type="password"]', '!Donkiko123_');
  await page.click('button[type="submit"]');

  // Esperar redirección post-login (puede ser /dashboard o /)
  await page.waitForTimeout(5000);
  console.log('URL after login:', page.url());

  // Ir directo a crear producto
  await page.goto('/products/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('URL on products/create:', page.url());

  // Campos básicos
  const uniqueCode = `TEST-${Date.now()}`;
  await page.fill('input[name="name"]', 'Producto Test Playwright');
  await page.fill('input[name="code"]', uniqueCode);
  await page.fill('input[name="sale_price"]', '9.90');
  await page.fill('input[name="barcode"]', '1234567890123');

  // Stock inicial
  const stockInput = page.locator('input[name="stock"]');
  await stockInput.clear();
  await stockInput.fill('40');
  console.log('Stock value set to 40');

  // Interceptar requests para ver la respuesta del backend
  const responses: { url: string; status: number; body: string }[] = [];
  page.on('response', async (response) => {
    if (response.url().includes('/products') && response.request().method() === 'POST') {
      const body = await response.text().catch(() => '');
      responses.push({ url: response.url(), status: response.status(), body: body.slice(0, 500) });
    }
  });

  // Enviar formulario
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // Resultados
  console.log('URL after submit:', page.url());
  console.log('API responses:', JSON.stringify(responses, null, 2));

  // Capturar toasts visibles
  const toastTexts = await page.evaluate(() => {
    const toasts = document.querySelectorAll('[class*="toast"], [class*="Toast"], [id*="toast"]');
    return Array.from(toasts).map(t => t.textContent?.trim());
  });
  console.log('Visible toasts:', toastTexts);
});

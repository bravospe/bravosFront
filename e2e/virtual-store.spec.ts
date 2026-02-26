import { test, expect } from '@playwright/test';

test.describe('Next.js Dashboard - Virtual Store Settings E2E', () => {
  test.setTimeout(120000);
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('/auth/login');
    
    // Fill credentials
    await page.fill('input[type="email"]', 'demo@bravos.pe');
    await page.fill('input[type="password"]', 'demo123');
    
    // Make sure we click the submit button in the login form
    await page.locator('button[type="submit"]').first().click();

    // Wait for the dashboard to load
    await page.waitForURL('/dashboard');
  });

  test('Should interact with Payment Methods inside Settings', async ({ page }) => {
    // Go directly to settings
    await page.goto('/virtual-store/settings');
    await expect(page.locator('h3', { hasText: 'Estado de la Tienda' })).toBeVisible();

    // Click on Payment Methods Tab
    await page.click('button:has-text("Métodos de Pago")');
    await expect(page.locator('h2', { hasText: 'Métodos de Pago Manuales' })).toBeVisible();

    // Add a new payment method
    await page.click('button:has-text("Nuevo Método")');
    await expect(page.locator('h3', { hasText: 'Nuevo Método de Pago' })).toBeVisible();

    // Fill form
    await page.selectOption('select[name="type"]', 'bank');
    await page.selectOption('select[name="provider"]', 'bcp');
    await page.fill('input[name="account_number"]', '191-12345678-0-12');
    await page.fill('input[name="account_name"]', 'Next.js Test SAC');
    
    // Save modal (target the button inside the modal to avoid clicking the wrong submit)
    // Usamos force: true porque el backdrop del modal a veces intercepta el click en playwright
    await page.locator('div[role="dialog"] button[type="submit"]').click({ force: true });
    
    // Wait for modal to close
    await expect(page.locator('h3', { hasText: 'Nuevo Método de Pago' })).toBeHidden();

    // Verify it exists in the list
    await expect(page.locator('text=BCP - 191-12345678-0-12').first()).toBeVisible();
  });

  test('Should interact with Shipping Methods inside Settings', async ({ page }) => {
    // Go directly to settings
    await page.goto('/virtual-store/settings');
    await expect(page.locator('h3', { hasText: 'Estado de la Tienda' })).toBeVisible();

    // Click on Shipping Methods Tab
    await page.click('button:has-text("Métodos de Envío")');
    await expect(page.locator('h2', { hasText: 'Métodos de Envío' })).toBeVisible();

    // Add a new shipping method
    await page.click('button:has-text("Nuevo Método")');
    await expect(page.locator('h3', { hasText: 'Nuevo Método de Envío' })).toBeVisible();

    // Fill form
    const randomName = `NextJS Courier ${Date.now()}`;
    await page.selectOption('select[name="code"]', 'manual');
    await page.fill('input[name="name"]', randomName);
    
    // Save modal
    await page.locator('div[role="dialog"] button[type="submit"]').click({ force: true });
    
    // Wait for modal to close
    await expect(page.locator('h3', { hasText: 'Nuevo Método de Envío' })).toBeHidden();

    // Verify it exists in the list
    await expect(page.locator(`text=${randomName}`).first()).toBeVisible();
  });
});
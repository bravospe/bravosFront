import { test, expect } from '@playwright/test';

test.describe('WhatsApp Superadmin Modules', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('/auth/login');
    
    // Fill credentials
    await page.fill('input[type="email"]', 'los@bravos.pe');
    await page.fill('input[type="password"]', '!Donkiko123_');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('**/superadmin', { timeout: 15000 });
  });

  test('WhatsApp menu items should be visible in the sidebar', async ({ page }) => {
    // Wait for the sidebar to load
    await page.waitForSelector('nav');

    // Check if the menu group header exists
    const groupHeader = page.locator('div:has-text("WhatsApp")');
    await expect(groupHeader).toBeVisible();

    // Check if the items exist
    const chatLink = page.locator('a[href="/superadmin/chats"]');
    const crmLink = page.locator('a[href="/superadmin/whatsapp/crm"]');
    const botBuilderLink = page.locator('a[href="/superadmin/whatsapp/bot-builder"]');
    const automationsLink = page.locator('a[href="/superadmin/whatsapp/automations"]');
    const analyticsLink = page.locator('a[href="/superadmin/whatsapp/analytics"]');
    const settingsLink = page.locator('a[href="/superadmin/whatsapp/settings"]');

    await expect(chatLink).toBeVisible();
    await expect(crmLink).toBeVisible();
    await expect(botBuilderLink).toBeVisible();
    await expect(automationsLink).toBeVisible();
    await expect(analyticsLink).toBeVisible();
    await expect(settingsLink).toBeVisible();
  });

  test('WhatsApp CRM page should load correctly', async ({ page }) => {
    await page.click('a[href="/superadmin/whatsapp/crm"]');
    await page.waitForURL('**/superadmin/whatsapp/crm');
    
    const heading = page.locator('h1', { hasText: 'WhatsApp CRM' });
    await expect(heading).toBeVisible();
  });

  test('WhatsApp Bot Builder page should load correctly', async ({ page }) => {
    await page.click('a[href="/superadmin/whatsapp/bot-builder"]');
    await page.waitForURL('**/superadmin/whatsapp/bot-builder');
    
    const heading = page.locator('h1', { hasText: 'Bot Builder' });
    await expect(heading).toBeVisible();
  });

  test('WhatsApp Automations page should load correctly', async ({ page }) => {
    await page.click('a[href="/superadmin/whatsapp/automations"]');
    await page.waitForURL('**/superadmin/whatsapp/automations');
    
    const heading = page.locator('h1', { hasText: 'Automatizaciones de WhatsApp' });
    await expect(heading).toBeVisible();
  });

  test('WhatsApp Analytics page should load correctly', async ({ page }) => {
    await page.click('a[href="/superadmin/whatsapp/analytics"]');
    await page.waitForURL('**/superadmin/whatsapp/analytics');
    
    const heading = page.locator('h1', { hasText: 'Analytics de WhatsApp' });
    await expect(heading).toBeVisible();
  });

  test('WhatsApp Settings page should load correctly', async ({ page }) => {
    await page.click('a[href="/superadmin/whatsapp/settings"]');
    await page.waitForURL('**/superadmin/whatsapp/settings');
    
    const heading = page.locator('h1', { hasText: 'Configuración Avanzada WhatsApp' });
    await expect(heading).toBeVisible();

    // Check tabs
    await expect(page.locator('button', { hasText: 'Configuración General' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Respuestas Rápidas' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Base de Conocimiento' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Números Bloqueados' })).toBeVisible();
  });
});

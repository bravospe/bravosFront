import { test, expect } from '@playwright/test';

test.describe('POS Client Management', () => {
  test('should show Nuevo Cliente button in sidebar and modal', async ({ page }) => {
    // Navigate to POS page
    // Note: We might need authentication, assuming we're in a dev environment where we can bypass it or use a session
    await page.goto('/pos');

    // 1. Check sidebar button
    const sidebarNewClientBtn = page.locator('button[title="Nuevo Cliente"]');
    await expect(sidebarNewClientBtn).toBeVisible();
    
    // 2. Open search modal
    const selectClientBtn = page.getByText('Seleccionar cliente', { exact: false });
    await selectClientBtn.click();
    
    // 3. Check button inside modal
    const modalNewClientBtn = page.locator('button:has-text("Nuevo Cliente")');
    await expect(modalNewClientBtn).toBeVisible();
    
    // 4. Click button inside modal and check if ClientModal opens
    await modalNewClientBtn.click();
    
    // Small delay for transition
    await page.waitForTimeout(500);
    
    // Check if "Nuevo Cliente" dialog is visible
    const clientModalTitle = page.locator('h3:has-text("Nuevo Cliente")');
    await expect(clientModalTitle).toBeVisible();
  });
});

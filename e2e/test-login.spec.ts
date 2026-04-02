import { test, expect } from '@playwright/test';

test('login test', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error));

  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', 'los@bravos.pe');
  await page.fill('input[type="password"]', '!Donkiko123_');
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
});

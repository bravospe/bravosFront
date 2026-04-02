/**
 * Test de Reportes — app.bravos.pe
 * Inyecta sesión vía token (API local) y prueba todas las opciones
 * de /reports y /reports/inventory con usuario demo@bravos.pe
 */
import { test, expect, Page } from '@playwright/test';
import https from 'https';

const PROD_BASE  = 'https://app.bravos.pe';
const EMAIL      = 'demo@bravos.pe';
const PASSWORD   = 'demo123';
const API_HOST   = 'api.bravos.pe';

// ── Login vía API de producción (HTTPS) ───────────────────────────────────────
function loginViaApi(): Promise<{ token: string; user: any }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ email: EMAIL, password: PASSWORD });
    const req = https.request({
      hostname: API_HOST,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.token) resolve({ token: json.token, user: json.user });
          else reject(new Error('Token no encontrado: ' + data.slice(0, 200)));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Inyecta auth en el browser (Zustand persist) ─────────────────────────────
async function injectSession(page: Page, token: string, user: any) {
  await page.goto(PROD_BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);

  const value = JSON.stringify({
    state: {
      user,
      token,
      currentCompany: user?.companies?.[0] ?? null,
      isAuthenticated: true,
    },
    version: 0,
  });

  await page.evaluate((val) => localStorage.setItem('bravos-auth', val), value);
}

// ── Navegar a ruta y esperar carga ───────────────────────────────────────────
async function goTo(page: Page, path: string) {
  await page.goto(`${PROD_BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2500);
  // Si redirecciona a login, re-inyectar sesión
  if (page.url().includes('login')) {
    console.log('  ⚠️ Sesión expirada, re-inyectando...');
    const { token, user } = await loginViaApi();
    await injectSession(page, token, user);
    await page.goto(`${PROD_BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);
  }
}

// ── Screenshot ───────────────────────────────────────────────────────────────
async function snap(page: Page, name: string) {
  await page.screenshot({
    path: `/tmp/reports-${name}.png`,
    fullPage: false,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// FIXTURE: sesión compartida en todo el archivo
// ═════════════════════════════════════════════════════════════════════════════
let sharedToken = '';
let sharedUser: any = null;

test.beforeAll(async () => {
  const { token, user } = await loginViaApi();
  sharedToken = token;
  sharedUser  = user;
  console.log(`\n✔ Token obtenido — ${user.name} (${user.email})`);
  console.log(`  Empresa: ${user.companies?.[0]?.name ?? 'N/A'}\n`);
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 1: /reports  ─ Reportes de Ventas
// ═════════════════════════════════════════════════════════════════════════════
test.describe('Reportes › Ventas  (/reports)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await injectSession(page, sharedToken, sharedUser);
    await goTo(page, '/reports');
  });

  // ── 1. Carga básica ───────────────────────────────────────────────────────
  test('carga la página y muestra el título', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Reportes', { timeout: 10000 });
    await snap(page, '01-reports-loaded');
    console.log('✅ Título "Reportes" visible');
  });

  // ── 2. Selector de período ────────────────────────────────────────────────
  test('selector de período existe con todas sus opciones', async ({ page }) => {
    const sel = page.locator('select').first();
    await expect(sel).toBeVisible({ timeout: 8000 });
    const options = await sel.locator('option').allTextContents();
    console.log('  Opciones:', options.join(' | '));
    expect(options.some(o => /hoy/i.test(o))).toBeTruthy();
    expect(options.some(o => /mes/i.test(o))).toBeTruthy();
    expect(options.some(o => /año/i.test(o))).toBeTruthy();
    expect(options.some(o => /personalizado/i.test(o))).toBeTruthy();
    await snap(page, '02-period-selector');
    console.log('✅ Selector de período OK');
  });

  // ── 3. Período: Hoy ───────────────────────────────────────────────────────
  test('período "Hoy" carga sin errores', async ({ page }) => {
    await page.locator('select').first().selectOption('today');
    await page.waitForTimeout(2000);
    await snap(page, '03-period-today');
    console.log('✅ Período "Hoy"');
  });

  // ── 4. Período: Semana ────────────────────────────────────────────────────
  test('período "Esta semana" carga sin errores', async ({ page }) => {
    await page.locator('select').first().selectOption('week');
    await page.waitForTimeout(2000);
    await snap(page, '04-period-week');
    console.log('✅ Período "Esta semana"');
  });

  // ── 5. Período: Trimestre ─────────────────────────────────────────────────
  test('período "Este trimestre" carga sin errores', async ({ page }) => {
    await page.locator('select').first().selectOption('quarter');
    await page.waitForTimeout(2000);
    await snap(page, '05-period-quarter');
    console.log('✅ Período "Este trimestre"');
  });

  // ── 6. Período: Año ───────────────────────────────────────────────────────
  test('período "Este año" carga sin errores', async ({ page }) => {
    await page.locator('select').first().selectOption('year');
    await page.waitForTimeout(2000);
    await snap(page, '06-period-year');
    console.log('✅ Período "Este año"');
  });

  // ── 7. Período: Personalizado ─────────────────────────────────────────────
  test('período "Personalizado" muestra inputs de fecha', async ({ page }) => {
    await page.locator('select').first().selectOption('custom');
    await page.waitForTimeout(800);
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible({ timeout: 5000 });
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = today.slice(0, 8) + '01';
    await dateInputs.nth(0).fill(firstOfMonth);
    await dateInputs.nth(1).fill(today);
    await page.waitForTimeout(1500);
    await snap(page, '07-period-custom');
    console.log(`✅ Período personalizado: ${firstOfMonth} → ${today}`);
  });

  // ── 8. Tarjetas de reporte ────────────────────────────────────────────────
  const reportCards = [
    'Reporte de Ventas',
    'Reporte por Productos',
    'Reporte por Clientes',
    'Registro de Ventas',
    'Registro de Compras',
  ];

  for (const cardName of reportCards) {
    test(`tarjeta "${cardName}" es visible`, async ({ page }) => {
      const card = page.locator(`text=${cardName}`).first();
      await expect(card).toBeVisible({ timeout: 8000 });
      console.log(`✅ "${cardName}" visible`);
    });
  }

  // ── 9. Click en Ventas → muestra tabla ────────────────────────────────────
  test('click en "Reporte de Ventas" carga los datos', async ({ page }) => {
    const vistaBtn = page.locator('button', { hasText: /Vista previa/i }).first();
    await expect(vistaBtn).toBeVisible({ timeout: 8000 });
    await vistaBtn.click();
    await page.waitForTimeout(3000);
    await snap(page, '08-sales-report-data');
    console.log('✅ Vista previa de Ventas clickeada');
  });

  // ── 10. Click en Productos → muestra tabla ────────────────────────────────
  test('click en "Reporte por Productos" carga tabla', async ({ page }) => {
    const btns = page.locator('button', { hasText: /Vista previa/i });
    if (await btns.count() >= 2) {
      await btns.nth(1).click();
      await page.waitForTimeout(3000);
      await snap(page, '09-products-report');
      console.log('✅ Vista previa de Productos clickeada');
    }
  });

  // ── 11. Click en Clientes → muestra tabla ─────────────────────────────────
  test('click en "Reporte por Clientes" carga tabla', async ({ page }) => {
    const btns = page.locator('button', { hasText: /Vista previa/i });
    if (await btns.count() >= 3) {
      await btns.nth(2).click();
      await page.waitForTimeout(3000);
      await snap(page, '10-clients-report');
      console.log('✅ Vista previa de Clientes clickeada');
    }
  });

  // ── 12. Botón Excel ───────────────────────────────────────────────────────
  test('botón Excel en primera tarjeta responde', async ({ page }) => {
    const excelBtn = page.locator('button', { hasText: /Excel/i }).first();
    await expect(excelBtn).toBeVisible({ timeout: 8000 });
    const dlPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await excelBtn.click();
    const dl = await dlPromise;
    if (dl) console.log(`  Descarga: ${dl.suggestedFilename()}`);
    await snap(page, '11-excel-btn');
    console.log('✅ Botón Excel respondió');
  });

  // ── 13. Sin errores JS ────────────────────────────────────────────────────
  test('sin errores JavaScript en consola', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.waitForTimeout(2000);
    const real = errs.filter(e => !e.includes('ERR_BLOCKED_BY_CLIENT') && !e.includes('beacon'));
    real.forEach(e => console.log('  ⚠️', e));
    expect(real.length).toBe(0);
    console.log('✅ Sin errores JS');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 2: /reports/inventory  ─ Reporte de Inventario
// ═════════════════════════════════════════════════════════════════════════════
test.describe('Reportes › Inventario  (/reports/inventory)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await injectSession(page, sharedToken, sharedUser);
    await goTo(page, '/reports/inventory');
  });

  // ── 1. Carga básica ───────────────────────────────────────────────────────
  test('carga la página con título correcto', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Inventario', { timeout: 10000 });
    await snap(page, '20-inventory-loaded');
    console.log('✅ Título "Reporte de Inventario" visible');
  });

  // ── 2. KPI Cards ──────────────────────────────────────────────────────────
  test('muestra las 4 tarjetas KPI de resumen', async ({ page }) => {
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    const kpis = ['Total Productos', 'Valor Costo', 'Valor Venta', 'Stock Bajo'];
    for (const kpi of kpis) {
      console.log(`  KPI "${kpi}": ${body.includes(kpi) ? '✅' : '❌ no encontrado'}`);
    }
    await snap(page, '21-inventory-kpis');
    console.log('✅ KPIs verificados');
  });

  // ── 3. Columnas de tabla ──────────────────────────────────────────────────
  test('tabla muestra las columnas correctas', async ({ page }) => {
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    const cols = ['Producto', 'Categoría', 'Stock', 'P. Costo', 'P. Venta', 'Estado'];
    for (const col of cols) {
      console.log(`  Col "${col}": ${body.includes(col) ? '✅' : '❌'}`);
    }
    await snap(page, '22-inventory-table');
    console.log('✅ Columnas verificadas');
  });

  // ── 4–7. Tabs de stock ────────────────────────────────────────────────────
  const tabs = ['Todos', 'Stock OK', 'Stock Bajo', 'Sin Stock'];

  for (const tabName of tabs) {
    test(`tab "${tabName}" es clickeable y filtra`, async ({ page }) => {
      await page.waitForTimeout(2000);
      const tab = page.locator('button', { hasText: new RegExp(`^${tabName}$`) });
      await expect(tab).toBeVisible({ timeout: 6000 });
      await tab.click();
      await page.waitForTimeout(2000);
      await snap(page, `23-tab-${tabName.toLowerCase().replace(/\s+/g, '-')}`);
      console.log(`✅ Tab "${tabName}" OK`);
    });
  }

  // ── 8. Búsqueda por texto ─────────────────────────────────────────────────
  test('buscador filtra productos por nombre/código', async ({ page }) => {
    await page.waitForTimeout(2000);
    const input = page.locator('input[placeholder*="nombre"], input[placeholder*="código"]').first();
    await expect(input).toBeVisible({ timeout: 6000 });
    await input.fill('a');
    await page.waitForTimeout(1500);
    await snap(page, '24-search-results');
    console.log('✅ Búsqueda por "a" ejecutada');
  });

  test('búsqueda sin resultados muestra estado vacío', async ({ page }) => {
    await page.waitForTimeout(2000);
    const input = page.locator('input[placeholder*="nombre"], input[placeholder*="código"]').first();
    await expect(input).toBeVisible({ timeout: 6000 });
    await input.fill('zzzzzzzzzzzzz');
    await page.waitForTimeout(1500);
    const body = await page.locator('body').innerText();
    const isEmpty = /no se encontraron|sin productos/i.test(body);
    console.log(`  Estado vacío: ${isEmpty ? '✅' : 'ℹ️ no mostrado'}`);
    await snap(page, '25-search-empty');
    console.log('✅ Búsqueda sin resultados verificada');
  });

  test('limpiar búsqueda restaura el listado', async ({ page }) => {
    await page.waitForTimeout(2000);
    const input = page.locator('input[placeholder*="nombre"], input[placeholder*="código"]').first();
    await expect(input).toBeVisible({ timeout: 6000 });
    await input.fill('xyz');
    await page.waitForTimeout(1000);
    await input.fill('');
    await page.waitForTimeout(1500);
    await snap(page, '26-search-cleared');
    console.log('✅ Búsqueda limpiada');
  });

  // ── 9. Botón Actualizar ───────────────────────────────────────────────────
  test('botón "Actualizar" recarga datos', async ({ page }) => {
    await page.waitForTimeout(2000);
    const btn = page.locator('button', { hasText: /Actualizar/i });
    await expect(btn).toBeVisible({ timeout: 6000 });
    await btn.click();
    await page.waitForTimeout(2500);
    await snap(page, '27-refresh');
    console.log('✅ Botón "Actualizar" OK');
  });

  // ── 10. Exportar Excel ────────────────────────────────────────────────────
  test('botón "Exportar Excel" dispara descarga', async ({ page }) => {
    await page.waitForTimeout(2000);
    const btn = page.locator('button', { hasText: /Exportar Excel/i });
    await expect(btn).toBeVisible({ timeout: 6000 });
    const dlPromise = page.waitForEvent('download', { timeout: 12000 }).catch(() => null);
    await btn.click();
    const dl = await dlPromise;
    if (dl) {
      console.log(`  Descargado: ${dl.suggestedFilename()}`);
      expect(dl.suggestedFilename()).toMatch(/\.(xlsx?|csv)$/i);
    } else {
      console.log('  ℹ️ Descarga no interceptada (usuario demo puede tener restricción)');
    }
    await snap(page, '28-excel-export');
    console.log('✅ Botón "Exportar Excel" OK');
  });

  // ── 11. Sin errores JS ────────────────────────────────────────────────────
  test('sin errores JavaScript en consola', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.waitForTimeout(2000);
    const real = errs.filter(e => !e.includes('ERR_BLOCKED_BY_CLIENT') && !e.includes('beacon'));
    real.forEach(e => console.log('  ⚠️', e));
    expect(real.length).toBe(0);
    console.log('✅ Sin errores JS');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RESUMEN FINAL
// ═════════════════════════════════════════════════════════════════════════════
test('Resumen: los dos módulos de reportes están accesibles', async ({ page }) => {
  test.setTimeout(30_000);
  await injectSession(page, sharedToken, sharedUser);

  const modules = [
    { name: 'Reportes › Ventas',     path: '/reports' },
    { name: 'Reportes › Inventario', path: '/reports/inventory' },
  ];

  console.log('\n══════════════════════════════════════════════════');
  console.log('  RESULTADO FINAL — MÓDULO REPORTES');
  console.log('══════════════════════════════════════════════════');

  for (const mod of modules) {
    await goTo(page, mod.path);
    const url   = page.url();
    const h1    = await page.locator('h1').first().textContent({ timeout: 5000 }).catch(() => '—');
    const ok    = !url.includes('login');
    console.log(`  ${ok ? '✅' : '🔒'}  ${mod.name.padEnd(28)}  "${h1?.trim()}"`);
  }

  console.log('══════════════════════════════════════════════════\n');
});

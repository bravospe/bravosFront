/**
 * Auditoría de Módulos — Bravos Dashboard
 * Obtiene token de API local (puerto 8000), inyecta auth en localStorage
 * y recorre todos los módulos del nuevo menú reorganizado.
 */
import { test, expect, Page } from '@playwright/test';
import http from 'http';

const DEMO_EMAIL    = 'demo@bravos.pe';
const DEMO_PASSWORD = 'demo123';
const LOCAL_API     = 'http://localhost:8000/api/v1';

// ── Todos los módulos del menú reorganizado ──────────────────────────────────
const MODULES = [
  // Core
  { name: 'Dashboard / Inicio',                route: '/dashboard' },
  // Ventas
  { name: 'Ventas › POS (Caja Rápida)',        route: '/pos' },
  { name: 'Ventas › Movimientos / Caja',       route: '/sales' },
  { name: 'Ventas › Proformas',                route: '/proformas' },
  { name: 'Ventas › Leads / CRM',              route: '/crm/leads' },
  // Comprobantes
  { name: 'Comprobantes › Facturas y Boletas', route: '/invoices' },
  { name: 'Comprobantes › Notas de Venta',     route: '/invoices/sales-notes' },
  { name: 'Comprobantes › Guías de Remisión',  route: '/invoices/dispatch-guides' },
  // Clientes
  { name: 'Clientes',                          route: '/clients' },
  // Catálogo
  { name: 'Catálogo › Productos',              route: '/products' },
  { name: 'Catálogo › Unidades de Medida',     route: '/products/units' },
  { name: 'Catálogo › Marcas',                 route: '/products/brands' },
  { name: 'Catálogo › Proveedores',            route: '/suppliers' },
  // Inventario
  { name: 'Inventario › Kardex',               route: '/inventory/kardex' },
  { name: 'Inventario › Almacenes',            route: '/inventory/warehouses' },
  { name: 'Inventario › Ajustes de Stock',     route: '/inventory/adjustments' },
  { name: 'Inventario › Sedes / Sucursales',   route: '/inventory/branches' },
  // Tienda Virtual
  { name: 'Tienda Virtual › Vista General',    route: '/virtual-store' },
  { name: 'Tienda Virtual › Pedidos',          route: '/virtual-store/orders' },
  { name: 'Tienda Virtual › Envíos',           route: '/virtual-store/shipments' },
  { name: 'Tienda Virtual › Clientes Online',  route: '/virtual-store/customers' },
  { name: 'Tienda Virtual › Banners',          route: '/virtual-store/banners' },
  { name: 'Tienda Virtual › Promociones',      route: '/virtual-store/promotions' },
  { name: 'Tienda Virtual › Apariencia',       route: '/virtual-store/appearance' },
  { name: 'Tienda Virtual › Configuración',    route: '/virtual-store/settings' },
  // Reportes
  { name: 'Reportes › Ventas',                 route: '/reports' },
  { name: 'Reportes › Inventario',             route: '/reports/inventory' },
  // Equipo
  { name: 'Equipo › Usuarios',                 route: '/users' },
  // Configuración
  { name: 'Configuración › General',           route: '/settings' },
  { name: 'Configuración › Atributos',         route: '/settings/attributes' },
  { name: 'Configuración › Apariencia Panel',  route: '/settings/appearance' },
  { name: 'Configuración › Mi Suscripción',    route: '/settings/subscription' },
];

// ── Obtiene token de la API local (sin pasar por Cloudflare) ─────────────────
function loginViaLocalApi(): Promise<{ token: string; user: any }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    const req  = http.request('http://localhost:8000/api/v1/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.token) resolve({ token: json.token, user: json.user });
          else reject(new Error('Token not found: ' + data.slice(0, 200)));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Inyecta auth en localStorage con el formato de Zustand persist ───────────
async function injectAuth(page: Page, token: string, user: any) {
  // Visitar una página del dominio para poder escribir en su localStorage
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const storageValue = JSON.stringify({
    state: {
      user,
      token,
      currentCompany: user?.companies?.[0] ?? null,
      isAuthenticated: true,
    },
    version: 0,
  });

  await page.evaluate((val) => {
    localStorage.setItem('bravos-auth', val);
  }, storageValue);
}

// ── Verifica si un módulo está operativo ────────────────────────────────────
async function checkModule(page: Page, route: string): Promise<{
  status: 'OK' | 'ERROR' | 'NOT_FOUND' | 'REDIRECT';
  detail: string;
}> {
  try {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);

    const finalUrl   = page.url();
    const httpStatus = response?.status() ?? 0;

    // Redirigido a login → sesión no persistió o sin permiso
    if (finalUrl.includes('/auth/login') || finalUrl.includes('/login')) {
      return { status: 'REDIRECT', detail: 'Redirigido a login' };
    }

    // Detectar error por contenido
    const bodyText = (await page.locator('body').innerText({ timeout: 3000 }).catch(() => '')).toLowerCase();
    if (bodyText.includes('404') && bodyText.includes('not found')) {
      return { status: 'NOT_FOUND', detail: 'Página 404' };
    }
    if (bodyText.includes('500') || bodyText.includes('internal server error')) {
      return { status: 'ERROR', detail: 'Error 500 del servidor' };
    }
    if (httpStatus >= 500) {
      return { status: 'ERROR', detail: `HTTP ${httpStatus}` };
    }
    if (httpStatus === 404) {
      return { status: 'NOT_FOUND', detail: `HTTP 404 — ruta no existe en el frontend` };
    }

    // Paywall/plan restringido — página carga pero está bloqueada por plan
    const hasPaywall = bodyText.includes('actualiza tu plan') || bodyText.includes('upgrade') || bodyText.includes('plan requerido');
    if (hasPaywall) {
      return { status: 'OK', detail: 'Operativo (restringido por plan)' };
    }

    return { status: 'OK', detail: `Operativo` };
  } catch (err: any) {
    if (err.message?.includes('net::ERR_') || err.message?.includes('Timeout')) {
      return { status: 'ERROR', detail: `Timeout/Red: ${err.message.slice(0, 80)}` };
    }
    return { status: 'ERROR', detail: err.message?.slice(0, 100) ?? 'Error desconocido' };
  }
}

// ── TEST PRINCIPAL ────────────────────────────────────────────────────────────
test('Auditoría de módulos — usuario demo@bravos.pe', async ({ page }) => {
  test.setTimeout(300_000); // 5 min para 32 módulos

  // 1. Obtener token
  const { token, user } = await loginViaLocalApi();
  console.log(`\n✔ Login OK — Usuario: ${user.name} (${user.email})`);
  console.log(`  Empresa: ${user.companies?.[0]?.name ?? 'N/A'}\n`);

  // 2. Inyectar sesión en el browser
  await injectAuth(page, token, user);

  // 3. Recorrer módulos
  const results: Array<{ module: string; route: string; status: string; detail: string }> = [];

  for (const mod of MODULES) {
    const result = await checkModule(page, mod.route);
    results.push({ module: mod.name, route: mod.route, ...result });

    // Si perdemos la sesión, re-inyectar
    if (result.status === 'REDIRECT') {
      await injectAuth(page, token, user);
    }
  }

  // 4. Clasificar resultados
  const ok       = results.filter(r => r.status === 'OK');
  const notFound = results.filter(r => r.status === 'NOT_FOUND');
  const redirect = results.filter(r => r.status === 'REDIRECT');
  const errors   = results.filter(r => r.status === 'ERROR');

  // 5. Imprimir reporte
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  AUDITORÍA DE MÓDULOS — BRAVOS DASHBOARD');
  console.log(`  Usuario: ${DEMO_EMAIL} | Total módulos: ${results.length}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log(`✅ OPERATIVOS (${ok.length} de ${results.length}):`);
  ok.forEach(r => console.log(`   ✅  ${r.module.padEnd(48)} ${r.route}`));

  if (notFound.length > 0) {
    console.log(`\n🔍 RUTA NO EXISTE EN FRONTEND (${notFound.length}):`);
    notFound.forEach(r => console.log(`   🔍  ${r.module.padEnd(48)} ${r.route}  →  ${r.detail}`));
  }

  if (redirect.length > 0) {
    console.log(`\n🔒 SIN PERMISO / PLAN (${redirect.length}):`);
    redirect.forEach(r => console.log(`   🔒  ${r.module.padEnd(48)} ${r.route}  →  ${r.detail}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ CON ERROR (${errors.length}):`);
    errors.forEach(r => console.log(`   ❌  ${r.module.padEnd(48)} ${r.route}  →  ${r.detail}`));
  }

  console.log('\n───────────────────────────────────────────────────────────────────');
  console.log(`  Operativos: ${ok.length}  |  No encontrados: ${notFound.length}  |  Sin permiso: ${redirect.length}  |  Errores: ${errors.length}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // El test solo falla si hay errores reales de servidor
  expect(errors.length, `Módulos con error: ${errors.map(r => r.module).join(', ')}`).toBe(0);
});

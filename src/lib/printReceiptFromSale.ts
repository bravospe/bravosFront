/**
 * Shared print-receipt utility — prints a Sale (NV) using the same
 * browser overlay that the POS uses after a successful sale.
 */
import api from '@/lib/api';
import { getPrinterConfig } from '@/lib/printerConfig';

const PAPER_STYLES: Record<string, { pageSize: string; bodyWidth: string; fontSize: string; padding: string }> = {
  '58mm': { pageSize: '58mm auto',  bodyWidth: '54mm',   fontSize: '11px', padding: '2mm' },
  '80mm': { pageSize: '80mm auto',  bodyWidth: '74mm',   fontSize: '13px', padding: '3mm' },
  'a4':   { pageSize: 'A4',         bodyWidth: '190mm',  fontSize: '14px', padding: '10mm' },
};

function getStoredCompany() {
  try {
    const authData = localStorage.getItem('bravos-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.state?.currentCompany || null;
    }
  } catch (e) {
    console.error('Error reading company from auth storage', e);
  }
  return JSON.parse(localStorage.getItem('currentCompany') || 'null');
}

export function showPrintOverlay(receiptHtml: string, ps: { pageSize: string; bodyWidth: string; fontSize: string; padding: string }) {
  document.getElementById('bravos-print-overlay')?.remove();
  document.getElementById('bravos-print-style')?.remove();

  const style = document.createElement('style');
  style.id = 'bravos-print-style';
  style.textContent = `
    @page { margin: 0; size: ${ps.pageSize}; }
    @media print {
      html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
      body > :not(#bravos-print-overlay) { display: none !important; visibility: hidden !important; }
      body > #bravos-print-overlay {
        display: block !important; visibility: visible !important;
        position: static !important; width: 100% !important; height: auto !important;
        overflow: visible !important; background: #fff !important;
      }
      #bravos-print-close { display: none !important; }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'bravos-print-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#fff;overflow-y:auto;display:flex;flex-direction:column;align-items:center;';
  overlay.innerHTML = `
    <div id="bravos-print-close" style="width:100%;padding:12px 16px;border-bottom:1px solid #e5e7eb;background:#f9fafb;display:flex;justify-content:center;gap:8px;box-sizing:border-box;">
      <button onclick="document.getElementById('bravos-print-overlay').remove();document.getElementById('bravos-print-style').remove();"
        style="padding:10px 24px;border-radius:8px;border:none;background:#ef4444;color:#fff;font-size:14px;font-weight:600;cursor:pointer;">← Cerrar</button>
      <button onclick="window.print()"
        style="padding:10px 24px;border-radius:8px;border:none;background:#10b981;color:#fff;font-size:14px;font-weight:600;cursor:pointer;">🖨️ Reimprimir</button>
    </div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:${ps.fontSize};line-height:1.2;color:#000;background:#fff;padding:${ps.padding};width:${ps.bodyWidth};box-sizing:border-box;margin:0 auto;text-align:center;">
      <div style="text-align:left;display:inline-block;width:100%;">
        ${receiptHtml}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const triggerPrint = () => requestAnimationFrame(() => window.print());
  const logoImg = overlay.querySelector('#bravos-receipt-logo') as HTMLImageElement | null;
  if (logoImg && !logoImg.complete) {
    let fired = false;
    const oncePrint = () => { if (!fired) { fired = true; triggerPrint(); } };
    logoImg.onload = oncePrint;
    logoImg.onerror = oncePrint;
    setTimeout(oncePrint, 2000);
  } else {
    triggerPrint();
  }
}

export async function printSaleReceipt(
  saleId: string,
  companyId: string,
  companyInput: { id?: string; name?: string; trade_name?: string; ruc?: string; address?: string } | null,
  logoUrlInput?: string,
) {
  const res = await api.get(`/companies/${companyId}/sales/${saleId}`);
  const sale = res.data?.data ?? res.data;
  const company = companyInput || getStoredCompany();

  const cfg = getPrinterConfig(company?.id);
  const ps = PAPER_STYLES[cfg.paper_size] ?? PAPER_STYLES['80mm'];

  const paymentLabels: Record<string, string> = {
    cash: 'Efectivo', card: 'Tarjeta', yape_plin: 'Yape / Plin',
    transfer: 'Transferencia', credit: 'Crédito', mixed: 'Mixto',
    yape: 'Yape', plin: 'Plin',
  };

  const isInvoice = !!sale.invoice || sale.document_type === '01' || sale.document_type === '03';
  const docTypeLabel = isInvoice ? (sale.document_type === '01' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA') : 'NOTA DE VENTA';
  
  const paymentLabel = paymentLabels[sale.payment_method] || sale.payment_method || '';
  const now = new Date(sale.created_at || Date.now());
  const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const items: any[] = sale.items || [];
  const itemRows = items.map((item: any) => `
    <tr>
      <td style="padding:2px 0;vertical-align:top;text-align:left;">${item.description || item.product?.name || '-'}</td>
      <td style="padding:2px 0;text-align:center;white-space:nowrap;">${item.quantity}</td>
      <td style="padding:2px 0;text-align:right;white-space:nowrap;">${Number(item.unit_price || 0).toFixed(2)}</td>
      <td style="padding:2px 0;text-align:right;white-space:nowrap;">${Number(item.total || 0).toFixed(2)}</td>
    </tr>`).join('');

  const logoUrl = logoUrlInput || company?.logo;
  const logoHtml = logoUrl
    ? `<img id="bravos-receipt-logo" src="${logoUrl}" alt="logo" style="display:block;max-width:140px;max-height:80px;margin:0 auto 10px auto;object-fit:contain;" />`
    : '';

  const client = sale.client || sale.invoice?.client;
  const clientHtml = client
    ? `<p style="margin:2px 0;">${client.name || client.business_name || ''}</p><p style="margin:2px 0;">${client.document_type || ''}: ${client.document_number || ''}</p>`
    : '<p style="margin:2px 0;">Cliente General</p>';

  const docNum = sale.invoice 
    ? `${sale.invoice.series}-${sale.invoice.number || sale.invoice.correlative}`
    : (sale.sale_number || '');
  const docNumHtml = docNum ? `<p style="font-weight:bold;font-size:120%;margin:4px 0;">${docNum}</p>` : '';

  const registerName = sale.pos_session?.cash_register?.name || 'Caja Principal';

  const discountHtml = Number(sale.global_discount_amount || sale.discount_amount || 0) > 0
    ? `<tr><td style="text-align:left;">Descuento:</td><td colspan="3" style="text-align:right;color:#dc2626;">-S/ ${Number(sale.global_discount_amount || sale.discount_amount).toFixed(2)}</td></tr>`
    : '';

  const qrContent = isInvoice ? `https://api.bravos.pe/cpe/${company?.ruc}-${sale.document_type}-${docNum}` : `Bravos.pe - ${docNum}`;
  const qrHtml = `<div style="margin: 12px auto; text-align: center;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrContent)}" alt="QR" style="width: 100px; height: 100px; display:inline-block;" /></div>`;

  const receiptBody = `
<div style="text-align:center;width:100%;">
  ${logoHtml}
  <div style="font-weight:bold;font-size:125%;margin-bottom:2px;line-height:1.1;">${company?.name || 'EMPRESA'}</div>
  ${company?.trade_name ? `<div style="margin-bottom:2px;">${company.trade_name}</div>` : ''}
  <div style="margin-bottom:2px;">RUC: ${company?.ruc || ''}</div>
  <div style="margin-bottom:4px;line-height:1.1;">${company?.address || ''}</div>
</div>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
<div style="text-align:center;width:100%;">
  <div style="font-weight:bold;font-size:110%;">${docTypeLabel}</div>
  ${docNumHtml}
</div>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
<div style="text-align:left;width:100%;margin-bottom:2px;">Fecha: ${dateStr} ${timeStr}</div>
<div style="text-align:left;width:100%;margin-bottom:2px;">Pago: ${paymentLabel}</div>
<div style="text-align:left;width:100%;margin-bottom:2px;">Caja: ${registerName}</div>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
<div style="text-align:left;width:100%;"><span style="font-weight:bold;">Cliente: </span>${clientHtml}</div>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
<table style="width:100%;border-collapse:collapse;font-size:inherit;margin-bottom:4px;">
  <thead>
    <tr style="border-bottom:1px solid #000;">
      <th style="text-align:left;padding-bottom:2px;">Desc.</th>
      <th style="text-align:center;width:28px;padding-bottom:2px;">Cant</th>
      <th style="text-align:right;width:42px;padding-bottom:2px;">P.U.</th>
      <th style="text-align:right;width:55px;padding-bottom:2px;">Total</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
</table>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
<table style="width:100%;border-collapse:collapse;">
  ${discountHtml}
  <tr style="font-weight:bold;font-size:120%;">
    <td style="text-align:left;">TOTAL:</td>
    <td style="text-align:right;">S/ ${Number(sale.total).toFixed(2)}</td>
  </tr>
</table>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
${qrHtml}
<div style="text-align:center;width:100%;margin-top:4px;">
  <div style="margin-bottom:4px;">${cfg.footer_text || '¡Gracias por su compra!'}</div>
  <div style="font-weight:bold;font-size:110%;">Facturación por Bravos.pe</div>
  ${!isInvoice ? '<div style="font-size:9px;margin-top:6px;color:#000;">Este documento es de control interno y no tiene validez tributaria.</div>' : ''}
</div>`;

  showPrintOverlay(receiptBody, ps);
}

export function printReceiptFromSale(saleResult: any) {
  const sale = saleResult.sale || saleResult;
  const company = getStoredCompany();
  
  const cfg = getPrinterConfig(company?.id);
  const ps = PAPER_STYLES[cfg.paper_size] ?? PAPER_STYLES['80mm'];

  const paymentLabels: Record<string, string> = {
    cash: 'Efectivo', card: 'Tarjeta', yape_plin: 'Yape / Plin',
    transfer: 'Transferencia', credit: 'Crédito', mixed: 'Mixto',
    yape: 'Yape', plin: 'Plin',
  };

  const isInvoice = !!saleResult.invoice || sale.document_type === '01' || sale.document_type === '03';
  const docTypeLabel = isInvoice ? (sale.document_type === '01' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA') : 'NOTA DE VENTA';
  
  const paymentLabel = paymentLabels[sale.payment_method] || sale.payment_method || '';
  const now = new Date(sale.created_at || Date.now());
  const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const items: any[] = sale.items || [];
  const itemRows = items.map((item: any) => `
    <tr>
      <td style="padding:2px 0;vertical-align:top;text-align:left;">${item.description || item.product?.name || '-'}</td>
      <td style="padding:2px 0;text-align:center;white-space:nowrap;">${item.quantity}</td>
      <td style="padding:2px 0;text-align:right;white-space:nowrap;">${Number(item.unit_price || 0).toFixed(2)}</td>
      <td style="padding:2px 0;text-align:right;white-space:nowrap;">${Number(item.total || 0).toFixed(2)}</td>
    </tr>`).join('');

  const logoUrl = company?.logo;
  const logoHtml = logoUrl
    ? `<img id="bravos-receipt-logo" src="${logoUrl}" alt="logo" style="display:block;max-width:140px;max-height:80px;margin:0 auto 10px auto;object-fit:contain;" />`
    : '';

  const client = sale.client || saleResult.invoice?.client;
  const clientHtml = client
    ? `<p style="margin:2px 0;">${client.name || client.business_name || ''}</p><p style="margin:2px 0;">${client.document_type || ''}: ${client.document_number || ''}</p>`
    : '<p style="margin:2px 0;">Cliente General</p>';

  const docNum = saleResult.invoice 
    ? `${saleResult.invoice.series}-${saleResult.invoice.number || saleResult.invoice.correlative}`
    : (sale.sale_number || '');

  const docNumHtml = docNum ? `<p style="font-weight:bold;font-size:120%;margin:4px 0;">${docNum}</p>` : '';

  const registerName = sale.pos_session?.cash_register?.name || 'Caja Principal';

  const discountHtml = Number(sale.global_discount_amount || sale.discount_amount || 0) > 0
    ? `<tr><td style="text-align:left;">Descuento:</td><td colspan="3" style="text-align:right;color:#dc2626;">-S/ ${Number(sale.global_discount_amount || sale.discount_amount).toFixed(2)}</td></tr>`
    : '';

  const qrContent = isInvoice ? `https://api.bravos.pe/cpe/${company?.ruc}-${sale.document_type}-${docNum}` : `Bravos.pe - ${docNum}`;
  const qrHtml = `<div style="margin: 12px auto; text-align: center;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrContent)}" alt="QR" style="width: 100px; height: 100px; display:inline-block;" /></div>`;

  const receiptBody = `
<div style="text-align:center;width:100%;">
  ${logoHtml}
  <div style="font-weight:bold;font-size:125%;margin-bottom:2px;line-height:1.1;">${company?.name || 'EMPRESA'}</div>
  ${company?.trade_name ? `<div style="margin-bottom:2px;">${company.trade_name}</div>` : ''}
  <div style="margin-bottom:2px;">RUC: ${company?.ruc || ''}</div>
  <div style="margin-bottom:4px;line-height:1.1;">${company?.address || ''}</div>
</div>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
<div style="text-align:center;width:100%;">
  <div style="font-weight:bold;font-size:110%;">${docTypeLabel}</div>
  ${docNumHtml}
</div>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
<div style="text-align:left;width:100%;margin-bottom:2px;">Fecha: ${dateStr} ${timeStr}</div>
<div style="text-align:left;width:100%;margin-bottom:2px;">Pago: ${paymentLabel}</div>
<div style="text-align:left;width:100%;margin-bottom:2px;">Caja: ${registerName}</div>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
<div style="text-align:left;width:100%;"><span style="font-weight:bold;">Cliente: </span>${clientHtml}</div>
<hr style="border:none;border-top:1px dashed #000;margin:4px 0;"/>
<table style="width:100%;border-collapse:collapse;font-size:inherit;margin-bottom:4px;">
  <thead>
    <tr style="border-bottom:1px solid #000;">
      <th style="text-align:left;padding-bottom:2px;">Desc.</th>
      <th style="text-align:center;width:28px;padding-bottom:2px;">Cant</th>
      <th style="text-align:right;width:42px;padding-bottom:2px;">P.U.</th>
      <th style="text-align:right;width:55px;padding-bottom:2px;">Total</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
</table>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
<table style="width:100%;border-collapse:collapse;">
  ${discountHtml}
  <tr style="font-weight:bold;font-size:120%;">
    <td style="text-align:left;">TOTAL:</td>
    <td style="text-align:right;">S/ ${Number(sale.total).toFixed(2)}</td>
  </tr>
</table>
<hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
${qrHtml}
<div style="text-align:center;width:100%;margin-top:4px;">
  <div style="margin-bottom:4px;">${cfg.footer_text || '¡Gracias por su compra!'}</div>
  <div style="font-weight:bold;font-size:110%;">Facturación por Bravos.pe</div>
  ${!isInvoice ? '<div style="font-size:9px;margin-top:6px;color:#000;">Este documento es de control interno y no tiene validez tributaria.</div>' : ''}
</div>`;

  showPrintOverlay(receiptBody, ps);
}


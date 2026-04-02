export interface PrinterConfig {
  paper_size: '58mm' | '80mm' | 'a4';
  show_logo: boolean;
  show_ruc: boolean;
  show_address: boolean;
  show_phone: boolean;
  show_email: boolean;
  show_igv_detail: boolean;
  footer_text: string;
  copies: number;
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  paper_size: '80mm',
  show_logo: true,
  show_ruc: true,
  show_address: true,
  show_phone: true,
  show_email: true,
  show_igv_detail: true,
  footer_text: '¡Gracias por su compra!',
  copies: 1,
};

const FALLBACK_KEY = 'printer_config_default';

function companyKey(companyId?: string) {
  return companyId ? `printer_config_${companyId}` : FALLBACK_KEY;
}

export function getPrinterConfig(companyId?: string): PrinterConfig {
  if (typeof window === 'undefined') return DEFAULT_PRINTER_CONFIG;
  try {
    // Try company-specific key first, then fallback key
    const keys = companyId
      ? [`printer_config_${companyId}`, FALLBACK_KEY]
      : [FALLBACK_KEY];
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (stored) return { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(stored) };
    }
  } catch { /* ignore */ }
  return DEFAULT_PRINTER_CONFIG;
}

export function savePrinterConfig(companyId: string | undefined, config: PrinterConfig) {
  const json = JSON.stringify(config);
  // Always save to fallback key so POS can find it regardless of timing
  localStorage.setItem(FALLBACK_KEY, json);
  // Also save to company-specific key if we have a companyId
  if (companyId) {
    localStorage.setItem(companyKey(companyId), json);
  }
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface ClientOption {
  id: string;
  name: string;
  trade_name?: string;
  document_type: string;
  document_number: string;
  address?: string;
}

interface ProductOption {
  id: string;
  name: string;
  code: string;
  sale_price: number;
  tax_type: string;
  tax_percentage: number;
  unit_code: string;
}

interface QuotationItemRow {
  key: number;
  product_id: string;
  description: string;
  code: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  tax_type: string;
  tax_percentage: number;
  unit_code: string;
  is_manual: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

let itemKey = 0;

export default function CreateQuotationModal({ isOpen, onClose, onCreated }: Props) {
  const { user } = useAuthStore();
  const companyId = user?.current_company_id || user?.companies?.[0]?.id;

  const [currency, setCurrency] = useState('PEN');
  const [validityDate, setValidityDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // Client
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientHighlight, setClientHighlight] = useState(-1);
  const [consultingSunat, setConsultingSunat] = useState(false);
  const clientSearchRef = useRef<HTMLInputElement>(null);

  // Products
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productHighlight, setProductHighlight] = useState(-1);
  const [manualMode, setManualMode] = useState(false);
  const productSearchRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<QuotationItemRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Post-creation confirmation
  const [createdQuotation, setCreatedQuotation] = useState<{ id: string; number: string; total: number } | null>(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrency('PEN');
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setValidityDate(d.toISOString().split('T')[0]);
      setNotes('');
      setTerms('');
      setClientSearch('');
      setSelectedClient(null);
      setItems([]);
      setProductSearch('');
      setManualMode(false);
    }
  }, [isOpen]);

  // Search clients
  const searchClients = useCallback(async (q: string) => {
    if (!companyId || q.length < 2) { setClientResults([]); return; }
    try {
      const res = await api.get(`/companies/${companyId}/clients`, { params: { search: q, per_page: 8 } });
      const data = res.data?.data || res.data?.items || res.data;
      setClientResults(Array.isArray(data) ? data : []);
      setClientHighlight(-1);
    } catch { setClientResults([]); }
  }, [companyId]);

  useEffect(() => {
    const t = setTimeout(() => { if (clientSearch.length >= 2) searchClients(clientSearch); }, 300);
    return () => clearTimeout(t);
  }, [clientSearch, searchClients]);

  // Consult SUNAT
  const consultSunat = useCallback(async (doc: string) => {
    if (!companyId) return;
    const isRuc = /^\d{11}$/.test(doc);
    const isDni = /^\d{8}$/.test(doc);
    if (!isRuc && !isDni) { toast.error('Ingresa un RUC (11 dígitos) o DNI (8 dígitos) válido'); return; }
    setConsultingSunat(true);
    try {
      const endpoint = isRuc ? '/validation/ruc' : '/validation/dni';
      const res = await api.post(endpoint, isRuc ? { ruc: doc } : { dni: doc });
      if (!res.data?.valid) { toast.error(res.data?.message || 'Documento no encontrado'); return; }
      const sunatData = res.data.data;
      const createRes = await api.post(`/companies/${companyId}/clients`, {
        document_type: isRuc ? 'RUC' : 'DNI',
        document_number: doc,
        name: sunatData.name || '',
        trade_name: sunatData.trade_name || null,
        address: sunatData.address || null,
      });
      const newClient = createRes.data;
      setSelectedClient({ id: newClient.id, name: newClient.name, document_type: newClient.document_type, document_number: newClient.document_number, address: newClient.address });
      setShowClientDropdown(false);
      setClientSearch('');
      toast.success(`Cliente "${newClient.name}" creado desde SUNAT`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al consultar SUNAT');
    } finally {
      setConsultingSunat(false);
    }
  }, [companyId]);

  // Search products
  const searchProducts = useCallback(async (q: string) => {
    if (!companyId || q.length < 2) { setProductResults([]); return; }
    try {
      const res = await api.get(`/companies/${companyId}/products`, { params: { search: q, per_page: 10 } });
      const data = res.data?.data || res.data?.items || res.data;
      setProductResults(Array.isArray(data) ? data : []);
      setProductHighlight(-1);
    } catch { setProductResults([]); }
  }, [companyId]);

  useEffect(() => {
    const t = setTimeout(() => { if (productSearch.length >= 2) searchProducts(productSearch); }, 300);
    return () => clearTimeout(t);
  }, [productSearch, searchProducts]);

  const addItem = (product: ProductOption) => {
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      setItems(prev => prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems(prev => [...prev, {
        key: ++itemKey,
        product_id: product.id,
        description: product.name,
        code: product.code || '',
        quantity: 1,
        unit_price: Number(product.sale_price) || 0,
        discount_percentage: 0,
        tax_type: (product.tax_type || 'gravado').toLowerCase(),
        tax_percentage: product.tax_percentage ?? 18,
        unit_code: product.unit_code || 'NIU',
        is_manual: false,
      }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
    setProductHighlight(-1);
  };

  const addManualItem = () => {
    setItems(prev => [...prev, {
      key: ++itemKey,
      product_id: '',
      description: '',
      code: '',
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0,
      tax_type: 'gravado',
      tax_percentage: 18,
      unit_code: 'ZZ',
      is_manual: true,
    }]);
  };

  const updateItem = (key: number, field: string, value: number | string) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i));
  };

  const removeItem = (key: number) => setItems(prev => prev.filter(i => i.key !== key));

  const calcItem = (item: QuotationItemRow) => {
    const gross    = item.quantity * item.unit_price;
    const discount = gross * (item.discount_percentage / 100);
    const net      = gross - discount;
    const isGrav   = item.tax_type === 'gravado';
    const igv      = isGrav ? net * (item.tax_percentage / 100) : 0;
    return { gross, discount, net, igv, total: net + igv };
  };

  const totals = items.reduce((acc, item) => {
    const v = calcItem(item);
    acc.subtotal += v.net;
    acc.igv      += v.igv;
    acc.discount += v.discount;
    acc.total    += v.total;
    return acc;
  }, { subtotal: 0, igv: 0, discount: 0, total: 0 });

  const handleDownloadPdf = async () => {
    if (!createdQuotation) return;
    setDownloadingPdf(true);
    try {
      const res = await api.get(`/companies/${companyId}/quotations/${createdQuotation.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cotizacion-${createdQuotation.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Error al descargar el PDF'); }
    finally { setDownloadingPdf(false); }
  };

  const handleSendEmail = async () => {
    if (!createdQuotation || !emailAddress) return;
    setSendingEmail(true);
    try {
      await api.post(`/companies/${companyId}/quotations/${createdQuotation.id}/send-email`, { email: emailAddress });
      toast.success(`Cotización enviada a ${emailAddress}`);
      setShowEmailInput(false);
      setEmailAddress('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar el correo');
    } finally { setSendingEmail(false); }
  };

  const handleClose = () => {
    setCreatedQuotation(null);
    setShowEmailInput(false);
    setEmailAddress('');
    onClose();
  };

  const handleSubmit = async () => {
    if (items.length === 0) { toast.error('Agrega al menos un producto'); return; }
    if (items.find(i => i.is_manual && !i.description.trim())) {
      toast.error('Completa la descripción de los productos manuales');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        client_id:     selectedClient?.id || undefined,
        currency,
        validity_date: validityDate || undefined,
        notes:         notes || undefined,
        terms:         terms || undefined,
        items: items.map(i => ({
          ...(i.is_manual
            ? { description: i.description, code: i.code, unit_code: i.unit_code }
            : { product_id: i.product_id }),
          quantity:             i.quantity,
          unit_price:           i.unit_price,
          discount_percentage:  i.discount_percentage,
          tax_type:             i.tax_type,
          tax_percentage:       i.tax_percentage,
        })),
      };

      const res = await api.post(`/companies/${companyId}/quotations`, payload);
      const q = res.data?.data;
      setCreatedQuotation({ id: q.id, number: q.number, total: Number(q.total) });
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Error al crear la cotización');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ── Confirmation screen after creation ──────────────────
  if (createdQuotation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative w-full max-w-md bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#232834] p-8 text-center">
          {/* Success icon */}
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-9 h-9 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">¡Cotización Creada!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-base">{createdQuotation.number}</span>
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Total: {currency} {createdQuotation.total.toFixed(2)}
          </p>

          {/* Email input */}
          {showEmailInput && (
            <div className="mb-4 flex gap-2">
              <input
                type="email"
                value={emailAddress}
                onChange={e => setEmailAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
                placeholder="correo@cliente.com"
                autoFocus
                className="flex-1 rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailAddress}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 transition"
              >
                {sendingEmail ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Enviar'}
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition disabled:opacity-50"
            >
              {downloadingPdf
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando PDF...</>
                : <><ArrowDownTrayIcon className="w-5 h-5" /> Descargar PDF</>}
            </button>
            <button
              onClick={() => setShowEmailInput(!showEmailInput)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#161A22] text-gray-700 dark:text-gray-300 font-medium transition"
            >
              <EnvelopeIcon className="w-5 h-5" />
              {showEmailInput ? 'Cancelar envío' : 'Enviar por correo'}
            </button>
            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 pb-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#232834] mx-4 my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#232834]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nueva Cotización</h2>
              <p className="text-xs text-gray-500">Proforma / Cotización de venta</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#161A22] rounded-lg transition">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">

          {/* Row 1: Currency + Validity + Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Moneda</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="PEN">PEN - Soles</option>
                <option value="USD">USD - Dólares</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Válida hasta</label>
              <input
                type="date"
                value={validityDate}
                onChange={e => setValidityDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notas</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notas o condiciones..."
                className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Client selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cliente (opcional)</label>
            {selectedClient ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-amber-300 dark:border-amber-600/50 bg-amber-50 dark:bg-amber-500/10">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedClient.name}</p>
                  <p className="text-xs text-gray-500">{selectedClient.document_type}: {selectedClient.document_number} | {selectedClient.address || 'Sin dirección'}</p>
                </div>
                <button onClick={() => { setSelectedClient(null); setClientSearch(''); }} className="p-1 hover:bg-white/50 rounded-lg">
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={clientSearchRef}
                      value={clientSearch}
                      onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                      onFocus={() => clientSearch.length >= 2 && setShowClientDropdown(true)}
                      onKeyDown={e => {
                        if (!showClientDropdown || clientResults.length === 0) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setClientHighlight(prev => Math.min(prev + 1, clientResults.length - 1)); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); setClientHighlight(prev => Math.max(prev - 1, 0)); }
                        else if (e.key === 'Enter' && clientHighlight >= 0) {
                          e.preventDefault();
                          const c = clientResults[clientHighlight];
                          setSelectedClient(c); setShowClientDropdown(false); setClientSearch(''); setClientHighlight(-1);
                        }
                        else if (e.key === 'Escape') { setShowClientDropdown(false); setClientHighlight(-1); }
                      }}
                      placeholder="Buscar por nombre, RUC o DNI..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  {clientSearch.length >= 8 && /^\d+$/.test(clientSearch) && (
                    <button
                      onClick={() => consultSunat(clientSearch)}
                      disabled={consultingSunat}
                      className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {consultingSunat ? (
                        <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Consultando...</>
                      ) : 'Consultar SUNAT'}
                    </button>
                  )}
                </div>
                {showClientDropdown && clientResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#161A22] rounded-xl border border-gray-200 dark:border-[#2A3244] shadow-xl max-h-48 overflow-y-auto">
                    {clientResults.map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClient(c); setShowClientDropdown(false); setClientSearch(''); setClientHighlight(-1); }}
                        className={clsx(
                          "w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-[#232834] last:border-0",
                          idx === clientHighlight ? "bg-amber-50 dark:bg-amber-500/15" : "hover:bg-gray-50 dark:hover:bg-[#0D1117]"
                        )}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                        <span className="ml-2 text-xs text-gray-500">{c.document_type}: {c.document_number}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showClientDropdown && clientSearch.length >= 2 && clientResults.length === 0 && !consultingSunat && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#161A22] rounded-xl border border-gray-200 dark:border-[#2A3244] shadow-xl p-3">
                    <p className="text-sm text-gray-500 text-center mb-2">No se encontraron clientes</p>
                    {/^\d{8,11}$/.test(clientSearch) && (
                      <button
                        onClick={() => consultSunat(clientSearch)}
                        disabled={consultingSunat}
                        className="w-full py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
                      >
                        Buscar en SUNAT y crear cliente
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Productos / Servicios</label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={manualMode}
                  onChange={e => setManualMode(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                />
                Modo manual
              </label>
            </div>

            {manualMode ? (
              <button
                onClick={addManualItem}
                className="w-full mb-3 py-2.5 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-600/50 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-500/10 transition flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Agregar producto manual
              </button>
            ) : (
              <div className="relative mb-3">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={productSearchRef}
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                    onFocus={() => productSearch.length >= 2 && setShowProductDropdown(true)}
                    onKeyDown={e => {
                      if (!showProductDropdown || productResults.length === 0) return;
                      if (e.key === 'ArrowDown') { e.preventDefault(); setProductHighlight(prev => Math.min(prev + 1, productResults.length - 1)); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setProductHighlight(prev => Math.max(prev - 1, 0)); }
                      else if (e.key === 'Enter' && productHighlight >= 0) { e.preventDefault(); addItem(productResults[productHighlight]); setProductHighlight(-1); }
                      else if (e.key === 'Escape') { setShowProductDropdown(false); setProductHighlight(-1); }
                    }}
                    placeholder="Buscar producto por nombre o código..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {showProductDropdown && productResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#161A22] rounded-xl border border-gray-200 dark:border-[#2A3244] shadow-xl max-h-48 overflow-y-auto">
                    {productResults.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => { addItem(p); setProductHighlight(-1); }}
                        className={clsx(
                          "w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 dark:border-[#232834] last:border-0 flex items-center justify-between",
                          idx === productHighlight ? "bg-amber-50 dark:bg-amber-500/15" : "hover:bg-gray-50 dark:hover:bg-[#0D1117]"
                        )}
                      >
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                          <span className="ml-2 text-xs text-gray-400">{p.code}</span>
                        </div>
                        <span className="text-amber-600 font-semibold text-sm">S/ {Number(p.sale_price || 0).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Items table */}
            {items.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#232834]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#161A22] text-gray-500 dark:text-gray-400 text-xs">
                      <th className="text-left px-3 py-2 font-medium">Producto</th>
                      <th className="text-center px-2 py-2 font-medium w-20">Cant.</th>
                      <th className="text-right px-2 py-2 font-medium w-28">P. Unit.</th>
                      <th className="text-center px-2 py-2 font-medium w-20">Dcto %</th>
                      <th className="text-center px-2 py-2 font-medium w-28">Impuesto</th>
                      <th className="text-right px-2 py-2 font-medium w-24">IGV</th>
                      <th className="text-right px-2 py-2 font-medium w-28">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const v = calcItem(item);
                      return (
                        <tr key={item.key} className="border-t border-gray-100 dark:border-[#232834]">
                          <td className="px-3 py-2">
                            {item.is_manual ? (
                              <input
                                type="text"
                                value={item.description}
                                onChange={e => updateItem(item.key, 'description', e.target.value)}
                                placeholder="Descripción del producto..."
                                className="w-full rounded-lg border border-amber-300 dark:border-amber-600/50 bg-amber-50 dark:bg-amber-500/10 text-gray-900 dark:text-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            ) : (
                              <>
                                <p className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">{item.description}</p>
                                <p className="text-xs text-gray-400">{item.code} | {item.unit_code}</p>
                              </>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number" min="1" step="1" value={item.quantity}
                              onChange={e => updateItem(item.key, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full text-center rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number" min="0" step="0.01"
                              value={parseFloat(Number(item.unit_price).toFixed(2))}
                              onChange={e => updateItem(item.key, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full text-right rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number" min="0" max="100" step="1" value={item.discount_percentage}
                              onChange={e => updateItem(item.key, 'discount_percentage', parseFloat(e.target.value) || 0)}
                              className="w-full text-center rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={item.tax_type}
                              onChange={e => {
                                const newType = e.target.value;
                                setItems(prev => prev.map(i => i.key === item.key ? { ...i, tax_type: newType, tax_percentage: newType === 'gravado' ? 18 : 0 } : i));
                              }}
                              className="w-full text-center rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="gravado">Gravado 18%</option>
                              <option value="exonerado">Exonerado</option>
                              <option value="inafecto">Inafecto</option>
                              <option value="gratuito">Gratuito</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 text-right text-gray-600 dark:text-gray-400">{v.igv.toFixed(2)}</td>
                          <td className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">{v.total.toFixed(2)}</td>
                          <td className="px-2 py-2">
                            <button onClick={() => removeItem(item.key)} className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-[#2A3244] rounded-xl">
                Busca y agrega productos para crear la cotización
              </div>
            )}
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="flex justify-end">
              <div className="w-72 space-y-1 bg-gray-50 dark:bg-[#161A22] rounded-xl p-4 border border-gray-200 dark:border-[#232834]">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Op. Gravada</span>
                  <span>{currency} {totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Descuento</span>
                    <span>-{currency} {totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>IGV (18%)</span>
                  <span>{currency} {totals.igv.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-[#232834] pt-2 mt-2 flex justify-between text-base font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{currency} {totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Terms */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Términos y condiciones</label>
            <textarea
              value={terms}
              onChange={e => setTerms(e.target.value)}
              rows={2}
              placeholder="Condiciones de pago, validez, entrega..."
              className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#232834]">
          <button onClick={handleClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#161A22] rounded-xl transition">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            className={clsx(
              'px-6 py-2.5 text-sm font-semibold rounded-xl transition flex items-center gap-2',
              submitting || items.length === 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25'
            )}
          >
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
            ) : (
              <><ClipboardDocumentListIcon className="w-4 h-4" /> Crear Cotización</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

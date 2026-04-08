'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  TrashIcon,
  ReceiptRefundIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Modal, Button, Input } from '@/components/ui';
import SunatQueueModal from '@/components/invoices/SunatQueueModal';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

// ── SUNAT Catálogos ──────────────────────────────────────────────────────────
const NC_REASON_CODES = [
  { code: '01', label: 'Anulación de la operación' },
  { code: '02', label: 'Anulación por error en el RUC' },
  { code: '03', label: 'Corrección por error en la descripción' },
  { code: '04', label: 'Descuento global' },
  { code: '05', label: 'Descuento por ítem' },
  { code: '06', label: 'Devolución total' },
  { code: '07', label: 'Devolución por ítem' },
  { code: '08', label: 'Bonificación' },
  { code: '09', label: 'Disminución en el valor' },
  { code: '10', label: 'Otros conceptos' },
  { code: '11', label: 'Ajustes de operaciones de exportación' },
  { code: '12', label: 'Ajustes afectos al IVAP' },
];

const ND_REASON_CODES = [
  { code: '01', label: 'Intereses por mora' },
  { code: '02', label: 'Aumento en el valor' },
  { code: '03', label: 'Penalidades / otros conceptos' },
  { code: '10', label: 'Otros conceptos' },
  { code: '11', label: 'Ajustes de operaciones de exportación' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const sunatStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: 'Borrador',   color: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',         icon: ClockIcon },
  pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400', icon: ClockIcon },
  sent:      { label: 'Enviado',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',         icon: ArrowPathIcon },
  accepted:  { label: 'Aceptado',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircleIcon },
  rejected:  { label: 'Rechazado',  color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',             icon: ExclamationCircleIcon },
  cancelled: { label: 'Anulado',    color: 'bg-gray-100 text-gray-500 dark:bg-gray-700/20 dark:text-gray-500',         icon: XCircleIcon },
};

const docTypeBadge: Record<string, string> = {
  nc: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  nd: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
};
const fmtMoney = (v: number | string | undefined, cur = 'PEN') => {
  const n = Number(v || 0);
  return `${cur === 'USD' ? 'US$' : 'S/'} ${n.toFixed(2)}`;
};

// ── Types ────────────────────────────────────────────────────────────────────
interface NoteRecord {
  id: string;
  series: string;
  correlative: number;
  issue_date: string;
  reason_code: string;
  reason_description: string;
  subtotal: number;
  tax_igv: number;
  total: number;
  status: string;
  currency: string;
  noteType: 'nc' | 'nd';
  client?: { id: string; name: string; document_type?: string; document_number?: string };
  invoice?: { id: string; series: string; correlative: number; document_type: string };
}

interface InvoiceOption {
  id: string;
  series: string;
  correlative: number;
  document_type: string;
  total: number;
  client?: { name: string };
  issue_date: string;
}

// ── Create Credit Note Modal ─────────────────────────────────────────────────
function CreateCreditNoteModal({ companyId, onClose, onCreated }: {
  companyId: string; onClose: () => void; onCreated: () => void;
}) {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceResults, setInvoiceResults] = useState<InvoiceOption[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [reasonCode, setReasonCode] = useState('01');
  const [reasonDescription, setReasonDescription] = useState(NC_REASON_CODES[0].label);
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const searchInvoices = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setInvoiceResults([]); return; }
    try {
      const res = await api.get(`/companies/${companyId}/invoices`, {
        params: { search: q, sunat_status: 'accepted', per_page: 10 },
      });
      setInvoiceResults(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { setInvoiceResults([]); }
  }, [companyId]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => searchInvoices(invoiceSearch), 350);
  }, [invoiceSearch, searchInvoices]);

  useEffect(() => {
    const found = NC_REASON_CODES.find(r => r.code === reasonCode);
    if (found) setReasonDescription(found.label);
  }, [reasonCode]);

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const handleSubmit = async () => {
    if (!selectedInvoice) { toast.error('Selecciona el comprobante de referencia'); return; }
    if (items.every(i => !i.quantity || !i.unit_price)) { toast.error('Agrega al menos un ítem válido'); return; }
    setSubmitting(true);
    try {
      await api.post(`/companies/${companyId}/credit-notes`, {
        invoice_id: selectedInvoice.id,
        reason_code: reasonCode,
        reason_description: reasonDescription,
        items: items.filter(i => i.quantity > 0 && i.unit_price > 0).map(i => ({
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      });
      toast.success('Nota de Crédito creada');
      onCreated(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al crear la Nota de Crédito');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 pb-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#232834] mx-4 my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#232834]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
              <ReceiptRefundIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nueva Nota de Crédito</h2>
              <p className="text-xs text-gray-500">Catálogo 09 SUNAT · Solo sobre comprobantes aceptados</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#161A22] rounded-lg transition">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* Comprobante de referencia */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Comprobante de referencia <span className="text-red-500">*</span>
              <span className="ml-1 text-gray-400">(solo aceptados por SUNAT)</span>
            </label>
            {selectedInvoice ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-300 dark:border-emerald-600/50 bg-emerald-50 dark:bg-emerald-500/10">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedInvoice.document_type === '01' ? 'Factura' : 'Boleta'} {selectedInvoice.series}-{String(selectedInvoice.correlative).padStart(8, '0')}
                  </p>
                  <p className="text-xs text-gray-500">{selectedInvoice.client?.name} · {fmtMoney(selectedInvoice.total)} · {fmtDate(selectedInvoice.issue_date)}</p>
                </div>
                <button onClick={() => { setSelectedInvoice(null); setInvoiceSearch(''); }} className="p-1 hover:bg-white/50 rounded-lg">
                  <XMarkIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={invoiceSearch}
                  onChange={e => { setInvoiceSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => invoiceSearch.length >= 2 && setShowDropdown(true)}
                  placeholder="Buscar por número o cliente..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {showDropdown && invoiceResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#161A22] rounded-xl border border-gray-200 dark:border-[#2A3244] shadow-xl max-h-48 overflow-y-auto">
                    {invoiceResults.map(inv => (
                      <button key={inv.id} onClick={() => { setSelectedInvoice(inv); setShowDropdown(false); setInvoiceSearch(''); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-[#0D1117] border-b border-gray-100 dark:border-[#232834] last:border-0">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {inv.document_type === '01' ? 'Factura' : 'Boleta'} {inv.series}-{String(inv.correlative).padStart(8, '0')}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">{inv.client?.name} · {fmtMoney(inv.total)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Motivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Motivo (Catálogo 09) <span className="text-red-500">*</span></label>
              <select value={reasonCode} onChange={e => setReasonCode(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                {NC_REASON_CODES.map(r => <option key={r.code} value={r.code}>{r.code} – {r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descripción del motivo</label>
              <input value={reasonDescription} onChange={e => setReasonDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>

          {/* Ítems */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Ítems a acreditar</label>
              <button onClick={() => setItems(p => [...p, { description: '', quantity: 1, unit_price: 0 }])}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                <PlusIcon className="w-3.5 h-3.5" /> Agregar ítem
              </button>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-[#232834] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#161A22] text-xs text-gray-500 dark:text-gray-400">
                    <th className="text-left px-3 py-2 font-medium">Descripción</th>
                    <th className="text-center px-2 py-2 font-medium w-20">Cant.</th>
                    <th className="text-right px-2 py-2 font-medium w-28">P. Unit.</th>
                    <th className="text-right px-2 py-2 font-medium w-24">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t border-gray-100 dark:border-[#232834]">
                      <td className="px-3 py-2">
                        <input value={item.description} onChange={e => setItems(p => p.map((i, j) => j === idx ? { ...i, description: e.target.value } : i))}
                          placeholder="Descripción..."
                          className="w-full rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min="0.01" step="0.01" value={item.quantity}
                          onChange={e => setItems(p => p.map((i, j) => j === idx ? { ...i, quantity: parseFloat(e.target.value) || 0 } : i))}
                          className="w-full text-center rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min="0" step="0.01" value={item.unit_price}
                          onChange={e => setItems(p => p.map((i, j) => j === idx ? { ...i, unit_price: parseFloat(e.target.value) || 0 } : i))}
                          className="w-full text-right rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                      </td>
                      <td className="px-2 py-2 text-right font-medium text-gray-700 dark:text-gray-300">{fmtMoney(item.quantity * item.unit_price)}</td>
                      <td className="px-2 py-2">
                        {items.length > 1 && (
                          <button onClick={() => setItems(p => p.filter((_, j) => j !== idx))} className="text-gray-400 hover:text-red-500 transition">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2 pr-10">
              <div className="space-y-0.5 text-sm">
                <div className="flex justify-between gap-8 text-gray-500 dark:text-gray-400"><span>Base imponible:</span><span>{fmtMoney(total / 1.18)}</span></div>
                <div className="flex justify-between gap-8 text-gray-500 dark:text-gray-400"><span>IGV (18%):</span><span>{fmtMoney(total - total / 1.18)}</span></div>
                <div className="flex justify-between gap-8 font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-[#232834] pt-1 mt-1"><span>Total:</span><span>{fmtMoney(total)}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#232834]">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#161A22] rounded-xl transition">Cancelar</button>
          <button onClick={handleSubmit} disabled={submitting || !selectedInvoice}
            className={clsx('px-6 py-2.5 text-sm font-semibold rounded-xl transition flex items-center gap-2',
              submitting || !selectedInvoice ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/25')}>
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando...</> : <><ReceiptRefundIcon className="w-4 h-4" />Crear Nota de Crédito</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Debit Note Modal ──────────────────────────────────────────────────
function CreateDebitNoteModal({ companyId, onClose, onCreated }: {
  companyId: string; onClose: () => void; onCreated: () => void;
}) {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceResults, setInvoiceResults] = useState<InvoiceOption[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [reasonCode, setReasonCode] = useState('01');
  const [reasonDescription, setReasonDescription] = useState(ND_REASON_CODES[0].label);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const searchInvoices = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setInvoiceResults([]); return; }
    try {
      const res = await api.get(`/companies/${companyId}/invoices`, {
        params: { search: q, sunat_status: 'accepted', per_page: 10 },
      });
      setInvoiceResults(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { setInvoiceResults([]); }
  }, [companyId]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => searchInvoices(invoiceSearch), 350);
  }, [invoiceSearch, searchInvoices]);

  useEffect(() => {
    const found = ND_REASON_CODES.find(r => r.code === reasonCode);
    if (found) setReasonDescription(found.label);
  }, [reasonCode]);

  const amountNum = parseFloat(amount) || 0;
  const base = amountNum / 1.18;
  const igv = amountNum - base;

  const handleSubmit = async () => {
    if (!selectedInvoice) { toast.error('Selecciona el comprobante de referencia'); return; }
    if (!amountNum || amountNum <= 0) { toast.error('Ingresa un monto válido'); return; }
    setSubmitting(true);
    try {
      await api.post(`/companies/${companyId}/debit-notes`, {
        invoice_id: selectedInvoice.id,
        reason_code: reasonCode,
        reason_description: reasonDescription,
        amount: amountNum,
      });
      toast.success('Nota de Débito creada');
      onCreated(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al crear la Nota de Débito');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 pb-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#232834] mx-4 my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#232834]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nueva Nota de Débito</h2>
              <p className="text-xs text-gray-500">Catálogo 10 SUNAT · Solo sobre comprobantes aceptados</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#161A22] rounded-lg transition">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Comprobante de referencia <span className="text-red-500">*</span>
              <span className="ml-1 text-gray-400">(solo aceptados por SUNAT)</span>
            </label>
            {selectedInvoice ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-300 dark:border-emerald-600/50 bg-emerald-50 dark:bg-emerald-500/10">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedInvoice.document_type === '01' ? 'Factura' : 'Boleta'} {selectedInvoice.series}-{String(selectedInvoice.correlative).padStart(8, '0')}
                  </p>
                  <p className="text-xs text-gray-500">{selectedInvoice.client?.name} · {fmtMoney(selectedInvoice.total)}</p>
                </div>
                <button onClick={() => { setSelectedInvoice(null); setInvoiceSearch(''); }} className="p-1 rounded-lg hover:bg-white/50">
                  <XMarkIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={invoiceSearch} onChange={e => { setInvoiceSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => invoiceSearch.length >= 2 && setShowDropdown(true)}
                  placeholder="Buscar por número o cliente..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                {showDropdown && invoiceResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-[#161A22] rounded-xl border border-gray-200 dark:border-[#2A3244] shadow-xl max-h-48 overflow-y-auto">
                    {invoiceResults.map(inv => (
                      <button key={inv.id} onClick={() => { setSelectedInvoice(inv); setShowDropdown(false); setInvoiceSearch(''); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-[#0D1117] border-b border-gray-100 dark:border-[#232834] last:border-0">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {inv.document_type === '01' ? 'Factura' : 'Boleta'} {inv.series}-{String(inv.correlative).padStart(8, '0')}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">{inv.client?.name} · {fmtMoney(inv.total)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Motivo (Catálogo 10) <span className="text-red-500">*</span></label>
              <select value={reasonCode} onChange={e => setReasonCode(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                {ND_REASON_CODES.map(r => <option key={r.code} value={r.code}>{r.code} – {r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descripción del motivo</label>
              <input value={reasonDescription} onChange={e => setReasonDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Monto total inc. IGV <span className="text-red-500">*</span></label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-48 rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            {amountNum > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <p>Base imponible: {fmtMoney(base)}</p>
                <p>IGV (18%): {fmtMoney(igv)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#232834]">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#161A22] rounded-xl transition">Cancelar</button>
          <button onClick={handleSubmit} disabled={submitting || !selectedInvoice || !amountNum}
            className={clsx('px-6 py-2.5 text-sm font-semibold rounded-xl transition flex items-center gap-2',
              submitting || !selectedInvoice || !amountNum ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25')}>
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando...</> : <><DocumentTextIcon className="w-4 h-4" />Crear Nota de Débito</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CreditDebitNotesPage() {
  const { user } = useAuthStore();
  const companyId = user?.current_company_id || user?.companies?.[0]?.id;

  const [selectedTab, setSelectedTab] = useState('all');
  const [allNotes, setAllNotes] = useState<NoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ status?: string; date_from?: string; date_to?: string }>({});
  const [showCreateNC, setShowCreateNC] = useState(false);
  const [showCreateND, setShowCreateND] = useState(false);
  const [showSunatModal, setShowSunatModal] = useState(false);
  const [actionNote, setActionNote] = useState<NoteRecord | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const tabs = [
    { id: 'all',      label: 'Todos',            count: meta?.total },
    { id: 'nc',       label: 'Notas de Crédito' },
    { id: 'nd',       label: 'Notas de Débito'  },
    { id: 'pending',  label: 'Pendientes'        },
    { id: 'accepted', label: 'Aceptados'         },
    { id: 'cancelled',label: 'Anulados'          },
  ];

  const fetchNotes = useCallback(async (page = 1) => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const params: any = { per_page: 15, page, ...filters };

      const [ncRes, ndRes] = await Promise.all([
        api.get(`/companies/${companyId}/credit-notes`, { params }),
        api.get(`/companies/${companyId}/debit-notes`, { params }),
      ]);

      const ncData: NoteRecord[] = (ncRes.data?.data || []).map((n: any) => ({ ...n, noteType: 'nc' }));
      const ndData: NoteRecord[] = (ndRes.data?.data || []).map((n: any) => ({ ...n, noteType: 'nd' }));

      const combined = [...ncData, ...ndData].sort(
        (a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
      );

      setAllNotes(combined);
      const totalNC = ncRes.data?.meta?.total || 0;
      const totalND = ndRes.data?.meta?.total || 0;
      setMeta({ total: totalNC + totalND, per_page: 15, last_page: Math.ceil((totalNC + totalND) / 15) });
    } catch {
      setAllNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, filters]);

  useEffect(() => { fetchNotes(currentPage); }, [fetchNotes, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setCurrentPage(1), 400);
  };

  const handleCancel = async (note: NoteRecord) => {
    if (!confirm('¿Anular este documento? Esta acción no se puede deshacer.')) return;
    setActionLoading('anular');
    try {
      const endpoint = note.noteType === 'nc'
        ? `/companies/${companyId}/credit-notes/${note.id}`
        : `/companies/${companyId}/debit-notes/${note.id}`;
      await api.delete(endpoint);
      toast.success(`${note.noteType === 'nc' ? 'Nota de Crédito' : 'Nota de Débito'} anulada`);
      setShowActionsModal(false);
      setActionNote(null);
      fetchNotes(currentPage);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al anular');
    } finally { setActionLoading(null); }
  };

  // Filter by tab
  const filtered = allNotes.filter(n => {
    if (selectedTab === 'nc') return n.noteType === 'nc';
    if (selectedTab === 'nd') return n.noteType === 'nd';
    if (selectedTab === 'pending') return n.status === 'pending';
    if (selectedTab === 'accepted') return n.status === 'accepted';
    if (selectedTab === 'cancelled') return n.status === 'cancelled';
    return true;
  }).filter(n => {
    if (!searchInput) return true;
    const s = searchInput.toLowerCase();
    return (
      `${n.series}-${n.correlative}`.toLowerCase().includes(s) ||
      n.client?.name?.toLowerCase().includes(s) ||
      n.reason_description?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notas de Débito y Crédito</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Documentos de ajuste sobre comprobantes aceptados por SUNAT</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowCreateND(true)} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-sm">
            <PlusIcon className="w-4 h-4" /> Nueva N. Débito
          </button>
          <button onClick={() => setShowCreateNC(true)} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition shadow-lg shadow-orange-500/25">
            <PlusIcon className="w-4 h-4" /> Nueva N. Crédito
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-[#232834]">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
              className={clsx(
                'py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                selectedTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}>
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchInput} onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar por número, cliente, motivo..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={clsx(
          'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition',
          showFilters
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-600/50 text-emerald-700 dark:text-emerald-400'
            : 'bg-white dark:bg-[#0D1117] border-gray-200 dark:border-[#232834] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#161A22]'
        )}>
          <FunnelIcon className="w-4 h-4" /> Filtros
        </button>
        <button onClick={() => fetchNotes(currentPage)} className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-[#161A22] rounded-xl border border-gray-200 dark:border-[#232834] transition" title="Actualizar">
          <ArrowPathIcon className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#232834]">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select value={filters.status || ''} onChange={e => { setFilters({ ...filters, status: e.target.value || undefined }); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="accepted">Aceptado</option>
              <option value="rejected">Rechazado</option>
              <option value="cancelled">Anulado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input type="date" value={filters.date_from || ''} onChange={e => { setFilters({ ...filters, date_from: e.target.value || undefined }); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input type="date" value={filters.date_to || ''} onChange={e => { setFilters({ ...filters, date_to: e.target.value || undefined }); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFilters({}); setSearchInput(''); setSelectedTab('all'); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-600/30 transition">
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#232834] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#161A22]">
                {['Documento', 'Comprobante Ref.', 'Cliente', 'Motivo', 'Subtotal', 'IGV', 'Total', 'SUNAT', 'Acciones'].map(h => (
                  <th key={h} className={clsx(
                    'px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    ['Subtotal', 'IGV', 'Total'].includes(h) ? 'text-right' : ['SUNAT', 'Acciones'].includes(h) ? 'text-center' : 'text-left'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1E2230]">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <ReceiptRefundIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron documentos</p>
                    <p className="text-xs text-gray-400 mt-1">Crea una nota de crédito o débito con los botones de arriba</p>
                  </td>
                </tr>
              ) : filtered.map(note => {
                const ss = sunatStatusConfig[note.status] || sunatStatusConfig.pending;
                const SIcon = ss.icon;
                const docNum = String(note.correlative).padStart(8, '0');
                const isNC = note.noteType === 'nc';
                return (
                  <tr key={note.id} className="hover:bg-gray-50/50 dark:hover:bg-[#161A22]/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className={clsx('inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase', docTypeBadge[note.noteType])}>
                        {isNC ? 'N. Crédito' : 'N. Débito'}
                      </span>
                      <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{note.series}-{docNum}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {note.invoice ? (
                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          {note.invoice.document_type === '01' ? 'F' : 'B'} {note.invoice.series}-{String(note.invoice.correlative).padStart(8, '0')}
                        </p>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-900 dark:text-white font-medium truncate max-w-[150px]">{note.client?.name || 'Sin cliente'}</p>
                      {note.client?.document_number && (
                        <p className="text-xs text-gray-400">{note.client.document_type}: {note.client.document_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[160px]" title={note.reason_description}>
                        <span className="font-mono font-bold text-gray-700 dark:text-gray-300 mr-1">{note.reason_code}</span>
                        {note.reason_description}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-right text-gray-600 dark:text-gray-400">{fmtMoney(note.subtotal, note.currency)}</td>
                    <td className="px-4 py-3.5 text-sm text-right text-gray-500">{fmtMoney(note.tax_igv, note.currency)}</td>
                    <td className="px-4 py-3.5 text-sm text-right font-bold text-gray-900 dark:text-white">{fmtMoney(note.total, note.currency)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold', ss.color)}>
                        <SIcon className="w-3 h-3" /> {ss.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button onClick={() => { setActionNote(note); setShowActionsModal(true); }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded-lg text-gray-500 hover:text-emerald-600 transition" title="Acciones">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-[#232834] flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {((currentPage - 1) * meta.per_page) + 1} – {Math.min(currentPage * meta.per_page, meta.total)} de {meta.total} documentos
            </p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(meta.last_page, 7) }, (_, i) => {
                let page: number;
                if (meta.last_page <= 7) { page = i + 1; }
                else if (currentPage <= 4) { page = i + 1; }
                else if (currentPage >= meta.last_page - 3) { page = meta.last_page - 6 + i; }
                else { page = currentPage - 3 + i; }
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={clsx('w-8 h-8 rounded-lg text-xs font-medium transition',
                      currentPage === page ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#161A22]')}>
                    {page}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Actions Modal */}
      <Modal
        isOpen={showActionsModal}
        onClose={() => { setShowActionsModal(false); setActionNote(null); }}
        title={actionNote ? `${actionNote.noteType === 'nc' ? 'N. Crédito' : 'N. Débito'} ${actionNote.series}-${String(actionNote.correlative).padStart(8, '0')}` : 'Acciones'}
        size="sm"
      >
        {actionNote && (
          <div className="space-y-1 py-1">
            {/* Info del documento */}
            <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#161A22] border border-gray-100 dark:border-[#232834] mb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ref: {actionNote.invoice
                  ? `${actionNote.invoice.document_type === '01' ? 'Factura' : 'Boleta'} ${actionNote.invoice.series}-${String(actionNote.invoice.correlative).padStart(8, '0')}`
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Motivo: <span className="font-medium">{actionNote.reason_code} – {actionNote.reason_description}</span>
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{fmtMoney(actionNote.total, actionNote.currency)}</p>
            </div>

            {/* Anular */}
            {actionNote.status !== 'accepted' && actionNote.status !== 'cancelled' && (
              <button onClick={() => handleCancel(actionNote)} disabled={actionLoading === 'anular'}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition">
                <TrashIcon className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Anular documento</p>
                  <p className="text-xs text-gray-400">Esta acción no se puede deshacer</p>
                </div>
              </button>
            )}

            {actionNote.status === 'accepted' && (
              <div className="px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                Documento aceptado por SUNAT — no se puede anular
              </div>
            )}
            {actionNote.status === 'cancelled' && (
              <div className="px-4 py-3 text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/20 rounded-xl flex items-center gap-2">
                <XCircleIcon className="w-4 h-4 flex-shrink-0" />
                Documento ya anulado
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create modals */}
      {showCreateNC && companyId && (
        <CreateCreditNoteModal companyId={companyId} onClose={() => setShowCreateNC(false)} onCreated={() => fetchNotes(1)} />
      )}
      {showCreateND && companyId && (
        <CreateDebitNoteModal companyId={companyId} onClose={() => setShowCreateND(false)} onCreated={() => fetchNotes(1)} />
      )}

      <SunatQueueModal isOpen={showSunatModal} onClose={() => setShowSunatModal(false)} />

      <div className="flex justify-end pt-4">
        <button
          onClick={() => setShowSunatModal(true)}
          className="relative flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition border border-emerald-200 dark:border-emerald-500/30 shadow-sm bg-white dark:bg-[#0D1117]"
        >
          <CloudArrowUpIcon className="w-5 h-5" />
          Conexión SUNAT
        </button>
      </div>
    </div>
  );
}

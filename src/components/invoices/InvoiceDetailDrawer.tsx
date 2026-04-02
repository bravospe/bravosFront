'use client';

import { clsx } from 'clsx';
import {
  XMarkIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Invoice } from '@/stores/invoiceStore';
import { Modal } from '@/components/ui';

interface Props {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSendSunat: (id: string) => void;
  onDownloadPdf: (id: string) => void;
  onDownloadXml: (id: string) => void;
  onDownloadCdr: (id: string) => void;
  actionLoading?: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending:  { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400', icon: ClockIcon },
  sent:     { label: 'Enviado',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: ArrowPathIcon },
  accepted: { label: 'Aceptado',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircleIcon },
  rejected: { label: 'Rechazado',  color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', icon: ExclamationCircleIcon },
  annulled: { label: 'Anulado',    color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400', icon: XCircleIcon },
};

const docTypeNames: Record<string, string> = {
  '01': 'Factura Electrónica',
  '03': 'Boleta de Venta Electrónica',
  '07': 'Nota de Crédito Electrónica',
  '08': 'Nota de Débito Electrónica',
  '00': 'Nota de Venta',
};

const paymentNames: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  credit: 'Crédito',
};

const fmtMoney = (v: number | string | undefined, cur = 'PEN') => {
  const n = Number(v || 0);
  const sym = cur === 'USD' ? 'US$' : 'S/';
  return `${sym} ${n.toFixed(2)}`;
};

export default function InvoiceDetailDrawer({
  invoice,
  isOpen,
  onClose,
  onSendSunat,
  onDownloadPdf,
  onDownloadXml,
  onDownloadCdr,
  actionLoading,
}: Props) {
  if (!invoice) return null;

  const isNV = invoice.document_type === '00';
  const status = isNV
    ? { label: 'Procesado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircleIcon }
    : (statusConfig[invoice.sunat_status] || statusConfig.pending);
  const StatusIcon = status.icon;
  const docNumber = `${invoice.series}-${String(invoice.number || invoice.correlative || '').padStart(8, '0')}`;
  const hasXml = !!(invoice.xml_path);
  const hasCdr = !!(invoice.cdr_path);
  const hasPdf = !!(invoice.pdf_path);
  const isPending = !isNV && (invoice.sunat_status === 'pending' || invoice.sunat_status === 'rejected');
  const cur = invoice.currency || 'PEN';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="space-y-5 -mt-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{docTypeNames[invoice.document_type] || 'Comprobante'}</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{docNumber}</h2>
          </div>
          <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold', status.color)}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </span>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap gap-2">
          {isPending && (
            <button
              onClick={() => onSendSunat(invoice.id)}
              disabled={actionLoading === 'sunat'}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              {actionLoading === 'sunat' ? 'Enviando...' : 'Enviar a SUNAT'}
            </button>
          )}
          <button
            onClick={() => onDownloadPdf(invoice.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition"
          >
            <DocumentArrowDownIcon className="w-4 h-4" /> PDF
          </button>
          {hasXml && (
            <button onClick={() => onDownloadXml(invoice.id)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition">
              XML
            </button>
          )}
          {hasCdr && (
            <button onClick={() => onDownloadCdr(invoice.id)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-500/20 rounded-xl transition">
              CDR
            </button>
          )}
        </div>

        {/* Client info */}
        <div className="bg-gray-50 dark:bg-[#161A22] rounded-xl p-4 border border-gray-200 dark:border-[#232834]">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Cliente</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.client?.name || invoice.client?.business_name || 'Cliente varios'}</p>
          {invoice.client && (
            <p className="text-xs text-gray-500 mt-0.5">{invoice.client.document_type}: {invoice.client.document_number}</p>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Fecha Emisión', value: invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('es-PE') : '-' },
            { label: 'Vencimiento', value: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('es-PE') : '-' },
            { label: 'Moneda', value: cur },
            { label: 'Forma de Pago', value: paymentNames[invoice.payment_method || ''] || invoice.payment_method || '-' },
          ].map((f, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#161A22] rounded-xl p-3 border border-gray-200 dark:border-[#232834]">
              <p className="text-[10px] font-medium text-gray-400 uppercase">{f.label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>

        {/* SUNAT Timeline — only for electronic documents */}
        {invoice.document_type !== '00' && (
          <div className="bg-gray-50 dark:bg-[#161A22] rounded-xl p-4 border border-gray-200 dark:border-[#232834]">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">Trazabilidad SUNAT</p>
            <div className="flex items-center gap-0">
              {/* Step 1: Emitido */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                </div>
                <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mt-1 text-center">Emitido</p>
                <p className="text-[10px] text-gray-500 text-center">{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('es-PE') : '-'}</p>
              </div>
              {/* Connector */}
              <div className={`flex-1 h-0.5 mx-1 ${(invoice as any).sent_at ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
              {/* Step 2: Enviado */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(invoice as any).sent_at ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <svg className={`w-4 h-4 ${(invoice as any).sent_at ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                </div>
                <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mt-1 text-center">Enviado</p>
                <p className="text-[10px] text-gray-500 text-center">{(invoice as any).sent_at ? new Date((invoice as any).sent_at).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
              </div>
              {/* Connector */}
              <div className={`flex-1 h-0.5 mx-1 ${(invoice as any).accepted_at ? 'bg-emerald-400' : invoice.sunat_status === 'rejected' ? 'bg-red-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
              {/* Step 3: SUNAT */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(invoice as any).accepted_at ? 'bg-emerald-100 dark:bg-emerald-900/30' : invoice.sunat_status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {(invoice as any).accepted_at ? (
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  ) : invoice.sunat_status === 'rejected' ? (
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  )}
                </div>
                <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mt-1 text-center">SUNAT</p>
                <p className="text-[10px] text-gray-500 text-center">
                  {(invoice as any).accepted_at
                    ? new Date((invoice as any).accepted_at).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : invoice.sunat_status === 'rejected' ? 'Rechazado'
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Items table */}
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Detalle de Items</p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#232834]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#161A22] text-gray-500 dark:text-gray-400 text-xs">
                  <th className="text-left px-3 py-2 font-medium">Descripción</th>
                  <th className="text-center px-2 py-2 font-medium w-14">Cant.</th>
                  <th className="text-right px-2 py-2 font-medium w-20">P. Unit.</th>
                  {invoice.document_type !== '00' && <th className="text-right px-2 py-2 font-medium w-16">IGV</th>}
                  <th className="text-right px-3 py-2 font-medium w-20">Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item: any, idx: number) => (
                  <tr key={idx} className="border-t border-gray-100 dark:border-[#232834]">
                    <td className="px-3 py-2.5">
                      <p className="text-gray-900 dark:text-white font-medium">{item.description || item.product_name || '-'}</p>
                      {(item.code || item.product_code) && (
                        <p className="text-xs text-gray-400">{item.code || item.product_code}</p>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-center text-gray-700 dark:text-gray-300">{item.quantity}</td>
                    <td className="px-2 py-2.5 text-right text-gray-700 dark:text-gray-300">{Number(item.unit_price || 0).toFixed(2)}</td>
                    {invoice.document_type !== '00' && <td className="px-2 py-2.5 text-right text-gray-500">{Number(item.tax_amount ?? 0).toFixed(2)}</td>}
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900 dark:text-white">{Number(item.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-1.5 bg-gray-50 dark:bg-[#161A22] rounded-xl p-4 border border-gray-200 dark:border-[#232834]">
            {!isNV && (
              <>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Op. Gravada</span>
                  <span>{fmtMoney(invoice.subtotal, cur)}</span>
                </div>
                {Number(invoice.discount_amount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Descuento</span>
                    <span>-{fmtMoney(invoice.discount_amount, cur)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>IGV (18%)</span>
                  <span>{fmtMoney(invoice.tax_amount ?? invoice.tax_igv, cur)}</span>
                </div>
              </>
            )}
            {isNV && Number(invoice.discount_amount ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Descuento</span>
                <span>-{fmtMoney(invoice.discount_amount, cur)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-[#232834] pt-2 mt-2 flex justify-between font-bold text-base text-gray-900 dark:text-white">
              <span>Total</span>
              <span>{fmtMoney(invoice.total, cur)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-xl p-4 border border-yellow-200 dark:border-yellow-500/30">
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Observaciones</p>
            <p className="text-sm text-yellow-800 dark:text-yellow-300">{invoice.notes}</p>
          </div>
        )}

        {/* SUNAT Info */}
        {invoice.sunat_hash && (
          <div className="bg-gray-50 dark:bg-[#161A22] rounded-xl p-3 border border-gray-200 dark:border-[#232834]">
            <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Hash SUNAT</p>
            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">{invoice.sunat_hash}</p>
          </div>
        )}

        {/* SUNAT response */}
        {invoice.sunat_response && typeof invoice.sunat_response === 'object' && (invoice.sunat_response as any).description && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 border border-emerald-200 dark:border-emerald-500/30">
            <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase mb-1">Respuesta SUNAT</p>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">{(invoice.sunat_response as any).description}</p>
          </div>
        )}

        {/* Files status */}
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Archivos</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'XML', has: hasXml, action: () => onDownloadXml(invoice.id), desc: 'Comprobante firmado', hide: invoice.document_model === 'sale' },
              { label: 'CDR', has: hasCdr, action: () => onDownloadCdr(invoice.id), desc: 'Constancia recepción', hide: invoice.document_model === 'sale' },
              { label: 'PDF', has: hasPdf, action: () => onDownloadPdf(invoice.id), desc: 'Representación impresa', hide: invoice.document_model === 'sale' },
            ].filter(f => !f.hide).map((f) => (
              <button
                key={f.label}
                onClick={f.has ? f.action : undefined}
                disabled={!f.has}
                className={clsx(
                  'p-3 rounded-xl border text-center transition',
                  f.has
                    ? 'border-emerald-200 dark:border-emerald-600/30 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 cursor-pointer'
                    : 'border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#161A22] opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  {f.has ? (
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={clsx('text-sm font-bold', f.has ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400')}>{f.label}</span>
                </div>
                <p className="text-[10px] text-gray-500">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

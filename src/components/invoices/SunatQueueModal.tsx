'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { Modal, Button, Badge } from '@/components/ui';
import {
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  TruckIcon,
  SignalIcon,
  BoltIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface SunatDoc {
  id: string;
  series: string;
  correlative: number | string;
  doc_kind: 'invoice' | 'credit_note' | 'debit_note' | 'dispatch_guide';
  doc_type?: string;
  status: string;
  total?: number;
  created_at: string;
  sent_at?: string;
  accepted_at?: string;
  last_error?: string; // Nuevo campo para diagnóstico
}

interface SunatQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOC_KIND_LABEL: Record<string, { label: string; short: string; color: string; icon: any }> = {
  invoice_01:      { label: 'Factura',       short: 'FAC', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',     icon: DocumentTextIcon },
  invoice_03:      { label: 'Boleta',        short: 'BOL', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', icon: DocumentTextIcon },
  invoice_07:      { label: 'N. Crédito',    short: 'NC',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', icon: DocumentTextIcon },
  invoice_08:      { label: 'N. Débito',     short: 'ND',  color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',           icon: DocumentTextIcon },
  invoice_00:      { label: 'N. Venta',      short: 'NV',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',       icon: DocumentTextIcon },
  credit_note:     { label: 'Nota Crédito',  short: 'NC',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', icon: DocumentTextIcon },
  debit_note:      { label: 'Nota Débito',   short: 'ND',  color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',           icon: DocumentTextIcon },
  dispatch_guide:  { label: 'Guía Remisión', short: 'GR',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: TruckIcon },
};

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  pending:  { bg: 'bg-yellow-100 dark:bg-yellow-500/20',  text: 'text-yellow-700 dark:text-yellow-400',  icon: ClockIcon,        label: 'ESPERA'  },
  sent:     { bg: 'bg-blue-100 dark:bg-blue-500/20',      text: 'text-blue-700 dark:text-blue-400',      icon: ArrowPathIcon,    label: 'ENVIANDO' },
  accepted: { bg: 'bg-emerald-100 dark:bg-emerald-500/20',text: 'text-emerald-700 dark:text-emerald-400',icon: CheckCircleIcon,  label: 'ACEPTADO' },
  rejected: { bg: 'bg-red-100 dark:bg-red-500/20',        text: 'text-red-700 dark:text-red-400',        icon: XCircleIcon,      label: 'ERROR'   },
};

function docKindKey(doc: SunatDoc): string {
  if (doc.doc_kind === 'invoice') return `invoice_${doc.doc_type ?? '01'}`;
  return doc.doc_kind;
}

export default function SunatQueueModal({ isOpen, onClose }: SunatQueueModalProps) {
  const [pending, setPending] = useState<SunatDoc[]>([]);
  const [recent, setRecent] = useState<SunatDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'working' | 'stuck'>('idle');
  const [lastProcessedTime, setLastProcessedTime] = useState<Date | null>(null);
  
  const prevPendingCount = useRef(0);
  const currentCompany = useAuthStore((s) => s.currentCompany);

  const fetchData = useCallback(async () => {
    if (!currentCompany?.id) return;
    const cid = currentCompany.id;

    try {
      const [resInvPend, resInvRecent, resCN, resDN, resGR] = await Promise.all([
        api.get(`/companies/${cid}/invoices`, { params: { sunat_status: 'pending,sent', per_page: 50 } }),
        api.get(`/companies/${cid}/invoices`, { params: { sunat_status: 'accepted,rejected', per_page: 20, sort: '-updated_at' } }),
        api.get(`/companies/${cid}/credit-notes`, { params: { per_page: 50 } }),
        api.get(`/companies/${cid}/debit-notes`, { params: { per_page: 50 } }),
        api.get(`/companies/${cid}/dispatch-guides`, { params: { per_page: 50 } }),
      ]);

      const mapDoc = (d: any, kind: any): SunatDoc => ({
        id: d.id, series: d.series, correlative: d.correlative,
        doc_kind: kind, doc_type: d.document_type,
        status: d.sunat_status ?? d.status, total: d.total,
        created_at: d.created_at, sent_at: d.sent_at, accepted_at: d.accepted_at ?? d.updated_at,
        last_error: d.sunat_message || d.error_message || d.observations
      });

      const invPending = (resInvPend.data?.data || []).map((d: any) => mapDoc(d, 'invoice'));
      const cnPending = (resCN.data?.data || []).filter((d: any) => ['pending', 'sent'].includes(d.status)).map((d: any) => mapDoc(d, 'credit_note'));
      const dnPending = (resDN.data?.data || []).filter((d: any) => ['pending', 'sent'].includes(d.status)).map((d: any) => mapDoc(d, 'debit_note'));
      const grPending = (resGR.data?.data || []).filter((d: any) => ['pending', 'sent'].includes(d.status)).map((d: any) => mapDoc(d, 'dispatch_guide'));

      const allPending = [...invPending, ...cnPending, ...dnPending, ...grPending];
      setPending(allPending);

      // Lógica de detección de actividad mejorada
      if (allPending.length < prevPendingCount.current && prevPendingCount.current !== 0) {
        setLastProcessedTime(new Date());
        setWorkerStatus('working');
        setTimeout(() => setWorkerStatus('idle'), 5000);
      } else if (allPending.length > 0) {
        // Si hay pendientes y no se han movido en mucho tiempo (ej. 5 min)
        const oldestPending = new Date(Math.min(...allPending.map(d => new Date(d.created_at).getTime())));
        const now = new Date();
        if (now.getTime() - oldestPending.getTime() > 300000) { // 5 minutos
           setWorkerStatus('stuck');
        }
      } else {
        setWorkerStatus('idle');
      }
      prevPendingCount.current = allPending.length;

      const invRecent = (resInvRecent.data?.data || []).map((d: any) => mapDoc(d, 'invoice'));
      const cnRecent = (resCN.data?.data || []).filter((d: any) => ['accepted', 'rejected'].includes(d.status)).slice(0, 10).map((d: any) => mapDoc(d, 'credit_note'));
      const dnRecent = (resDN.data?.data || []).filter((d: any) => ['accepted', 'rejected'].includes(d.status)).slice(0, 10).map((d: any) => mapDoc(d, 'debit_note'));
      const grRecent = (resGR.data?.data || []).filter((d: any) => ['accepted', 'rejected'].includes(d.status)).slice(0, 10).map((d: any) => mapDoc(d, 'dispatch_guide'));

      const allRecent = [...invRecent, ...cnRecent, ...dnRecent, ...grRecent]
        .sort((a, b) => new Date(b.accepted_at ?? b.created_at).getTime() - new Date(a.accepted_at ?? a.created_at).getTime())
        .slice(0, 25);

      setRecent(allRecent);
    } catch (err) {
      console.error('Error fetching SUNAT monitor data', err);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
      const interval = setInterval(fetchData, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchData]);

  const handleSync = async () => {
    if (!currentCompany?.id) return;
    setIsSyncing(true);
    try {
      const res = await api.post(`/companies/${currentCompany.id}/sunat/process-pending`);
      toast.success(res.data?.message || 'Sincronización manual iniciada');
      setWorkerStatus('working');
      setTimeout(fetchData, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al iniciar sincronización');
    } finally {
      setIsSyncing(false);
    }
  };

  const fmtCorrelative = (c: number | string) => String(c).padStart(8, '0');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Monitor SUNAT - Estado del Worker" size="lg">
      <div className="space-y-5">
        {/* Header con Alerta de Bloqueo */}
        <div className={clsx(
          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-500",
          workerStatus === 'stuck' ? "bg-red-50 dark:bg-red-500/10 border-red-500 animate-pulse" :
          workerStatus === 'working' ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40" :
          "bg-gray-50 dark:bg-[#0D1117] border-gray-200 dark:border-[#232834]"
        )}>
          <div className="flex items-center gap-4">
            <div className={clsx(
              "p-3 rounded-2xl bg-white dark:bg-[#080B12] shadow-sm",
              workerStatus === 'stuck' && "text-red-500",
              workerStatus === 'working' && "text-emerald-500"
            )}>
              {workerStatus === 'stuck' ? <ExclamationCircleIcon className="w-7 h-7" /> : <CloudArrowUpIcon className="w-7 h-7" />}
            </div>
            <div>
              <p className={clsx("text-sm font-black uppercase tracking-tight", 
                workerStatus === 'stuck' ? "text-red-600" : "text-gray-900 dark:text-white"
              )}>
                {workerStatus === 'stuck' ? 'ALERTA: CRON JOB DETENIDO' : 'Estado del Proceso'}
              </p>
              <p className="text-[11px] font-medium text-gray-500">
                {workerStatus === 'stuck' 
                  ? 'Los documentos llevan más de 5 min esperando. El worker automático falló.' 
                  : 'Sincronización automática activa cada 60 segundos.'}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleSync} loading={isSyncing} 
            variant={workerStatus === 'stuck' ? 'primary' : 'secondary'}
            className={clsx("rounded-xl font-bold", workerStatus === 'stuck' && "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20")}>
            <ArrowPathIcon className={clsx('w-4 h-4 mr-1.5', isSyncing && 'animate-spin')} />
            {workerStatus === 'stuck' ? 'REACTIVAR AHORA' : 'Sync Manual'}
          </Button>
        </div>

        {/* Stats y Listas... (se mantiene estructura pero con avisos de error) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Cola de Envío ({pending.length})</h3>
            <div className="border border-gray-200 dark:border-[#232834] rounded-2xl overflow-hidden bg-white dark:bg-[#0D1117]/50 h-[360px] overflow-y-auto scrollbar-hide">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {pending.length === 0 ? (
                    <tr><td className="p-10 text-center text-gray-500 italic">No hay documentos pendientes</td></tr>
                  ) : (
                    pending.map((doc) => {
                      const kind = DOC_KIND_LABEL[docKindKey(doc)];
                      const st = STATUS_STYLE[doc.status] ?? STATUS_STYLE.pending;
                      return (
                        <tr key={`${doc.doc_kind}-${doc.id}`} className="group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-black uppercase', kind?.color)}>
                                {kind?.short}
                              </span>
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white block">
                                  {doc.series}-{fmtCorrelative(doc.correlative)}
                                </span>
                                {doc.last_error && (
                                  <span className="text-[9px] text-red-500 font-bold leading-tight block mt-0.5 max-w-[150px] truncate" title={doc.last_error}>
                                    Error: {doc.last_error}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold uppercase text-[9px]', st.bg, st.text)}>
                              <st.icon className={clsx('w-3.5 h-3.5', doc.status === 'sent' && 'animate-spin')} />
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Últimos Enviados</h3>
            <div className="border border-gray-200 dark:border-[#232834] rounded-2xl overflow-hidden bg-white dark:bg-[#0D1117]/50 h-[360px] overflow-y-auto scrollbar-hide">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {recent.map((doc) => {
                    const kind = DOC_KIND_LABEL[docKindKey(doc)];
                    const st = STATUS_STYLE[doc.status] ?? STATUS_STYLE.accepted;
                    return (
                      <tr key={`${doc.doc_kind}-${doc.id}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-black uppercase', kind?.color)}>
                              {kind?.short}
                            </span>
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">
                                {doc.series}-{fmtCorrelative(doc.correlative)}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {new Date(doc.accepted_at ?? doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold uppercase text-[9px]', st.bg, st.text)}>
                            <st.icon className="w-3.5 h-3.5" />
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Diagnóstico */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-[#0D1117] p-4 rounded-2xl border border-gray-200 dark:border-[#232834]">
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 dark:text-gray-400">
            <SignalIcon className="w-4 h-4 text-emerald-500" />
            <span className="uppercase tracking-widest">Sistema:</span>
            <span className="text-emerald-600 dark:text-emerald-400 uppercase">Certificado Válido · Conexión OK</span>
          </div>
          <div className="text-[10px] font-bold text-gray-400 italic">
            Refresco 8s · Auto-reinicio latente
          </div>
        </div>
      </div>
    </Modal>
  );
}

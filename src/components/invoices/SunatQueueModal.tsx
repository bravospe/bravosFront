'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Modal, Button, Badge } from '@/components/ui';
import { 
  ArrowPathIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationCircleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface PendingInvoice {
  id: string;
  series: string;
  number: string;
  correlative?: string | number;
  document_type: string;
  total: number;
  created_at: string;
  sunat_status: string;
}

interface SunatQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SunatQueueModal({ isOpen, onClose }: SunatQueueModalProps) {
  const [pending, setPending] = useState<PendingInvoice[]>([]);
  const [recent, setRecent] = useState<PendingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const currentCompany = useAuthStore(s => s.currentCompany);

  const fetchData = useCallback(async () => {
    if (!currentCompany?.id) return;
    try {
      const [resPending, resRecent] = await Promise.all([
        api.get(`/companies/${currentCompany.id}/invoices`, {
          params: { sunat_status: 'pending,sent', per_page: 50 }
        }),
        api.get(`/companies/${currentCompany.id}/invoices`, {
          params: { per_page: 10 } 
        })
      ]);
      
      setPending(resPending.data?.data || []);
      
      // Filter recent to only show those processed in this session or recently
      const processed = (resRecent.data?.data || []).filter((inv: any) => 
        ['accepted', 'rejected'].includes(inv.sunat_status)
      );
      setRecent(processed);
    } catch (error) {
      console.error('Error fetching SUNAT data', error);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
      const interval = setInterval(fetchData, 10000); // Faster refresh (10s) for real-time feel
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchData]);

  const handleSync = async () => {
    if (!currentCompany?.id) return;
    setIsSyncing(true);
    try {
      await api.post(`/companies/${currentCompany.id}/sunat/process-pending`);
      toast.success('Sincronización iniciada');
      // Immediate partial refresh
      setTimeout(fetchData, 2000);
      setTimeout(fetchData, 5000);
    } catch (error: any) {
      toast.error('Error al iniciar sincronización');
    } finally {
      setIsSyncing(false);
    }
  };

  const docTypeLabels: Record<string, string> = {
    '01': 'Factura',
    '03': 'Boleta',
    '07': 'N. Crédito',
    '08': 'N. Débito',
  };

  const statusStyles: Record<string, { bg: string, text: string, icon: any }> = {
    pending:  { bg: 'bg-yellow-100 dark:bg-yellow-500/20',  text: 'text-yellow-700 dark:text-yellow-400', icon: ClockIcon },
    sent:     { bg: 'bg-blue-100 dark:bg-blue-500/20',    text: 'text-blue-700 dark:text-blue-400', icon: ArrowPathIcon },
    accepted: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircleIcon },
    rejected: { bg: 'bg-red-100 dark:bg-red-500/20',         text: 'text-red-700 dark:text-red-400', icon: XCircleIcon },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conexión SUNAT - Monitor de Envío"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Control */}
        <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-[#0D1117] rounded-xl shadow-sm">
              <CloudArrowUpIcon className={clsx("w-6 h-6 text-emerald-600 dark:text-emerald-400", isSyncing && "animate-bounce")} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Sincronización en Tiempo Real</p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">Estado de la cola de envíos automáticos.</p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={handleSync} 
            loading={isSyncing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
          >
            <ArrowPathIcon className={clsx("w-4 h-4 mr-1.5", isSyncing && "animate-spin")} />
            Sincronizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: PENDING QUEUE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Cola de Pendientes</h3>
              <Badge variant="warning">{pending.length}</Badge>
            </div>
            <div className="border border-gray-200 dark:border-[#232834] rounded-2xl overflow-hidden bg-white dark:bg-[#0D1117]/50 max-h-[350px] overflow-y-auto scrollbar-hide">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-100 dark:divide-[#1E2230]">
                  {isLoading && pending.length === 0 ? (
                    <tr><td className="p-8 text-center text-gray-400 animate-pulse">Cargando...</td></tr>
                  ) : pending.length === 0 ? (
                    <tr><td className="p-12 text-center text-gray-500 italic">No hay documentos pendientes</td></tr>
                  ) : (
                    pending.map((inv) => (
                      <tr key={inv.id} className="group">
                        <td className="p-3">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {inv.series}-{String(inv.number || inv.correlative || '').padStart(8, '0')}
                          </p>
                          <p className="text-[10px] text-gray-400">{docTypeLabels[inv.document_type] || inv.document_type}</p>
                        </td>
                        <td className="p-3 text-right">
                          {inv.sunat_status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 uppercase text-[9px]">
                              <ArrowPathIcon className="w-3 h-3 animate-spin" /> ENVIANDO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 uppercase text-[9px]">
                              <ClockIcon className="w-3 h-3" /> ESPERA
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: RECENT ACTIVITY */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Actividad Reciente</h3>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="border border-gray-200 dark:border-[#232834] rounded-2xl overflow-hidden bg-white dark:bg-[#0D1117]/50 max-h-[350px] overflow-y-auto scrollbar-hide">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-100 dark:divide-[#1E2230]">
                  {recent.length === 0 ? (
                    <tr><td className="p-12 text-center text-gray-500 italic">Esperando actividad...</td></tr>
                  ) : (
                    recent.map((inv) => {
                      const style = statusStyles[inv.sunat_status] || statusStyles.pending;
                      const Icon = style.icon;
                      return (
                        <tr key={inv.id} className="bg-white/5">
                          <td className="p-3">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {inv.series}-{String(inv.number || inv.correlative || '').padStart(8, '0')}
                            </p>
                            <p className="text-[10px] text-gray-400">{new Date(inv.created_at).toLocaleTimeString()}</p>
                          </td>
                          <td className="p-3 text-right">
                            <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]", style.bg, style.text)}>
                              <Icon className="w-3 h-3" /> {inv.sunat_status === 'accepted' ? 'OK' : 'ERROR'}
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
        </div>

        {/* Footer Status */}
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#0D1117] p-3 rounded-xl border border-gray-200 dark:border-[#232834]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            SUNAT Gateway: Online
          </div>
          <div className="flex gap-4">
            <span>Sincronizando cada 60s</span>
            <span className="text-emerald-600 dark:text-emerald-400">Sesión Activa</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

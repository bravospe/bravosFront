'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminService } from '@/services/superAdminService';
import { ManualPayment } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon, 
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SuperAdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | undefined>('pending');
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, status],
    queryFn: () => superAdminService.payments.list({ page, status }),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => superAdminService.payments.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast.success('Pago aprobado correctamente');
      setSelectedPayment(null);
    },
    onError: () => toast.error('Error al aprobar el pago'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      superAdminService.payments.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast.success('Pago rechazado');
      setSelectedPayment(null);
      setRejectionReason('');
    },
    onError: () => toast.error('Error al rechazar el pago'),
  });

  const handleApprove = async (id: string) => {
    if (window.confirm('¿Estás seguro de aprobar este pago? La suscripción se activará inmediatamente.')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason) {
      toast.error('Debes proporcionar un motivo de rechazo');
      return;
    }
    rejectMutation.mutate({ id, reason: rejectionReason });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Pagos</h1>
          <p className="text-gray-500 dark:text-gray-400">Verifica y aprueba las membresías manuales.</p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={status || ''} 
            onChange={(e) => setStatus(e.target.value as any || undefined)}
            className="rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] text-sm focus:ring-emerald-500"
          >
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
            <option value="">Todos</option>
          </select>
        </div>
      </div>

      {/* Stats Summary - Placeholder for future implementation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pagos Pendientes</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">
             {status === 'pending' ? data?.meta.total : '...'}
          </p>
        </div>
        {/* ... more stats */}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4 font-semibold">Empresa / Plan</th>
                <th className="px-6 py-4 font-semibold">Monto</th>
                <th className="px-6 py-4 font-semibold">Referencia</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Cargando pagos...</td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No se encontraron pagos.</td>
                </tr>
              ) : data?.data.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">{payment.company.name}</span>
                      <span className="text-xs text-emerald-500 font-medium">{payment.plan.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {payment.transaction_reference}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedPayment(payment)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all text-xs font-bold"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Revisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden border border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalle del Pago</h2>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-white">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              {/* Proof Image */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Comprobante</p>
                <div className="aspect-[3/4] rounded-xl bg-gray-100 dark:bg-white/5 border border-dashed border-white/10 overflow-hidden flex items-center justify-center group relative">
                  {selectedPayment.proof_image_url ? (
                    <img 
                      src={selectedPayment.proof_image_url} 
                      alt="Comprobante de pago" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-500 italic">Sin imagen adjunta</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a href={selectedPayment.proof_image_url} target="_blank" rel="noreferrer" className="bg-white text-black px-4 py-2 rounded-full font-bold text-xs">Ver original</a>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Información de la Empresa</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">{selectedPayment.company.name}</p>
                  <p className="text-sm text-gray-500">RUC: {selectedPayment.company.ruc}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Plan Solicitado</p>
                  <p className="font-bold text-emerald-500">{selectedPayment.plan.name}</p>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">
                    Monto esperado: {selectedPayment.currency} {selectedPayment.plan.price_monthly}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Datos del Depósito</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Referencia:</span>
                      <span className="font-mono text-gray-900 dark:text-white">{selectedPayment.transaction_reference}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monto depositado:</span>
                      <span className="font-bold text-emerald-400">{selectedPayment.currency} {selectedPayment.amount}</span>
                    </div>
                  </div>
                </div>

                {selectedPayment.status === 'pending' && (
                  <div className="space-y-3 pt-4">
                    <div className="flex flex-col gap-2">
                       <p className="text-xs font-bold text-gray-500 uppercase">Motivo de rechazo (opcional)</p>
                       <textarea 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Escribe por qué se rechaza..."
                        className="w-full rounded-xl bg-white dark:bg-black border-gray-200 dark:border-white/10 text-sm p-3"
                       />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReject(selectedPayment.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 font-bold hover:text-white transition-all text-sm"
                      >
                        Rechazar
                      </button>
                      <button 
                        onClick={() => handleApprove(selectedPayment.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="flex-[2] px-4 py-3 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 font-bold transition-all text-sm shadow-lg shadow-emerald-500/20"
                      >
                        Aprobar y Activar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const labels = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}

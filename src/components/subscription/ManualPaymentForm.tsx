'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscriptionService';
import { Plan } from '@/types';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  ExclamationCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ManualPaymentFormProps {
  plan: Plan;
  amount: number;
  billingPeriod: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ManualPaymentForm = ({ plan, amount, billingPeriod, onSuccess, onCancel }: ManualPaymentFormProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => subscriptionService.submitManualPayment(formData),
    onSuccess: () => {
      toast.success('Pago enviado correctamente. Esperando aprobación.');
      queryClient.invalidateQueries({ queryKey: ['latest-payment'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al enviar el pago';
      toast.error(msg);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande (máximo 5MB)');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Debes subir el comprobante de pago');

    const formData = new FormData();
    formData.append('plan_id', plan.id);
    formData.append('proof_image', file);
    formData.append('transaction_reference', reference || '');
    formData.append('payment_date', paymentDate);
    formData.append('amount', amount.toString());
    formData.append('billing_period', billingPeriod);
    formData.append('currency', plan.currency || 'S/');

    mutation.mutate(formData);
  };

  return (
    <div className="bg-white dark:bg-[#111827] rounded-[24px] border border-gray-100 dark:border-white/5 p-6 shadow-xl max-w-lg mx-auto overflow-hidden relative">
      
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pagar Membresía</h3>
        <p className="text-sm text-gray-500">
          Plan <span className="text-emerald-500 font-bold">{plan.name}</span> — 
          Total: <span className="font-bold">{plan.currency} {amount}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* File Upload */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Comprobante de Pago</p>
          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CloudArrowUpIcon className="w-6 h-6 text-gray-400 group-hover:text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Subir Imagen</p>
                <p className="text-[10px] text-gray-500">JPG, PNG o PDF (Max. 5MB)</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,.pdf"
              />
            </div>
          ) : (
            <div className="relative aspect-video rounded-2xl border border-white/10 overflow-hidden group">
              <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button 
                  type="button"
                  onClick={() => {setFile(null); setPreview(null);}}
                  className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-all"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Referencia / Operación</label>
            <input 
              type="text" 
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: 123456"
              className="w-full rounded-xl bg-gray-50 dark:bg-black border-gray-100 dark:border-white/10 text-sm font-semibold focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fecha de Pago</label>
            <input 
              type="date" 
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-xl bg-gray-50 dark:bg-black border-gray-100 dark:border-white/10 text-sm font-semibold focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="flex gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <ExclamationCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed font-medium">
            Al enviar el pago, nuestro equipo revisará la transacción. Este proceso puede tardar hasta 24 horas. Recibirás una notificación al ser aprobado.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 font-bold transition-all text-sm"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="flex-[2] px-4 py-3 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 font-bold transition-all text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Pago'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

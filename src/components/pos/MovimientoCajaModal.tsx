'use client';

import { useState } from 'react';
import { XMarkIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/react/24/outline';
import { usePOSStore } from '@/stores/posStore';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultType?: 'income' | 'expense';
}

const MOTIVOS_INGRESO = ['Fondo de cambio', 'Préstamo', 'Vuelto de proveedor', 'Otro'];
const MOTIVOS_EGRESO = ['Pago a proveedor', 'Gastos operativos', 'Retiro de efectivo', 'Otro'];

export default function MovimientoCajaModal({ open, onClose, defaultType = 'income' }: Props) {
  const { registerMovement, fetchSessionSummary } = usePOSStore();

  const [tipo, setTipo] = useState<'income' | 'expense'>(defaultType);
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(false);

  const reset = () => {
    setMonto('');
    setDescripcion('');
    setTipo(defaultType);
  };

  const handleSubmit = async () => {
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (!descripcion.trim()) {
      toast.error('Ingresa una descripción');
      return;
    }
    setCargando(true);
    try {
      await registerMovement(tipo, montoNum, descripcion.trim());
      await fetchSessionSummary();
      toast.success(tipo === 'income' ? 'Ingreso registrado' : 'Egreso registrado');
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al registrar movimiento');
    } finally {
      setCargando(false);
    }
  };

  if (!open) return null;

  const motivos = tipo === 'income' ? MOTIVOS_INGRESO : MOTIVOS_EGRESO;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-[#1E2230]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1E2230]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Registrar Movimiento</h2>
          <button
            onClick={() => { reset(); onClose(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1E2230]"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTipo('income')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                tipo === 'income'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-gray-200 dark:border-[#1E2230] text-gray-500 hover:border-gray-300'
              }`}
            >
              <ArrowUpCircleIcon className="w-5 h-5" />
              Ingreso
            </button>
            <button
              onClick={() => setTipo('expense')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                tipo === 'expense'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : 'border-gray-200 dark:border-[#1E2230] text-gray-500 hover:border-gray-300'
              }`}
            >
              <ArrowDownCircleIcon className="w-5 h-5" />
              Egreso
            </button>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Monto (S/)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-2xl font-bold text-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Descripción con accesos rápidos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Descripción
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {motivos.map(m => (
                <button
                  key={m}
                  onClick={() => setDescripcion(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    descripcion === m
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-gray-200 dark:border-[#1E2230] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="O escribe una descripción..."
              maxLength={255}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#1E2230] flex gap-3">
          <button
            onClick={() => { reset(); onClose(); }}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2230] text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={cargando || !monto || !descripcion.trim()}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              tipo === 'income'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {cargando ? 'Registrando...' : tipo === 'income' ? '+ Registrar Ingreso' : '− Registrar Egreso'}
          </button>
        </div>
      </div>
    </div>
  );
}

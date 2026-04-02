'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, BuildingStorefrontIcon, BanknotesIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { usePOSStore } from '@/stores/posStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const DENOMINACIONES = [
  { valor: 200, tipo: 'billete' },
  { valor: 100, tipo: 'billete' },
  { valor: 50, tipo: 'billete' },
  { valor: 20, tipo: 'billete' },
  { valor: 10, tipo: 'billete' },
  { valor: 5, tipo: 'billete' },
  { valor: 2, tipo: 'moneda' },
  { valor: 1, tipo: 'moneda' },
  { valor: 0.5, tipo: 'moneda' },
];

interface Props {
  open: boolean;
  onClose?: () => void;
}

export default function AperturaCajaModal({ open, onClose }: Props) {
  const { cashRegisters, fetchCashRegisters, openSession, isSessionLoading } = usePOSStore();
  const currentUserId = useAuthStore(s => s.user?.id);

  const [paso, setPaso] = useState<1 | 2>(1);
  const [registroId, setRegistroId] = useState('');
  const [montoDirecto, setMontoDirecto] = useState('');
  const [usarDesglose, setUsarDesglose] = useState(false);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});

  useEffect(() => {
    if (open) {
      fetchCashRegisters();
      setPaso(1);
      setRegistroId('');
      setMontoDirecto('');
      setCantidades({});
      setUsarDesglose(false);
    }
  }, [open, fetchCashRegisters]);

  useEffect(() => {
    if (cashRegisters.length === 1) {
      setRegistroId(cashRegisters[0].id);
    }
  }, [cashRegisters]);

  const totalDesglose = DENOMINACIONES.reduce(
    (sum, d) => sum + (cantidades[d.valor] || 0) * d.valor,
    0
  );

  const montoFinal = usarDesglose ? totalDesglose : parseFloat(montoDirecto || '0');

  const handleSiguiente = () => {
    if (!registroId) {
      toast.error('Selecciona una caja');
      return;
    }
    setPaso(2);
  };

  const handleAbrir = async () => {
    if (montoFinal < 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    try {
      await openSession(registroId, montoFinal);
      toast.success('Caja abierta exitosamente');
      onClose?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Error al abrir caja');
    }
  };

  const setCantidad = (valor: number, cant: string) => {
    const n = parseInt(cant, 10);
    setCantidades(prev => ({ ...prev, [valor]: isNaN(n) || n < 0 ? 0 : n }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-[#1E2230]">
        {/* Header */}
        <div className="flex items-center justify-between py-2 px-4 border-b border-gray-100 dark:border-[#1E2230]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Apertura de Caja</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Paso {paso} de 2</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1E2230] transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-[#1E2230]">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: paso === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Body */}
        <div className="p-6">
          {paso === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecciona la caja
                </label>
                {cashRegisters.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <BuildingStorefrontIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No hay cajas configuradas.<br />Crea una en Configuración → Cajas.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {cashRegisters.filter(r => r.is_active).map(reg => {
                      const isOccupied = !!reg.active_session_id;
                      const isOccupiedByMe = reg.active_user_id === currentUserId;
                      const isDisabled = isOccupied && !isOccupiedByMe;
                      const occupantName = reg.active_user?.name;

                      return (
                        <button
                          key={reg.id}
                          onClick={() => !isDisabled && setRegistroId(reg.id)}
                          disabled={isDisabled}
                          className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all ${
                            isDisabled
                              ? 'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10 opacity-70 cursor-not-allowed'
                              : registroId === reg.id
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                : 'border-gray-200 dark:border-[#1E2230] hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isDisabled
                              ? 'border-red-300'
                              : registroId === reg.id ? 'border-emerald-500' : 'border-gray-300'
                          }`}>
                            {isDisabled ? (
                              <LockClosedIcon className="w-2.5 h-2.5 text-red-400" />
                            ) : registroId === reg.id ? (
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{reg.name}</p>
                              {isOccupied && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  isOccupiedByMe
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {isOccupiedByMe ? 'Tu sesión' : 'Ocupada'}
                                </span>
                              )}
                            </div>
                            {reg.code && <p className="text-xs text-gray-500">{reg.code}</p>}
                            {isDisabled && occupantName && (
                              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                                En uso por {occupantName}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1E2230] flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <BuildingStorefrontIcon className="w-4 h-4 flex-shrink-0" />
                <span>{cashRegisters.find(r => r.id === registroId)?.name}</span>
              </div>

              {/* Toggle desglose */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Desglose por denominaciones</span>
                <button
                  onClick={() => setUsarDesglose(!usarDesglose)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    usarDesglose ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    usarDesglose ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {usarDesglose ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-2 items-center text-xs text-gray-500 dark:text-gray-400 font-medium pb-1 border-b border-gray-100 dark:border-[#1E2230]">
                    <span>Denominación</span>
                    <span>Cantidad</span>
                    <span className="text-right">Subtotal</span>
                  </div>
                  {DENOMINACIONES.map(d => {
                    const cant = cantidades[d.valor] || 0;
                    const sub = cant * d.valor;
                    return (
                      <div key={d.valor} className="grid grid-cols-[auto_1fr_auto] gap-x-3 items-center">
                        <div className="flex items-center gap-1.5 w-24">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            d.tipo === 'billete'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            S/ {d.valor % 1 === 0 ? d.valor : d.valor.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={cant || ''}
                          placeholder="0"
                          onChange={e => setCantidad(d.valor, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-sm text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-right w-20 text-gray-700 dark:text-gray-300 font-medium">
                          {sub > 0 ? `S/ ${sub.toFixed(2)}` : '—'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-gray-100 dark:border-[#1E2230] flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total efectivo:</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      S/ {totalDesglose.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Monto inicial (S/)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoDirecto}
                    onChange={e => setMontoDirecto(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-2xl font-bold text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-1.5 text-xs text-gray-500 text-center">
                    Ingresa el efectivo que tienes en caja al inicio del turno
                  </p>
                </div>
              )}

              {montoFinal > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    Monto de apertura: <strong>S/ {montoFinal.toFixed(2)}</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#1E2230] flex gap-3">
          {paso === 2 && (
            <button
              onClick={() => setPaso(1)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2230] text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
            >
              ← Atrás
            </button>
          )}
          {paso === 1 ? (
            <button
              onClick={handleSiguiente}
              disabled={!registroId}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              Continuar →
            </button>
          ) : (
            <button
              onClick={handleAbrir}
              disabled={isSessionLoading || cashRegisters.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {isSessionLoading ? 'Abriendo...' : '🏦 Abrir Caja'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

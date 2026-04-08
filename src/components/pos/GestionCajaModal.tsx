'use client';

import { useState } from 'react';
import {
  XMarkIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon,
  LockClosedIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { usePOSStore } from '@/stores/posStore';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'menu' | 'close' | 'switch';

export default function GestionCajaModal({ open, onClose }: Props) {
  const {
    currentSession,
    registersStatus,
    closeSession,
    openSession,
    isSessionLoading,
  } = usePOSStore();

  const [mode, setMode] = useState<Mode>('menu');
  const [closingAmount, setClosingAmount] = useState('');
  const [openingAmount, setOpeningAmount] = useState('');
  const [selectedRegisterId, setSelectedRegisterId] = useState('');

  if (!open) return null;

  const availableRegisters = registersStatus.filter(
    r => r.is_active && r.status === 'available'
  );

  const handleClose = () => {
    setMode('menu');
    setClosingAmount('');
    setOpeningAmount('');
    setSelectedRegisterId('');
    onClose();
  };

  const handleCerrar = async () => {
    try {
      await closeSession(parseFloat(closingAmount || '0'));
      toast.success('Caja cerrada correctamente');
      handleClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al cerrar caja');
    }
  };

  const handleCambiar = async () => {
    if (!selectedRegisterId) {
      toast.error('Selecciona una caja');
      return;
    }
    try {
      await closeSession(parseFloat(closingAmount || '0'));
      await openSession(selectedRegisterId, parseFloat(openingAmount || '0'));
      toast.success('Caja cambiada correctamente');
      handleClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al cambiar de caja');
    }
  };

  const registerName = currentSession?.cash_register?.name || 'Caja';
  const openedAt = currentSession?.opened_at
    ? new Date(currentSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-[#1E2230]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#1E2230]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <BuildingStorefrontIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {mode === 'menu' ? 'Gestión de Caja' : mode === 'close' ? 'Cerrar Caja' : 'Cambiar de Caja'}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{registerName}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1E2230] transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">

          {/* ── MENU ── */}
          {mode === 'menu' && (
            <div className="space-y-3">
              {/* Info sesión actual */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1E2230] text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{registerName}</p>
                  <p className="text-xs text-gray-400">Abierta desde {openedAt}</p>
                </div>
              </div>

              {/* Cerrar Caja */}
              <button
                onClick={() => setMode('close')}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <LockClosedIcon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Cerrar Caja</p>
                  <p className="text-xs text-red-500/80 dark:text-red-500/60">Finalizar turno en {registerName}</p>
                </div>
              </button>

              {/* Cambiar Caja */}
              <button
                onClick={() => setMode('switch')}
                disabled={availableRegisters.length === 0}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <ArrowsRightLeftIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Cambiar de Caja</p>
                  <p className="text-xs text-blue-500/80 dark:text-blue-500/60">
                    {availableRegisters.length === 0
                      ? 'No hay cajas disponibles'
                      : `${availableRegisters.length} caja${availableRegisters.length > 1 ? 's' : ''} disponible${availableRegisters.length > 1 ? 's' : ''}`}
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* ── CERRAR ── */}
          {mode === 'close' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ingresa el efectivo actual en caja para registrar el cierre.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  Monto de cierre (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={closingAmount}
                  onChange={e => setClosingAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-2xl font-bold text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          {/* ── CAMBIAR ── */}
          {mode === 'switch' && (
            <div className="space-y-4">
              {/* Closing amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  Cierre de {registerName} (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={closingAmount}
                  onChange={e => setClosingAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-xl font-bold text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Select register */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  Nueva caja
                </label>
                <div className="space-y-2">
                  {availableRegisters.map(reg => (
                    <button
                      key={reg.id}
                      onClick={() => setSelectedRegisterId(reg.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        selectedRegisterId === reg.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-[#1E2230] hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        selectedRegisterId === reg.id ? 'border-emerald-500' : 'border-gray-300'
                      }`}>
                        {selectedRegisterId === reg.id && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{reg.name}</p>
                        {reg.code && <p className="text-xs text-gray-400">{reg.code}</p>}
                      </div>
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
                        Disponible
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opening amount for new register */}
              {selectedRegisterId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                    Apertura nueva caja (S/)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingAmount}
                    onChange={e => setOpeningAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-xl font-bold text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#1E2230] flex gap-3">
          {mode !== 'menu' && (
            <button
              onClick={() => setMode('menu')}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2230] text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
            >
              ← Atrás
            </button>
          )}

          {mode === 'menu' && (
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2230] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
            >
              Cancelar
            </button>
          )}

          {mode === 'close' && (
            <button
              onClick={handleCerrar}
              disabled={isSessionLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {isSessionLoading ? 'Cerrando...' : 'Cerrar Turno'}
            </button>
          )}

          {mode === 'switch' && (
            <button
              onClick={handleCambiar}
              disabled={isSessionLoading || !selectedRegisterId}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {isSessionLoading ? 'Cambiando...' : 'Cambiar Caja'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

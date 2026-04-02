'use client';

import { useEffect, useState } from 'react';
import {
  BanknotesIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ClockIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { usePOSStore } from '@/stores/posStore';
import AperturaCajaModal from '@/components/pos/AperturaCajaModal';
import CierreCajaModal from '@/components/pos/CierreCajaModal';
import MovimientoCajaModal from '@/components/pos/MovimientoCajaModal';
import Link from 'next/link';

const fmt = (n: number) =>
  `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function duracion(desde: string) {
  const diff = Math.floor((Date.now() - new Date(desde).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function CajaWidget() {
  const {
    currentSession,
    sessionSummary,
    isSessionLoading,
    fetchCurrentSession,
    fetchSessionSummary,
  } = usePOSStore();

  const [showApertura, setShowApertura] = useState(false);
  const [showCierre, setShowCierre] = useState(false);
  const [showMovimiento, setShowMovimiento] = useState(false);
  const [movTipo, setMovTipo] = useState<'income' | 'expense'>('income');

  useEffect(() => {
    fetchCurrentSession().then(() => {
      if (currentSession) fetchSessionSummary();
    });
  }, []);

  useEffect(() => {
    if (currentSession) fetchSessionSummary();
  }, [currentSession]);

  const openMovimiento = (tipo: 'income' | 'expense') => {
    setMovTipo(tipo);
    setShowMovimiento(true);
  };

  if (isSessionLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13161d] p-5 h-full animate-pulse">
        <div className="h-12 w-12 bg-gray-100 dark:bg-[#1E2230] rounded-2xl mb-4" />
        <div className="h-4 w-24 bg-gray-100 dark:bg-[#1E2230] rounded mb-2" />
        <div className="h-3 w-32 bg-gray-100 dark:bg-[#1E2230] rounded" />
      </div>
    );
  }

  /* ── Sin sesión abierta ── */
  if (!currentSession) {
    return (
      <>
        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13161d] p-5 h-full flex flex-col justify-center items-center text-center">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '20px 20px' }} />

          {/* Pulsing ring */}
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1E2230] dark:to-[#262b3a] flex items-center justify-center shadow-inner">
              <BanknotesIcon className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          <p className="text-sm font-bold text-gray-900 dark:text-white">Caja cerrada</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-relaxed max-w-[160px]">
            Abre una sesión para empezar a vender
          </p>

          <div className="flex flex-col gap-2 w-full mt-5">
            <button
              onClick={() => setShowApertura(true)}
              className="relative w-full overflow-hidden px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="relative z-10">Abrir Caja</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-400 opacity-0 hover:opacity-100 transition-opacity" />
            </button>
            <Link
              href="/pos/historial"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.06] text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-700 dark:hover:text-gray-300 transition-all text-center"
            >
              Ver historial
            </Link>
          </div>
        </div>

        <AperturaCajaModal open={showApertura} onClose={() => setShowApertura(false)} />
      </>
    );
  }

  /* ── Con sesión abierta ── */
  const totalSales = sessionSummary?.total_sales ?? 0;
  const expectedCash = sessionSummary?.expected_cash ?? 0;
  const transactions = sessionSummary?.total_transactions ?? 0;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#13161d] p-5 h-full flex flex-col">
        {/* Live gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 caja-gradient-bar" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
              <BanknotesIcon className="w-5 h-5 text-white" />
            </div>
            {/* Live dot */}
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-[#13161d] animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {currentSession.cash_register?.name ?? 'Caja'}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
              <ClockIcon className="w-3 h-3 flex-shrink-0" />
              {duracion(currentSession.opened_at)} activa
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-[#1a1e2a] dark:to-[#13161d] border border-gray-100/50 dark:border-white/[0.04]">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Apertura</p>
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              {fmt(currentSession.opening_amount)}
            </p>
          </div>
          <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#13161d] border border-emerald-100/50 dark:border-emerald-500/[0.08]">
            <p className="text-[10px] font-medium text-emerald-500/70 uppercase tracking-wider mb-1">Ventas</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {fmt(totalSales)}
            </p>
          </div>
          <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-[#1a1e2a] dark:to-[#13161d] border border-gray-100/50 dark:border-white/[0.04]">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Efectivo</p>
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              {fmt(expectedCash)}
            </p>
          </div>
          <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-[#1a1e2a] dark:to-[#13161d] border border-gray-100/50 dark:border-white/[0.04]">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Ops.</p>
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              {transactions}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 mt-4">
          <button
            onClick={() => openMovimiento('income')}
            title="Registrar ingreso"
            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/15 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all duration-200 hover:-translate-y-0.5"
          >
            <ArrowUpCircleIcon className="w-3.5 h-3.5" />
            Ingreso
          </button>
          <button
            onClick={() => openMovimiento('expense')}
            title="Registrar egreso"
            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl border border-red-200 dark:border-red-500/15 text-[11px] font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 hover:-translate-y-0.5"
          >
            <ArrowDownCircleIcon className="w-3.5 h-3.5" />
            Egreso
          </button>
          <button
            onClick={() => setShowCierre(true)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-[11px] font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5"
          >
            <LockClosedIcon className="w-3.5 h-3.5" />
            Cerrar
          </button>
        </div>
      </div>

      <AperturaCajaModal open={showApertura} onClose={() => setShowApertura(false)} />
      <CierreCajaModal open={showCierre} onClose={() => setShowCierre(false)} />
      <MovimientoCajaModal
        open={showMovimiento}
        onClose={() => setShowMovimiento(false)}
        defaultType={movTipo}
      />

      <style>{`
        .caja-gradient-bar {
          background-size: 200% 100%;
          animation: caja-shimmer 3s ease-in-out infinite;
        }
        @keyframes caja-shimmer {
          0%, 100% { background-position: 0% 0; }
          50% { background-position: 100% 0; }
        }
      `}</style>
    </>
  );
}

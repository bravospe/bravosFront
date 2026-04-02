'use client';

import { useEffect, useState } from 'react';
import {
  ClockIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BanknotesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { usePOSStore, type POSSession } from '@/stores/posStore';
import Link from 'next/link';

const fmt = (n: number | undefined | null) =>
  `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function duracion(desde: string, hasta: string | null) {
  const end = hasta ? new Date(hasta).getTime() : Date.now();
  const diff = Math.floor((end - new Date(desde).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function SessionRow({ session }: { session: POSSession }) {
  const [expanded, setExpanded] = useState(false);
  const diferencia = (session.difference ?? 0);

  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-[#1E2230] cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {new Date(session.opened_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </td>
        <td className="px-4 py-3">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {session.cash_register?.name ?? '—'}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          {session.user?.name ?? '—'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
          {fmt(session.opening_amount)}
        </td>
        <td className="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
          {fmt(session.total_sales)}
        </td>
        <td className="px-4 py-3">
          {session.status === 'open' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Abierta
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              diferencia === 0
                ? 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
                : diferencia > 0
                ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
            }`}>
              {diferencia === 0
                ? <CheckCircleIcon className="w-3 h-3" />
                : <ExclamationCircleIcon className="w-3 h-3" />
              }
              {diferencia === 0 ? 'Cuadrado' : diferencia > 0 ? `+${fmt(diferencia)}` : fmt(diferencia)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {duracion(session.opened_at, session.closed_at)}
        </td>
        <td className="px-4 py-3 text-right">
          {expanded
            ? <ChevronUpIcon className="w-4 h-4 text-gray-400 ml-auto" />
            : <ChevronDownIcon className="w-4 h-4 text-gray-400 ml-auto" />
          }
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50/70 dark:bg-[#0D1117]">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Apertura</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(session.opened_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {session.closed_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cierre</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(session.closed_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Efectivo esperado</p>
                <p className="font-medium text-gray-900 dark:text-white">{fmt(session.expected_amount)}</p>
              </div>
              {session.closing_amount != null && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Efectivo contado</p>
                  <p className="font-medium text-gray-900 dark:text-white">{fmt(session.closing_amount)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Efectivo ventas</p>
                <p className="font-medium text-gray-900 dark:text-white">{fmt(session.total_cash)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tarjeta</p>
                <p className="font-medium text-gray-900 dark:text-white">{fmt(session.total_card)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Yape / Plin</p>
                <p className="font-medium text-gray-900 dark:text-white">{fmt(session.total_yape_plin)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transferencia</p>
                <p className="font-medium text-gray-900 dark:text-white">{fmt(session.total_transfer)}</p>
              </div>
              {session.notes && (
                <div className="col-span-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notas</p>
                  <p className="text-gray-700 dark:text-gray-300 italic">{session.notes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function HistorialCajaPage() {
  const { sessionHistory, cashRegisters, fetchSessionHistory, fetchCashRegisters } = usePOSStore();

  const [filtros, setFiltros] = useState({
    date_from: '',
    date_to: '',
    cash_register_id: '',
    status: '',
  });
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    fetchCashRegisters();
    fetchSessionHistory({ page: 1 });
  }, []);

  const handleBuscar = () => {
    setPagina(1);
    fetchSessionHistory({ ...filtros, page: 1 });
  };

  const handlePagina = (p: number) => {
    setPagina(p);
    fetchSessionHistory({ ...filtros, page: p });
  };

  const sessions = sessionHistory?.data ?? [];
  const total = sessionHistory?.total ?? 0;
  const lastPage = sessionHistory?.last_page ?? 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BanknotesIcon className="w-6 h-6 text-emerald-500" />
            Historial de Caja
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total} {total === 1 ? 'sesión' : 'sesiones'} registradas
          </p>
        </div>
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
        >
          Ir al POS
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-[#1E2230] p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          <FunnelIcon className="w-4 h-4" />
          Filtros
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.date_from}
              onChange={e => setFiltros(f => ({ ...f, date_from: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.date_to}
              onChange={e => setFiltros(f => ({ ...f, date_to: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Caja</label>
            <select
              value={filtros.cash_register_id}
              onChange={e => setFiltros(f => ({ ...f, cash_register_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todas</option>
              {cashRegisters.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Estado</label>
            <select
              value={filtros.status}
              onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos</option>
              <option value="open">Abierta</option>
              <option value="closed">Cerrada</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => {
              setFiltros({ date_from: '', date_to: '', cash_register_id: '', status: '' });
              fetchSessionHistory({ page: 1 });
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1E2230] text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E2230] flex items-center gap-1.5 transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Limpiar
          </button>
          <button
            onClick={handleBuscar}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-[#1E2230] overflow-hidden">
        {sessions.length === 0 ? (
          <div className="py-16 text-center">
            <ClockIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay sesiones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1E2230]">
                  {['Fecha', 'Caja', 'Cajero', 'Apertura', 'Ventas', 'Estado', 'Duración', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#1E2230]">
                {sessions.map(s => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {lastPage > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-[#1E2230] flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Página {pagina} de {lastPage}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handlePagina(pagina - 1)}
                disabled={pagina === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#1E2230] text-xs font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => handlePagina(pagina + 1)}
                disabled={pagina === lastPage}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#1E2230] text-xs font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

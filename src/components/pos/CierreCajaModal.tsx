'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { usePOSStore, type SessionSummary } from '@/stores/posStore';
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

const fmt = (n: number) => `S/ ${Number(n || 0).toFixed(2)}`;

const DOC_LABELS: Record<string, string> = {
  '00': 'Nota de Venta',
  '03': 'Boleta',
  '01': 'Factura',
};

const PAY_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape_plin: 'Yape / Plin',
  credit: 'Crédito',
};

const PAY_COLORS: Record<string, string> = {
  cash: 'bg-emerald-500',
  card: 'bg-blue-500',
  transfer: 'bg-purple-500',
  yape_plin: 'bg-pink-500',
  credit: 'bg-orange-500',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CierreCajaModal({ open, onClose }: Props) {
  const {
    currentSession,
    sessionSummary,
    fetchSessionSummary,
    closeSession,
    isSessionLoading,
  } = usePOSStore();

  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [montoDirecto, setMontoDirecto] = useState('');
  const [usarDesglose, setUsarDesglose] = useState(false);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [notas, setNotas] = useState('');
  const [closedSession, setClosedSession] = useState<any>(null);

  useEffect(() => {
    if (open) {
      setPaso(1);
      setMontoDirecto('');
      setCantidades({});
      setNotas('');
      setClosedSession(null);
      fetchSessionSummary();
    }
  }, [open, fetchSessionSummary]);

  const totalDesglose = DENOMINACIONES.reduce(
    (sum, d) => sum + (cantidades[d.valor] || 0) * d.valor,
    0
  );

  const montoCierre = usarDesglose ? totalDesglose : parseFloat(montoDirecto || '0');
  const esperado = sessionSummary?.expected_cash ?? 0;
  const diferencia = montoCierre - esperado;

  const setCantidad = (valor: number, cant: string) => {
    const n = parseInt(cant, 10);
    setCantidades(prev => ({ ...prev, [valor]: isNaN(n) || n < 0 ? 0 : n }));
  };

  const handleCerrar = async () => {
    if (!montoCierre && montoCierre !== 0) {
      toast.error('Ingresa el monto contado');
      return;
    }
    try {
      const session = await closeSession(montoCierre, notas || undefined);
      setClosedSession(session);
      setPaso(3);
      toast.success('Caja cerrada exitosamente');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Error al cerrar caja');
    }
  };

  const handleImprimir = () => {
    const summary = sessionSummary;
    const session = currentSession;
    if (!session) return;

    const openedAt = new Date(session.opened_at).toLocaleString('es-PE');
    const closedAt = new Date().toLocaleString('es-PE');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:300px;margin:0 auto;font-size:12px;">
        <div style="text-align:center;margin-bottom:12px;">
          <div style="font-size:16px;font-weight:bold;">CIERRE DE CAJA</div>
          <div style="color:#666;">${session.cash_register?.name || 'Caja'}</div>
        </div>
        <div style="border-top:1px dashed #ccc;border-bottom:1px dashed #ccc;padding:8px 0;margin:8px 0;">
          <div>Apertura: ${openedAt}</div>
          <div>Cierre: ${closedAt}</div>
        </div>
        <div style="margin:8px 0;">
          <div style="font-weight:bold;margin-bottom:4px;">VENTAS POR MÉTODO DE PAGO</div>
          ${Object.entries(summary?.by_payment_method ?? {}).map(([k, v]) =>
            `<div style="display:flex;justify-content:space-between;"><span>${PAY_LABELS[k] || k}</span><span>${fmt(v as number)}</span></div>`
          ).join('')}
          <div style="display:flex;justify-content:space-between;font-weight:bold;border-top:1px solid #eee;padding-top:4px;margin-top:4px;">
            <span>TOTAL VENTAS</span><span>${fmt(summary?.total_sales ?? 0)}</span>
          </div>
        </div>
        <div style="margin:8px 0;">
          <div style="font-weight:bold;margin-bottom:4px;">MOVIMIENTOS</div>
          <div style="display:flex;justify-content:space-between;"><span>Ingresos</span><span>+ ${fmt(summary?.cash_movements.incomes ?? 0)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Egresos</span><span>- ${fmt(summary?.cash_movements.expenses ?? 0)}</span></div>
        </div>
        <div style="border-top:1px dashed #ccc;border-bottom:1px dashed #ccc;padding:8px 0;margin:8px 0;">
          <div style="display:flex;justify-content:space-between;"><span>Apertura</span><span>${fmt(session.opening_amount)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Esperado</span><span>${fmt(esperado)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Contado</span><span>${fmt(montoCierre)}</span></div>
          <div style="display:flex;justify-content:space-between;font-weight:bold;color:${diferencia < 0 ? 'red' : diferencia > 0 ? 'orange' : 'green'};">
            <span>Diferencia</span><span>${diferencia > 0 ? '+' : ''}${fmt(diferencia)}</span>
          </div>
        </div>
        ${notas ? `<div style="margin-top:8px;"><strong>Notas:</strong> ${notas}</div>` : ''}
        <div style="text-align:center;margin-top:16px;color:#999;font-size:10px;">
          Bravos • ${new Date().toLocaleDateString('es-PE')}
        </div>
      </div>
    `;

    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(`<html><head><title>Cierre de Caja</title>
      <style>@media print { body { margin: 0; } }</style>
      </head><body>${html}</body></html>`);
    win.document.close();
    win.print();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-[#1E2230] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#1E2230] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {paso === 3 ? '✅ Caja Cerrada' : 'Cierre de Caja'}
              </h2>
              {paso < 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Paso {paso} de 2</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1E2230] transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {paso < 3 && (
          <div className="h-1 bg-gray-100 dark:bg-[#1E2230] flex-shrink-0">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: paso === 1 ? '50%' : '100%' }}
            />
          </div>
        )}

        {/* Body scrollable */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* PASO 1 — Resumen de turno */}
          {paso === 1 && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#1E2230] space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resumen de Ventas
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Transacciones</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {sessionSummary?.total_transactions ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total vendido</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                    {fmt(sessionSummary?.total_sales ?? 0)}
                  </span>
                </div>
              </div>

              {/* Por método de pago */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Por Método de Pago
                </p>
                {Object.entries(sessionSummary?.by_payment_method ?? {}).map(([k, v]) => {
                  const val = v as number;
                  const total = sessionSummary?.total_sales || 1;
                  const pct = Math.round((val / total) * 100);
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{PAY_LABELS[k] || k}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{fmt(val)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${PAY_COLORS[k] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Movimientos */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#1E2230] space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Movimientos de Caja
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">+ Ingresos</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {fmt(sessionSummary?.cash_movements.incomes ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-500 dark:text-red-400">− Egresos</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {fmt(sessionSummary?.cash_movements.expenses ?? 0)}
                  </span>
                </div>
              </div>

              {/* Apertura */}
              <div className="flex justify-between text-sm p-3 rounded-xl border border-gray-100 dark:border-[#1E2230]">
                <span className="text-gray-600 dark:text-gray-400">Monto de apertura</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {fmt(currentSession?.opening_amount ?? 0)}
                </span>
              </div>

              <div className="flex justify-between text-sm p-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">Efectivo esperado en caja</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {fmt(sessionSummary?.expected_cash ?? 0)}
                </span>
              </div>
            </div>
          )}

          {/* PASO 2 — Arqueo final */}
          {paso === 2 && (
            <div className="space-y-5">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm flex justify-between">
                <span className="text-emerald-700 dark:text-emerald-300">Efectivo esperado</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">{fmt(esperado)}</span>
              </div>

              {/* Toggle desglose */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Desglose por denominaciones</span>
                <button
                  onClick={() => setUsarDesglose(!usarDesglose)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    usarDesglose ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
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
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium w-16 text-center ${
                          d.tipo === 'billete'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          S/ {d.valor % 1 === 0 ? d.valor : d.valor.toFixed(2)}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={cant || ''}
                          placeholder="0"
                          onChange={e => setCantidad(d.valor, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <span className="text-sm text-right w-20 font-medium text-gray-700 dark:text-gray-300">
                          {sub > 0 ? `S/ ${sub.toFixed(2)}` : '—'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-gray-100 dark:border-[#1E2230] flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total contado:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      S/ {totalDesglose.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Efectivo contado (S/)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoDirecto}
                    onChange={e => setMontoDirecto(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {/* Diferencia */}
              {(montoDirecto || totalDesglose > 0) && (
                <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                  diferencia === 0
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                    : diferencia > 0
                    ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
                    : 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {diferencia === 0
                      ? <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                      : <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                    }
                    <span className={`text-sm font-medium ${
                      diferencia === 0 ? 'text-emerald-700 dark:text-emerald-300'
                      : diferencia > 0 ? 'text-yellow-700 dark:text-yellow-300'
                      : 'text-red-700 dark:text-red-300'
                    }`}>
                      {diferencia === 0 ? 'Cuadre perfecto' : diferencia > 0 ? 'Sobrante' : 'Faltante'}
                    </span>
                  </div>
                  <span className={`font-bold text-base ${
                    diferencia === 0 ? 'text-emerald-700 dark:text-emerald-300'
                    : diferencia > 0 ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-red-700 dark:text-red-300'
                  }`}>
                    {diferencia > 0 ? '+' : ''}{fmt(diferencia)}
                  </span>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Notas (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Observaciones del cierre..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          {/* PASO 3 — Confirmación */}
          {paso === 3 && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircleIcon className="w-9 h-9 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">Caja cerrada exitosamente</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {currentSession?.cash_register?.name || 'Caja'}
                </p>
              </div>

              <div className="text-left space-y-2 p-4 rounded-xl bg-gray-50 dark:bg-[#1E2230]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total ventas</span>
                  <span className="font-semibold">{fmt(sessionSummary?.total_sales ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Efectivo esperado</span>
                  <span className="font-semibold">{fmt(esperado)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Efectivo contado</span>
                  <span className="font-semibold">{fmt(montoCierre)}</span>
                </div>
                <div className={`flex justify-between text-sm font-bold pt-2 border-t border-gray-200 dark:border-gray-700 ${
                  diferencia < 0 ? 'text-red-600' : diferencia > 0 ? 'text-yellow-600' : 'text-emerald-600'
                }`}>
                  <span>Diferencia</span>
                  <span>{diferencia > 0 ? '+' : ''}{fmt(diferencia)}</span>
                </div>
              </div>

              <button
                onClick={handleImprimir}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2230] text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
              >
                <PrinterIcon className="w-4 h-4" />
                Imprimir reporte de cierre
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#1E2230] flex gap-3 flex-shrink-0">
          {paso === 3 ? (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              Cerrar
            </button>
          ) : (
            <>
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
                  onClick={() => setPaso(2)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                  Continuar → Arqueo
                </button>
              ) : (
                <button
                  onClick={handleCerrar}
                  disabled={isSessionLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                >
                  {isSessionLoading ? 'Cerrando...' : '🔒 Cerrar Caja'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

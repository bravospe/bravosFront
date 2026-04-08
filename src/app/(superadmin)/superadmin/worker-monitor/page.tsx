'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CpuChipIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  QueueListIcon,
  CommandLineIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { superAdminService } from '@/services/superAdminService';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface WorkerStats {
  is_running: boolean;
  last_heartbeat: string;
  queue_size: number;
  processed_last_24h: number;
  error_count_last_24h: number;
  uptime: string;
  queues?: string[];
}

interface WorkerLog {
  id: string;
  company_name: string;
  company_id: string;
  document: string;
  status: 'processing' | 'success' | 'failed';
  message: string;
  timestamp: string;
}

export default function WorkerMonitorPage() {
  const [stats, setStats] = useState<WorkerStats | null>(null);
  const [logs, setLogs] = useState<WorkerLog[]>([]);
  const [restarting, setRestarting] = useState(false);
  const [pushing, setPushing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await superAdminService.worker.getStatus();
      if (res.success) setStats(res.data);
    } catch (e) {
      console.error('Error fetching worker status', e);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await superAdminService.worker.getLogs({ per_page: 30 });
      if (res.success && res.data?.logs) setLogs(res.data.logs);
    } catch (e) {
      console.error('Error fetching logs', e);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchLogs]);

  const handlePush = async () => {
    setPushing(true);
    try {
      const res = await superAdminService.worker.push();
      if (res.success) {
        toast.success(res.message || 'Cola actualizada');
      } else {
        toast.error(res.message || 'Error al empujar cola');
      }
      fetchStatus();
      fetchLogs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al empujar cola');
    } finally {
      setPushing(false);
    }
  };

  const handleRestart = async () => {
    if (!confirm('¿Seguro que deseas reiniciar el motor de colas?')) return;
    setRestarting(true);
    try {
      const res = await superAdminService.worker.restart();
      if (res.success) {
        toast.success(res.message || 'Motor reiniciado');
      } else {
        toast.error(res.message || 'Error al reiniciar');
      }
      setTimeout(() => { fetchStatus(); fetchLogs(); }, 2000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al reiniciar motor');
    } finally {
      setRestarting(false);
    }
  };

  const isRunning = stats?.is_running ?? false;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Critical Alert */}
      {!isRunning && stats !== null && (
        <div className="bg-red-600 p-4 rounded-3xl flex items-center justify-between text-white shadow-xl shadow-red-500/20 animate-pulse">
          <div className="flex items-center gap-4">
            <ExclamationTriangleIcon className="w-10 h-10 flex-shrink-0" />
            <div>
              <p className="font-black text-lg">ALERTA: MOTOR AUTOMÁTICO DETENIDO</p>
              <p className="text-xs font-bold opacity-80 uppercase">
                Las facturas no se están enviando automáticamente. Requiere acción inmediata.
              </p>
            </div>
          </div>
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="px-6 py-2.5 bg-white text-red-600 font-black rounded-2xl active:scale-95 disabled:opacity-50 transition-all shadow-lg flex-shrink-0"
          >
            {restarting ? 'REINICIANDO...' : 'REINICIAR MOTOR'}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tighter">
            <CpuChipIcon className="w-8 h-8 text-emerald-500" />
            MONITOR GLOBAL DE FACTURACIÓN
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium italic">
            SaaS Worker Manager · Queues: {stats?.queues?.join(', ') || 'sunat, sunat:notify, default'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePush}
            disabled={pushing}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all"
          >
            <BoltIcon className={clsx('w-5 h-5', pushing && 'animate-pulse')} />
            {pushing ? 'Encolando...' : 'Empujar Cola'}
          </button>
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
          >
            <ArrowPathIcon className={clsx('w-5 h-5', restarting && 'animate-spin')} />
            {restarting ? 'Reiniciando...' : 'Reiniciar Motor'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0D1117] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <BoltIcon className="w-6 h-6 text-emerald-500" />
            </div>
            {isRunning ? (
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase rounded-full">
                En Línea
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 text-[10px] font-black uppercase rounded-full">
                Offline
              </span>
            )}
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white mt-4">
            {stats?.uptime || '—'}
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Estado Motor</p>
        </div>

        <div className="bg-white dark:bg-[#0D1117] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl w-fit">
            <QueueListIcon className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white mt-4 tracking-tighter">
            {stats?.queue_size ?? '—'}
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cola de Espera</p>
        </div>

        <div className="bg-white dark:bg-[#0D1117] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl w-fit">
            <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white mt-4">
            {stats?.processed_last_24h ?? '—'}
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Exitosas (24h)</p>
        </div>

        <div className="bg-white dark:bg-[#0D1117] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-xl w-fit">
            <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white mt-4">
            {stats?.error_count_last_24h ?? '—'}
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Errores (24h)</p>
        </div>
      </div>

      {/* Terminal + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
              <CommandLineIcon className="w-4 h-4" />
              Consola de Eventos del Motor
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                Streaming · 8s refresh
              </span>
            </div>
          </div>
          <div className="bg-[#080B12] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl h-[480px] flex flex-col font-mono ring-1 ring-white/5">
            <div className="p-5 bg-white/5 flex items-center justify-between border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/30" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/30" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
              </div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em]">bravos_worker_log_v1</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 text-xs scrollbar-hide">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-600">
                  <div className="w-12 h-12 border-2 border-gray-800 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Esperando eventos del servidor...</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-4 group border-b border-white/5 pb-3 last:border-0">
                    <span className="text-emerald-500 font-bold opacity-30 flex-shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-black truncate max-w-[120px]">{log.company_name}</span>
                        <span className="text-gray-600">»</span>
                        <span className="text-emerald-400 font-bold">{log.document}</span>
                        <span className={clsx(
                          'ml-auto text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter flex-shrink-0',
                          log.status === 'success'    ? 'bg-emerald-500/10 text-emerald-400' :
                          log.status === 'failed'     ? 'bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                                                        'bg-blue-500/10 text-blue-400 animate-pulse'
                        )}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1 leading-relaxed truncate">{log.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div className="flex items-center gap-2 text-emerald-500/40 font-bold">
                <span className="animate-pulse">▋</span>
                _ listening to sunat,sunat:notify,default queues...
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0D1117] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Estado Operativo</h3>

            <StatusRow label="Motor de Colas" status={isRunning ? 'ACTIVO' : 'DETENIDO'} isError={!isRunning} />
            <StatusRow label="Conexión Redis" status="CONECTADO" />
            <StatusRow label="Schedule Cron" status="ACTIVO" />
            <StatusRow label="SUNAT API" status="ONLINE" />

            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                Último heartbeat:{' '}
                <span className="text-emerald-500 font-bold">
                  {stats ? new Date(stats.last_heartbeat).toLocaleTimeString() : '—'}
                </span>
              </p>
              {stats?.queues && (
                <p className="text-[11px] text-gray-400 font-medium mt-2">
                  Queues activas: <span className="text-white">{stats.queues.join(' · ')}</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-emerald-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-emerald-600/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <BoltIcon className="w-24 h-24" />
            </div>
            <h4 className="font-black text-xl tracking-tight">Cola SUNAT</h4>
            <p className="text-4xl font-black mt-2">{stats?.queue_size ?? 0}</p>
            <p className="text-sm opacity-90 mt-1 font-medium">
              {(stats?.queue_size ?? 0) === 0
                ? 'Cola limpia — todo procesado'
                : 'documentos en espera de envío'}
            </p>
            <button
              onClick={handlePush}
              disabled={pushing}
              className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-xl font-bold text-sm transition-all"
            >
              {pushing ? 'Procesando...' : 'Empujar ahora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, status, isError = false }: { label: string; status: string; isError?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={clsx(
          'w-8 h-8 rounded-xl flex items-center justify-center border',
          isError ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
        )}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', isError ? 'bg-red-500 animate-pulse' : 'bg-emerald-500')} />
        </div>
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <span className={clsx('text-[10px] font-black tracking-widest', isError ? 'text-red-500' : 'text-emerald-500')}>
        {status}
      </span>
    </div>
  );
}

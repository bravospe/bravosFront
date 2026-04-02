'use client';

import { useState, useEffect } from 'react';
import { 
  CpuChipIcon, 
  Square3Stack3DIcon, 
  CircleStackIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button } from '@/components/ui';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface Process {
  name: string;
  status: string;
  cpu: number;
  memory: string;
  restarts: number;
  uptime: string;
}

interface Metrics {
  cpu: number;
  ram: number;
  disk: number;
  uptime: string;
  processes: Process[];
}

export default function ServerMonitorPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const { data } = await api.get('/admin/server/metrics');
      setMetrics(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('No se pudieron obtener las métricas del servidor');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  const stats = [
    { name: 'Uso de CPU', value: `${metrics?.cpu}%`, icon: CpuChipIcon, color: metrics!.cpu > 80 ? 'text-rose-500' : 'text-emerald-500' },
    { name: 'Memoria RAM', value: `${metrics?.ram}%`, icon: Square3Stack3DIcon, color: metrics!.ram > 85 ? 'text-rose-500' : 'text-emerald-500' },
    { name: 'Disco Duro', value: `${metrics?.disk}%`, icon: CircleStackIcon, color: metrics!.disk > 90 ? 'text-rose-500' : 'text-emerald-500' },
    { name: 'Uptime', value: metrics?.uptime, icon: ClockIcon, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monitor del Servidor</h1>
          <p className="text-gray-500 dark:text-gray-400">Estado de recursos y procesos en tiempo real</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchMetrics} 
          loading={refreshing}
          icon={<ArrowPathIcon className="w-4 h-4" />}
        >
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.name}</p>
                <p className={clsx("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className={clsx("h-full transition-all duration-500", stat.color.replace('text-', 'bg-'))}
                style={{ width: stat.value.includes('%') ? stat.value : '100%' }}
              ></div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#232834] bg-gray-50/50 dark:bg-[#0D1117]/50">
          <h3 className="font-bold text-gray-900 dark:text-white">Procesos del Sistema (PM2)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-[#0D1117] border-b border-gray-200 dark:border-[#232834]">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Proceso</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">CPU</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Memoria</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Reinicios</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#232834]">
              {metrics?.processes.map((proc) => (
                <tr key={proc.name} className="hover:bg-gray-50 dark:hover:bg-[#161A22] transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white text-sm">
                    {proc.name}
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={proc.status === 'online' ? 'success' : 'danger'}
                      className="border-none flex items-center w-fit gap-1 capitalize"
                    >
                      {proc.status === 'online' ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                      {proc.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-sm text-gray-600 dark:text-gray-400">
                    {proc.cpu}%
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-sm text-gray-600 dark:text-gray-400">
                    {proc.memory}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="secondary" className="border-none bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 font-mono">
                      {proc.restarts}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-gray-500">
                    {proc.uptime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

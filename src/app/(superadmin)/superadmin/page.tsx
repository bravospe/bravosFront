'use client';

import { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  BanknotesIcon, 
  ChatBubbleLeftRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button } from '@/components/ui';
import Link from 'next/link';
import api from '@/lib/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import clsx from 'clsx';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/analytics/overview');
      
      // Map string icons from backend to actual React components
      const iconMap: Record<string, any> = {
        'UsersIcon': UsersIcon,
        'BuildingOfficeIcon': BuildingOfficeIcon,
        'BanknotesIcon': BanknotesIcon,
        'ChatBubbleLeftRightIcon': ChatBubbleLeftRightIcon
      };

      const mappedSummary = data.summary.map((item: any) => ({
        ...item,
        icon: iconMap[item.icon] || UsersIcon
      }));

      setStats({
        summary: mappedSummary,
        chartData: data.chartData
      });
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control SaaS</h1>
          <p className="text-gray-500 dark:text-gray-400">Bienvenido al centro de mando de Bravos.pe</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">Descargar Reporte</Button>
          <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 border-none">Mantenimiento</Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.summary.map((item: any) => (
          <Card key={item.name} className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400">
                <item.icon className="w-6 h-6" />
              </div>
              <div className={clsx(
                "flex items-center gap-1 text-sm font-medium",
                item.type === 'positive' ? 'text-emerald-500' : 'text-rose-500'
              )}>
                {item.type === 'positive' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                {item.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
              <p className="text-sm text-gray-500">{item.name}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white">Crecimiento de Suscripciones</h3>
            <select className="bg-gray-50 dark:bg-[#1E2230] border-none rounded-lg text-xs font-medium focus:ring-0">
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Actions / Recent Activity */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Acciones Rápidas</h3>
          <div className="space-y-4">
            <Link href="/superadmin/companies" className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Nueva Empresa</p>
                  <p className="text-xs text-gray-500">Crear manualmente</p>
                </div>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/superadmin/chats" className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Chat en Vivo</p>
                  <p className="text-xs text-gray-500">8 mensajes sin leer</p>
                </div>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/superadmin/plans" className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                  <BanknotesIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Membresías</p>
                  <p className="text-xs text-gray-500">Configurar planes</p>
                </div>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 rounded-xl">
            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">Estado del Sistema</h4>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-xs text-emerald-700 dark:text-emerald-500">Todos los servicios operacionales</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

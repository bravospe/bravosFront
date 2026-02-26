'use client';

import { useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  TruckIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useVirtualStoreStore } from '@/stores/virtualStoreStore';
import { useShippingStore } from '@/stores/shippingStore';
import { Spinner, Card } from '@/components/ui';

export default function VirtualStoreDashboard() {
  const { currentCompany } = useAuthStore();
  const { 
    fetchOrderStats, 
    orderStats, 
    fetchOrders, 
    orders, 
    isLoadingOrders,
    error: storeError 
  } = useVirtualStoreStore();
  
  const { 
    fetchShipmentStats, 
    shipmentStats 
  } = useShippingStore();

  // Load data when company ID changes
  useEffect(() => {
    if (currentCompany?.id) {
      const loadData = async () => {
        try {
          await Promise.all([
            fetchOrderStats(currentCompany.id),
            fetchOrders(currentCompany.id, { per_page: 5, sort_by: 'created_at', sort_order: 'desc' }),
            fetchShipmentStats(currentCompany.id)
          ]);
        } catch (error) {
          console.error("Error loading dashboard data:", error);
        }
      };
      loadData();
    }
  }, [currentCompany?.id, fetchOrderStats, fetchOrders, fetchShipmentStats]);

  // Safe stats values
  const pendingOrders = orderStats?.pending || 0;
  const totalRevenue = Number(orderStats?.total_revenue || 0);
  const pendingShipments = shipmentStats?.pending || 0;
  
  const stats = [
    {
      name: 'Pedidos Hoy',
      value: pendingOrders,
      change: '---', // TODO: Calculate real change
      changeType: 'neutral',
      icon: ShoppingBagIcon,
      color: 'bg-emerald-500',
    },
    {
      name: 'Ventas del Mes',
      value: `S/ ${totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      change: '---',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Envíos Pendientes',
      value: pendingShipments,
      change: '---',
      changeType: 'neutral',
      icon: TruckIcon,
      color: 'bg-orange-500',
    },
    {
      name: 'Clientes Nuevos',
      value: 0, // TODO: Add customer stats
      change: '---',
      changeType: 'neutral',
      icon: UsersIcon,
      color: 'bg-purple-500',
    },
  ];

  const orderStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  const orderStatusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  };

  if (!currentCompany) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-5 border-none shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800">
            <div className="flex items-center gap-4">
              <div className={clsx('rounded-lg p-3', stat.color)}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
            </div>
            {/* 
            <div className="mt-4 flex items-center gap-1">
              <span className="text-sm font-medium text-gray-500">
                {stat.change} vs mes anterior
              </span>
            </div>
            */}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="overflow-hidden border-none shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#232834] flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Pedidos Recientes
            </h3>
            <Link 
              href="/virtual-store/orders"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
            >
              Ver todos
            </Link>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-[#232834]">
            {isLoadingOrders ? (
              <div className="p-8 flex justify-center">
                <Spinner />
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No hay pedidos recientes
              </div>
            ) : (
              (orders || []).slice(0, 5).map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#161A22] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.order_number}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        • {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Cliente Invitado'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        orderStatusColors[order.status] || 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {orderStatusLabels[order.status] || order.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      S/ {Number(order.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions & Shipping Summary */}
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800">
             <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Estado de Envíos
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Pendientes', value: shipmentStats?.pending || 0, color: 'bg-yellow-500' },
                { label: 'Etiqueta generada', value: shipmentStats?.label_generated || 0, color: 'bg-blue-500' },
                { label: 'En tránsito', value: shipmentStats?.in_transit || 0, color: 'bg-purple-500' },
                { label: 'Entregados', value: shipmentStats?.delivered || 0, color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={clsx('w-3 h-3 rounded-full', item.color)} />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#232834]">
              <Link
                href="/virtual-store/shipments"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
              >
                Gestionar envíos <ArrowTrendingUpIcon className="w-4 h-4 rotate-45" />
              </Link>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/virtual-store/banners"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#161A22] transition-colors group"
              >
                <PlusIcon className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nuevo Banner</span>
              </Link>
              <Link
                href="/virtual-store/promotions"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#161A22] transition-colors group"
              >
                <TagIcon className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Promo</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

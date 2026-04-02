'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sora } from 'next/font/google';

const sora = Sora({ subsets: ['latin'] });
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserPermissions } from '@/hooks/useUserPermissions';

import { WelcomeHeroCard } from '@/components/dashboard/WelcomeHeroCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentSalesList } from '@/components/dashboard/RecentSalesList';
import { TopProductsGallery } from '@/components/dashboard/TopProductsGallery';

/* ─── Period Tabs ─── */
const PERIODS = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
] as const;

/* ─── Skeleton ─── */
const DashboardSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-5 h-72 bg-gray-100 dark:bg-[#111827] rounded-2xl" />
      <div className="lg:col-span-4 h-72 bg-gray-100 dark:bg-[#111827] rounded-2xl" />
      <div className="lg:col-span-3 h-72 bg-gray-100 dark:bg-[#111827] rounded-2xl" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 dark:bg-[#111827] rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-gray-100 dark:bg-[#111827] rounded-2xl" />
      ))}
    </div>
  </div>
);

/* ─── Main Page ─── */
const DashboardPage = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const { can } = useUserPermissions();

  const {
    stats,
    recentInvoices,
    topProducts,
    charts,
    isLoading,
    fetchDashboardStats,
    selectedPeriod,
    setSelectedPeriod,
  } = useDashboardStore();

  useEffect(() => {
    const isSuperAdmin = user?.roles?.some((r: any) => r.name === 'superadmin');
    if (isSuperAdmin) router.replace('/superadmin');
  }, [user, router]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Build KPI list based on permissions
  const kpis = useMemo(() => {
    const list: Array<{
      label: string;
      stat: any;
      icon: any;
      color: string;
      sparkKey?: string;
    }> = [];

    if (can.sales || can.accounting) {
      list.push({
        label: 'Ventas del Mes',
        stat: stats?.monthly_sales,
        icon: CurrencyDollarIcon,
        color: '#10B981',
        sparkKey: 'total',
      });
    }

    if (can.invoices) {
      list.push({
        label: 'Documentos Emitidos',
        stat: stats?.documents_issued,
        icon: DocumentTextIcon,
        color: '#6366F1',
        sparkKey: 'invoices',
      });
    }

    if (can.pos) {
      list.push({
        label: 'Ventas POS',
        stat: stats?.pos_sales,
        icon: ShoppingCartIcon,
        color: '#F59E0B',
        sparkKey: 'pos',
      });
    }

    if (can.clients) {
      list.push({
        label: 'Clientes Activos',
        stat: stats?.active_clients,
        icon: UsersIcon,
        color: '#10B981',
      });
    }

    return list;
  }, [can, stats]);

  if (isLoading || !stats) return <DashboardSkeleton />;

  const dailySales = charts?.daily_sales ?? [];
  const todaySales = dailySales.length > 0 ? dailySales[dailySales.length - 1].total : 0;

  const showCharts = can.sales || can.accounting || can.reports;
  const showTopProducts = can.products || can.sales || can.reports;

  return (
    <div className={`${sora.className} space-y-5`}>

      {/* ── Main Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column Group (Welcome + Chart + QuickActions) — Span 9 */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Top Row: Welcome | Revenue Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-4">
            <div className="lg:col-span-5">
              <WelcomeHeroCard todaySales={todaySales} />
            </div>
            <div className="lg:col-span-4">
              {showCharts && (
                <div className="rounded-[24px] bg-[#111827] border border-white/[0.04] p-6 h-full flex flex-col shadow-xl relative overflow-hidden">
                  {/* Chart header with period tabs */}
                  <div className="relative z-10 flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[14px] text-white/50 font-medium leading-none mb-1">Total de</p>
                      <h3 className="text-[32px] font-black text-white leading-tight tracking-tight">Ventas</h3>
                    </div>
                    <div className="flex items-center gap-1 bg-black/40 rounded-[14px] p-1 border border-white/5">
                      {PERIODS.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setSelectedPeriod(value as any)}
                          className={`px-4 py-1.5 rounded-[10px] text-[12px] font-bold transition-all duration-200 ${
                            selectedPeriod === value
                              ? 'bg-[#85fd37] text-black shadow-lg shadow-[#85fd37]/20'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Chart */}
                  <div className="flex-1 min-h-0 -mx-2">
                    <RevenueChart data={charts?.daily_sales ?? []} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Quick Actions */}
          <QuickActions />
        </div>

        {/* Right Column: Recent Sales (Tall) — Span 3 */}
        <div className="lg:col-span-3">
          <RecentSalesList invoices={recentInvoices} />
        </div>
      </div>

      {/* ── Row 3: KPI Cards ── */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.stat?.value ?? '—'}
              change={kpi.stat?.change ?? 0}
              changeType={kpi.stat?.changeType ?? 'neutral'}
              icon={kpi.icon}
              color={kpi.color}
              sparkData={kpi.sparkKey ? (charts?.daily_sales?.map((d: any) => d[kpi.sparkKey!]) ?? []) : []}
            />
          ))}
        </div>
      )}

      {/* ── Row 4: Top Products Gallery ── */}
      {showTopProducts && (
        <TopProductsGallery products={topProducts} canViewReports={can.reports} />
      )}

    </div>
  );
};

export default DashboardPage;

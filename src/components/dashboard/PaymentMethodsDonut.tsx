'use client';

import dynamic from 'next/dynamic';
import type { PaymentMethodData } from '@/stores/dashboardStore';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const PAYMENT_ICONS: Record<string, string> = {
  Efectivo: '💵',
  Tarjeta: '💳',
  Transferencia: '🏦',
  'Yape/Plin': '📱',
  Yape: '📱',
  Plin: '📱',
  Crédito: '📋',
};

interface PaymentMethodsDonutProps {
  data: PaymentMethodData[];
}

const formatCurrency = (val: number) =>
  `S/ ${Number(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

export const PaymentMethodsDonut = ({ data }: PaymentMethodsDonutProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
      background: 'transparent',
      animations: { enabled: true, speed: 600 },
    },
    labels: data.map((d) => d.name),
    colors: data.map((d) => d.color),
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: '#9CA3AF',
              fontSize: '12px',
              formatter: () => formatCurrency(total),
            },
            value: {
              color: '#F9FAFB',
              fontSize: '18px',
              fontWeight: '700',
              formatter: (val) => formatCurrency(Number(val)),
            },
          },
        },
      },
    },
    stroke: { width: 3, colors: ['#111827'] },
    states: {
      hover: { filter: { type: 'lighten', value: 0.1 } },
      active: { filter: { type: 'darken', value: 0.1 } },
    },
    dropShadow: {
      enabled: true,
      top: 2,
      left: 0,
      blur: 6,
      opacity: 0.25,
    },
    legend: { show: false },
    tooltip: {
      y: { formatter: formatCurrency },
      theme: 'dark',
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <Chart
        type="donut"
        series={data.map((d) => d.value)}
        options={options}
        height={220}
      />
      <div className="space-y-2">
        {data.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
          const icon = PAYMENT_ICONS[item.name] ?? '💰';
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {icon} {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 dark:text-gray-500">{pct}%</span>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {formatCurrency(item.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

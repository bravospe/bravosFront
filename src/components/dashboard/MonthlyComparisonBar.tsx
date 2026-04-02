'use client';

import dynamic from 'next/dynamic';
import type { MonthlyComparisonData } from '@/stores/dashboardStore';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface MonthlyComparisonBarProps {
  data: MonthlyComparisonData[];
}

const formatCurrency = (val: number) =>
  `S/ ${Number(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 0 })}`;

export const MonthlyComparisonBar = ({ data }: MonthlyComparisonBarProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true, speed: 700 },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 6,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    colors: ['#10B981', '#6366F1'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: ['#34D399', '#818CF8'],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.75,
        stops: [0, 100],
      },
    },
    xaxis: {
      categories: data.map((d) => d.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#9CA3AF', fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        formatter: (val) => `S/${(val / 1000).toFixed(0)}k`,
        style: { colors: '#9CA3AF', fontSize: '11px' },
      },
    },
    grid: {
      borderColor: '#1F2937',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: formatCurrency },
      theme: 'dark',
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#9CA3AF' },
      markers: { size: 8 },
    },
  };

  const series = [
    { name: 'Facturación', data: data.map((d) => d.invoices) },
    { name: 'POS', data: data.map((d) => d.pos) },
  ];

  return (
    <Chart
      type="bar"
      series={series}
      options={options}
      height={256}
    />
  );
};

'use client';

import dynamic from 'next/dynamic';
import type { DailySalesData } from '@/stores/dashboardStore';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface RevenueChartProps {
  data: DailySalesData[];
}

const formatCurrency = (val: number) =>
  `S/ ${Number(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const RevenueChart = ({ data }: RevenueChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-full min-h-[200px] flex items-center justify-center text-sm text-gray-500 font-sora">
        No hay datos de ventas para mostrar
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.total));
  const indicators = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 800, animateGradually: { enabled: true, delay: 150 } },
      background: 'transparent',
      sparkline: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3, colors: ['#85fd37'] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        type: 'vertical',
        colorStops: [
          { offset: 0, color: '#85fd37', opacity: 0.4 },
          { offset: 100, color: '#85fd37', opacity: 0.01 },
        ],
      },
    },
    colors: ['#85fd37'],
    xaxis: {
      categories: data.map((d) => d.date),
      labels: { 
        show: true,
        style: {
          colors: 'rgba(255, 255, 255, 0.15)',
          fontSize: '8px',
          fontFamily: 'Sora, sans-serif',
        },
        offsetY: -5,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false }
    },
    yaxis: {
      min: 0,
      max: maxVal * 1.2,
      show: false,
    },
    grid: {
      show: true,
      borderColor: 'rgba(255, 255, 255, 0.05)',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 0, right: 0, top: 0, bottom: 0 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: formatCurrency },
      theme: 'dark',
    },
    legend: { show: false },
    annotations: {
      position: 'front',
      yaxis: indicators.map(val => ({
        y: val,
        borderColor: 'transparent',
        label: {
          text: `S/ ${Math.round(val / 1000)}k`,
          borderWidth: 0,
          style: {
            color: 'rgba(255, 255, 255, 0.2)',
            background: 'transparent',
            fontSize: '10.8px', // Aumentado 50% (7.2px * 1.5)
            fontWeight: 600,
            fontFamily: 'Sora, sans-serif',
          },
          position: 'left',
          textAnchor: 'start',
          offsetX: 10,
          offsetY: 0,
        },
      })),
    },
  };

  return (
    <div className="absolute inset-x-0 bottom-[10px] h-[80%] overflow-hidden">
      <div className="w-full h-full transform translate-y-4">
        <Chart
          type="area"
          series={[{ name: 'Total Ventas', data: data.map((d) => d.total) }]}
          options={options}
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
};

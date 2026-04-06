'use client';

import dynamic from 'next/dynamic';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  sparkData?: number[];
}

export const KpiCard = ({
  label,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  sparkData = [],
}: KpiCardProps) => {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  const sparkOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      sparkline: { enabled: true },
      animations: { enabled: true, speed: 600 },
    },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    colors: [color],
    tooltip: { enabled: false },
  };

  return (
    <div className="rounded-[24px] bg-white dark:bg-[#080B12] border border-gray-100 dark:border-white/[0.04] p-6 flex flex-col gap-4 shadow-sm dark:shadow-xl">
      {/* Top: Icon + Badge */}
      <div className="flex items-center justify-between">
        <div
          className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center shadow-inner"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-[22px] h-[22px]" style={{ color }} />
        </div>
        {change && (
          <span
            className={`flex items-center gap-[2px] text-[12px] font-black px-3 py-1.5 rounded-full ${
              isPositive
                ? 'text-[#22C55E] bg-[#22C55E]/10'
                : isNegative
                ? 'text-[#EF4444] bg-[#EF4444]/10'
                : 'text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5'
            }`}
          >
            {isPositive && '↑ '}
            {isNegative && '↓ '}
            {change}
          </span>
        )}
      </div>

      {/* Value + Label */}
      <div className="mt-1">
        <p className="text-[28px] font-semibold text-gray-900 dark:text-white tracking-tight leading-none">{value}</p>
        <p className="text-[12px] text-gray-500 dark:text-white/40 mt-2 font-semibold uppercase tracking-wide">{label}</p>
      </div>

      {/* Sparkline */}
      {sparkData.length > 1 && (
        <div className="-mx-1 mt-auto pt-2">
          <Chart
            type="area"
            series={[{ data: sparkData }]}
            options={sparkOptions}
            height={50}
          />
        </div>
      )}
    </div>
  );
};

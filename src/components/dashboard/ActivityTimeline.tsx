'use client';

import Link from 'next/link';
import type { RecentInvoice } from '@/stores/dashboardStore';

interface ActivityTimelineProps {
  invoices: RecentInvoice[];
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; hoverText: string }> = {
  accepted: {
    label: 'Aceptada',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    hoverText: 'text-emerald-400',
  },
  paid: {
    label: 'Pagada',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    hoverText: 'text-emerald-400',
  },
  pending: {
    label: 'Pendiente',
    dot: 'bg-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    hoverText: 'text-amber-300',
  },
  rejected: {
    label: 'Rechazada',
    dot: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    hoverText: 'text-red-400',
  },
  annulled: {
    label: 'Anulada',
    dot: 'bg-gray-400',
    text: 'text-gray-500 dark:text-gray-400',
    hoverText: 'text-gray-400',
  },
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-indigo-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
];

export const ActivityTimeline = ({ invoices }: ActivityTimelineProps) => {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
        No hay comprobantes recientes
      </div>
    );
  }

  return (
    <div className="relative">
      <style>{`
        @keyframes timeline-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .timeline-item:hover .tl-client { color: #fff; }
        .timeline-item:hover .tl-id     { color: rgba(255,255,255,0.5); }
        .timeline-item:hover .tl-amount { color: #fff; }
        .timeline-item:hover .tl-date   { color: rgba(255,255,255,0.4); }
      `}</style>

      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100 dark:bg-[#1E2230]" />

      <div className="space-y-1">
        {invoices.map((invoice, index) => {
          const statusCfg = STATUS_CONFIG[invoice.status] ?? {
            label: invoice.status,
            dot: 'bg-gray-400',
            text: 'text-gray-500',
            hoverText: 'text-gray-400',
          };
          const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
          const isNegative = invoice.amount.startsWith('-');
          const href = invoice.uuid
            ? `/invoices?open=${invoice.uuid}`
            : '/invoices';

          return (
            <Link
              key={invoice.uuid ?? invoice.id}
              href={href}
              style={{ animation: 'timeline-fadein 450ms ease both' }}
              className="timeline-item flex gap-4 items-start py-3 px-1 rounded-xl
                         hover:bg-[#111827] dark:hover:bg-[#0D1117]
                         transition-colors group cursor-pointer"
            >
              {/* Avatar */}
              <div className={`relative z-10 w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-xs font-bold text-white">
                  {getInitials(invoice.client)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="tl-client text-sm font-semibold text-gray-800 dark:text-gray-200 truncate transition-colors">
                      {invoice.client}
                    </p>
                    <p className="tl-id text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5 transition-colors">
                      {invoice.id}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`tl-amount text-sm font-bold transition-colors ${isNegative ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                      {invoice.amount}
                    </span>
                    <span className="tl-date text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap transition-colors">
                      {invoice.date}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  <span className={`text-[11px] font-medium ${statusCfg.text} group-hover:${statusCfg.hoverText} transition-colors`}>
                    {statusCfg.label}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#1E2230]">
        <Link
          href="/invoices"
          className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
        >
          Ver todos los comprobantes →
        </Link>
      </div>
    </div>
  );
};

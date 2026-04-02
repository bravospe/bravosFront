'use client';

import Link from 'next/link';
import {
  ShoppingCartIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { useUserPermissions } from '@/hooks/useUserPermissions';

const actions = [
  {
    label: 'Abrir POS',
    description: 'Punto de venta',
    href: '/pos',
    icon: ShoppingCartIcon,
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.15)',
    permission: 'pos.access',
  },
  {
    label: 'Reportes',
    description: 'Ver estadísticas',
    href: '/reports',
    icon: ChartBarIcon,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
    permission: 'reports.view',
  },
  {
    label: 'Tienda Virtual',
    description: 'Configurar tienda',
    href: '/virtual-store/settings',
    icon: GlobeAltIcon,
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.15)',
    permission: 'settings.edit',
  },
  {
    label: 'Inventario',
    description: 'Kardex y stock',
    href: '/inventory/kardex',
    icon: ArchiveBoxIcon,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.15)',
    permission: 'inventory.view',
  },
];

export const QuickActions = () => {
  const { hasPermission } = useUserPermissions();
  const visibleActions = actions.filter((a) => hasPermission(a.permission));

  if (visibleActions.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {visibleActions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-[20px] bg-[#111827] border border-white/5 p-4 flex items-center gap-4 hover:bg-[#161B2E] transition-all duration-200 shadow-lg"
          >
            <div
              className="w-[54px] h-[54px] rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-inner"
              style={{ backgroundColor: action.bg }}
            >
              <Icon className="w-[26px] h-[26px]" style={{ color: action.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-black text-white leading-tight tracking-tight">{action.label}</p>
              <p className="text-[11px] text-white/40 font-medium mt-[3px]">{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

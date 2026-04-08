'use client';

import Link from 'next/link';
import {
  ShoppingCartIcon,
  GlobeAltIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { ChartNoAxesCombined } from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';

const actions = [
  {
    label: 'Abrir POS',
    description: 'Punto de venta',
    href: '/pos',
    icon: ShoppingCartIcon,
    color: '#A855F7',
    permission: 'pos.access',
  },
  {
    label: 'Reportes',
    description: 'Ver estadísticas',
    href: '/reports',
    icon: ChartNoAxesCombined,
    color: '#F59E0B',
    permission: 'reports.view',
  },
  {
    label: 'Tienda Virtual',
    description: 'Configurar tienda',
    href: '/virtual-store/settings',
    icon: GlobeAltIcon,
    color: '#EC4899',
    permission: 'settings.edit',
  },
  {
    label: 'Inventario',
    description: 'Kardex y stock',
    href: '/inventory/kardex',
    icon: ArchiveBoxIcon,
    color: '#10B981',
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
            className="group relative rounded-[20px] bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 p-3 sm:p-5 flex items-center gap-2 sm:gap-4 overflow-hidden transition-all duration-300 shadow-sm"
          >
            {/* Hover fill background */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: action.color }}
            />

            {/* Large icon — colored at rest, white on hover */}
            <div className="relative z-10 flex-shrink-0">
              {/* Colored version (rest) */}
              <Icon
                className="opacity-100 group-hover:opacity-0 transition-opacity duration-300"
                style={{ color: action.color, width: 54, height: 54, marginLeft: -20, marginBottom: -20 }}
              />
              {/* White version (hover) */}
              <Icon
                className="absolute inset-0 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ width: 54, height: 54, marginLeft: -20, marginBottom: -20 }}
              />
            </div>

            {/* Text */}
            <div className="relative z-10 min-w-0">
              <p className="text-[13px] sm:text-[15px] font-black text-gray-900 dark:text-white group-hover:text-white leading-tight tracking-tight transition-colors duration-300 truncate">
                {action.label}
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-white/50 group-hover:text-white/80 font-medium mt-[3px] transition-colors duration-300 line-clamp-1">
                {action.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

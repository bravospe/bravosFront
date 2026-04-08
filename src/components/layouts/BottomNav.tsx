'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

const items = [
  { name: 'Inicio', href: '/dashboard', Icon: HomeIcon, IconActive: HomeIconSolid },
  { name: 'Clientes', href: '/clients', Icon: UsersIcon, IconActive: UsersIconSolid },
  { name: 'POS', href: '/pos', Icon: ShoppingCartIcon, IconActive: ShoppingCartIconSolid, isPOS: true },
  { name: 'Facturas', href: '/invoices', Icon: DocumentTextIcon, IconActive: DocumentTextIconSolid },
  { name: 'Reportes', href: '/reports', Icon: ChartBarIcon, IconActive: ChartBarIconSolid },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/pos') return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)] border-t border-white/5">
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = isActive ? item.IconActive : item.Icon;

          if (item.isPOS) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-end pb-2"
              >
                <div className="flex flex-col items-center -mt-5">
                  <div className={clsx(
                    'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 active:scale-95',
                    isActive
                      ? 'bg-emerald-500 shadow-emerald-500/50'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  )}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className={clsx(
                    'text-[10px] mt-0.5 font-medium hidden min-[375px]:block',
                    isActive ? 'text-emerald-400' : 'text-gray-400'
                  )}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 overflow-hidden active:scale-95 transition-transform duration-150"
            >
              <Icon className={clsx(
                'w-6 h-6 flex-shrink-0 transition-colors duration-150',
                isActive ? 'text-emerald-400' : 'text-gray-500'
              )} />
              <span className={clsx(
                'text-[10px] font-medium leading-none truncate w-full text-center px-1 hidden min-[375px]:block',
                isActive ? 'text-emerald-400' : 'text-gray-500'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  HomeIcon,
  ShoppingBagIcon,
  TruckIcon,
  UsersIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  PhotoIcon,
  TagIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useVirtualStoreStore } from '@/stores/virtualStoreStore';

const tabs = [
  { name: 'Vista General', href: '/virtual-store', icon: HomeIcon },
  { name: 'Pedidos', href: '/virtual-store/orders', icon: ShoppingBagIcon },
  { name: 'Envios', href: '/virtual-store/shipments', icon: TruckIcon },
  { name: 'Clientes', href: '/virtual-store/customers', icon: UsersIcon },
  { name: 'Banners', href: '/virtual-store/banners', icon: PhotoIcon },
  { name: 'Promociones', href: '/virtual-store/promotions', icon: TagIcon },
  { name: 'Apariencia', href: '/virtual-store/appearance', icon: PaintBrushIcon },
  { name: 'Configuracion', href: '/virtual-store/settings', icon: Cog6ToothIcon },
];

export default function VirtualStoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentCompany } = useAuthStore();
  const { settings, fetchSettings, isLoadingSettings } = useVirtualStoreStore();

  useEffect(() => {
    if (currentCompany?.id) {
      fetchSettings(currentCompany.id);
    }
  }, [currentCompany?.id, fetchSettings]);

  const RESERVED_NAMES = ['app', 'api', 'www', 'shop', 'home', 'back', 'admin', 'mail', 'ftp', 'staging', 'dev'];

  const isSlugValid = (slug: string) => {
    return slug && slug.length >= 10 && !RESERVED_NAMES.includes(slug.toLowerCase());
  };

  const getPreviewUrl = () => {
    if (!settings || !isSlugValid(settings.slug)) return null;
    if (typeof window === 'undefined') return '#';
    
    const currentHost = window.location.hostname;
    const slug = settings.slug;
    
    // Production logic: if we are on bravos.pe domain
    if (currentHost.includes('bravos.pe')) {
      return `https://${slug}.bravos.pe`;
    }
    
    // Local/Dev logic
    const port = process.env.NEXT_PUBLIC_STOREFRONT_PORT || '3004';
    return `http://${slug}.${currentHost}:${port}`;
  };

  const previewUrl = getPreviewUrl();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Tienda Virtual
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administra tu tienda en linea, pedidos y configuracion
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Store Status */}
          {settings && (
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  settings.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-black dark:text-gray-400'
                )}
              >
                <span
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full mr-1.5',
                    settings.is_active ? 'bg-green-500' : 'bg-gray-400'
                  )}
                />
                {settings.is_active ? 'Activa' : 'Inactiva'}
              </span>
              {settings.maintenance_mode && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  En mantenimiento
                </span>
              )}
            </div>
          )}

          {/* Preview Button */}
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-black border border-transparent rounded-lg hover:opacity-90 shadow-sm transition-all"
              style={{ backgroundColor: '#fdf704' }}
            >
              <BuildingStorefrontIcon className="w-5 h-5" />
              Ver Tienda
            </a>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-400 bg-gray-100 dark:bg-[#1E2230] border border-transparent rounded-lg cursor-not-allowed opacity-50"
              title="El nombre de la tienda debe tener al menos 10 caracteres y ser válido"
            >
              <BuildingStorefrontIcon className="w-5 h-5" />
              Ver Tienda
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-[#232834]">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== '/virtual-store' && pathname.startsWith(tab.href));

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={clsx(
                  'group inline-flex items-center gap-2 whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                <tab.icon
                  className={clsx(
                    'w-4 h-4',
                    isActive
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  );
};

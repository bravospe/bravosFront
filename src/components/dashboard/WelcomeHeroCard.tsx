'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  DocumentPlusIcon,
  UserPlusIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usePOSStore } from '@/stores/posStore';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { AlertsCarousel } from '@/components/dashboard/AlertsCarousel';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días,';
  if (h < 19) return 'Buenas tardes,';
  return 'Buenas noches,';
};

interface WelcomeHeroCardProps {
  todaySales: number;
}

export const WelcomeHeroCard = ({ todaySales }: WelcomeHeroCardProps) => {
  const { user } = useAuthStore();
  const { registersStatus, fetchRegistersStatus } = usePOSStore();
  const { hasPermission } = useUserPermissions();
  const today = new Date().getDate();

  useEffect(() => {
    fetchRegistersStatus();
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Usuario';

  // Solo mostrar cajas que estén activas en el sistema
  const activeRegisters = (registersStatus || []).filter(r => r.is_active);

  return (
    <div className="shadow-xl rounded-[24px] h-full" style={{ minHeight: 330 }}>
    <div className="relative overflow-hidden rounded-[24px] bg-[#22C55E] p-4 sm:p-6 h-full flex flex-col">
      
      {/* ── Header: Greeting + Calendar ── */}
      <div className="relative flex items-start justify-between mb-3">
        <div>
          <p className="text-[14px] sm:text-[16px] font-medium text-white/90">{getGreeting()}</p>
          <h2 className="text-[28px] sm:text-[36px] font-black text-white leading-tight tracking-tight">{firstName}!</h2>
        </div>
        <div className="w-[56px] h-[56px] rounded-[18px] bg-[#111827] flex flex-col items-center justify-center shadow-lg shadow-black/10">
          <svg className="w-[22px] h-[22px] text-white/50" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span className="text-[16px] font-black text-white leading-none mt-0.5">{today}</span>
        </div>
      </div>

      {/* ── Ventas de Hoy + Estado de Cajas ── */}
      <div className="relative flex flex-col gap-3 mb-3">
        {/* Ventas de Hoy */}
        <div className="flex-1 bg-[#111827] rounded-[18px] px-4 py-4 shadow-xl">
          <p className="text-[11px] font-bold text-[#85fd37] mb-1.5 uppercase tracking-wider">Ventas de Hoy</p>
          <p className="text-[26px] font-black text-white leading-none">
            <span className="text-[16px] font-black mr-1 text-[#85fd37]">S/</span>
            {todaySales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        {/* Estado de Cajas */}
        <div className="bg-[#111827] rounded-[18px] px-4 py-4 flex-1 min-w-0 shadow-xl">
          <p className="text-[11px] font-bold text-[#85fd37] mb-2.5 uppercase tracking-wider">Estado de Cajas</p>
          <div className="flex flex-wrap gap-2">
            {activeRegisters.length > 0 ? (
              activeRegisters.map((reg) => {
                const isOpen = reg.status === 'occupied';
                return (
                  <span key={reg.id} className={`flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-colors ${
                    isOpen
                      ? 'bg-[#85fd37] text-black'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {isOpen ? '✓ ' : '× '}{reg.name}
                  </span>
                );
              })
            ) : (
              <span className="text-[10px] text-white/30 italic">Sin cajas configuradas</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Buttons: Factura / Cliente / Producto ── */}
      <div className="relative flex gap-2.5 mb-3">
        {hasPermission('invoices.create') && (
          <Link
            href="/invoices"
            className="flex-1 flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 px-2 sm:px-3 py-2.5 sm:py-3 rounded-[18px] bg-white/20 hover:bg-white/30 transition-all group border border-white/10"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0">
               <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
               </svg>
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="text-[8px] sm:text-[9px] text-white/80 uppercase font-black leading-none mb-0.5 sm:mb-1">Nueva</p>
              <p className="text-[10px] sm:text-[12px] font-black text-white leading-none">FACTURA</p>
            </div>
          </Link>
        )}
        {hasPermission('clients.create') && (
          <Link
            href="/clients"
            className="flex-1 flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 px-2 sm:px-3 py-2.5 sm:py-3 rounded-[18px] bg-white/20 hover:bg-white/30 transition-all group border border-white/10"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0">
               <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
               </svg>
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="text-[8px] sm:text-[9px] text-white/80 uppercase font-black leading-none mb-0.5 sm:mb-1">Nuevo</p>
              <p className="text-[10px] sm:text-[12px] font-black text-white leading-none">Cliente</p>
            </div>
          </Link>
        )}
        {hasPermission('products.create') && (
          <Link
            href="/products/create"
            className="flex-1 flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 px-2 sm:px-3 py-2.5 sm:py-3 rounded-[18px] bg-white/20 hover:bg-white/30 transition-all group border border-white/10"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0">
               <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
               </svg>
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="text-[8px] sm:text-[9px] text-white/80 uppercase font-black leading-none mb-0.5 sm:mb-1">Nuevo</p>
              <p className="text-[10px] sm:text-[12px] font-black text-white leading-none">Producto</p>
            </div>
          </Link>
        )}
      </div>

      {/* ── Alerts Carousel ── */}
      <AlertsCarousel />
    </div>
    </div>
  );
};

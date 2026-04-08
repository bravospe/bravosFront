'use client';

import { useState, useEffect, useRef } from 'react';
import type { RecentInvoice } from '@/stores/dashboardStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import {
  ShoppingCartIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon,
  EllipsisHorizontalCircleIcon
} from '@heroicons/react/24/outline';
import { YapeIcon, PlinIcon } from '@/components/ui/WalletIcons';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface RecentSalesListProps {
  invoices: RecentInvoice[];
}

const NOTCH_W = 173;
const NOTCH_H = 46;
const NOTCH_R = 22;
const MAX_ITEMS = 7;

const getPaymentStyle = (method: string | undefined) => {
  const m = method?.toLowerCase() || 'other';
  if (m.includes('yape')) return { icon: <YapeIcon className="w-5 h-5 text-white" />, bg: 'bg-[#7C3AED]' };
  if (m.includes('plin')) return { icon: <PlinIcon className="w-5 h-5 text-white" />, bg: 'bg-[#00D1FF]' };
  if (m.includes('cash') || m.includes('efectivo')) return { icon: <BanknotesIcon className="w-5 h-5 text-white" />, bg: 'bg-[#22C55E]' };
  if (m.includes('transfer') || m.includes('transferencia')) return { icon: <ArrowsRightLeftIcon className="w-5 h-5 text-white" />, bg: 'bg-[#3B82F6]' };
  if (m.includes('card') || m.includes('tarjeta')) return { icon: <CreditCardIcon className="w-5 h-5 text-white" />, bg: 'bg-[#6366F1]' };
  return { icon: <EllipsisHorizontalCircleIcon className="w-5 h-5 text-white" />, bg: 'bg-[#374151]' };
};

const getDocTypeInitial = (inv: RecentInvoice) => {
  if (inv.id.startsWith('F')) return 'F';
  if (inv.type === 'pos' || inv.id.startsWith('B')) return 'B';
  return 'NV';
};

export const RecentSalesList = ({ invoices: initialInvoices }: RecentSalesListProps) => {
  const { fetchRecentSalesOnly } = useDashboardStore();
  const [localInvoices, setLocalInvoices] = useState<RecentInvoice[]>([]);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const router = useRouter();

  useEffect(() => {
    if (initialInvoices.length === 0) return;

    setLocalInvoices(prev => {
      const uniqueMap = new Map();
      initialInvoices.forEach(item => uniqueMap.set(item.id, item));
      prev.forEach(item => {
        if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
      });

      const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
        return parseISO(b.date).getTime() - parseISO(a.date).getTime();
      });

      const finalSelection = sorted.slice(0, MAX_ITEMS);

      if (isFirstLoad.current) {
        prevIdsRef.current = new Set(finalSelection.map(i => i.id));
        isFirstLoad.current = false;
      }

      return finalSelection;
    });
  }, [initialInvoices]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentSalesOnly();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchRecentSalesOnly]);

  useEffect(() => {
    const currentIds = new Set(localInvoices.map(i => i.id));
    const timer = setTimeout(() => {
      prevIdsRef.current = currentIds;
    }, 3000);
    return () => clearTimeout(timer);
  }, [localInvoices]);

  const handleItemClick = (inv: RecentInvoice) => {
    const openId = (inv as any).uuid || inv.id;
    router.push(`/invoices?open=${openId}`);
  };

  const w2 = NOTCH_W / 2;
  const h = NOTCH_H;
  const r = NOTCH_R;

  const clipPath = `polygon(
    0% 0%, calc(50% - ${w2}px) 0%, calc(50% - ${w2}px) ${h - r}px,
    calc(50% - ${w2}px + ${r * 0.1}px) ${h - r * 0.4}px, calc(50% - ${w2}px + ${r * 0.3}px) ${h - r * 0.15}px,
    calc(50% - ${w2}px + ${r * 0.6}px) ${h - r * 0.05}px, calc(50% - ${w2}px + ${r}px) ${h}px,
    calc(50% + ${w2}px - ${r}px) ${h}px, calc(50% + ${w2}px - ${r * 0.6}px) ${h - r * 0.05}px,
    calc(50% + ${w2}px - ${r * 0.3}px) ${h - r * 0.15}px, calc(50% + ${w2}px - ${r * 0.1}px) ${h - r * 0.4}px,
    calc(50% + ${w2}px) ${h - r}px, calc(50% + ${w2}px) 0%, 100% 0%, 100% 100%, 0% 100%
  )`;

  return (
    <div className="relative h-full flex flex-col shadow-xl rounded-[24px]" style={{ minHeight: 330 }}>
      <div
        className="bg-[#DDDDDD] rounded-[24px] flex-1 flex flex-col overflow-hidden"
        style={{ paddingTop: `${NOTCH_H + 10}px`, clipPath }}
      >
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {localInvoices.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12">
               <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-3">
                  <ShoppingCartIcon className="w-8 h-8 text-gray-400" />
               </div>
               <p className="text-[13px] text-gray-500 font-semibold text-center">Esperando ventas...</p>
            </div>
          ) : (
            <div className="space-y-2 relative">
              {localInvoices.map((inv, index) => {
                const style = getPaymentStyle(inv.payment_method);
                const itemsCount = inv.items_count || 0;
                const isNew = !prevIdsRef.current.has(inv.id) && !isFirstLoad.current;

                let depthStyles = "scale-100 opacity-100";
                if (index === 5) depthStyles = "scale-[0.95] opacity-90 origin-top";
                if (index === 6) depthStyles = "scale-[0.90] opacity-80 origin-top";

                let timeAgo = 'Recientemente';
                try {
                  if (inv.date) {
                    const dateObj = parseISO(inv.date);
                    if (!isNaN(dateObj.getTime())) {
                      timeAgo = formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
                    }
                  }
                } catch (e) {}

                return (
                  <button
                    key={inv.id}
                    onClick={() => handleItemClick(inv)}
                    className={`w-full rounded-full p-2 shadow-sm grid items-center gap-1 transition-all duration-[1200ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] transform group/item cursor-pointer ${depthStyles} ${
                      isNew ? 'animate-in fade-in zoom-in-95' : ''
                    } bg-white hover:bg-black`}
                    style={{ gridTemplateColumns: '15% 35% 15% 35%' }}
                  >
                    <div className="flex justify-center">
                      <div className={`w-7 h-7 rounded-full ${style.bg} flex items-center justify-center shadow-inner overflow-hidden`}>
                        <div className="scale-[0.8]">
                          {style.icon}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center overflow-hidden">
                      <p className="text-[13.5px] font-semibold text-gray-900 group-hover/item:text-white leading-none mb-1 truncate transition-colors">{itemsCount} {itemsCount === 1 ? 'Producto' : 'Productos'}</p>
                      <p className="text-[10px] font-medium text-gray-400 group-hover/item:text-gray-300 leading-none truncate first-letter:uppercase transition-colors">{timeAgo}</p>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 group-hover/item:bg-emerald-900/40 flex items-center justify-center text-[14px] font-semibold text-emerald-600 group-hover/item:text-emerald-400 border border-emerald-100 group-hover/item:border-emerald-800 transition-colors">
                        {getDocTypeInitial(inv)}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 overflow-hidden pr-4">
                      <span className="text-[11px] font-semibold text-gray-400 group-hover/item:text-gray-300 flex-shrink-0 transition-colors">S/</span>
                      <span className="text-[15px] font-semibold text-gray-900 group-hover/item:text-white tabular-nums truncate transition-colors">
                        {inv.amount.replace('S/ ', '').replace('S/', '')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none z-10" style={{ width: `${NOTCH_W}px`, height: `${NOTCH_H}px`, marginTop: '-1px' }} />
      <div className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2" style={{ top: '0px', whiteSpace: 'nowrap' }}>
        <div className="flex items-center gap-2.5 px-2 py-1 shadow-lg border border-black/5" style={{ backgroundColor: '#85fd37', borderRadius: '50px' }}>
          <span className="text-black text-[14px] font-semibold tracking-tight ml-1 font-sora">Ultimas Ventas</span>
          <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner" style={{ backgroundColor: '#000' }}>
             <ShoppingCartIcon className="w-[14px] h-[14px] text-white" strokeWidth={3} />
          </span>
        </div>
      </div>
    </div>
  );
};

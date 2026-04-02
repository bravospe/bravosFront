'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { TopProduct } from '@/stores/dashboardStore';

interface TopProductsGalleryProps {
  products: TopProduct[];
  canViewReports?: boolean;
}

// Notch dimensions
const NOTCH_W = 252;
const NOTCH_H = 46;
const NOTCH_R = 22;

export const TopProductsGallery = ({ products, canViewReports }: TopProductsGalleryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  // Approximate curve points for clip-path
  const w2 = NOTCH_W / 2;
  const h = NOTCH_H;
  const r = NOTCH_R;

  const clipPath = `polygon(
    0% 0%,
    calc(50% - ${w2}px) 0%,
    calc(50% - ${w2}px) ${h - r}px,
    calc(50% - ${w2}px + ${r * 0.1}px) ${h - r * 0.4}px,
    calc(50% - ${w2}px + ${r * 0.3}px) ${h - r * 0.15}px,
    calc(50% - ${w2}px + ${r * 0.6}px) ${h - r * 0.05}px,
    calc(50% - ${w2}px + ${r}px) ${h}px,
    calc(50% + ${w2}px - ${r}px) ${h}px,
    calc(50% + ${w2}px - ${r * 0.6}px) ${h - r * 0.05}px,
    calc(50% + ${w2}px - ${r * 0.3}px) ${h - r * 0.15}px,
    calc(50% + ${w2}px - ${r * 0.1}px) ${h - r * 0.4}px,
    calc(50% + ${w2}px) ${h - r}px,
    calc(50% + ${w2}px) 0%,
    100% 0%,
    100% 100%,
    0% 100%
  )`;

  return (
    <div className="relative" style={{ overflow: 'visible' }}>

      {/* ── White card with Clip Path ── */}
      <div
        className="bg-white rounded-[24px] shadow-xl overflow-hidden"
        style={{
          paddingTop: `${NOTCH_H + 20}px`,
          clipPath: clipPath
        }}
      >

        {/* ── Carousel ── */}
        {!products || products.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No hay ventas de productos registradas
          </div>
        ) : (
          <div className="relative group/carousel px-3 pb-3">
            {/* Left arrow */}
            <button
              onClick={() => scroll('left')}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10
                         w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-black
                         opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200"
            style={{ backgroundColor: '#85fd37' }}
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Scrollable row */}
            <div
              ref={scrollRef}
              className="flex gap-8 overflow-x-auto scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {products.slice(0, 20).map((product, index) => {
                // Gold (#F5C518 ≈ hue 45°) at position 1, Red (hue 0°) at position 20
                const hue = Math.round(45 * (1 - index / 19));
                const rankColor = `hsl(${hue}, 90%, 48%)`;
                return (
                  <button
                    key={`${product.name}-${index}`}
                    onClick={() => product.id && router.push(`/products/${product.id}/edit`)}
                    style={{ scrollSnapAlign: 'start', minWidth: '160px', maxWidth: '160px' }}
                    className="flex-shrink-0 flex flex-col gap-1.5 text-left group/product cursor-pointer"
                    title={product.id ? `Editar ${product.name}` : product.name}
                  >
                    {/* Image + badges */}
                    <div className="relative overflow-hidden rounded-[24px] shadow-sm border border-gray-50 group-hover/product:shadow-md transition-shadow">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-36 object-cover group-hover/product:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-36 rounded-[24px] flex items-center justify-center bg-gray-100 group-hover/product:bg-gray-200 transition-colors">
                          <span className="text-2xl font-semibold text-gray-200 uppercase">
                            {product.name.substring(0, 2)}
                          </span>
                        </div>
                      )}
                      {/* Position badge */}
                      <div
                        className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full
                                   flex items-center justify-center text-[15px] font-semibold shadow-md border-2 border-white"
                        style={{ backgroundColor: rankColor, color: '#fff' }}
                      >
                        {index + 1}
                      </div>
                      {/* Sales count badge */}
                      <div
                        className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg"
                        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#85fd37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <path d="M16 10a4 4 0 01-8 0"/>
                        </svg>
                        <span className="text-white text-[13px] font-semibold leading-none">
                          {product.quantity}
                        </span>
                      </div>
                      {/* Edit overlay on hover */}
                      {product.id && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/product:opacity-100 transition-opacity rounded-[24px] flex items-center justify-center">
                          <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded-full">Editar</span>
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <p className="text-[12.6px] font-normal leading-tight line-clamp-2 text-gray-900 h-10 px-0.5">
                      {product.name}
                    </p>

                    {/* Price */}
                    <p className="text-[17px] font-semibold text-gray-900 px-0.5">
                      <span className="text-[12px] font-semibold text-gray-400 mr-1">S/</span>
                      {String(product.revenue).replace(/^S\/\s*/, '')}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Right arrow */}
            <button
              onClick={() => scroll('right')}
              aria-label="Siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10
                         w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-black
                         opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200"
            style={{ backgroundColor: '#85fd37' }}
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Notch overlay ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none z-10"
        style={{
          width: `${NOTCH_W}px`,
          height: `${NOTCH_H}px`,
          marginTop: '-1px',
        }}
      />

      {/* ── Pill "Productos más vendidos" ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
        style={{ top: '0px', whiteSpace: 'nowrap' }}
      >
        <div
          className="flex items-center gap-2.5 px-2 py-1 shadow-xl border border-black/5"
          style={{ backgroundColor: '#85fd37', borderRadius: '50px' }}
        >
          <span className="text-black text-[15px] font-semibold tracking-tight ml-1">Productos más vendidos</span>
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner"
            style={{ backgroundColor: '#000' }}
          >
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
              <path d="M5 8V2M2 5l3-3 3 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>

    </div>
  );
};

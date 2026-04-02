'use client';

import { useEffect, useState, useRef } from 'react';
import { alertsService, type SystemAlert } from '@/services/alertsService';

/* ── Icono campana filled ──────────────────────────────────────────────────── */
const BellIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
    <path fillRule="evenodd" d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.479-.248A9.72 9.72 0 0 0 19.267 2.5Z" />
    <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clipRule="evenodd" />
  </svg>
);

const STATIC_ALERTS: Pick<SystemAlert, 'id' | 'title' | 'body' | 'type'>[] = [];
const INTERVAL_MS = 4000;

export const AlertsCarousel = () => {
  const [alerts, setAlerts] = useState<Pick<SystemAlert, 'id' | 'title' | 'body' | 'type'>[]>(STATIC_ALERTS);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const currentRef = useRef(0);
  const alertsRef  = useRef(alerts);

  useEffect(() => {
    alertsService.getActive()
      .then((data) => {
        if (data.length > 0) {
          setAlerts(data);
          alertsRef.current = data;
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  useEffect(() => { currentRef.current = current; }, [current]);

  useEffect(() => {
    const advance = () => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((c) => {
          const next = (c + 1) % alertsRef.current.length;
          currentRef.current = next;
          return next;
        });
        setVisible(true);
      }, 350);
    };

    const timer = setInterval(advance, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const goNext = () => {
    setVisible(false);
    setTimeout(() => {
      setCurrent((c) => (c + 1) % alerts.length);
      setVisible(true);
    }, 350);
  };

  const goPrev = () => {
    setVisible(false);
    setTimeout(() => {
      setCurrent((c) => (c - 1 + alerts.length) % alerts.length);
      setVisible(true);
    }, 350);
  };

  const alert = alerts[current] ?? alerts[0];
  if (!alert) return (
    <div className="relative mt-auto flex items-center gap-2 px-2 py-2 rounded-[18px] bg-white/15 border border-white/10 min-h-[40px]" />
  );

  return (
    <div className="relative mt-auto flex items-center gap-3 px-4 py-3 rounded-[18px] bg-white/15 border border-white/10">

      {/* Campana filled */}
      <div
        className="text-white"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 350ms ease' }}
      >
        {BellIcon}
      </div>

      {/* Mensaje */}
      <p
        className="text-[12px] font-bold text-white flex-1 leading-tight tracking-tight"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 350ms ease' }}
      >
        {alert.body}
      </p>

      {/* Controles: Flecha Atrás | Flecha Adelante (Sin dots) */}
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={goPrev}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/50 hover:text-white transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={goNext}
          className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center text-white hover:bg-white transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

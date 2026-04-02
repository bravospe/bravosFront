'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

/* ───────── PRELOADER ───────── */
function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) { clearInterval(t); setTimeout(onDone, 400); return 100; }
      return p + 2;
    }), 30);
    return () => clearInterval(t);
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#060b14] transition-opacity duration-500 ${progress >= 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative mb-8 animate-pulse">
        <Image src="/logo_bravos.png" alt="Bravos" width={120} height={120} priority />
      </div>
      <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-emerald-400 text-xs tracking-[0.3em] uppercase">Cargando experiencia</p>
    </div>
  );
}

/* ───────── COUNTER ANIMATION ───────── */
function Counter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1500;
        const step = (ts: number) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          setCount(Math.floor(p * end));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ───────── SCROLL REVEAL WRAPPER ───────── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ───────── HERO SLIDER ───────── */
const heroSlides = [
  {
    badge: 'Plataforma #1 para PYMEs en Perú',
    title: <>Tu negocio, <br /><span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">sin complicaciones</span></>,
    desc: 'Punto de venta, facturación SUNAT, tienda virtual, inventario y WhatsApp — todo integrado en una plataforma diseñada para negocios peruanos.',
    cta: 'Empezar gratis — 14 días',
    ctaHref: '/auth/register',
    secondaryCta: 'Ver cómo funciona',
    secondaryHref: '#como-funciona',
    bg: 'from-emerald-600/20 via-transparent to-cyan-600/15',
    glow1: 'bg-emerald-500/15',
    glow2: 'bg-cyan-500/10',
  },
  {
    badge: 'Facturación Electrónica',
    title: <>Emite comprobantes<br /><span className="bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">en un solo click</span></>,
    desc: 'Boletas, facturas, notas de crédito y guías de remisión 100% integradas con SUNAT. Aprobación automática y envío por WhatsApp al instante.',
    cta: 'Conocer facturación',
    ctaHref: '#soluciones',
    secondaryCta: 'Ver precios',
    secondaryHref: '#precios',
    bg: 'from-amber-600/15 via-transparent to-orange-600/10',
    glow1: 'bg-amber-500/15',
    glow2: 'bg-orange-500/10',
  },
  {
    badge: 'Punto de Venta Inteligente',
    title: <>Cobra más rápido,<br /><span className="bg-gradient-to-r from-violet-400 via-purple-300 to-fuchsia-400 bg-clip-text text-transparent">vende más</span></>,
    desc: 'POS táctil optimizado para velocidad. Acepta efectivo, tarjeta, Yape y Plin. Impresión de tickets, control de caja y reportes en tiempo real.',
    cta: 'Probar POS gratis',
    ctaHref: '/auth/register',
    secondaryCta: 'Ver demo',
    secondaryHref: '#como-funciona',
    bg: 'from-violet-600/15 via-transparent to-fuchsia-600/10',
    glow1: 'bg-violet-500/15',
    glow2: 'bg-fuchsia-500/10',
  },
  {
    badge: 'Tu Tienda Online',
    title: <>Vende 24/7<br /><span className="bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent">a todo el Perú</span></>,
    desc: 'Tu e-commerce propio con catálogo profesional, carrito, checkout y pagos con Mercado Pago, Culqi, Yape y Plin. Listo en minutos.',
    cta: 'Crear mi tienda',
    ctaHref: '/auth/register',
    secondaryCta: 'Ver integraciones',
    secondaryHref: '#integraciones',
    bg: 'from-sky-600/15 via-transparent to-indigo-600/10',
    glow1: 'bg-sky-500/15',
    glow2: 'bg-indigo-500/10',
  },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = heroSlides.length;

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection('next');
      setCurrent(c => (c + 1) % total);
    }, 6000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const goTo = (idx: number) => {
    setDirection(idx > current ? 'next' : 'prev');
    setCurrent(idx);
    resetTimer();
  };
  const goNext = () => { setDirection('next'); setCurrent(c => (c + 1) % total); resetTimer(); };
  const goPrev = () => { setDirection('prev'); setCurrent(c => (c - 1 + total) % total); resetTimer(); };

  const slide = heroSlides[current];

  return (
    <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden min-h-[90vh] flex items-center">
      {/* Animated BG per slide */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-1000">
        <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-all duration-1000`} />
        <div className={`absolute top-20 left-1/4 w-[500px] h-[500px] ${slide.glow1} rounded-full blur-[120px] transition-all duration-1000`} />
        <div className={`absolute bottom-10 right-1/4 w-[400px] h-[400px] ${slide.glow2} rounded-full blur-[100px] transition-all duration-1000`} />
      </div>

      <div className="max-w-7xl mx-auto px-5 relative z-10 w-full">
        <div className="max-w-4xl mx-auto text-center">
          {/* Slide content with fade transition */}
          <div key={current} className="animate-[fadeSlideUp_0.6s_ease-out]">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium tracking-wide uppercase">{slide.badge}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-6">
              {slide.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {slide.desc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={slide.ctaHref} className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5">
                {slide.cta}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </a>
              <a href={slide.secondaryHref} className="inline-flex items-center gap-2 text-gray-400 hover:text-white px-6 py-4 rounded-full border border-white/10 hover:border-white/20 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                {slide.secondaryCta}
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">Sin tarjeta de crédito · Cancela cuando quieras</p>
          </div>
        </div>

        {/* Navigation arrows */}
        <button onClick={goPrev} className="absolute left-2 lg:left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center group">
          <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={goNext} className="absolute right-2 lg:right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center group">
          <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        {/* Dots + progress */}
        <div className="flex items-center justify-center gap-3 mt-12">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className="relative group p-1">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-emerald-400 scale-125' : 'bg-white/20 hover:bg-white/40'}`} />
              {i === current && (
                <svg className="absolute -inset-1 w-[18px] h-[18px]" viewBox="0 0 18 18">
                  <circle cx="9" cy="9" r="8" fill="none" stroke="rgb(52,211,153)" strokeWidth="1.5" strokeDasharray="50.27" strokeLinecap="round"
                    className="origin-center -rotate-90"
                    style={{ animation: 'progressRing 6s linear' }}
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressRing {
          from { stroke-dashoffset: 50.27; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </section>
  );
}

/* ───────── MAIN PAGE ───────── */
export default function Demo1Page() {
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  if (!loaded) return <Preloader onDone={() => setLoaded(true)} />;

  const nav = [
    { label: 'Soluciones', href: '#soluciones' },
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Integraciones', href: '#integraciones' },
    { label: 'Precios', href: '#precios' },
    { label: 'FAQ', href: '#faq' },
  ];

  const features = [
    { icon: '🏪', title: 'Punto de Venta', desc: 'Cobra en segundos con un POS intuitivo. Soporte para efectivo, tarjeta, Yape y Plin en una sola interfaz.' },
    { icon: '🧾', title: 'Facturación SUNAT', desc: 'Emite boletas, facturas y notas de crédito/débito integradas al 100% con SUNAT. Aprobación automática.' },
    { icon: '🛒', title: 'Tienda Virtual', desc: 'Tu propio e-commerce con catálogo, carrito, checkout y pagos online. Listo para vender desde el primer día.' },
    { icon: '📦', title: 'Inventario Inteligente', desc: 'Control multi-almacén con kardex en tiempo real, alertas de stock bajo y trazabilidad completa.' },
    { icon: '📊', title: 'Reportes y Analítica', desc: 'Dashboards con ventas por hora, productos top, márgenes y tendencias. Decisiones basadas en datos.' },
    { icon: '💬', title: 'WhatsApp Business', desc: 'Notificaciones automáticas de venta, alertas de inventario y atención al cliente con IA integrada.' },
    { icon: '🚚', title: 'Gestión de Envíos', desc: 'Integración con Olva, Shalom, Chazki y 99Minutos. Guías de remisión automáticas y tracking en vivo.' },
    { icon: '👥', title: 'CRM de Clientes', desc: 'Base de datos de clientes con historial de compras, segmentación y comunicación directa por WhatsApp.' },
  ];

  const steps = [
    { num: '01', title: 'Regístrate gratis', desc: 'Crea tu cuenta en 30 segundos. Sin tarjeta de crédito, sin compromisos. 14 días de prueba completa.', color: 'from-emerald-500 to-teal-500' },
    { num: '02', title: 'Configura tu negocio', desc: 'Sube tu catálogo de productos, conecta tu RUC con SUNAT y personaliza tu tienda virtual en minutos.', color: 'from-teal-500 to-cyan-500' },
    { num: '03', title: 'Empieza a vender', desc: 'Cobra desde tu POS o tienda online, emite comprobantes electrónicos y controla todo desde un solo panel.', color: 'from-cyan-500 to-blue-500' },
    { num: '04', title: 'Escala sin límites', desc: 'Agrega almacenes, sucursales y usuarios. Bravos crece contigo sin importar el tamaño de tu operación.', color: 'from-blue-500 to-violet-500' },
  ];

  const integrations = [
    { name: 'SUNAT', icon: '🏛️' },
    { name: 'Yape', icon: '💜' },
    { name: 'Plin', icon: '💚' },
    { name: 'Mercado Pago', icon: '🤝' },
    { name: 'Culqi', icon: '💳' },
    { name: 'Olva Courier', icon: '📬' },
    { name: 'Chazki', icon: '🏍️' },
    { name: 'WhatsApp', icon: '💬' },
    { name: 'Google AI', icon: '🤖' },
    { name: '99 Minutos', icon: '⚡' },
    { name: 'Shalom', icon: '📦' },
    { name: 'AWS S3', icon: '☁️' },
  ];

  const testimonials = [
    { name: 'María Torres', role: 'Bodega La Esquina, Lima', text: 'Antes usaba un cuaderno para todo. Con Bravos emito boletas en un click y mis clientes confían más en mi negocio.', avatar: 'MT' },
    { name: 'Carlos Mendoza', role: 'TechStore, Arequipa', text: 'El POS es rapidísimo y la integración con SUNAT funciona perfecta. Ya no pierdo tiempo con trámites manuales.', avatar: 'CM' },
    { name: 'Ana Quispe', role: 'Florería Primavera, Cusco', text: 'La tienda virtual me abrió un mercado nuevo. Ahora vendo a todo el Perú y gestiono los envíos desde Bravos.', avatar: 'AQ' },
  ];

  const plans = [
    { name: 'Básico', price: 49, features: ['1 usuario', '500 comprobantes/mes', 'POS básico', 'Facturación SUNAT', 'Soporte por email'], cta: 'Empezar gratis', popular: false },
    { name: 'Profesional', price: 99, features: ['5 usuarios', 'Comprobantes ilimitados', 'POS avanzado', 'Tienda virtual', 'Inventario multi-almacén', 'WhatsApp alerts', 'Soporte prioritario'], cta: 'Prueba 14 días gratis', popular: true },
    { name: 'Empresarial', price: 199, features: ['Usuarios ilimitados', 'Comprobantes ilimitados', 'Todo de Profesional', 'API access', 'Tienda white-label', 'Envíos integrados', 'Manager dedicado'], cta: 'Contactar ventas', popular: false },
  ];

  const faqs = [
    { q: '¿Qué necesito para empezar?', a: 'Solo un navegador web. Bravos funciona 100% en la nube, no necesitas instalar nada. Regístrate, configura tu RUC y empieza a vender.' },
    { q: '¿La facturación electrónica está homologada con SUNAT?', a: 'Sí, Bravos está 100% integrado con SUNAT. Emitimos boletas, facturas, notas de crédito/débito y guías de remisión electrónicas con validación en tiempo real.' },
    { q: '¿Puedo usar Bravos desde mi celular?', a: 'Absolutamente. Bravos es responsive y funciona perfecto en cualquier dispositivo. Tu POS, tienda y reportes siempre al alcance de tu mano.' },
    { q: '¿Qué métodos de pago acepta la tienda virtual?', a: 'Mercado Pago, Culqi, Yape y Plin. También puedes configurar pagos por transferencia bancaria y contra entrega.' },
    { q: '¿Qué pasa al terminar la prueba gratuita?', a: 'Eliges un plan que se adapte a tu negocio. No se cobra nada automáticamente. Si no eliges plan, tu cuenta pasa a modo lectura sin perder datos.' },
    { q: '¿Puedo migrar mis datos desde otro sistema?', a: 'Sí, ofrecemos importación masiva desde Excel para productos, clientes e inventario. Nuestro equipo te ayuda en el proceso sin costo adicional.' },
  ];

  const sectors = [
    { icon: '🏪', name: 'Bodegas y minimarkets' },
    { icon: '👗', name: 'Tiendas de ropa' },
    { icon: '🍕', name: 'Restaurantes y cafés' },
    { icon: '💊', name: 'Farmacias' },
    { icon: '🔧', name: 'Ferreterías' },
    { icon: '💻', name: 'Tiendas de tecnología' },
    { icon: '🌸', name: 'Florerías' },
    { icon: '📚', name: 'Librerías y papelerías' },
  ];

  return (
    <div className="min-h-screen bg-[#060b14] text-gray-100 overflow-x-hidden">
      {/* ───────── NAV ───────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#060b14]/90 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <Image src="/logo_bravos.png" alt="Bravos" width={40} height={40} />
            <span className="text-xl font-bold tracking-tight">bravos</span>
          </a>
          <div className="hidden lg:flex items-center gap-8">
            {nav.map(n => <a key={n.href} href={n.href} className="text-sm text-gray-400 hover:text-white transition-colors">{n.label}</a>)}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <a href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">Iniciar sesión</a>
            <a href="/auth/register" className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-emerald-500/25">Prueba gratis</a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
          </button>
        </div>
        {menuOpen && (
          <div className="lg:hidden bg-[#0a1020] border-t border-white/5 px-5 py-4 space-y-3 animate-in">
            {nav.map(n => <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">{n.label}</a>)}
            <div className="pt-3 flex flex-col gap-2">
              <a href="/auth/login" className="text-center text-gray-300 py-2">Iniciar sesión</a>
              <a href="/auth/register" className="text-center bg-emerald-500 text-white font-semibold py-3 rounded-full">Prueba gratis</a>
            </div>
          </div>
        )}
      </nav>

      {/* ───────── HERO SLIDER ───────── */}
      <HeroSlider />

      {/* ───────── STATS ───────── */}
      <section className="py-16 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { end: 5000, suffix: '+', label: 'Comprobantes emitidos' },
            { end: 100, suffix: '%', label: 'Integrado con SUNAT' },
            { end: 99, suffix: '.9%', label: 'Uptime garantizado' },
            { end: 24, suffix: '/7', label: 'Soporte al cliente' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div>
                <p className="text-3xl lg:text-4xl font-bold text-white"><Counter end={s.end} suffix={s.suffix} /></p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── SOLUTIONS / FEATURES ───────── */}
      <section id="soluciones" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-5">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Soluciones</span>
              <h2 className="text-3xl lg:text-5xl font-bold mt-3 mb-4">Todo lo que tu negocio necesita</h2>
              <p className="text-gray-400">Una sola plataforma que reemplaza 5 herramientas. Ahorra tiempo, reduce errores y enfócate en vender.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group bg-[#0d1219] border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 h-full">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-400 transition-colors">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section id="como-funciona" className="py-24 lg:py-32 bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent">
        <div className="max-w-5xl mx-auto px-5">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Cómo funciona</span>
              <h2 className="text-3xl lg:text-5xl font-bold mt-3 mb-4">De cero a vendiendo en minutos</h2>
              <p className="text-gray-400">Empezar con Bravos es tan simple como crear una cuenta de correo.</p>
            </div>
          </Reveal>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="relative flex items-start gap-6 bg-[#0d1219] border border-white/5 rounded-2xl p-6 lg:p-8 group hover:border-emerald-500/20 transition-all">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {s.num}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{s.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── SECTORS ───────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Sectores</span>
              <h2 className="text-3xl lg:text-5xl font-bold mt-3 mb-4">Diseñado para tu tipo de negocio</h2>
              <p className="text-gray-400">Más de 500 negocios peruanos ya confían en Bravos para gestionar sus operaciones diarias.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {sectors.map((s, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="text-center bg-[#0d1219] border border-white/5 rounded-2xl p-6 hover:border-emerald-500/20 transition-all hover:-translate-y-1">
                  <div className="text-4xl mb-3">{s.icon}</div>
                  <p className="text-sm font-medium">{s.name}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── INTEGRATIONS ───────── */}
      <section id="integraciones" className="py-24 lg:py-32 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Integraciones</span>
              <h2 className="text-3xl lg:text-5xl font-bold mt-3 mb-4">Conectado con todo tu ecosistema</h2>
              <p className="text-gray-400">Integraciones nativas con los servicios que ya usas. Sin APIs complicadas, simplemente funciona.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {integrations.map((ig, i) => (
              <Reveal key={i} delay={i * 50}>
                <div className="flex flex-col items-center gap-2 bg-[#0d1219] border border-white/5 rounded-xl py-5 px-3 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{ig.icon}</span>
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors text-center">{ig.name}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── TESTIMONIALS ───────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Testimonios</span>
              <h2 className="text-3xl lg:text-5xl font-bold mt-3 mb-4">Lo que dicen nuestros clientes</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="bg-[#0d1219] border border-white/5 rounded-2xl p-6 hover:border-emerald-500/20 transition-all h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => <span key={j} className="text-amber-400 text-sm">★</span>)}
                  </div>
                  <p className="text-gray-300 leading-relaxed flex-1 mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">{t.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── PRICING ───────── */}
      <section id="precios" className="py-24 lg:py-32 bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Precios</span>
              <h2 className="text-3xl lg:text-5xl font-bold mt-3 mb-4">Planes que crecen contigo</h2>
              <p className="text-gray-400 mb-8">Todos los planes incluyen 14 días de prueba gratuita. Sin sorpresas.</p>
              <div className="inline-flex items-center bg-[#0d1219] border border-white/10 rounded-full p-1">
                <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Mensual</button>
                <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${annual ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                  Anual <span className="text-emerald-300 text-xs ml-1">-20%</span>
                </button>
              </div>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((p, i) => {
              const price = annual ? Math.round(p.price * 0.8) : p.price;
              return (
                <Reveal key={i} delay={i * 120}>
                  <div className={`relative bg-[#0d1219] border rounded-2xl p-7 ${p.popular ? 'border-emerald-500/50 shadow-xl shadow-emerald-500/10 scale-[1.02]' : 'border-white/5'}`}>
                    {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">Más popular</div>}
                    <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold">S/{price}</span>
                      <span className="text-gray-500 text-sm">/mes + IGV</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {p.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                          <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a href="/auth/register" className={`block text-center py-3 rounded-full font-semibold text-sm transition-all ${p.popular ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg hover:shadow-emerald-500/25' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                      {p.cta}
                    </a>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="py-24 lg:py-32">
        <div className="max-w-3xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-12">
              <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">FAQ</span>
              <h2 className="text-3xl lg:text-5xl font-bold mt-3">Preguntas frecuentes</h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="bg-[#0d1219] border border-white/5 rounded-xl overflow-hidden">
                  <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                    <span className="font-medium pr-4">{f.q}</span>
                    <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="px-6 pb-5 text-gray-400 text-sm leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FINAL CTA ───────── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <Reveal>
            <div className="relative bg-gradient-to-br from-emerald-500/10 via-[#0d1219] to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-10 lg:p-16 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px]" />
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-5xl font-bold mb-4">¿Listo para transformar tu negocio?</h2>
                <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">Únete a los cientos de negocios peruanos que ya gestionan todo con Bravos. Empieza hoy, es gratis.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a href="/auth/register" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/25">
                    Crear cuenta gratuita
                  </a>
                  <a href="https://wa.me/51999999999" className="text-gray-400 hover:text-white px-6 py-4 rounded-full border border-white/10 hover:border-white/20 transition-all flex items-center gap-2">
                    💬 Hablar con ventas
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo_bravos.png" alt="Bravos" width={32} height={32} />
                <span className="text-lg font-bold">bravos</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Plataforma integral de gestión empresarial para PYMEs peruanas. Vende, factura y crece con tecnología.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#soluciones" className="hover:text-white transition-colors">Punto de Venta</a></li>
                <li><a href="#soluciones" className="hover:text-white transition-colors">Facturación SUNAT</a></li>
                <li><a href="#soluciones" className="hover:text-white transition-colors">Tienda Virtual</a></li>
                <li><a href="#soluciones" className="hover:text-white transition-colors">Inventario</a></li>
                <li><a href="#precios" className="hover:text-white transition-colors">Precios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trabaja con nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">Términos de servicio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/5 gap-4">
            <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} Bravos. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              {['Facebook', 'Instagram', 'TikTok', 'LinkedIn'].map(s => (
                <a key={s} href="#" className="text-gray-600 hover:text-white text-xs transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

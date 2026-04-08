'use client';

import { useState, useRef, useEffect, Fragment, useMemo } from 'react';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  UserIcon,
  PrinterIcon,
  CreditCardIcon,
  BanknotesIcon,
  XMarkIcon,
  ShoppingCartIcon,
  TagIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArrowsRightLeftIcon,
  EllipsisHorizontalCircleIcon,
  ChevronLeftIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Button, Input, Modal, Badge } from '@/components/ui';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { usePOSStore } from '@/stores/posStore';
import { useProductStore } from '@/stores/productStore';
import { useClientStore } from '@/stores/clientStore';
import { useCategoryStore } from '@/stores/categoryStore';
import toast from 'react-hot-toast';
import type { Product, Client } from '@/types';
import { YapeIcon, PlinIcon } from '@/components/ui/WalletIcons';
import { printReceiptFromSale } from '@/lib/printReceiptFromSale';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Importar modales reales del POS
import AperturaCajaModal from '@/components/pos/AperturaCajaModal';
import GestionCajaModal from '@/components/pos/GestionCajaModal';
import { ClientSelectModal } from '@/components/pos/ClientSelectModal';

// El scanner usa getUserMedia y @zxing/library — solo cliente, nunca SSR
const BarcodeScannerModal = dynamic(
  () => import('@/components/pos/BarcodeScannerModal'),
  { ssr: false }
);

const POSPage = () => {
  const {
    cart: items,
    addToCart,
    updateQuantity,
    removeFromCart: removeItem,
    applyDiscount,
    setItemDiscountType,
    setGlobalDiscount,
    globalDiscountType,
    globalDiscountValue,
    getGlobalDiscountAmount,
    clearCart,
    getTotal,
    getSubtotal,
    getTaxAmount,
    selectedClient,
    setClient,
    documentType,
    setDocumentType,
    paymentMethod,
    setPaymentMethod,
    cashReceived,
    setCashReceived,
    searchResults,
    frequentProducts,
    isSearching,
    searchProducts,
    fetchFrequentProducts,
    processSale,
    isProcessing,
    lastSale,
    currentSession,
    isSessionLoading,
    fetchCurrentSession,
    cashRegisters,
    fetchCashRegisters,
    fetchRegistersStatus,
  } = usePOSStore();

  const { products, fetchProducts, isLoading: productsLoading } = useProductStore();
  const { clients, fetchClients } = useClientStore();
  const { categories, fetchCategories } = useCategoryStore();

  const total = getTotal();
  const subtotal = getSubtotal();
  const igv = getTaxAmount();
  const globalDiscount = getGlobalDiscountAmount();
  const change = cashReceived > 0 ? cashReceived - total : 0;

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGlobalDiscountModal, setShowGlobalDiscountModal] = useState(false);
  const [itemDiscountModal, setItemDiscountModal] = useState<{ isOpen: boolean, productId: string | null }>({ isOpen: false, productId: null });
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientIndex, setSelectedClientIndex] = useState(-1);
  const [localCashReceived, setLocalCashReceived] = useState('');
  const [showGestionCaja, setShowGestionCaja] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name?.toLowerCase().includes(clientSearch.toLowerCase()) || 
      c.trade_name?.toLowerCase().includes(clientSearch.toLowerCase()) || 
      c.document_number?.includes(clientSearch)
    );
  }, [clients, clientSearch]);

  useEffect(() => {
    if (showClientModal) {
      const element = document.getElementById(`client-item-${selectedClientIndex}`);
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedClientIndex, showClientModal]);
  const [emailToSend, setEmailToSend] = useState('');
  const [phoneToSend, setPhoneToSend] = useState('');
  
  const searchRef = useRef<HTMLInputElement>(null);
  const clientSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showClientModal) {
      setClientSearch('');
      setSelectedClientIndex(-1);
      setTimeout(() => {
        clientSearchRef.current?.focus();
      }, 100);
    }
  }, [showClientModal]);

  useEffect(() => {
    fetchProducts({ per_page: 100 });
    fetchCategories();
    fetchFrequentProducts();
    fetchCurrentSession();
    fetchCashRegisters();
    fetchRegistersStatus();
    fetchClients();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) searchProducts(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBarcodeDetected = async (code: string) => {
    // 1. Intentar buscar en productos locales (ya cargados)
    const match = products.find(
      (p: any) => p.barcode === code || p.sku === code || p.code === code
    );

    if (match) {
      handleAddProduct(match as any);
      return;
    }

    // 2. Si no está local, buscar en el servidor usando la acción existente
    toast.loading(`Buscando producto: ${code}...`, { id: 'barcode-search' });
    
    try {
      // searchProducts actualiza searchResults en el store
      const results = await searchProducts(code);
      
      // Intentar encontrar coincidencia exacta en los nuevos resultados
      const remoteMatch = results.find(
        (p: any) => p.barcode === code || p.sku === code || p.code === code
      );

      if (remoteMatch) {
        handleAddProduct(remoteMatch as any);
        toast.success(`${remoteMatch.name} encontrado`, { id: 'barcode-search' });
      } else if (results.length === 1) {
        // Si solo hay uno y no es exacto, pero es el único resultado, lo agregamos
        handleAddProduct(results[0] as any);
        toast.success(`${results[0].name} encontrado`, { id: 'barcode-search' });
      } else if (results.length > 1) {
        // Varios resultados → mostrar en el buscador manual
        setSearch(code);
        toast.dismiss('barcode-search');
        toast(`Múltiples coincidencias para "${code}"`, { icon: '🔍' });
      } else {
        toast.error(`Producto con código "${code}" no encontrado`, { id: 'barcode-search' });
      }
    } catch (error) {
      console.error('Error searching barcode:', error);
      toast.error('Error al buscar el código de barras', { id: 'barcode-search' });
    }
  };

  const displayProducts = useMemo(() => {
    const base = search.trim() ? searchResults : products;
    return base.filter(p => 
      selectedCategory === 'Todos' || 
      p.category?.name === selectedCategory || 
      (p as any).category_id === categories.find(c => c.name === selectedCategory)?.id
    );
  }, [search, searchResults, products, selectedCategory, categories]);

  const categoryNames = useMemo(() => ['Todos', ...categories.map(c => c.name)], [categories]);

  const allowedPaymentMethods = useMemo(() => {
    const registerMethods = currentSession?.cash_register?.payment_methods;
    const allMethods = [
      { key: 'cash', icon: BanknotesIcon, label: 'Efectivo' },
      { key: 'card', icon: CreditCardIcon, label: 'Tarjeta' },
      { key: 'yape', icon: YapeIcon, label: 'Yape' },
      { key: 'plin', icon: PlinIcon, label: 'Plin' },
      { key: 'transfer', icon: ArrowsRightLeftIcon, label: 'Transf.' },
      { key: 'other', icon: EllipsisHorizontalCircleIcon, label: 'Otro' },
    ];
    if (!registerMethods || registerMethods.length === 0) return allMethods;
    return allMethods.filter(m => {
      if (m.key === 'yape' || m.key === 'plin') return registerMethods.includes('yape_plin') || registerMethods.includes(m.key);
      return registerMethods.includes(m.key);
    });
  }, [currentSession]);

  const handleAddProduct = (product: Product) => {
    const stock = product.stock ?? Infinity;
    const inCart = items.find(i => i.product.id === product.id)?.quantity ?? 0;
    if (inCart >= stock) {
      toast.error(`Stock máximo alcanzado (${stock})`, { duration: 1500 });
      return;
    }
    addToCart(product, 1);
    toast.success(`${product.name} agregado`, { duration: 800 });
  };

  const handleSelectClient = (client: Client) => {
    setClient(client);
    setEmailToSend(client.email || '');
    setPhoneToSend(client.phone || '');
    setShowClientModal(false);
  };

  const handleProcessSale = async () => {
    if (documentType === '01' && !selectedClient) {
      toast.error('Factura requiere seleccionar un cliente');
      return;
    }
    if (paymentMethod === 'cash' && cashReceived < total) {
      toast.error('Monto recibido insuficiente');
      return;
    }
    try {
      await processSale();
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      setLocalCashReceived('');
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar venta');
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    clearCart();
    setEmailToSend('');
    setPhoneToSend('');
  };

  const handleCashReceivedChange = (value: string) => {
    setLocalCashReceived(value);
    setCashReceived(parseFloat(value) || 0);
  };

  if (isSessionLoading) return <div className="h-screen flex items-center justify-center text-sm font-bold text-gray-500 animate-pulse font-sora">Cargando POS...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-transparent font-sora relative">
      
      {/* ─── MODAL APERTURA CAJA (SI NO HAY SESION) ─── */}
      <AperturaCajaModal open={!currentSession && !isSessionLoading} />

      {/* ─── MODAL GESTION CAJA (CERRAR / CAMBIAR) ─── */}
      <GestionCajaModal open={showGestionCaja} onClose={() => setShowGestionCaja(false)} />

      {/* ─── AREA DE PRODUCTOS ─── */}
      <div className="flex-1 flex flex-col px-4 pt-4 pb-[90px] md:px-6 md:pt-6 md:pb-6 min-w-0">
        <div className="flex flex-col md:flex-row gap-3 mb-5 items-start md:items-center">
          <div className="relative flex-1 w-full flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className={clsx("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", searchFocused ? "text-emerald-500" : "text-gray-400")} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar productos (F2)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm focus:ring-2 focus:ring-emerald-500 text-sm dark:text-white outline-none"
              />
            </div>
            {/* Botón escáner — solo móvil */}
            <button
              onClick={() => setShowScanner(true)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-sm text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-white/10 transition-colors flex-shrink-0"
              title="Escanear código de barras"
            >
              <CameraIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
          {categoryNames.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={clsx("px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border", 
                selectedCategory === cat ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/5 hover:border-emerald-500/50")}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto pr-2">
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {[...Array(12)].map((_, i) => <div key={i} className="aspect-[3/4] bg-gray-200 dark:bg-[#111827] rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-6">
              {displayProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="bg-white dark:bg-[#111827] p-3 rounded-2xl text-left hover:border-emerald-500 transition-all shadow-sm flex flex-col h-full group border border-gray-100 dark:border-white/5"
                >
                  <div className="aspect-square rounded-xl mb-3 overflow-hidden bg-gray-50 dark:bg-background relative border border-gray-50 dark:border-white/5">
                    <ImageWithFallback src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <Badge variant={(product.stock || 0) > 5 ? 'success' : 'warning'} className="absolute bottom-2 right-2 shadow-sm text-[10px] py-0.5 px-1.5">{product.stock || 0}</Badge>
                  </div>
                  <p className="font-semibold text-[13px] line-clamp-2 mb-2 flex-1 leading-tight dark:text-gray-200 text-gray-800">{product.name}</p>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">S/ {Number(product.sale_price).toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── PANEL CARRITO (DERECHA en desktop / Overlay en mobile) ─── */}
      <div className={clsx(
        "flex-col gap-4 p-4 flex-shrink-0 overflow-hidden",
        // Mobile: hidden por defecto, overlay cuando showMobileCart
        showMobileCart
          ? "flex fixed inset-0 z-[48] bg-[#F1F3F6] dark:bg-[#0D1117]"
          : "hidden",
        // Desktop: siempre visible como sidebar
        "md:static md:inset-auto md:flex md:w-[340px] xl:w-[380px] md:h-full md:z-10 md:bg-transparent"
      )}>
        {/* ── Header mobile (solo visible en overlay mobile) ── */}
        <div className="flex items-center gap-3 mb-1 pb-3 border-b border-gray-200 dark:border-white/10 md:hidden">
          <button
            onClick={() => setShowMobileCart(false)}
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/10 flex items-center justify-center flex-shrink-0"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="flex-1 text-base font-bold text-gray-900 dark:text-white">Carrito</h2>
          {items.length > 0 && (
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-background px-2 py-1 rounded-lg">
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </span>
          )}
        </div>
        
        {/* CAJA 1: CARRITO (HEADER + ITEMS) */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl rounded-[var(--radius-xl)] overflow-hidden min-h-0">
          <div className="p-5 border-b border-gray-50 dark:border-white/5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCartIcon className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold dark:text-white">Carrito</h2>
              </div>
              <div className="flex gap-1 bg-gray-100 dark:bg-background p-1 rounded-lg">
                {[{ id: '00', label: 'NV' }, { id: '03', label: 'Bol' }, { id: '01', label: 'Fac' }].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setDocumentType(t.id as any)}
                    className={clsx("px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all", documentType === t.id ? "bg-emerald-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700")}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              </div>

              {/* Status Caja */}
              <button
                onClick={() => currentSession && setShowGestionCaja(true)}
                className={clsx(
                  "w-full flex items-center justify-between px-3 py-2 mb-4 rounded-xl border transition-all",
                  currentSession
                    ? "bg-gray-50 dark:bg-background border-gray-100 dark:border-white/5 hover:border-emerald-500/50 cursor-pointer"
                    : "bg-gray-50 dark:bg-background border-gray-100 dark:border-white/5 cursor-default"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={clsx("w-2 h-2 rounded-full animate-pulse", currentSession ? "bg-emerald-500" : "bg-red-500")} />
                  <p className="text-[10px] font-bold dark:text-white truncate uppercase tracking-wider">
                    {currentSession ? currentSession.cash_register?.name : "Caja Cerrada"}
                  </p>
                </div>
                {currentSession && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-gray-400">
                      {new Date(currentSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[9px] text-gray-300 dark:text-white/20">···</span>
                  </div>
                )}
              </button>

              <button 
              onClick={() => setShowClientModal(true)}            
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-background flex items-center gap-3 border border-gray-100 dark:border-white/5 hover:border-emerald-500 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 transition-colors">
                <UserIcon className="w-4 h-4 text-emerald-600 group-hover:text-white" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">Cliente</p>
                <p className="font-semibold text-sm truncate dark:text-white">{selectedClient?.name || 'Cliente General'}</p>
              </div>
              <XMarkIcon className="w-4 h-4 text-gray-300 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setClient(null); }} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-5 space-y-3 scrollbar-hide">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                <ShoppingCartIcon className="w-12 h-12 mb-3" />
                <p className="font-bold text-sm">Tu carrito está vacío</p>
                <p className="text-xs mt-1">Busca productos para agregar</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.product.id} className="flex gap-3 items-center group bg-white dark:bg-background p-2 rounded-xl border border-gray-50 dark:border-white/5">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 dark:bg-background flex-shrink-0">
                    <ImageWithFallback src={item.product.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate dark:text-white leading-tight mb-1">{item.product.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-emerald-500 font-bold text-xs">S/ {item.unitPrice.toFixed(2)}</p>
                      {item.discount > 0 && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded font-bold">-{item.discountType === 'percentage' ? `${item.discount}%` : `S/ ${item.discount}`}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center bg-gray-100 dark:bg-background rounded-lg p-0.5 border border-gray-200 dark:border-white/5">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded-md bg-white dark:bg-[#111827] text-gray-600 dark:text-white flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><MinusIcon className="w-3 h-3" /></button>
                      <span className="w-6 text-center font-semibold text-xs dark:text-white tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => {
                          const stock = item.product.stock ?? Infinity;
                          if (item.quantity >= stock) {
                            toast.error(`Stock máximo: ${stock}`, { duration: 1200 });
                            return;
                          }
                          updateQuantity(item.product.id, item.quantity + 1);
                        }}
                        disabled={item.quantity >= (item.product.stock ?? Infinity)}
                        className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
                      ><PlusIcon className="w-3 h-3" /></button>
                    </div>
                    <button onClick={() => setItemDiscountModal({ isOpen: true, productId: item.product.id })} className="text-[10px] font-medium text-gray-400 hover:text-emerald-500 underline">Descuento</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CAJA 2: TOTALES Y PAGO */}
        <div className="bg-[#22c55e] p-4 space-y-4 rounded-[var(--radius-xl)] shadow-xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 bg-[#111827] p-3 rounded-[18px] shadow-lg border border-white/5">
                <p className="text-[10px] font-bold text-[#22c55e] mb-1 uppercase tracking-wider">Subtotal</p>
                <p className="text-sm font-black text-white leading-none">
                  <span className="text-[10px] mr-0.5 text-[#22c55e]">S/</span>
                  {subtotal.toFixed(2)}
                </p>
              </div>
              <div className="flex-1 bg-[#111827] p-3 rounded-[18px] shadow-lg border border-white/5">
                <button 
                  onClick={() => setShowGlobalDiscountModal(true)} 
                  className="text-[10px] font-bold text-[#22c55e] mb-1 uppercase tracking-wider hover:underline flex items-center gap-1"
                >
                  <TagIcon className="w-2.5 h-2.5"/> Descuento
                </button>
                <p className="text-sm font-black text-white leading-none">
                  <span className="text-[10px] mr-0.5 text-red-500">-S/</span>
                  {globalDiscount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-[#111827] px-4 py-3 rounded-[22px] shadow-xl border border-white/10 flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[12px] font-black text-[#22c55e] uppercase tracking-widest">Total</p>
              </div>
              <div className="relative z-10 flex items-baseline gap-1">
                <span className="text-sm font-black text-[#22c55e]">S/</span>
                <span className="text-2xl font-black text-white tabular-nums tracking-tighter">
                  {total.toFixed(2)}
                </span>
              </div>
              <div className="absolute -right-2 -bottom-2 opacity-5">
                <ShoppingCartIcon className="w-12 h-12 text-white rotate-12" />
              </div>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            disabled={items.length === 0}
            onClick={() => { setShowMobileCart(false); setShowPaymentModal(true); }}
            className="h-12 text-sm font-black bg-black hover:bg-black/80 text-white border-none shadow-2xl rounded-xl transition-all active:scale-[0.98]"
          >
            COBRAR <span className="hidden md:inline">(F12)</span>
          </Button>
        </div>
      </div>

      {/* ─── BARRA FIJA INFERIOR (solo mobile) ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#111827] border-t border-gray-100 dark:border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3">

          {/* Izquierda: icono carrito + conteo + total */}
          <button
            onClick={() => setShowMobileCart(true)}
            className="flex-1 flex items-center gap-3 min-w-0 active:opacity-70 transition-opacity"
          >
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-background flex items-center justify-center">
                <ShoppingCartIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide leading-none mb-0.5">
                {items.length === 0 ? 'Carrito vacío' : `${items.length} producto${items.length !== 1 ? 's' : ''} · ver carrito`}
              </p>
              <p className="text-xl font-black text-gray-900 dark:text-white leading-none tabular-nums">
                S/ {total.toFixed(2)}
              </p>
            </div>
          </button>

          {/* Derecha: botón COBRAR */}
          <button
            disabled={items.length === 0}
            onClick={() => setShowPaymentModal(true)}
            className={clsx(
              "flex-shrink-0 px-7 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.97]",
              items.length > 0
                ? "bg-black dark:bg-[#85fd37] text-white dark:text-black shadow-lg"
                : "bg-gray-200 dark:bg-background text-gray-400 cursor-not-allowed"
            )}
          >
            COBRAR
          </button>
        </div>
      </div>

      {/* MODAL PAGO */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Finalizar Venta" size="md">
        <div className="space-y-5">
          <div className="text-center p-5 bg-emerald-50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-white/5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total a cobrar</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">S/ {total.toFixed(2)}</p>
          </div>
          
          <div>
            <p className="text-xs font-semibold mb-2 dark:text-white">Método de Pago</p>
            <div className="grid grid-cols-5 gap-2">
              {allowedPaymentMethods.map(m => {
                const isSelected = paymentMethod === m.key;
                const config: Record<string, { bg: string }> = {
                  cash:     { bg: 'bg-[#22c55e]' },
                  card:     { bg: 'bg-[#6366f1]' },
                  yape:     { bg: 'bg-[#7C3AED]' },
                  plin:     { bg: 'bg-[#00D1FF]' },
                  transfer: { bg: 'bg-[#3B82F6]' },
                  mixed:    { bg: 'bg-orange-500' },
                  other:    { bg: 'bg-gray-600' },
                };
                const style = config[m.key] || config.other;

                return (
                  <button 
                    key={m.key} 
                    onClick={() => setPaymentMethod(m.key as any)}
                    className={clsx(
                      "p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-200 group",
                      isSelected 
                        ? `${style.bg} border-transparent text-white shadow-lg` 
                        : `border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 bg-transparent hover:${style.bg} hover:border-transparent hover:text-white`
                    )}
                  >
                    <m.icon className={clsx("w-6 h-6 transition-colors duration-200", isSelected ? "text-white" : "group-hover:text-white")} />
                    <span className={clsx("text-[12.5px] font-bold transition-colors duration-200", isSelected ? "text-white" : "group-hover:text-white")}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-3 pt-2">
              <Input label="Efectivo recibido" type="number" value={localCashReceived} onChange={e => handleCashReceivedChange(e.target.value)} leftAddon="S/" autoFocus className="font-bold text-lg" />
              {cashReceived >= total && (
                <div className="p-3 bg-gray-50 dark:bg-background rounded-lg border border-gray-200 dark:border-white/5 flex justify-between items-center">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Vuelto a entregar</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">S/ {change.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}
          <Button fullWidth size="lg" onClick={handleProcessSale} loading={isProcessing} className="mt-2 h-12 text-sm font-bold">Confirmar Pago</Button>
        </div>
      </Modal>

      {/* MODAL EXITO */}
      <Modal isOpen={showSuccessModal} onClose={handleCloseSuccess} title="Venta Registrada" size="sm">
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold mb-1 dark:text-white">Transacción Exitosa</h3>
          <p className="text-xs text-gray-500 mb-5">El comprobante ha sido generado correctamente.</p>
          
          <div className="space-y-3">
            <Button fullWidth onClick={() => { if (lastSale) printReceiptFromSale(lastSale); }} className="flex items-center justify-center gap-2 h-12 text-sm">
              <PrinterIcon className="w-4 h-4"/> Imprimir Ticket
            </Button>
            <Button variant="outline" fullWidth onClick={handleCloseSuccess} className="h-12 text-sm">Nueva Venta</Button>

            <div className="pt-5 mt-5 border-t border-gray-100 dark:border-white/5 text-left space-y-2">
              <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase">Enviar comprobante</p>
              <div className="flex gap-2">
                <Input placeholder="correo@ejemplo.com" value={emailToSend} onChange={e => setEmailToSend(e.target.value)} className="flex-1 text-sm" />
                <Button variant="secondary" onClick={() => toast.success('Enviado')} className="px-3"><EnvelopeIcon className="w-4 h-4"/></Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Número de WhatsApp" value={phoneToSend} onChange={e => setPhoneToSend(e.target.value)} className="flex-1 text-sm" />
                <Button variant="secondary" onClick={() => toast.success('Enviado')} className="!bg-[#25D366] !text-white border-none hover:bg-green-600 px-3"><ChatBubbleLeftRightIcon className="w-4 h-4"/></Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODALES DE DESCUENTO */}
      <Modal isOpen={showGlobalDiscountModal} onClose={() => setShowGlobalDiscountModal(false)} title="Descuento Global" size="sm">
        <div className="space-y-4">
          <div className="flex gap-2 mb-2">
            <button onClick={() => setGlobalDiscount('percentage', globalDiscountValue)} className={clsx("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", globalDiscountType === 'percentage' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300")}>Porcentaje (%)</button>
            <button onClick={() => setGlobalDiscount('fixed', globalDiscountValue)} className={clsx("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", globalDiscountType === 'fixed' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300")}>Monto Fijo (S/)</button>
          </div>
          <Input type="number" value={globalDiscountValue || ''} onChange={e => setGlobalDiscount(globalDiscountType, parseFloat(e.target.value) || 0)} leftAddon={globalDiscountType === 'percentage' ? '%' : 'S/'} placeholder="0.00" />
          <Button fullWidth onClick={() => setShowGlobalDiscountModal(false)}>Aplicar</Button>
        </div>
      </Modal>

      <Modal isOpen={itemDiscountModal.isOpen} onClose={() => setItemDiscountModal({ isOpen: false, productId: null })} title="Descuento por Producto" size="sm">
        <div className="space-y-4">
          <div className="flex gap-2 mb-2">
            <button onClick={() => itemDiscountModal.productId && setItemDiscountType(itemDiscountModal.productId, 'percentage')} className={clsx("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", items.find(i => i.product.id === itemDiscountModal.productId)?.discountType === 'percentage' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300")}>Porcentaje (%)</button>
            <button onClick={() => itemDiscountModal.productId && setItemDiscountType(itemDiscountModal.productId, 'fixed')} className={clsx("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", items.find(i => i.product.id === itemDiscountModal.productId)?.discountType === 'fixed' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300")}>Monto Fijo (S/)</button>
          </div>
          <Input type="number" value={items.find(i => i.product.id === itemDiscountModal.productId)?.discount || ''} onChange={e => itemDiscountModal.productId && applyDiscount(itemDiscountModal.productId, parseFloat(e.target.value) || 0)} leftAddon={items.find(i => i.product.id === itemDiscountModal.productId)?.discountType === 'percentage' ? '%' : 'S/'} placeholder="0.00" />
          <Button fullWidth onClick={() => setItemDiscountModal({ isOpen: false, productId: null })}>Confirmar</Button>
        </div>
      </Modal>

      {/* CLIENT SEARCH MODAL */}
      <Modal 
        isOpen={showClientModal} 
        onClose={() => setShowClientModal(false)} 
        title="Seleccionar Cliente" 
        size="md"
        initialFocus={clientSearchRef}
      >
        <div className="space-y-4">
          <Input 
            ref={clientSearchRef}
            placeholder="Buscar por nombre, RUC o DNI..." 
            value={clientSearch} 
            onChange={e => {
              setClientSearch(e.target.value);
              setSelectedClientIndex(-1); // Reset index on search
            }} 
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5"/>}
            onKeyDown={(e) => {
              if (filteredClients.length === 0) return;

              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedClientIndex(prev => (prev < filteredClients.length - 1 ? prev + 1 : prev));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedClientIndex(prev => (prev > -1 ? prev - 1 : -1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedClientIndex >= 0 && filteredClients[selectedClientIndex]) {
                  handleSelectClient(filteredClients[selectedClientIndex]);
                }
              }
            }}
          />
          <div className="max-h-[300px] overflow-auto scrollbar-hide">
            {filteredClients.length === 0 ? (<div className="p-8 text-center text-gray-500 text-[12.5px]">No se encontraron clientes</div>) : (
              <div className="space-y-2 p-1">
                {filteredClients.map((c, index) => {
                  const isSelected = index === selectedClientIndex;
                  return (
                    <button 
                      key={c.id} 
                      onClick={() => handleSelectClient(c)} 
                      id={`client-item-${index}`}
                      className={clsx(
                        "w-full px-4 py-2.5 text-left transition-all flex justify-between items-center group rounded-[16px]",
                        isSelected 
                          ? "bg-[#85fd37] text-black shadow-lg shadow-[#85fd37]/20" 
                          : "bg-white/5 hover:bg-white/10 border border-white/5"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={clsx("font-bold text-[12.5px] truncate", isSelected ? "text-black" : "dark:text-white group-hover:text-emerald-500")}>
                          {c.name || c.trade_name}
                        </p>
                        <p className={clsx("text-[10.5px] mt-0.5 font-medium", isSelected ? "text-black/60" : "text-gray-500")}>
                          {c.document_type}: {c.document_number}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="bg-black/10 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter flex-shrink-0 ml-2">Enter</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Escáner de código de barras — solo móvil */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onDetected={handleBarcodeDetected}
      />
    </div>
  );
};

export default POSPage;

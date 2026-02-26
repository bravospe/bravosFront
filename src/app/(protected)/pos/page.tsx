'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  UserIcon,
  PrinterIcon,
  CreditCardIcon,
  BanknotesIcon,
  QrCodeIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  ChevronUpIcon,
  ChevronDownIcon,
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

const POSPage = () => {
  const {
    cart: items,
    addToCart,
    updateQuantity,
    removeFromCart: removeItem,
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
    error,
    currentSession,
    isSessionLoading,
    openSession,
    fetchCurrentSession,
    cashRegisters,
    fetchCashRegisters,
  } = usePOSStore();

  const { products, fetchProducts, isLoading: productsLoading } = useProductStore();
  const { clients, fetchClients, isLoading: clientsLoading } = useClientStore();
  const { categories, fetchCategories } = useCategoryStore();

  const total = getTotal();
  const subtotal = getSubtotal() / 1.18;
  const igv = getTaxAmount();
  const change = cashReceived > 0 ? cashReceived - total : 0;

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [localCashReceived, setLocalCashReceived] = useState('');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [selectedRegister, setSelectedRegister] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    fetchProducts({ per_page: 50 });
    fetchCategories();
    fetchFrequentProducts();
    fetchCurrentSession();
  }, [fetchProducts, fetchCategories, fetchFrequentProducts, fetchCurrentSession]);

  // Check session status
  useEffect(() => {
    if (!isSessionLoading && !currentSession) {
      fetchCashRegisters();
      setShowOpenSessionModal(true);
    } else {
      setShowOpenSessionModal(false);
    }
  }, [currentSession, isSessionLoading, fetchCashRegisters]);

  const handleOpenSession = async () => {
    if (!selectedRegister || !openingAmount) {
      toast.error('Selecciona una caja e ingresa el monto inicial');
      return;
    }
    try {
      await openSession(selectedRegister, parseFloat(openingAmount));
      setShowOpenSessionModal(false);
      toast.success('Sesión abierta exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al abrir sesión');
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) {
        searchProducts(search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchProducts]);

  // Focus search on mount — only on non-touch devices to avoid
  // popping up the on-screen keyboard on tablets
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
      searchRef.current?.focus();
    }
  }, []);

  // Keyboard shortcuts (separate effect so cart changes don't re-focus the input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack input fields
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'F12' && items.length > 0) {
        e.preventDefault();
        setShowPaymentModal(true);
      }
      if (e.key === 'Escape') {
        if (isInput && target === searchRef.current) {
          searchRef.current?.blur();
        }
        setShowPaymentModal(false);
        setShowClientModal(false);
        setMobileCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  // Load clients when modal opens or search changes
  useEffect(() => {
    if (showClientModal) {
      fetchClients({ search: clientSearch, per_page: 20 });
    }
  }, [showClientModal, clientSearch, fetchClients]);

  // Close mobile cart when items become empty
  useEffect(() => {
    if (items.length === 0) setMobileCartOpen(false);
  }, [items.length]);

  // Get display products
  const displayProducts = search.trim()
    ? searchResults
    : products.filter(p =>
      selectedCategory === 'Todos' ||
      p.category?.name === selectedCategory ||
      (p as any).category_id === categories.find(c => c.name === selectedCategory)?.id
    );

  const categoryNames = ['Todos', ...categories.map(c => c.name)];

  const handleAddProduct = (product: Product) => {
    addToCart(product, 1);
    toast.success(`${product.name} agregado`, { duration: 1500 });
  };

  const handleSelectClient = (client: Client) => {
    setClient(client);
    setShowClientModal(false);
    toast.success(`Cliente: ${client.name || client.trade_name}`);
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
  };

  const handleCashReceivedChange = (value: string) => {
    setLocalCashReceived(value);
    setCashReceived(parseFloat(value) || 0);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // ─── CART CONTENT (shared between desktop sidebar and mobile drawer) ───
  const CartContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Fragment>
      {/* Cart header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-[#232834] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Carrito
              {items.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
              )}
            </h2>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setDocumentType('03')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                documentType === '03'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/30'
                  : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1E2230]'
              )}
            >
              Boleta
            </button>
            <button
              onClick={() => setDocumentType('01')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                documentType === '01'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/30'
                  : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1E2230]'
              )}
            >
              Factura
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowClientModal(true)}
          className="w-full flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-[#1E2230]/60 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E2230]/60 transition-colors border border-gray-200 dark:border-[#232834]/50"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300 flex-1 text-left truncate">
            {selectedClient
              ? (selectedClient.name || selectedClient.trade_name)
              : (documentType === '01' ? 'Seleccionar cliente (requerido)' : 'Cliente general')
            }
          </span>
          {selectedClient && (
            <button
              onClick={(e) => { e.stopPropagation(); setClient(null); }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-[#2A3040] rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </button>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-2.5 min-h-0 bg-white dark:bg-black">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center py-8">
            <div>
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-[#1E2230]/50 rounded-2xl flex items-center justify-center mb-3">
                <ShoppingCartIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                El carrito está vacío
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Busca o selecciona productos
              </p>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="bg-gray-50 dark:bg-[#1E2230]/50 rounded-xl p-2.5 border border-gray-100 dark:border-[#232834] transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                {/* Small circular product image */}
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232834] flex-shrink-0 overflow-hidden border-2 border-white dark:border-[#2A3040] shadow-sm">
                  <ImageWithFallback
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    fallbackIcon="package"
                  />
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate leading-tight">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 font-semibold">
                    S/ {item.unitPrice.toFixed(2)}
                  </p>
                </div>

                {/* Quantity controls + subtotal */}
                <div className="flex items-center gap-1 flex-shrink-0 bg-gray-900 dark:bg-black rounded-full p-1">
                  <button
                    onClick={() => {
                      if (item.quantity <= 1) {
                        removeItem(item.product.id);
                      } else {
                        updateQuantity(item.product.id, item.quantity - 1);
                      }
                    }}
                    className={clsx(
                      'w-6 h-6 flex items-center justify-center rounded-full transition-colors font-bold',
                      item.quantity <= 1
                        ? 'bg-red-500 text-black hover:bg-red-400'
                        : 'bg-red-500 text-black hover:bg-red-400'
                    )}
                  >
                    <MinusIcon className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-bold text-sm text-white tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-colors font-bold"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal */}
                <span className="font-bold text-sm text-gray-900 dark:text-white tabular-nums min-w-[4rem] text-right">
                  S/ {(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart totals — Always visible at the bottom of the column */}
      <div className="mt-auto border-t border-gray-200 dark:border-[#232834] p-4 bg-gray-50 dark:bg-[#0D1117] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] z-10 rounded-b-xl">
        <div className="space-y-1.5 text-sm mb-4">
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Subtotal</span>
            <span className="font-medium">S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>IGV (18%)</span>
            <span className="font-medium">S/ {igv.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-2xl font-black text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-[#232834] mt-2">
            <span>Total</span>
            <span className="text-emerald-500 drop-shadow-md">S/ {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => items.length > 0 && setShowPaymentModal(true)}
            disabled={items.length === 0}
            className={clsx(
              "w-full py-4 px-4 font-black text-xl rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase tracking-wide transform hover:-translate-y-0.5",
              items.length > 0
                ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30 cursor-pointer ring-2 ring-black/5"
                : "bg-gray-200 dark:bg-[#1E2230] text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none"
            )}
          >
            <BanknotesIcon className="w-7 h-7 stroke-2" />
            <span>COBRAR</span>
          </button>
          <button
            onClick={clearCart}
            disabled={items.length === 0}
            className={clsx(
              "w-full py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1",
              items.length > 0
                ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer"
                : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
            )}
          >
            <XMarkIcon className="w-3 h-3" />
            Limpiar carrito
          </button>
        </div>
      </div>
    </Fragment>
  );

  return (
    <div className="pos-layout">
      {/* Wrapper for main content columns */}
      <div className="pos-content-container">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PRODUCTS PANEL (always visible)                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="pos-products-panel">
          {/* Search bar */}
          <div className="mb-3 sm:mb-4 space-y-2.5">
            <div className="relative group">
              <MagnifyingGlassIcon className={clsx(
                "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-200",
                searchFocused && "text-white animate-loupe"
              )} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar por nombre o código (F2)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border-0 bg-white dark:bg-[#1a1a1a] text-sm focus:bg-emerald-600 focus:text-white focus:outline-none focus:ring-0 transition-all placeholder:text-gray-300"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-white group-hover:bg-emerald-100 transition-colors"
                >
                  <XMarkIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                </button>
              )}
              {isSearching && !search && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {categoryNames.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border',
                    selectedCategory === category
                      ? 'bg-emerald-500 text-black font-semibold border-emerald-500 shadow-md shadow-emerald-500/25'
                      : 'bg-white dark:bg-black text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#232834] hover:border-emerald-300 dark:hover:border-emerald-500'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-auto -mx-1 px-1 pb-2">
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-2.5 lg:gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-black rounded-xl p-3 animate-pulse border border-gray-100 dark:border-[#232834]">
                    <div className="aspect-square bg-gray-100 dark:bg-[#1E2230] rounded-lg mb-2.5"></div>
                    <div className="h-3 bg-gray-100 dark:bg-[#1E2230] rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 dark:bg-[#1E2230] rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-center">
                <div>
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-black rounded-2xl flex items-center justify-center mb-3">
                    <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">
                    {search ? 'No se encontraron productos' : 'No hay productos disponibles'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-2.5 lg:gap-3">
                {displayProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="bg-white dark:bg-black rounded-xl p-2.5 sm:p-3 text-left hover:ring-2 hover:ring-emerald-500/70 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200 border border-gray-100 dark:border-[#232834] group active:scale-[0.98]"
                  >
                    <div className="aspect-square bg-gray-50 dark:bg-[#1E2230]/50 rounded-lg mb-2 sm:mb-2.5 flex items-center justify-center overflow-hidden relative">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        fallbackIcon="package"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors duration-200 rounded-lg flex items-center justify-center">
                        <PlusIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" />
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-mono mb-0.5">{product.code}</p>
                    <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2 mb-1.5 leading-tight">
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm sm:text-base font-bold text-emerald-500 dark:text-emerald-400">S/ {Number(product.sale_price).toFixed(2)}</span>
                      <Badge variant={product.stock && product.stock > 10 ? 'success' : 'warning'} size="sm">
                        {product.stock || 0}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CART SIDEBAR — Desktop only (lg+)                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="pos-cart-sidebar hidden lg:flex flex-col bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-[#232834] shadow-sm overflow-hidden">
          <CartContent />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MOBILE CART DRAWER — Only visible < lg                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Backdrop */}
      {mobileCartOpen && (
        <div
          onClick={() => setMobileCartOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Drawer */}
      <div
        className={clsx(
          'lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-black rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-[#232834] flex flex-col transition-all duration-300 ease-out',
          mobileCartOpen
            ? 'max-h-[85vh]'
            : 'max-h-0 overflow-hidden pointer-events-none'
        )}
        style={{ height: mobileCartOpen ? '85vh' : '0' }}
      >
        {/* Drag handle */}
        <button
          onClick={() => setMobileCartOpen(false)}
          className="w-full flex flex-col items-center py-2 flex-shrink-0"
        >
          <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <span className="text-xs text-gray-400 mt-1">Cerrar</span>
        </button>
        <CartContent isMobile />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FIXED BOTTOM BAR — Mobile Only (Cart Toggle)                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="pos-fixed-bottom lg:hidden">
        <div className="flex items-center gap-3 w-full max-w-screen-xl mx-auto">
          {/* Mobile only: Cart toggle */}
          <button
            onClick={() => items.length > 0 && setMobileCartOpen(!mobileCartOpen)}
            className={clsx(
              'w-full relative flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 shadow-lg',
              items.length > 0
                ? 'bg-black border-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-black border-gray-200 dark:border-[#232834] text-gray-400'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCartIcon className={clsx("w-6 h-6", items.length > 0 ? "text-emerald-400" : "text-gray-400")} />
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="font-bold text-lg">
                {items.length > 0 ? `S/ ${total.toFixed(2)}` : 'Carrito Vacío'}
              </span>
            </div>

            {items.length > 0 && (
              <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                <span>Ver Carrito</span>
                {mobileCartOpen ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Procesar Pago"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center py-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/5 dark:to-green-500/5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total a cobrar</p>
            <p className="text-4xl font-extrabold text-emerald-500">S/ {total.toFixed(2)}</p>
          </div>

          {documentType === '01' && !selectedClient && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/5 rounded-xl text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Factura requiere cliente con RUC</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Método de pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'cash' as const, icon: BanknotesIcon, label: 'Efectivo' },
                { key: 'card' as const, icon: CreditCardIcon, label: 'Tarjeta' },
                { key: 'yape_plin' as const, icon: QrCodeIcon, label: 'Yape/Plin' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className={clsx(
                    'p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all duration-200',
                    paymentMethod === key
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-md shadow-emerald-500/10'
                      : 'border-gray-200 dark:border-[#232834] hover:border-emerald-300 dark:hover:border-emerald-500'
                  )}
                >
                  <Icon className={clsx('w-6 h-6', paymentMethod === key ? 'text-emerald-500' : 'text-gray-500')} />
                  <span className={clsx('text-xs font-medium', paymentMethod === key ? 'text-emerald-500' : 'text-gray-600 dark:text-gray-300')}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div>
              <Input
                label="Monto recibido"
                type="number"
                placeholder="0.00"
                value={localCashReceived}
                onChange={(e) => handleCashReceivedChange(e.target.value)}
                leftAddon="S/"
              />
              {cashReceived >= total && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center border border-green-200 dark:border-green-800/30">
                  <p className="text-sm text-green-600 dark:text-green-400">Vuelto</p>
                  <p className="text-2xl font-extrabold text-green-600">S/ {change.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowPaymentModal(false)}>
              Cancelar
            </Button>
            <Button
              fullWidth
              onClick={handleProcessSale}
              disabled={isProcessing || (paymentMethod === 'cash' && cashReceived < total) || (documentType === '01' && !selectedClient)}
              loading={isProcessing}
            >
              <PrinterIcon className="w-5 h-5 mr-2" />
              Procesar e Imprimir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Client Search Modal */}
      <Modal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        title="Buscar Cliente"
        size="md"
      >
        <div className="space-y-4">
          <Input
            placeholder="Buscar por RUC, DNI o razón social"
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />
          <div className="h-64 overflow-auto border border-gray-200 dark:border-[#232834] rounded-xl">
            {clientsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : clients.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>{clientSearch ? 'No se encontraron clientes' : 'Ingresa RUC o DNI para buscar'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      {client.name || client.trade_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {client.document_type}: {client.document_number}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowClientModal(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" fullWidth>
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccess}
        title="Venta Exitosa"
        size="sm"
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-14 h-14 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Venta completada!
          </h3>
          {lastSale && (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Total: <span className="font-bold text-gray-900 dark:text-white">S/ {Number(lastSale.sale.total).toFixed(2)}</span></p>
              {Number(lastSale.sale.change_amount) > 0 && (
                <p>Vuelto: <span className="font-bold text-green-600">S/ {Number(lastSale.sale.change_amount).toFixed(2)}</span></p>
              )}
              {lastSale.invoice && (
                <p>Comprobante: <span className="font-medium">{lastSale.invoice.series}-{lastSale.invoice.number}</span></p>
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" fullWidth onClick={handleCloseSuccess}>
              Nueva Venta
            </Button>
            <Button fullWidth onClick={() => { /* Print logic */ handleCloseSuccess(); }}>
              <PrinterIcon className="w-5 h-5 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </Modal>
      {/* Open Session Modal */}
      <Modal
        isOpen={showOpenSessionModal}
        onClose={() => { }} // Prevent closing without opening session
        showClose={false}
        closeOnOverlay={false}
        title="Apertura de Caja"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-500">Sesión Requerida</h4>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Debes abrir una sesión de caja antes de poder realizar ventas.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Caja Registradora
            </label>
            <select
              value={selectedRegister}
              onChange={(e) => setSelectedRegister(e.target.value)}
              className="block w-full rounded-lg border-gray-300 dark:border-[#232834] bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2.5 sm:text-sm"
            >
              <option value="">Seleccionar Caja</option>
              {cashRegisters.map((register) => (
                <option key={register.id} value={register.id}>
                  {register.name} {register.code ? `(${register.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Monto de Apertura"
            type="number"
            placeholder="0.00"
            value={openingAmount}
            onChange={(e) => setOpeningAmount(e.target.value)}
            leftAddon="S/"
            min="0"
          />

          <div className="pt-2">
            <Button
              fullWidth
              variant="primary"
              onClick={handleOpenSession}
              disabled={isSessionLoading || !selectedRegister || !openingAmount}
              loading={isSessionLoading}
            >
              Abrir Sesión
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default POSPage;

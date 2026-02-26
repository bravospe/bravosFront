import { useState, Fragment, useEffect } from 'react';
import NotificationList from '@/components/ui/NotificationList';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { clsx } from 'clsx';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingCartIcon,
  UsersIcon,
  CubeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  TruckIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  GlobeAltIcon,
  Bars3BottomLeftIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  SwatchIcon,
  BellIcon,
  BuildingStorefrontIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
  PhotoIcon,
  TagIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { Avatar, Dropdown, Modal, LaserLoader } from '../ui'; // Asumiendo que existe Modal
import ImageWithFallback from '../ui/ImageWithFallback';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { NotificationToastContainer } from '../notifications/NotificationToast';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/stores/notificationStore';
// import { NotificationList } from '../notifications/NotificationList'; // Asumiendo que podemos reusar la lista
import toast from 'react-hot-toast';


interface NavigationItem {
  name: string;
  href?: string;
  icon?: any;
  current?: boolean;
  children?: NavigationItem[];
  action?: string; // Para identificar acciones especiales como 'search' o 'notifications'
}





// Estructura estilo Instagram
const navigation: NavigationItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: HomeIcon },
  { name: 'Notificaciones', action: 'notifications', icon: BellIcon },
  { name: 'POS', href: '/pos', icon: ShoppingCartIcon },
  {
    name: 'Tienda Virtual',
    icon: GlobeAltIcon,
    children: [
      { name: 'Vista General', href: '/virtual-store', icon: HomeIcon },
      { name: 'Pedidos', href: '/virtual-store/orders', icon: ShoppingBagIcon },
      { name: 'Envíos', href: '/virtual-store/shipments', icon: TruckIcon },
      { name: 'Clientes', href: '/virtual-store/customers', icon: UsersIcon },
      { name: 'Banners', href: '/virtual-store/banners', icon: PhotoIcon },
      { name: 'Promociones', href: '/virtual-store/promotions', icon: TagIcon },
      { name: 'Apariencia', href: '/virtual-store/appearance', icon: PaintBrushIcon },
      { name: 'Configuración', href: '/virtual-store/settings', icon: Cog6ToothIcon },
    ],
  },
  { name: 'Clientes', href: '/clients', icon: UsersIcon },
  {
    name: 'Catálogo',
    icon: CubeIcon,
    children: [
      { name: 'Productos', href: '/products', icon: CubeIcon },
      { name: 'Inventario', href: '/inventory/kardex', icon: ArchiveBoxIcon },
      { name: 'Proveedores', href: '/suppliers', icon: TruckIcon },
      { name: 'Marcas', href: '/products/brands', icon: CubeIcon },
      { name: 'Sedes', href: '/inventory/branches', icon: ArchiveBoxIcon },
      { name: 'Unidades de Producto', href: '/products/units', icon: CubeIcon },
    ],
  },
  {
    name: 'Gestión',
    icon: ChartBarIcon,
    children: [
      { name: 'Ventas', href: '/sales', icon: BanknotesIcon },
      { name: 'Facturación', href: '/invoices', icon: DocumentTextIcon },
      { name: 'Reportes', href: '/reports', icon: ChartBarIcon },
    ],
  },
];

const SidebarItem = ({
  item,
  collapsed,
  onAction
}: {
  item: NavigationItem;
  collapsed: boolean;
  onAction: (action: string) => void;
}) => {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();

  const hasChildren = item.children && item.children.length > 0;

  // Active state logic
  const isActive = !hasChildren && !item.action && (pathname === item.href || pathname.startsWith(item.href || 'XYZ'));
  const isChildActive = item.children?.some(
    (child) => pathname === child.href || pathname.startsWith(child.href || 'XYZ')
  );

  const handleClick = (e: React.MouseEvent) => {
    if (item.action) {
      e.preventDefault();
      onAction(item.action);
    }
  };

  const showBadge = item.action === 'notifications' && unreadCount > 0;

  // Common styles - CoinVex Dark Premium Theme
  const itemClasses = (active: boolean) => clsx(
    'flex items-center rounded-xl transition-all duration-200 outline-none group relative overflow-visible h-[44px]',
    // Always fixed padding to keep icon static. No justify-center.
    'w-full pl-[3px]',
    active
      ? 'text-white font-bold'
      : 'text-gray-400 hover:text-white hover:font-medium'
  );

  const iconContainerClasses = (active: boolean) => clsx(
    'flex items-center justify-center rounded-lg transition-all duration-200 w-10 h-10 flex-shrink-0',
    active ? 'bg-emerald-500/15 shadow-sm' : 'bg-transparent'
  );

  const iconClasses = (active: boolean) => clsx(
    'w-6 h-6 stroke-[1.5] transition-transform duration-200',
    active ? 'text-emerald-400 stroke-2' : 'text-gray-500 group-hover:text-gray-300 group-hover:scale-105'
  );

  // 1. DROPDOWN ITEM (Catálogo, Gestión) - Uses Headless UI Menu for Popover
  if (hasChildren) {
    return (
      <Menu as="li" className="relative my-1">
        {({ open }) => (
          <>
            <div className="relative group">
              <Menu.Button className={itemClasses(open || isChildActive || false)}>
                <div className="flex items-center flex-1 min-w-0">
                  {item.icon && (
                    <div className={iconContainerClasses(open || isChildActive || false)}>
                      <item.icon className={iconClasses(open || isChildActive || false)} />
                    </div>
                  )}
                  <span className={clsx(
                    "text-[15px] tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 origin-left block",
                    !collapsed ? "w-auto opacity-100 ml-4" : "w-0 opacity-0 ml-0"
                  )}>
                    {item.name}
                  </span>
                </div>

                {!collapsed && (
                  <ChevronRightIcon className={clsx("w-4 h-4 text-gray-500 transition-transform ml-auto mr-4", open ? "rotate-90" : "")} />
                )}
              </Menu.Button>

              {/* Tooltip for Collapsed State (Name only) */}
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-[#1E2230] text-gray-200 text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl border border-[#2A3040]">
                  {item.name}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#1E2230] rotate-45" />
                </div>
              )}
            </div>

            {/* Popover Menu to the RIGHT */}
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className={clsx(
                  "absolute top-0 z-[60] w-64 rounded-2xl bg-white dark:bg-[#161A22] shadow-2xl ring-1 ring-black/5 dark:ring-white/5 focus:outline-none p-2 border border-gray-100 dark:border-[#232834]",
                  // Position logic: always to the right
                  "left-[calc(100%-0.5rem)] ml-2" // Always position to the right relative to the LI
                )}
              >
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-[#232834] mb-1">
                  {item.name}
                </div>
                {item.children?.map((child) => {
                  const isChildSelected = pathname === child.href;
                  return (
                    <Menu.Item key={child.name}>
                      {({ active }) => (
                        <Link
                          href={child.href || '#'}
                          className={clsx(
                            'group flex items-center px-3 py-2.5 text-sm rounded-xl transition-colors',
                            (active || isChildSelected)
                              ? 'bg-gray-50 dark:bg-emerald-500/10 text-gray-900 dark:text-emerald-400 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          )}
                        >
                          {child.icon && <child.icon className="mr-3 h-4 w-4 stroke-2" />}
                          {child.name}
                        </Link>
                      )}
                    </Menu.Item>
                  )
                })}
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    );
  }

  // 2. SINGLE ITEM (Link or Action)
  return (
    <li className="my-1 relative group">
      <Link
        href={item.action ? '#' : item.href || '#'}
        onClick={handleClick}
        className={itemClasses(isActive)}
      >
        <div className="flex items-center flex-1 min-w-0">
          {item.icon && (
            <div className={iconContainerClasses(isActive)}>
              <item.icon className={iconClasses(isActive)} />
              {showBadge && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#F1F3F6] dark:border-[#080B12] px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          )}
          <span className={clsx(
            "text-[15px] tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 origin-left block",
            !collapsed ? "w-auto opacity-100 ml-4" : "w-0 opacity-0 ml-0"
          )}>
            {item.name}
          </span>
        </div>
      </Link>

      {/* Tooltip for Collapsed State */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-[#1E2230] text-gray-200 text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl border border-[#2A3040]">
          {item.name}
          <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#1E2230] rotate-45" />
        </div>
      )}
    </li>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  // CONFIGURACIÓN POR DEFECTO: Sidebar Contraído (true)
  const [collapsed, setCollapsed] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const router = useRouter();
  const { user, currentCompany, logout, initializeCompany } = useAuthStore();
  const { logo } = useThemeStore();
  const { toasts, removeToast, handleToastClick } = useNotifications();
  const { fetchUnreadCount } = useNotificationStore();
  const [mounted, setMounted] = useState(false);

  const isSidebarExpanded = !collapsed;

  useEffect(() => {
    setMounted(true);
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (user && !currentCompany) {
      initializeCompany();
    }
  }, [user, currentCompany, initializeCompany]);

  // CSS Var for fixed elements alignment
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      !collapsed ? '240px' : '70px'
    );
    return () => {
      document.documentElement.style.removeProperty('--sidebar-width');
    };
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleAction = (action: string) => {
    if (action === 'search') setSearchOpen(true);
    if (action === 'notifications') setNotificationsOpen(!notificationsOpen);
  };

  // Botón "Más" con Estilo Instagram - Refactored to match SidebarItem
  const MoreMenu = ({ collapsed }: { collapsed: boolean }) => (
    <Menu as="div" className="relative mb-2">
      {({ open }) => (
        <>
          <Menu.Button
            className={clsx(
              'flex items-center rounded-xl transition-all duration-200 outline-none group relative overflow-hidden h-[44px]',
              // Always fixed padding to keep icon static. No justify-center.
              'w-full pl-[3px]',
              open ? 'text-white font-bold' : 'text-gray-400 hover:text-white hover:font-medium'
            )}
          >
            <div className={clsx(
              'flex items-center justify-center rounded-lg transition-all duration-200 w-10 h-10 flex-shrink-0',
              open ? 'bg-emerald-500/15 shadow-sm' : 'bg-transparent'
            )}>
              <Bars3BottomLeftIcon className={clsx("w-6 h-6 stroke-[1.5]", open ? "stroke-2 text-emerald-400" : "text-gray-500")} />
            </div>
            <span className={clsx(
              "text-[15px] tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 origin-left block",
              !collapsed ? "w-auto opacity-100 ml-4" : "w-0 opacity-0 ml-0",
              open ? "font-bold" : "font-normal"
            )}>
              Más
            </span>
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className={clsx(
              "absolute bottom-0 z-[100] w-64 rounded-2xl bg-white dark:bg-[#161A22] shadow-2xl ring-1 ring-black/5 dark:ring-white/5 focus:outline-none p-2 border border-gray-100 dark:border-[#232834]",
              "left-[calc(100%-0.5rem)] ml-2" // Position to the right, same as other menus
            )}>
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-[#232834] mb-1">
                Más Opciones
              </div>
              <Menu.Item>
                {({ active }) => (
                  <button onClick={() => router.push('/settings')} className={clsx(
                    'group flex items-center px-3 py-3 text-sm rounded-xl transition-colors w-full',
                    active ? 'bg-gray-50 dark:bg-emerald-500/10 text-gray-900 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-400'
                  )}>
                    <Cog6ToothIcon className="mr-3 h-5 w-5 stroke-2" /> Configuración
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button onClick={() => router.push('/settings/appearance')} className={clsx(
                    'group flex items-center px-3 py-3 text-sm rounded-xl transition-colors w-full',
                    active ? 'bg-gray-50 dark:bg-emerald-500/10 text-gray-900 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-400'
                  )}>
                    <SwatchIcon className="mr-3 h-5 w-5 stroke-2" /> Apariencia
                  </button>
                )}
              </Menu.Item>
              {/* Switch Store Simulation */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => toast.success('Próximamente: Cambio de Tienda')}
                    className={clsx(
                      'group flex items-center px-3 py-3 text-sm rounded-xl transition-colors w-full',
                      active ? 'bg-gray-50 dark:bg-emerald-500/10 text-gray-900 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    <BuildingStorefrontIcon className="mr-3 h-5 w-5 stroke-2" /> Cambiar Tienda
                  </button>
                )}
              </Menu.Item>

              <div className="h-px bg-gray-100 dark:bg-[#232834] my-1" />

              <Menu.Item>
                {({ active }) => (
                  <button onClick={handleLogout} className={clsx(
                    'group flex items-center px-3 py-3 text-sm rounded-xl transition-colors w-full',
                    active ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium' : 'text-red-500 dark:text-red-400/70'
                  )}>
                    <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 stroke-2" /> Cerrar Sesión
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );

  // Profile Link at Bottom (Instagram Style)
  const ProfileLink = ({ collapsed }: { collapsed: boolean }) => {
    const isActive = usePathname().startsWith('/settings');

    return (
      <Link
        href="/settings"
        className={clsx(
          "flex items-center gap-4 rounded-xl transition-all duration-200 group mb-4",
          !collapsed ? "px-4 py-3" : "justify-center p-0 w-[44px] h-[44px] mx-auto",
          isActive ? "text-white font-bold" : "text-gray-400 hover:text-white"
        )}
      >
        <div className={clsx(
          "relative rounded-full overflow-hidden border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
          isActive ? "ring-2 ring-emerald-500/50 border-emerald-500/50" : "border-gray-600",
          "w-10 h-10"
        )}>
          <Avatar src={user?.avatar} name={user?.name || 'U'} size="md" />
        </div>
        {!collapsed && <span className={clsx("text-[15px] tracking-wide", isActive ? "font-bold text-white" : "text-gray-400 font-normal")}>Perfil</span>}
      </Link>
    );
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div
      className={clsx(
        'flex grow flex-col h-full bg-transparent transition-all duration-300',
        isMobile ? 'px-4' : 'px-3', // Standardized padding for desktop to prevent icon jump
        // FIX: Ensure overflow is visible so flyout menus can be seen outside the sidebar bounds
        'overflow-visible'
      )}
    >
      {/* Logo Area (Instagram style) */}
      <div className={clsx('flex items-center h-[72px] mb-2', collapsed && !isMobile ? 'justify-center' : 'px-2')}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          {collapsed && !isMobile ? (
            // Icon only
            <div className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105">
              <img src="/logo_bravos.png" alt="Bravos Logo" className="w-8 h-8 object-contain" />
            </div>
          ) : (
            // Full Logo
            <div className="flex items-center gap-3 transition-transform hover:scale-105">
              <div className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0">
                <img src="/logo_bravos.png" alt="Bravos Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">Bravos</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-visible py-2">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <SidebarItem
              key={item.name}
              item={item}
              // Usamos !isSidebarExpanded aquí. Si está expandido por hover o lock,
              // collapsed visualmente es false.
              collapsed={!isSidebarExpanded && !isMobile}
              onAction={handleAction}
            />
          ))}

        </ul>
      </nav>

      {/* Bottom Area: More Menu and Profile */}
      <div className="pb-2">
        {/* Profile Item (Moved here) */}
        <ProfileLink collapsed={!isSidebarExpanded && !isMobile} />

        <MoreMenu collapsed={!isSidebarExpanded && !isMobile} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F3F6] dark:bg-transparent font-sans flex flex-row">
      <LaserLoader />
      {/* Search Modal (Simulated Drawer) */}
      <Modal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Buscar"
        size="lg"
      >
        <div className="mt-2">
          <input
            autoFocus
            className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100 dark:bg-black focus:ring-2 focus:ring-emerald-500 text-lg"
            placeholder="Buscar productos, clientes, facturas..."
          />
          <div className="mt-4 text-sm text-gray-500">
            <p className="mb-2 font-medium">Recientes</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-[#161A22]/50 rounded-lg cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1E2230] flex items-center justify-center"><UsersIcon className="w-4 h-4" /></div>
                <span>Cliente: Juan Perez</span>
              </div>
              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-[#161A22]/50 rounded-lg cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1E2230] flex items-center justify-center"><CubeIcon className="w-4 h-4" /></div>
                <span>Producto: Laptop HP</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Notifications Drawer (Right Side) */}
      <Transition show={notificationsOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setNotificationsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-[#161A22] shadow-2xl">
                      <div className="px-6 py-6 border-b border-gray-100 dark:border-[#232834]">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                            Notificaciones
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none"
                              onClick={() => setNotificationsOpen(false)}
                            >
                              <span className="sr-only">Cerrar panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative flex-1 px-0 py-0 flex flex-col h-full bg-white dark:bg-[#161A22]">
                        <NotificationList onClose={() => setNotificationsOpen(false)} />
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100] lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-[280px] flex-1 bg-[#0D1117] border-r border-[#232834] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent isMobile={true} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div
        className={clsx(
          'hidden lg:fixed lg:top-4 lg:bottom-4 lg:left-4 lg:z-40 lg:flex lg:flex-col transition-all duration-300 ease-in-out bg-black rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.4)]',
          // ELIMINADO EL HOVER AUTOMÁTICO
          // Ahora solo responde a 'collapsed' que se controla con el botón
          !collapsed ? 'lg:w-[240px]' : 'lg:w-[70px]'
        )}
      // onMouseEnter y onMouseLeave ELIMINADOS para evitar expansión automática
      >
        <SidebarContent />

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            "absolute -right-3 top-12 w-6 h-6 bg-emerald-500 border border-emerald-400/30 rounded-full flex items-center justify-center text-black hover:bg-emerald-400 transition-all z-50 cursor-pointer shadow-sm hover:scale-110",
            "flex"
          )}
        >
          {!collapsed ? (
            <ChevronDoubleLeftIcon className="w-3 h-3" />
          ) : (
            <ChevronDoubleRightIcon className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Main content */}
      <div
        className={clsx(
          'flex flex-col flex-1 transition-all duration-300 ease-in-out',
          usePathname() === '/pos' ? 'h-screen overflow-hidden' : 'min-h-screen',
          // El padding del contenido SOLO responde al estado 'collapsed' (fijo/locked),
          // NO al hover temporal. Así el contenido no salta.
          !collapsed ? 'lg:pl-[272px]' : 'lg:pl-[102px]'
        )}
      >
        {/* Mobile Header (Solo visible en movil) */}
        <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] px-4 shadow-sm lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2 text-center font-bold text-lg">
            <img src="/logo_bravos.png" alt="Bravos Logo" className="w-6 h-6 object-contain" />
            Bravos
          </div>
          <div className="w-6"></div> {/* Spacer for alignment */}
        </div>

        {/* Page content */}
        <main className={clsx(
          "flex-1 overflow-x-hidden",
          usePathname() === '/pos' ? 'p-0 overflow-hidden' : 'p-4 sm:p-6 lg:p-8'
        )}>
          <div className={clsx("mx-auto", usePathname() === '/pos' ? 'max-w-full h-full' : 'max-w-7xl h-full')}>
            {children}
          </div>
        </main>

        <NotificationToastContainer
          toasts={toasts}
          onRemove={removeToast}
          onNotificationClick={handleToastClick}
        />
      </div>
    </div>
  );
};

export default DashboardLayout;

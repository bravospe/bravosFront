import { useState, Fragment, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ServerIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  Squares2X2Icon,
  EnvelopeIcon,
  BellAlertIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { Avatar, Dropdown } from '../ui';
import { useAuthStore } from '../../stores/authStore';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current?: boolean;
}

interface NavigationGroup {
  name: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    name: 'Principal',
    items: [
      { name: 'Dashboard', href: '/superadmin', icon: HomeIcon },
      { name: 'Empresas', href: '/superadmin/companies', icon: BuildingOfficeIcon },
    ]
  },
  {
    name: 'WhatsApp',
    items: [
      { name: 'Chat (IA)', href: '/superadmin/chats', icon: ChatBubbleLeftRightIcon },
      { name: 'Logs de Mensajes', href: '/superadmin/whatsapp/logs', icon: ListBulletIcon },
      { name: 'Contactos CRM', href: '/superadmin/whatsapp/crm', icon: UserGroupIcon },
      { name: 'Bot Builder', href: '/superadmin/whatsapp/bot-builder', icon: Squares2X2Icon },
      { name: 'Automatizaciones', href: '/superadmin/whatsapp/automations', icon: BoltIcon },
      { name: 'Métricas (Analytics)', href: '/superadmin/whatsapp/analytics', icon: ChartBarIcon },
      { name: 'Configuración WA', href: '/superadmin/whatsapp/settings', icon: AdjustmentsHorizontalIcon },
    ]
  },
  {
    name: 'Gestión',
    items: [
      { name: 'Usuarios', href: '/superadmin/users', icon: UserGroupIcon },
      { name: 'Planes', href: '/superadmin/plans', icon: BanknotesIcon },
      { name: 'Alertas & Recordatorios', href: '/superadmin/alerts', icon: BellAlertIcon },
    ]
  },
  {
    name: 'Sistema',
    items: [
      { name: 'Cuentas de Correo', href: '/superadmin/mail', icon: EnvelopeIcon },
      { name: 'Monitor del Motor', href: '/superadmin/worker-monitor', icon: CpuChipIcon },
      { name: 'Almacenamiento', href: '/superadmin/storage', icon: ServerIcon },
      { name: 'Roles y Permisos', href: '/superadmin/roles', icon: ShieldCheckIcon },
      { name: 'Configuración Global', href: '/superadmin/settings', icon: Cog6ToothIcon },
    ]
  }
];

const SuperAdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Redirect if not superadmin
  useEffect(() => {
    if (user) {
      const isSuperAdmin = user.roles?.some((r: any) => r.name === 'superadmin');
      if (!isSuperAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const userMenuItems = [
    { label: 'Volver a App', onClick: () => router.push('/dashboard') },
    { divider: true, label: '' },
    { label: 'Cerrar Sesión', onClick: handleLogout, danger: true },
  ];

  const SidebarContent = ({ isMobile = false }) => (
    <div className={clsx(
      "flex grow flex-col gap-y-5 overflow-y-auto bg-zinc-900 pb-4 transition-all duration-300 custom-scrollbar",
      isMobile ? "px-6" : collapsed ? "px-2 items-center" : "px-6"
    )}>
      {/* Logo */}
      <div className={clsx("flex h-16 shrink-0 items-center", collapsed && !isMobile ? "justify-center" : "gap-3")}>
        <img src="/logo_bravos.png" alt="Bravos Logo" className="w-10 h-10 object-contain" />
        {(!collapsed || isMobile) && (
          <span className="text-xl font-bold text-white tracking-tight">Bravos <span className="text-emerald-500">Admin</span></span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col mt-2">
        <ul role="list" className="flex flex-1 flex-col gap-y-6">
          {navigationGroups.map((group, groupIdx) => (
            <li key={group.name}>
              {(!collapsed || isMobile) && (
                <div className="text-xs font-semibold leading-6 text-zinc-500 uppercase tracking-wider mb-2">
                  {group.name}
                </div>
              )}
              {collapsed && !isMobile && groupIdx > 0 && (
                <div className="w-full h-px bg-zinc-800 my-4" />
              )}
              <ul role="list" className="-mx-2 space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={clsx(
                          isActive
                          ? 'bg-zinc-800 text-emerald-500'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                          collapsed && !isMobile && 'justify-center'
                        )}
                        title={collapsed && !isMobile ? item.name : undefined}
                      >
                        <item.icon className={clsx("h-6 w-6 shrink-0", isActive ? "text-emerald-500" : "text-zinc-400 group-hover:text-white")} aria-hidden="true" />
                        {(!collapsed || isMobile) && item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#080B12] font-inter">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
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
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
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
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
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
      <div className={clsx(
        "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col bg-zinc-900 transition-all duration-300",
        collapsed ? "lg:w-20" : "lg:w-72"
      )}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-zinc-800 border border-zinc-700 p-1 rounded-full text-zinc-400 hover:text-white transition-colors z-50 flex items-center justify-center cursor-pointer"
        >
          {collapsed ? <ChevronDoubleRightIcon className="w-3 h-3" /> : <ChevronDoubleLeftIcon className="w-3 h-3" />}
        </button>
      </div>

      <div className={clsx("flex flex-col min-h-screen transition-all duration-300", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#0D1117] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Dropdown
                trigger={
                  <button className="-m-1.5 flex items-center p-1.5">
                    <Avatar name={user?.name || 'Admin'} size="sm" />
                    <span className="hidden lg:flex lg:items-center">
                      <span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-white" aria-hidden="true">
                        {user?.name}
                      </span>
                    </span>
                  </button>
                }
                items={userMenuItems}
              />
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;

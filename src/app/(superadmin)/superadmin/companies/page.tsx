'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BuildingOfficeIcon,
  UserIcon,
  IdentificationIcon,
  PencilSquareIcon,
  TrashIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ArchiveBoxIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, Badge, Modal, Input, LaserLoader, Table } from '@/components/ui';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

// --- Interfaces ---

interface Company {
  id: string;
  name: string;
  ruc: string;
  address?: string;
  owner: { name: string; email: string };
  subscription?: {
    plan: { id: string; name: string };
    status: string;
    ends_at: string;
    trial_ends_at?: string;
    days_remaining: number;
  };
  is_active: boolean;
  users_count: number;
  virtual_store_count: number;
  invoices_count: number;
  sales_count: number;
  products_count: number;
  clients_count: number;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
}

interface DashboardStats {
  summary: {
    name: string;
    value: string;
    change: string;
    type: 'positive' | 'negative';
    icon: string;
  }[];
}

// --- Components ---

const StatsCard = ({ title, value, change, type, icon: Icon }: any) => (
  <Card className="p-6 border-none shadow-sm dark:bg-[#0D1117] relative overflow-hidden">
    <div className="flex justify-between items-start z-10 relative">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
      </div>
      <div className={clsx("p-3 rounded-xl", type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className={clsx("font-medium", type === 'positive' ? 'text-emerald-600' : 'text-rose-600')}>
        {change}
      </span>
      <span className="text-gray-400 ml-2">vs mes anterior</span>
    </div>
  </Card>
);

const SubscriptionModal = ({ isOpen, onClose, company, onUpdate }: any) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subData, setSubData] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState({
    plan_id: '',
    starts_at: format(new Date(), 'yyyy-MM-dd'),
    ends_at: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && company) {
      fetchSubscription();
    }
  }, [isOpen, company]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get(`/admin/companies/${company.id}/subscription`),
        api.get('/admin/plans')
      ]);
      setSubData(subRes.data);
      setPlans(plansRes.data);
      if (subRes.data.current) {
        setFormData(prev => ({ 
          ...prev, 
          plan_id: subRes.data.current.plan_id || plansRes.data[0]?.id || '' 
        }));
      } else if (plansRes.data.length > 0) {
        setFormData(prev => ({ ...prev, plan_id: plansRes.data[0].id }));
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar datos de membresía');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/admin/companies/${company.id}/subscription/assign`, formData);
      toast.success('Membresía asignada correctamente');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al asignar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gestionar Membresía: ${company?.name}`} size="2xl">
      {loading ? (
        <div className="py-10 flex justify-center"><ClockIcon className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Plan Actual</p>
              <h4 className="text-xl font-black text-emerald-900 dark:text-emerald-100">
                {subData?.current?.plan?.name || 'Sin Plan Activo'}
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                {subData?.status?.is_active ? `Vence en ${subData.status.days_left} días` : 'Expirado o No asignado'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700/50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Último Pago</p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {subData?.current?.last_payment_at ? format(new Date(subData.current.last_payment_at), 'dd MMM yyyy', { locale: es }) : 'N/A'}
              </h4>
              <Badge variant="secondary" className="mt-1">{subData?.current?.payment_method || 'Manual'}</Badge>
            </div>
          </div>

          <form onSubmit={handleAssign} className="bg-white dark:bg-[#0D1117] p-6 rounded-2xl border border-gray-100 dark:border-[#232834] space-y-4">
            <h5 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PlusIcon className="w-4 h-4 text-emerald-500" /> Asignación Manual
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Seleccionar Plan</label>
                <select 
                  className="w-full bg-gray-50 dark:bg-black border-none rounded-xl px-4 py-2.5 text-sm ring-1 ring-gray-200 dark:ring-gray-800 focus:ring-emerald-500"
                  value={formData.plan_id}
                  onChange={e => setFormData({...formData, plan_id: e.target.value})}
                  required
                >
                  <option value="">Seleccione un plan...</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Estado</label>
                <select 
                  className="w-full bg-gray-50 dark:bg-black border-none rounded-xl px-4 py-2.5 text-sm ring-1 ring-gray-200 dark:ring-gray-800 focus:ring-emerald-500"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Activo (Pagado)</option>
                  <option value="trial">Trial (Prueba)</option>
                  <option value="expired">Expirado</option>
                </select>
              </div>
              <Input 
                type="date" 
                label="Inicia el" 
                value={formData.starts_at} 
                onChange={e => setFormData({...formData, starts_at: e.target.value})} 
              />
              <Input 
                type="date" 
                label="Vence el" 
                value={formData.ends_at} 
                onChange={e => setFormData({...formData, ends_at: e.target.value})} 
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="submit" variant="primary" className="bg-emerald-600 border-none" loading={saving}>
                Actualizar Membresía
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            <h5 className="text-sm font-bold text-gray-900 dark:text-white">Historial de Suscripciones</h5>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {subData?.history?.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/40 rounded-xl text-xs">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{h.plan.name}</p>
                    <p className="text-gray-500">{format(new Date(h.starts_at), 'dd/MM/yy')} - {format(new Date(h.ends_at), 'dd/MM/yy')}</p>
                  </div>
                  <Badge variant={h.status === 'active' ? 'success' : 'secondary'} size="xs">{h.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

const EditCompanyModal = ({ isOpen, onClose, company, onUpdate }: any) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ruc: '',
    address: '',
    is_active: true
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        ruc: company.ruc,
        address: company.address || '',
        is_active: company.is_active
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/companies/${company.id}`, formData);
      toast.success('Empresa actualizada correctamente');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Empresa">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Razón Social / Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <Input label="RUC" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} required />
        <Input label="Dirección" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="is_active" 
            checked={formData.is_active} 
            onChange={e => setFormData({...formData, is_active: e.target.checked})}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Empresa Activa</label>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={loading} className="bg-emerald-600">Guardar Cambios</Button>
        </div>
      </form>
    </Modal>
  );
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }: any) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Eliminar Empresa">
    <div className="space-y-4">
      <div className="flex items-center justify-center p-4 bg-rose-50 rounded-full w-16 h-16 mx-auto">
        <TrashIcon className="w-8 h-8 text-rose-500" />
      </div>
      <p className="text-center text-gray-600 dark:text-gray-400">
        ¿Estás seguro de que deseas eliminar esta empresa? Esta acción no se puede deshacer y eliminará todos los datos asociados.
      </p>
      <div className="flex justify-center gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} className="bg-rose-600 text-white">Sí, Eliminar</Button>
      </div>
    </div>
  </Modal>
);

const subStatusColors: Record<string, string> = {
  trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};
const subStatusLabel: Record<string, string> = {
  trial: 'Trial', active: 'Activo', expired: 'Vencido', cancelled: 'Cancelado',
};

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Modal States
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  
  // Helper for icons mapping
  const icons: any = {
    UsersIcon: UserIcon,
    BuildingOfficeIcon: BuildingOfficeIcon,
    BanknotesIcon: BanknotesIcon,
    ChatBubbleLeftRightIcon: ChatBubbleLeftRightIcon
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companiesRes, statsRes] = await Promise.all([
        api.get('/admin/companies'),
        api.get('/admin/analytics/overview')
      ]);
      setCompanies(companiesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (company: Company) => {
    try {
      await api.post(`/admin/companies/${company.id}/toggle-status`);
      toast.success('Estado actualizado');
      fetchData(); // Refresh list
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;
    try {
      await api.delete(`/admin/companies/${selectedCompany.id}`);
      toast.success('Empresa eliminada');
      setCompanies(prev => prev.filter(c => c.id !== selectedCompany.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error('Error al eliminar empresa');
    }
  };

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.ruc.includes(searchTerm) ||
        company.owner.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? company.is_active :
        !company.is_active;

      const matchesPlan = 
        planFilter === 'all' ? true :
        company.subscription?.plan?.id === planFilter; // Assuming planFilter is ID, or adjust if Name

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [companies, searchTerm, statusFilter, planFilter]);

  if (loading && companies.length === 0) return <div className="flex justify-center py-20"><LaserLoader /></div>;

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control SaaS</h1>
          <p className="text-gray-500 dark:text-gray-400">Visión general y gestión de empresas</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.summary.map((stat, idx) => (
              <StatsCard 
                key={idx}
                title={stat.name}
                value={stat.value}
                change={stat.change}
                type={stat.type}
                icon={icons[stat.icon] || BuildingOfficeIcon}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-sm bg-white dark:bg-[#0D1117] overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 dark:border-[#232834] flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-[#161A22]/50">
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Buscar empresa, RUC..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="relative">
                <select
                  className="pl-3 pr-8 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activas</option>
                  <option value="inactive">Suspendidas</option>
                </select>
                <FunnelIcon className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
             </div>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchData} 
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" /> Actualizar
          </Button>
        </div>

        {/* Table */}
        <Table
          data={filteredCompanies}
          columns={[
            {
              key: 'name',
              header: 'Empresa',
              render: (c) => (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                    <BuildingOfficeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.ruc}</p>
                  </div>
                </div>
              )
            },
            {
              key: 'owner',
              header: 'Dueño',
              render: (c) => (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                    {c.owner.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{c.owner.name}</span>
                    <span className="text-xs text-gray-400">{c.owner.email}</span>
                  </div>
                </div>
              )
            },
            {
              key: 'subscription',
              header: 'Membresía',
              render: (c) => (
                <div>
                  {c.subscription ? (
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${subStatusColors[c.subscription.status] ?? ''}`}>
                        {subStatusLabel[c.subscription.status] ?? c.subscription.status} · {c.subscription.plan.name}
                      </span>
                      {c.subscription.days_remaining > 0 ? (
                        <p className="text-xs text-gray-400 mt-0.5">{c.subscription.days_remaining}d restantes</p>
                      ) : (
                        <p className="text-xs text-red-400 mt-0.5">Vencida</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Sin plan</span>
                  )}
                </div>
              )
            },
            {
              key: 'stats',
              header: 'Uso',
              render: (c) => (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1" title="Usuarios">
                    <UserIcon className="w-3 h-3" /> {c.users_count}
                  </span>
                  <span className="flex items-center gap-1" title="Productos">
                    <ArchiveBoxIcon className="w-3 h-3" /> {c.products_count}
                  </span>
                  <span className="flex items-center gap-1" title="Ventas">
                    <BanknotesIcon className="w-3 h-3" /> {c.sales_count}
                  </span>
                </div>
              )
            },
            {
              key: 'status',
              header: 'Estado',
              render: (c) => (
                <div onClick={(e) => { e.stopPropagation(); toggleStatus(c); }} className="cursor-pointer">
                   <Badge variant={c.is_active ? 'success' : 'danger'}>
                    {c.is_active ? 'Activa' : 'Suspendida'}
                  </Badge>
                </div>
               
              )
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (c) => (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1 text-xs"
                    title="Ver detalle"
                    onClick={() => router.push(`/superadmin/companies/${c.id}`)}
                  >
                    <EyeIcon className="w-4 h-4 text-gray-500" />
                    <span className="hidden sm:inline text-gray-600 dark:text-gray-400">Ver</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Eliminar"
                    onClick={() => { setSelectedCompany(c); setIsDeleteModalOpen(true); }}
                  >
                    <TrashIcon className="w-4 h-4 text-rose-500" />
                  </Button>
                </div>
              )
            }
          ]}
          keyExtractor={(c) => c.id}
          hoverable
        />
      </Card>

      {/* Modals */}
      <SubscriptionModal 
        isOpen={isSubModalOpen} 
        onClose={() => setIsSubModalOpen(false)} 
        company={selectedCompany}
        onUpdate={fetchData}
      />

      <EditCompanyModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        company={selectedCompany}
        onUpdate={fetchData}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, Fragment, useMemo } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  UsersIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  BuildingOffice2Icon,
  UserIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  BanknotesIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useClientStore } from '@/stores/clientStore';
import { useLabelStore } from '@/stores/labelStore';
import { useClientCategoryStore } from '@/stores/clientCategoryStore';
import ClientLabelsDialog from '@/components/clients/ClientLabelsDialog';
import ClientModal from '@/components/clients/ClientModal';
import ClientHistoryModal from '@/components/clients/ClientHistoryModal';
import clsx from 'clsx';
import { Client } from '@/types';
import toast from 'react-hot-toast';

type DocumentTypeFilter = 'all' | 'empresa' | 'persona';
type StatusFilter = 'all' | 'active' | 'inactive';
type SortBy = 'name' | 'created_at' | 'sales_total' | 'sales_count';
type SortOrder = 'asc' | 'desc';

const fmt = (n?: number) =>
  n != null
    ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(n)
    : null;

export default function ClientsPage() {
  const { clients, isLoading: clientsLoading, meta, fetchClients, deleteClient } = useClientStore();
  const { labels, fetchLabels } = useLabelStore();
  const { categories, fetchCategories } = useClientCategoryStore();

  const [search, setSearch] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const [docTypeFilter, setDocTypeFilter] = useState<DocumentTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [salesMin, setSalesMin] = useState('');
  const [salesMax, setSalesMax] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [isLabelsDialogOpen, setIsLabelsDialogOpen] = useState(false);

  useEffect(() => {
    fetchClients({
      page,
      search: search || undefined,
      label_id: labelFilter || undefined,
      category_id: categoryFilter ? Number(categoryFilter) : undefined,
    });
  }, [page, search, labelFilter, categoryFilter, fetchClients]);

  useEffect(() => { setPage(1); }, [search, labelFilter, categoryFilter, docTypeFilter, statusFilter, salesMin, salesMax]);

  useEffect(() => {
    fetchLabels();
    fetchCategories();
  }, [fetchLabels, fetchCategories]);

  const filteredClients = useMemo(() => {
    let result = [...clients];
    if (docTypeFilter === 'empresa') result = result.filter(c => c.document_type === 'RUC');
    else if (docTypeFilter === 'persona') result = result.filter(c => ['DNI', 'CE', 'PASAPORTE'].includes(c.document_type));
    if (statusFilter === 'active') result = result.filter(c => c.is_active);
    else if (statusFilter === 'inactive') result = result.filter(c => !c.is_active);
    if (salesMin !== '') result = result.filter(c => (c.sales_total ?? 0) >= parseFloat(salesMin));
    if (salesMax !== '') result = result.filter(c => (c.sales_total ?? 0) <= parseFloat(salesMax));
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name, 'es');
      else if (sortBy === 'sales_total') cmp = (a.sales_total ?? 0) - (b.sales_total ?? 0);
      else if (sortBy === 'sales_count') cmp = (a.sales_count ?? 0) - (b.sales_count ?? 0);
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [clients, docTypeFilter, statusFilter, salesMin, salesMax, sortBy, sortOrder]);

  const activeFilterCount = [
    docTypeFilter !== 'all',
    statusFilter !== 'all',
    !!labelFilter,
    !!categoryFilter,
    !!(salesMin || salesMax),
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const clearFilters = () => {
    setDocTypeFilter('all'); setStatusFilter('all');
    setLabelFilter(''); setCategoryFilter('');
    setSalesMin(''); setSalesMax('');
    setSortBy('created_at'); setSortOrder('desc');
    setSearch(''); setPage(1);
  };

  const handleCreateClient = () => { setEditingClient(null); setIsClientModalOpen(true); };
  const handleEditClient = (client: Client) => { setEditingClient(client); setIsClientModalOpen(true); };
  const handleDeleteClient = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      await deleteClient(id);
      toast.success('Cliente eliminado');
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent';
  const selectCls = inputCls + ' appearance-none pr-8 cursor-pointer';

  const docTypeTabs = [
    { key: 'all' as DocumentTypeFilter, label: 'Todos' },
    { key: 'empresa' as DocumentTypeFilter, label: 'Empresa', icon: BuildingOffice2Icon },
    { key: 'persona' as DocumentTypeFilter, label: 'Persona Natural', icon: UserIcon },
  ];

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Clientes</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLabelsDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#232834] transition-colors"
          >
            <TagIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Etiquetas</span>
          </button>
          <button
            onClick={handleCreateClient}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo cliente</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-[#232834]">

        {/* Document type subtabs */}
        <div className="border-b border-gray-200 dark:border-[#232834] overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-6 px-4 min-w-max">
            {docTypeTabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setDocTypeFilter(key)}
                className={clsx(
                  'py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5',
                  docTypeFilter === key
                    ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search + filters toggle */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-[#232834] space-y-3">

          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, RUC, DNI o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={clsx(inputCls, 'pl-9')}
              />
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors whitespace-nowrap',
                showFilters || hasActiveFilters
                  ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-[#232834] border-gray-300 dark:border-[#232834]'
                  : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1E2230] border-gray-300 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#232834]'
              )}
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center w-4 h-4 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 items-end pt-1">

              {/* Estado */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-0.5">Estado</span>
                <div className="flex gap-1 bg-gray-100 dark:bg-[#1E2230] rounded-lg p-1">
                  {([
                    { v: 'all' as StatusFilter, l: 'Todos' },
                    { v: 'active' as StatusFilter, l: 'Activo' },
                    { v: 'inactive' as StatusFilter, l: 'Inactivo' },
                  ]).map(({ v, l }) => (
                    <button key={v} onClick={() => setStatusFilter(v)}
                      className={clsx(
                        'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                        statusFilter === v
                          ? 'bg-white dark:bg-[#232834] text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      )}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoría */}
              {categories.length > 0 && (
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-0.5">Categoría</span>
                  <div className="relative">
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectCls}>
                      <option value="">Todas</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Etiqueta */}
              {labels.length > 0 && (
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-0.5">Etiqueta</span>
                  <div className="relative">
                    <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} className={selectCls}>
                      <option value="">Todas</option>
                      {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Vol. ventas */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-0.5 flex items-center gap-1">
                  <BanknotesIcon className="w-3.5 h-3.5" /> Vol. ventas (S/)
                </span>
                <div className="flex items-center gap-1.5">
                  <input type="number" placeholder="Mín" min="0" value={salesMin}
                    onChange={(e) => setSalesMin(e.target.value)}
                    className="w-20 px-2 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                  />
                  <span className="text-gray-400 text-xs">—</span>
                  <input type="number" placeholder="Máx" min="0" value={salesMax}
                    onChange={(e) => setSalesMax(e.target.value)}
                    className="w-20 px-2 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                  />
                </div>
              </div>

              {/* Ordenar */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-0.5">Ordenar por</span>
                <div className="flex gap-1">
                  <div className="relative">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white appearance-none cursor-pointer">
                      <option value="created_at">Fecha registro</option>
                      <option value="name">Nombre</option>
                      <option value="sales_total">Mayor venta</option>
                      <option value="sales_count">Más compras</option>
                    </select>
                    <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                    className="px-2.5 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232834] transition-colors"
                    title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {/* Limpiar */}
              {hasActiveFilters && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-transparent px-0.5">·</span>
                  <button onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg transition-colors">
                    <XMarkIcon className="w-3.5 h-3.5" /> Limpiar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active chips — always visible */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5">
              {docTypeFilter !== 'all' && (
                <Chip label={docTypeFilter === 'empresa' ? 'Empresa' : 'Persona Natural'} onRemove={() => setDocTypeFilter('all')} />
              )}
              {statusFilter !== 'all' && (
                <Chip label={statusFilter === 'active' ? 'Activo' : 'Inactivo'} onRemove={() => setStatusFilter('all')} />
              )}
              {categoryFilter && (
                <Chip label={`Cat: ${categories.find(c => c.id === categoryFilter)?.name ?? ''}`} onRemove={() => setCategoryFilter('')} />
              )}
              {labelFilter && (
                <Chip label={`Etiqueta: ${labels.find(l => l.id === labelFilter)?.name ?? ''}`} onRemove={() => setLabelFilter('')} />
              )}
              {(salesMin || salesMax) && (
                <Chip label={`Ventas: S/${salesMin || '0'}–S/${salesMax || '∞'}`} onRemove={() => { setSalesMin(''); setSalesMax(''); }} />
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-[#1E2230]">
            <thead className="bg-gray-50 dark:bg-[#1E2230]/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo / Doc.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Etiquetas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><BanknotesIcon className="w-3.5 h-3.5" /> Ventas</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-[#1E2230]">
              {clientsLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-7 h-7 border-[3px] border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cargando clientes...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <UsersIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No se encontraron clientes</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Ajusta los filtros o crea un nuevo cliente.</p>
                    <button onClick={handleCreateClient} className="text-sm font-medium underline text-gray-900 dark:text-white">
                      Crear cliente
                    </button>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-[#1E2230]/40 transition-colors">

                    {/* Cliente */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#232834] flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-sm flex-shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{client.name}</div>
                          {client.trade_name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{client.trade_name}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tipo / Doc */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className={clsx(
                          'inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-medium',
                          client.document_type === 'RUC'
                            ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                            : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
                        )}>
                          {client.document_type === 'RUC'
                            ? <><BuildingOffice2Icon className="w-3 h-3" />Empresa</>
                            : <><UserIcon className="w-3 h-3" />Persona</>}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {client.document_type} {client.document_number}
                        </span>
                      </div>
                    </td>

                    {/* Etiquetas */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {client.labels && client.labels.length > 0 ? (
                          client.labels.map((label) => (
                            <span key={label.id}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{ backgroundColor: `${label.color}18`, color: label.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                              {label.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {client.email && <span className="text-xs text-gray-600 dark:text-gray-300">{client.email}</span>}
                        {client.phone && <span className="text-xs text-gray-500 dark:text-gray-400">{client.phone}</span>}
                        {!client.email && !client.phone && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </td>

                    {/* Ventas */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {client.sales_total != null ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(client.sales_total)}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {client.sales_count} {client.sales_count === 1 ? 'compra' : 'compras'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                        client.is_active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      )}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full', client.is_active ? 'bg-green-500' : 'bg-gray-400')} />
                        {client.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="hidden md:flex items-center justify-end gap-1">
                        <button onClick={() => setHistoryClient(client as any)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded-lg transition-colors" title="Historial">
                          <ClockIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleEditClient(client as any)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded-lg transition-colors" title="Editar">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteClient(client.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="md:hidden">
                        <Menu as="div" className="relative inline-block text-left z-10">
                          <Menu.Button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E2230] transition-colors focus:outline-none">
                            <EllipsisVerticalIcon className="w-5 h-5" />
                          </Menu.Button>
                          <Transition as={Fragment}
                            enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                            <Menu.Items className="absolute right-0 mt-1 w-40 origin-top-right rounded-lg bg-white dark:bg-[#1E2230] shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-none z-50 overflow-hidden divide-y divide-gray-100 dark:divide-[#232834]">
                              <div className="px-1 py-1">
                                <Menu.Item>{({ active }) => (
                                  <button onClick={() => setHistoryClient(client as any)}
                                    className={clsx('group flex w-full items-center rounded-md px-2 py-2 text-sm', active ? 'bg-gray-100 dark:bg-[#232834] text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300')}>
                                    <ClockIcon className="mr-2 h-4 w-4" /> Historial
                                  </button>
                                )}</Menu.Item>
                                <Menu.Item>{({ active }) => (
                                  <button onClick={() => handleEditClient(client as any)}
                                    className={clsx('group flex w-full items-center rounded-md px-2 py-2 text-sm', active ? 'bg-gray-100 dark:bg-[#232834] text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300')}>
                                    <PencilIcon className="mr-2 h-4 w-4" /> Editar
                                  </button>
                                )}</Menu.Item>
                              </div>
                              <div className="px-1 py-1">
                                <Menu.Item>{({ active }) => (
                                  <button onClick={() => handleDeleteClient(client.id)}
                                    className={clsx('group flex w-full items-center rounded-md px-2 py-2 text-sm', active ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'text-gray-700 dark:text-gray-300')}>
                                    <TrashIcon className="mr-2 h-4 w-4" /> Eliminar
                                  </button>
                                )}</Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#232834] flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hasActiveFilters
                ? <><span className="font-medium text-gray-900 dark:text-white">{filteredClients.length}</span> de {meta.total} (filtrado)</>
                : <>Mostrando <span className="font-medium text-gray-900 dark:text-white">{meta.from}</span>–<span className="font-medium text-gray-900 dark:text-white">{meta.to}</span> de <span className="font-medium text-gray-900 dark:text-white">{meta.total}</span></>
              }
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Anterior
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === meta.last_page}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} client={editingClient} />
      <ClientLabelsDialog isOpen={isLabelsDialogOpen} onClose={() => setIsLabelsDialogOpen(false)} />
      <ClientHistoryModal isOpen={!!historyClient} onClose={() => setHistoryClient(null)} client={historyClient} />
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-[#232834]">
      {label}
      <button onClick={onRemove} className="ml-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
        <XMarkIcon className="w-3 h-3" />
      </button>
    </span>
  );
}

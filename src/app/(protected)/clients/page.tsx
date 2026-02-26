'use client';

import { useState, useEffect, Fragment } from 'react';
import { Tab, Menu, Transition } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  UsersIcon,
  FunnelIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import LabelSelect from '@/components/ui/LabelSelect';
import { useClientStore } from '@/stores/clientStore';
import { useLabelStore } from '@/stores/labelStore';
import ClientLabelsDialog from '@/components/clients/ClientLabelsDialog';
import ClientModal from '@/components/clients/ClientModal';
import ClientHistoryModal from '@/components/clients/ClientHistoryModal';
import clsx from 'clsx';
import { Client } from '@/types';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const { clients, isLoading: clientsLoading, meta, fetchClients, deleteClient } = useClientStore();
  const { labels, fetchLabels } = useLabelStore();

  const [search, setSearch] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  // Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // History Modal State
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  // Labels Dialog State
  const [isLabelsDialogOpen, setIsLabelsDialogOpen] = useState(false);

  useEffect(() => {
    // Use label_id for filtering
    fetchClients({ page, search, label_id: selectedLabel });
  }, [page, search, selectedLabel, fetchClients]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Client Handlers
  const handleCreateClient = () => {
    setEditingClient(null);
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsClientModalOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      await deleteClient(id);
      toast.success('Cliente eliminado correctamente');
    }
  };

  const handleViewHistory = (client: Client) => {
    setHistoryClient(client);
  };

  const handleRefresh = () => {
    fetchClients({ page, search, label_id: selectedLabel });
    fetchLabels();
    toast.success('Lista actualizada');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-8 h-8 text-emerald-500" />
            Gestión de Clientes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra tu base de clientes, historial y etiquetas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="hidden sm:flex"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </Button>
          <Button onClick={handleCreateClient} className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-[#161A22] p-1 mb-6 max-w-md border border-gray-200 dark:border-[#232834]">
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
                selected
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-[#1E2230] dark:text-white ring-1 ring-black/5 dark:ring-white/5'
                  : 'text-gray-500 hover:bg-white/[0.5] hover:text-gray-700 dark:text-gray-400 dark:hover:bg-[#1E2230]/50 dark:hover:text-gray-200'
              )
            }
          >
            Listado de Clientes
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
                selected
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-[#1E2230] dark:text-white ring-1 ring-black/5 dark:ring-white/5'
                  : 'text-gray-500 hover:bg-white/[0.5] hover:text-gray-700 dark:text-gray-400 dark:hover:bg-[#1E2230]/50 dark:hover:text-gray-200'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              <TagIcon className="w-4 h-4" />
              Etiquetas
            </div>
          </Tab>
        </Tab.List>

        <Tab.Panels>
          {/* Client List Panel */}
          <Tab.Panel className="focus:outline-none">
            <div className="bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-[#232834] overflow-visible"> {/* overflow-visible for dropdown */}
              {/* Filters Bar */}
              <div className="p-4 border-b border-gray-100 dark:border-[#232834] bg-gray-50/50 dark:bg-[#161A22]/50">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-[#232834] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all sm:text-sm"
                      placeholder="Buscar por nombre, documento o email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Label Filter */}
                  <div className="w-full sm:w-[240px]">
                    <LabelSelect
                      labels={labels}
                      value={selectedLabel}
                      onChange={setSelectedLabel}
                      placeholder="Filtrar por etiqueta"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto min-h-[400px]"> {/* min-h prevents dropdown cut-off on small lists */}
                <table className="min-w-full divide-y divide-gray-100 dark:divide-[#232834]">
                  <thead className="bg-gray-50 dark:bg-[#161A22]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Documento</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Etiquetas</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contacto</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-black divide-y divide-gray-100 dark:divide-[#232834]">
                    {clientsLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Cargando clientes...</p>
                          </div>
                        </td>
                      </tr>
                    ) : clients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-[#1E2230] rounded-full flex items-center justify-center mb-4">
                              <UsersIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No se encontraron clientes</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                              Intenta ajustar los filtros de búsqueda o crea un nuevo cliente.
                            </p>
                            <Button onClick={handleCreateClient} variant="outline" size="sm">
                              Crear Cliente
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => (
                        <tr key={client.id} className="group hover:bg-gray-50 dark:hover:bg-[#161A22]/60 transition-colors duration-150 relative">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm ring-2 ring-white dark:ring-[#1E2230]">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{client.name}</div>
                                {client.trade_name && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                    <span className="truncate">{client.trade_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                                {client.document_type}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-200 font-mono">
                                {client.document_number}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                              {client.labels && client.labels.length > 0 ? (
                                client.labels.map(label => (
                                  <span
                                    key={label.id}
                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-transparent"
                                    style={{
                                      backgroundColor: `${label.color}15`,
                                      color: label.color,
                                      borderColor: `${label.color}30`
                                    }}
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shadow-sm"
                                      style={{ backgroundColor: label.color }}
                                    />
                                    {label.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400 italic">Sin etiquetas</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              {client.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50"></span>
                                  {client.email}
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50"></span>
                                  {client.phone}
                                </div>
                              )}
                              {!client.email && !client.phone && (
                                <span className="text-xs text-gray-400 italic">No disponible</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {/* Desktop Actions */}
                            <div className="hidden md:flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewHistory(client)}
                                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Historial de Compras"
                              >
                                <ClockIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleEditClient(client)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Editar cliente"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Eliminar cliente"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>

                            {/* Mobile Actions Dropdown */}
                            <div className="md:hidden">
                              <Menu as="div" className="relative inline-block text-left z-10">
                                <Menu.Button className="p-2 text-gray-400 hover:text-emerald-500 rounded-full hover:bg-gray-100 dark:hover:bg-[#1E2230] transition-colors focus:outline-none">
                                  <EllipsisVerticalIcon className="w-5 h-5" />
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
                                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-[#161A22] shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-none z-50 overflow-hidden divide-y divide-gray-100 dark:divide-[#232834]">
                                    <div className="px-1 py-1">
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => handleViewHistory(client)}
                                            className={clsx(
                                              'group flex w-full items-center rounded-lg px-2 py-2 text-sm',
                                              active ? 'bg-emerald-500/10 text-emerald-500' : 'text-gray-700 dark:text-gray-300'
                                            )}
                                          >
                                            <ClockIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                                            Historial de Compras
                                          </button>
                                        )}
                                      </Menu.Item>
                                    </div>
                                    <div className="px-1 py-1">
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => handleEditClient(client)}
                                            className={clsx(
                                              'group flex w-full items-center rounded-lg px-2 py-2 text-sm',
                                              active ? 'bg-blue-500/10 text-blue-500' : 'text-gray-700 dark:text-gray-300'
                                            )}
                                          >
                                            <PencilIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                                            Editar
                                          </button>
                                        )}
                                      </Menu.Item>
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => handleDeleteClient(client.id)}
                                            className={clsx(
                                              'group flex w-full items-center rounded-lg px-2 py-2 text-sm',
                                              active ? 'bg-red-500/10 text-red-500' : 'text-gray-700 dark:text-gray-300'
                                            )}
                                          >
                                            <TrashIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                                            Eliminar
                                          </button>
                                        )}
                                      </Menu.Item>
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
                <div className="px-6 py-4 border-t border-gray-100 dark:border-[#232834] bg-gray-50/50 dark:bg-[#161A22]/50 flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando <span className="font-medium text-gray-900 dark:text-white">{meta.from}</span> - <span className="font-medium text-gray-900 dark:text-white">{meta.to}</span> de <span className="font-medium text-gray-900 dark:text-white">{meta.total}</span> resultados
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="bg-white dark:bg-[#0D1117]"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page === (meta.last_page || 1)}
                      className="bg-white dark:bg-[#0D1117]"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* Labels Tab */}
          <Tab.Panel className="focus:outline-none">
            <div className="bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-[#232834] p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Etiquetas de Clientes</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Organiza tus clientes usando etiquetas personalizadas para segmentación marketing.
                  </p>
                </div>
                <Button onClick={() => setIsLabelsDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nueva Etiqueta
                </Button>
              </div>

              {labels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className="group relative p-5 rounded-2xl border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#161A22] hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner"
                          style={{ backgroundColor: `${label.color}15` }}
                        >
                          <TagIcon className="w-6 h-6" style={{ color: label.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#161A22]"
                              style={{ backgroundColor: label.color }}
                            />
                            <h4 className="font-bold text-gray-900 dark:text-white truncate text-base">
                              {label.name}
                            </h4>
                          </div>
                          {label.description ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5em]">
                              {label.description}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 italic min-h-[2.5em]">Sin descripción</p>
                          )}

                          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#232834] flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#0D1117] px-2 py-1 rounded-md">
                              {label.clients_count || 0} clientes
                            </span>
                            <button
                              onClick={() => setIsLabelsDialogOpen(true)}
                              className="text-xs text-emerald-500 hover:text-emerald-400 font-medium hover:underline cursor-pointer"
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 dark:bg-[#161A22]/30 rounded-2xl border border-dashed border-gray-300 dark:border-[#232834]">
                  <div className="w-16 h-16 bg-white dark:bg-[#1E2230] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <TagIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No hay etiquetas creadas</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                    Crea etiquetas para clasificar a tus clientes (ej. VIP, Mayorista, Nuevo).
                  </p>
                  <Button onClick={() => setIsLabelsDialogOpen(true)} variant="outline">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Crear primera etiqueta
                  </Button>
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modals */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        client={editingClient}
      />

      <ClientLabelsDialog
        isOpen={isLabelsDialogOpen}
        onClose={() => setIsLabelsDialogOpen(false)}
      />

      <ClientHistoryModal
        isOpen={!!historyClient}
        onClose={() => setHistoryClient(null)}
        client={historyClient}
      />
    </div>
  );
}

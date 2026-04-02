'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { Button, Badge, Card, Modal, Input } from '@/components/ui';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface DispatchGuide {
  id: string;
  series: string;
  correlative: number;
  type: 'REMITENTE' | 'TRANSPORTISTA';
  issue_date: string;
  transfer_start_date: string;
  transfer_reason: string;
  transfer_description?: string;
  origin_address: string;
  origin_ubigeo: string;
  destination_address: string;
  destination_ubigeo: string;
  transport_mode: '01' | '02'; // 01=privado, 02=público
  gross_weight?: number;
  vehicle_plate?: string;
  driver_name?: string;
  driver_document_number?: string;
  driver_license?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  sunat_response?: any;
  client?: {
    id: string;
    name?: string;
    business_name?: string;
    document_type: string;
    document_number: string;
  };
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const STATUS_CONFIG = {
  draft: { variant: 'secondary' as const, label: 'Borrador', icon: DocumentTextIcon },
  sent: { variant: 'info' as const, label: 'Enviada', icon: ArrowPathIcon },
  accepted: { variant: 'success' as const, label: 'Aceptada', icon: CheckCircleIcon },
  rejected: { variant: 'danger' as const, label: 'Rechazada', icon: XCircleIcon },
};

const TRANSFER_REASONS: Record<string, string> = {
  '01': 'Venta',
  '02': 'Compra',
  '04': 'Traslado entre establecimientos',
  '08': 'Importación',
  '09': 'Exportación',
  '13': 'Otros',
  '14': 'Venta sujeta a confirmación',
  '18': 'Traslado emisor itinerante CP',
  '19': 'Traslado a zona primaria',
};

const TRANSPORT_MODES: Record<string, string> = {
  '01': 'Transporte privado',
  '02': 'Transporte público',
};

const EMPTY_FORM = {
  client_id: '',
  type: 'REMITENTE' as const,
  transfer_start_date: '',
  transfer_reason: '01',
  transfer_description: '',
  origin_address: '',
  origin_ubigeo: '',
  destination_address: '',
  destination_ubigeo: '',
  transport_mode: '01' as const,
  gross_weight: '',
  vehicle_plate: '',
  driver_name: '',
  driver_document_type: 'DNI',
  driver_document_number: '',
  driver_license: '',
};

export default function DispatchGuidesPage() {
  const { currentCompany } = useAuthStore();
  const [guides, setGuides] = useState<DispatchGuide[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<DispatchGuide | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const fetchGuides = useCallback(async () => {
    if (!currentCompany) return;
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page: currentPage, per_page: 15 };
      if (statusFilter) params['filter[status]'] = statusFilter;

      const res = await api.get(`/companies/${currentCompany.id}/dispatch-guides`, { params });
      const data = res.data;
      setGuides(data.data || []);
      setMeta(data.meta || null);
    } catch {
      toast.error('Error al cargar guías de remisión');
      setGuides([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, currentPage, statusFilter]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const handleViewDetail = async (guide: DispatchGuide) => {
    try {
      const res = await api.get(`/companies/${currentCompany!.id}/dispatch-guides/${guide.id}`);
      setSelectedGuide(res.data.data || guide);
    } catch {
      setSelectedGuide(guide);
    }
    setShowDetailModal(true);
  };

  const handleCreate = async () => {
    if (!currentCompany) return;
    if (!form.transfer_start_date || !form.origin_address || !form.destination_address) {
      toast.error('Completa los campos requeridos');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        type: form.type,
        transfer_start_date: form.transfer_start_date,
        transfer_reason: form.transfer_reason,
        transfer_description: form.transfer_description || undefined,
        origin_address: form.origin_address,
        origin_ubigeo: form.origin_ubigeo || '150101',
        destination_address: form.destination_address,
        destination_ubigeo: form.destination_ubigeo || '150101',
        transport_mode: form.transport_mode,
        gross_weight: form.gross_weight ? parseFloat(form.gross_weight) : undefined,
        vehicle_plate: form.vehicle_plate || undefined,
        driver_name: form.driver_name || undefined,
        driver_document_type: form.driver_document_type || undefined,
        driver_document_number: form.driver_document_number || undefined,
        driver_license: form.driver_license || undefined,
        items: [{ product_id: 'placeholder', quantity: 1 }], // Mínimo requerido
      };
      if (form.client_id) payload.client_id = form.client_id;

      await api.post(`/companies/${currentCompany.id}/dispatch-guides`, payload);
      toast.success('Guía de remisión creada exitosamente');
      setShowCreateModal(false);
      setForm(EMPTY_FORM);
      fetchGuides();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear guía');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = guides.filter((g) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const fullNum = `${g.series}-${g.correlative}`.toLowerCase();
    return (
      fullNum.includes(s) ||
      g.client?.name?.toLowerCase().includes(s) ||
      g.client?.business_name?.toLowerCase().includes(s) ||
      g.destination_address.toLowerCase().includes(s)
    );
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getStatusBadge = (status: DispatchGuide['status']) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} size="sm">
        <Icon className="w-3 h-3 mr-1" />
        {cfg.label}
      </Badge>
    );
  };

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guías de Remisión</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona el traslado de bienes según normativa SUNAT
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => fetchGuides()} variant="secondary">
            <ArrowPathIcon className={clsx('w-5 h-5 mr-2', isLoading && 'animate-spin')} />
            Actualizar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Nueva Guía
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = guides.filter((g) => g.status === key).length;
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'p-2 rounded-lg',
                  key === 'accepted' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                  key === 'draft' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' :
                  key === 'sent' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-500' :
                  'bg-red-100 dark:bg-red-900/20 text-red-500'
                )}>
                  <cfg.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{cfg.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{count}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número, cliente o destino..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <FunnelIcon className="w-5 h-5" />
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
              >
                <option value="">Todos</option>
                <option value="draft">Borrador</option>
                <option value="sent">Enviada</option>
                <option value="accepted">Aceptada</option>
                <option value="rejected">Rechazada</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-black">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Destinatario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fecha Traslado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Destino</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Motivo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-zinc-700 rounded w-20"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <TruckIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron guías de remisión</p>
                    <p className="text-sm text-gray-400 mt-1">Crea una nueva guía para registrar un traslado</p>
                  </td>
                </tr>
              ) : (
                filtered.map((guide) => (
                  <tr key={guide.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <TruckIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                          {guide.series}-{String(guide.correlative).padStart(8, '0')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{guide.type}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-900 dark:text-white">
                        {guide.client?.name || guide.client?.business_name || 'Sin destinatario'}
                      </p>
                      {guide.client?.document_number && (
                        <p className="text-xs text-gray-500">{guide.client.document_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(guide.transfer_start_date)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-1">
                        <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {guide.destination_address}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {TRANSFER_REASONS[guide.transfer_reason] || guide.transfer_reason}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(guide.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(guide)}
                          className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
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
            <p className="text-sm text-gray-500">
              Mostrando {((currentPage - 1) * meta.per_page) + 1}–{Math.min(currentPage * meta.per_page, meta.total)} de {meta.total}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Anterior
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.min(meta.last_page, p + 1))} disabled={currentPage === meta.last_page}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedGuide(null); }}
        title={selectedGuide ? `Guía ${selectedGuide.series}-${String(selectedGuide.correlative).padStart(8, '0')}` : 'Detalle'}
        size="lg"
      >
        {selectedGuide && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-black rounded-lg">
                <p className="text-xs text-gray-500 uppercase mb-2">Información General</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo</span>
                    <span className="text-gray-900 dark:text-white">{selectedGuide.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Motivo</span>
                    <span className="text-gray-900 dark:text-white">{TRANSFER_REASONS[selectedGuide.transfer_reason] || selectedGuide.transfer_reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha inicio</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(selectedGuide.transfer_start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transporte</span>
                    <span className="text-gray-900 dark:text-white">{TRANSPORT_MODES[selectedGuide.transport_mode]}</span>
                  </div>
                  {selectedGuide.gross_weight && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Peso bruto</span>
                      <span className="text-gray-900 dark:text-white">{selectedGuide.gross_weight} kg</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-black rounded-lg">
                <p className="text-xs text-gray-500 uppercase mb-2">Conductor / Vehículo</p>
                <div className="space-y-2 text-sm">
                  {selectedGuide.vehicle_plate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Placa</span>
                      <span className="font-mono text-gray-900 dark:text-white">{selectedGuide.vehicle_plate}</span>
                    </div>
                  )}
                  {selectedGuide.driver_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Conductor</span>
                      <span className="text-gray-900 dark:text-white">{selectedGuide.driver_name}</span>
                    </div>
                  )}
                  {selectedGuide.driver_document_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Doc. Conductor</span>
                      <span className="text-gray-900 dark:text-white">{selectedGuide.driver_document_number}</span>
                    </div>
                  )}
                  {selectedGuide.driver_license && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Licencia</span>
                      <span className="text-gray-900 dark:text-white">{selectedGuide.driver_license}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 dark:border-[#232834] rounded-lg">
                <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" /> Punto de Partida
                </p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedGuide.origin_address}</p>
                <p className="text-xs text-gray-500 mt-1">Ubigeo: {selectedGuide.origin_ubigeo}</p>
              </div>
              <div className="p-4 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-lg">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" /> Punto de Llegada
                </p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedGuide.destination_address}</p>
                <p className="text-xs text-gray-500 mt-1">Ubigeo: {selectedGuide.destination_ubigeo}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black rounded-lg">
              <span className="text-sm text-gray-500">Estado SUNAT</span>
              {getStatusBadge(selectedGuide.status)}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setForm(EMPTY_FORM); }}
        title="Nueva Guía de Remisión"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo *</label>
              <select
                value={form.type}
                onChange={(e) => setField('type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
              >
                <option value="REMITENTE">Remitente</option>
                <option value="TRANSPORTISTA">Transportista</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo de Traslado *</label>
              <select
                value={form.transfer_reason}
                onChange={(e) => setField('transfer_reason', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
              >
                {Object.entries(TRANSFER_REASONS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Inicio Traslado *</label>
              <input
                type="date"
                value={form.transfer_start_date}
                onChange={(e) => setField('transfer_start_date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modo de Transporte *</label>
              <select
                value={form.transport_mode}
                onChange={(e) => setField('transport_mode', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
              >
                <option value="01">Transporte privado</option>
                <option value="02">Transporte público</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-[#232834] pt-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ruta</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección de Origen *</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Industrial 123, Lima"
                  value={form.origin_address}
                  onChange={(e) => setField('origin_address', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubigeo Origen *</label>
                <input
                  type="text"
                  placeholder="Ej: 150101"
                  maxLength={6}
                  value={form.origin_ubigeo}
                  onChange={(e) => setField('origin_ubigeo', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección de Destino *</label>
                <input
                  type="text"
                  placeholder="Ej: Jr. Comercio 456, Callao"
                  value={form.destination_address}
                  onChange={(e) => setField('destination_address', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubigeo Destino *</label>
                <input
                  type="text"
                  placeholder="Ej: 070101"
                  maxLength={6}
                  value={form.destination_ubigeo}
                  onChange={(e) => setField('destination_ubigeo', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-[#232834] pt-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Conductor y Vehículo</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Conductor</label>
                <input
                  type="text"
                  value={form.driver_name}
                  onChange={(e) => setField('driver_name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DNI / Documento</label>
                <input
                  type="text"
                  value={form.driver_document_number}
                  onChange={(e) => setField('driver_document_number', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Placa del Vehículo</label>
                <input
                  type="text"
                  placeholder="Ej: ABC-123"
                  value={form.vehicle_plate}
                  onChange={(e) => setField('vehicle_plate', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso Bruto (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.gross_weight}
                  onChange={(e) => setField('gross_weight', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => { setShowCreateModal(false); setForm(EMPTY_FORM); }}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleCreate} loading={isSaving}>
              <TruckIcon className="w-5 h-5 mr-2" />
              Crear Guía
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

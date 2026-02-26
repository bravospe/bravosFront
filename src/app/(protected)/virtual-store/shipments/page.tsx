'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  TruckIcon,
  PrinterIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useShippingStore } from '@/stores/shippingStore';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'label_generated', label: 'Etiqueta generada' },
  { value: 'pickup_scheduled', label: 'Recojo programado' },
  { value: 'picked_up', label: 'Recogido' },
  { value: 'in_transit', label: 'En transito' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'failed', label: 'Fallido' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  label_generated: 'bg-emerald-100 text-blue-800 dark:bg-emerald-500/10 dark:text-emerald-400',
  pickup_scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  picked_up: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  in_transit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  out_for_delivery: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  returned: 'bg-gray-100 text-gray-800 dark:bg-black dark:text-gray-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-black dark:text-gray-400',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  label_generated: 'Etiqueta lista',
  pickup_scheduled: 'Recojo programado',
  picked_up: 'Recogido',
  in_transit: 'En transito',
  out_for_delivery: 'En reparto',
  delivered: 'Entregado',
  failed: 'Fallido',
  returned: 'Devuelto',
  cancelled: 'Cancelado',
};

const StoreShipmentsPage = () => {
  const { currentCompany } = useAuthStore();
  const { 
    shipments, 
    fetchShipments, 
    fetchShipmentStats,
    shipmentStats,
    isLoadingShipments, 
    shipmentsPagination,
    generateLabel,
    cancelShipment,
    bulkGenerateLabels,
  } = useShippingStore();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedShipments, setSelectedShipments] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchShipments(currentCompany.id, {
        search,
        status: statusFilter || undefined,
        page: 1,
        per_page: 15,
      });
      fetchShipmentStats(currentCompany.id);
    }
  }, [currentCompany?.id, search, statusFilter, fetchShipments, fetchShipmentStats]);

  const handleGenerateLabel = async (shipmentId: number) => {
    if (!currentCompany?.id) return;
    setIsProcessing(true);
    try {
      await generateLabel(currentCompany.id, shipmentId);
      alert('Etiqueta generada correctamente');
    } catch (error) {
      console.error('Error generating label:', error);
      alert('Error al generar etiqueta');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkGenerateLabels = async () => {
    if (!currentCompany?.id || selectedShipments.length === 0) return;
    setIsProcessing(true);
    try {
      const result = await bulkGenerateLabels(currentCompany.id, selectedShipments);
      alert(`Se generaron ${result.results.filter((r: any) => r.success).length} etiquetas`);
      setSelectedShipments([]);
    } catch (error) {
      console.error('Error generating labels:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelShipment = async (shipmentId: number) => {
    if (!currentCompany?.id) return;
    const reason = prompt('Motivo de cancelacion:');
    if (!reason) return;

    try {
      await cancelShipment(currentCompany.id, shipmentId, reason);
    } catch (error) {
      console.error('Error cancelling shipment:', error);
    }
  };

  const pendingCount = shipments.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {shipmentStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Pendientes', value: shipmentStats.pending, color: 'text-yellow-600' },
            { label: 'Etiqueta lista', value: shipmentStats.label_generated, color: 'text-emerald-500' },
            { label: 'En transito', value: shipmentStats.in_transit, color: 'text-orange-600' },
            { label: 'Entregados', value: shipmentStats.delivered, color: 'text-green-600' },
            { label: 'Fallidos', value: shipmentStats.failed, color: 'text-red-600' },
            { label: 'Devueltos', value: shipmentStats.returned, color: 'text-gray-600' },
            { label: 'Total', value: shipmentStats.total, color: 'text-gray-900 dark:text-white' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-[#0D1117] rounded-lg p-3 border border-gray-200 dark:border-[#1E2230]">
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className={clsx('text-xl font-semibold', stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por numero de tracking o pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          
          {selectedShipments.length > 0 && (
            <button
              onClick={handleBulkGenerateLabels}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <PrinterIcon className="w-4 h-4" />
              Generar etiquetas ({selectedShipments.length})
            </button>
          )}
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-[#1E2230]">
            <thead className="bg-gray-50 dark:bg-[#161A22]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedShipments(shipments.filter(s => s.status === 'pending').map(s => s.id));
                      } else {
                        setSelectedShipments([]);
                      }
                    }}
                    checked={selectedShipments.length > 0 && selectedShipments.length === pendingCount}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tracking
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Pedido
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Destinatario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Courier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
              {isLoadingShipments ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Cargando envios...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <TruckIcon className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    No se encontraron envios
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                    <td className="px-4 py-3">
                      {shipment.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedShipments.includes(shipment.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedShipments([...selectedShipments, shipment.id]);
                            } else {
                              setSelectedShipments(selectedShipments.filter(id => id !== shipment.id));
                            }
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {shipment.tracking_number}
                        </p>
                        {shipment.external_tracking && (
                          <p className="text-xs text-emerald-600 font-mono">
                            {shipment.external_tracking}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {shipment.order?.order_number || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {shipment.recipient_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {shipment.delivery_address}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {shipment.provider?.name || 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          statusColors[shipment.status]
                        )}
                      >
                        {statusLabels[shipment.status] || shipment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-500">
                        {new Date(shipment.created_at).toLocaleDateString('es-PE')}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        
                        {shipment.status === 'pending' && (
                          <button
                            onClick={() => handleGenerateLabel(shipment.id)}
                            disabled={isProcessing}
                            className="p-1.5 text-emerald-500 hover:text-emerald-600"
                            title="Generar etiqueta"
                          >
                            <PrinterIcon className="w-4 h-4" />
                          </button>
                        )}
                        
                        {shipment.label_url && (
                          <a
                            href={shipment.label_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-500 hover:text-emerald-500"
                            title="Descargar etiqueta"
                          >
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          </a>
                        )}
                        
                        {['pending', 'label_generated'].includes(shipment.status) && (
                          <button
                            onClick={() => handleCancelShipment(shipment.id)}
                            className="p-1.5 text-red-500 hover:text-red-600"
                            title="Cancelar envio"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {shipmentsPagination.total > shipmentsPagination.perPage && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#1E2230] flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {shipments.length} de {shipmentsPagination.total} envios
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-gray-300 dark:border-[#232834] rounded hover:bg-gray-50 dark:hover:bg-[#161A22]">
                Anterior
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 dark:border-[#232834] rounded hover:bg-gray-50 dark:hover:bg-[#161A22]">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreShipmentsPage;

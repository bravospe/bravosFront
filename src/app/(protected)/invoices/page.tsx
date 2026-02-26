'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PrinterIcon,
  PaperAirplaneIcon,
  FunnelIcon,
  ArrowPathIcon,
  XMarkIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Button, Input, Badge, Card, Modal } from '@/components/ui';
import { useInvoiceStore, Invoice } from '@/stores/invoiceStore';
import toast from 'react-hot-toast';

const InvoicesPage = () => {
  const {
    invoices,
    isLoading,
    error,
    meta,
    filters,
    currentInvoice,
    fetchInvoices,
    getInvoice,
    setFilters,
    setCurrentInvoice,
    sendToSunat,
    downloadPdf,
    downloadXml,
    downloadCdr,
    sendEmail,
    deleteInvoice,
  } = useInvoiceStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load invoices on mount and filter change
  useEffect(() => {
    fetchInvoices({ page: currentPage });
  }, [fetchInvoices, currentPage, filters]);

  // Filter by tab
  useEffect(() => {
    if (selectedTab === 'all') {
      setFilters({ ...filters, sunat_status: undefined });
    } else {
      setFilters({ ...filters, sunat_status: selectedTab });
    }
    setCurrentPage(1);
  }, [selectedTab]);

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
    setCurrentPage(1);
  };

  const handleViewDetail = async (invoice: Invoice) => {
    try {
      await getInvoice(invoice.id);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Error al cargar detalle');
    }
  };

  const handleSendToSunat = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      await sendToSunat(invoice.id);
      toast.success('Enviado a SUNAT correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar a SUNAT');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      await downloadPdf(invoice.id);
      toast.success('PDF descargado');
    } catch (err: any) {
      toast.error(err.message || 'Error al descargar PDF');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async () => {
    if (!currentInvoice || !emailAddress) return;

    setActionLoading('email');
    try {
      await sendEmail(currentInvoice.id, emailAddress);
      toast.success('Email enviado correctamente');
      setShowEmailModal(false);
      setEmailAddress('');
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar email');
    } finally {
      setActionLoading(null);
    }
  };

  const getSunatStatusBadge = (status: Invoice['sunat_status']) => {
    const config = {
      pending: { variant: 'warning' as const, label: 'Pendiente', icon: ClockIcon },
      sent: { variant: 'info' as const, label: 'Enviado', icon: ArrowPathIcon },
      accepted: { variant: 'success' as const, label: 'Aceptado', icon: CheckCircleIcon },
      rejected: { variant: 'danger' as const, label: 'Rechazado', icon: XCircleIcon },
      annulled: { variant: 'secondary' as const, label: 'Anulado', icon: ExclamationCircleIcon },
    };
    const { variant, label, icon: Icon } = config[status] || config.pending;
    return (
      <Badge variant={variant} size="sm">
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: Invoice['payment_status']) => {
    const config = {
      pending: { variant: 'warning' as const, label: 'Pendiente' },
      partial: { variant: 'info' as const, label: 'Parcial' },
      paid: { variant: 'success' as const, label: 'Pagado' },
    };
    const { variant, label } = config[status] || config.pending;
    return <Badge variant={variant} size="sm">{label}</Badge>;
  };

  const getDocumentTypeLabel = (type: Invoice['document_type']) => {
    const labels: Record<string, string> = {
      '01': 'Factura',
      '03': 'Boleta',
      '07': 'N. Crédito',
      '08': 'N. Débito',
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const tabs = [
    { id: 'all', label: 'Todos', count: meta?.total },
    { id: 'pending', label: 'Pendientes' },
    { id: 'accepted', label: 'Aceptados' },
    { id: 'rejected', label: 'Rechazados' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comprobantes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona facturas, boletas y notas de crédito/débito
          </p>
        </div>
        <Button onClick={() => fetchInvoices({ page: 1 })} variant="secondary">
          <ArrowPathIcon className={clsx("w-5 h-5 mr-2", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-[#232834]">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
              className={clsx(
                'py-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors',
                selectedTab === tab.id
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-[#1E2230]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, serie o número..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <FunnelIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Documento
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                value={filters.document_type || ''}
                onChange={(e) => setFilters({ ...filters, document_type: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                <option value="01">Factura</option>
                <option value="03">Boleta</option>
                <option value="07">Nota de Crédito</option>
                <option value="08">Nota de Débito</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado de Pago
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                value={filters.payment_status || ''}
                onChange={(e) => setFilters({ ...filters, payment_status: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="partial">Parcial</option>
                <option value="paid">Pagado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Desde
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                value={filters.date_from || ''}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hasta
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                value={filters.date_to || ''}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
              />
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Documento
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  SUNAT
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Pago
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-32"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-16 ml-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-20 mx-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-16 mx-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No se encontraron comprobantes
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                    <td className="px-4 py-4">
                      <div>
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 mb-1">
                          {getDocumentTypeLabel(invoice.document_type)}
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {invoice.series}-{invoice.number}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-900 dark:text-white">
                        {invoice.client?.name || invoice.client?.business_name || 'Cliente General'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {invoice.client?.document_number || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900 dark:text-white">
                      S/ {invoice.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getSunatStatusBadge(invoice.sunat_status)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getPaymentStatusBadge(invoice.payment_status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(invoice)}
                          className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(invoice)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          title="Descargar PDF"
                          disabled={actionLoading === invoice.id}
                        >
                          <DocumentArrowDownIcon className="w-5 h-5" />
                        </button>
                        {invoice.sunat_status === 'pending' && (
                          <button
                            onClick={() => handleSendToSunat(invoice)}
                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                            title="Enviar a SUNAT"
                            disabled={actionLoading === invoice.id}
                          >
                            {actionLoading === invoice.id ? (
                              <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            ) : (
                              <PaperAirplaneIcon className="w-5 h-5" />
                            )}
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
        {meta && meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#232834] flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {((currentPage - 1) * meta.per_page) + 1} a {Math.min(currentPage * meta.per_page, meta.total)} de {meta.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(meta.last_page, p + 1))}
                disabled={currentPage === meta.last_page}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setCurrentInvoice(null); }}
        title={currentInvoice ? `${getDocumentTypeLabel(currentInvoice.document_type)} ${currentInvoice.series}-${currentInvoice.number}` : 'Detalle'}
        size="lg"
      >
        {currentInvoice && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-black rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentInvoice.client?.name || currentInvoice.client?.business_name || 'Cliente General'}
                </p>
                <p className="text-sm text-gray-500">
                  {currentInvoice.client?.document_type}: {currentInvoice.client?.document_number}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Fecha de Emisión</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(currentInvoice.issue_date)}
                </p>
                <div className="mt-2 flex justify-end gap-2">
                  {getSunatStatusBadge(currentInvoice.sunat_status)}
                  {getPaymentStatusBadge(currentInvoice.payment_status)}
                </div>
              </div>
            </div>

            {/* Items */}
            {currentInvoice.items && currentInvoice.items.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detalle de Productos</h4>
                <div className="overflow-x-auto border border-gray-200 dark:border-[#232834] rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-black">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Producto</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">Cant.</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">P. Unit.</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                      {currentInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">
                            <p className="text-gray-900 dark:text-white">{item.product_name}</p>
                            <p className="text-xs text-gray-500">{item.product_code}</p>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-gray-900 dark:text-white">S/ {item.unit_price.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">S/ {item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>S/ {currentInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>IGV (18%)</span>
                  <span>S/ {currentInvoice.tax_amount.toFixed(2)}</span>
                </div>
                {currentInvoice.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento</span>
                    <span>-S/ {currentInvoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-[#232834]">
                  <span>Total</span>
                  <span>S/ {currentInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-[#232834]">
              <Button variant="secondary" onClick={() => downloadPdf(currentInvoice.id)}>
                <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                PDF
              </Button>
              <Button variant="secondary" onClick={() => downloadXml(currentInvoice.id)}>
                <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                XML
              </Button>
              {currentInvoice.sunat_status === 'accepted' && (
                <Button variant="secondary" onClick={() => downloadCdr(currentInvoice.id)}>
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  CDR
                </Button>
              )}
              <Button variant="secondary" onClick={() => { setShowEmailModal(true); }}>
                <EnvelopeIcon className="w-5 h-5 mr-2" />
                Enviar Email
              </Button>
              {currentInvoice.sunat_status === 'pending' && (
                <Button onClick={() => handleSendToSunat(currentInvoice)}>
                  <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                  Enviar a SUNAT
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => { setShowEmailModal(false); setEmailAddress(''); }}
        title="Enviar por Email"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="cliente@ejemplo.com"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowEmailModal(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleSendEmail} loading={actionLoading === 'email'} disabled={!emailAddress}>
              <EnvelopeIcon className="w-5 h-5 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InvoicesPage;

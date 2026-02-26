'use client';

import { Modal, Badge, Button } from '@/components/ui';
import type { SaleWithRelations } from '@/stores/salesStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import {
  CalendarDaysIcon,
  UserIcon,
  BanknotesIcon,
  DocumentTextIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleWithRelations | null;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape_plin: 'Yape/Plin',
  credit: 'Crédito',
  mixed: 'Mixto',
};

const SaleDetailModal = ({ isOpen, onClose, sale }: SaleDetailModalProps) => {
  const { downloadPdf } = useInvoiceStore();
  const [isPrinting, setIsPrinting] = useState(false);

  if (!sale) return null;

  const handlePrint = async () => {
    if (sale.invoice) {
      setIsPrinting(true);
      try {
        await downloadPdf(sale.invoice.id);
        toast.success('Descargando comprobante...');
      } catch (error) {
        toast.error('Error al descargar comprobante');
      } finally {
        setIsPrinting(false);
      }
    } else {
      window.print();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `S/ ${Number(amount).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'danger' | 'warning'; label: string }> = {
      completed: { variant: 'success', label: 'Completada' },
      cancelled: { variant: 'danger', label: 'Anulada' },
      pending: { variant: 'warning', label: 'Pendiente' },
    };
    const { variant, label } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Venta"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-black rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <CalendarDaysIcon className="w-4 h-4" />
              <span className="text-sm">Fecha:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(sale.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm">Cliente:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sale.client?.name || 'Cliente General'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm">Vendedor:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sale.seller?.name || '-'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <BanknotesIcon className="w-4 h-4" />
              <span className="text-sm">Método de Pago:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {paymentMethodLabels[sale.payment_method] || sale.payment_method}
              </span>
            </div>
            {sale.invoice && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <DocumentTextIcon className="w-4 h-4" />
                <span className="text-sm">Documento:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {sale.invoice.document_type === '01' ? 'Factura' : 'Boleta'} {sale.invoice.series}-{sale.invoice.correlative}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
              {getStatusBadge(sale.status)}
            </div>
          </div>
        </div>

        {/* Items Table */}
        {sale.items && sale.items.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Productos</h4>
            <div className="overflow-x-auto border border-gray-200 dark:border-[#232834] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-black">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Producto</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Cant.</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">P. Unit.</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <p className="text-gray-900 dark:text-white">{item.description || item.product?.name}</p>
                        <p className="text-xs text-gray-500">{item.code || item.product?.code}</p>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                        {Number(item.quantity).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.total)}
                      </td>
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
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>IGV (18%)</span>
              <span>{formatCurrency(sale.tax_amount)}</span>
            </div>
            {Number(sale.discount_amount) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento</span>
                <span>-{formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-[#232834]">
              <span>Total</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            {sale.payment_method === 'cash' && sale.cash_received && (
              <>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 pt-2">
                  <span>Efectivo recibido</span>
                  <span>{formatCurrency(sale.cash_received)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Vuelto</span>
                  <span>{formatCurrency(sale.change_amount || 0)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Notas:</strong> {sale.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#232834]">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="secondary" onClick={handlePrint} disabled={isPrinting}>
            <PrinterIcon className="w-5 h-5 mr-2" />
            {isPrinting ? 'Procesando...' : 'Imprimir'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SaleDetailModal;

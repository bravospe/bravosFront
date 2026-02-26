import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ShoppingCartIcon, PrinterIcon, EyeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { SaleWithRelations } from '@/stores/salesStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { Client } from '@/types';
import { clsx } from 'clsx';
import SaleDetailModal from '@/components/sales/SaleDetailModal';
import toast from 'react-hot-toast';

interface ClientHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
}

export default function ClientHistoryModal({ isOpen, onClose, client }: ClientHistoryModalProps) {
    const { user } = useAuthStore();
    const { downloadPdf } = useInvoiceStore();
    const [sales, setSales] = useState<SaleWithRelations[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSale, setSelectedSale] = useState<SaleWithRelations | null>(null);
    const [isPrinting, setIsPrinting] = useState<string | null>(null);

    // Fetch sales when modal opens and client is available
    useEffect(() => {
        if (isOpen && client && user) {
            const fetchClientSales = async () => {
                setLoading(true);
                try {
                    const companyId = user.current_company_id || user.companies?.[0]?.id;
                    if (!companyId) return;

                    const response = await api.get(`/companies/${companyId}/sales`, {
                        params: {
                            client_id: client.id,
                            per_page: 50, // Show last 50 sales
                            sort_by: 'created_at',
                            sort_dir: 'desc'
                        }
                    });
                    setSales(response.data.data);
                } catch (error) {
                    console.error('Error fetching client sales:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchClientSales();
        }
    }, [isOpen, client, user]);

    const handlePrint = async (sale: SaleWithRelations) => {
        if (sale.invoice) {
            setIsPrinting(sale.id);
            try {
                await downloadPdf(sale.invoice.id);
                toast.success('Descargando comprobante...');
            } catch (error) {
                toast.error('Error al descargar comprobante');
            } finally {
                setIsPrinting(null);
            }
        } else {
            // For basic tickets / non-invoice sales
            // This would ideally fetch a ticket layout, but window.print() prints the current page
            // which is the modal history list. Not dealing with "Ticket" printing without invoice ID properly yet.
            // Best fallback: Open detail modal and let them print from there or just show toast.
            toast('Esta venta no tiene factura electrónica. Abre el detalle para ver opciones.', {
                icon: 'ℹ️',
            });
            setSelectedSale(sale);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
            pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
            cancelled: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
        };

        const labels = {
            completed: "Completada",
            pending: "Pendiente",
            cancelled: "Anulada"
        };

        return (
            <span className={clsx(
                "px-2 py-1 text-xs font-medium rounded-full",
                styles[status as keyof typeof styles] || styles.pending
            )}>
                {labels[status as keyof typeof styles] || status}
            </span>
        );
    };

    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={onClose}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-black p-6 text-left align-middle shadow-xl transition-all border border-gray-100 dark:border-[#232834]">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                                                <ShoppingCartIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                                                    Historial de Compras
                                                </Dialog.Title>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {client?.name} • {client?.document_number || 'Sin documento'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                                        >
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-[#232834]">
                                        <table className="min-w-full divide-y divide-gray-100 dark:divide-[#232834]">
                                            <thead className="bg-gray-50 dark:bg-[#161A22]">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comprobante</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Método</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-[#0D1117] divide-y divide-gray-100 dark:divide-[#232834]">
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                                <span className="text-sm text-gray-500">Cargando historial...</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : sales.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center">
                                                            <p className="text-gray-500 dark:text-gray-400 text-sm">Este cliente no tiene compras registradas.</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    sales.map((sale) => (
                                                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                                                                        {format(new Date(sale.created_at), 'dd MMM yyyy', { locale: es })}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {format(new Date(sale.created_at), 'HH:mm', { locale: es })}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {sale.invoice ? (
                                                                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                                                                        {sale.invoice.series}-{sale.invoice.correlative}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 italic">Ticket</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                                                                    {sale.payment_method === 'yape_plin' ? 'Yape/Plin' : sale.payment_method}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                                    {formatCurrency(sale.total)}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                {getStatusBadge(sale.status)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => setSelectedSale(sale)}
                                                                        className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                                        title="Ver detalle"
                                                                    >
                                                                        <EyeIcon className="w-5 h-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handlePrint(sale)}
                                                                        disabled={isPrinting === sale.id}
                                                                        className={clsx(
                                                                            "p-1.5 rounded-lg transition-colors",
                                                                            isPrinting === sale.id
                                                                                ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 cursor-wait"
                                                                                : "text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                                                        )}
                                                                        title="Imprimir comprobante"
                                                                    >
                                                                        {isPrinting === sale.id ? (
                                                                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                                        ) : (
                                                                            <PrinterIcon className="w-5 h-5" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-xl bg-gray-100 dark:bg-[#1E2230] px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                                            onClick={onClose}
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Sale Detail Modal */}
            <SaleDetailModal
                isOpen={!!selectedSale}
                onClose={() => setSelectedSale(null)}
                sale={selectedSale}
            />
        </>
    );
}

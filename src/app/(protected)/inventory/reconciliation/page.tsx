'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProductStore } from '@/stores/productStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Button, Card, Table, Badge, Spinner, Alert } from '@/components/ui';
import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    ArrowPathIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function InventoryReconciliationPage() {
    const { products, fetchProducts, isLoading: productsLoading } = useProductStore();
    const { reconcileInitialStock, isLoading: inventoryLoading, adjustments, fetchAdjustments } = useInventoryStore();
    
    const [isReconciling, setIsReconciling] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

    useEffect(() => {
        // Fetch products (limit per_page for initial check, ideally fetch all for reconciliation)
        fetchProducts({ per_page: 100 });
        fetchAdjustments({ per_page: 1000 }); // Try to get existing initial adjustments
    }, [fetchProducts, fetchAdjustments]);

    const initialAdjustments = useMemo(() => {
        return new Set(adjustments.filter(a => a.reason === 'initial').map(a => a.product_id));
    }, [adjustments]);

    const productsToReconcile = useMemo(() => {
        return products.filter(p => p.stock > 0 && !initialAdjustments.has(p.id));
    }, [products, initialAdjustments]);

    const handleReconcile = async () => {
        if (productsToReconcile.length === 0) {
            toast.error('No hay productos pendientes de conciliación');
            return;
        }

        if (!confirm(`¿Estás seguro de que deseas conciliar ${productsToReconcile.length} productos? Esto creará registros de Stock Inicial en el Kardex.`)) {
            return;
        }

        setIsReconciling(true);
        try {
            const res = await reconcileInitialStock(productsToReconcile);
            setResult(res);
            toast.success(`Conciliación finalizada: ${res.success} exitosos, ${res.failed} fallidos`);
            // Refresh
            fetchProducts({ per_page: 100 });
            fetchAdjustments({ per_page: 1000 });
        } catch (error) {
            toast.error('Error durante la conciliación');
        } finally {
            setIsReconciling(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conciliación de Inventario</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Asegura que el stock actual tenga un registro histórico de "Saldo Inicial" en el Kardex.
                    </p>
                </div>
                <Button 
                    onClick={handleReconcile} 
                    disabled={isReconciling || productsToReconcile.length === 0 || productsLoading}
                    className="flex items-center gap-2"
                >
                    {isReconciling ? (
                        <Spinner size="sm" />
                    ) : (
                        <ArrowPathIcon className="w-4 h-4" />
                    )}
                    Conciliar Todo ({productsToReconcile.length})
                </Button>
            </div>

            {result && (
                <Alert variant={result.failed === 0 ? 'success' : 'warning'}>
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        <div>
                            <p className="font-medium">Proceso completado</p>
                            <p className="text-sm">Exitosos: {result.success} | Fallidos: {result.failed}</p>
                        </div>
                    </div>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Productos</p>
                            <p className="text-2xl font-bold">{products.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
                            <p className="text-2xl font-bold text-yellow-600">{productsToReconcile.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Conciliados</p>
                            <p className="text-2xl font-bold text-green-600">
                                {products.length - productsToReconcile.length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-sm font-medium">Productos Pendientes de Registro Inicial</h3>
                </div>
                <Table
                    loading={productsLoading}
                    data={productsToReconcile}
                    keyExtractor={(p) => p.id}
                    emptyMessage="Todos los productos tienen registro inicial."
                    columns={[
                        { 
                            key: 'code', 
                            header: 'Código',
                            render: (p) => <span className="font-mono text-xs">{p.code}</span>
                        },
                        { 
                            key: 'name', 
                            header: 'Producto',
                            render: (p) => <span className="text-sm">{p.name}</span>
                        },
                        { 
                            key: 'stock', 
                            header: 'Stock Actual',
                            align: 'right',
                            render: (p) => <span className="font-bold">{p.stock}</span>
                        },
                        { 
                            key: 'status', 
                            header: 'Estado',
                            align: 'center',
                            render: () => <Badge variant="warning">Sin registro inicial</Badge>
                        }
                    ]}
                />
            </Card>
        </div>
    );
}

'use client';

import UnitsManager from '@/components/products/UnitsManager';

export default function ProductUnitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unidades de Medida</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gestiona las unidades de medida que utilizas para tus productos
        </p>
      </div>
      
      <UnitsManager />
    </div>
  );
}

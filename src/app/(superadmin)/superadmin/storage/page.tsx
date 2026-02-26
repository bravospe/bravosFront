'use client';

import { useState, useEffect } from 'react';
import {
  ServerIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button, Badge } from '@/components/ui';
import clsx from 'clsx';

// Placeholder type
interface CompanyStorageSummary {
  id: string;
  name: string;
  ruc: string;
  plan: string;
  used_bytes: number;
  limit_bytes: number;
  file_count: number;
  percentage: number;
}

const StorageManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<CompanyStorageSummary[]>([]);

  // Mock data for now
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCompanies([
        {
          id: '1',
          name: 'Empresa Demo SAC',
          ruc: '20100000001',
          plan: 'Empresarial',
          used_bytes: 524288000, // 500MB
          limit_bytes: 10737418240, // 10GB
          file_count: 150,
          percentage: 5,
        },
        {
          id: '2',
          name: 'Bodega Juanito',
          ruc: '10456789012',
          plan: 'Básico',
          used_bytes: 943718400, // 900MB
          limit_bytes: 1073741824, // 1GB
          file_count: 850,
          percentage: 88,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 ring-red-600/20';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 ring-yellow-600/20';
    return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 ring-green-600/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ServerIcon className="h-8 w-8 text-emerald-500" />
            Gestión de Almacenamiento
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitoreo de uso de disco por empresa
          </p>
        </div>
        <Button onClick={() => window.location.reload()} disabled={loading}>
          <ArrowPathIcon className={clsx("h-5 w-5 mr-2", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white dark:bg-[#0D1117] overflow-hidden shadow rounded-lg border border-gray-200 dark:border-[#1E2230]">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ServerIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Usado</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">1.4 GB</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0D1117] overflow-hidden shadow rounded-lg border border-gray-200 dark:border-[#1E2230]">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cerca del Límite</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">1 Empresa</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white dark:bg-[#0D1117] p-4 rounded-lg shadow border border-gray-200 dark:border-[#1E2230]">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 rounded-md border-gray-300 dark:border-[#232834] dark:bg-black dark:text-white focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0D1117] shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-[#1E2230]">
            <thead className="bg-gray-50 dark:bg-[#161A22]">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                  Empresa
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Plan
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Uso
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Archivos
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Estado
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230] bg-white dark:bg-[#0D1117]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Cargando datos...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="font-medium text-gray-900 dark:text-white">{company.name}</div>
                      <div className="text-gray-500 dark:text-gray-400">{company.ruc}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <Badge variant="secondary">{company.plan}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-full max-w-xs">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{formatBytes(company.used_bytes)}</span>
                          <span className="text-gray-400">de {formatBytes(company.limit_bytes)}</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-[#1E2230] rounded-full overflow-hidden">
                          <div
                            className={clsx("h-full rounded-full transition-all", 
                              company.percentage >= 90 ? "bg-red-500" : 
                              company.percentage >= 70 ? "bg-yellow-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(company.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {company.file_count}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={clsx(
                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                        getPercentageColor(company.percentage)
                      )}>
                        {company.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button className="text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StorageManagementPage;

'use client';

import { Fragment, useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { getApiUrl } from '@/utils/apiConfig';

const API_URL = getApiUrl();

interface PreviewRow {
  row: number;
  action: 'create' | 'update';
  codigo: string;
  nombre: string;
  categoria: string;
  marca: string;
  precio_compra: string;
  precio_venta: string;
  tipo_impuesto: string;
  es_servicio: boolean;
  errors: string[];
  warnings: string[];
  [key: string]: any;
}

interface PreviewSummary {
  total: number;
  creates: number;
  updates: number;
  errors: number;
  warnings: number;
  can_import: boolean;
}

type Step = 'upload' | 'preview' | 'done';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

// ─── Indeterminate checkbox ───────────────────────────────────────────────────
function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white accent-gray-900 dark:accent-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

export default function ProductImportModal({ isOpen, onClose, onImported }: Props) {
  const { user, token } = useAuthStore();
  const companyId = user?.current_company_id || user?.companies?.[0]?.id;

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<PreviewSummary | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState<{ created: number; updated: number; failed: number; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Valid rows (no errors) — these are the only ones that can be selected
  const importableRows = rows.filter(r => r.errors.length === 0);
  const importableKeys = importableRows.map(r => r.row);

  const allSelected   = importableKeys.length > 0 && importableKeys.every(k => selectedRows.has(k));
  const noneSelected  = importableKeys.every(k => !selectedRows.has(k));
  const someSelected  = !allSelected && !noneSelected;
  const selectedCount = importableKeys.filter(k => selectedRows.has(k)).length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(importableKeys));
    }
  };

  const toggleRow = (key: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setError('');
    setRows([]);
    setSummary(null);
    setSelectedRows(new Set());
    setImportResult(null);
    setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Drag & drop ──
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, []);

  const handleFileSelect = (f: File) => {
    const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel', 'text/csv', 'application/csv'];
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(f.type) && !['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      setError('Solo se permiten archivos .xlsx, .xls o .csv');
      return;
    }
    if (f.size > 5 * 1024 * 1024) { setError('El archivo no debe superar 5 MB'); return; }
    setFile(f);
    setError('');
  };

  // ── Download template ──
  const downloadTemplate = async () => {
    try {
      const res = await axios.get(`${API_URL}/companies/${companyId}/products/import/template`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'plantilla_productos.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Error al descargar la plantilla'); }
  };

  // ── Step 1 → 2: preview ──
  const handlePreview = async () => {
    if (!file || !companyId) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post(
        `${API_URL}/companies/${companyId}/products/import/preview`,
        form,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      const previewRows: PreviewRow[] = res.data.rows;
      setRows(previewRows);
      setSummary(res.data.summary);
      // Auto-select all importable rows
      setSelectedRows(new Set(previewRows.filter(r => r.errors.length === 0).map(r => r.row)));
      setStep('preview');
    } catch (e: any) {
      setError(e.response?.data?.error ?? e.response?.data?.message ?? 'Error al analizar el archivo');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 → 3: import ──
  const handleImport = async () => {
    if (!companyId || selectedCount === 0) return;
    const toImport = rows.filter(r => selectedRows.has(r.row));
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        `${API_URL}/companies/${companyId}/products/import`,
        { rows: toImport },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImportResult(res.data);
      setStep('done');
      onImported();
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Error durante la importación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl bg-white dark:bg-[#0D1117] rounded-xl shadow-2xl border border-gray-200 dark:border-[#232834] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#232834]">
                  <div className="flex items-center gap-3">
                    {step !== 'upload' && step !== 'done' && (
                      <button onClick={() => setStep('upload')}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" />
                      </button>
                    )}
                    <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">
                      Importar productos
                    </Dialog.Title>
                    {/* Steps */}
                    <div className="hidden sm:flex items-center gap-1.5 ml-2">
                      {(['upload', 'preview', 'done'] as Step[]).map((s, i) => (
                        <Fragment key={s}>
                          <span className={clsx(
                            'w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center',
                            step === s ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : (i < (['upload', 'preview', 'done'] as Step[]).indexOf(step))
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-[#232834] text-gray-500 dark:text-gray-400'
                          )}>
                            {i < (['upload', 'preview', 'done'] as Step[]).indexOf(step) ? '✓' : i + 1}
                          </span>
                          {i < 2 && <div className="w-8 h-px bg-gray-200 dark:bg-[#232834]" />}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5">

                  {/* ── STEP 1: Upload ── */}
                  {step === 'upload' && (
                    <div className="space-y-5">
                      {/* Download template */}
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#232834]">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Plantilla de importación</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Descarga el formato Excel con todas las columnas requeridas y un ejemplo.
                          </p>
                        </div>
                        <button onClick={downloadTemplate}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#0D1117] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232834] transition-colors whitespace-nowrap">
                          <DocumentArrowDownIcon className="w-4 h-4" />
                          Descargar plantilla
                        </button>
                      </div>

                      {/* Drop zone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={clsx(
                          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors',
                          dragging ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-[#1E2230]'
                            : file ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                              : 'border-gray-300 dark:border-[#232834] hover:border-gray-400 dark:hover:border-gray-500'
                        )}
                      >
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                        {file ? (
                          <>
                            <CheckCircleSolid className="w-10 h-10 text-green-500" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {(file.size / 1024).toFixed(1)} KB — Haz clic para cambiar
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <CloudArrowUpIcon className="w-10 h-10 text-gray-400" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Arrastra tu archivo aquí o <span className="text-gray-900 dark:text-white underline">selecciona</span>
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Excel (.xlsx, .xls) o CSV — máximo 5 MB</p>
                            </div>
                          </>
                        )}
                      </div>

                      {error && (
                        <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                          <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" /> {error}
                        </p>
                      )}

                      <div className="flex justify-end">
                        <button onClick={handlePreview} disabled={!file || loading}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          {loading ? (
                            <><div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin" /> Analizando...</>
                          ) : 'Analizar archivo →'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 2: Preview ── */}
                  {step === 'preview' && summary && (
                    <div className="space-y-4">
                      {/* Summary cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { label: 'Total filas', value: summary.total, color: 'gray' },
                          { label: 'A crear', value: summary.creates, color: 'blue' },
                          { label: 'A actualizar', value: summary.updates, color: 'amber' },
                          { label: 'Con errores', value: summary.errors, color: 'red' },
                          { label: 'Advertencias', value: summary.warnings, color: 'orange' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className={clsx(
                            'p-3 rounded-lg border text-center',
                            color === 'red' && value > 0 ? 'border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10'
                              : color === 'orange' && value > 0 ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10'
                                : 'border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#1E2230]'
                          )}>
                            <p className={clsx('text-2xl font-bold',
                              color === 'red' && value > 0 ? 'text-red-600 dark:text-red-400'
                                : color === 'orange' && value > 0 ? 'text-amber-600 dark:text-amber-400'
                                  : color === 'blue' ? 'text-blue-600 dark:text-blue-400'
                                    : color === 'amber' ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-gray-900 dark:text-white'
                            )}>{value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Rows table */}
                      <div className="border border-gray-200 dark:border-[#232834] rounded-lg overflow-hidden">
                        {/* Table toolbar */}
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-[#1E2230] border-b border-gray-200 dark:border-[#232834]">
                          <div className="flex items-center gap-2">
                            <IndeterminateCheckbox
                              checked={allSelected}
                              indeterminate={someSelected}
                              onChange={toggleAll}
                              disabled={importableKeys.length === 0}
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {selectedCount} de {importableKeys.length} seleccionados
                              {rows.length - importableKeys.length > 0 && (
                                <span className="ml-1 text-red-500 dark:text-red-400">
                                  ({rows.length - importableKeys.length} con errores, no importables)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedRows(new Set(importableKeys))}
                              disabled={allSelected || importableKeys.length === 0}
                              className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-[#232834]"
                            >
                              Seleccionar todos
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <button
                              onClick={() => setSelectedRows(new Set())}
                              disabled={noneSelected}
                              className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-[#232834]"
                            >
                              Quitar todos
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto max-h-72 overflow-y-auto">
                          <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-[#232834]">
                            <thead className="bg-gray-50 dark:bg-[#1E2230] sticky top-0 z-10">
                              <tr>
                                <th className="w-8 px-3 py-2" />
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fila</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">P. Venta</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-[#0D1117] divide-y divide-gray-200 dark:divide-[#232834]">
                              {rows.map((row) => {
                                const hasError  = row.errors.length > 0;
                                const isSelected = selectedRows.has(row.row);
                                return (
                                  <tr
                                    key={row.row}
                                    onClick={() => !hasError && toggleRow(row.row)}
                                    className={clsx(
                                      'transition-colors',
                                      hasError
                                        ? 'bg-red-50 dark:bg-red-900/5 opacity-60 cursor-not-allowed'
                                        : isSelected
                                          ? 'bg-blue-50/50 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                          : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1E2230]',
                                      !hasError && row.warnings.length > 0 && !isSelected
                                        ? 'bg-amber-50/40 dark:bg-amber-900/5'
                                        : ''
                                    )}
                                  >
                                    {/* Checkbox */}
                                    <td className="w-8 px-3 py-2" onClick={e => e.stopPropagation()}>
                                      <IndeterminateCheckbox
                                        checked={isSelected}
                                        onChange={() => !hasError && toggleRow(row.row)}
                                        disabled={hasError}
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{row.row}</td>
                                    <td className="px-3 py-2">
                                      <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium',
                                        row.action === 'create'
                                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                      )}>
                                        {row.action === 'create' ? 'Crear' : 'Actualizar'}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{row.codigo}</td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-white max-w-[200px] truncate">{row.nombre}</td>
                                    <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">S/ {row.precio_venta}</td>
                                    <td className="px-3 py-2">
                                      {hasError ? (
                                        <div className="group relative">
                                          <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 cursor-help">
                                            <ExclamationCircleIcon className="w-3.5 h-3.5" />
                                            {row.errors.length} error{row.errors.length > 1 ? 'es' : ''}
                                          </span>
                                          <div className="absolute left-0 bottom-full mb-1 z-20 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                                            {row.errors.map((e, i) => <p key={i}>• {e}</p>)}
                                            {row.warnings.map((w, i) => <p key={`w${i}`} className="text-amber-300">⚠ {w}</p>)}
                                          </div>
                                        </div>
                                      ) : row.warnings.length > 0 ? (
                                        <div className="group relative">
                                          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 cursor-help">
                                            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                            {row.warnings.length} aviso{row.warnings.length > 1 ? 's' : ''}
                                          </span>
                                          <div className="absolute left-0 bottom-full mb-1 z-20 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                                            {row.warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                          <CheckCircleIcon className="w-3.5 h-3.5" /> OK
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {error && (
                        <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                          <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" /> {error}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button onClick={() => setStep('upload')}
                          className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors">
                          ← Cambiar archivo
                        </button>
                        <button onClick={handleImport} disabled={selectedCount === 0 || loading}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          {loading ? (
                            <><div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin" /> Importando...</>
                          ) : `Importar ${selectedCount} producto${selectedCount !== 1 ? 's' : ''}`}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 3: Done ── */}
                  {step === 'done' && importResult && (
                    <div className="py-8 text-center space-y-5">
                      <CheckCircleSolid className="w-16 h-16 text-green-500 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">¡Importación completada!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{importResult.message}</p>
                      </div>
                      <div className="flex justify-center gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{importResult.created}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Creados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{importResult.updated}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Actualizados</p>
                        </div>
                        {importResult.failed > 0 && (
                          <div className="text-center">
                            <p className="text-3xl font-bold text-red-500">{importResult.failed}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Omitidos</p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center gap-3 pt-2">
                        <button onClick={reset}
                          className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-[#232834] rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors">
                          Importar otro archivo
                        </button>
                        <button onClick={handleClose}
                          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  UserCircleIcon,
  BellIcon,
  SwatchIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CloudArrowUpIcon,
  TrashIcon,
  LockClosedIcon,
  CheckCircleIcon,
  PhotoIcon,
  BuildingOfficeIcon,
  PlusIcon,
  XMarkIcon,
  UsersIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  EyeIcon,
  EyeSlashIcon,
  BanknotesIcon,
  PencilIcon,
  CreditCardIcon,
  ArrowsRightLeftIcon,
  QrCodeIcon,
  EllipsisHorizontalCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { clsx } from 'clsx';
import { Card, Button, Input, Modal, Badge, Avatar } from '@/components/ui';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useThemeStore } from '@/stores/themeStore';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import MediaGalleryModal from '@/components/media/MediaGalleryModal';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import validationService from '@/services/validationService';
import { ArrowPathIcon as Loader2Icon } from '@heroicons/react/24/outline';
import {
  type PrinterConfig,
  DEFAULT_PRINTER_CONFIG,
  getPrinterConfig,
  savePrinterConfig,
} from '@/lib/printerConfig';
import { YapeIcon, PlinIcon } from '@/components/ui/WalletIcons';

type Tab = 'account' | 'notifications' | 'appearance' | 'empresa' | 'equipo' | 'impresora' | 'cajas';

// ── ImpresoraTab ─────────────────────────────────────────────────────────────
const PAPER_OPTIONS = [
  {
    id: '58mm' as const,
    label: '58 mm',
    description: 'Impresoras económicas (Xprinter XP-58, etc.)',
    preview: 'w-14',
  },
  {
    id: '80mm' as const,
    label: '80 mm',
    description: 'Impresoras estándar (Epson TM-T20, Bixolon, etc.)',
    preview: 'w-20',
  },
  {
    id: 'a4' as const,
    label: 'A4',
    description: 'Impresión en hoja carta / oficio',
    preview: 'w-28',
  },
];

const ImpresoraTab = ({ companyId }: { companyId?: string }) => {
  const [config, setConfig] = useState<PrinterConfig>(() => getPrinterConfig(companyId));
  const [saved, setSaved] = useState(false);

  // Reload config when companyId becomes available (e.g. after auth hydration)
  useEffect(() => {
    setConfig(getPrinterConfig(companyId));
  }, [companyId]);

  const handleSave = () => {
    savePrinterConfig(companyId, config);
    setSaved(true);
    toast.success('Configuración de impresora guardada');
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (key: keyof PrinterConfig) =>
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-5">
      {/* Tamaño de papel */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Tamaño de papel</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Selecciona el ancho de papel que usa tu impresora
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PAPER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setConfig((prev) => ({ ...prev, paper_size: opt.id }))}
              className={clsx(
                'relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                config.paper_size === opt.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-gray-200 dark:border-[#232834] hover:border-gray-300 dark:hover:border-[#3a4055]'
              )}
            >
              {/* Paper preview icon */}
              <div className={clsx(
                'relative flex items-end justify-center',
                opt.id === 'a4' ? 'h-12' : 'h-12'
              )}>
                <div className={clsx(
                  'bg-gray-200 dark:bg-gray-600 rounded-sm border border-gray-300 dark:border-gray-500 flex flex-col gap-1 p-1',
                  opt.preview,
                  opt.id === 'a4' ? 'h-10' : 'h-12'
                )}>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-gray-400 dark:bg-gray-400 rounded-full h-0.5 w-full opacity-60" />
                  ))}
                </div>
              </div>
              <div>
                <p className={clsx(
                  'font-semibold text-sm',
                  config.paper_size === opt.id
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-900 dark:text-white'
                )}>{opt.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.description}</p>
              </div>
              {config.paper_size === opt.id && (
                <CheckCircleIcon className="absolute top-3 right-3 w-4 h-4 text-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del comprobante */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Contenido del comprobante</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Elige qué secciones se imprimen en cada ticket
          </p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#232834]">
          {([
            { key: 'show_logo', label: 'Logo de la empresa', desc: 'Imprime el logotipo en la cabecera' },
            { key: 'show_ruc', label: 'RUC', desc: 'Número de RUC de la empresa' },
            { key: 'show_address', label: 'Dirección', desc: 'Dirección fiscal registrada' },
            { key: 'show_phone', label: 'Teléfono', desc: 'Número de teléfono de contacto' },
            { key: 'show_email', label: 'Correo electrónico', desc: 'Email de la empresa' },
            { key: 'show_igv_detail', label: 'Detalle de IGV', desc: 'Muestra subtotal + IGV 18% por separado' },
          ] as { key: keyof PrinterConfig; label: string; desc: string }[]).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <Toggle
                checked={config[key] as boolean}
                onChange={() => toggle(key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Pie de página y copias */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Pie de página y copias</h2>
        <Input
          label="Mensaje en el pie del ticket"
          value={config.footer_text}
          onChange={(e) => setConfig((prev) => ({ ...prev, footer_text: e.target.value }))}
          placeholder="¡Gracias por su compra!"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número de copias
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfig((prev) => ({ ...prev, copies: Math.max(1, prev.copies - 1) }))}
              className="w-9 h-9 rounded-lg border border-gray-200 dark:border-[#232834] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors font-bold"
            >−</button>
            <span className="w-8 text-center font-semibold text-gray-900 dark:text-white text-sm">
              {config.copies}
            </span>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, copies: Math.min(5, prev.copies + 1) }))}
              className="w-9 h-9 rounded-lg border border-gray-200 dark:border-[#232834] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors font-bold"
            >+</button>
            <span className="text-xs text-gray-500 dark:text-gray-400">copia(s) por venta</span>
          </div>
        </div>
      </div>

      {/* Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saved}>
          {saved ? 'Guardado' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={clsx(
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
      checked ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#1E2230]'
    )}
  >
    <span className={clsx(
      'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
      checked ? 'translate-x-6' : 'translate-x-1'
    )} />
  </button>
);

// ── Document type labels ──────────────────────────────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
  '01': 'Factura',
  '03': 'Boleta',
  '07': 'Nota Crédito',
  '08': 'Nota Débito',
};

interface DocumentSeries {
  id: string;
  document_type: string;
  series: string;
  current_correlative: number;
  is_active: boolean;
  is_default: boolean;
}

interface SunatConfig {
  ruc: string;
  name: string;
  trade_name: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  ubigeo: string;
  apisunat_mode: 'test' | 'production';
  sunat_user: string;
  has_sol: boolean;
  has_certificate: boolean;
  sunat_configured: boolean;
  sunat_provider: string;
}

interface CertificateStatus {
  has_certificate: boolean;
  subject?: string;
  issuer?: string;
  valid_from?: string;
  valid_to?: string;
  serial_number?: string;
}

// ── EmpresaTab ────────────────────────────────────────────────────────────────
const EmpresaTab = ({ companyId }: { companyId: string }) => {
  const [config, setConfig] = useState<SunatConfig>({
    ruc: '', name: '', trade_name: '', address: '', phone: '', email: '',
    logo: '', ubigeo: '', apisunat_mode: 'test',
    sunat_user: '', has_sol: false, has_certificate: false,
    sunat_configured: false, sunat_provider: '',
  });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingSunat, setSavingSunat] = useState(false);
  const [savingSol, setSavingSol] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [connectionTested, setConnectionTested] = useState(false);
  const [validatingRuc, setValidatingRuc] = useState(false);
  const [rucValidated, setRucValidated] = useState(false);
  const savedRucRef = useRef<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Certificate
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState('');
  const [showCertPassword, setShowCertPassword] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [deletingCert, setDeletingCert] = useState(false);
  const [certStatus, setCertStatus] = useState<CertificateStatus | null>(null);
  const [loadingCertStatus, setLoadingCertStatus] = useState(false);
  const certInputRef = useRef<HTMLInputElement>(null);

  // SOL credentials
  const [solUser, setSolUser] = useState('');
  const [solPassword, setSolPassword] = useState('');

  // Document series
  const [series, setSeries] = useState<DocumentSeries[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [showNewSeriesForm, setShowNewSeriesForm] = useState(false);
  const [newSeries, setNewSeries] = useState({
    document_type: '01',
    series: '',
    is_default: false,
  });
  const [creatingNewSeries, setCreatingNewSeries] = useState(false);

  // Fetch SUNAT config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get(`/companies/${companyId}/sunat/config`);
      const d = res.data.data;
      setConfig(d);
      if (d.ruc && d.ruc.length === 11) {
        savedRucRef.current = d.ruc;
        setRucValidated(true);
      }
      if (d.sunat_user) {
        setSolUser(d.sunat_user);
      }
    } catch {
      // ignore
    }
  }, [companyId]);

  // Fetch certificate status
  const fetchCertStatus = useCallback(async () => {
    setLoadingCertStatus(true);
    try {
      const res = await api.get(`/companies/${companyId}/sunat/certificate/status`);
      setCertStatus(res.data.data || res.data);
    } catch {
      setCertStatus(null);
    } finally {
      setLoadingCertStatus(false);
    }
  }, [companyId]);

  // Fetch document series
  const fetchSeries = useCallback(async () => {
    setLoadingSeries(true);
    try {
      const res = await api.get(`/companies/${companyId}/document-series`);
      const rawSeries = res.data.data;
      setSeries(Array.isArray(rawSeries) ? rawSeries : (rawSeries?.data ?? rawSeries?.docs ?? []));
    } catch {
      // ignore
    } finally {
      setLoadingSeries(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchConfig();
      fetchCertStatus();
      fetchSeries();
    }
  }, [companyId, fetchConfig, fetchCertStatus, fetchSeries]);

  // Auto-validate RUC with debounce — only when the user actually changes it
  useEffect(() => {
    const cleanRuc = config.ruc.replace(/\D/g, '');
    if (cleanRuc !== config.ruc) {
      setConfig(prev => ({ ...prev, ruc: cleanRuc }));
      return;
    }
    if (cleanRuc.length !== 11) {
      setRucValidated(false);
      return;
    }
    // Skip API call if this is the same RUC already saved from the backend
    if (cleanRuc === savedRucRef.current) {
      setRucValidated(true);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setValidatingRuc(true);
        const response = await validationService.validateRuc(cleanRuc);
        if (response.valid && response.data) {
          setConfig(prev => ({
            ...prev,
            name: response.data!.name,
            trade_name: response.data!.trade_name || prev.trade_name,
            address: response.data!.address || prev.address,
            ubigeo: response.data!.ubigeo || prev.ubigeo,
          }));
          setRucValidated(true);
          toast.success('RUC validado: ' + response.data!.name);
        } else {
          setRucValidated(false);
          toast.error('RUC no encontrado en SUNAT');
        }
      } catch {
        setRucValidated(false);
        toast.error('Error al validar el RUC');
      } finally {
        setValidatingRuc(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.ruc]);

  // Save company info (section 1) — called after confirmation
  const handleSaveInfo = async () => {
    setShowConfirmModal(false);
    setSavingInfo(true);
    try {
      await api.put(`/companies/${companyId}/sunat/config`, {
        name: config.name,
        ruc: config.ruc,
        trade_name: config.trade_name,
        address: config.address,
        phone: config.phone,
        email: config.email,
        ubigeo: config.ubigeo,
      });
      savedRucRef.current = config.ruc;
      toast.success('Informacion actualizada');
      await fetchConfig();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSavingInfo(false);
    }
  };

  // Upload certificate
  const handleUploadCertificate = async () => {
    if (!certFile) {
      toast.error('Selecciona un archivo de certificado (.pfx o .p12)');
      return;
    }
    if (!certPassword.trim()) {
      toast.error('Ingresa la contraseña del certificado');
      return;
    }
    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append('certificate', certFile);
      formData.append('certificate_password', certPassword);
      await api.post(`/companies/${companyId}/sunat/certificate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Certificado digital subido correctamente');
      setCertFile(null);
      setCertPassword('');
      if (certInputRef.current) certInputRef.current.value = '';
      await fetchCertStatus();
      await fetchConfig();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al subir el certificado');
    } finally {
      setUploadingCert(false);
    }
  };

  // Delete certificate
  const handleDeleteCertificate = async () => {
    if (!confirm('¿Eliminar el certificado digital? Necesitaras subir uno nuevo para facturar.')) return;
    setDeletingCert(true);
    try {
      await api.delete(`/companies/${companyId}/sunat/certificate`);
      toast.success('Certificado eliminado');
      await fetchCertStatus();
      await fetchConfig();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al eliminar el certificado');
    } finally {
      setDeletingCert(false);
    }
  };

  // Save SOL credentials
  const handleSaveSol = async () => {
    if (!solUser.trim()) {
      toast.error('Ingresa el usuario SOL');
      return;
    }
    if (!solPassword.trim()) {
      toast.error('Ingresa la clave SOL');
      return;
    }
    setSavingSol(true);
    try {
      await api.put(`/companies/${companyId}/sunat/config`, {
        sunat_user: solUser,
        sunat_password: solPassword,
      });
      toast.success('Credenciales SOL guardadas');
      setSolPassword('');
      await fetchConfig();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar credenciales');
    } finally {
      setSavingSol(false);
    }
  };

  // Save environment
  const handleSaveSunat = async () => {
    setSavingSunat(true);
    try {
      await api.put(`/companies/${companyId}/sunat/config`, {
        apisunat_mode: config.apisunat_mode,
      });
      toast.success('Ambiente guardado');
      fetchConfig();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSavingSunat(false);
    }
  };

  // Test SUNAT connection
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post(`/companies/${companyId}/sunat/test-connection`);
      setTestResult({ success: res.data.success, message: res.data.message });
      if (res.data.success) setConnectionTested(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error de conexion';
      setTestResult({ success: false, error: msg });
    } finally {
      setTesting(false);
    }
  };

  // Toggle series is_active / is_default
  const handleToggleSeries = async (id: string, field: 'is_active' | 'is_default', value: boolean) => {
    try {
      await api.put(`/companies/${companyId}/document-series/${id}`, { [field]: value });
      setSeries(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    } catch {
      toast.error('Error al actualizar la serie');
    }
  };

  // Delete series
  const handleDeleteSeries = async (id: string) => {
    if (!confirm('¿Eliminar esta serie? Esta accion no se puede deshacer.')) return;
    try {
      await api.delete(`/companies/${companyId}/document-series/${id}`);
      setSeries(prev => prev.filter(s => s.id !== id));
      toast.success('Serie eliminada');
    } catch {
      toast.error('Error al eliminar la serie');
    }
  };

  // Create new series
  const handleCreateSeries = async () => {
    if (!newSeries.series.trim()) {
      toast.error('Ingresa la serie');
      return;
    }
    setCreatingNewSeries(true);
    try {
      await api.post(`/companies/${companyId}/document-series`, newSeries);
      toast.success('Serie creada');
      setShowNewSeriesForm(false);
      setNewSeries({ document_type: '01', series: '', is_default: false });
      fetchSeries();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al crear la serie');
    } finally {
      setCreatingNewSeries(false);
    }
  };

  // Onboarding checklist
  const checklistSteps = [
    {
      label: 'RUC validado con SUNAT',
      done: rucValidated,
    },
    {
      label: 'Datos de empresa configurados',
      done: !!(config.name && config.ruc && config.address),
    },
    {
      label: 'Certificado digital subido',
      done: config.has_certificate,
    },
    {
      label: 'Credenciales SOL configuradas',
      done: config.has_sol,
    },
    {
      label: 'Series de documentos creadas',
      done: series.length > 0,
    },
    {
      label: 'Conexion probada con SUNAT',
      done: connectionTested || config.sunat_configured,
    },
  ];
  const completedSteps = checklistSteps.filter(s => s.done).length;
  const progressPct = Math.round((completedSteps / checklistSteps.length) * 100);

  return (
    <div className="space-y-5">
      {/* ── Checklist de onboarding ── */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Pasos para empezar a facturar electronicamente
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {completedSteps} de {checklistSteps.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-gray-100 dark:bg-[#232834] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <ul className="space-y-1.5 pt-1">
          {checklistSteps.map((step, i) => (
            <li key={i} className="flex items-center gap-2.5">
              {step.done ? (
                <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
              <span className={clsx(
                'text-xs',
                step.done
                  ? 'line-through text-gray-400 dark:text-gray-500'
                  : 'text-gray-700 dark:text-gray-300'
              )}>
                {i + 1}. {step.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Seccion 1: Datos de la Empresa ── */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Datos de la Empresa</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* RUC con validacion automatica */}
          <div className="relative">
            <Input
              label="RUC"
              value={config.ruc || ''}
              onChange={e => setConfig({ ...config, ruc: e.target.value })}
              placeholder="20123456789"
              maxLength={11}
            />
            <div className="absolute right-3 top-9">
              {validatingRuc && (
                <Loader2Icon className="w-4 h-4 text-emerald-500 animate-spin" />
              )}
              {!validatingRuc && rucValidated && (
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              )}
            </div>
          </div>
          {/* Razon Social — solo lectura, viene de SUNAT */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Razon Social
              <span className="ml-1.5 text-xs text-gray-400 font-normal">(autocompletado desde SUNAT)</span>
            </label>
            <input
              readOnly
              value={config.name || ''}
              placeholder="Se autocompleta al validar el RUC"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#232834] rounded-lg bg-gray-50 dark:bg-[#0D1117] text-gray-700 dark:text-gray-300 placeholder-gray-400 cursor-not-allowed opacity-80"
            />
          </div>
          <Input
            label="Nombre Comercial"
            value={config.trade_name || ''}
            onChange={e => setConfig({ ...config, trade_name: e.target.value })}
            placeholder="Nombre Comercial"
          />
          <div className="sm:col-span-2">
            <Input
              label="Direccion"
              value={config.address || ''}
              onChange={e => setConfig({ ...config, address: e.target.value })}
              placeholder="Av. Ejemplo 123, Lima"
            />
          </div>
          <Input
            label="Telefono"
            value={config.phone || ''}
            onChange={e => setConfig({ ...config, phone: e.target.value })}
            placeholder="+51 999 999 999"
          />
          <Input
            label="Email"
            type="email"
            value={config.email || ''}
            onChange={e => setConfig({ ...config, email: e.target.value })}
            placeholder="contacto@empresa.com"
          />
        </div>

        {config.ruc.length === 11 && !rucValidated && !validatingRuc && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            El RUC no ha sido validado con SUNAT. Verifica el numero ingresado.
          </p>
        )}
        <div className="flex justify-end">
          <Button
            onClick={() => setShowConfirmModal(true)}
            loading={savingInfo}
            disabled={!rucValidated && config.ruc.length > 0}
          >
            Guardar informacion
          </Button>
        </div>
      </div>

      {/* ── Modal de confirmacion de datos de empresa ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white dark:bg-[#161A22] rounded-2xl border border-gray-200 dark:border-[#232834] shadow-2xl w-full max-w-md p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  ¿Confirmas los datos de tu empresa?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Esta informacion es la que se usara en todos tus comprobantes electronicos.
                  <span className="font-medium text-amber-600 dark:text-amber-400"> No podras cambiar el RUC una vez guardado.</span>
                </p>
              </div>
            </div>

            {/* Datos */}
            <div className="bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#232834] divide-y divide-gray-200 dark:divide-[#232834] text-sm">
              {[
                { label: 'RUC', value: config.ruc },
                { label: 'Razon Social', value: config.name },
                { label: 'Nombre Comercial', value: config.trade_name || '—' },
                { label: 'Direccion', value: config.address || '—' },
                { label: 'Telefono', value: config.phone || '—' },
                { label: 'Email', value: config.email || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-3 px-4 py-2.5">
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right break-all">{value}</span>
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-[#232834] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveInfo}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Si, guardar empresa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Seccion 2: Certificado Digital ── */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Certificado Digital</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Sube tu certificado digital (.pfx o .p12) emitido por una entidad certificadora autorizada por SUNAT.
            </p>
          </div>
          {config.has_certificate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 flex-shrink-0">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Certificado activo
            </span>
          )}
        </div>

        {/* Certificate info if exists */}
        {loadingCertStatus ? (
          <div className="text-sm text-gray-500 text-center py-4">Cargando estado del certificado...</div>
        ) : certStatus?.has_certificate ? (
          <div className="bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#232834] p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {certStatus.subject && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Titular</span>
                  <p className="text-gray-800 dark:text-gray-200 font-medium truncate">{certStatus.subject}</p>
                </div>
              )}
              {certStatus.issuer && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Emisor</span>
                  <p className="text-gray-800 dark:text-gray-200 font-medium truncate">{certStatus.issuer}</p>
                </div>
              )}
              {certStatus.valid_from && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Valido desde</span>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{certStatus.valid_from}</p>
                </div>
              )}
              {certStatus.valid_to && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Valido hasta</span>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{certStatus.valid_to}</p>
                </div>
              )}
              {certStatus.serial_number && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Numero de serie</span>
                  <p className="text-gray-800 dark:text-gray-200 font-mono text-xs truncate">{certStatus.serial_number}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleDeleteCertificate}
                disabled={deletingCert}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-colors disabled:opacity-50"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                {deletingCert ? 'Eliminando...' : 'Eliminar certificado'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Upload form */}
        {!certStatus?.has_certificate && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Archivo de certificado (.pfx / .p12)
              </label>
              <input
                ref={certInputRef}
                type="file"
                accept=".pfx,.p12"
                onChange={e => setCertFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-emerald-50 dark:file:bg-emerald-500/10 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-500/20 file:cursor-pointer file:transition-colors"
              />
            </div>
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Contraseña del certificado
              </label>
              <div className="relative">
                <input
                  type={showCertPassword ? 'text' : 'password'}
                  value={certPassword}
                  onChange={e => setCertPassword(e.target.value)}
                  placeholder="Contraseña del .pfx/.p12"
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCertPassword(!showCertPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showCertPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleUploadCertificate}
                loading={uploadingCert}
                disabled={!certFile || !certPassword.trim()}
              >
                <CloudArrowUpIcon className="w-4 h-4 mr-1.5" />
                Subir certificado
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Seccion 3: Credenciales SOL ── */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Credenciales SOL</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Usuario y clave SOL secundarios de SUNAT para la emision de comprobantes electronicos.
            </p>
          </div>
          {config.has_sol && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 flex-shrink-0">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Configurado
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Usuario SOL secundario
            </label>
            <input
              value={solUser}
              onChange={e => setSolUser(e.target.value)}
              placeholder="MODDATOS"
              className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Clave SOL
            </label>
            <input
              type="password"
              value={solPassword}
              onChange={e => setSolPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSaveSol}
            loading={savingSol}
            disabled={!solUser.trim() || !solPassword.trim()}
          >
            Guardar credenciales SOL
          </Button>
        </div>
      </div>

      {/* ── Seccion 4: Entorno SUNAT ── */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Entorno SUNAT</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ambiente de Facturacion</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'test' as const, name: 'Beta (pruebas)', desc: 'Pruebas con SUNAT (no afecta registros reales)', color: 'yellow' },
              { id: 'production' as const, name: 'Produccion', desc: 'Facturacion real con SUNAT', color: 'emerald' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setConfig({ ...config, apisunat_mode: opt.id })}
                className={clsx(
                  'relative flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all',
                  config.apisunat_mode === opt.id
                    ? opt.color === 'yellow'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10'
                      : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'border-gray-200 dark:border-[#232834] hover:border-gray-300 dark:hover:border-[#2A3244]'
                )}
              >
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{opt.name}</p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
                {config.apisunat_mode === opt.id && (
                  <CheckCircleIcon className={clsx(
                    'absolute top-2 right-2 w-4 h-4',
                    opt.color === 'yellow' ? 'text-yellow-500' : 'text-emerald-500'
                  )} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveSunat} loading={savingSunat}>
            Guardar ambiente
          </Button>
        </div>
      </div>

      {/* ── Seccion 5: Probar Conexion ── */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Probar Conexion</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Verifica que tu configuracion con SUNAT es correcta enviando un comprobante de prueba.
          </p>
        </div>

        {/* Test connection result */}
        {testResult && (
          <div className={clsx(
            'rounded-xl px-4 py-3 text-sm flex items-start gap-2',
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
          )}>
            {testResult.success
              ? <CheckCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              : <XMarkIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            }
            <span>{testResult.success ? testResult.message : testResult.error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={handleTestConnection}
            loading={testing}
          >
            Probar Conexion
          </Button>
        </div>
      </div>

      {/* ── Seccion 6: Series de Documentos ── */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Series de Documentos</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowNewSeriesForm(v => !v)}
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Nueva Serie
          </Button>
        </div>

        {/* New series inline form */}
        {showNewSeriesForm && (
          <div className="bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#232834] p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Serie</p>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
              <p className="font-medium">Nomenclatura de series:</p>
              <p>• <span className="font-mono">Factura (F___):</span> ej. F001</p>
              <p>• <span className="font-mono">Boleta (B___):</span> ej. B001</p>
              <p>• <span className="font-mono">Nota de Credito (FC__ o BC__):</span> ej. FC01</p>
              <p>• <span className="font-mono">Nota de Debito (FD__ o BD__):</span> ej. FD01</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
                <select
                  value={newSeries.document_type}
                  onChange={e => setNewSeries({ ...newSeries, document_type: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Serie</label>
                <input
                  value={newSeries.series}
                  onChange={e => setNewSeries({ ...newSeries, series: e.target.value.toUpperCase() })}
                  placeholder="F001"
                  maxLength={4}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 pb-0.5">
                <input
                  id="new-series-default"
                  type="checkbox"
                  checked={newSeries.is_default}
                  onChange={e => setNewSeries({ ...newSeries, is_default: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="new-series-default" className="text-sm text-gray-600 dark:text-gray-400">
                  Por defecto
                </label>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateSeries} loading={creatingNewSeries}>
                  Crear
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowNewSeriesForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {loadingSeries ? (
          <div className="text-sm text-gray-500 text-center py-4">Cargando series...</div>
        ) : series.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-6">
            No hay series configuradas. Crea la primera serie para empezar a facturar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#232834]">
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-4">Tipo</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-4">Serie</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-4">Correlativo</th>
                  <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-4">Por Defecto</th>
                  <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-4">Estado</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#1E2230]">
                {series.map(s => (
                  <tr key={s.id}>
                    <td className="py-3 pr-4 font-medium text-gray-700 dark:text-gray-200">
                      {DOC_TYPE_LABELS[s.document_type] || s.document_type}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-sm text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-[#1E2230] px-2 py-0.5 rounded-md">
                        {s.series}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                      {s.current_correlative.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <Toggle
                        checked={s.is_default}
                        onChange={() => handleToggleSeries(s.id, 'is_default', !s.is_default)}
                      />
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <Toggle
                        checked={s.is_active}
                        onChange={() => handleToggleSeries(s.id, 'is_active', !s.is_active)}
                      />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteSeries(s.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Eliminar serie"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Equipo Tab ────────────────────────────────────────────────────────────────
interface TeamUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  roles: { id: number; name: string }[];
}

interface TeamStats {
  current: number;
  limit: number;
  can_add: boolean;
}

// ── CajasTab ──────────────────────────────────────────────────────────────────
interface CashRegister {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  payment_methods: string[] | null;
}

const ALL_PAYMENT_METHODS = ['cash', 'card', 'transfer', 'yape', 'plin', 'other', 'credit'] as const;
type PaymentMethodKey = typeof ALL_PAYMENT_METHODS[number];

const PAYMENT_METHOD_CONFIG: Record<PaymentMethodKey, {
  label: string;
  icon: React.ReactNode;
  circleBg: string;   // circle bg in modal toggle
  badgeBg: string;    // solid bg for list badge
  activeBorder: string; // modal active border
}> = {
  cash:     { label: 'Efectivo',      icon: <BanknotesIcon className="w-4 h-4" />,              circleBg: 'bg-green-500',  badgeBg: 'bg-green-500',  activeBorder: 'border-green-500' },
  card:     { label: 'Tarjeta',       icon: <CreditCardIcon className="w-4 h-4" />,             circleBg: 'bg-blue-500',   badgeBg: 'bg-blue-500',   activeBorder: 'border-blue-500' },
  transfer: { label: 'Transferencia', icon: <ArrowsRightLeftIcon className="w-4 h-4" />,       circleBg: 'bg-indigo-500', badgeBg: 'bg-indigo-500', activeBorder: 'border-indigo-500' },
  yape:     { label: 'Yape',          icon: <YapeIcon className="w-4 h-4" />,                   circleBg: 'bg-purple-600', badgeBg: 'bg-purple-600', activeBorder: 'border-purple-500' },
  plin:     { label: 'Plin',          icon: <PlinIcon className="w-4 h-4" />,                   circleBg: 'bg-cyan-500',   badgeBg: 'bg-cyan-500',   activeBorder: 'border-cyan-500' },
  other:    { label: 'Otros',         icon: <EllipsisHorizontalCircleIcon className="w-4 h-4" />, circleBg: 'bg-gray-500', badgeBg: 'bg-gray-500',   activeBorder: 'border-gray-400' },
  credit:   { label: 'Crédito',       icon: <ClockIcon className="w-4 h-4" />,                  circleBg: 'bg-orange-500', badgeBg: 'bg-orange-500', activeBorder: 'border-orange-500' },
};

const DEFAULT_PAYMENT_METHODS = [...ALL_PAYMENT_METHODS];

const CajasTab = ({ companyId }: { companyId: string }) => {
  const { subscription } = useSubscriptionStore();
  const plan = subscription?.plan;
  const maxCajas: number | null = plan?.max_cash_registers ?? null;

  const [cajas, setCajas] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCaja, setEditingCaja] = useState<CashRegister | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', description: '', is_active: true,
    payment_methods: DEFAULT_PAYMENT_METHODS as string[],
  });

  const fetchCajas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/${companyId}/cash-registers?per_page=50`);
      setCajas(res.data.data || res.data);
    } catch {
      toast.error('Error al cargar cajas');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchCajas(); }, [fetchCajas]);

  const openNew = () => {
    setEditingCaja(null);
    setForm({ name: '', code: '', description: '', is_active: true, payment_methods: DEFAULT_PAYMENT_METHODS as string[] });
    setIsModalOpen(true);
  };

  const openEdit = (caja: CashRegister) => {
    setEditingCaja(caja);
    setForm({
      name: caja.name,
      code: caja.code || '',
      description: caja.description || '',
      is_active: caja.is_active,
      payment_methods: caja.payment_methods ?? DEFAULT_PAYMENT_METHODS as string[],
    });
    setIsModalOpen(true);
  };

  const togglePaymentMethod = (key: string) => {
    setForm(f => ({
      ...f,
      payment_methods: f.payment_methods.includes(key)
        ? f.payment_methods.filter(m => m !== key)
        : [...f.payment_methods, key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return; }
    if (form.payment_methods.length === 0) { toast.error('Debe habilitar al menos un método de pago'); return; }
    setIsSaving(true);
    try {
      if (editingCaja) {
        await api.patch(`/companies/${companyId}/cash-registers/${editingCaja.id}`, form);
        toast.success('Caja actualizada');
      } else {
        await api.post(`/companies/${companyId}/cash-registers`, form);
        toast.success('Caja creada');
      }
      setIsModalOpen(false);
      fetchCajas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (caja: CashRegister) => {
    if (!confirm(`¿Eliminar la caja "${caja.name}"?`)) return;
    try {
      await api.delete(`/companies/${companyId}/cash-registers/${caja.id}`);
      toast.success('Caja eliminada');
      fetchCajas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const current = cajas.length;
  const atLimit = maxCajas !== null && current >= maxCajas;
  const pctUsed = maxCajas ? Math.min(100, Math.round((current / maxCajas) * 100)) : 0;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cajas Registradoras</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administra los puntos de venta físicos de tu negocio
          </p>
        </div>
        <button
          onClick={openNew}
          disabled={atLimit}
          title={atLimit ? `Tu plan ${plan?.name} permite hasta ${maxCajas} ${maxCajas === 1 ? 'caja' : 'cajas'}` : 'Nueva caja'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva Caja
        </button>
      </div>

      {/* Uso del plan */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BanknotesIcon className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cajas del plan</span>
            {plan?.name && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                {plan.name}
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {current} / {maxCajas === null ? '∞' : maxCajas}
          </span>
        </div>
        {maxCajas !== null && (
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-500' : pctUsed > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
              style={{ width: `${pctUsed}%` }}
            />
          </div>
        )}
        {atLimit && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
            Límite alcanzado. <a href="/settings/subscription" className="underline font-medium">Actualiza tu plan</a> para agregar más cajas.
          </p>
        )}
      </div>

      {/* Lista de cajas */}
      <div className="space-y-3">
        {cajas.length === 0 ? (
          <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-10 text-center">
            <BanknotesIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay cajas registradas</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Crea tu primera caja para comenzar a usar el POS</p>
          </div>
        ) : (
          cajas.map(caja => {
            const enabledMethods = caja.payment_methods ?? DEFAULT_PAYMENT_METHODS as string[];
            return (
              <div
                key={caja.id}
                className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      caja.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <BanknotesIcon className={`w-5 h-5 ${caja.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{caja.name}</p>
                        {caja.code && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            {caja.code}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          caja.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          {caja.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      {caja.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{caja.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(caja)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#232834] transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(caja)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Payment methods badges — solid bg, white text, no icons */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ALL_PAYMENT_METHODS.map(key => {
                    const cfg = PAYMENT_METHOD_CONFIG[key];
                    const active = enabledMethods.includes(key);
                    return (
                      <span
                        key={key}
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-xs font-medium transition-all',
                          active
                            ? `${cfg.badgeBg} text-white`
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                        )}
                      >
                        {cfg.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal nueva/editar caja */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCaja ? 'Editar Caja' : 'Nueva Caja Registradora'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Caja Principal"
            required
          />
          <Input
            label="Código (opcional)"
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value })}
            placeholder="CAJA-01"
          />
          <Input
            label="Descripción (opcional)"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Caja del local principal"
          />

          {/* Métodos de pago */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Métodos de pago habilitados
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PAYMENT_METHODS.map(key => {
                const cfg = PAYMENT_METHOD_CONFIG[key];
                const active = form.payment_methods.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePaymentMethod(key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2A3244] hover:bg-gray-50 dark:hover:bg-[#1a1f2e] transition-all text-left"
                  >
                    {/* Color circle with icon */}
                    <span className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white transition-all',
                      active ? cfg.circleBg : 'bg-gray-200 dark:bg-gray-700'
                    )}>
                      {cfg.icon}
                    </span>
                    <span className={clsx(
                      'text-sm font-medium flex-1',
                      active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                    )}>
                      {cfg.label}
                    </span>
                    {/* Toggle */}
                    <span className={clsx(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0',
                      active ? cfg.circleBg : 'bg-gray-200 dark:bg-gray-700'
                    )}>
                      <span className={clsx(
                        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                        active ? 'translate-x-4' : 'translate-x-1'
                      )} />
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Solo los métodos habilitados aparecerán en el POS de esta caja
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Caja activa</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Las cajas inactivas no aparecen en el POS</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" fullWidth loading={isSaving}>
              {editingCaja ? 'Guardar cambios' : 'Crear Caja'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const EquipoTab = () => {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '', role: 'vendedor', is_active: true,
  });

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/settings/users'),
        api.get('/settings/available-roles'),
      ]);
      setUsers(usersRes.data.users);
      setStats(usersRes.data.stats);
      setRoles(rolesRes.data);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = (user: TeamUser) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, phone: user.phone || '', password: '', password_confirmation: '', role: user.roles[0]?.name || 'vendedor', is_active: user.is_active });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingUser) {
        await api.put(`/settings/users/${editingUser.id}`, { name: formData.name, role: formData.role, is_active: formData.is_active });
        toast.success('Usuario actualizado');
      } else {
        await api.post('/settings/users', formData);
        toast.success('Usuario creado exitosamente');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: TeamUser) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${user.name} de tu empresa?`)) return;
    try {
      await api.delete(`/settings/users/${user.id}`);
      toast.success('Usuario removido');
      fetchData();
    } catch {
      toast.error('Error al eliminar usuario');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Equipo de Trabajo</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona los accesos de tus vendedores y contadores</p>
        </div>
        <div className="flex items-center gap-4">
          {stats && (
            <p className={clsx('text-sm font-semibold', stats.can_add ? 'text-emerald-600' : 'text-amber-500')}>
              {stats.current} / {stats.limit} usuarios
            </p>
          )}
          <Button
            variant="primary"
            onClick={() => {
              if (!stats?.can_add) { toast.error('Has alcanzado el límite de tu plan.'); return; }
              setEditingUser(null);
              setFormData({ name: '', email: '', phone: '', password: '', password_confirmation: '', role: 'vendedor', is_active: true });
              setIsModalOpen(true);
            }}
            icon={<PlusIcon className="w-4 h-4" />}
            className="bg-emerald-600 border-none"
            disabled={!stats?.can_add}
          >
            Agregar Miembro
          </Button>
        </div>
      </div>

      {!stats?.can_add && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4 flex gap-3 items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Has llegado al límite de usuarios de tu plan. Considera subir de nivel para agregar más miembros.
          </p>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white dark:bg-[#0D1117] border border-gray-100 dark:border-[#232834] rounded-2xl p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={user.name} size="lg" className="rounded-2xl" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[130px]">{user.name}</h3>
                  <Badge variant={user.is_active ? 'success' : 'secondary'} size="sm" className="mt-1">
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(user)} className="p-1.5 text-gray-400 hover:text-emerald-500 transition-colors">
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(user)} className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                <span className="capitalize">{user.roles[0]?.name.replace('_', ' ') || 'Sin rol'}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Editar Usuario' : 'Nuevo Miembro del Equipo'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre Completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          {!editingUser && (
            <>
              <Input label="Correo Electrónico" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Contraseña" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                <Input label="Confirmar Contraseña" type="password" value={formData.password_confirmation} onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })} required />
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rol en la empresa</label>
            <select className="w-full bg-white dark:bg-[#1E2230] border border-gray-200 dark:border-[#232834] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
              {roles.map(r => <option key={r.id} value={r.name}>{r.name.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>
          {editingUser && (
            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="is_active_equipo" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
              <label htmlFor="is_active_equipo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Usuario activo</label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#232834]">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 border-none" loading={isSaving}>
              {editingUser ? 'Actualizar' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

function resizeToPng(file: File, maxPx = 200): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        resolve(new File([blob!], 'logo.png', { type: 'image/png' }));
      }, 'image/png', 0.92);
    };
    img.src = url;
  });
}

// ── Main SettingsPage ─────────────────────────────────────────────────────────
const SettingsPage = () => {
  const { user, currentCompany, setCurrentCompany, updateUser } = useAuthStore();
  const { can, isAdmin } = useUserPermissions();
  const { notifications, profile, isLoading, updateNotifications, fetchProfile, updateProfile, updatePassword } = useSettingsStore();
  const { theme, setTheme, logo, setLogo } = useThemeStore();

  const searchParams = useSearchParams();
  const requestedTab = (searchParams.get('tab') as Tab) || 'account';
  const adminTabs: Tab[] = ['empresa', 'equipo', 'cajas'];
  const initialTab = (!isAdmin && adminTabs.includes(requestedTab)) ? 'account' : requestedTab;
  const [activeTab, setActiveTabState] = useState<Tab>(initialTab);

  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    const url = tab === 'account' ? '/settings' : `/settings?tab=${tab}`;
    window.history.replaceState(null, '', url);
  };
  const [mounted, setMounted] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [freshLogoUrl, setFreshLogoUrl] = useState<string | null>(null);
  // Track whether user has done an upload in this session (prevents auth/me race condition)
  const uploadedRef = useRef(false);
  const buildLogoDisplayUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? '';
    return path.startsWith('http') ? path : `${base}/storage/${path}`;
  };
  // freshLogoUrl wins if set by user action; otherwise derive from currentCompany
  const displayLogo = freshLogoUrl ?? buildLogoDisplayUrl(currentCompany?.logo) ?? logo;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    setMounted(true);
    fetchProfile();
    // Fetch fresh company data on mount, but only apply if the user hasn't already
    // changed the logo in this session (prevents auth/me race-condition overwriting a fresh upload)
    api.get('/auth/me').then((res) => {
      if (uploadedRef.current) return; // user already changed logo — don't overwrite
      const u = res.data?.user || res.data;
      const fresh = u?.current_company || u?.currentCompany;
      if (fresh) {
        setCurrentCompany({ ...(fresh as any) });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileForm);
      // Sync changes to authStore so sidebar name/avatar update immediately
      updateUser({ name: profileForm.name, email: profileForm.email });
      toast.success('Perfil actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error('Mínimo 8 caracteres');
      return;
    }
    try {
      await updatePassword(passwordForm.current, passwordForm.new);
      toast.success('Contraseña actualizada');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar contraseña');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    if (raw.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); return; }
    if (!currentCompany) { toast.error('No hay empresa seleccionada'); return; }

    const file = await resizeToPng(raw, 200);

    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post(`/companies/${currentCompany.id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newPath: string | undefined = res.data?.logo;
      if (newPath) {
        uploadedRef.current = true; // prevent auth/me from overwriting this
        setCurrentCompany({ ...currentCompany, logo: newPath });
        const url = (buildLogoDisplayUrl(newPath) ?? '') + '?t=' + Date.now();
        setFreshLogoUrl(url);
        setLogo(url);
      }
      toast.success('Logo actualizado');
    } catch {
      toast.error('Error al subir el logo');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoDelete = async () => {
    if (!currentCompany) return;
    try {
      await api.delete(`/companies/${currentCompany.id}/logo`);
      uploadedRef.current = true;
      setCurrentCompany({ ...currentCompany, logo: undefined });
      setFreshLogoUrl(null);
      setLogo(null);
      toast.success('Logo eliminado');
    } catch {
      toast.error('Error al eliminar el logo');
    }
  };

  const allTabs: { id: Tab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'account', label: 'Mi Cuenta', icon: UserCircleIcon },
    { id: 'appearance', label: 'Apariencia', icon: SwatchIcon },
    { id: 'empresa', label: 'Mi Empresa', icon: BuildingOfficeIcon, adminOnly: true },
    { id: 'equipo', label: 'Equipo', icon: UsersIcon, adminOnly: true },
    { id: 'cajas', label: 'Cajas', icon: BanknotesIcon, adminOnly: true },
    { id: 'impresora', label: 'Impresora', icon: PrinterIcon },
  ];

  const tabs = allTabs.filter((tab) => !tab.adminOnly || isAdmin);

  const themeOptions = [
    { id: 'light' as const, name: 'Claro', description: 'Para trabajar de día', icon: SunIcon },
    { id: 'dark' as const, name: 'Oscuro', description: 'Menos fatiga visual', icon: MoonIcon },
    { id: 'system' as const, name: 'Sistema', description: 'Ajuste automático', icon: ComputerDesktopIcon },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona tu cuenta y preferencias del panel</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#161A22] rounded-xl border border-gray-200 dark:border-[#232834] overflow-x-auto flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Mi Cuenta ── */}
      {activeTab === 'account' && (
        <div className="space-y-5">
          {/* Avatar + datos */}
          <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">Información Personal</h2>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">
                  {profileForm.name.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{profileForm.name}</p>
                <p className="text-sm text-gray-500">{profileForm.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-[#232834]">
              <Input
                label="Nombre completo"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
              <Input
                label="Correo electrónico"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
              <Input
                label="Teléfono"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+51 999 999 999"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} loading={isLoading}>
                Guardar cambios
              </Button>
            </div>
          </div>

          {/* Contraseña */}
          <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <LockClosedIcon className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Cambiar Contraseña</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="sm:col-span-2">
                <Input
                  label="Contraseña actual"
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                />
              </div>
              <Input
                label="Nueva contraseña"
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleChangePassword}
                loading={isLoading}
                disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm}
              >
                Cambiar contraseña
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notificaciones ── */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-6">
          {/* Email */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Por Email
            </h3>
            <div className="space-y-4">
              {[
                { key: 'email_sales', label: 'Nuevas ventas', desc: 'Email al registrarse una nueva venta' },
                { key: 'email_reports', label: 'Reportes semanales', desc: 'Resumen semanal de ventas y rendimiento' },
                { key: 'email_low_stock', label: 'Alerta de stock bajo', desc: 'Email cuando un producto tenga poco stock' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    checked={notifications[key as keyof typeof notifications]}
                    onChange={() => updateNotifications({ [key]: !notifications[key as keyof typeof notifications] })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-[#232834]" />

          {/* Push */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Notificaciones Push
            </h3>
            <div className="space-y-4">
              {[
                { key: 'push_sales', label: 'Ventas en tiempo real', desc: 'Notificación instantánea de cada venta' },
                { key: 'push_low_stock', label: 'Alertas de stock', desc: 'Cuando un producto esté por agotarse' },
                { key: 'push_reminders', label: 'Recordatorios', desc: 'Cierres de caja y tareas pendientes' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    checked={notifications[key as keyof typeof notifications]}
                    onChange={() => updateNotifications({ [key]: !notifications[key as keyof typeof notifications] })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Apariencia ── */}
      {activeTab === 'appearance' && (
        <div className="space-y-5">
          {/* Tema */}
          <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Modo del Tema</h2>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={clsx(
                    'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    mounted && theme === opt.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                      : 'border-gray-200 dark:border-[#232834] hover:border-emerald-400/50'
                  )}
                >
                  <div className={clsx(
                    'p-2.5 rounded-xl transition-colors',
                    mounted && theme === opt.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 dark:bg-[#1E2230] text-gray-500'
                  )}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{opt.name}</p>
                  <p className="text-xs text-gray-400">{opt.description}</p>
                  {mounted && theme === opt.id && (
                    <CheckCircleIcon className="absolute top-2 right-2 w-4 h-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
            {mounted && theme === 'system' && (
              <p className="text-xs text-gray-500 bg-gray-50 dark:bg-[#1E2230] rounded-lg px-3 py-2">
                El tema se ajusta automáticamente según tu sistema operativo.
              </p>
            )}
          </div>

          {/* Logo — solo admin */}
          {isAdmin && (<>
          <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Logo de la Empresa</h2>
              <p className="text-sm text-gray-500 mt-0.5">Aparece en el sidebar y en los documentos generados</p>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative">
                <div className={clsx(
                  'w-20 h-20 rounded-xl border-2 flex items-center justify-center overflow-hidden',
                  mounted && displayLogo
                    ? 'border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117]'
                    : 'border-dashed border-gray-300 dark:border-[#232834] bg-gray-50 dark:bg-[#0D1117]'
                )}>
                  {mounted && displayLogo ? (
                    <img key={displayLogo} src={displayLogo} alt="Logo" className="w-full h-full object-contain p-2"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                  ) : (
                    <PhotoIcon className="w-7 h-7 text-gray-400" />
                  )}
                </div>
                {mounted && displayLogo && (
                  <button
                    onClick={handleLogoDelete}
                    className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-sm"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setMediaModalOpen(true)}>
                    <PhotoIcon className="w-4 h-4 mr-1.5" />
                    Gestor de medios
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    <CloudArrowUpIcon className="w-4 h-4 mr-1.5" />
                    Subir archivo
                  </Button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} />
                <p className="text-xs text-gray-400">PNG, JPG o SVG · Máx. 2 MB</p>
                {mounted && displayLogo && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircleIcon className="w-3.5 h-3.5" /> Logo guardado
                  </p>
                )}
              </div>
            </div>
          </div>

          <MediaGalleryModal
            isOpen={mediaModalOpen}
            onClose={() => setMediaModalOpen(false)}
            multiple={false}
            maxSelect={1}
            onSelect={async (items) => {
              setMediaModalOpen(false);
              if (!items[0]?.url || !currentCompany) return;
              try {
                // Fetch the selected media image and re-upload as company logo
                const blob = await fetch(items[0].url).then(r => r.blob());
                const ext = blob.type.includes('png') ? 'png' : 'jpg';
                const file = new File([blob], `logo.${ext}`, { type: blob.type });
                const formData = new FormData();
                formData.append('logo', file);
                const res = await api.post(`/companies/${currentCompany.id}/logo`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                const newPath: string | undefined = res.data?.logo;
                if (newPath) {
                  uploadedRef.current = true;
                  setCurrentCompany({ ...currentCompany, logo: newPath });
                  const url = (buildLogoDisplayUrl(newPath) ?? '') + '?t=' + Date.now();
                  setFreshLogoUrl(url);
                  setLogo(url);
                }
                toast.success('Logo actualizado');
              } catch {
                toast.error('Error al guardar el logo');
              }
            }}
          />
          </>)}
        </div>
      )}

      {/* ── Mi Empresa ── */}
      {activeTab === 'empresa' && currentCompany?.id && (
        <EmpresaTab companyId={currentCompany.id} />
      )}
      {activeTab === 'empresa' && !currentCompany?.id && (
        <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Selecciona una empresa para ver su configuración.
          </p>
        </div>
      )}

      {/* ── Equipo ── */}
      {activeTab === 'equipo' && <EquipoTab />}

      {/* ── Cajas ── */}
      {activeTab === 'cajas' && currentCompany?.id && (
        <CajasTab companyId={currentCompany.id} />
      )}

      {/* ── Impresora ── */}
      {activeTab === 'impresora' && (
        <ImpresoraTab companyId={currentCompany?.id} />
      )}
    </div>
  );
};

export default SettingsPage;

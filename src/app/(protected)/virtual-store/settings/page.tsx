'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  GlobeAltIcon,
  LinkIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  ShareIcon,
  DocumentTextIcon,
  CreditCardIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useVirtualStoreStore } from '@/stores/virtualStoreStore';
import virtualStoreService from '@/services/virtualStoreService';
import toast from 'react-hot-toast';
import { LaserLoader } from '@/components/ui';
import PaymentMethods from './components/PaymentMethods';
import ShippingMethods from './components/ShippingMethods';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'invalid';

const StoreSettingsPage = () => {
  const { currentCompany } = useAuthStore();
  const { settings, fetchSettings, updateSettings, isLoadingSettings } = useVirtualStoreStore();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    subdomain: '',
    custom_domain: '',
    is_active: true,
    maintenance_mode: false,
    email: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    theme_config: {
      twitter: '',
      youtube: '',
      branches: [] as { id: string | number; name: string; address: string }[],
      about_us: '', // Campo para la información de la empresa
    },
    meta_title: '',
    meta_description: '',
    google_analytics_id: '',
  });

  useEffect(() => {
    if (currentCompany?.id) {
      fetchSettings(currentCompany.id);
    }
  }, [currentCompany?.id, fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || '',
        slug: settings.slug || '',
        description: settings.description || '',
        subdomain: settings.subdomain || '',
        custom_domain: settings.custom_domain || '',
        is_active: settings.is_active ?? true,
        maintenance_mode: settings.maintenance_mode ?? false,
        email: settings.email || '',
        whatsapp: settings.whatsapp || '',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        tiktok: settings.tiktok || '',
        theme_config: {
          twitter: settings.theme_config?.twitter || '',
          youtube: settings.theme_config?.youtube || '',
          branches: settings.theme_config?.branches || [],
          about_us: settings.theme_config?.about_us || '',
        },
        meta_title: settings.meta_title || '',
        meta_description: settings.meta_description || '',
        google_analytics_id: settings.google_analytics_id || '',
      });
    }
  }, [settings]);

  // Sanitizador Básico de HTML para prevenir XSS antes de guardar
  const sanitizeHTML = (html: string) => {
    if (!html) return '';
    // Elimina etiquetas <script>, <iframe> y on* attributes (onclick, etc)
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/ on\w+="[^"]*"/g, '')
      .replace(/ on\w+='[^']*'/g, '')
      .replace(/ on\w+=\w+/g, '');
  };

  const RESERVED_NAMES = ['app', 'api', 'www', 'shop', 'home', 'back', 'admin', 'mail', 'ftp', 'staging', 'dev', 'consulta', 'ok', 'n8n', 'whatsapp', 'wa', 'webmail'];

  const checkSlugAvailability = useCallback((slug: string) => {
    if (!currentCompany?.id) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (slug.length === 0) { setSlugStatus('idle'); return; }
    if (slug.length < 8) { setSlugStatus('invalid'); return; }
    if (!/^[a-z0-9-]+$/.test(slug)) { setSlugStatus('invalid'); return; }
    if (RESERVED_NAMES.includes(slug)) { setSlugStatus('reserved'); return; }

    setSlugStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await virtualStoreService.checkSlug(currentCompany.id, slug);
        if (result.reason === 'reserved') setSlugStatus('reserved');
        else setSlugStatus(result.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 600);
  }, [currentCompany?.id]);

  const slugError = (): string | null => {
    if (slugStatus === 'invalid') return 'Mínimo 8 caracteres, solo letras, números y guiones';
    if (slugStatus === 'reserved') return 'Este nombre está reservado para el sistema';
    if (slugStatus === 'taken') return 'Este slug ya está en uso por otra tienda';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id) return;

    // Validaciones extra antes de enviar
    if (['invalid', 'reserved', 'taken'].includes(slugStatus)) {
      toast.error(slugError() || 'El slug no es válido');
      return;
    }
    if (slugStatus === 'checking') {
      toast.error('Espera a que se verifique la disponibilidad del slug');
      return;
    }

    setIsSaving(true);
    
    // Sanitizamos el contenido de "Empresa" antes de enviarlo
    const safeAboutUs = sanitizeHTML(formData.theme_config.about_us);

    const payload = {
        ...formData,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        theme_config: {
          ...formData.theme_config,
          about_us: safeAboutUs
        }
    };

    try {
      await updateSettings(currentCompany.id, payload);
      toast.success('Configuración guardada correctamente');
    } catch (error: any) {
      console.error('Error saving settings:', error.response?.data || error);
      toast.error('Error al guardar: ' + JSON.stringify(error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSettings && !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'General', icon: GlobeAltIcon },
    { id: 'pages', name: 'Páginas (Empresa)', icon: DocumentTextIcon },
    { id: 'domain', name: 'Dominio y SEO', icon: LinkIcon },
    { id: 'payments', name: 'Métodos de Pago', icon: CreditCardIcon },
    { id: 'shipping', name: 'Métodos de Envío', icon: TruckIcon },
    { id: 'contact', name: 'Contacto y Sedes', icon: MapPinIcon },
    { id: 'social', name: 'Redes Sociales', icon: ShareIcon },
  ];

  return (
    <>
      <LaserLoader isLoading={isSaving} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar de Pestañas */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-2">
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#161A22]'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div className="lg:col-span-3">
        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Estado de la Tienda</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Tienda activa</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cuando esta desactivada, los clientes no podran acceder</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                      className={clsx('relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2', formData.is_active ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-[#1E2230]')}
                    >
                      <span className={clsx('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', formData.is_active ? 'translate-x-5' : 'translate-x-0')} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Modo mantenimiento</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Muestra un mensaje de mantenimiento a los visitantes</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, maintenance_mode: !formData.maintenance_mode })}
                      className={clsx('relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2', formData.maintenance_mode ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-[#1E2230]')}
                    >
                      <span className={clsx('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', formData.maintenance_mode ? 'translate-x-5' : 'translate-x-0')} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Información General</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la tienda</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" placeholder="Mi Tienda Online" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug (URL de tu tienda)</label>
                    <div className="relative">
                      <div className={clsx(
                        "flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500",
                        slugStatus === 'available' ? "border-emerald-500" :
                        ['invalid','reserved','taken'].includes(slugStatus) ? "border-red-500" :
                        "border-gray-300 dark:border-[#232834]"
                      )}>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                            setFormData({ ...formData, slug: val });
                            checkSlugAvailability(val);
                          }}
                          className="flex-1 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-white outline-none"
                          placeholder="mi-tienda-oficial"
                          maxLength={50}
                        />
                        <span className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#1E2230] border-l border-gray-300 dark:border-[#232834] whitespace-nowrap">.bravos.pe</span>
                        <span className="px-3">
                          {slugStatus === 'checking' && (
                            <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
                          )}
                          {slugStatus === 'available' && (
                            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                          )}
                          {['invalid','reserved','taken'].includes(slugStatus) && (
                            <span className="text-red-500 text-lg leading-none">✗</span>
                          )}
                        </span>
                      </div>
                    </div>
                    {slugStatus === 'available' && (
                      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                        ✓ Disponible — tu tienda estará en <span className="font-mono font-semibold">{formData.slug}.bravos.pe</span>
                      </p>
                    )}
                    {slugError() && (
                      <p className="mt-1 text-xs text-red-500">{slugError()}</p>
                    )}
                    {slugStatus === 'idle' && formData.slug.length > 0 && formData.slug.length >= 8 && (
                      <p className="mt-1 text-xs text-gray-400">Tu tienda estará en <span className="font-mono">{formData.slug}.bravos.pe</span></p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">Solo letras minúsculas, números y guiones. Mínimo 8 caracteres.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" placeholder="Breve descripción de tu tienda..." />
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB: DOMINIO Y SEO */}
        {activeTab === 'domain' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Configuración de Dominio</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subdominio</label>
                    <div className="flex">
                      <input 
                        type="text" 
                        value={formData.subdomain} 
                        onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} 
                        className={clsx(
                          "flex-1 px-3 py-2 border rounded-l-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500",
                          validateSlug(formData.subdomain) ? "border-red-500" : "border-gray-300 dark:border-[#232834]"
                        )}
                        placeholder="mitiendaoficial" 
                      />
                      <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-[#232834] rounded-r-lg bg-gray-50 dark:bg-[#1E2230] text-gray-500 text-sm">.bravos.pe</span>
                    </div>
                    {validateSlug(formData.subdomain) && (
                      <p className="mt-1 text-xs text-red-500">{validateSlug(formData.subdomain)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dominio personalizado</label>
                    <input type="text" value={formData.custom_domain} onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" placeholder="www.mitienda.com" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">SEO y Analytics</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título Meta (SEO)</label>
                    <input type="text" value={formData.meta_title} onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" maxLength={60} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción Meta (SEO)</label>
                    <textarea value={formData.meta_description} onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" maxLength={160} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google Analytics ID</label>
                    <input type="text" value={formData.google_analytics_id} onChange={(e) => setFormData({ ...formData, google_analytics_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" placeholder="G-XXXXXXXXXX" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB: CONTACTO Y SEDES */}
        {activeTab === 'contact' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Datos de Contacto</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Oficial de la Tienda</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" placeholder="hola@mitienda.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de WhatsApp</label>
                    <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" placeholder="51999999999" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sedes y Locales</h3>
                  <button type="button" onClick={() => setFormData({ ...formData, theme_config: { ...formData.theme_config, branches: [...(formData.theme_config?.branches || []), { id: Date.now().toString(), name: '', address: '' }] }})} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                    <PlusIcon className="w-4 h-4" /> Añadir Sede
                  </button>
                </div>
                
                {(!formData.theme_config?.branches || formData.theme_config.branches.length === 0) ? (
                   <p className="text-sm text-gray-400 italic text-center py-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">No has añadido ninguna sede fisica aun.</p>
                ) : (
                  <div className="space-y-4">
                    {formData.theme_config.branches.map((branch, index) => (
                      <div key={branch.id} className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-[#1E2230] rounded-lg">
                        <div className="flex-1 space-y-3">
                          <input type="text" value={branch.name} onChange={(e) => { const newBranches = [...formData.theme_config.branches]; newBranches[index].name = e.target.value; setFormData({ ...formData, theme_config: { ...formData.theme_config, branches: newBranches } }); }} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-sm" placeholder="Nombre (Ej: Sede Miraflores)" />
                          <input type="text" value={branch.address} onChange={(e) => { const newBranches = [...formData.theme_config.branches]; newBranches[index].address = e.target.value; setFormData({ ...formData, theme_config: { ...formData.theme_config, branches: newBranches } }); }} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-sm" placeholder="Dirección Completa" />
                        </div>
                        <button type="button" onClick={() => { const newBranches = formData.theme_config.branches.filter((_, i) => i !== index); setFormData({ ...formData, theme_config: { ...formData.theme_config, branches: newBranches } }); }} className="p-2 text-gray-400 hover:text-red-500">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        )}

        {/* TAB: SOCIAL */}
        {activeTab === 'social' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Redes Sociales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="url" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-sm" placeholder="Facebook URL" />
                <input type="url" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-sm" placeholder="Instagram URL" />
                <input type="url" value={formData.tiktok} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-sm" placeholder="TikTok URL" />
                <input type="url" value={formData.theme_config?.twitter || ''} onChange={(e) => setFormData({ ...formData, theme_config: { ...formData.theme_config, twitter: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-sm" placeholder="Twitter URL" />
                <input type="url" value={formData.theme_config?.youtube || ''} onChange={(e) => setFormData({ ...formData, theme_config: { ...formData.theme_config, youtube: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-sm" placeholder="YouTube URL" />
              </div>
            </div>
          </form>
        )}

        {/* TAB: PÁGINAS (EMPRESA) */}
        {activeTab === 'pages' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Página de Empresa (Sobre Nosotros)</h3>
              <p className="text-sm text-gray-500 mb-6">
                Escribe aquí la historia de tu tienda, tu visión y detalles corporativos. Puedes usar etiquetas HTML básicas como &lt;b&gt;, &lt;i&gt;, o &lt;br&gt; para dar formato. El sistema sanitizará automáticamente el código malicioso.
              </p>
              
              <div className="space-y-4">
                <textarea
                  value={formData.theme_config?.about_us || ''}
                  onChange={(e) => setFormData({ 
                     ...formData, 
                     theme_config: { ...formData.theme_config, about_us: e.target.value } 
                  })}
                  rows={15}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono text-sm leading-relaxed"
                  placeholder="<h2>Nuestra Historia</h2>&#10;<p>Somos una marca dedicada a...</p>"
                />
              </div>
            </div>
          </form>
        )}

        {/* TAB: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-6">
            <PaymentMethods />
          </div>
        )}

        {/* TAB: SHIPPING */}
        {activeTab === 'shipping' && (
          <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 p-6">
            <ShippingMethods />
          </div>
        )}

        {/* Botón Guardar Flotante */}
        {['general', 'pages', 'domain', 'contact', 'social'].includes(activeTab) && (
          <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-[#232834]">
            <button onClick={handleSubmit} type="button" disabled={isSaving} className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default StoreSettingsPage;

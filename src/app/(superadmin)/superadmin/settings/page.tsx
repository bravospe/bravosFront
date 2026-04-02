'use client';

import { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon,
  ChatBubbleBottomCenterTextIcon,
  BellAlertIcon,
  ClockIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Input, LaserLoader, Badge } from '@/components/ui';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('automation');
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings');
      setSettings(data);
      setLoading(false);
    } catch (error) {
      toast.error('Error al cargar configuraciones');
    }
  };

  const getSettingValue = (group: string, key: string) => {
    if (!settings || !settings[group]) return null;
    const setting = settings[group].find((s: any) => s.key === key);
    if (!setting) return null;
    
    // Si es booleano guardado como string, castear
    if (setting.type === 'boolean') {
      return setting.value === 'true' || setting.value === true || setting.value === '1';
    }
    
    // Si es JSON guardado como string
    if (setting.type === 'json' && typeof setting.value === 'string') {
      try {
        return JSON.parse(setting.value);
      } catch (e) {
        return [];
      }
    }
    
    return setting.value;
  };

  const handleSave = async (group: string, updatedSettings: any[]) => {
    setSaving(true);
    try {
      await api.put('/admin/settings', { settings: updatedSettings });
      toast.success('Configuraciones guardadas');
      fetchSettings();
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LaserLoader /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajustes del Sistema</h1>
        <p className="text-gray-500 dark:text-gray-400">Configura las reglas globales y automatizaciones de la plataforma</p>
      </div>

      <div className="flex gap-4 border-b border-gray-100 dark:border-[#232834]">
        <button 
          onClick={() => setActiveTab('automation')}
          className={clsx(
            "pb-4 px-2 text-sm font-bold transition-colors relative",
            activeTab === 'automation' ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <div className="flex items-center gap-2">
            <BellAlertIcon className="w-4 h-4" />
            Automatización WhatsApp
          </div>
          {activeTab === 'automation' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600" />}
        </button>
      </div>

      {activeTab === 'automation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-none bg-white dark:bg-[#0D1117]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Alertas de Vencimiento</h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const updated = [
                  { 
                    key: 'whatsapp_alerts_enabled', 
                    value: form.enabled.checked ? 'true' : 'false', 
                    group: 'automation', 
                    type: 'boolean' 
                  },
                  { 
                    key: 'membership_expiry_days', 
                    value: JSON.stringify(form.days.value.split(',').map((d:string) => parseInt(d.trim()))), 
                    group: 'automation', 
                    type: 'json' 
                  },
                  { 
                    key: 'membership_expiry_message', 
                    value: form.message.value, 
                    group: 'automation', 
                    type: 'string' 
                  }
                ];
                handleSave('automation', updated);
              }} className="space-y-6">
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/40 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                      <DevicePhoneMobileIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Activar Alertas por WhatsApp</p>
                      <p className="text-xs text-gray-500">Enviar mensajes automáticos antes de vencer</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    name="enabled"
                    defaultChecked={getSettingValue('automation', 'whatsapp_alerts_enabled')}
                    className="w-10 h-5 rounded-full text-emerald-600 focus:ring-emerald-500" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Días de antelación</label>
                  <Input 
                    name="days"
                    placeholder="Ej: 7, 3, 1" 
                    defaultValue={Array.isArray(getSettingValue('automation', 'membership_expiry_days')) ? getSettingValue('automation', 'membership_expiry_days').join(', ') : '7, 3, 1'}
                  />
                  <p className="text-[10px] text-gray-500">Separados por comas. Se enviará una alerta en cada uno de estos días.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Mensaje Personalizado</label>
                  <textarea 
                    name="message"
                    rows={4}
                    className="w-full bg-white dark:bg-[#1E2230] border border-gray-200 dark:border-[#232834] rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500"
                    defaultValue={getSettingValue('automation', 'membership_expiry_message')}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" size="xs">{"{owner_name}"}</Badge>
                    <Badge variant="secondary" size="xs">{"{company_name}"}</Badge>
                    <Badge variant="secondary" size="xs">{"{plan_name}"}</Badge>
                    <Badge variant="secondary" size="xs">{"{days}"}</Badge>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="primary" className="bg-emerald-600 border-none" loading={saving}>
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-none bg-emerald-600 text-white">
              <h4 className="font-black text-lg mb-2">Estado del Bot</h4>
              <p className="text-sm text-emerald-100 mb-4">El motor de automatización revisa las suscripciones todos los días a las 8:00 AM.</p>
              <div className="flex items-center gap-2 text-xs font-bold bg-emerald-700/50 p-3 rounded-xl">
                <CheckCircleIcon className="w-4 h-4" />
                Tarea Programada: ACTIVA
              </div>
            </Card>

            <Card className="p-6 border-none bg-white dark:bg-[#0D1117] space-y-4">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ClockIcon className="w-4 h-4" /> Próxima Ejecución
              </h4>
              <p className="text-2xl font-black text-emerald-600">Mañana 08:00</p>
              <p className="text-xs text-gray-500">Se procesarán todas las empresas que vencen en los días configurados.</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

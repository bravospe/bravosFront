'use client';

import { useEffect, useState } from 'react';
import { 
  PhotoIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ViewColumnsIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Spinner, Modal } from '@/components/ui';
import { useVirtualStoreStore } from '@/stores/virtualStoreStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---
interface ThemeLayoutBlock {
  id: string;
  type: 'hero_banner' | 'product_grid' | 'rich_text' | 'image_with_text';
  settings: any;
}

interface ThemeConfig {
  theme_name: string;
  version: string;
  settings: {
    typography: { font_family_base: string; };
    ui_elements: { button_radius: string; card_radius: string; };
  };
  layout: {
    header: { style: string; sticky: boolean; };
    home_page: { blocks: ThemeLayoutBlock[]; };
    plp: { show_sidebar: boolean; product_grid_columns_desktop: number; };
    pdp: { gallery_layout: 'thumbnails_left' | 'thumbnails_bottom' | 'stacked'; };
  };
}

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  theme_name: "Basic",
  version: "1.0.0",
  settings: {
    typography: { font_family_base: "'Inter', sans-serif" },
    ui_elements: { button_radius: "4px", card_radius: "8px" }
  },
  layout: {
    header: { style: "center_logo", sticky: true },
    home_page: {
      blocks: [
        {
          id: "hero_1",
          type: "hero_banner",
          settings: { show: true, title: "Bienvenidos a nuestra tienda", height: "600px", button_text: "Ver catálogo" }
        },
        {
          id: "featured_products_1",
          type: "product_grid",
          settings: { title: "Nuevos Ingresos", columns_desktop: 4, limit: 8 }
        }
      ]
    },
    plp: { show_sidebar: true, product_grid_columns_desktop: 3 },
    pdp: { gallery_layout: 'thumbnails_left' }
  }
};

const BLOCK_DEFINITIONS = {
  hero_banner: { name: 'Banner Principal', icon: PhotoIcon, defaultSettings: { show: true, title: 'Nuevo Banner', height: '600px', button_text: 'Comprar ahora', overlay_opacity: 0.3 } },
  product_grid: { name: 'Grilla de Productos', icon: Squares2X2Icon, defaultSettings: { title: 'Productos Destacados', columns_desktop: 4, limit: 8 } },
  rich_text: { name: 'Texto Enriquecido', icon: Bars3BottomLeftIcon, defaultSettings: { title: 'Nuestra Historia', content: 'Escribe algo aquí...', alignment: 'center' } },
  image_with_text: { name: 'Imagen con Texto', icon: ArrowsRightLeftIcon, defaultSettings: { title: 'Promoción', text: 'Detalles de la promo', layout: 'image_left' } },
};

// --- Sortable Item Component ---
function SortableBlock({ 
  block, 
  isExpanded, 
  onToggleExpand, 
  onDelete, 
  onUpdate 
}: { 
  block: ThemeLayoutBlock; 
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onUpdate: (newSettings: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const BlockIcon = BLOCK_DEFINITIONS[block.type].icon;
  const blockName = BLOCK_DEFINITIONS[block.type].name;

  return (
    <div ref={setNodeRef} style={style} className={clsx("mb-3 border rounded-xl bg-white dark:bg-[#1a1a1a] shadow-sm overflow-hidden", isDragging && "shadow-lg ring-2 ring-emerald-500 opacity-80", !isExpanded && "hover:border-gray-300 dark:hover:border-gray-600 border-gray-200 dark:border-gray-800", isExpanded && "border-emerald-500/50 dark:border-emerald-500/50")}>
      {/* Header / Drag Handle */}
      <div className="flex items-center p-3 gap-3">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-emerald-500 text-gray-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 touch-none flex items-center justify-center">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
        </div>
        
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={onToggleExpand}>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <BlockIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{blockName}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-xs">
              {block.settings.title || block.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
          <button onClick={onToggleExpand} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {block.type === 'hero_banner' && (
            <>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Banner</label>
                <input 
                  type="text" 
                  value={block.settings.title || ''} 
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Altura (CSS)</label>
                <select 
                  value={block.settings.height || '600px'} 
                  onChange={(e) => onUpdate({ height: e.target.value })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="400px">Pequeño (400px)</option>
                  <option value="600px">Mediano (600px)</option>
                  <option value="800px">Grande (800px)</option>
                  <option value="100vh">Pantalla Completa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Texto del Botón</label>
                <input 
                  type="text" 
                  value={block.settings.button_text || ''} 
                  onChange={(e) => onUpdate({ button_text: e.target.value })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" 
                />
              </div>
            </>
          )}

          {block.type === 'product_grid' && (
            <>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Título de la Sección</label>
                <input 
                  type="text" 
                  value={block.settings.title || ''} 
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Columnas (Desktop)</label>
                <select 
                  value={block.settings.columns_desktop || 4} 
                  onChange={(e) => onUpdate({ columns_desktop: Number(e.target.value) })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value={2}>2 Columnas</option>
                  <option value={3}>3 Columnas</option>
                  <option value={4}>4 Columnas</option>
                  <option value={5}>5 Columnas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Límite de Productos</label>
                <input 
                  type="number" 
                  value={block.settings.limit || 8} 
                  onChange={(e) => onUpdate({ limit: Number(e.target.value) })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" 
                />
              </div>
            </>
          )}

          {block.type === 'rich_text' && (
            <>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                <input 
                  type="text" 
                  value={block.settings.title || ''} 
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Contenido (HTML/Texto)</label>
                <textarea 
                  rows={3}
                  value={block.settings.content || ''} 
                  onChange={(e) => onUpdate({ content: e.target.value })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Alineación</label>
                <select 
                  value={block.settings.alignment || 'center'} 
                  onChange={(e) => onUpdate({ alignment: e.target.value })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="left">Izquierda</option>
                  <option value="center">Centrado</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
            </>
          )}

          {block.type === 'image_with_text' && (
            <>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                <input 
                  type="text" 
                  value={block.settings.title || ''} 
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Texto Descriptivo</label>
                <textarea 
                  rows={2}
                  value={block.settings.text || ''} 
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Layout</label>
                <select 
                  value={block.settings.layout || 'image_left'} 
                  onChange={(e) => onUpdate({ layout: e.target.value })}
                  className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="image_left">Imagen a la Izquierda</option>
                  <option value="image_right">Imagen a la Derecha</option>
                </select>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}

// --- Main Page ---
export default function StoreAppearancePage() {
  const { currentCompany } = useAuthStore();
  const { settings, fetchSettings, updateSettings, isLoadingSettings } = useVirtualStoreStore();

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [addBlockModalOpen, setAddBlockModalOpen] = useState(false);
  
  // Tabs: 'theme' | 'home' | 'plp' | 'pdp'
  const [activeTab, setActiveTab] = useState<'theme' | 'home' | 'plp' | 'pdp'>('theme');

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (currentCompany?.id) {
      fetchSettings(currentCompany.id);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    if (settings?.theme_config) {
      setThemeConfig({
        ...DEFAULT_THEME_CONFIG,
        ...(settings.theme_config as any),
        layout: {
          ...DEFAULT_THEME_CONFIG.layout,
          ...((settings.theme_config as any)?.layout || {}),
          home_page: {
            ...DEFAULT_THEME_CONFIG.layout.home_page,
            ...((settings.theme_config as any)?.layout?.home_page || {})
          },
          plp: {
            ...DEFAULT_THEME_CONFIG.layout.plp,
            ...((settings.theme_config as any)?.layout?.plp || {})
          },
          pdp: {
            ...DEFAULT_THEME_CONFIG.layout.pdp,
            ...((settings.theme_config as any)?.layout?.pdp || {})
          }
        }
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!currentCompany?.id || !settings) return;
    setIsSaving(true);
    try {
      // Backend validation requires name and slug, so we pass them explicitly
      await updateSettings(currentCompany.id, { 
        name: settings.name,
        slug: settings.slug,
        subdomain: settings.subdomain,
        theme_config: themeConfig 
      });
      toast.success('Diseño guardado correctamente');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Error al guardar el diseño';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setThemeConfig((prev) => {
        const blocks = [...prev.layout.home_page.blocks];
        const oldIndex = blocks.findIndex((item) => item.id === active.id);
        const newIndex = blocks.findIndex((item) => item.id === over.id);
        return {
          ...prev,
          layout: {
            ...prev.layout,
            home_page: { blocks: arrayMove(blocks, oldIndex, newIndex) }
          }
        };
      });
    }
  };

  const addBlock = (type: keyof typeof BLOCK_DEFINITIONS) => {
    const newId = `${type}_${Date.now()}`;
    const newBlock: ThemeLayoutBlock = {
      id: newId,
      type,
      settings: { ...BLOCK_DEFINITIONS[type].defaultSettings }
    };
    
    setThemeConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        home_page: { blocks: [...prev.layout.home_page.blocks, newBlock] }
      }
    }));
    setAddBlockModalOpen(false);
    setExpandedBlockId(newId);
    toast.success('Sección añadida');
  };

  const deleteBlock = (id: string) => {
    setThemeConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        home_page: { blocks: prev.layout.home_page.blocks.filter(b => b.id !== id) }
      }
    }));
    toast.success('Sección eliminada');
  };

  const updateBlockSettings = (id: string, newSettings: any) => {
    setThemeConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        home_page: {
          blocks: prev.layout.home_page.blocks.map(b => 
            b.id === id ? { ...b, settings: { ...b.settings, ...newSettings } } : b
          )
        }
      }
    }));
  };

  if (isLoadingSettings && !settings) {
    return <div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>;
  }

  const blocks = themeConfig.layout.home_page.blocks;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Sticky */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-black p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personaliza tu Tienda</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Diseña y organiza las páginas de tu tienda en línea.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
            {isSaving ? <Spinner size="sm" className="mr-2" /> : <CheckCircleIcon className="w-4 h-4 mr-2" />}
            {isSaving ? 'Guardando...' : 'Guardar Diseño'}
          </Button>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div className="flex space-x-1 bg-black p-1 rounded-lg w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('theme')}
          className={clsx(
            "flex-1 py-2.5 px-4 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all",
            activeTab === 'theme' 
              ? "bg-[#00e599] text-black shadow-sm font-bold" 
              : "bg-black text-gray-400 hover:text-white hover:bg-gray-900"
          )}
        >
          <PaintBrushIcon className="w-4 h-4" />
          Tema
        </button>
        <button
          onClick={() => setActiveTab('home')}
          className={clsx(
            "flex-1 py-2.5 px-4 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all",
            activeTab === 'home' 
              ? "bg-[#00e599] text-black shadow-sm font-bold" 
              : "bg-black text-gray-400 hover:text-white hover:bg-gray-900"
          )}
        >
          <PhotoIcon className="w-4 h-4" />
          Inicio
        </button>
        <button
          onClick={() => setActiveTab('plp')}
          className={clsx(
            "flex-1 py-2.5 px-4 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all",
            activeTab === 'plp' 
              ? "bg-[#00e599] text-black shadow-sm font-bold" 
              : "bg-black text-gray-400 hover:text-white hover:bg-gray-900"
          )}
        >
          <Squares2X2Icon className="w-4 h-4" />
          Productos
        </button>
        <button
          onClick={() => setActiveTab('pdp')}
          className={clsx(
            "flex-1 py-2.5 px-4 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all",
            activeTab === 'pdp' 
              ? "bg-[#00e599] text-black shadow-sm font-bold" 
              : "bg-black text-gray-400 hover:text-white hover:bg-gray-900"
          )}
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          Detalle
        </button>
      </div>

      {/* Main Builder Area */}
      <div className="bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 min-h-[500px]">
        
        {/* --- PESTAÑA: TEMA (THEME) --- */}
        {activeTab === 'theme' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Tema Activo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Selecciona el tema principal para tu tienda (próximamente más temas).</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="overflow-hidden ring-2 ring-emerald-500 shadow-lg relative cursor-default border-0">
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
                    <CheckCircleIcon className="w-3 h-3" /> Activo
                  </div>
                  <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 relative overflow-hidden">
                     {/* Abstract representation of Evershop theme */}
                     <div className="absolute inset-0 p-4 flex flex-col gap-2 opacity-50">
                        <div className="h-6 w-full bg-white dark:bg-gray-900 rounded shadow-sm flex items-center px-2 justify-between">
                           <div className="w-16 h-2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                           <div className="flex gap-1"><div className="w-4 h-2 bg-gray-300 dark:bg-gray-700 rounded"></div><div className="w-4 h-2 bg-gray-300 dark:bg-gray-700 rounded"></div></div>
                        </div>
                        <div className="flex-1 w-full bg-white dark:bg-gray-900 rounded shadow-sm flex items-center justify-center">
                           <div className="w-24 h-6 bg-gray-200 dark:bg-gray-800 rounded"></div>
                        </div>
                        <div className="h-20 w-full flex gap-2">
                           <div className="flex-1 bg-white dark:bg-gray-900 rounded shadow-sm"></div>
                           <div className="flex-1 bg-white dark:bg-gray-900 rounded shadow-sm"></div>
                           <div className="flex-1 bg-white dark:bg-gray-900 rounded shadow-sm"></div>
                        </div>
                     </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-[#1a1a1a]">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Basic (Evershop Clone)</h4>
                    <p className="text-sm text-gray-500 mt-1">Tema oficial estructurado en bloques, optimizado para conversión y velocidad extrema.</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA: HOME --- */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {/* Global Layout Toggles (Header) */}
            <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
               <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Cabecera de la tienda</h3>
               <div className="flex flex-wrap gap-6 items-end">
                  <div className="w-full sm:w-64">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Alineación del Logo</label>
                    <select 
                        value={themeConfig.layout.header.style}
                        onChange={(e) => setThemeConfig({...themeConfig, layout: {...themeConfig.layout, header: {...themeConfig.layout.header, style: e.target.value}}})}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] text-sm py-2"
                    >
                      <option value="left_logo">Alineado a la Izquierda</option>
                      <option value="center_logo">Logo Centrado</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      id="sticky_header"
                      checked={themeConfig.layout.header.sticky}
                      onChange={(e) => setThemeConfig({...themeConfig, layout: {...themeConfig.layout, header: {...themeConfig.layout.header, sticky: e.target.checked}}})}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="sticky_header" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Cabecera flotante (Sticky Header)</label>
                  </div>
               </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
               <ViewColumnsIcon className="w-4 h-4 text-emerald-500" />
               Bloques de Contenido
            </h3>

            {/* Drag and Drop Context */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {blocks.map((block) => (
                    <SortableBlock 
                      key={block.id} 
                      block={block} 
                      isExpanded={expandedBlockId === block.id}
                      onToggleExpand={() => setExpandedBlockId(expandedBlockId === block.id ? null : block.id)}
                      onDelete={() => deleteBlock(block.id)}
                      onUpdate={(newSettings) => updateBlockSettings(block.id, newSettings)}
                    />
                  ))}
                  
                  {blocks.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                       <ViewColumnsIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                       <h3 className="text-gray-500 dark:text-gray-400 font-medium">No hay secciones en tu página</h3>
                       <p className="text-xs text-gray-400 mt-1 mb-4">Añade tu primera sección para empezar a construir tu tienda.</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Block Button */}
            <div className="mt-6 flex justify-center">
              <Button 
                variant="secondary" 
                onClick={() => setAddBlockModalOpen(true)}
                className="w-full max-w-sm border-dashed border-2 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 bg-transparent py-3"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Añadir Nueva Sección
              </Button>
            </div>
          </div>
        )}

        {/* --- PESTAÑA: LISTA DE PRODUCTOS (PLP) --- */}
        {activeTab === 'plp' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Página de Categorías / Listado</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Configura cómo se muestran los productos en las búsquedas y categorías.</p>

              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-6">
                
                {/* Opciones */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Sidebar de Filtros</h4>
                    <p className="text-xs text-gray-500">Muestra los filtros (precio, marca, categorías) al lado izquierdo.</p>
                  </div>
                  <button
                    onClick={() => setThemeConfig({...themeConfig, layout: {...themeConfig.layout, plp: {...themeConfig.layout.plp, show_sidebar: !themeConfig.layout.plp.show_sidebar}}})}
                    className={clsx(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      themeConfig.layout.plp.show_sidebar ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <span className={clsx(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      themeConfig.layout.plp.show_sidebar ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Columnas de Productos (Desktop)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[3, 4, 5].map((cols) => (
                      <button
                        key={cols}
                        onClick={() => setThemeConfig({...themeConfig, layout: {...themeConfig.layout, plp: {...themeConfig.layout.plp, product_grid_columns_desktop: cols}}})}
                        className={clsx(
                          "py-3 border rounded-lg flex flex-col items-center gap-2 transition-all",
                          themeConfig.layout.plp.product_grid_columns_desktop === cols 
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <div className="flex gap-1">
                          {Array.from({length: cols}).map((_, i) => (
                            <div key={i} className="w-2 h-6 bg-current rounded-sm opacity-50"></div>
                          ))}
                        </div>
                        <span className="text-xs font-medium">{cols} Columnas</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA: DETALLE DEL PRODUCTO (PDP) --- */}
        {activeTab === 'pdp' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Detalle del Producto</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Configura cómo se presenta la página individual de cada producto.</p>

              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-6">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Disposición de la Galería de Imágenes</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Option: Thumbnails Left */}
                    <button
                      onClick={() => setThemeConfig({...themeConfig, layout: {...themeConfig.layout, pdp: {...themeConfig.layout.pdp, gallery_layout: 'thumbnails_left'}}})}
                      className={clsx(
                        "p-4 border rounded-xl flex flex-col gap-3 transition-all text-left relative",
                        themeConfig.layout.pdp.gallery_layout === 'thumbnails_left'
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 ring-1 ring-emerald-500" 
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                    >
                      <div className="flex gap-2 h-24 w-full opacity-60">
                         {/* Thumbnails */}
                         <div className="w-1/4 flex flex-col gap-1">
                           <div className="bg-gray-400 dark:bg-gray-600 rounded flex-1"></div>
                           <div className="bg-gray-300 dark:bg-gray-700 rounded flex-1"></div>
                           <div className="bg-gray-300 dark:bg-gray-700 rounded flex-1"></div>
                         </div>
                         {/* Main image */}
                         <div className="flex-1 bg-gray-400 dark:bg-gray-600 rounded"></div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Miniaturas a la Izquierda</h4>
                        <p className="text-xs text-gray-500 mt-1">Estilo clásico de tienda.</p>
                      </div>
                    </button>

                    {/* Option: Thumbnails Bottom */}
                    <button
                      onClick={() => setThemeConfig({...themeConfig, layout: {...themeConfig.layout, pdp: {...themeConfig.layout.pdp, gallery_layout: 'thumbnails_bottom'}}})}
                      className={clsx(
                        "p-4 border rounded-xl flex flex-col gap-3 transition-all text-left relative",
                        themeConfig.layout.pdp.gallery_layout === 'thumbnails_bottom'
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 ring-1 ring-emerald-500" 
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                    >
                      <div className="flex flex-col gap-2 h-24 w-full opacity-60">
                         {/* Main image */}
                         <div className="flex-[3] bg-gray-400 dark:bg-gray-600 rounded"></div>
                         {/* Thumbnails */}
                         <div className="flex-1 flex gap-1">
                           <div className="bg-gray-400 dark:bg-gray-600 rounded flex-1"></div>
                           <div className="bg-gray-300 dark:bg-gray-700 rounded flex-1"></div>
                           <div className="bg-gray-300 dark:bg-gray-700 rounded flex-1"></div>
                           <div className="bg-gray-300 dark:bg-gray-700 rounded flex-1"></div>
                         </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Miniaturas Abajo</h4>
                        <p className="text-xs text-gray-500 mt-1">Imágenes más grandes.</p>
                      </div>
                    </button>

                    {/* Option: Stacked */}
                    <button
                      onClick={() => setThemeConfig({...themeConfig, layout: {...themeConfig.layout, pdp: {...themeConfig.layout.pdp, gallery_layout: 'stacked'}}})}
                      className={clsx(
                        "p-4 border rounded-xl flex flex-col gap-3 transition-all text-left relative",
                        themeConfig.layout.pdp.gallery_layout === 'stacked'
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 ring-1 ring-emerald-500" 
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                    >
                      <div className="flex flex-col gap-1 h-24 w-full opacity-60 overflow-hidden">
                         <div className="flex-[2] bg-gray-400 dark:bg-gray-600 rounded shrink-0"></div>
                         <div className="flex-[2] bg-gray-300 dark:bg-gray-700 rounded shrink-0"></div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Imágenes Apiladas</h4>
                        <p className="text-xs text-gray-500 mt-1">Scroll vertical infinito, ideal para moda.</p>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* Add Block Modal */}
      <Modal isOpen={addBlockModalOpen} onClose={() => setAddBlockModalOpen(false)} title="Añadir Sección">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
          {Object.entries(BLOCK_DEFINITIONS).map(([type, def]) => (
            <button
              key={type}
              onClick={() => addBlock(type as keyof typeof BLOCK_DEFINITIONS)}
              className="flex items-start gap-3 p-4 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors group"
            >
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 transition-colors">
                 <def.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{def.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">Añade un bloque de {def.name.toLowerCase()} a tu página principal.</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>

    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { SunIcon, MoonIcon, ComputerDesktopIcon, CloudArrowUpIcon, TrashIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import toast from 'react-hot-toast';

const AppearancePage = () => {
    const { theme, setTheme, logo, setLogo } = useThemeStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('El archivo es muy grande. Máximo 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                try {
                    setLogo(reader.result as string);
                    toast.success('Logo actualizado');
                } catch (error) {
                    console.error('Error saving logo:', error);
                    toast.error('Error al guardar el logo. El archivo puede ser demasiado grande para el almacenamiento local.');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSettings = () => {
        toast.success('Configuración guardada correctamente');
    };

    const handleRemoveLogo = () => {
        setLogo(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.success('Logo eliminado');
    };

    const themes = [
        {
            id: 'light' as const,
            name: 'Claro',
            description: 'Para trabajar de día',
            icon: SunIcon,
        },
        {
            id: 'dark' as const,
            name: 'Oscuro',
            description: 'Menos fatiga visual',
            icon: MoonIcon,
        },
        {
            id: 'system' as const,
            name: 'Sistema',
            description: 'Ajuste automático',
            icon: ComputerDesktopIcon,
        },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apariencia</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Personaliza la apariencia de la aplicación.</p>
            </div>

            <div className="space-y-6">
                {/* Theme Section */}
                <div className="bg-white dark:bg-black shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Modo del Tema</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {themes.map((themeOption) => (
                            <button
                                key={themeOption.id}
                                onClick={() => setTheme(themeOption.id)}
                                className={clsx(
                                    'flex items-center gap-3 p-4 rounded-xl border transition-all duration-200',
                                    mounted && theme === themeOption.id
                                        ? 'border-emerald-500 bg-emerald-500/10 text-black dark:text-white ring-2 ring-emerald-500/50'
                                        : 'border-gray-200 dark:border-[#232834] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 text-gray-600 dark:text-gray-300'
                                )}
                            >
                                <div className={clsx(
                                    "p-2 rounded-lg transition-colors",
                                    mounted && theme === themeOption.id
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-100 dark:bg-[#1E2230] text-gray-500"
                                )}>
                                    <themeOption.icon className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-sm">{themeOption.name}</p>
                                    <p className="text-xs opacity-70">{themeOption.description}</p>
                                </div>
                                {mounted && theme === themeOption.id && (
                                    <div className="ml-auto">
                                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white font-bold" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Info about system theme */}
                    {mounted && theme === 'system' && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-[#1E2230]/50 rounded-lg border-l-4 border-emerald-500">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                El tema se ajustará automáticamente según la preferencia de tu sistema operativo.
                            </p>
                        </div>
                    )}
                </div>

                {/* Logo Section */}
                <div className="bg-white dark:bg-black shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Logo de la Empresa</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Sube el logo de tu marca para personalizar los documentos y el menú.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className={clsx(
                                "w-24 h-24 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-colors",
                                mounted && logo
                                    ? "border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117]"
                                    : "border-dashed border-gray-300 dark:border-[#232834] bg-gray-50 dark:bg-[#0D1117]"
                            )}>
                                {mounted && logo ? (
                                    <ImageWithFallback src={logo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <CloudArrowUpIcon className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            {mounted && logo && (
                                <button
                                    onClick={handleRemoveLogo}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-sm transition-colors"
                                    title="Eliminar logo"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex gap-3">
                                <Button
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                                    {mounted && logo ? 'Cambiar Logo' : 'Subir Logo'}
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/svg+xml"
                                    onChange={handleLogoUpload}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Formatos permitidos: PNG, JPG, SVG. Tamaño máximo: 2MB.
                            </p>
                            {mounted && logo && (
                                <p className="text-xs text-emerald-600 font-medium mt-1">
                                    ✓ Logo guardado correctamente
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-[#232834]">
                    <Button
                        onClick={handleSaveSettings}
                        className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                        Guardar Preferencias
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AppearancePage;

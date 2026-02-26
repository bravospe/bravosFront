/**
 * UnifiedTemplateProvider.tsx
 * Orquestador principal que une el ThemeEngine (Diseño) con el PageBuilder (Contenido).
 */

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo,
    useCallback
} from 'react';
import { ThemeEngine, ThemeDefinition } from './ThemeEngine';
import { UnifiedTemplate, PageBlock, PageConfig } from './UnifiedTemplate';

interface UnifiedTemplateContextType {
    // Estado completo
    template: UnifiedTemplate;

    // Motor visual (para acceso avanzado o directo)
    themeEngine: ThemeEngine;

    // Acciones de Template General
    setTemplate: (template: UnifiedTemplate) => void;
    saveTemplate: () => string; // Retorna JSON string

    // Acciones de Diseño (ThemeEngine proxies)
    updateDesignToken: (path: string, value: string) => void;

    // Acciones de Contenido (PageBuilder)
    updatePageBlock: (pageId: string, blockId: string, updates: Partial<PageBlock>) => void;
    addPageBlock: (pageId: string, block: PageBlock) => void;
    removePageBlock: (pageId: string, blockId: string) => void;
    movePageBlock: (pageId: string, blockId: string, newIndex: number) => void;

    // Estado de carga
    isLoading: boolean;
}

const UnifiedTemplateContext = createContext<UnifiedTemplateContextType | null>(null);

interface ProviderProps {
    children: React.ReactNode;
    initialTemplate: UnifiedTemplate;
    onAutoSave?: (template: UnifiedTemplate) => void;
}

export function UnifiedTemplateProvider({
    children,
    initialTemplate,
    onAutoSave
}: ProviderProps) {
    const [template, setTemplateState] = useState<UnifiedTemplate>(initialTemplate);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Instanciar ThemeEngine
    // Solo recreamos el engine si cambia la parte de 'designSystem' o la identidad del template.
    const themeEngine = useMemo(() => {
        // Aseguramos que el designSystem tenga los metadatos necesarios
        const themeDef: ThemeDefinition = {
            ...template.designSystem,
            id: template.id,
            name: template.name,
            author: template.author
        };
        return new ThemeEngine(themeDef);
    }, [template.designSystem, template.id, template.name, template.author]);

    // 2. Efecto: Aplicar estilos cuando cambia el engine
    useEffect(() => {
        // Esto inyecta las variables CSS y carga las fuentes
        themeEngine.applyTheme();
        themeEngine.loadFonts();
    }, [themeEngine]);

    // 3. Setter con AutoSave opcional
    const setTemplate = useCallback((newTemplate: UnifiedTemplate) => {
        setTemplateState(newTemplate);
        if (onAutoSave) {
            onAutoSave(newTemplate);
        }
    }, [onAutoSave]);

    // --- Helpers de Diseño ---

    const updateDesignToken = useCallback((path: string, value: string) => {
        setTemplateState(prev => {
            // Nota: Esta es una implementación simplificada. 
            // Para producción, idealmente usaríamos una librería como 'immer' o 'lodash.set'
            // para actualizaciones profundas seguras.
            const newTemplate = JSON.parse(JSON.stringify(prev));
            const parts = path.split('.');
            let current = newTemplate.designSystem.tokens;

            for (let i = 0; i < parts.length - 1; i++) {
                // Manejo básico de estructura
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }

            current[parts[parts.length - 1]] = value;
            return newTemplate;
        });
    }, []);

    // --- Helpers de Contenido (Blocks) ---

    const updatePageBlock = useCallback((pageId: string, blockId: string, updates: Partial<PageBlock>) => {
        setTemplateState(prev => {
            const page = prev.pages[pageId];
            if (!page) return prev;

            const newBlocks = page.blocks.map(b =>
                b.id === blockId ? { ...b, ...updates } : b
            );

            return {
                ...prev,
                pages: {
                    ...prev.pages,
                    [pageId]: { ...page, blocks: newBlocks }
                }
            };
        });
    }, []);

    const addPageBlock = useCallback((pageId: string, block: PageBlock) => {
        setTemplateState(prev => {
            const page = prev.pages[pageId];
            if (!page) return prev;

            return {
                ...prev,
                pages: {
                    ...prev.pages,
                    [pageId]: { ...page, blocks: [...page.blocks, block] }
                }
            };
        });
    }, []);

    const removePageBlock = useCallback((pageId: string, blockId: string) => {
        setTemplateState(prev => {
            const page = prev.pages[pageId];
            if (!page) return prev;

            return {
                ...prev,
                pages: {
                    ...prev.pages,
                    [pageId]: { ...page, blocks: page.blocks.filter(b => b.id !== blockId) }
                }
            };
        });
    }, []);

    const movePageBlock = useCallback((pageId: string, blockId: string, newIndex: number) => {
        setTemplateState(prev => {
            const page = prev.pages[pageId];
            if (!page) return prev;

            const blocks = [...page.blocks];
            const oldIndex = blocks.findIndex(b => b.id === blockId);

            if (oldIndex === -1) return prev;

            const [item] = blocks.splice(oldIndex, 1);
            blocks.splice(newIndex, 0, item);

            // Actualizar orden
            const reorderedBlocks = blocks.map((b, idx) => ({ ...b, order: idx }));

            return {
                ...prev,
                pages: {
                    ...prev.pages,
                    [pageId]: { ...page, blocks: reorderedBlocks }
                }
            };
        });
    }, []);

    const saveTemplate = useCallback(() => {
        return JSON.stringify(template, null, 2);
    }, [template]);

    const value = useMemo(() => ({
        template,
        themeEngine,
        setTemplate,
        saveTemplate,
        updateDesignToken,
        updatePageBlock,
        addPageBlock,
        removePageBlock,
        movePageBlock,
        isLoading
    }), [
        template,
        themeEngine,
        setTemplate,
        saveTemplate,
        updateDesignToken,
        updatePageBlock,
        addPageBlock,
        removePageBlock,
        movePageBlock,
        isLoading
    ]);

    return (
        <UnifiedTemplateContext.Provider value={value}>
            {children}
        </UnifiedTemplateContext.Provider>
    );
}

// Hook de consumo
export function useUnifiedTemplate() {
    const context = useContext(UnifiedTemplateContext);
    if (!context) {
        throw new Error('useUnifiedTemplate must be used within UnifiedTemplateProvider');
    }
    return context;
}

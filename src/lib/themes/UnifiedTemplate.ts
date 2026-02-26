/**
 * UnifiedTemplate.ts
 * Integración de la estructura de contenido (Bloques/Páginas) 
 * con el motor de diseño (ThemeEngine).
 */

import { ThemeDefinition } from './ThemeEngine';

export interface UnifiedTemplate {
  // === METADATOS ===
  id: string;
  name: string;
  version: string;
  author: string;
  thumbnail?: string;
  description?: string;
  
  // === MOTOR VISUAL (ThemeEngine) ===
  // Esto mapea directamente a lo que ThemeEngine ya sabe procesar.
  // Es la fuente de la verdad para tokens, colores, tipografía y estilos base de componentes.
  designSystem: ThemeDefinition;
  
  // === ESTRUCTURA DE CONTENIDO (Page Builder) ===
  // Configuración de layouts globales o reutilizables
  layouts: {
    [key: string]: LayoutConfig;
  };
  
  // Definición de páginas y sus bloques específicos
  pages: {
    [key: string]: PageConfig;
  };
}

// --- Tipos de Soporte para Layouts y Páginas ---

export interface LayoutConfig {
  id: string;
  type: 'fixed' | 'fluid' | 'grid' | 'flex';
  
  // Configuración específica del tipo
  grid?: {
    columns: number | 'auto';
    gap: string; // Puede usar referencia de token: "spacing.4"
    responsive: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
  
  flex?: {
    direction: 'row' | 'column';
    align: string;
    justify: string;
    wrap: boolean;
  };

    // Sidebar configuration
    sidebar?: {
      enabled: boolean;
      position: 'left' | 'right';
      width: string;
      sticky: boolean;
    };
  
  // Estilos del contenedor del layout
  styles: {
    background?: string; // Típicamente referenciando "neutral.bg"
    padding?: string;
    maxWidth?: string;
    [key: string]: any;
  };
}

export interface PageConfig {
  id: string;
  path: string; // URL path, e.g., "/about"
  layoutId: string; // Referencia a una key en UnifiedTemplate.layouts
  
  // Bloques de contenido ordenados
  blocks: PageBlock[];
  
  // SEO y Metadatos
  meta: {
    title: string;
    description: string;
    ogImage?: string;
  };
}

export interface PageBlock {
  id: string;
  type: string; // id del componente en el BlockRegistry (e.g., "hero-banner-v1")
  
  // Props de contenido (texto, imágenes, links)
  props: Record<string, any>;
  
  // Overrides de estilo específicos para esta instancia
  // Estos se combinan con los estilos base del designSystem
  styleOverrides?: Record<string, any>;
  
  order: number;
  visible: boolean;
}
